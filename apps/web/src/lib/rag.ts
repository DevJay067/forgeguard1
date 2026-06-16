import { GoogleGenerativeAI } from "@google/generative-ai";

// Mock RAG data for seeding
const FIREBASE_BEST_PRACTICES = [
  "Use rules_version = '2';",
  "Explicitly check resource.data.ownerId == request.auth.uid",
  "Validate all incoming data fields using resource.data",
  "Never use global wildcards like allow read, write: if request.auth != null",
  "Use custom claims (request.auth.token.role) for admin access",
];

export async function getRagContext(query: string): Promise<string> {
  // Simple keyword matching for prototype
  return FIREBASE_BEST_PRACTICES.join("\n");
}
