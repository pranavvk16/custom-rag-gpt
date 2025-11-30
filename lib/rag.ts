import { mockKB } from "./mock-kb";

type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

interface DocumentMatch {
  id: string;
  content: string;
  metadata: Json;
  similarity: number;
}

function wordOverlapSimilarity(query: string, content: string): number {
  const queryWords = query
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2);
  const contentWords = content
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2);
  const intersection = queryWords.filter((word) => contentWords.includes(word));
  return (
    intersection.length / Math.max(queryWords.length, contentWords.length || 1)
  );
}

export async function searchDocuments(
  query: string,
  k: number = 3,
  threshold: number = 0.2
): Promise<DocumentMatch[]> {
  const matches = mockKB
    .map((doc) => ({
      id: "", // mock id
      content: doc.content,
      metadata: doc.metadata,
      similarity: wordOverlapSimilarity(query, doc.content),
    }))
    .filter((match) => match.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);

  return matches;
}
