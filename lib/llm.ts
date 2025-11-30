import { GoogleGenerativeAI } from "@google/generative-ai";

export interface LLMResponse {
  text: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

// Abstraction interface
export interface LLMProvider {
  generateResponse(prompt: string, history: ChatMessage[]): Promise<LLMResponse>;
  getEmbedding(text: string): Promise<number[]>;
}

// Gemini Implementation
class GeminiProvider implements LLMProvider {
  private model: any;
  private embeddingModel: any;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });
    this.embeddingModel = genAI.getGenerativeModel({
      model: "text-embedding-004",
    });
  }

  async generateResponse(prompt: string, history: ChatMessage[]): Promise<LLMResponse> {
    const formattedHistory = history.map(m => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    const chat = this.model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(prompt);
    return { text: result.response.text() };
  }

  async getEmbedding(text: string): Promise<number[]> {
    const res = await this.embeddingModel.embedContent(text);
    return res.embedding.values;
  }
}

// Factory/Singleton
export const llmProvider: LLMProvider = new GeminiProvider(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
