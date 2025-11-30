# BayInfotech AI Challenge - Next.js Full-Stack Implementation Plan

## 1. Architecture Overview
* **Framework:** Next.js 14/15 (App Router).
* **Language:** TypeScript.
* **Database & Vector Store:** Supabase (PostgreSQL + pgvector).
* **LLM Orchestration:** Vercel AI SDK (Core) or LangChain.js.
* **Deployment:** Vercel (Frontend & Serverless API functions).
* **Styling:** Tailwind CSS + Shadcn/UI (for rapid, professional UI).

## 2. Data Strategy (The "Local KB")
Since we cannot use the internet, we must rely on `pgvector`.
* **Mock Data:** We will create a `data/kb_documents.json` file containing the mock scenarios (Auth loops, VM crashes, etc.).
* **Ingestion Script:** A local script (`scripts/seed-db.ts`) that:
    1.  Reads the JSON.
    2.  Chunks the text.
    3.  Generates Embeddings (via OpenAI `text-embedding-3-small`).
    4.  Upserts into Supabase `documents` table.

## 3. The "Brain" Logic (API Route: `/api/chat`)
This is the core requirement. The flow inside the Next.js API route will be:

1.  **Input:** User message + Session ID.
2.  **Guardrail Check 1 (Regex/Keyword):** Block obvious "ignore instructions" or "system prompt injection" attempts immediately.
3.  **Retrieval (RAG):**
    * Turn user query into an embedding.
    * Query Supabase for top 3 matching chunks.
    * *Constraint:* If similarity score is low, flag as "Not in KB".
4.  **LLM Assembly:**
    * System Prompt: "You are a helpful AI support assistant. You MUST ONLY use the provided context. If the answer is not in the context, state that you cannot help."
    * User Prompt: Context Chunks + User Question.
5.  **Output Analysis (Structured Output):**
    * We will ask the LLM to return JSON containing: `{ answer, confidence, tier, severity, kb_references }`.
6.  **Persist:** Save the interaction to the `interactions` table for Analytics.

## 4. Workflows & Edge Cases
* **Tiering:** The LLM will be instructed (via System Prompt) to assign `TIER_1` (simple info), `TIER_2` (complex debugging), or `TIER_3` (infrastructure/unsolvable) based on the retrieved context.
* **Escalation:** If `severity == HIGH` or `answer == "Not in KB"`, set `needsEscalation: true`.

## 5. Development Steps
1.  **Setup:** Init Next.js, set up Supabase project, enable `pgvector`.
2.  **Database:** Create tables (`documents`, `tickets`, `analytics`).
3.  **Ingestion:** Write and run the seed script to populate the KB.
4.  **Backend:** Build `route.ts` for chat with RAG logic.
5.  **Frontend:** Build the Chat Interface and the Analytics Dashboard.
6.  **Testing:** Verify the "Hard Workflows" (e.g., ask "How do I disable logging?" and ensure it blocks).

## 6. Deployment (Vercel)
* Push code to GitHub.
* Import to Vercel.
* Add Env Vars (`OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`).
* **Result:** A single public URL meeting all requirements.