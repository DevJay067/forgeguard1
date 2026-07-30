import crypto from "crypto";
import { NextResponse } from "next/server";
import { ForgeGuardOrchestrator } from "@/lib/agents/orchestrator";
import { z } from "zod";
import { validateAndSanitizePrompt } from "@/lib/agents/promptGuard";

// Robust Request Schema — now supports both generate and improve modes
const OrchestrateRequestSchema = z.object({
  prompt: z.string().min(1).max(100000),
  model: z.string().default("gemini-2.0-flash"),
  userId: z.string().default("anonymous"),
  mode: z.enum(["generate", "improve"]).default("generate"),
  existingRules: z.string().optional(),
  context: z.object({
    projectId: z.string().optional(),
    securityLevel: z.enum(["Standard", "Strict", "High-Compliance"]).default("Strict"),
    platforms: z.array(z.string()).default(["Firestore"]),
  }).optional(),
});

import { checkSpendingLimit, trackUsage } from "@/lib/usage";

export async function POST(req: Request) {
  const startTime = Date.now();
  console.log(`[API] Orchestrate request received at ${new Date().toISOString()}`);

  try {
    const rawBody = await req.json();
    
    // 1. Validation Layer
    const validationResult = OrchestrateRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      console.error("[API] Validation failed:", validationResult.error.format());
      return NextResponse.json({ 
        error: "Invalid Request Payload", 
        message: "Zod Error: " + JSON.stringify(validationResult.error.errors),
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const { prompt, model, userId, mode, existingRules } = validationResult.data;

    // 2. Prompt Guard — sanitize and validate input
    const promptGuardResult = await validateAndSanitizePrompt(prompt);
    if (!promptGuardResult.isValid) {
      console.warn(`[API] Prompt rejected by guard: ${promptGuardResult.reason}`);
      return NextResponse.json({ 
        error: "Invalid Input", 
        message: promptGuardResult.reason || "Your input was not recognized as a valid Firebase project description."
      }, { status: 400 });
    }

    const sanitizedPrompt = promptGuardResult.sanitized;

    // 3. Spending Limit Check
    const withinLimit = await checkSpendingLimit(userId);
    if (!withinLimit) {
      return NextResponse.json({ 
        error: "Quota Exceeded", 
        message: "Daily $0.50 spending limit reached. Reset in 24h."
      }, { status: 403 });
    }

    // 4. Validate improve mode requirements
    if (mode === "improve" && (!existingRules || existingRules.trim().length < 10)) {
      return NextResponse.json({
        error: "Missing Existing Rules",
        message: "Improve mode requires existing Firebase security rules. Please connect your Firebase project or paste your rules."
      }, { status: 400 });
    }

    const requestOptions = model.includes("pro") ? { apiVersion: "v1beta" } : { apiVersion: "v1" };
    const orchestrator = new ForgeGuardOrchestrator(model, requestOptions);

    // 5. Execution with Streaming Response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        const sendEvent = (type: string, data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`));
        };

        try {
          let result: any;

          if (mode === "improve" && existingRules) {
            // ── IMPROVE MODE ──
            result = await orchestrator.runImprove(existingRules, sanitizedPrompt, (step, data) => {
              sendEvent("step", { step, data });
            });

            // Safeguard against LLM returning an object instead of string
            if (typeof result.afterRules === "object" && result.afterRules !== null) {
              result.afterRules = Object.values(result.afterRules)[0] || JSON.stringify(result.afterRules, null, 2);
            }

            const rulesHash = crypto.createHash("sha256").update(result.afterRules || "").digest("hex");

            const estIn = (existingRules.length + sanitizedPrompt.length + 5000) / 4; 
            const estOut = (result.afterRules.length + 500) / 4;
            trackUsage(userId, model, estIn, estOut).catch(console.error);

            sendEvent("done", { 
              result: {
                mode: "improve",
                beforeRules: result.beforeRules,
                afterRules: result.afterRules,
                beforeScore: result.beforeAudit?.score,
                afterScore: result.afterAudit?.score,
                scoreImprovement: result.scoreImprovement,
                vulnerabilitiesFixed: result.vulnerabilitiesFixed,
                improvements: result.improvements,
                schema: result.schema,
                iterations: result.iterations,
                simulationResults: result.simulationResults,
                validation: result.validation,
                hash: rulesHash,
                timestamp: result.timestamp
              } 
            });
          } else {
            // ── GENERATE MODE (original behavior) ──
            result = await orchestrator.run(sanitizedPrompt, (step, data) => {
              sendEvent("step", { step, data });
            });

            // Safeguard against LLM returning an object instead of string
            if (typeof result.rules === "object" && result.rules !== null) {
              result.rules = Object.values(result.rules)[0] || JSON.stringify(result.rules, null, 2);
            }

            const rulesHash = crypto.createHash("sha256").update(result.rules || "").digest("hex");

            const estIn = (sanitizedPrompt.length + 5000) / 4; 
            const estOut = (result.rules.length + 500) / 4;
            trackUsage(userId, model, estIn, estOut).catch(console.error);

            sendEvent("done", { 
              result: {
                mode: "generate",
                ...result,
                hash: rulesHash
              } 
            });
          }

          controller.close();
        } catch (error: any) {
          console.error("[Stream] Orchestrator error:", error);
          sendEvent("error", { 
            error: error.message,
            details: error.message 
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    console.error("[API] Internal Server Error:", error);
    return NextResponse.json({ 
      error: "Autonomous Agent Failure", 
      message: error.message,
    }, { status: 500 });
  }
}
