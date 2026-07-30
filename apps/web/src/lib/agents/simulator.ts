import { GoogleGenerativeAI } from "@google/generative-ai";
import { withRetry } from "./utils";
import { callOpenRouter } from "./openrouter";
import { AttackVector } from "./validator";



export class SimulatorAgent {
  private model: any;
  private modelName: string;

  constructor(modelName: string = "gemini-2.0-flash", requestOptions?: any) {
    this.modelName = modelName;
    if (!modelName.includes("/")) {
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
      this.model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { temperature: 0.1 }
      }, requestOptions || { apiVersion: "v1" });
    }
  }

  async simulateAttacks(rules: string): Promise<AttackVector[]> {
    const prompt = `
      You are the Simulator Agent for ForgeGuard.
      Given these Firebase Security Rules, generate 3 synthetic malicious test cases 
      that try to bypass the security logic, as well as 2 legitimate test cases that should be allowed.
      
      Rules:
      ${rules}
      
      Output MUST be a JSON array of objects conforming to this schema:
      [
        {
          "description": "Short description of the test case",
          "auth": { "uid": "user123" } or null for unauthenticated,
          "path": "users/user123",
          "operation": "get" | "create" | "update" | "delete",
          "data": { "optional": "payload for create/update" },
          "expectedOutcome": "allowed" | "blocked"
        }
      ]
      
      Output ONLY valid JSON.
    `;

    try {
      return await withRetry(async () => {
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
        
        let jsonStr = text.replace(/```json/gi, "").replace(/```/g, "").trim();
        const firstBracket = jsonStr.indexOf('[');
        const lastBracket = jsonStr.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) {
          jsonStr = jsonStr.substring(firstBracket, lastBracket + 1);
        }

        return JSON.parse(jsonStr) as AttackVector[];
      });
    } catch (e) {
      console.error("[SimulatorAgent] Simulation failed:", e);
      return [];
    }
  }
}
