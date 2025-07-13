'use server';

import OpenAI from 'openai';
import { Logger } from '@/utils/logger';
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const logger = new Logger('ServerAction:Embedding');

export async function getEmbedding(input: string): Promise<number[] | null> {
  try {
    logger.action('getEmbedding - Started embedding', { inputLength: input.length });
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input,
    });

    const embedding = response.data[0]?.embedding;
    if (embedding) {
      logger.info('getEmbedding - Embedding successful', { inputLength: input.length, embeddingPreview: embedding.slice(0, 5) });
    } else {
      logger.warn('getEmbedding - No embedding returned', { inputLength: input.length });
    }
    return embedding ?? null;
  } catch (error) {
    logger.error('getEmbedding - Failed to get embedding', error);
    return null;
  }
}