import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config({ path: "./.env" });

async function testGemini() {
  const models = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
  ];
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
  for (const modelName of models) {
    try {
      console.log(`Testing model: ${modelName} with v1beta...`);
      const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: "v1beta" });
      const result = await model.generateContent("Hello, are you there?");
      console.log(`Success for ${modelName}:`, (await result.response.text()).substring(0, 100));
    } catch (err: any) {
      console.error(`Error for ${modelName} (v1beta):`, err.message);
    }

    try {
      console.log(`Testing model: ${modelName} with v1...`);
      const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: "v1" });
      const result = await model.generateContent("Hello, are you there?");
      console.log(`Success for ${modelName}:`, (await result.response.text()).substring(0, 100));
    } catch (err: any) {
      console.error(`Error for ${modelName} (v1):`, err.message);
    }
  }
}

testGemini();

