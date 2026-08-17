import { NextResponse } from "next/server";
import { SimulatorAgent } from "@/lib/agents/simulator";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rules, failedCases, model } = body;

    if (!rules) {
      return NextResponse.json({ error: "Missing 'rules' parameter" }, { status: 400 });
    }
    if (!failedCases || !Array.isArray(failedCases)) {
      return NextResponse.json({ error: "Missing or invalid 'failedCases' parameter" }, { status: 400 });
    }

    console.log(`[API] Triggering rules repair via model: ${model || "gemini-2.5-flash"}`);
    const simulator = new SimulatorAgent(model);
    const repairResult = await simulator.repairRules(rules, failedCases);

    return NextResponse.json({
      success: true,
      rules: repairResult.rules,
      reasoning: repairResult.reasoning
    });

  } catch (error: any) {
    console.error("[API] Rule repair error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to repair rules" },
      { status: 500 }
    );
  }
}
