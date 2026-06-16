import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { withRetry } from "./utils";
import { callOpenRouter } from "./openrouter";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export interface AppSchema {
  entities: {
    name: string;
    fields: string[];
    accessPatterns: string[];
  }[];
  relationships: string[];
  riskProfile: "Low" | "Medium" | "High";
  technicalConstraints: string[];
}

export class ReasoningAgent {
  private model: any;
  private modelName: string;

  constructor(modelName: string = "gemini-2.0-flash", requestOptions?: any) {
    this.modelName = modelName;
    if (!modelName.includes("/")) {
      this.model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: 0.1,
          topP: 0.95,
        },
      }, requestOptions || { apiVersion: "v1" });
    }
  }

  async reason(prompt: string): Promise<AppSchema> {
    const systemPrompt = `
      You are the Lead Solutions Architect for ForgeGuard. Your mission is to decompose high-level product concepts into high-fidelity JSON security schemas.
      
      ANALYSIS MANDATES:
      1. Identify all primary entities (collections) and sub-collections.
      2. For each entity, define EXACT access patterns (e.g., "Owner can CRUD", "Members can Read-only", "Public can Create if verified").
      3. Identify hidden relationships (e.g., "Is user part of the organization referenced in this document?").
      4. Assess the Risk Profile based on data sensitivity (PII, Financial, etc.).
      5. Note technical constraints like "Max 10 iterations per batch" or "Recursive delete requirements".

      OUTPUT SCHEMA:
      { 
        "entities": [
          { "name": "string", "fields": ["string"], "accessPatterns": ["string"], "ownerField": "string" }
        ], 
        "relationships": ["string"], 
        "riskProfile": "Low" | "Medium" | "High", 
        "technicalConstraints": ["string"] 
      }
    `;

    try {
      return await withRetry(async () => {
        let text: string;
        if (this.modelName.includes("/")) {
          text = await callOpenRouter(this.modelName, [
            { role: "system", content: systemPrompt },
            { role: "user", content: `PRODUCT_CONCEPT: ${prompt}` }
          ]);
        } else {
          const result = await this.model.generateContent([systemPrompt, `PRODUCT_CONCEPT: ${prompt}`]);
          const response = await result.response;
          text = response.text();
        }
        
        // Robust JSON extraction
        text = text.replace(/```json\n?|```/g, "").trim();
        return JSON.parse(text) as AppSchema;
      });
    } catch (error: any) {
      console.error("[ReasoningAgent] Failed:", error);
      throw new Error(`Architectural reasoning failure: ${error.message}`);
    }
  }
}
