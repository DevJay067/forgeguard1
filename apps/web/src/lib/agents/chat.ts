import { GoogleGenerativeAI } from "@google/generative-ai";
import { withRetry } from "./utils";
import { callOpenRouter } from "./openrouter";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
const FALLBACK_MODELS = ["gemini-1.5-flash", "google/gemma-4-26b-a4b-it:free", "gemini-2.0-flash"];

export class ChatAgent {
  private model: any;
  private modelName: string;
  private options: any;

  constructor(modelName: string = "gemini-2.0-flash", requestOptions?: any) {
    this.modelName = modelName;
    this.options = requestOptions || { apiVersion: "v1" };
    this.initModel(modelName, this.options);
  }

  private initModel(name: string, options: any) {
    if (!name.includes("/")) {
      this.model = genAI.getGenerativeModel({ 
        model: name,
        generationConfig: { temperature: 0.7 }
      }, options);
    }
  }

  async chat(message: string, context: any): Promise<string> {
    const simplifiedContext = context ? {
      entities: context.schema?.entities?.map((e: any) => e.name),
      ruleCount: (context.rules?.match(/allow/g) || []).length,
      auditScore: context.audit?.score,
      vulnerabilities: context.audit?.vulnerabilities?.length
    } : "None";

    const systemPrompt = `
      You are the **ForgeGuard Engineering Lead**, a Senior Development Lead and Security Architect. 
      Your task is to provide pragmatic, authoritative, and architecture-first advice on security and system design.

      ORCHESTRATION CONTEXT:
      ${JSON.stringify(simplifiedContext, null, 2)}

      GUIDELINES:
      1. **Act as a Senior Lead**: Provide technical mentorship. Explain the "why" behind security and architectural decisions.
      2. **Use Rich Markdown**: Heavily utilize bolding for key terms, bullet points for lists, and code blocks (with syntax highlighting) for code examples.
      3. **Contextual Analysis**: Reference the user's specific entities, rule counts, and vulnerability scores from the ORCHESTRATION CONTEXT.
      4. **Proactive Engineering**: Don't just answer; suggest the next best engineering or security practice (e.g., "The next step is to implement rate limiting for this entity").
      5. If the context is "None", guide them to start a new generation on the Orchestrator dashboard to establish a security baseline.
    `;

    const attemptChat = async (mName: string, modelObj: any) => {
      if (mName.includes("/")) {
        return await callOpenRouter(mName, [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ]);
      } else {
        const result = await modelObj.generateContent([systemPrompt, message]);
        const response = await result.response;
        return response.text();
      }
    };

    try {
      return await withRetry(() => attemptChat(this.modelName, this.model));
    } catch (error: any) {
      const isQuotaError = error.message?.includes("429") || error.message?.includes("quota");
      const isOpenRouterError = error.message?.includes("OpenRouter error") || error.message?.includes("Provider returned error");

      if (isQuotaError || isOpenRouterError) {
        console.warn(`[ChatAgent] Resilience trigger (${isOpenRouterError ? "OpenRouter" : "Quota"}) on ${this.modelName}. Attempting fallback...`);
        for (const fallbackModel of FALLBACK_MODELS) {
          if (fallbackModel === this.modelName) continue;
          console.log(`[ChatAgent] Falling back to ${fallbackModel}...`);
          const fallbackOptions = fallbackModel.includes("pro") ? { apiVersion: "v1beta" } : { apiVersion: "v1" };
          this.initModel(fallbackModel, fallbackOptions);
          try {
            return await withRetry(() => attemptChat(fallbackModel, this.model));
          } catch (fallbackError) {
            console.warn(`[ChatAgent] Fallback to ${fallbackModel} failed.`);
          }
        }
      }
      throw error;
    }
  }
}
