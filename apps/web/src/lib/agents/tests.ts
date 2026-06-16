import { ForgeGuardOrchestrator } from "./orchestrator";

/**
 * ForgeGuard Complex Test Cases
 * Demonstrating autonomous reasoning and security auditing.
 */

export const TEST_CASES = [
  {
    id: "TC-001",
    name: "SaaS Project Management",
    prompt: "Build a project management app where users belong to teams. Teams have projects. Projects have tasks. Users can only see projects in their team. Only project owners can delete projects. Tasks are readable by team members but only editable by the assigned user or project owner.",
  },
  {
    id: "TC-002",
    name: "Medical Records (HIPAA-style)",
    prompt: "Health platform where Patients have Records. Doctors have Patients. A Patient can see their own records. A Doctor can see records of patients they are assigned to. Nurses can read records but not edit. Audit logs must be created on every read (simulated via rules logic).",
  },
  {
    id: "TC-003",
    name: "Marketplace with Subscriptions",
    prompt: "E-commerce marketplace. Sellers can list products. Buyers can buy. Only users with a 'pro' subscription (custom claim) can list more than 5 products. Transactions are immutable once created. Admin can refund but not delete transactions.",
  }
];

export async function runVerificationSuite() {
  const orchestrator = new ForgeGuardOrchestrator();
  console.log("=== STARTING FORGEGUARD VERIFICATION SUITE ===");

  for (const tc of TEST_CASES) {
    console.log(`\n[TEST] Running: ${tc.name}`);
    const result = await orchestrator.run(tc.prompt, (step, data) => {
      console.log(`  > ${step}`);
    });

    console.log(`[RESULT] Iterations: ${result.iterations}`);
    console.log(`[RESULT] Risk Score: ${result.audit.score}/100`);
    console.log(`[RESULT] Secure: ${result.audit.isSecure ? "YES" : "NO"}`);
  }

  console.log("\n=== VERIFICATION SUITE COMPLETE ===");
}
