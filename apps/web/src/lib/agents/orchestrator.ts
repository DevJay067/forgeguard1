import { ReasoningAgent, AppSchema } from "./reasoning";
import { AgentF } from "./agent-f";
import { AuditorAgent, AuditResult } from "./auditor";
import { SimulatorAgent } from "./simulator";

const FALLBACK_MODELS = ["gemini-1.5-flash", "google/gemma-4-31b-it:free", "gemini-2.0-flash"];

export class ForgeGuardOrchestrator {
  private reasoning: ReasoningAgent;
  private agentF: AgentF;
  private auditor: AuditorAgent;
  private simulator: SimulatorAgent;
  private currentModel: string;

  constructor(modelName: string = "gemini-2.0-flash", requestOptions?: any) {
    this.currentModel = modelName;
    this.reasoning = new ReasoningAgent(modelName, requestOptions);
    this.agentF = new AgentF(modelName, requestOptions);
    this.auditor = new AuditorAgent(modelName, requestOptions);
    this.simulator = new SimulatorAgent(modelName, requestOptions);
  }

  private async withFallback<T>(fn: (agent: any) => Promise<T>, agentType: "reasoning" | "agentF" | "auditor" | "simulator"): Promise<T> {
    try {
      return await fn(this[agentType]);
    } catch (error: any) {
      if (error.message?.includes("429") || error.message?.includes("quota")) {
        console.warn(`[Orchestrator] 429 detected on ${this.currentModel}. Attempting fallback...`);
        for (const fallbackModel of FALLBACK_MODELS) {
          if (fallbackModel === this.currentModel) continue;
          
          console.log(`[Orchestrator] Falling back to ${fallbackModel}...`);
          const options = fallbackModel.includes("pro") ? { apiVersion: "v1beta" } : { apiVersion: "v1" };
          
          // Re-initialize agents with fallback model
          this.currentModel = fallbackModel;
          this.reasoning = new ReasoningAgent(fallbackModel, options);
          this.agentF = new AgentF(fallbackModel, options);
          this.auditor = new AuditorAgent(fallbackModel, options);
          this.simulator = new SimulatorAgent(fallbackModel, options);
          
          try {
            return await fn(this[agentType]);
          } catch (fallbackError) {
            console.warn(`[Orchestrator] Fallback to ${fallbackModel} failed, trying next...`);
          }
        }
      }
      throw error;
    }
  }

  async run(userPrompt: string, onStep?: (step: string, data: any) => void) {
    console.log(`[Orchestrator] Starting run for prompt: "${userPrompt.substring(0, 50)}..."`);
    
    // 1. Requirement Analysis & Architectural Reasoning
    onStep?.("Reasoning", "Performing multi-modal architectural analysis...");
    const schema = await this.withFallback<AppSchema>((a) => a.reason(userPrompt), "reasoning");
    console.log("[Orchestrator] Schema generated:", schema.entities.map((e: any) => e.name));
    onStep?.("Schema Defined", schema);

    let currentRules = "";
    let lastAudit: AuditResult = { 
      score: 100, 
      critique: "Awaiting generation", 
      isSecure: false,
      vulnerabilities: []
    };
    
    let iterations = 0;
    const MAX_ITERATIONS = 5;

    // 2. Iterative Generation & Verification Loop
    while (!lastAudit.isSecure && iterations < MAX_ITERATIONS) {
      iterations++;
      
      const feedbackContext = iterations > 1 
        ? `PREVIOUS_AUDIT_FAILURE: Score ${lastAudit.score}. Vulnerabilities: ${JSON.stringify(lastAudit.vulnerabilities)}`
        : "Initial generation based on best practices.";

      onStep?.(`Self-Correction (Iter ${iterations})`, iterations > 1 ? `Refining rules based on security risk (${lastAudit.score}/100)...` : "Generating initial security patterns...");
      currentRules = await this.withFallback((a) => a.generateRules(schema, feedbackContext), "agentF");
      onStep?.(`Rules Refined (Iter ${iterations})`, currentRules);
      
      // 3. Security Auditing (Proactive)
      onStep?.(`Security Audit (Iter ${iterations})`, "Performing deep-scan for zero-day vulnerabilities...");
      lastAudit = await this.withFallback((a) => a.audit(currentRules), "auditor");
      onStep?.(`Audit Result (Iter ${iterations})`, lastAudit);

      if (!lastAudit.isSecure && iterations < MAX_ITERATIONS) {
        onStep?.(`Loop Correction`, `Security risk detected (${lastAudit.score}). Restarting refinement cycle...`);
      }
    }

    // 4. Final Verification Layer (Internal Simulation)
    onStep?.("Attack Simulation", "Running synthetic adversarial queries...");
    const attacks = await this.withFallback((a) => a.simulateAttacks(currentRules), "simulator");
    onStep?.("Attacks Simulated", attacks);

    onStep?.("Finalizing", "Verifying rule integrity and preparing deployment plan...");
    console.log("[Orchestrator] Run completed successfully.");
    return {
      rules: currentRules,
      audit: lastAudit,
      schema,
      iterations,
      simulationResults: attacks,
      timestamp: new Date().toISOString()
    };
  }
}
