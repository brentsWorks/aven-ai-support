"use server";

import Exa from "exa-js";
import { Logger } from "@/utils/logger";

const logger = new Logger("ServerAction:fetchAvenData");

export async function fetchAvenData() {
  try {
    logger.action("fetchAvenData - Started fetching Aven content");
    const exa = new Exa("669bec1b-65c5-4e54-b43e-3a55e450d88f");
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
    logger.info("fetchAvenData - Raw Exa result", { result });

    // Extract only the results array
    const results = result?.results || [];
    logger.info("fetchAvenData - Returning structured results", { count: results.length });

    return results.map(({ id, title, url, summary }) => ({
      id, title, url, summary
    }));
  } catch (error) {
    logger.error("fetchAvenData - Failed to fetch Aven content", error);
    throw error;
  }
}
