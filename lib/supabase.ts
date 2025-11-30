// @ts-ignore
require("dotenv").config();
console.log("Dotenv loaded");
console.log(
  "NEXT_PUBLIC_SUPABASE_URL:",
  !!process.env.NEXT_PUBLIC_SUPABASE_URL
);
console.log(
  "SUPABASE_SERVICE_ROLE_KEY:",
  !!process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Server-side Supabase client (service_role key) for admin ops like RAG insert/query.
// Import in API routes & seed.ts. Frontend uses browser client below.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.error("Supabase URL:", supabaseUrl);
console.error("Service Key:", !!supabaseServiceKey);
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase env vars - check .env.local");
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Browser-side Supabase client (anon key) for public queries.
// Usage: const supabase = createSupabaseBrowserClient()
export const createSupabaseBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase browser env vars (NEXT_PUBLIC_SUPABASE_ANON_KEY)"
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};
