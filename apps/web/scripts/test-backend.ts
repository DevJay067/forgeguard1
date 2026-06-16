import { ForgeGuardOrchestrator } from "../src/lib/agents/orchestrator";

async function runDiagnostic() {
  console.log("🚀 STARTING FORGEGUARD BACKEND DIAGNOSTIC (2026)\n");

  // Verify API Key presence
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error("❌ ERROR: GOOGLE_GENERATIVE_AI_API_KEY is not set in environment.");
    process.exit(1);
  }

  const orchestrator = new ForgeGuardOrchestrator();
  const testPrompt = "A secure multi-tenant SaaS. Teams have members. Members have roles. Only admins can delete data.";

  console.log(`Test Prompt: "${testPrompt}"\n`);

  try {
    const result = await orchestrator.run(testPrompt, (step, data) => {
      console.log(`[STEP] ${step.toUpperCase()}`);
      if (typeof data === 'object') {
        if (data.entities) console.log(`  - Entities: ${data.entities.map((e: any) => e.name).join(", ")}`);
        if (data.score !== undefined) console.log(`  - Audit: ${data.score}/100 | Secure: ${data.isSecure}`);
      }
      console.log("--------------------------------------------------");
    });

    console.log("\n✅ DIAGNOSTIC COMPLETE");
    console.log(`Iterations: ${result.iterations}`);
    console.log(`Final Score: ${result.audit.score}/100`);
    
    if (result.audit.isSecure) {
      console.log("\n🌟 SUCCESS: Orchestrator is fully functional.");
    }

  } catch (error: any) {
    console.error("\n❌ DIAGNOSTIC FAILED");
    console.error(error.message);
    process.exit(1);
  }
}

runDiagnostic();
