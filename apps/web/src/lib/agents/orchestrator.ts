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
          // Use v1beta for all gemini models to ensure compatibility with 1.5-flash and 2.0-flash
          const options = fallbackModel.includes("gemini") ? { apiVersion: "v1beta" } : { apiVersion: "v1" };
          
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
    let validationResult: ValidationResult | null = null;
    let attacks: any = null;
    
    let iterations = 0;
    const MAX_ITERATIONS = 5;

    // 2. Iterative Generation & Verification Loop
    while ((!lastAudit.isSecure || (validationResult !== null && !validationResult.passed)) && iterations < MAX_ITERATIONS) {
      iterations++;
      
      let feedbackContext = iterations > 1 
        ? `PREVIOUS_AUDIT_FAILURE: Score ${lastAudit.score}. Vulnerabilities: ${JSON.stringify(lastAudit.vulnerabilities)}`
        : "Initial generation based on best practices.";
        
      if (iterations > 1 && validationResult && !validationResult.passed) {
        const failedTests = validationResult.report.filter((r: any) => !r.passed);
        feedbackContext += `\nEMULATOR_VALIDATION_FAILED: The following tests failed: ${JSON.stringify(failedTests.map((t: any) => ({ test: t.vector, expected: t.expected, actual: t.actual, error: t.error })))}. Fix the rules so these tests pass.`;
      }

      onStep?.(`Self-Correction (Iter ${iterations})`, iterations > 1 ? `Refining rules based on security risk (${lastAudit.score}/100) or test failures...` : "Generating initial security patterns...");
      currentRules = await this.withFallback((a) => a.generateRules(schema, feedbackContext), "agentF");
      onStep?.(`Rules Refined (Iter ${iterations})`, currentRules);
      
      // 3. Security Auditing and Simulation (Parallel for speed)
      onStep?.(`Security Audit & Simulation (Iter ${iterations})`, "Performing deep-scan and generating simulated attacks in parallel...");
      
      const auditPromise = this.withFallback<AuditResult>((a) => a.audit(currentRules), "auditor");
      const simulatorPromise = this.withFallback<any>((a) => a.simulateAttacks(currentRules), "simulator");
      
      const [audit, simulatedAttacks] = await Promise.all([auditPromise, simulatorPromise]);
      lastAudit = audit;
      attacks = simulatedAttacks;
      
      onStep?.(`Audit Result (Iter ${iterations})`, lastAudit);
      onStep?.("Attacks Simulated", attacks);

      // 4. Emulator Execution inside the loop
      onStep?.("Emulator Validation", "Running tests against the Firebase local emulator...");
      validationResult = await this.withFallback<ValidationResult>((a) => a.validateRules(currentRules, attacks), "validator");
      onStep?.("Validation Completed", validationResult);

      if ((!lastAudit.isSecure || !validationResult.passed) && iterations < MAX_ITERATIONS) {
        onStep?.(`Loop Correction`, `Security risk detected (${lastAudit.score}) or validation failed. Restarting refinement cycle...`);
      }
    }

    if (validationResult && !validationResult.passed) {
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

  /**
   * Improve existing rules: audit → improve → re-audit → compare
   */
  async runImprove(existingRules: string, userPrompt: string, onStep?: (step: string, data: any) => void) {
    console.log(`[Orchestrator] Starting IMPROVE run for existing rules`);

    // 1. Audit existing rules (BEFORE score)
    onStep?.("Auditing Existing Rules", "Analyzing your current Firestore security rules...");
    const beforeAudit = await this.withFallback<AuditResult>((a) => a.audit(existingRules), "auditor");
    onStep?.("Before Audit Complete", beforeAudit);
    console.log(`[Orchestrator] Before audit score: ${beforeAudit.score}/100`);

    // 2. Reason about the app schema from the prompt (or infer from existing rules)
    onStep?.("Reasoning", "Inferring application architecture from your rules and prompt...");
    const contextPrompt = userPrompt.trim() 
      ? userPrompt 
      : `Analyze these existing Firebase security rules and infer the application architecture:\n${existingRules}`;
    const schema = await this.withFallback<AppSchema>((a) => a.reason(contextPrompt), "reasoning");
    onStep?.("Schema Inferred", schema);

    // 3. Iterative improvement loop
    let currentRules = existingRules;
    let lastAudit = beforeAudit;
    let improvements: string[] = [];
    let validationResult: ValidationResult | null = null;
    let attacks: any = null;
    let iterations = 0;
    const MAX_ITERATIONS = 5;

    while ((!lastAudit.isSecure || (validationResult !== null && !validationResult.passed)) && iterations < MAX_ITERATIONS) {
      iterations++;

      let feedbackContext = iterations > 1
        ? `PREVIOUS_IMPROVEMENT_ATTEMPT: Score ${lastAudit.score}. Remaining vulnerabilities: ${JSON.stringify(lastAudit.vulnerabilities)}`
        : "Initial improvement based on audit findings.";

      if (iterations > 1 && validationResult && !validationResult.passed) {
        const failedTests = validationResult.report.filter((r: any) => !r.passed);
        feedbackContext += `\nEMULATOR_VALIDATION_FAILED: Fix these test failures: ${JSON.stringify(failedTests.map((t: any) => ({ test: t.vector, expected: t.expected, actual: t.actual })))}`;
      }

      onStep?.(`Improving Rules (Iter ${iterations})`, iterations > 1 ? `Refining improvements based on remaining issues (${lastAudit.score}/100)...` : "Generating security improvements based on audit findings...");

      const improvementResult = await this.withFallback<{ rules: string; improvements: string[] }>(
        (a) => a.improveRules(currentRules, lastAudit, schema, feedbackContext),
        "agentF"
      );
      currentRules = improvementResult.rules;
      improvements = [...improvements, ...improvementResult.improvements];

      onStep?.(`Rules Improved (Iter ${iterations})`, { rules: currentRules, improvements: improvementResult.improvements });

      // 4. Re-audit improved rules + simulate attacks (parallel)
      onStep?.(`Re-Auditing & Simulating (Iter ${iterations})`, "Verifying improvements and running attack simulations...");

      const auditPromise = this.withFallback<AuditResult>((a) => a.audit(currentRules), "auditor");
      const simulatorPromise = this.withFallback<any>((a) => a.simulateAttacks(currentRules), "simulator");

      const [audit, simulatedAttacks] = await Promise.all([auditPromise, simulatorPromise]);
      lastAudit = audit;
      attacks = simulatedAttacks;

      onStep?.(`After Audit (Iter ${iterations})`, lastAudit);
      onStep?.("Attacks Simulated", attacks);

      // 5. Validate in emulator
      onStep?.("Emulator Validation", "Running tests against the Firebase local emulator...");
      validationResult = await this.withFallback<ValidationResult>((a) => a.validateRules(currentRules, attacks), "validator");
      onStep?.("Validation Completed", validationResult);

      if ((!lastAudit.isSecure || !validationResult.passed) && iterations < MAX_ITERATIONS) {
        onStep?.("Loop Correction", `Further improvements needed (score: ${lastAudit.score}). Restarting refinement cycle...`);
      }
    }

    if (validationResult && !validationResult.passed) {
      lastAudit.critique += "\n\nCRITICAL: Emulator validation failed on some tests.";
      lastAudit.score = Math.max(lastAudit.score, 60);
      lastAudit.isSecure = false;
    }

    // Calculate improvement metrics
    const scoreImprovement = beforeAudit.score - lastAudit.score;
    const vulnerabilitiesFixed = beforeAudit.vulnerabilities.length - lastAudit.vulnerabilities.length;

    onStep?.("Improvement Complete", {
      beforeScore: beforeAudit.score,
      afterScore: lastAudit.score,
      scoreImprovement,
      vulnerabilitiesFixed,
      totalImprovements: improvements.length
    });

    console.log(`[Orchestrator] Improve run completed. Score: ${beforeAudit.score} → ${lastAudit.score}`);

    return {
      beforeRules: existingRules,
      afterRules: currentRules,
      beforeAudit,
      afterAudit: lastAudit,
      improvements,
      schema,
      iterations,
      simulationResults: attacks,
      validation: validationResult,
      scoreImprovement,
      vulnerabilitiesFixed,
      timestamp: new Date().toISOString()
    };
  }
}
