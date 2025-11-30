# Architecture Documentation

## High-Level Design
The AI Help Desk Platform is a full-stack application designed to provide automated technical support using Retrieval-Augmented Generation (RAG). It leverages a Next.js framework for both the frontend user interface and the backend API. The system uses Google's Gemini Pro model for natural language processing and Supabase (PostgreSQL + pgvector) for the knowledge base and vector storage.

## Components

### 1. Frontend (Next.js)
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Role**: Renders the chat interface, manages user sessions, and displays metrics.

### 2. Backend API (Next.js API Routes)
- **Runtime**: Node.js (via Next.js)
- **Endpoints**:
    - `/api/chat`: Handles chat interactions, RAG retrieval, and LLM generation.
    - `/api/metrics`: Provides analytics on system usage, tier distribution, and deflection rates.
- **Role**: Orchestrates the logic between the user, the database, and the LLM.

### 3. Knowledge Base & Database (Supabase)
- **Database**: PostgreSQL
- **Vector Store**: pgvector extension
- **Tables**:
    - `documents`: Stores KB chunks, metadata, and vector embeddings.
    - `tickets`: Stores session logs, user queries, AI responses, tier classifications, and severity.
- **Role**: Persists knowledge data and operational logs.

### 4. LLM Engine (Google Gemini)
- **Provider**: Google Generative AI (Gemini 1.5 Flash)
- **Role**: Generates natural language responses based on retrieved context and system instructions.

## Data Flow

1.  **User Query**: User sends a message via the Chat UI.
2.  **API Request**: Frontend sends a POST request to `/api/chat` with the message history.
3.  **Guardrails**: Backend checks the query against a list of dangerous keywords. If blocked, a refusal response is returned immediately.
4.  **Retrieval (RAG)**:
    - The query is embedded (conceptually, or matched via text search/embedding).
    - Backend queries Supabase `documents` table for relevant chunks using vector similarity (or keyword matching).
5.  **Context Assembly**: Retrieved chunks are formatted into a context block.
6.  **Prompt Construction**: A strict system prompt is created, combining the context, user query, and business rules (e.g., "No Hallucinations").
7.  **LLM Generation**: The prompt is sent to Gemini.
8.  **Response Streaming**: Gemini streams the response back to the backend, which streams it to the frontend.
9.  **Logging**: The interaction (query, response, tier, severity) is logged to the `tickets` table in Supabase.

## Security & Compliance
- **No Internet Browsing**: The LLM is restricted to the provided context and does not have access to external tools or the open internet for answering queries.
- **Guardrails**: Keyword-based blocking prevents execution of dangerous commands (e.g., `sudo`, `rm -rf`).
