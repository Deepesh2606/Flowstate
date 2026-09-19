/**
 * aiChat.js
 * Utility for streaming AI responses from Google Gemini.
 * Model: gemini-2.0-flash (fast, free tier available)
 */

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const SYSTEM_PROMPT = `You are Flowstate AI — a friendly, concise study and focus assistant built into the Flowstate productivity app.

Your role:
- Help users stay focused, manage study sessions, and overcome procrastination
- Give short, actionable advice for the Pomodoro technique, time management, and deep work
- Answer academic questions clearly and concisely
- Suggest study strategies, break ideas, and motivation boosts
- Keep responses brief and scannable — use bullet points when listing things

Tone: warm, encouraging, and direct. Never overly verbose. You're a productivity partner, not a chatbot.`;

function toGeminiContents(messages) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

/**
 * Stream a response from Gemini.
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} apiKey
 * @param {(chunk: string) => void} onChunk
 * @param {() => void} onDone
 * @param {(error: Error) => void} onError
 */
export async function streamGeminiResponse(messages, apiKey, onChunk, onDone, onError) {
  if (!apiKey) {
    onError(new Error('MISSING_KEY'));
    return;
  }

  const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const body = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: toGeminiContents(messages),
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) onChunk(text);
        } catch {
          // skip malformed SSE lines
        }
      }
    }

    onDone();
  } catch (err) {
    onError(err);
  }
}
