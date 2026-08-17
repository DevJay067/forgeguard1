/**
 * Resilience Utility for ForgeGuard Agents
 * Handles transient 503 (Service Unavailable) and 429 (Rate Limit) errors
 * with exponential backoff.
 */

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isQuotaExceeded = error.status === 429 || error.message?.includes("429") || error.message?.includes("quota");
    const isTransient = isQuotaExceeded || 
      error.status === 503 || 
      error.message?.includes("503") || 
      error.message?.includes("high demand") ||
      error.message?.includes("Provider returned error") ||
      error.message?.includes("OpenRouter error");

    if (isTransient && retries > 0) {
      // Try to extract retry delay from Google API error if possible
      let actualDelay = delay;
      if (isQuotaExceeded) {
         console.warn(`[Quota] API Limit reached. Backing off...`);
         actualDelay = Math.max(delay, 5000); // Minimum 5s for quota
      }

      console.warn(`[Retry] Error detected. Retrying in ${actualDelay}ms... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, actualDelay));
      return withRetry(fn, retries - 1, actualDelay * 2);
    }
    throw error;
  }
}

/**
 * Safely extracts the valid JSON block from raw model output,
 * ignoring any preceding code blocks (such as rules with braces).
 */
export function extractJson(text: string, keys: string[]): string {
  // Clean markdown JSON wrapper fences first
  const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/i) || text.match(/```\s*([\s\S]*?)\s*```/i);
  const candidate = codeBlockMatch ? codeBlockMatch[1] : text;

  // Search for the index of one of the expected JSON keys
  let keyIndex = -1;
  for (const key of keys) {
    keyIndex = candidate.indexOf(key);
    if (keyIndex !== -1) break;
  }

  let firstBrace = -1;
  let lastBrace = -1;

  if (keyIndex !== -1) {
    // Opening brace of the JSON must be the last { before the key
    firstBrace = candidate.lastIndexOf('{', keyIndex);
    // Closing brace is the last } in the candidate string
    lastBrace = candidate.lastIndexOf('}');
  } else {
    // Fallback: search for braces standard way
    firstBrace = candidate.indexOf('{');
    lastBrace = candidate.lastIndexOf('}');
  }

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return candidate.substring(firstBrace, lastBrace + 1);
  }

  return candidate.trim();
}
