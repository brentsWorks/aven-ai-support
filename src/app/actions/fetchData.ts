"use server";

import Exa from "exa-js";
import FirecrawlApp from '@mendable/firecrawl-js';
import { z } from "zod";
import { Logger } from "@/utils/logger";
import { normalizeToRAGChunk, semanticChunkContent, type RAGChunk } from "@/lib/utils";

const logger = new Logger("ServerAction:fetchAvenData");

export async function fetchAvenStaticData() {
  try {
    logger.action("fetchAvenStaticData - Started fetching Aven content");
    const exa = new Exa(process.env.EXA_API_KEY!);
    const result = await exa.getContents(
      [
        "aven.com/support",
        "aven.com/education",
        "aven.com/contact",
        "aven.com/reviews",
        "aven.com/app"
      ],
      {
        text: true,
        context: {
          maxCharacters: 10000
        },
        summary: {
          query: "You are an AI assistant specialized in analyzing and summarizing content from Aven, a FinTech startup that offers credit cards backed by home equity for lower rates and cashback rewards. Your role is to extract and structure information that will help potential customers understand Aven's products and services."
        }
      }
    );
    logger.info("fetchAvenStaticData - Raw Exa result", { result });

    // Extract only the results array
    const results = result?.results || [];
    logger.info("fetchAvenStaticData - Returning structured results", { count: results.length });

    // Remove 'id' field from static data, keep url as unique identifier
    return results.map(({ id, ...rest }) => ({ ...rest }));
  } catch (error) {
    logger.error("fetchAvenStaticData - Failed to fetch Aven content", error);
    throw error;
  }
}

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

export async function fetchAvenDynamicData () {
  try {
    logger.action('fetchAvenDynamicData - Started fetching Aven content')
    const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! })

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
      Return an array of these section objects as JSON.
    `;

    const scrapeHomeResult = await app.scrapeUrl("https://www.aven.com/", {
      formats: ["json"],
      jsonOptions: { schema, systemPrompt },
      onlyMainContent: true,
      parsePDF: false,
      maxAge: 14400000
    });

    logger.info('fetchAvenDynamicData - Raw home result', { scrapeHomeResult });
    if (scrapeHomeResult.success && Array.isArray(scrapeHomeResult.json)) {
      logger.info('fetchAvenDynamicData - Home json length', { length: scrapeHomeResult.json.length });
    }

    if (!scrapeHomeResult.success) {
      throw new Error(`Failed to crawl: ${scrapeHomeResult.error}`)
    }

    const scrapeAboutResult = await app.scrapeUrl('https://www.aven.com/about', {
      formats: [ "json" ],
      jsonOptions: { schema, systemPrompt },
      onlyMainContent: true,
      parsePDF: false,
      maxAge: 14400000
    })

    logger.info('fetchAvenDynamicData - Raw about result', { scrapeAboutResult });
    if (scrapeAboutResult.success && Array.isArray(scrapeAboutResult.json)) {
      logger.info('fetchAvenDynamicData - About json length', { length: scrapeAboutResult.json.length });
    }

    if (!scrapeAboutResult.success) {
      throw new Error(`Failed to crawl: ${scrapeAboutResult.error}`)
    }

    const homeChunk = scrapeHomeResult.json; // this is the RAG chunk object
    const aboutChunk = scrapeAboutResult.json; // this is the RAG chunk object

    // Return as an array (filter out any missing)
    return [homeChunk, aboutChunk].filter(Boolean);

  } catch (error) {
    logger.error('fetchAvenDynamicData - Failed to fetch Aven content', error)
    throw error
  }
}

export async function fetchAvenCombinedData() {
  try {
    logger.action("fetchAvenCombinedData - Started combining static and dynamic data");
    const [staticData, dynamicData] = await Promise.all([
      fetchAvenStaticData(),
      fetchAvenDynamicData()
    ]);

    // Normalize and add source field
    const staticItems = staticData.map(item => normalizeToRAGChunk({ ...item, source: 'static' }, 'static'));
    const dynamicItems = (dynamicData || []).map(item => normalizeToRAGChunk({ ...item, source: 'dynamic' }, 'dynamic'));

    // Chunk each normalized card's content using semanticChunkContent
    function chunkCard(card: RAGChunk) {
      const chunks = semanticChunkContent(card.content, 1200);
      return chunks.map((chunk, idx) => ({
        ...card,
        id: `${card.url}-chunk${idx}`,
        content: chunk
      }));
    }

    const chunkedStatic = staticItems.flatMap(chunkCard);
    const chunkedDynamic = dynamicItems.flatMap(chunkCard);

    return [...chunkedStatic, ...chunkedDynamic];
  } catch (error) {
    logger.error("fetchAvenCombinedData - Failed to combine data", error);
    throw error;
  }
}
