import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";
import { withRetry } from "./utils";
import { callOpenRouter } from "./openrouter";



const auditSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    score: { type: SchemaType.INTEGER },
    critique: { type: SchemaType.STRING },
    isSecure: { type: SchemaType.BOOLEAN },
    vulnerabilities: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          severity: { type: SchemaType.STRING, description: 'Must be one of "Low", "Medium", "High", or "Critical"' },
          path: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          recommendation: { type: SchemaType.STRING }
        },
        required: ["severity", "path", "description", "recommendation"]
      }
    }
  },
  required: ["score", "critique", "isSecure", "vulnerabilities"]
};

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
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
      this.model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { 
          temperature: 0.0,
          responseMimeType: "application/json",
          responseSchema: auditSchema
        }
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
      - 90-100: Production-Ready (No flaws)
      - 70-89: Minor Issues (Missing data validation but ownership is secure)
      - 40-69: Risky (Broad read/write access for authenticated users)
      - 0-39: CRITICAL (Unauthorized data access or broad recursive wildcards)

      Output format: JSON with score, critique, isSecure, vulnerabilities[{severity, path, description, recommendation}].
    `;

    try {
      return await withRetry(async () => {
        let text: string;
        if (this.modelName.includes("/")) {
          text = await callOpenRouter(this.modelName, [
            { role: "system", content: systemPrompt },
            { role: "user", content: `RULES_TO_AUDIT:\n${rules}\n\nOutput MUST be valid JSON.` }
          ]);
        } else {
          const result = await this.model.generateContent([systemPrompt, `RULES_TO_AUDIT:\n${rules}`]);
          const response = await result.response;
          text = response.text();
        }
        
        let jsonStr = text.replace(/```json/gi, "").replace(/```/g, "").trim();
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }

        try {
          const audit = JSON.parse(jsonStr) as AuditResult;
          audit.isSecure = audit.score >= 90;
          return audit;
        } catch (parseError: any) {
          console.warn("[AuditorAgent] JSON parse failed, attempting aggressive cleanup:", parseError.message);
          
          // Aggressive cleanup for "Bad escaped character" and other common issues
          const cleanedJson = jsonStr
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
            .replace(/\\'/g, "'") // Fix escaped single quotes (invalid in JSON)
            .replace(/\\(?!"|\\|\/|b|f|n|r|t|u)/g, "\\\\"); // Fix single backslashes

          try {
            const audit = JSON.parse(cleanedJson) as AuditResult;
            audit.isSecure = audit.score >= 90;
            return audit;
          } catch (secondError: any) {
            console.error("[AuditorAgent] Final JSON parse failed:", secondError.message);
            throw new Error(`Failed to parse security audit: ${secondError.message}. Content: ${jsonStr.substring(0, 100)}...`);
          }
        }
      });
    } catch (error: any) {
      console.error("[AuditorAgent] Audit failed:", error);
      throw new Error(`Security audit failure: ${error.message}`);
    }
  }
}
