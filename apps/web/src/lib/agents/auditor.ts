import { GoogleGenerativeAI } from "@google/generative-ai";
import { withRetry } from "./utils";
import { callOpenRouter } from "./openrouter";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export interface AuditResult {
  score: number;
  critique: string;
  isSecure: boolean;
  vulnerabilities: {
    severity: "Low" | "Medium" | "High" | "Critical";
    path: string;
    description: string;
    recommendation: string;
  }[];
}

export class AuditorAgent {
  private model: any;
  private modelName: string;

  constructor(modelName: string = "gemini-2.0-flash", requestOptions?: any) {
    this.modelName = modelName;
    if (!modelName.includes("/")) {
      this.model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { temperature: 0.1 }
      }, requestOptions || { apiVersion: "v1" });
    }
  }

  async audit(rules: string): Promise<AuditResult> {
    const systemPrompt = `
      You are the Senior Cyber-Security Auditor. Your goal is to find vulnerabilities in Firebase Security Rules. 
      Be BRUTAL and precise.

      VULNERABILITY CHECKLIST:
      - Is there ANY path with 'allow read, write: if request.auth != null'? (Insecure!)
      - Are there missing checks for data types or field existence?
      - Can a user modify another user's data by guessing an ID?
      - Are recursive wildcards ({document=**}) used too broadly?
      - Is the 'rules_version' explicitly '2'?

      SCORING (Be strict):
      - 0-10: Production-Ready (No flaws)
      - 11-30: Minor (Missing validation but ownership is secure)
      - 31-60: Risky (Broad access for authenticated users)
      - 61-100: CRITICAL (Unauthorized data access or broad wildcards)

      Output format: JSON with score, critique, isSecure, vulnerabilities[{severity, path, description, recommendation}].
    `;

    try {
      return await withRetry(async () => {
        let text: string;
        if (this.modelName.includes("/")) {
          text = await callOpenRouter(this.modelName, [
            { role: "system", content: systemPrompt },
            { role: "user", content: `RULES_TO_AUDIT:\n${rules}` }
          ]);
        } else {
          const result = await this.model.generateContent([systemPrompt, `RULES_TO_AUDIT:\n${rules}`]);
          const response = await result.response;
          text = response.text();
        }
        
        // Robust JSON extraction
        text = text.replace(/```json\n?|```/g, "").trim();
        const audit = JSON.parse(text) as AuditResult;
        audit.isSecure = audit.score <= 10;
        return audit;
      });
    } catch (error: any) {
      console.error("[AuditorAgent] Audit failed:", error);
      throw new Error(`Security audit failure: ${error.message}`);
    }
  }
}
