import { supabaseServer } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseServer
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const tierCounts = data.reduce((acc: Record<number, number>, t: any) => {
    acc[t.tier] = (acc[t.tier] || 0) + 1;
    return acc;
  }, {});

  const total = data.length;
  const deflectedCount = data.filter((t: any) => t.deflected === true).length;
  const deflectionRate = total
    ? ((deflectedCount / total) * 100).toFixed(1)
    : "0";

  return Response.json({
    tierCounts,
    deflectionRate,
    totalTickets: total,
  });
}
