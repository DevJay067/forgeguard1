import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";

// Approximate pricing per 1k tokens (in USD)
// These are estimates for cost control logic
const PRICING: Record<string, { input: number; output: number }> = {
  "gemini-2.0-flash": { input: 0.0001, output: 0.0004 },
  "gemini-1.5-flash": { input: 0.000075, output: 0.0003 },
  "gemini-1.5-pro": { input: 0.00125, output: 0.005 },
  "google/gemma-4-26b-a4b-it:free": { input: 0, output: 0 },
  "google/gemma-4-31b-it:free": { input: 0, output: 0 },
};

const DAILY_LIMIT = 0.50;

export async function checkSpendingLimit(userId: string): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const usageRef = doc(db, "usage", `${userId}_${today}`);
    
    const snap = await getDoc(usageRef);
    if (!snap.exists()) {
      await setDoc(usageRef, { totalSpent: 0, lastUpdated: today, requests: 0 }, { merge: true });
      return true;
    }
    
    const data = snap.data();
    return data.totalSpent < DAILY_LIMIT;
  } catch (error) {
    console.error("[SpendingLimit] Firestore error, defaulting to allowed:", error);
    return true; 
  }
}

export async function trackUsage(userId: string, model: string, inputTokens: number, outputTokens: number) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const usageRef = doc(db, "usage", `${userId}_${today}`);
    
    const pricing = PRICING[model] || PRICING["gemini-2.0-flash"];
    const cost = ((inputTokens / 1000) * pricing.input) + ((outputTokens / 1000) * pricing.output);
    
    await setDoc(usageRef, {
      totalSpent: increment(cost),
      requests: increment(1),
      lastUpdated: today
    }, { merge: true });
  } catch (e) {
    console.error("[UsageTracker] Failed to record usage:", e);
  }
}
