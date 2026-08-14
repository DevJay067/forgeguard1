import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Schema, SchemaType } from "@google/generative-ai";
import { withRetry } from "./utils";
import { callOpenRouter } from "./openrouter";

export interface AppSchema {
  entities: {
    name: string;
    fields: string[];
    accessPatterns: string[];
    ownerField?: string;
  }[];
  relationships: string[];
  riskProfile: "Low" | "Medium" | "High";
  technicalConstraints: string[];
}

const appSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    entities: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          fields: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
          },
          accessPatterns: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
          },
          ownerField: { type: SchemaType.STRING }
        },
        required: ["name", "fields", "accessPatterns"]
      }
    },
    relationships: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    },
    riskProfile: {
      type: SchemaType.STRING,
      description: 'Must be one of "Low", "Medium", or "High"'
    },
    technicalConstraints: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    }
  },
  required: ["entities", "relationships", "riskProfile", "technicalConstraints"]
};

export class ReasoningAgent {
  private model: any;
  private modelName: string;

  constructor(modelName: string = "gemini-2.5-flash", requestOptions?: any) {
    this.modelName = modelName;
    if (!modelName.includes("/")) {
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
      this.model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: 0.1,
          topP: 0.95,
          responseMimeType: "application/json",
          responseSchema: appSchema
        },
      }, requestOptions || { apiVersion: "v1beta" });
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
        let jsonStr = text;
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
        if (jsonMatch) {
          jsonStr = jsonMatch[1];
        } else {
          const firstBrace = text.indexOf('{');
          const lastBrace = text.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonStr = text.substring(firstBrace, lastBrace + 1);
          }
        }

        // Clean up common JSON issues from LLMs
        jsonStr = jsonStr.trim()
          .replace(/^[^{]*/, "")
          .replace(/[^}]*$/, "");

        try {
          return JSON.parse(jsonStr) as AppSchema;
        } catch (parseError: any) {
          console.warn("[ReasoningAgent] JSON parse failed, attempting aggressive cleanup:", parseError.message);
          
          const cleanedJson = jsonStr
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
            .replace(/\\'/g, "'")
            .replace(/\\(?!"|\\|\/|b|f|n|r|t|u)/g, "\\\\");

          try {
            return JSON.parse(cleanedJson) as AppSchema;
          } catch (secondError: any) {
            console.error("[ReasoningAgent] Final JSON parse failed:", secondError.message);
            throw new Error(`Failed to parse architectural schema: ${secondError.message}`);
          }
        }
      });
    } catch (error: any) {
      console.error("[ReasoningAgent] Failed:", error);
      throw new Error(`Architectural reasoning failure: ${error.message}`);
    }
  }
}
