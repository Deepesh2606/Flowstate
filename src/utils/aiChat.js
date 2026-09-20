/**
 * aiChat.js
 * Utility for streaming AI responses from Google Gemini.
 * Model: gemini-2.0-flash (fast, free tier available)
 */

const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const SYSTEM_PROMPT = `You are Flowstate AI — a friendly, concise study and focus assistant built into the Flowstate productivity app.

Your role:
- Help users stay focused, manage study sessions, and overcome procrastination
- Give short, actionable advice for the Pomodoro technique, time management, and deep work
- Answer academic questions clearly and concisely
- Suggest study strategies, break ideas, and motivation boosts
- Keep responses brief and scannable — use bullet points when listing things

Tone: warm, encouraging, and direct. Never overly verbose. You're a productivity partner, not a chatbot.`;

/**
 * Sanitize messages for Google Gemini multi-turn conversation API:
 * 1. Ensure roles alternate strictly: 'user' -> 'model' -> 'user' -> 'model'
 * 2. Ensure first message is always 'user'
 * 3. Never send empty text parts
 * 4. Merge consecutive same-role messages
 * 5. Limit history window to recent 30 turns to avoid hitting token/rate limits
 */
function toGeminiContents(messages) {
  const sanitized = [];

  for (const m of messages) {
    const text = typeof m.content === 'string' ? m.content.trim() : '';
    if (!text) continue;

    const role = (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user';

    if (sanitized.length === 0) {
      if (role !== 'user') continue; // First turn must be user
      sanitized.push({ role, parts: [{ text }] });
    } else {
      const prev = sanitized[sanitized.length - 1];
      if (prev.role === role) {
        // Merge consecutive turns with the same role
        prev.parts[0].text += `\n\n${text}`;
      } else {
        sanitized.push({ role, parts: [{ text }] });
      }
    }
  }

  // If chat is long, slice the last 30 turns while ensuring the first turn is 'user'
  if (sanitized.length > 30) {
    const windowed = sanitized.slice(-30);
    if (windowed[0]?.role !== 'user') {
      windowed.shift();
    }
    return windowed;
  }

  return sanitized;
}

/**
 * Attempt stream with a single model.
 */
async function streamWithModel(modelName, contents, apiKey, onChunk) {
  const url = `${GEMINI_API_BASE}/${modelName}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const body = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.warn(`Gemini model ${modelName} returned HTTP ${response.status}:`, errText);
    const error = new Error(`HTTP_${response.status}: ${errText}`);
    error.status = response.status;
    error.responseText = errText;
    throw error;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let receivedAnyText = false;

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
        if (text) {
          receivedAnyText = true;
          onChunk(text);
        }
      } catch {
        // skip malformed SSE lines
      }
    }
  }

  return receivedAnyText;
}

/**
 * Stream a response from Gemini with automatic model fallbacks and sanitization.
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

  const contents = toGeminiContents(messages);
  if (contents.length === 0) {
    onError(new Error('EMPTY_PROMPT'));
    return;
  }

  let lastError = null;

  // Try candidate models in order (e.g. 2.5-flash -> 2.0-flash -> 1.5-flash)
  for (const modelName of CANDIDATE_MODELS) {
    try {
      await streamWithModel(modelName, contents, apiKey, onChunk);
      onDone();
      return;
    } catch (err) {
      lastError = err;
      // If 400 Bad Request, trying another model might not fix an invalid payload,
      // but with our sanitization 400 won't occur unless it's an unsupported parameter or key.
      // If 429 or 503 or 404, fall back to next model immediately!
      continue;
    }
  }

  onError(lastError || new Error('All models failed to respond'));
}
