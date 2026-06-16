/**
 * ForgeGuard RAG Seeding Script (2026)
 * This script prepares the knowledge base for Agent F using the latest 
 * Firebase Security best practices and known anti-patterns.
 */

export const RAG_SEED_DATA = [
  {
    category: "Best Practice",
    title: "Version 2 Rules",
    content: "Always use rules_version = '2'; This allows for recursive match patterns and improved performance with collection group queries."
  },
  {
    category: "Security Pattern",
    title: "Content Ownership",
    content: "match /posts/{postId} { allow update, delete: if request.auth.uid == resource.data.authorId; }"
  },
  {
    category: "Security Pattern",
    title: "Team-Based Access",
    content: "match /teams/{teamId}/docs/{docId} { allow read: if exists(/databases/$(database)/documents/teams/$(teamId)/members/$(request.auth.uid)); }"
  },
  {
    category: "Anti-Pattern",
    title: "Global Auth Check",
    content: "VULNERABILITY: 'allow read, write: if request.auth != null' is insufficient. It allows any authenticated user (even from other apps) to access all data."
  },
  {
    category: "Anti-Pattern",
    title: "Missing Data Validation",
    content: "VULNERABILITY: Updating documents without checking field types or allowed values. Use: allow update: if request.resource.data.status in ['draft', 'published'];"
  },
  {
    category: "Advanced Pattern",
    title: "Custom Claims for RBAC",
    content: "allow delete: if request.auth.token.role == 'admin'; This is more secure than checking a document for admin status on every write."
  }
];

export async function seedKnowledgeBase() {
  console.log("Initializing ForgeGuard RAG seeding...");
  // In production, this would use pgvector client to upsert embeddings.
  // For this prototype, we log the seeded knowledge.
  RAG_SEED_DATA.forEach(item => {
    console.log(`[SEED] [${item.category}] ${item.title}: ${item.content.substring(0, 50)}...`);
  });
  console.log("Seeding complete. Agent F is now context-aware.");
}
