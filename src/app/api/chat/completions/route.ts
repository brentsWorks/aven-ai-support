import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/utils/logger";
import { OpenAI } from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { env } from "@/config/env";
const logger = new Logger("API:Chat");

const pinecone = new Pinecone({
  apiKey: env.PINECONE_API_KEY ?? "",
});

const namespace = pinecone
  .index("aven-rag", "https://aven-rag-jot4yxr.svc.aped-4627-b74a.pinecone.io")
  .namespace("aven");

export async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ message: "Not Found" }, { status: 404 });
  }

  const body = await req.json();
  try {
    const {
      messages,
      max_tokens,
      temperature,
      stream,
    } = body;

    const lastMessage = messages?.[messages.length - 1];
    if (!lastMessage?.content) {
      return NextResponse.json(
        { error: "No content in last message" },
        { status: 400 }
      );
    }

    const query = lastMessage.content;
    logger.info("Query", { query });

    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
      dimensions: 768,
    });
    const embedding = embeddingResponse.data[0]?.embedding;
    logger.info("embedding values", {
      embeddingLength: embedding?.length,
      embeddingPreview: embedding?.slice(0, 10),
    });

    const results = await namespace.query({
      vector: embedding,
      topK: 5,
      includeMetadata: true,
    });

    logger.info("Results", results);

    const context = results.matches
      ?.map(match => match.metadata?.content)
      .join("\n");
    logger.info("Context", { context });

    const openaiPrompt = `Answer my question based on the following context: ${context}

    Question: ${query}
    Answer: `;

    const prompt = await openai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: openaiPrompt,
        },
      ],
      model: "gpt-4o-mini",
      max_tokens: 500,
      temperature: 0.7,
    });

    const modifiedContent = prompt.choices[0]?.message?.content;
    const modifiedMessages = [
      ...messages.slice(0, messages.length - 1),
      { ...lastMessage, content: modifiedContent },
    ];

    logger.info("Creating completion...", {
      stream,
      messagesCount: modifiedMessages.length,
    });

    if (stream) {
      const completionStream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: modifiedMessages,
        max_tokens: max_tokens || 150,
        temperature: temperature || 0.7,
        stream: true,
      } as OpenAI.Chat.ChatCompletionCreateParamsStreaming);

      const encoder = new TextEncoder();

      const streamResponse = new ReadableStream({
        async start(controller) {
          let fullResponse = "";

          try {
            for await (const chunk of completionStream) {
              // Check if the controller is still active before writing
              if (controller.desiredSize === null) {
                // Controller is closed, exit the loop
                break;
              }

              const content = chunk.choices?.[0]?.delta?.content;
              if (content) {
                fullResponse += content;

                // Send the actual OpenAI chunk format for VAPI compatibility
                const sseData = `data: ${JSON.stringify(chunk)}\n\n`;

                try {
                  controller.enqueue(encoder.encode(sseData));
                } catch (enqueueError) {
                  // Controller already closed, break out
                  console.error("Error enqueuing chunk", enqueueError);
                  break;
                }
              }
            }

            logger.info("Generated response", { fullResponse });

            // Only close if controller is still active
            if (controller.desiredSize !== null) {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            }
          } catch (err) {
            logger.error("Streaming error", err);
            // Only send error if controller is still active
            if (controller.desiredSize !== null) {
              try {
                controller.error(err);
              } catch (error) {
                // Controller already closed, ignore
                console.error("Error closing controller", error);
              }
            }
          }
        },
      });

      return new Response(streamResponse, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } else {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Keep consistent
        messages: modifiedMessages,
        max_tokens: max_tokens || 150,
        temperature: temperature || 0.7,
        stream: false,
      } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming);
      const response = completion.choices[0]?.message?.content;

      // Log the response
      logger.info("Generated response", { response });

      return NextResponse.json(completion);
    }
  } catch (e) {
    logger.error("Error in chat completions", e);
    return NextResponse.json({ error: e }, { status: 500 });
  }
}
