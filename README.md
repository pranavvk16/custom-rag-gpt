# High-Fidelity AI Help Desk Prototype

## Quick Start

1. **Supabase Setup**
   - Create project at [supabase.com](https://supabase.com)
   - Dashboard > Settings > API > Copy URL, anon key, service_role key.
   - SQL Editor > Paste & run [`scripts/schema.sql`](scripts/schema.sql)

2. **Env Vars**
   - Copy `.env.example` to `.env.local`
   - Fill Supabase URL/anon/service_role, Gemini key.

3. **Install & Seed**
   ```
   npm install
   npm run seed
   ```

4. **Run**
   ```
   npm run dev
   ```
   - http://localhost:3000 : Chat (test "auth loop", "disable logging")
   - /dashboard : Metrics

## Features
- RAG KB (6 articles: auth, VM, container, logging policy...)
- Streaming Gemini responses
- Guardrails (blocks dangerous)
- Tickets analytics (tier, deflection)

## Deploy Vercel
- Git push
- vercel.com > Import
- Add env vars

Enjoy!