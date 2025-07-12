"use server";

import Exa from "exa-js";
import FirecrawlApp from '@mendable/firecrawl-js';
import { z } from "zod";
import { Logger } from "@/utils/logger";

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

    return results.map(({ id, title, url, summary }) => ({
      id, title, url, summary
    }));
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
  date: z.string().optional().describe("Date published or updated"),
  tags: z.array(z.string()).optional().describe("Relevant topics or keywords"),
  source_type: z.string().optional().describe("Type of source, e.g., faq, review, product"),
  author: z.string().optional().describe("Author of the content, if available")
});

export async function fetchAvenDynamicData () {
  try {
    logger.action('fetchAvenDynamicData - Started fetching Aven content')
    const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! })

    const scrapeHomeResult = await app.scrapeUrl("https://www.aven.com/", {
      formats: ["json"],
      jsonOptions: { schema: schema },
      onlyMainContent: true,
      parsePDF: false,
      maxAge: 14400000
    });

    if (!scrapeHomeResult.success) {
      throw new Error(`Failed to crawl: ${scrapeHomeResult.error}`)
    }

    const scrapeAboutResult = await app.scrapeUrl('https://www.aven.com/about', {
      formats: [ "json" ],
      jsonOptions: { schema: schema },
      onlyMainContent: true,
      parsePDF: false,
      maxAge: 14400000
    })

    if (!scrapeAboutResult.success) {
      throw new Error(`Failed to crawl: ${scrapeAboutResult.error}`)
    }

    return {
      home: scrapeHomeResult,
      about: scrapeAboutResult
    }

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

    // Normalize dynamic data to match static format
    const dynamicItems = [];
    if (dynamicData.home?.json) {
      const home = dynamicData.home.json;
      dynamicItems.push({
        id: 'aven.com/',
        title: home.title || 'Aven Home',
        url: home.url || 'https://www.aven.com/',
        summary: home.summary || '',
        source: 'dynamic'
      });
    }
    if (dynamicData.about?.json) {
      const about = dynamicData.about.json;
      dynamicItems.push({
        id: 'aven.com/about',
        title: about.title || 'Aven About',
        url: about.url || 'https://www.aven.com/about',
        summary: about.summary || '',
        source: 'dynamic'
      });
    }

    // Tag static data
    const staticItems = staticData.map(item => ({ ...item, source: 'static' }));

    // Combine and return
    return [...staticItems, ...dynamicItems];
  } catch (error) {
    logger.error("fetchAvenCombinedData - Failed to combine data", error);
    throw error;
  }
}
