import { ForgeGuardOrchestrator } from "./src/lib/agents/orchestrator";
import * as dotenv from "dotenv";
dotenv.config({ path: "./.env" });

async function run() {
  const orchestrator = new ForgeGuardOrchestrator("gemini-2.5-flash");
  try {
    const result = await orchestrator.run("Create a schema for a blogging app with posts and comments.", (step, data) => {
      console.log(`STEP: ${step}`);
    });
    console.log("SUCCESS");
  } catch (err: any) {
    console.error("ERROR:", err.message);
  }
}
run();
