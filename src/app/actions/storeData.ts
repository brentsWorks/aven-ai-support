import { Pinecone } from '@pinecone-database/pinecone';
import type { RAGChunk } from '@/lib/utils';
import { getEmbeddingsBatch } from './embedData';

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
});

const indexName = 'aven-rag';

export async function upsertChunksToPinecone(chunks: RAGChunk[]) {
  // 1. Batch embed all chunk contents
  const embeddings = await getEmbeddingsBatch(chunks.map(chunk => chunk.content));
  // 2. Prepare records for upsert, filter out any with null embeddings
  const records = chunks
    .map((chunk, idx) => ({
      id: chunk.id,
      values: embeddings[idx] ?? undefined,
      metadata: {
        url: chunk.url ?? '',
        title: chunk.title ?? '',
        summary: chunk.summary ?? '',
        source: chunk.source ?? '',
      }
    }))
    .filter(record => Array.isArray(record.values));
  // 3. Upsert to Pinecone
  await pc.index(indexName).upsert(records);
}