import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { SimulatorAgent } from "../src/lib/agents/simulator";

async function runRepairTest() {
  console.log("🛠️ STARTING SECURITY RULES AUTO-REPAIR TEST\n");

  const brokenRules = `
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /User/{userId} {
          allow read, write: if false;
        }
      }
    }
  `;

  const failedCases = [
    {
      description: "Allow read for authenticated user",
      auth: { uid: "user_abc", email_verified: true },
      path: "/databases/$(database)/documents/users/user_abc",
      operation: "get",
      expectedOutcome: "allowed"
    }
  ];

  console.log("Broken Rules:");
  console.log(brokenRules);
  console.log("Failed Test Cases (Input):");
  console.log(JSON.stringify(failedCases, null, 2));

  const model = "google/gemma-4-26b-a4b-it:free"; // Use free Gemma model
  console.log(`\nCalling repairRules using model: ${model}...`);

  try {
    const simulator = new SimulatorAgent(model);
    const result = await simulator.repairRules(brokenRules, failedCases);

    console.log("\n✅ REPAIR COMPLETED SUCCESSFULLY!");
    console.log("\nRepaired Rules:");
    console.log(result.rules);
    console.log("\nAI Reasoning:");
    console.log(result.reasoning);

  } catch (error: any) {
    console.error("\n❌ REPAIR TEST FAILED:");
    console.error(error.message);
    process.exit(1);
  }
}

runRepairTest();
