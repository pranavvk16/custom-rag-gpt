import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseServer } from "./supabase";

type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

interface DocumentMatch {
  id: string;
  content: string;
  metadata: Json;
  similarity: number;
}

function toNumberArray(embedding: any): number[] {
  if (Array.isArray(embedding)) {
    return embedding.map((v) => Number(v));
  }

  if (typeof embedding === "string") {
    const cleaned = embedding.replace(/\uFEFF/g, "").replace(/[\\[\\]\\(\\)]/g, "");
    return cleaned.split(",").map((v) => {
      const parsed = Number(v.trim());
      return Number.isFinite(parsed) ? parsed : 0;
    });
  }

  return [];
}

function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
const embeddingModel = genAI.getGenerativeModel({
  model: "text-embedding-004",
});

export async function getEmbedding(text: string): Promise<number[]> {
  const res = await embeddingModel.embedContent(text);
  return res.embedding.values;
}

export async function searchDocuments(
  query: string,
  k: number = 3,
  threshold: number = 0.6 // Lowered threshold to improve document retrieval
): Promise<DocumentMatch[]> {
  const queryEmbedding = [...(await getEmbedding(query))];

  const { data, error } = await supabaseServer.rpc("match_documents", {
    query_embedding: [...queryEmbedding],
    match_threshold: threshold,
    match_count: k,
  });

  let matches: DocumentMatch[] = [];

  if (!error && data?.length) {
    matches = data.map((row: any) => ({
      id: row.id,
      content: row.content,
      metadata: row.metadata,
      similarity: row.similarity,
    }));
  } else {
    if (error) {
      console.error("Error querying match_documents RPC:", error);
    }
    // Fallback when RPC returns no rows (e.g., if the DB function isn't wired correctly).
    const { data: rows, error: fetchError } = await supabaseServer
      .from("documents")
      .select("id, content, metadata, embedding");

    if (fetchError) {
      console.error("Error fetching documents fallback:", fetchError);
      return [];
    }

    const scored = (rows || []).map((row: any) => {
      const embedding = toNumberArray(row.embedding);
      const similarity = cosineSimilarity(queryEmbedding, embedding);

      return {
        id: row.id,
        content: row.content,
        metadata: row.metadata,
        similarity,
      };
    });

    matches = scored
      .filter((row) => row.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k);
  }

  return matches;
}
