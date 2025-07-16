"use server";

import FirecrawlApp from '@mendable/firecrawl-js';
import { z } from "zod";
import { Logger } from "@/utils/logger";
import { normalizeAndChunk, type RAGChunk } from "@/lib/utils";
import { upsertChunksToPineconeAction } from "./upsertAction";

const logger = new Logger("ServerAction:fetchData");

const schema = z.object({
  title: z.string().describe("The title of the page or section"),
  url: z.string().describe("The URL of the page"),
  summary: z.string().describe("A detailed summary of the content, serving as context for an LLM RAG pipeline"),
  section_heading: z.string().optional().describe("Section or heading for this chunk"),
  content: z.string().describe("The full text under this heading"),
  date: z.string().optional().describe("Date published or updated"),
  tags: z.array(z.string()).optional().describe("Relevant topics or keywords"),
  source_type: z.string().optional().describe("Type of source, e.g., faq, review, product"),
  author: z.string().optional().describe("Author of the content, if available")
});

const urls = [
  "https://www.aven.com/support",
  "https://www.aven.com/education",
  "https://www.aven.com/contact",
  "https://www.aven.com/reviews",
  "https://www.aven.com/app",
  "https://www.aven.com/",
  "https://www.aven.com/about"
];

export async function fetchData() {
  try {
    logger.action("fetchData - Started Firecrawl scraping for all URLs");
    const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });
    const systemPrompt = `Extract the main content of the page, breaking it into logical sections based on headings (e.g., h1, h2, h3). For each section, return:
      - section_heading: The heading text (if any)
      - content: The full text under this heading
      - summary: A concise summary of the section (1-2 sentences)
      - title: The page title
      - url: The page URL
      - date: The date published or updated (if available)
      - tags: Any relevant topics or keywords
      - source_type: The type of page (e.g., faq, review, product, etc.)
      - author: The author (if available)
      Return an array of these section objects as JSON.`;

    let allChunks: RAGChunk[] = [];
    for (const url of urls) {
      try {
        const result = await app.scrapeUrl(url, {
          formats: ["json"],
          jsonOptions: { schema, systemPrompt },
          onlyMainContent: true,
          parsePDF: false,
          maxAge: 14400000
        });
        logger.info(`fetchData - Raw result for ${url}`, { result });
        if (result.success && result.json) {
          const normalizedChunks = normalizeAndChunk({
            ...result.json,
            url: result.json.url === 'https://www.aven.com/' ? url : result.json.url
          });
          allChunks.push(...normalizedChunks);
        } else {
          logger.error(`Failed to scrape ${url}: ${result.error || 'Unknown error'}`);
        }
      } catch (err) {
        logger.error(`Exception scraping ${url}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    return allChunks;
  } catch (error) {
    logger.error("fetchData - Failed to fetch data", error);
    throw error;
  }
}

export async function fetchEmbedAndUpsert() {
  const chunks = await fetchData();
  await upsertChunksToPineconeAction(chunks);
  return { success: true, count: chunks.length };
}
