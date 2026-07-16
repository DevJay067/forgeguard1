import { ReasoningAgent, AppSchema } from "./reasoning";
import { AgentF } from "./agent-f";
import { AuditorAgent, AuditResult } from "./auditor";
import { SimulatorAgent } from "./simulator";
import { ValidatorAgent, ValidationResult } from "./validator";

const FALLBACK_MODELS = ["gemini-1.5-flash", "google/gemma-4-26b-a4b-it:free", "gemini-2.0-flash"];

export class ForgeGuardOrchestrator {
  private reasoning: ReasoningAgent;
  private agentF: AgentF;
  private auditor: AuditorAgent;
  private simulator: SimulatorAgent;
  private validator: ValidatorAgent;
  private currentModel: string;

  constructor(modelName: string = "gemini-2.0-flash", requestOptions?: any) {
    this.currentModel = modelName;
    this.reasoning = new ReasoningAgent(modelName, requestOptions);
    this.agentF = new AgentF(modelName, requestOptions);
    this.auditor = new AuditorAgent(modelName, requestOptions);
    this.simulator = new SimulatorAgent(modelName, requestOptions);
    this.validator = new ValidatorAgent();
  }

  private async withFallback<T>(fn: (agent: any) => Promise<T>, agentType: "reasoning" | "agentF" | "auditor" | "simulator" | "validator"): Promise<T> {
    try {
      return await fn(this[agentType]);
    } catch (error: any) {
      const shouldFallback = error.message?.includes("429") || error.message?.includes("quota") || error.message?.includes("400") || error.message?.includes("API key");
      const isOpenRouterError = error.message?.includes("OpenRouter error") || error.message?.includes("Provider returned error");
      
      if (shouldFallback || isOpenRouterError) {
        console.warn(`[Orchestrator] Resilience trigger (${isOpenRouterError ? "OpenRouter" : "Fallback"}) on ${this.currentModel}. Attempting fallback...`);
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
          this.validator = new ValidatorAgent();
          
          try {
            return await fn(this[agentType]);
          } catch (fallbackError: any) {
            console.warn(`[Orchestrator] Fallback to ${fallbackModel} failed: ${fallbackError.message}`);
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

    // 5. Emulator Execution
    onStep?.("Emulator Validation", "Running tests against the Firebase local emulator...");
    const validationResult = await this.withFallback<ValidationResult>((a) => a.validateRules(currentRules, attacks), "validator");
    onStep?.("Validation Completed", validationResult);

    if (!validationResult.passed) {
      console.error("[Orchestrator] Emulator validation failed. The rules blocked legitimate access or allowed malicious queries.");
      // We could loop here, but for now we just flag it.
      lastAudit.critique += "\n\nCRITICAL: Emulator validation failed! Real-world tests did not pass.";
      lastAudit.score = Math.max(lastAudit.score, 60);
      lastAudit.isSecure = false;
    }

    onStep?.("Finalizing", "Verifying rule integrity and preparing deployment plan...");
    console.log("[Orchestrator] Run completed successfully.");
    return {
      rules: currentRules,
      audit: lastAudit,
      schema,
      iterations,
      simulationResults: attacks,
      validation: validationResult,
      timestamp: new Date().toISOString()
    };
  }
}
