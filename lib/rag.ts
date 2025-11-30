import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseServer } from "./supabase";
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

interface DocumentMatch {
  id: string;
  content: string;
  metadata: Json;
  similarity: number;
}

export async function getEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "models/embedding-001" });
  const result = await model.embedContent(text);
  return result.embedding.values;
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
    throw new Error(`Supabase RPC error: ${error.message}`);
  }

  return data || [];
}
