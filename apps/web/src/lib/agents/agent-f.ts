import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppSchema } from "./reasoning";
import { withRetry } from "./utils";
import { callOpenRouter } from "./openrouter";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export class AgentF {
  private model: any;
  private modelName: string;

  constructor(modelName: string = "gemini-2.0-flash", requestOptions?: any) {
    this.modelName = modelName;
    if (!modelName.includes("/")) {
      this.model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { temperature: 0.2, topP: 0.8 }
      }, requestOptions || { apiVersion: "v1" });
    }
  }

  async generateRules(schema: AppSchema, context: string): Promise<string> {
    const systemPrompt = `
      You are Agent F, the Elite Security Engineer. Your task is to generate production-grade, bulletproof Firebase Security Rules (version 2).
      
      CORE MANDATES:
      1. Least Privilege: Never allow access by default.
      2. Granularity: Break down "write" into "create", "update", and "delete".
      3. Identity Binding: Use request.auth.uid rigorously. 
      4. Data Validation: For 'create/update', ensure incoming data (request.resource.data) contains required fields and valid types.
      5. Resource Ownership: Verify that the document being modified belongs to the requester.
      6. No 'if true' or broad wildcards.

      SCHEMA CONTEXT: ${JSON.stringify(schema)}
      FEEDBACK FROM PREVIOUS AUDIT: ${context}

      Output ONLY valid rules_version = '2' code. Include concise comments explaining complex logic.
    `;

    try {
      return await withRetry(async () => {
        let text: string;
        if (this.modelName.includes("/")) {
          text = await callOpenRouter(this.modelName, [
            { role: "system", content: systemPrompt }
          ]);
        } else {
          const result = await this.model.generateContent(systemPrompt);
          const response = await result.response;
          text = response.text();
        }
        return text.replace(/```[a-z]*\n/g, "").replace(/\n```/g, "").trim();
      });
    } catch (error: any) {
      console.error("[AgentF] Generation failed:", error);
      throw new Error(`Security rule generation failure: ${error.message}`);
    }
  }
}
