import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";
import { AppSchema } from "./reasoning";
import { AuditResult } from "./auditor";
import { withRetry, extractJson } from "./utils";
import { callOpenRouter } from "./openrouter";



const rulesSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    rules: {
      type: SchemaType.STRING,
      description: "The complete, raw Firebase Security Rules (version 2) code block.",
    },
    reasoning: {
      type: SchemaType.STRING,
      description: "A short explanation of the key security decisions made.",
    }
  },
  required: ["rules", "reasoning"],
};

export class AgentF {
  private model: any;
  private modelName: string;

  constructor(modelName: string = "gemini-2.5-flash", requestOptions?: any) {
    this.modelName = modelName;
    if (!modelName.includes("/")) {
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
      this.model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { 
          temperature: 0.0,
          responseMimeType: "application/json",
          responseSchema: rulesSchema
        }
      }, requestOptions || { apiVersion: "v1beta" });
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
    `;

    try {
      return await withRetry(async () => {
        let text: string;
        if (this.modelName.includes("/")) {
          text = await callOpenRouter(this.modelName, [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Generate the Firebase Security Rules based on the schema and feedback context. Output MUST be valid JSON with 'rules' and 'reasoning' keys." }
          ]);
        } else {
          const result = await this.model.generateContent(systemPrompt);
          const response = await result.response;
          text = response.text();
        }
        
        const jsonStr = extractJson(text, ['"rules"', '"reasoning"']);

        try {
          const parsed = JSON.parse(jsonStr);
          return parsed.rules || jsonStr; 
        } catch (e) {
          // Fallback if parsing fails
          console.warn("[AgentF] JSON parse failed, falling back to raw output.");
          const codeMatch = text.match(/\`\`\`(?:firebase|firestore|rules)?\\s*([\\s\\S]*?)\\s*\`\`\`/i);
          if (codeMatch) {
            return codeMatch[1].trim();
          }
          return text.replace(/\`\`\`[a-z]*\\n/g, "").replace(/\\n\`\`\`/g, "").trim();
        }
      });
    } catch (error: any) {
      console.error("[AgentF] Generation failed:", error);
      throw new Error(`Security rule generation failure: ${error.message}`);
    }
  }

  async improveRules(
    existingRules: string,
    auditFindings: AuditResult,
    schema: AppSchema,
    context: string
  ): Promise<{ rules: string; improvements: string[] }> {
    const systemPrompt = `
      You are Agent F, the Elite Security Engineer. Your task is to IMPROVE existing Firebase Security Rules.
      
      CRITICAL INSTRUCTIONS:
      1. PRESERVE existing valid patterns — don't rewrite from scratch.
      2. FIX all vulnerabilities identified in the audit findings below.
      3. ADD missing security checks (data validation, ownership binding, field type checks).
      4. REMOVE any dangerous patterns (broad wildcards, "if true", auth-only without ownership).
      5. Ensure rules_version = '2' is present.
      6. Break "write" into granular "create", "update", "delete" where possible.
      
      EXISTING RULES:
      ${existingRules}
      
      AUDIT FINDINGS (vulnerabilities to fix):
      ${JSON.stringify(auditFindings.vulnerabilities, null, 2)}
      Audit Score: ${auditFindings.score}/100 (higher is better, 90-100 is secure)
      Audit Critique: ${auditFindings.critique}
      
      INFERRED SCHEMA: ${JSON.stringify(schema)}
      
      ADDITIONAL CONTEXT: ${context}
      
      OUTPUT FORMAT (strict JSON):
      {
        "rules": "The complete improved Firebase Security Rules code",
        "improvements": [
          "Fixed: [description of what was changed and why]",
          "Added: [description of new security check]",
          "Removed: [description of dangerous pattern removed]"
        ]
      }
    `;

    try {
      return await withRetry(async () => {
        let text: string;
        if (this.modelName.includes("/")) {
          text = await callOpenRouter(this.modelName, [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Improve the Firebase Security Rules based on the audit findings and context. Output MUST be valid JSON with 'rules' and 'improvements' keys." }
          ]);
        } else {
          const result = await this.model.generateContent(systemPrompt);
          const response = await result.response;
          text = response.text();
        }

        const jsonStr = extractJson(text, ['"rules"', '"improvements"']);

        try {
          const parsed = JSON.parse(jsonStr);
          return {
            rules: parsed.rules || existingRules,
            improvements: parsed.improvements || ["Unable to parse improvement details"]
          };
        } catch (e) {
          console.warn("[AgentF] improveRules JSON parse failed, extracting rules from raw output.");
          // Try to extract rules block
          const rulesMatch = text.match(/rules_version\s*=\s*['"]2['"][\s\S]*$/m);
          return {
            rules: rulesMatch ? rulesMatch[0] : existingRules,
            improvements: ["Rules were improved but detailed changes could not be parsed"]
          };
        }
      });
    } catch (error: any) {
      console.error("[AgentF] Improvement failed:", error);
      throw new Error(`Security rule improvement failure: ${error.message}`);
    }
  }
}
