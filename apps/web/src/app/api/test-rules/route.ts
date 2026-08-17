import { NextResponse } from "next/server";
import { ValidatorAgent, AttackVector } from "@/lib/agents/validator";
import { SimulatorAgent } from "@/lib/agents/simulator";
import { z } from "zod";

const TestRulesRequestSchema = z.object({
  rules: z.string().min(10),
  testCases: z.array(z.object({
    description: z.string(),
    auth: z.any().nullable().optional(),
    path: z.string(),
    operation: z.enum(["get", "create", "update", "delete"]),
    data: z.any().nullable().optional(),
    expectedOutcome: z.enum(["allowed", "blocked"]),
  })).optional().default([]),
  simulateOnly: z.boolean().default(false),
  model: z.string().default("gemini-2.5-flash"),
  generateAI: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    const validationResult = TestRulesRequestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      return NextResponse.json({
        error: "Invalid Request Payload",
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { rules, testCases, simulateOnly, model, generateAI } = validationResult.data;
    const simulator = new SimulatorAgent(model);

    // Case 1: AI Test Suite Generation Request
    if (generateAI) {
      console.log("[API/TestRules] Generating AI Test cases...");
      const generatedSuite = await simulator.generateTestSuite(rules);
      return NextResponse.json({ testCases: generatedSuite });
    }

    // Map Zod-parsed array to strongly typed AttackVector[]
    const mappedTestCases: AttackVector[] = testCases.map((tc) => ({
      description: tc.description,
      auth: tc.auth !== undefined ? tc.auth : null,
      path: tc.path,
      operation: tc.operation,
      data: tc.data,
      expectedOutcome: tc.expectedOutcome
    }));

    // Case 2: Run Rules Evaluation
    console.log(`[API/TestRules] Running rules evaluation. Test cases count: ${mappedTestCases.length}, simulateOnly: ${simulateOnly}`);

    let runResults: any[] = [];
    let methodUsed: "emulator" | "ai_simulation" = "ai_simulation";

    // Try emulator validation first if not forced to simulate only
    if (!simulateOnly && mappedTestCases.length > 0) {
      try {
        const validator = new ValidatorAgent();
        const outcome = await validator.validateRules(rules, mappedTestCases);
        
        if (!outcome.skipped && outcome.report.length > 0) {
          methodUsed = "emulator";
          runResults = outcome.report.map((r) => ({
            description: r.vector,
            expected: r.expected,
            actual: r.actual,
            passed: r.passed,
            explanation: r.error || (r.passed ? "Check passed against rules engine successfully." : "Permission denied as expected."),
            simulationType: "Firestore Emulator",
            traceTable: [
              {
                step: 1,
                operation: "LOCAL_EMULATOR",
                condition: "Evaluate on Firestore emulator",
                result: r.passed ? "PASSED" : "FAILED",
                details: r.error || (r.passed ? "Expected outcome matched emulator outcome." : "Expected outcome mismatched emulator outcome.")
              }
            ]
          }));
        }
      } catch (err: any) {
        console.warn("[API/TestRules] Emulator run crashed, falling back to AI simulation:", err.message);
      }
    }

    // If emulator was skipped/offline or we forced simulation, run AI simulation
    if (methodUsed === "ai_simulation" && mappedTestCases.length > 0) {
      console.log("[API/TestRules] Running AI live simulation for all test cases...");
      
      const evalPromises = mappedTestCases.map(async (tc) => {
        const aiEval = await simulator.simulateEvaluation(rules, tc);
        const passed = aiEval.actualOutcome === tc.expectedOutcome;
        return {
          description: tc.description,
          expected: tc.expectedOutcome,
          actual: aiEval.actualOutcome,
          passed: passed,
          explanation: aiEval.explanation,
          traceTable: aiEval.traceTable || [],
          simulationType: "AI Live Simulation"
        };
      });

      runResults = await Promise.all(evalPromises);
    }

    return NextResponse.json({
      success: true,
      methodUsed,
      results: runResults
    });

  } catch (error: any) {
    console.error("[API/TestRules] Internal Error:", error);
    return NextResponse.json({
      error: "Testing Failure",
      message: error.message
    }, { status: 500 });
  }
}
