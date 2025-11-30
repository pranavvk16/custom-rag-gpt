
// @ts-ignore
require("dotenv").config();

import { searchDocuments } from "../lib/rag";

async function main() {
  const query = "Docker Container Initialization Errors";
  console.log(`Testing RAG retrieval for query: "${query}"`);

  try {
    // Try with 0.0 threshold to see all matches
    const docs = await searchDocuments(query, 5, 0.0);
    console.log(`Found ${docs.length} documents.`);
    
    docs.forEach((doc, i) => {
      console.log(`[${i + 1}] Title: ${(doc.metadata as any)?.title || 'No Title'}`);
      console.log(`    Similarity: ${doc.similarity}`);
      console.log(`    ID: ${doc.id}`);
    });

    if (docs.length === 0) {
      console.log("No documents found. Possible causes:");
      console.log("1. Similarity threshold (0.6) is too high.");
      console.log("2. Embeddings mismatch.");
      console.log("3. Database connection issue (though no error was thrown).");
    }
  } catch (error) {
    console.error("Error during searchDocuments:", error);
  }
}

main();
