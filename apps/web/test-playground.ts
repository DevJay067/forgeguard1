import { SimulatorAgent } from "./src/lib/agents/simulator";
import * as dotenv from "dotenv";
dotenv.config({ path: "./.env" });

async function run() {
  const rules = `
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /users/{userId} {
          allow read: if request.auth != null;
          allow write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
  `;

  console.log("=== Testing AI Test Suite Generation ===");
  const simulator = new SimulatorAgent("gemini-2.5-flash");
  try {
    const generated = await simulator.generateTestSuite(rules);
    console.log("SUCCESS. Generated Test Cases:");
    console.log(JSON.stringify(generated, null, 2));

    if (generated.length > 0) {
      console.log("\n=== Testing AI Live Rule Evaluation ===");
      const testCase = generated[0];
      console.log(`Evaluating test case: "${testCase.description}" on path: "${testCase.path}"...`);
      
      const evalResult = await simulator.simulateEvaluation(rules, testCase);
      console.log("SUCCESS. Evaluation Result:");
      console.log(`Actual Outcome: ${evalResult.actualOutcome} (Expected: ${testCase.expectedOutcome})`);
      console.log(`Trace/Explanation:\n${evalResult.explanation}`);
    }
  } catch (err: any) {
    console.error("ERROR during playground test:", err.message);
  }
}

run();
