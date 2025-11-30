-- Run this SQL in Supabase Dashboard > SQL Editor to set up tables. Requires pgvector enabled (automatic).

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table for KB chunks
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(768) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector index for cosine similarity (adjust lists based on dataset size)
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Tickets table for analytics
-- pgvector match_documents RPC function for efficient RAG similarity search
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.78,
  match_count INT DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding ASC
  LIMIT match_count;
$$;
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_query TEXT NOT NULL,
  ai_response TEXT,
  tier INTEGER NOT NULL CHECK (tier >=1 AND tier <=3),
  severity TEXT NOT NULL CHECK (severity IN ('Low', 'Medium', 'High')),
  deflected BOOLEAN DEFAULT TRUE,  -- True if resolved from KB, false if escalated/not found
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for queries
CREATE INDEX tickets_session_idx ON tickets (session_id);
CREATE INDEX tickets_created_idx ON tickets (created_at DESC);
CREATE INDEX tickets_tier_idx ON tickets (tier);