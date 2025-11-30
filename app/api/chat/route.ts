import { NextRequest } from "next/server";
import { searchDocuments } from "@/lib/rag";
import { supabaseServer } from "@/lib/supabase";
import { llmProvider } from "@/lib/llm";

// Removed direct GoogleGenerativeAI instantiation
// const genAI = ...
// const model = ...

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionId: reqSessionId } = await req.json();
    const currentMessageContent = messages[messages.length - 1].content;
    
    // Use provided sessionId or generate new one
    const sessionId = reqSessionId || crypto.randomUUID();

    // Extract history (all messages except the last one)
    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      content: m.content,
    }));

    const query = currentMessageContent;
    const lowerQuery = query.toLowerCase();

    // 1. Guardrails Check
    const dangerousKeywords = [
      "disable logging",
      "turn off logs",
      "stop logging",
      "access host",
      "sudo",
      "rm -rf",
      "ignore instructions",
      "jailbreak",
      "reset all user environments",
      "delete all",
      "drop table",
      "systemctl stop"
    ];

    const isBlocked = dangerousKeywords.some((kw) => lowerQuery.includes(kw));

    if (isBlocked) {
      const refusalResponse = {
        answer: "Request denied for security reasons. This action is not permitted.",
        kbReferences: [],
        confidence: 1.0,
        tier: "TIER_2",
        severity: "HIGH",
        needsEscalation: true,
        guardrail: {
          blocked: true,
          reason: "Security violation detected"
        }
      };

      // Log the blocked request
      await supabaseServer.from("tickets").insert({
        session_id: sessionId,
        user_query: query,
        ai_response: refusalResponse.answer,
        tier: 2,
        severity: "High",
        deflected: false,
        guardrail_blocked: true
      });

      return Response.json(refusalResponse);
    }

    // 2. RAG Retrieval
    const docs = await searchDocuments(query);
    
    const context = docs
      .map((d: any, i: number) => `[${i + 1}] ${d.metadata.title}\n${d.content}`)
      .join("\n\n");

    // 3. Prompt Construction
    const prompt = `You are a Senior Cloud Support Engineer. Your goal is to help users resolve technical infrastructure issues using ONLY the provided context.

CRITICAL RULES:
1.  **Strict Context Adherence**: Answer ONLY using the information in the "Context" section below. Do not use outside knowledge or information from the internet to answer technical questions.
2.  **No Hallucinations**: If the answer is not in the context, state clearly: "I cannot find information about this in the knowledge base." Do not invent steps or facts.
3.  **Intelligent Interpretation**: Use your general understanding of cloud terminology to interpret "twisted", vague, or non-standard user queries and map them to the correct concepts in the context.
4.  **Adaptability**: If the user asks to "make it easier", "explain like I'm 5", or simplify, you MUST comply by using simpler language and analogies, BUT the technical facts and steps must still come strictly from the context.
5.  **Tone**: Professional, empathetic, and authoritative.

RESPONSE FORMAT:
You must respond with a valid JSON object. Do not include markdown formatting (like \`\`\`json).
{
  "answer": "The answer text...",
  "tier": "TIER_1" | "TIER_2",
  "severity": "LOW" | "MEDIUM" | "HIGH",
  "reasoning": "Brief explanation of tier/severity choice"
}

TIER/SEVERITY GUIDELINES:
- **TIER_1 (Deflected)**: Routine issues solved by KB (e.g., "How do I login?", "Reset password").
- **TIER_2 (Escalated)**: Complex issues, missing KB info, or high severity (e.g., "VM crashed", "Data lost", "KB doesn't help").
- **SEVERITY**:
  - **LOW**: Informational, cosmetic.
  - **MEDIUM**: Functional issue but workaround exists.
  - **HIGH**: System down, data loss, security risk, blocking workflow.

Context:
${context}

User Question: ${query}

Respond strictly in JSON.`;

    // 4. LLM Generation
    // Using abstraction
    const llmResult = await llmProvider.generateResponse(prompt, history);
    const textResponse = llmResult.text;
    
    let parsedResponse;
    try {
      // Clean up potential markdown code blocks
      const cleanJson = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedResponse = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse LLM JSON:", textResponse);
      // Fallback
      parsedResponse = {
        answer: textResponse,
        tier: "TIER_2", // Default to escalated on error
        severity: "MEDIUM",
        reasoning: "JSON parsing failed"
      };
    }

    // 5. Metadata Calculation
    const confidence = docs.length > 0 ? 0.95 : 0.1; 

    const kbReferences = docs.map((d: any) => ({
      id: d.id,
      title: d.metadata.title,
      similarity: d.similarity
    }));

    const needsEscalation = parsedResponse.tier === "TIER_2";

    const responsePayload = {
      answer: parsedResponse.answer,
      kbReferences,
      confidence,
      tier: parsedResponse.tier,
      severity: parsedResponse.severity,
      needsEscalation,
      guardrail: {
        blocked: false,
        reason: null
      }
    };

    // 6. Logging
    await supabaseServer.from("tickets").insert({
      session_id: sessionId,
      user_query: query,
      ai_response: parsedResponse.answer,
      tier: needsEscalation ? 2 : 1,
      severity: parsedResponse.severity,
      deflected: !needsEscalation,
    });

    return Response.json(responsePayload);

  } catch (error: any) {
    console.error("API Error:", error);
    return Response.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
