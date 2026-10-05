const apiKey = process.env.VITE_GEMINI_API_KEY || "";
if (!apiKey) { console.log("No API key"); process.exit(0); }

async function test() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: 'What is the weather in Tokyo today?' }] }],
      tools: [{ googleSearch: {} }]
    })
  });
  const json = await response.json();
  console.log(JSON.stringify(json, null, 2));
}
test();
