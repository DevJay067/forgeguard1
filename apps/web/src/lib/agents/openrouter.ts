export async function callOpenRouter(model: string, messages: any[]) {
  const keys = [
    process.env.OPENROUTER_API_KEY,
    process.env.OPENROUTER_API_KEY_2,
    process.env.OPENROUTER_API_KEY_3
  ].filter(Boolean) as string[];
  
  if (keys.length === 0) throw new Error("No OPENROUTER_API_KEY available");

  const makeRequest = async (key: string) => {
    return await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "HTTP-Referer": "https://forgeguard.io", // Optional, for OpenRouter rankings
        "X-Title": "ForgeGuard", // Optional
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ model, messages })
    });
  };

  let response: any;
  for (let i = 0; i < keys.length; i++) {
    response = await makeRequest(keys[i]);
    
    // Break the loop if successful, or if it's a client error (except 429/402)
    if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429 && response.status !== 402)) {
      break;
    }
    console.warn(`[OpenRouter] API key ${i + 1} hit error (${response.status}). Trying next...`);
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenRouter error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  
  if (!data || !data.choices || !data.choices[0]) {
    console.error("[OpenRouter] Unexpected response format:", JSON.stringify(data, null, 2));
    throw new Error(`OpenRouter error: Unexpected response format: ${JSON.stringify(data)}`);
  }
  
  return data.choices[0].message.content;
}
