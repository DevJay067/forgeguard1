import { GoogleGenerativeAI } from "@google/generative-ai";
import { withRetry } from "./utils";
import { callOpenRouter } from "./openrouter";
import { AttackVector } from "./validator";

export class SimulatorAgent {
  private model: any;
  private modelName: string;

  constructor(modelName: string = "gemini-2.5-flash", requestOptions?: any) {
    this.modelName = modelName;
    if (!modelName.includes("/")) {
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
      this.model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { temperature: 0.1 }
      }, requestOptions || { apiVersion: "v1beta" });
    }
  }

  /**
   * Resilience wrapper: If a 429/quota error is caught, automatically fallback to other models
   */
  private async withFallback<T>(fn: (modelName: string, modelObj: any) => Promise<T>): Promise<T> {
    let currentModel = this.modelName;
    let currentModelObj = this.model;

    try {
      return await fn(currentModel, currentModelObj);
    } catch (error: any) {
      console.warn(`[SimulatorAgent] Primary model evaluation failed on ${currentModel}: ${error.message || error}. Attempting resilience fallback...`);
      // Fallback models (prioritize free OpenRouter models then return to flash)
      const fallbacks = ["google/gemma-4-26b-a4b-it:free", "google/gemma-4-31b-it:free", "gemini-2.5-flash"];
      
      for (const fallbackModel of fallbacks) {
        if (fallbackModel === currentModel) continue;
        
        console.log(`[SimulatorAgent] Falling back to ${fallbackModel}...`);
        let fallbackModelObj = null;
        
        if (!fallbackModel.includes("/")) {
          const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
          fallbackModelObj = genAI.getGenerativeModel({ 
            model: fallbackModel, 
            generationConfig: { temperature: 0.1 } 
          }, { apiVersion: "v1beta" });
        }
        
        try {
          return await fn(fallbackModel, fallbackModelObj);
        } catch (fallbackError: any) {
          console.warn(`[SimulatorAgent] Fallback to ${fallbackModel} failed: ${fallbackError.message}`);
        }
      }
      throw error;
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
      return await this.withFallback<AttackVector[]>(async (modelName, modelObj) => {
        return await withRetry(async () => {
          let text: string;
          if (modelName.includes("/")) {
            text = await callOpenRouter(modelName, [
              { role: "user", content: prompt }
            ]);
          } else {
            const result = await modelObj.generateContent(prompt);
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
      });
    } catch (e) {
      console.error("[SimulatorAgent] Simulation failed:", e);
      return [];
    }
  }

  async generateTestSuite(rules: string): Promise<AttackVector[]> {
    const prompt = `
      You are the test suite generator for ForgeGuard.
      Given these Firebase Firestore Security Rules, generate a comprehensive suite of 5 custom test cases to thoroughly verify their correctness.
      The suite must include:
      - 2 positive test cases (authorized operations that SHOULD be allowed).
      - 2 negative test cases (unauthorized operations that SHOULD be blocked).
      - 1 edge case (boundary check, role verification, or data validation check).
      
      Rules:
      ${rules}
      
      Output MUST be a JSON array of objects conforming to this schema:
      [
        {
          "description": "Short, clear description of what this test case verifies (e.g. 'Allow read for post author')",
          "auth": { "uid": "author_123", "email_verified": true } or null for unauthenticated requests,
          "path": "/databases/$(database)/documents/posts/post_abc",
          "operation": "get" | "create" | "update" | "delete",
          "data": { "title": "Hello", "authorId": "author_123" } or null/omitted if no write payload,
          "expectedOutcome": "allowed" | "blocked"
        }
      ]
      
      Ensure paths are valid Firestore paths starting with '/databases/$(database)/documents/'.
      Output ONLY valid JSON. No markdown wrapper.
    `;

    try {
      return await this.withFallback<AttackVector[]>(async (modelName, modelObj) => {
        return await withRetry(async () => {
          let text: string;
          if (modelName.includes("/")) {
            text = await callOpenRouter(modelName, [
              { role: "user", content: prompt }
            ]);
          } else {
            const result = await modelObj.generateContent(prompt);
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
      });
    } catch (e) {
      console.error("[SimulatorAgent] Test suite generation failed:", e);
      return [];
    }
  }

  async simulateEvaluation(rules: string, testCase: AttackVector): Promise<{ 
    actualOutcome: "allowed" | "blocked"; 
    explanation: string; 
    traceTable?: { step: number; operation: string; condition: string; result: string; details: string }[] 
  }> {
    const prompt = `
      You are the Live Firestore Rules Simulator for ForgeGuard.
      Evaluate the following requested operation against these Firebase Security Rules:
      
      Rules:
      ${rules}
      
      Requested Operation:
      - Description: ${testCase.description}
      - Path: ${testCase.path}
      - Operation: ${testCase.operation}
      - Auth State (request.auth): ${JSON.stringify(testCase.auth)}
      - Request Data (request.resource.data): ${JSON.stringify(testCase.data || {})}
      
      MANDATE:
      Analyze the security rules, trace how the operations are evaluated step-by-step under the specified authentication and resource states. Identify the exact match block, allow statement, and conditions that govern the path.
      
      Output MUST be a JSON object with this exact schema:
      {
        "actualOutcome": "allowed" | "blocked",
        "explanation": "Summary explanation of the final decision.",
        "traceTable": [
          {
            "step": 1,
            "operation": "PATH_MATCH" | "AUTH_CHECK" | "DATA_VALIDATION" | "RULE_DECISION" | "ERROR",
            "condition": "The path match expression, rules function or boolean rule condition being evaluated (e.g. '/users/{userId}', 'request.auth != null')",
            "result": "MATCH" | "MISMATCH" | "TRUE" | "FALSE" | "ALLOWED" | "BLOCKED" | "ERROR",
            "details": "Details about bindings or calculations (e.g. 'userId bound to \"user_123\"', 'request.auth.uid is \"user_abc\"')"
          }
        ]
      }
      
      Output ONLY valid JSON. No markdown formatting.
    `;

    try {
      return await this.withFallback<{ 
        actualOutcome: "allowed" | "blocked"; 
        explanation: string; 
        traceTable?: { step: number; operation: string; condition: string; result: string; details: string }[] 
      }>(async (modelName, modelObj) => {
        return await withRetry(async () => {
          let text: string;
          if (modelName.includes("/")) {
            text = await callOpenRouter(modelName, [
              { role: "user", content: prompt }
            ]);
          } else {
            const result = await modelObj.generateContent(prompt);
            const response = await result.response;
            text = response.text();
          }
          
          let jsonStr = text.replace(/```json/gi, "").replace(/```/g, "").trim();
          const firstBrace = jsonStr.indexOf('{');
          const lastBrace = jsonStr.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
          }

          return JSON.parse(jsonStr);
        });
      });
    } catch (e: any) {
      console.error("[SimulatorAgent] Rule evaluation simulation failed:", e);
      return {
        actualOutcome: "blocked",
        explanation: `AI Simulation failed to execute: ${e.message}`,
        traceTable: [
          {
            step: 1,
            operation: "ERROR",
            condition: "AI Simulation run",
            result: "ERROR",
            details: e.message
          }
        ]
      };
    }
  }

  async repairRules(rules: string, failedCases: any[]): Promise<{ rules: string; reasoning: string }> {
    const prompt = `
      You are the Elite Security Rules Auto-Repair Agent for ForgeGuard.
      Given these existing Firebase Security Rules, and a list of failed test cases, fix the rules so that all test cases pass.
      
      RULES TO REPAIR:
      ${rules}
      
      FAILED TEST CASES:
      ${JSON.stringify(failedCases, null, 2)}
      
      INSTRUCTIONS:
      1. Carefully analyze why each test case failed. (e.g. if a test case expected 'allowed' but got 'blocked', identify which permission constraint or path mismatch blocked it, and fix it).
      2. If there are case-sensitivity issues in paths (e.g. '/User' vs '/users'), align the paths to match the test cases.
      3. Make the minimal necessary changes to make the tests pass. Do not introduce new security vulnerabilities.
      4. Ensure the rules remain secure and don't allow broad 'if true' access.
      5. Make sure the returned rules are valid Firebase Security Rules syntax (version 2).
      
      Output MUST be a JSON object conforming to this schema:
      {
        "rules": "The complete fixed Firebase Security Rules code",
        "reasoning": "A concise explanation of the changes made to fix the rules"
      }
      
      Output ONLY valid JSON. No markdown wrapper.
    `;

    try {
      return await this.withFallback<{ rules: string; reasoning: string }>(async (modelName, modelObj) => {
        return await withRetry(async () => {
          let text: string;
          if (modelName.includes("/")) {
            text = await callOpenRouter(modelName, [
              { role: "user", content: prompt }
            ]);
          } else {
            const result = await modelObj.generateContent(prompt);
            const response = await result.response;
            text = response.text();
          }
          
          let jsonStr = text.replace(/```json/gi, "").replace(/```/g, "").trim();
          const firstBrace = jsonStr.indexOf('{');
          const lastBrace = jsonStr.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
          }

          return JSON.parse(jsonStr) as { rules: string; reasoning: string };
        });
      });
    } catch (e: any) {
      console.error("[SimulatorAgent] Rule repair failed:", e);
      throw new Error(`Rules repair failed: ${e.message}`);
    }
  }
}
