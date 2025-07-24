"use server";

import FirecrawlApp from '@mendable/firecrawl-js';
import { Logger } from "@/utils/logger";
import { normalizeAndChunk, type RAGChunk } from "@/lib/utils";
import { upsertChunksToPineconeAction } from "./upsertAction";

const logger = new Logger("ServerAction:fetchData");

export async function fetchData() {
  try {
    logger.action("fetchData - Started Firecrawl crawling for Aven website");
    const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });

    let allChunks: RAGChunk[] = [];
    
    try {
      const result = await app.crawlUrl('https://www.aven.com/', {
        limit: 20, // Increased limit to get more pages
        includePaths: ['/support', '/education', '/contact', '/reviews', '/app', '/about'], // Focus on key pages
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
            // Check if page has content and is from Aven domain
            if (page.markdown && 
                page.metadata?.sourceURL && 
                page.metadata.sourceURL.includes('aven.com') &&
                page.metadata.statusCode === 200) {
              
              // Create chunks from this page
              const pageChunks = normalizeAndChunk({
                title: page.metadata.title || 'Aven Page',
                url: page.metadata.sourceURL,
                content: page.markdown,
                summary: page.metadata.description || `Content from ${page.metadata.title || 'Aven website'}`,
                source: 'firecrawl'
              });
              
              allChunks.push(...pageChunks);
              processedPages++;
              
              logger.info(`✅ Processed: ${page.metadata.sourceURL}`, {
                title: page.metadata.title,
                chunks: pageChunks.length,
                contentLength: page.markdown.length,
                description: page.metadata.description?.substring(0, 100)
              });
            } else {
              // Log skipped pages for debugging
              logger.warn(`⏭️  Skipped page:`, {
                url: page.metadata?.sourceURL || 'unknown',
                hasMarkdown: !!page.markdown,
                statusCode: page.metadata?.statusCode,
                reason: !page.markdown ? 'no content' : 
                       !page.metadata?.sourceURL?.includes('aven.com') ? 'not aven domain' :
                       page.metadata?.statusCode !== 200 ? 'bad status code' : 'unknown'
              });
            }
          } catch (pageError) {
            logger.error(`Error processing page ${page.metadata?.sourceURL}:`, pageError);
          }
        }
        
        logger.info(`📊 Crawl processing summary:`, {
          totalPages: result.data.length,
          processedPages,
          totalChunks: allChunks.length,
          creditsUsed: result.creditsUsed
        });
        
      } else if (!result.success) {
        logger.warn("Crawl failed or incomplete");
        // Handle partial results if needed
      } else {
        logger.error(`Crawl failed or incomplete`);
      }
      
    } catch (err) {
      logger.error(`Exception during crawl: ${err instanceof Error ? err.message : String(err)}`);
    }
    
    logger.action(`fetchData - Completed with ${allChunks.length} total chunks`);
    return allChunks;
  } catch (error) {
    logger.error("fetchData - Failed to fetch data", error);
    throw error;
  }
}

export async function fetchEmbedAndUpsert() {
  try {
    logger.action("fetchEmbedAndUpsert - Starting full pipeline");
    const chunks = await fetchData();
    
    if (chunks.length === 0) {
      logger.warn("No chunks to embed and upsert");
      return { success: false, count: 0, message: "No content was extracted" };
    }
    
    await upsertChunksToPineconeAction(chunks);
    logger.action(`fetchEmbedAndUpsert - Successfully processed ${chunks.length} chunks`);
    
    return { 
      success: true, 
      count: chunks.length,
      message: `Successfully embedded and stored ${chunks.length} content chunks`
    };
  } catch (error) {
    logger.error("fetchEmbedAndUpsert - Pipeline failed", error);
    return { 
      success: false, 
      count: 0, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
