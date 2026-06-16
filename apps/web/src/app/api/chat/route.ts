import { NextResponse } from "next/server";
import { ChatAgent } from "@/lib/agents/chat";
import { z } from "zod";
import { checkSpendingLimit, trackUsage } from "@/lib/usage";

const ChatRequestSchema = z.object({
  message: z.string().min(1),
  model: z.string().default("gemini-2.0-flash"),
  context: z.any().optional(),
  plan: z.string().default("Free"),
  userId: z.string().default("anonymous"),
});

// Simple in-memory rate limiting for prototype
const RATE_LIMITS: Record<string, number> = {
  "Free": 5,
  "Pro": 50,
  "Strict": 100,
};

const userUsage: Record<string, { count: number; lastReset: number }> = {};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, model, context, plan, userId } = ChatRequestSchema.parse(body);
    
    // 1. Check $0.50 Daily Spending Limit
    const withinLimit = await checkSpendingLimit(userId);
    if (!withinLimit) {
      return NextResponse.json({ 
        error: "Quota Exceeded", 
        message: "You have reached your $0.50 daily spending limit. Reset occurs in 24h."
      }, { status: 403 });
    }

    // 2. Rate Limiting Logic
    const identifier = userId === "anonymous" ? (req.headers.get("x-forwarded-for") || "anonymous") : userId;
    const now = Date.now();
    const limit = RATE_LIMITS[plan] || RATE_LIMITS["Free"];
    
    if (!userUsage[identifier] || now - userUsage[identifier].lastReset > 60000) {
      userUsage[identifier] = { count: 0, lastReset: now };
    }
    
    if (userUsage[identifier].count >= limit) {
      return NextResponse.json({ 
        error: "Rate Limit Exceeded", 
        message: `Your ${plan} plan allows ${limit} requests per minute. Upgrade for more.`
      }, { status: 429 });
    }
    
    userUsage[identifier].count++;

    const requestOptions = model.includes("pro") ? { apiVersion: "v1beta" } : { apiVersion: "v1" };
    const chatAgent = new ChatAgent(model, requestOptions);
    const response = await chatAgent.chat(message, context);

    // 3. Track Usage (Estimated for chat) - Non-blocking
    const estInput = (message.length + JSON.stringify(context || {}).length) / 4;
    const estOutput = response.length / 4;
    trackUsage(userId, model, estInput, estOutput).catch(console.error);

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error("[API] Chat error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
