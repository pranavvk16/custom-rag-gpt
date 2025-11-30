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
  const currentMessageContent = messages[messages.length - 1].content;
  
  // Extract history (all messages except the last one)
  const history = messages.slice(0, -1).map((m: any) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  const query = currentMessageContent;

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
  const prompt = `You are a Senior Cloud Support Engineer. Your goal is to help users resolve technical infrastructure issues using ONLY the provided context.

CRITICAL RULES:
1.  **Strict Context Adherence**: Answer ONLY using the information in the "Context" section below. Do not use outside knowledge or information from the internet to answer technical questions.
2.  **No Hallucinations**: If the answer is not in the context, state clearly: "I cannot find information about this in the knowledge base." Do not invent steps or facts.
3.  **Intelligent Interpretation**: Use your general understanding of cloud terminology to interpret "twisted", vague, or non-standard user queries and map them to the correct concepts in the context.
4.  **Adaptability**: If the user asks to "make it easier", "explain like I'm 5", or simplify, you MUST comply by using simpler language and analogies, BUT the technical facts and steps must still come strictly from the context.
5.  **Tone**: Professional, empathetic, and authoritative.

RESPONSE STRUCTURE:
1.  **Acknowledge**: Briefly acknowledge the user's specific issue.
2.  **Root Cause**: Explain *why* this is happening, based on the context.
3.  **Solution**: Provide clear, numbered, step-by-step instructions. Use code blocks for commands.
4.  **Verification**: Explain how to verify the fix.

Context:
${context}

User Question: ${query}

Respond according to the rules above.`;
  console.log("PROMPT PREVIEW:", prompt.slice(0, 200) + "...");

  const chat = model.startChat({
    history: history,
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const result = await chat.sendMessageStream(prompt);
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
