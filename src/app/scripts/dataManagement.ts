"use server";

// Load environment variables when running as a script
import { config } from "dotenv";
import path from "path";

// Load .env file from project root
config({ path: path.resolve(process.cwd(), ".env") });

import FirecrawlApp from "@mendable/firecrawl-js";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAI } from "openai";
import { Logger } from "@/utils/logger";
import { normalizeAndChunk, type RAGChunk } from "@/lib/utils";

// Initialize services
const logger = new Logger("DataManagement");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const indexName = "aven-rag";

// =================================
// EMBEDDING FUNCTIONS
// =================================

/**
 * Generate embedding for a single text input
 */
export async function getEmbedding(input: string): Promise<number[] | null> {
  try {
    logger.action("getEmbedding - Started embedding", {
      inputLength: input.length,
    });
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: input,
      dimensions: 768,
    });

    const embedding = response.data[0]?.embedding;
    if (embedding) {
      logger.info("getEmbedding - Embedding successful", {
        inputLength: input.length,
        embeddingPreview: embedding.slice(0, 5),
        dimensions: embedding.length,
      });
    } else {
      logger.warn("getEmbedding - No embedding returned", {
        inputLength: input.length,
      });
    }
    return embedding ?? null;
  } catch (error) {
    logger.error("getEmbedding - Failed to get embedding", error);
    return null;
  }
}

/**
 * Generate embeddings for multiple text inputs in batch
 */
export async function getEmbeddingsBatch(
  inputs: string[]
): Promise<number[][] | null> {
  try {
    logger.action("getEmbeddingsBatch - Started batch embedding", {
      batchSize: inputs.length,
    });
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: inputs,
      dimensions: 768,
    });

    const embeddings = response.data.map(item => item.embedding);
    if (embeddings && embeddings.length > 0 && embeddings[0]) {
      logger.info("getEmbeddingsBatch - First embedding preview", {
        embeddingPreview: embeddings[0].slice(0, 5),
        dimensions: embeddings[0].length,
        batchSize: embeddings.length,
      });
    }
    return embeddings ?? null;
  } catch (error) {
    logger.error("getEmbeddingsBatch - Failed to get batch embeddings", error);
    return null;
  }
}

// =================================
// DATA FETCHING FUNCTIONS
// =================================

/**
 * Fetch and process data from Aven website using Firecrawl
 */
