# Knowledge Base Structure

## Storage
The Knowledge Base (KB) is stored in a **Supabase** PostgreSQL database using the `pgvector` extension for semantic search.

### Schema
The core data is stored in the `documents` table:

```sql
create table documents (
  id uuid primary key default gen_random_uuid(),
  content text, -- The actual text of the KB article/chunk
  metadata jsonb, -- JSON object containing title, source, etc.
  embedding vector(768) -- Vector embedding (compatible with Gemini text-embedding-004)
);
```

## Ingestion Process
Ingestion is handled by the `scripts/seed.ts` script.

1.  **Parsing**: The script reads raw text or markdown files (currently hardcoded or loaded from `data/`).
2.  **Chunking**: Large documents are split into smaller, semantically meaningful chunks (e.g., by paragraph or max token length).
3.  **Embedding**: Each chunk is passed to the Google Gemini Embedding API (`text-embedding-004`) to generate a vector representation.
4.  **Storage**: The content, metadata, and embedding are inserted into the `documents` table in Supabase.

## Indexing
A generic HNSW or IVFFlat index can be applied to the `embedding` column in Supabase to speed up similarity searches for large datasets:

```sql
create index on documents using hnsw (embedding vector_cosine_ops);
```

## Retrieval
Retrieval uses a cosine similarity search function (RPC) defined in Supabase:

```sql
create or replace function match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql stable
as $$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;
```
