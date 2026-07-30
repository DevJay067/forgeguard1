import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config({ path: "./.env" });

async function testGemini() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Hello, are you there?");
    console.log("Gemini Success:", await result.response.text());
  } catch (err: any) {
    console.error("Gemini Error:", err.message);
  }
}

testGemini();
