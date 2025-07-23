import { NextRequest, NextResponse } from "next/server";
import { Logger } from "@/utils/logger";
import { OpenAI } from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { env } from "@/config/env";
import { GoogleGenerativeAI } from "@google/generative-ai";
const logger = new Logger("API:Chat");

const pinecone = new Pinecone({
  apiKey: env.PINECONE_API_KEY ?? '',
});

const namespace = pinecone.index("aven-rag").namespace("default");

const ai = new GoogleGenerativeAI(env.GOOGLE_API_KEY ?? '');
const embeddingModel = ai.getGenerativeModel({
  model: "gemini-embedding-001",
});

const gemini = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/" + env.GOOGLE_API_KEY,
});

export async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ message: "Not Found" }, { status: 404 });
  }

  const body = await req.json();
  try {
    const {
      model,
      messages,
      max_tokens,
      temperature,
      stream,
      call,
      ...restParams
    } = body;

    const lastMessage = messages?.[messages.length - 1];
    if (!lastMessage?.content) {
      return NextResponse.json({ error: "No content in last message" }, { status: 400 });
    }

    const query = lastMessage.content;
    logger.info("Query", { query });

    const embedding = await embeddingModel.embedContent(query);
    logger.info("Embedding", { embedding });

    const results = await namespace.query({
      vector: embedding.embedding.values,
      topK: 2,
      includeMetadata: true,
    });

    logger.info("Results", results);

    const context = results.matches?.map((match) => match.metadata?.content).join("\n");
    logger.info("Context", { context });
    const geminiPrompt = `Answer my question based on the following context: ${context}
    Question: ${query}
    Answer: `;

    const prompt = await gemini.chat.completions.create({
      messages: [
        {
          role: "user",
          content: geminiPrompt,
        },
      ],
      model: "gemini-2.0-flash-lite",
      max_tokens: 500,
      temperature: 0.7,
    });

    const modifiedContent = prompt.choices[0]?.message?.content;
    const modifiedMessages = [
      ...messages.slice(0, messages.length - 1),
      { ...lastMessage, content: modifiedContent },
    ];

    logger.info("Creating completion...", {
      stream, messagesCount: modifiedMessages.length,
    });

    if (stream) {
      const completionStream = await gemini.chat.completions.create({
        model: "gemini-2.0-flash-lite",
        messages: modifiedMessages,
        max_tokens: max_tokens || 150,
        temperature: temperature || 0.7,
        stream: true,
      } as OpenAI.Chat.ChatCompletionCreateParamsStreaming);
      // Create a readable stream for the response
      const encoder = new TextEncoder();

      const streamResponse = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of completionStream) {
              const content = chunk.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            }
            controller.close();
          } catch (err) {
            controller.error(err);
          }
        },
      });

      return new Response(streamResponse, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
        },
      });
    } else {
      const completion = await gemini.chat.completions.create({
        model: "gemini-2.0-flash-lite",
        messages: modifiedMessages,
        max_tokens: max_tokens || 150,
        temperature: temperature || 0.7,
        stream: false,
      } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming);
      return NextResponse.json(completion);
    }
  } catch (e) {
    logger.error("Error in chat completions", e);
    return NextResponse.json({ error: e }, { status: 500 });
  }
};