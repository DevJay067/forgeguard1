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
