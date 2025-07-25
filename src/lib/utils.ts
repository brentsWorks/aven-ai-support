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

// AI-powered content cleansing using GPT-4o (server-only)
export async function cleanseContent(rawContent: string): Promise<string> {
  if (!rawContent || rawContent.trim().length === 0) {
    return rawContent;
  }

  // Only run on server-side
  if (typeof window !== 'undefined') {
    console.warn("Content cleansing is only available on the server-side");
    return basicContentCleanse(rawContent);
  }

  // Check for OpenAI API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OPENAI_API_KEY not found, using basic cleansing");
    return basicContentCleanse(rawContent);
  }

  try {
    // Dynamic import to avoid client-side bundling
    const { OpenAI } = await import("openai");
    
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a content cleansing assistant specifically for Aven, a home equity credit card company. Your job is to clean up scraped web content while PRESERVING all expertise and company-specific information.

CLEANING RULES:
1. REMOVE navigation elements, menus, headers, footers
2. REMOVE image references, alt texts, and file paths (e.g., "![Icon](path/to/image.svg)")
3. REMOVE redundant links and URL references
4. REMOVE formatting artifacts like markdown syntax errors
5. REMOVE generic website boilerplate

PRESERVATION RULES (CRITICAL):
6. KEEP all Aven-specific expertise, product details, and features
7. KEEP all financial terms, rates, benefits, and eligibility information
8. KEEP all company-specific language, brand voice, and messaging
9. KEEP all technical details about home equity, HELOC, credit cards
10. KEEP all customer-facing information, FAQs, and support content
11. KEEP all regulatory, legal, and compliance information
12. KEEP all product comparisons and competitive advantages
13. PRESERVE the natural flow and readability
14. MAINTAIN factual accuracy - never change or add information

Aven is a credit card that uses home equity for low rates. Focus on preserving their unique value proposition and expertise.

Return ONLY the cleaned content, no explanations or meta-commentary.`
        },
        {
          role: "user",
          content: `Please clean this content:\n\n${rawContent}`
        }
      ],
      max_tokens: 2000,
      temperature: 0.1, // Low temperature for consistent, conservative cleaning
    });

    const cleanedContent = response.choices[0]?.message?.content?.trim();
    
    if (!cleanedContent) {
      console.warn("OpenAI returned empty content, using original");
      return rawContent;
    }

    return cleanedContent;
  } catch (error) {
    console.error("Error cleansing content with OpenAI:", error);
    // Fallback to basic cleaning if AI fails
    return basicContentCleanse(rawContent);
  }
}

// Fallback basic content cleansing (regex-based)
function basicContentCleanse(content: string): string {
  return content
    // Remove image markdown syntax
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // Remove standalone links in brackets
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove navigation-like patterns
    .replace(/^[-\s]*\[.*?\]\([^)]*\)\s*[-\s]*/gm, '')
    // Remove multiple consecutive dashes or equals
    .replace(/[-=]{3,}/g, '')
    // Clean up multiple spaces and newlines
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

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

// Enhanced normalize and chunk function with AI cleansing
export async function normalizeAndChunk(item: RAGChunk): Promise<RAGChunk[]> {
  console.log(`🧹 Cleansing content for: ${item.title || 'Unknown'}`);
  
  // First, cleanse the content using AI
  const cleanedContent = await cleanseContent(item.content ?? "");
  
  // Then normalize and chunk the cleaned content
  const normalizedContent = normalizeText(cleanedContent);
  const chunks = semanticChunkContent(normalizedContent, 1200);
  
  console.log(`✨ Cleaned content: ${item.content?.length || 0} → ${cleanedContent.length} chars`);
  
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

// Synchronous version for backward compatibility (uses basic cleansing)
export function normalizeAndChunkSync(item: RAGChunk): RAGChunk[] {
  const basicCleanedContent = basicContentCleanse(item.content ?? "");
  const normalizedContent = normalizeText(basicCleanedContent);
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
