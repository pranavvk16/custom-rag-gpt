import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseServer } from "./supabase";

type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

interface DocumentMatch {
  id: string;
  content: string;
  metadata: Json;
  similarity: number;
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

export async function getEmbedding(text: string): Promise<number[]> {
  const res = await embeddingModel.embedContent(text);
  return res.embedding.values;
}

export async function searchDocuments(
  query: string,
  k: number = 3,
  threshold: number = 0.78
): Promise<DocumentMatch[]> {
  const queryEmbedding = await getEmbedding(query);

  const { data, error } = await supabaseServer.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: k,
  });

  if (error) {
    console.error("Error querying documents:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    content: row.content,
    metadata: row.metadata,
    similarity: row.similarity,
  }));
}
