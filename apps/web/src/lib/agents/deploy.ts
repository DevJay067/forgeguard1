import { GoogleGenerativeAI } from "@google/generative-ai";
import { callOpenRouter } from "./openrouter";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export interface DeploymentPlan {
  service: string;
  ruleCount: number;
  safetyChecks: string[];
  deploymentCommand: string;
}

export class DeployAgent {
  private model: any;
  private modelName: string;

  constructor(modelName: string = "gemini-2.0-flash", requestOptions?: any) {
    this.modelName = modelName;
    if (!modelName.includes("/")) {
      this.model = genAI.getGenerativeModel({ model: modelName }, requestOptions || { apiVersion: "v1" });
    }
  }

  async planDeployment(rules: string): Promise<DeploymentPlan> {
    const prompt = `
      You are the Deploy Agent for ForgeGuard.
      Analyze these Firebase Security Rules and generate a deployment plan.
      Rules:
      ${rules}
      
      Output format:
      {
        "service": "firestore|storage|database",
        "ruleCount": number,
        "safetyChecks": ["string"],
        "deploymentCommand": "firebase deploy --only firestore:rules"
      }
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
      const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || "{}";
      return JSON.parse(jsonStr) as DeploymentPlan;
    } catch (e) {
      console.error("Deployment planning failed:", e);
      return {
        service: "unknown",
        ruleCount: 0,
        safetyChecks: ["Manual verification required"],
        deploymentCommand: "firebase deploy"
      };
    }
  }
}
