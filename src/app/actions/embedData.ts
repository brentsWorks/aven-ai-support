'use server';

import { Logger } from '@/utils/logger';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const logger = new Logger('ServerAction:Embedding');

export async function getEmbedding(input: string): Promise<number[] | null> {
  try {
    logger.action('getEmbedding - Started embedding', { inputLength: input.length });
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: input,
      dimensions: 1536,
    });

    const embedding = response.data[0]?.embedding;
    if (embedding) {
      logger.info('getEmbedding - Embedding successful', { 
        inputLength: input.length, 
        embeddingPreview: embedding.slice(0, 5),
        dimensions: embedding.length 
      });
    } else {
      logger.warn('getEmbedding - No embedding returned', { inputLength: input.length });
    }
    return embedding ?? null;
  } catch (error) {
    logger.error('getEmbedding - Failed to get embedding', error);
    return null;
  }
}

export async function getEmbeddingsBatch(inputs: string[]): Promise<number[][] | null> {
  try {
    logger.action('getEmbeddingsBatch - Started batch embedding', { batchSize: inputs.length });
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: inputs,
      dimensions: 1536,
    });

    const embeddings = response.data.map(item => item.embedding);
    if (embeddings && embeddings.length > 0 && embeddings[0]) {
      logger.info('getEmbeddingsBatch - First embedding preview', { 
        embeddingPreview: embeddings[0].slice(0, 5),
        dimensions: embeddings[0].length,
        batchSize: embeddings.length
      });
    }
    return embeddings ?? null;
  } catch (error) {
    logger.error('getEmbeddingsBatch - Failed to get batch embeddings', error);
    return null;
  }
}