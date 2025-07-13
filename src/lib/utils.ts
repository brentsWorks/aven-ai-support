import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type RAGChunk = {
  id: string;
  title: string;
  url: string;
  section_heading?: string;
  content: string;
  summary?: string;
  date?: string;
  tags?: string[];
  source_type?: string;
  author?: string;
  source: "static" | "dynamic";
};

// Text normalization utility
export function normalizeText(text: string): string {
  if (!text) return "";
  // Standardize line breaks, collapse multiple spaces, trim
  return text
    .replace(/\r\n|\r/g, '\n') // Standardize line breaks
    .replace(/\s+/g, ' ')         // Collapse all whitespace to single space
    .trim();                      // Remove leading/trailing whitespace
}

// Utility to chunk text into ~1200 character chunks
export function chunkText(text: string, maxChars = 1200): string[] {
  const normalized = normalizeText(text);
  const chunks = [];
  let start = 0;
  while (start < normalized.length) {
    chunks.push(normalized.slice(start, start + maxChars));
    start += maxChars;
  }
  return chunks;
}

// Returns a single RAGChunk (no chunking)
export function normalizeToRAGChunk(item: any, source: "static" | "dynamic"): RAGChunk {
  return {
    id: item.url || item.id, // url is now the unique identifier
    title: item.title,
    url: item.url,
    section_heading: item.section_heading ?? undefined,
    content:
      source === "static"
        ? normalizeText(item.text ?? "")
        : item.content && item.content.trim() !== ""
          ? normalizeText(item.content)
          : normalizeText(item.summary ?? ""),
    summary: item.summary ?? undefined,
    date: item.date ?? undefined,
    tags: item.tags ?? undefined,
    source_type: item.source_type ?? undefined,
    author: item.author ?? undefined,
    source,
  };
}

// Returns an array of RAGChunks, chunking static text if needed
export function normalizeAndChunk(item: any, source: "static" | "dynamic"): RAGChunk[] {
  let content = "";
  if (source === "static") {
    content = item.text ?? "";
  } else {
    content = item.content ?? item.summary ?? "";
  }
  const normalized = normalizeText(content);
  if (normalized.length > 1200) {
    const textChunks = chunkText(normalized, 1200);
    return textChunks.map((chunk, i) => ({
      id: `${item.id}-chunk${i}`,
      title: item.title,
      url: item.url,
      section_heading: item.section_heading ?? undefined,
      content: chunk,
      summary: item.summary ?? undefined,
      date: item.date ?? undefined,
      tags: item.tags ?? undefined,
      source_type: item.source_type ?? undefined,
      author: item.author ?? undefined,
      source,
    }));
  } else {
    // Always return at least one chunk, even if short
    return [{
      id: `${item.id}-chunk0`,
      title: item.title,
      url: item.url,
      section_heading: item.section_heading ?? undefined,
      content: normalized,
      summary: item.summary ?? undefined,
      date: item.date ?? undefined,
      tags: item.tags ?? undefined,
      source_type: item.source_type ?? undefined,
      author: item.author ?? undefined,
      source,
    }];
  }
}
