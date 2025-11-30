// @ts-ignore
require("dotenv").config();

import { mockKB } from "../lib/mock-kb";
import { supabaseServer } from "../lib/supabase";
import { getEmbedding } from "../lib/rag";

async function main() {
  console.log("Starting KB seeding with Gemini embeddings...");

  // Clear existing documents to avoid duplicates and ensure fresh embeddings
  await supabaseServer.from('documents').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  for (const doc of mockKB) {
    try {
      const embedding = await getEmbedding(doc.content);

      const { error } = await supabaseServer.from("documents").upsert({
        content: doc.content,
        embedding,
        metadata: doc.metadata,
      });

      if (error) throw error;

      console.log(`Upserted: ${doc.metadata.title} (${embedding.length} dims)`);
    } catch (err) {
      console.error(`Error seeding ${doc.metadata.title}:`, err);
    }
  }

  console.log("Seeding complete! Check Supabase > documents table.");
}

main().catch(console.error);
