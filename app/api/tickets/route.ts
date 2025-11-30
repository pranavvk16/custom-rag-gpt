import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");

    const { data, error } = await supabaseServer
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, user_query, ai_response, tier, severity, deflected, guardrail_blocked } = body;

    const { data, error } = await supabaseServer
      .from("tickets")
      .insert({
        session_id,
        user_query,
        ai_response,
        tier,
        severity,
        deflected,
        guardrail_blocked
      })
      .select()
      .single();

    if (error) throw error;

    return Response.json(data);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
