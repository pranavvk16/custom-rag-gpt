import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    // Fetch tickets to calculate trends
    // In a real app, we'd use a more efficient aggregation query or a materialized view
    const { data: tickets, error } = await supabaseServer
      .from("tickets")
      .select("created_at, tier, severity, guardrail_blocked");

    if (error) throw error;

    // Aggregate by day
    const trends: Record<string, any> = {};

    tickets?.forEach((t: any) => {
      const day = new Date(t.created_at).toISOString().split("T")[0];
      if (!trends[day]) {
        trends[day] = { date: day, total: 0, tier1: 0, tier2: 0, highSeverity: 0, blocked: 0 };
      }
      trends[day].total++;
      if (t.tier === 1 || t.tier === "TIER_1") trends[day].tier1++;
      if (t.tier === 2 || t.tier === "TIER_2") trends[day].tier2++;
      if (t.severity === "HIGH" || t.severity === "High") trends[day].highSeverity++;
      if (t.guardrail_blocked) trends[day].blocked++;
    });

    const result = Object.values(trends).sort((a: any, b: any) => a.date.localeCompare(b.date));

    return Response.json(result);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
