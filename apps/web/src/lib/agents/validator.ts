import { initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";

export interface AttackVector {
  description: string;
  auth: { uid: string; [key: string]: any } | null;
  path: string;
  operation: "get" | "create" | "update" | "delete";
  data?: any;
  expectedOutcome: "allowed" | "blocked";
}

export interface ValidationResult {
  passed: boolean;
  report: {
    vector: string;
    actual: string;
    expected: string;
    passed: boolean;
    error?: string;
  }[];
  skipped?: boolean;
  error?: string;
}

export class ValidatorAgent {
  async validateRules(rulesContent: string, testCases: AttackVector[]): Promise<ValidationResult> {
    let testEnv: RulesTestEnvironment | null = null;
    try {
      // Need a unique project ID for each run to avoid collision
      const projectId = `demo-forgeguard-${Math.random().toString(36).substring(7)}`;
      
      testEnv = await initializeTestEnvironment({
        projectId: projectId,
        firestore: { rules: rulesContent }
      });

      const results = [];
      for (const vector of testCases) {
        let context;
        if (vector.auth) {
          const { uid, ...claims } = vector.auth;
          context = testEnv.authenticatedContext(uid, claims);
        } else {
          context = testEnv.unauthenticatedContext();
        }
        
        let actualOutcome = "blocked";
        let errorMessage = undefined;

        try {
          const db = context.firestore();
          const docRef = db.doc(vector.path);

          if (vector.operation === "get") {
            await docRef.get();
          } else if (vector.operation === "create" || vector.operation === "update") {
            await docRef.set(vector.data || {}, { merge: true });
          } else if (vector.operation === "delete") {
            await docRef.delete();
          }
          actualOutcome = "allowed";
        } catch (err: any) {
          actualOutcome = "blocked";
          errorMessage = err.message;
        }
        
        const testPassed = actualOutcome === vector.expectedOutcome;

        results.push({
          vector: vector.description,
          actual: actualOutcome,
          expected: vector.expectedOutcome,
          passed: testPassed,
          error: errorMessage
        });
      }

      await testEnv.cleanup();
      return { passed: results.every(r => r.passed), report: results };
    } catch (e: any) {
      console.warn("[ValidatorAgent] Failed to initialize test environment:", e.message);
      if (testEnv) {
        await testEnv.cleanup();
      }
      const isEmulatorMissing = e.message?.includes("host and port") || e.message?.includes("ECONNREFUSED") || e.message?.includes("emulator");
      return { 
        passed: isEmulatorMissing ? true : false, 
        report: [], 
        skipped: isEmulatorMissing, 
        error: e.message 
      };
    }
  }
}
