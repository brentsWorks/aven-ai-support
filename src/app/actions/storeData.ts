import { Pinecone } from '@pinecone-database/pinecone';
import type { RAGChunk } from '@/lib/utils';

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
});

const indexName = 'aven-rag';
await pc.createIndexForModel({
  name: indexName,
  cloud: 'aws',
  region: 'us-east-1',
  embed: {
    model: 'llama-text-embed-v2',
    fieldMap: { text: 'content' },
  },
  waitUntilReady: true,
});

export async function upsertChunksToPinecone(chunks: RAGChunk[]) {
  // Prepare records for upsert (send raw fields, not embeddings)
  const records = chunks.map(chunk => ({
    id: chunk.id,
    content: chunk.content,
    url: chunk.url,
    title: chunk.title,
    section_heading: chunk.section_heading,
    summary: chunk.summary,
    date: chunk.date,
    tags: chunk.tags,
    source_type: chunk.source_type,
    author: chunk.author,
    source: chunk.source,
  }));

  // Upsert to Pinecone (server-side embedding)
  await pc.index(indexName).upsert(records);
}