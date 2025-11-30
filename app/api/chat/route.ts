import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchDocuments } from "@/lib/rag";
import { supabaseServer } from "@/lib/supabase";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 2048,
  },
});

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const query = messages[messages.length - 1].content;

  const docs = await searchDocuments(query);
  console.log("QUERY:", query);
  console.log(
    "DOCS:",
    docs.length,
    docs.map((d: any) => ({ title: d.metadata.title, sim: d.similarity }))
  );
  const context = docs
    .map((d: any, i: number) => `[${i + 1}] ${d.metadata.title}\n${d.content}`)
    .join("\n\n");
  console.log("CONTEXT LENGTH:", context.length);
  // Guardrail: Block dangerous requests
  const lowerQuery = query.toLowerCase();
  const sessionId = crypto.randomUUID();
  const deflected = docs.length > 0;
  const tier = deflected ? 1 : 3;
  const severity = "Medium";
  await supabaseServer.from("tickets").insert({
    session_id: sessionId,
    user_query: query,
    ai_response: null,
    tier,
    severity,
    deflected,
  });
  const dangerousKeywords = [
    "disable logging",
    "access host",
    "sudo",
    "rm -rf",
    "ignore instructions",
    "jailbreak",
  ];
  if (dangerousKeywords.some((kw) => lowerQuery.includes(kw))) {
    const refuse = "Request denied for security reasons.";
    const sessionId = crypto.randomUUID();
    await supabaseServer.from("tickets").insert({
      session_id: sessionId,
      user_query: query,
      ai_response: refuse,
      tier: 1,
      severity: "High",
      deflected: false,
    });

    const encoder = new TextEncoder();
    const refuseStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ choices: [{ delta: { content: refuse } }] })}\n\n`
          )
        );
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }] })}\n\n`
          )
        );
        controller.close();
      },
    });

    return new Response(refuseStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }
  const prompt = `You are a helpful technical support agent for cloud infrastructure issues. Answer the user's question using ONLY the provided context below. 

IMPORTANT RULES:
- Provide a direct, actionable, step-by-step response extracted from the relevant documents.
- Quote key steps verbatim where possible, and summarize clearly.
- Cite the document title(s) used (e.g., "From 'Resolving Authentication Loop Failures':").
- Structure: Start with solution overview, then numbered steps, verification, escalation if applicable.
- NEVER say "refer to the document" or "see context"—always extract and explain.
- If no relevant context, respond: "No matching knowledge base article found for this query."

Context:
${context}

User Question: ${query}

Respond concisely and helpfully.`;
  console.log("PROMPT PREVIEW:", prompt.slice(0, 200) + "...");

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const result = await model.generateContentStream(prompt);
        for await (const content of result.stream) {
          const delta = content.text();
          if (delta.length === 0) {
            continue;
          }
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ choices: [{ delta: { content: delta } }] })}\n\n`
            )
          );
        }
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }] })}\n\n`
          )
        );
      } catch (e) {
        controller.error(e);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
