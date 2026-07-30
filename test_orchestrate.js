const fetch = require("node-fetch");

async function test() {
  const res = await fetch("http://localhost:3000/api/orchestrate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: "Test architecture",
      model: "gemini-2.0-flash",
      userId: "anonymous"
    })
  });
  
  if (!res.ok) {
    const error = await res.json();
    console.log("Error from API:");
    console.log(error);
  } else {
    console.log("Success! Status:", res.status);
    const body = await res.text();
    console.log("Stream response start:", body.substring(0, 100));
  }
}

test();
