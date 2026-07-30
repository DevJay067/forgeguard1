require("dotenv").config({ path: "./apps/web/.env" });
const fetch = require("node-fetch");

async function test() {
  const keys = [
    process.env.OPENROUTER_API_KEY,
    process.env.OPENROUTER_API_KEY_2,
    process.env.OPENROUTER_API_KEY_3
  ].filter(Boolean);
  
  if (keys.length === 0) {
    console.error("No OpenRouter API keys found in environment variables.");
    return;
  }
  
  for (const key of keys) {
    console.log(`Testing key: ${key.substring(0,10)}...`);
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemma-4-31b-it:free",
        messages: [{ role: "user", content: "Hello" }]
      })
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  }
}

test();
