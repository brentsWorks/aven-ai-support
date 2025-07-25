import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type RAGChunk = {
  id: string;
  title: string;
  url: string;
  content: string;
  summary?: string;
  tags?: string[];
  source: "firecrawl";
};

// Text normalization utility
export function normalizeText(text: string): string {
  if (!text) return "";
  // Standardize line breaks, collapse multiple spaces, trim
  return text
    .replace(/\r\n|\r/g, "\n") // Standardize line breaks
    .replace(/\s+/g, " ") // Collapse all whitespace to single space
    .trim(); // Remove leading/trailing whitespace
}

// Robust sentence splitter using regex (handles ., !, ? and newlines)
function splitIntoSentences(text: string): string[] {
  // This regex splits on sentence-ending punctuation followed by a space or end of string
  return text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [text];
}

// Semantic chunking: group sentences into ~1200 char chunks, never splitting a sentence
export function semanticChunkContent(
  content: string,
  maxChars = 1200
): string[] {
  const sentences = splitIntoSentences(content);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    // If adding this sentence would exceed maxChars, start a new chunk
    if (
      (currentChunk + sentence).length > maxChars &&
      currentChunk.length > 0
    ) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }
    currentChunk += sentence;
  }
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}

// Normalize and chunk a Firecrawl item into RAGChunks
export function normalizeAndChunk(item: any): RAGChunk[] {
  const normalizedContent = normalizeText(item.content ?? "");
  const chunks = semanticChunkContent(normalizedContent, 1200);
  return chunks.map((chunk, idx) => ({
    id: `${item.url}-chunk${idx}`,
    title: item.title ?? "",
    url: item.url ?? "",
    content: chunk,
    summary: item.summary ?? undefined,
    tags:
      Array.isArray(item.tags) && item.tags.length > 0 ? item.tags : undefined,
    source: "firecrawl",
  }));
}
