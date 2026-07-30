import * as dotenv from "dotenv";
dotenv.config({ path: "./.env" });

async function callOpenRouter(model: string, messages: any[]) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  console.log("Key:", apiKey ? apiKey.substring(0, 10) + "..." : "missing");
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://forgeguard.io",
      "X-Title": "ForgeGuard",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model, messages })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenRouter error: ${error.error?.message || response.statusText}`);
  }
  const data = await response.json();
  return data.choices[0].message.content;
}

callOpenRouter("google/gemma-4-26b-a4b-it:free", [{ role: "user", content: "hi" }])
  .then(console.log)
  .catch(console.error);
