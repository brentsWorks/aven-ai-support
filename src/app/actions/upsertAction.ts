"use server";
import { upsertChunksToPinecone } from "./storeData";
import type { RAGChunk } from "@/lib/utils";

export async function upsertChunksToPineconeAction(chunks: RAGChunk[]) {
  // This function runs on the server and calls the real upsert logic
  await upsertChunksToPinecone(chunks);
} 