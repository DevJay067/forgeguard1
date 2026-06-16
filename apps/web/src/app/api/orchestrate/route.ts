import { NextResponse } from "next/server";
import { ForgeGuardOrchestrator } from "@/lib/agents/orchestrator";
import { z } from "zod";

// Robust Request Schema
const OrchestrateRequestSchema = z.object({
  prompt: z.string().min(2).max(2000),
  model: z.string().default("gemini-2.0-flash"),
  userId: z.string().default("anonymous"),
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
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const { prompt, model, userId } = validationResult.data;

    // 2. Spending Limit Check
    const withinLimit = await checkSpendingLimit(userId);
    if (!withinLimit) {
      return NextResponse.json({ 
        error: "Quota Exceeded", 
        message: "Daily $0.50 spending limit reached. Reset in 24h."
      }, { status: 403 });
    }

    const requestOptions = model.includes("pro") ? { apiVersion: "v1beta" } : { apiVersion: "v1" };
    const orchestrator = new ForgeGuardOrchestrator(model, requestOptions);

    // 3. Execution with Streaming Response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        const sendEvent = (type: string, data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`));
        };

        try {
          const result = await orchestrator.run(prompt, (step, data) => {
            sendEvent("step", { step, data });
          });

          // 4. Track Usage (Estimated for orchestration) - Non-blocking
          const estIn = (prompt.length + 5000) / 4; 
          const estOut = (result.rules.length + 500) / 4;
          trackUsage(userId, model, estIn, estOut).catch(console.error);

          sendEvent("done", { result });
          controller.close();
        } catch (error: any) {
          console.error("[Stream] Orchestrator error:", error);
          sendEvent("error", { error: error.message });
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
