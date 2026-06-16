export async function callOpenRouter(model: string, messages: any[]) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  console.log("[OpenRouter] API Key check:", apiKey ? "FOUND (starts with " + apiKey.substring(0, 10) + ")" : "MISSING");
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://forgeguard.io", // Optional, for OpenRouter rankings
      "X-Title": "ForgeGuard", // Optional
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenRouter error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
