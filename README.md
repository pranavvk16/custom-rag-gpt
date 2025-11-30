# AI Help Desk with RAG & Gemini

A high-fidelity prototype of an intelligent help desk agent powered by **Retrieval-Augmented Generation (RAG)** and **Google's Gemini 2.5 Flash** model. This application simulates a Tier 1 support engineer, capable of resolving technical infrastructure issues using a strictly defined internal knowledge base.



## 🚀 Key Features

### 🧠 Intelligent AI Agent
-   **RAG-Powered**: Retrieves relevant documents from a Supabase Vector database to answer queries accurately.
-   **Context-Aware**: Maintains conversation history, allowing for natural follow-up questions (e.g., "How do I fix *it*?").
-   **Senior Engineer Persona**: Acts as a professional "Senior Cloud Support Engineer" with a helpful yet authoritative tone.
-   **Strict Anti-Hallucination**: explicitly instructed to use *only* the provided context and admit when it doesn't know.
-   **Adaptable**: Can simplify explanations ("explain like I'm 5") upon request while keeping facts grounded.

### 🛡️ Security & Guardrails
-   **Input Guardrails**: Automatically detects and blocks dangerous queries (e.g., `rm -rf`, `sudo`, `disable logging`).
-   **Ticket Tracking**: Logs all interactions to Supabase for analytics (deflection rates, severity tiers).

### 💻 Modern UI/UX
-   **Streaming Responses**: Real-time typing effect for a responsive feel.
-   **History & Pinning**: Automatically saves recent questions to local storage and allows pinning important ones.
-   **Quick Guide**: Dismissible onboarding guide for new users.
-   **Starter Prompts**: One-click access to common issues like "VM Crash Recovery" or "Auth Loop Failures".

## 🛠️ Tech Stack

-   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **AI Model**: Google Gemini 2.5 Flash (`@google/generative-ai`)
-   **Database**: Supabase (PostgreSQL + pgvector)
-   **Icons**: Lucide React

## 🏁 Quick Start

### 1. Prerequisites
-   Node.js 18+ installed.
-   A [Supabase](https://supabase.com/) project.
-   A [Google AI Studio](https://aistudio.google.com/) API Key.

### 2. Setup Supabase
1.  Go to your Supabase Dashboard > **SQL Editor**.
2.  Copy the contents of [`scripts/schema.sql`](scripts/schema.sql) and run it to create the necessary tables and vector extension.
3.  Go to **Settings > API** and copy your:
    -   Project URL
    -   `anon` public key
    -   `service_role` secret key (for server-side operations)

### 3. Configure Environment
Create a `.env` file in the root directory (copy from `.env.example` if available):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
```

### 4. Install & Seed Data
Install dependencies and populate the vector database with sample knowledge base articles.

```bash
npm install
npm run seed
```

### 5. Run Locally
Start the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to chat with the agent.


## 🧪 Testing
You can run the reproduction script to test the RAG retrieval logic independently:

```bash
npx tsx scripts/reproduce_issue.ts
```
