import { GoogleGenerativeAI } from "@google/generative-ai";
import { callOpenRouter } from "./openrouter";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export class SimulatorAgent {
  private model: any;
  private modelName: string;

  constructor(modelName: string = "gemini-2.0-flash", requestOptions?: any) {
    this.modelName = modelName;
    if (!modelName.includes("/")) {
      this.model = genAI.getGenerativeModel({ model: modelName }, requestOptions || { apiVersion: "v1" });
    }
  }

  async simulateAttacks(rules: string): Promise<string[]> {
    const prompt = `
      You are the Simulator Agent for ForgeGuard.
      Given these Firebase Security Rules, generate 3 synthetic malicious queries 
      that try to bypass the security logic.
      
      Rules:
      ${rules}
      
      Output only the list of queries.
    `;

    try {
      let text: string;
      if (this.modelName.includes("/")) {
        text = await callOpenRouter(this.modelName, [
          { role: "user", content: prompt }
        ]);
      } else {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        text = response.text();
      }
      return text.split("\n").filter(line => line.trim().length > 0);
    } catch (e) {
      console.error("Simulation failed:", e);
      return ["Simulation unavailable"];
    }
  }
}
