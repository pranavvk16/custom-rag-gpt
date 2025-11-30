import { GoogleGenerativeAI } from "@google/generative-ai";

// @ts-ignore
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

async function main() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(
    "10+2 is?"
  );
  console.log(result.response.text());
}

main().catch(console.error);