export async function fetchData(): Promise<RAGChunk[]> {
  try {
    logger.action("fetchData - Started Firecrawl crawling for Aven website");
    const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });

    const allChunks: RAGChunk[] = [];

    try {
      const result = await app.crawlUrl("https://www.aven.com/", {
        limit: 20,
        includePaths: [
          "/support",
          "/education",
          "/contact",
          "/reviews",
          "/app",
          "/about",
        ],
        scrapeOptions: {
          formats: ["markdown"],
          onlyMainContent: true,
          parsePDF: false,
          maxAge: 14400000,
        },
      });

      logger.info(`fetchData - Crawl completed`, {
        success: result.success,
      });

      if (result.success && result.data) {
        let processedPages = 0;
        for (const page of result.data) {
          try {
            if (
              page.markdown &&
              page.metadata?.sourceURL &&
              page.metadata.sourceURL.includes("aven.com") &&
              page.metadata.statusCode === 200
            ) {
              const pageChunks = normalizeAndChunk({
                title: page.metadata.title || "Aven Page",
                url: page.metadata.sourceURL,
                content: page.markdown,
                summary:
                  page.metadata.description ||
                  `Content from ${page.metadata.title || "Aven website"}`,
                source: "firecrawl",
              });

              allChunks.push(...pageChunks);
              processedPages++;

              logger.info(`✅ Processed: ${page.metadata.sourceURL}`, {
                title: page.metadata.title,
                chunks: pageChunks.length,
                contentLength: page.markdown.length,
                description: page.metadata.description?.substring(0, 100),
              });
            } else {
              logger.warn(`⏭️  Skipped page:`, {
                url: page.metadata?.sourceURL || "unknown",
                hasMarkdown: !!page.markdown,
                statusCode: page.metadata?.statusCode,
                reason: !page.markdown
                  ? "no content"
                  : !page.metadata?.sourceURL?.includes("aven.com")
                    ? "not aven domain"
                    : page.metadata?.statusCode !== 200
                      ? "bad status code"
                      : "unknown",
              });
            }
          } catch (pageError) {
            logger.error(
              `Error processing page ${page.metadata?.sourceURL}:`,
              pageError
            );
          }
        }

        logger.info(`📊 Crawl processing summary:`, {
          totalPages: result.data.length,
          processedPages,
          totalChunks: allChunks.length,
          creditsUsed: result.creditsUsed,
        });
      } else if (!result.success) {
        logger.warn("Crawl failed or incomplete");
      } else {
        logger.error(`Crawl failed or incomplete`);
      }
    } catch (err) {
      logger.error(
        `Exception during crawl: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    logger.action(
      `fetchData - Completed with ${allChunks.length} total chunks`
    );
    return allChunks;
  } catch (error) {
    logger.error("fetchData - Failed to fetch data", error);
    throw error;
  }
}

// =================================
// DATA STORAGE FUNCTIONS
// =================================

/**
 * Upsert chunks to Pinecone with embeddings
 */
export async function upsertChunksToPinecone(
  chunks: RAGChunk[]
): Promise<void> {
  try {
    logger.action("upsertChunksToPinecone - Starting upsert process", {
      chunkCount: chunks.length,
    });

    // 1. Batch embed all chunk contents
    const embeddings = await getEmbeddingsBatch(
      chunks.map(chunk => chunk.content)
    );

    if (!embeddings) {
      throw new Error("Failed to generate embeddings for chunks");
    }

    // 2. Prepare records for upsert, filter out any with null embeddings
    const records = chunks
      .map((chunk, idx) => ({
        id: chunk.id,
        values: embeddings[idx] ?? undefined,
        metadata: {
          url: chunk.url ?? "",
          title: chunk.title ?? "",
          content: chunk.content ?? "",
          source: chunk.source ?? "",
        },
      }))
      .filter(record => Array.isArray(record.values));

    logger.info("upsertChunksToPinecone - Prepared records", {
      totalChunks: chunks.length,
      validRecords: records.length,
      filteredOut: chunks.length - records.length,
    });

    // 3. Upsert to Pinecone
    const namespace = pinecone
      .index(
        indexName,
        "https://aven-rag-jot4yxr.svc.aped-4627-b74a.pinecone.io"
      )
      .namespace("aven");
    await namespace.upsert(records);

    logger.action("upsertChunksToPinecone - Successfully upserted", {
      recordCount: records.length,
    });
  } catch (error) {
    logger.error("upsertChunksToPinecone - Failed to upsert chunks", error);
    throw error;
  }
}

/**
 * Server action wrapper for upsertChunksToPinecone
 */
export async function upsertChunksToPineconeAction(
  chunks: RAGChunk[]
): Promise<void> {
  await upsertChunksToPinecone(chunks);
}

// =================================
// PIPELINE FUNCTIONS
// =================================

/**
 * Complete pipeline: fetch data, embed, and upsert to Pinecone
 */
export async function fetchEmbedAndUpsert() {
  try {
    logger.action("fetchEmbedAndUpsert - Starting full pipeline");
    const chunks = await fetchData();

    if (chunks.length === 0) {
      logger.warn("No chunks to embed and upsert");
      return { success: false, count: 0, message: "No content was extracted" };
    }

    await upsertChunksToPineconeAction(chunks);
    logger.action(
      `fetchEmbedAndUpsert - Successfully processed ${chunks.length} chunks`
    );

    return {
      success: true,
      count: chunks.length,
      message: `Successfully embedded and stored ${chunks.length} content chunks`,
    };
  } catch (error) {
    logger.error("fetchEmbedAndUpsert - Pipeline failed", error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// =================================
// UTILITY FUNCTIONS
// =================================

/**
 * Query Pinecone for similar content
 */
export async function querySimilarContent(query: string, topK: number = 5) {
  try {
    logger.action("querySimilarContent - Starting query", {
      query: query.substring(0, 100),
      topK,
    });

    const embedding = await getEmbedding(query);
    if (!embedding) {
      throw new Error("Failed to generate embedding for query");
    }

    const namespace = pinecone
      .index(
        indexName,
        "https://aven-rag-jot4yxr.svc.aped-4627-b74a.pinecone.io"
      )
      .namespace("aven");
    const results = await namespace.query({
      vector: embedding,
      topK,
      includeMetadata: true,
    });

    logger.info("querySimilarContent - Query successful", {
      resultsCount: results.matches?.length || 0,
      topScore: results.matches?.[0]?.score || 0,
    });

    return results;
  } catch (error) {
    logger.error("querySimilarContent - Failed to query", error);
    throw error;
  }
}

/**
 * Health check for all services
 */
export async function healthCheck() {
  const status = {
    openai: false,
    firecrawl: false,
    timestamp: new Date().toISOString(),
  };

  try {
    // Test OpenAI
    await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: "test",
      dimensions: 768,
    });
    status.openai = true;
  } catch (error) {
    logger.warn("Health check - OpenAI failed", error);
  }

  try {
    // Test Firecrawl
    const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });
    // Just check if we can create the app instance
    status.firecrawl = !!app;
  } catch (error) {
    logger.warn("Health check - Firecrawl failed", error);
  }

  logger.info("Health check completed", status);
  return status;
}

// =================================
// MAIN EXECUTION FUNCTION
// =================================

/**
 * Main function to run the complete data pipeline
 * This is designed to be run once as a script
 */
export async function main() {
  const startTime = Date.now();
  logger.action("🚀 Starting Aven Data Management Pipeline");

  try {
    // Step 1: Health Check
    logger.action("📊 Step 1: Running health check...");
    const healthStatus = await healthCheck();

    const failedServices = Object.entries(healthStatus)
      .filter(([key, value]) => key !== "timestamp" && !value)
      .map(([key]) => key);

    if (failedServices.length > 0) {
      logger.error("❌ Health check failed for services:", failedServices);
      throw new Error(`Health check failed for: ${failedServices.join(", ")}`);
    }

    logger.info("✅ All services are healthy");

    // Step 2: Fetch Data
    logger.action("🌐 Step 2: Fetching data from Aven website...");
    const chunks = await fetchData();

    if (chunks.length === 0) {
      logger.warn("⚠️  No data was fetched. Exiting...");
      return {
        success: false,
        message: "No content was extracted from the website",
        duration: Date.now() - startTime,
      };
    }

    logger.info(`📦 Successfully fetched ${chunks.length} chunks`);

    // Step 3: Generate Embeddings and Store
    logger.action(
      "🧠 Step 3: Generating embeddings and storing in Pinecone..."
    );
    await upsertChunksToPinecone(chunks);

    // Step 4: Verification Query
    logger.action("🔍 Step 4: Verifying data storage with test query...");
    const testResults = await querySimilarContent("Aven support help", 3);

    const duration = Date.now() - startTime;
    const result = {
      success: true,
      message: `Successfully processed ${chunks.length} chunks in ${Math.round(duration / 1000)}s`,
      stats: {
        chunksProcessed: chunks.length,
        testQueryResults: testResults.matches?.length || 0,
        durationMs: duration,
        healthStatus,
      },
    };

    logger.action("🎉 Pipeline completed successfully!", result);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorResult = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: duration,
    };

    logger.error("💥 Pipeline failed", errorResult);
    throw error;
  }
}

// =================================
// COMMAND LINE EXECUTION
// =================================

/**
 * Execute main function if this file is run directly
 */
if (require.main === module) {
  console.log("🔧 Running Aven Data Management Script...\n");

  main()
    .then(result => {
      console.log("\n✅ Script completed successfully!");
      console.log("📊 Results:", JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error("\n❌ Script failed!");
      console.error("💥 Error:", error.message);
      console.error("📝 Stack:", error.stack);
      process.exit(1);
    });
}
