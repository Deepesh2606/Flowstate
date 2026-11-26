import express from 'express';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Shared Server-Side Gemini Client ────────────────────────────────────────
const ALLOWED_CHAT_MODELS = new Set([
  'gemini-4-hydrogen',
  'gemini-3.1-flash-lite',
]);

const ALLOWED_VOICES = new Set(['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir']);

const CHAT_PERSONAS: Record<string, string> = {
  coach:
    'You are a focused, encouraging Deep Work & Study Coach inside FLOWSTATE. Help the user plan study blocks, overcome procrastination, break tasks into actionable steps, and stay locked in. Keep replies crisp, structured, and concise unless asked to elaborate.',
  tutor:
    'You are a clear, patient Concept Tutor inside FLOWSTATE. Explain complex STEM, humanities, and coding concepts step by step using intuitive analogies, concrete examples, and brief check-for-understanding questions.',
  exam:
    'You are a rigorous Exam Prep Drillmaster inside FLOWSTATE. Quiz the user with active-recall questions, evaluate their answers honestly, highlight gaps, and give high-yield summaries and mnemonics.',
  editor:
    'You are a sharp Academic Writing & Clarity Editor inside FLOWSTATE. Help refine essays, notes, summaries, and arguments for clarity, logic, and concise structure while preserving the user’s voice.',
};

const LIVE_VOICE_SYSTEM_INSTRUCTION =
  'You are a real-time conversational study partner inside FLOWSTATE. Speak naturally, concisely, and warmly—like a sharp tutor sitting across the desk. Keep spoken responses brief (1–3 sentences unless asked for a deeper walkthrough) so the conversation flows back and forth smoothly.';

const getGeminiClient = (): GoogleGenAI => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

const getGeminiLiveClient = (): GoogleGenAI => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    apiVersion: 'v1beta',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// ─── Live Study Rooms Authoritative State ────────────────────────────────────
interface RoomMember {
  id: string;
  name: string;
  avatar: string;
  photoURL: string;
  topic: string;
  status: string;
  joinedAt: number;
}

interface RoomTimerState {
  phase: 'focus' | 'break';
  focusMinutes: number;
  breakMinutes: number;
  remainingSec: number;
  endsAt: number | null;
  isRunning: boolean;
  startedBy: string | null;
}

interface RoomMessage {
  id: string;
  memberId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

interface StudyRoom {
  id: string;
  code: string;
  name: string;
  icon: string;
  tag: string;
  ambience: string;
  isPrivate: boolean;
  createdAt: number;
  lastActiveAt: number;
  timer: RoomTimerState;
  members: Map<string, RoomMember>;
  messages: RoomMessage[];
}

interface ClientSession {
  ws: WebSocket;
  memberId: string;
  roomId: string | null;
}

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

const rooms = new Map<string, StudyRoom>();
const clients = new Set<ClientSession>();

const createPublicRoom = (opts: {
  id: string;
  name: string;
  icon: string;
  tag: string;
  focusMinutes: number;
  breakMinutes: number;
  ambience: string;
}): StudyRoom => ({
  id: opts.id,
  code: opts.id.toUpperCase(),
  name: opts.name,
  icon: opts.icon,
  tag: opts.tag,
  ambience: opts.ambience,
  isPrivate: false,
  createdAt: Date.now(),
  lastActiveAt: Date.now(),
  timer: {
    phase: 'focus',
    focusMinutes: opts.focusMinutes,
    breakMinutes: opts.breakMinutes,
    remainingSec: opts.focusMinutes * 60,
    endsAt: null,
    isRunning: false,
    startedBy: null,
  },
  members: new Map(),
  messages: [],
});

const PUBLIC_ROOM_SEEDS = [
  {
    id: 'deep-work-hall',
    name: 'Deep Work Hall',
    icon: '🎯',
    tag: 'Silent Sprint',
    focusMinutes: 50,
    breakMinutes: 10,
    ambience: 'Rain',
  },
  {
    id: 'pomodoro-sprint',
    name: 'Pomodoro Sprint',
    icon: '⏱️',
    tag: 'Classic Flow',
    focusMinutes: 25,
    breakMinutes: 5,
    ambience: 'Lofi Beats',
  },
  {
    id: 'night-library',
    name: 'Late Night Library',
    icon: '📚',
    tag: 'Quiet Reading',
    focusMinutes: 45,
    breakMinutes: 10,
    ambience: 'Cafe',
  },
  {
    id: 'exam-studio',
    name: 'Exam Prep Studio',
    icon: '🧠',
    tag: 'Intense Study',
    focusMinutes: 60,
    breakMinutes: 15,
    ambience: 'Fireplace',
  },
];

for (const seed of PUBLIC_ROOM_SEEDS) {
  rooms.set(seed.id, createPublicRoom(seed));
}

const normalizeTimer = (room: StudyRoom): RoomTimerState => {
  const t = room.timer;
  if (t.isRunning && t.endsAt) {
    const remaining = Math.max(0, Math.ceil((t.endsAt - Date.now()) / 1000));
    if (remaining <= 0) {
      const nextPhase = t.phase === 'focus' ? 'break' : 'focus';
      const nextDuration = (nextPhase === 'focus' ? t.focusMinutes : t.breakMinutes) * 60;
      t.phase = nextPhase;
      t.remainingSec = nextDuration;
      t.endsAt = null;
      t.isRunning = false;
      t.startedBy = null;
    } else {
      t.remainingSec = remaining;
    }
  }
  return { ...t };
};

const serializeRoomSummary = (room: StudyRoom) => {
  const timer = normalizeTimer(room);
  return {
    id: room.id,
    code: room.code,
    name: room.name,
    icon: room.icon,
    tag: room.tag,
    ambience: room.ambience,
    isPrivate: room.isPrivate,
    pomodoro: `${timer.focusMinutes} / ${timer.breakMinutes}`,
    focusMinutes: timer.focusMinutes,
    breakMinutes: timer.breakMinutes,
    onlineCount: room.members.size,
    timer,
  };
};

const serializeRoomDetail = (room: StudyRoom) => ({
  ...serializeRoomSummary(room),
  members: Array.from(room.members.values()),
  messages: room.messages.slice(-40),
});

const getPublicRoomSummaries = () =>
  Array.from(rooms.values())
    .filter((r) => !r.isPrivate)
    .map(serializeRoomSummary);

const getTotalOnlineCount = () => {
  let total = 0;
  for (const room of rooms.values()) {
    total += room.members.size;
  }
  return total;
};

const sendJson = (ws: WebSocket, payload: Record<string, unknown>) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
};

const broadcastRoomsList = () => {
  const payload = {
    type: 'rooms:list',
    rooms: getPublicRoomSummaries(),
    totalOnline: getTotalOnlineCount(),
  };
  for (const client of clients) {
    sendJson(client.ws, payload);
  }
};

const broadcastRoomState = (room: StudyRoom) => {
  const payload = {
    type: 'room:state',
    room: serializeRoomDetail(room),
  };
  for (const client of clients) {
    if (client.roomId === room.id) {
      sendJson(client.ws, payload);
    }
  }
};

const broadcastToRoom = (roomId: string, payload: Record<string, unknown>) => {
  for (const client of clients) {
    if (client.roomId === roomId) {
      sendJson(client.ws, payload);
    }
  }
};

const leaveCurrentRoom = (session: ClientSession) => {
  if (!session.roomId) return;
  const prevRoom = rooms.get(session.roomId);
  session.roomId = null;
  if (!prevRoom) return;

  prevRoom.members.delete(session.memberId);
  prevRoom.lastActiveAt = Date.now();
  broadcastRoomState(prevRoom);
  broadcastRoomsList();
};

const generatePrivateCode = (name: string): string => {
  const prefix = name.replace(/[^a-z0-9]/gi, '').slice(0, 5).toUpperCase() || 'FOCUS';
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
    const exists = Array.from(rooms.values()).some(
      (r) => r.code === code || r.id === code.toLowerCase()
    );
    if (!exists) return code;
  }
  return `FLOW-${Date.now().toString(36).slice(-4).toUpperCase()}`;
};

const sanitizeText = (val: unknown, maxLen: number): string =>
  typeof val === 'string' ? val.trim().slice(0, maxLen) : '';

const clampMinutes = (val: unknown, fallback: number, min: number, max: number): number => {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
};

setInterval(() => {
  const now = Date.now();
  for (const [id, room] of rooms.entries()) {
    const wasRunning = room.timer.isRunning;
    normalizeTimer(room);
    if (wasRunning && !room.timer.isRunning) {
      broadcastRoomState(room);
      broadcastRoomsList();
    }
    if (room.isPrivate && room.members.size === 0 && now - room.lastActiveAt > 30 * 60 * 1000) {
      rooms.delete(id);
    }
  }
}, 5000);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Prevent browsers/proxies from caching stale HTML or the SW kill-switch
  app.use((req, res, next) => {
    if (
      req.method === 'GET' &&
      (req.path === '/' ||
        req.path === '/index.html' ||
        req.path === '/sw.js' ||
        req.path.endsWith('.html'))
    ) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  });

  // ── Live Rooms REST Summary ────────────────────────────────────────────────
  app.get('/api/rooms', (_req, res) => {
    res.json({
      rooms: getPublicRoomSummaries(),
      totalOnline: getTotalOnlineCount(),
    });
  });

  // ── Chrome Extension One-Click ZIP Download ────────────────────────────────
  app.get('/api/extension/download', (req, res) => {
    const extDir = path.join(__dirname, 'chrome-extension');
    if (!fs.existsSync(extDir)) {
      res.status(404).json({ error: 'Chrome extension files not found.' });
      return;
    }

    const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'http').split(',')[0].trim();
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`).split(',')[0].trim();
    const liveOrigin = `${proto}://${host}`;

    const crcTable = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      crcTable[i] = c >>> 0;
    }
    const calcCrc32 = (buf: Buffer): number => {
      let crc = 0xffffffff;
      for (let i = 0; i < buf.length; i++) {
        crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
      }
      return (crc ^ 0xffffffff) >>> 0;
    };

    const entries: Array<{ name: string; data: Buffer }> = [];
    const walk = (dir: string, relPrefix = '') => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        const rel = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          walk(full, rel);
        } else if (entry.isFile()) {
          let data = fs.readFileSync(full);
          if (rel === 'config.json') {
            data = Buffer.from(JSON.stringify({ appUrl: liveOrigin }, null, 2), 'utf8');
          }
          entries.push({ name: rel, data });
        }
      }
    };
    walk(extDir);

    const localParts: Buffer[] = [];
    const centralParts: Buffer[] = [];
    let offset = 0;

    for (const file of entries) {
      const nameBuf = Buffer.from(file.name, 'utf8');
      const compressed = zlib.deflateRawSync(file.data);
      const crc = calcCrc32(file.data);

      const localHeader = Buffer.alloc(30);
      localHeader.writeUInt32LE(0x04034b50, 0);
      localHeader.writeUInt16LE(20, 4);
      localHeader.writeUInt16LE(0, 6);
      localHeader.writeUInt16LE(8, 8); // deflate
      localHeader.writeUInt16LE(0, 10);
      localHeader.writeUInt16LE(0, 12);
      localHeader.writeUInt32LE(crc, 14);
      localHeader.writeUInt32LE(compressed.length, 18);
      localHeader.writeUInt32LE(file.data.length, 22);
      localHeader.writeUInt16LE(nameBuf.length, 26);
      localHeader.writeUInt16LE(0, 28);

      localParts.push(localHeader, nameBuf, compressed);

      const centralHeader = Buffer.alloc(46);
      centralHeader.writeUInt32LE(0x02014b50, 0);
      centralHeader.writeUInt16LE(20, 4);
      centralHeader.writeUInt16LE(20, 6);
      centralHeader.writeUInt16LE(0, 8);
      centralHeader.writeUInt16LE(8, 10); // deflate
      centralHeader.writeUInt16LE(0, 12);
      centralHeader.writeUInt16LE(0, 14);
      centralHeader.writeUInt32LE(crc, 16);
      centralHeader.writeUInt32LE(compressed.length, 20);
      centralHeader.writeUInt32LE(file.data.length, 24);
      centralHeader.writeUInt16LE(nameBuf.length, 28);
      centralHeader.writeUInt16LE(0, 30);
      centralHeader.writeUInt16LE(0, 32);
      centralHeader.writeUInt16LE(0, 34);
      centralHeader.writeUInt16LE(0, 36);
      centralHeader.writeUInt32LE(0, 38);
      centralHeader.writeUInt32LE(offset, 42);

      centralParts.push(centralHeader, nameBuf);
      offset += localHeader.length + nameBuf.length + compressed.length;
    }

    const centralDir = Buffer.concat(centralParts);
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(entries.length, 8);
    eocd.writeUInt16LE(entries.length, 10);
    eocd.writeUInt32LE(centralDir.length, 12);
    eocd.writeUInt32LE(offset, 16);
    eocd.writeUInt16LE(0, 20);

    const zipBuffer = Buffer.concat([...localParts, centralDir, eocd]);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="flowstate-chrome-extension.zip"');
    res.setHeader('Content-Length', String(zipBuffer.length));
    res.send(zipBuffer);
  });

  // ── Gemini Multi-Turn Streaming Chatbot Endpoint (SSE) ─────────────────────
  app.post('/api/gemini/chat', async (req, res) => {
    const rawMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const requestedModel = typeof req.body?.model === 'string' ? req.body.model : 'gemini-4-hydrogen';
    const model = ALLOWED_CHAT_MODELS.has(requestedModel) ? requestedModel : 'gemini-4-hydrogen';
    const personaKey = typeof req.body?.persona === 'string' ? req.body.persona : 'coach';
    const customInstruction = sanitizeText(req.body?.systemInstruction, 600);
    const systemInstruction = customInstruction || CHAT_PERSONAS[personaKey] || CHAT_PERSONAS.coach;

    // Sanitize multi-turn history: alternating user/model turns ending with user message
    const normalized: Array<{ role: 'user' | 'model'; text: string }> = [];
    for (const m of rawMessages) {
      const text = sanitizeText(m?.content, 8000);
      if (!text) continue;
      const role: 'user' | 'model' = m?.role === 'assistant' || m?.role === 'model' ? 'model' : 'user';
      if (normalized.length === 0) {
        if (role !== 'user') continue;
        normalized.push({ role, text });
      } else {
        const prev = normalized[normalized.length - 1];
        if (prev.role === role) {
          prev.text += `\n\n${text}`;
        } else {
          normalized.push({ role, text });
        }
      }
    }

    if (normalized.length === 0 || normalized[normalized.length - 1].role !== 'user') {
      res.status(400).json({ error: 'A user message is required.' });
      return;
    }

    const latestUserMessage = normalized[normalized.length - 1].text;
    const priorHistory = normalized.slice(0, -1).slice(-28).map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.text }],
    }));

    let ai: GoogleGenAI;
    try {
      ai = getGeminiClient();
    } catch (err) {
      res.status(503).json({
        error: err instanceof Error ? err.message : 'Gemini service is unavailable.',
      });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();
    res.write(': connected\n\n');

    let closed = false;
    res.on('close', () => {
      if (!res.writableEnded) {
        closed = true;
      }
    });

    try {
      const chatConfig: Record<string, unknown> = {
        systemInstruction,
      };
      if (model === 'gemini-4-hydrogen') {
        chatConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }

      const chat = ai.chats.create({
        model,
        history: priorHistory,
        config: chatConfig,
      });

      const stream = await chat.sendMessageStream({ message: latestUserMessage });
      for await (const chunk of stream) {
        if (closed) break;
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }
      if (!closed) {
        res.write(`data: ${JSON.stringify({ done: true, model })}\n\n`);
        res.end();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate Gemini response.';
      console.error('Gemini chat error:', err);
      if (!closed && !res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
        res.end();
      }
    }
  });

  // ── Gemini Active Recall Flashcards Endpoint ───────────────────────────────
  app.post('/api/gemini/flashcards', async (req, res) => {
    const subject = sanitizeText(req.body?.subject, 120) || 'General Study';
    const notes = sanitizeText(req.body?.notes, 6000);

    let ai: GoogleGenAI;
    try {
      ai = getGeminiClient();
    } catch (err) {
      res.status(503).json({
        error: err instanceof Error ? err.message : 'Gemini service is unavailable.',
      });
      return;
    }

    const prompt = notes
      ? `Generate exactly 3 high-yield active-recall flashcards based on these study notes for "${subject}":\n\n${notes}`
      : `Generate exactly 3 high-yield active-recall flashcards covering core foundational concepts for "${subject}".`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a cognitive science tutor specializing in active recall and spaced repetition. Create concise, challenging question-and-answer flashcards.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING, description: 'Clear active recall question' },
                answer: { type: Type.STRING, description: 'Concise, accurate answer' },
              },
              required: ['question', 'answer'],
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '[]').trim());
      if (!Array.isArray(parsed) || parsed.length === 0) {
        res.status(502).json({ error: 'Unable to parse flashcards from model response.' });
        return;
      }
      res.json({ flashcards: parsed.slice(0, 3) });
    } catch (err) {
      console.error('Gemini flashcards error:', err);
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to generate flashcards.',
      });
    }
  });

  // ── Vite Dev Middleware (HMR disabled per runtime environment) or Static ───
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(
      express.static(distDir, {
        index: false,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html') || filePath.endsWith('sw.js')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          }
        },
      })
    );
    app.get('/{*splat}', (_req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const server = http.createServer(app);
  const roomsWss = new WebSocketServer({ noServer: true });
  const liveWss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(
      request.url || '/',
      `http://${request.headers.host || 'localhost'}`
    ).pathname;

    if (pathname === '/ws/rooms') {
      roomsWss.handleUpgrade(request, socket, head, (ws) => {
        roomsWss.emit('connection', ws, request);
      });
      return;
    }

    if (pathname === '/ws/live') {
      liveWss.handleUpgrade(request, socket, head, (ws) => {
        liveWss.emit('connection', ws, request);
      });
      return;
    }

    socket.destroy();
  });

  // ── WebSocket: Live Study Rooms (/ws/rooms) ────────────────────────────────
  roomsWss.on('connection', (ws) => {
    const session: ClientSession = {
      ws,
      memberId: `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      roomId: null,
    };
    clients.add(session);

    sendJson(ws, {
      type: 'connected',
      memberId: session.memberId,
      rooms: getPublicRoomSummaries(),
      totalOnline: getTotalOnlineCount(),
    });

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.ping();
        } catch {
          // ignore transient ping errors
        }
      }
    }, 25000);

    ws.on('message', (raw) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }

      const type = String(msg.type || '');

      if (type === 'room:join') {
        const lookupRaw = sanitizeText(msg.roomId || msg.code, 40);
        if (!lookupRaw) {
          sendJson(ws, { type: 'room:error', message: 'Enter a valid room code.' });
          return;
        }
        const normalizedId = lookupRaw.toLowerCase();
        const normalizedCode = lookupRaw.toUpperCase();

        let targetRoom = rooms.get(normalizedId);
        if (!targetRoom) {
          targetRoom = Array.from(rooms.values()).find(
            (r) =>
              r.code.toUpperCase() === normalizedCode ||
              r.id.toLowerCase() === normalizedId
          );
        }

        if (!targetRoom) {
          sendJson(ws, {
            type: 'room:error',
            message: `No active room found for code "${normalizedCode}". Create one or double-check the code.`,
          });
          return;
        }

        if (session.roomId && session.roomId !== targetRoom.id) {
          leaveCurrentRoom(session);
        }

        const displayName = sanitizeText(msg.displayName, 32) || 'Guest Scholar';
        const avatar = sanitizeText(msg.avatar, 4) || '⭐';
        const photoURL = sanitizeText(msg.photoURL, 300);
        const topic = sanitizeText(msg.topic, 48) || 'Deep Work';

        session.roomId = targetRoom.id;
        targetRoom.lastActiveAt = Date.now();
        targetRoom.members.set(session.memberId, {
          id: session.memberId,
          name: displayName,
          avatar,
          photoURL,
          topic,
          status: 'In Flowstate',
          joinedAt: Date.now(),
        });

        broadcastRoomState(targetRoom);
        broadcastRoomsList();
        return;
      }

      if (type === 'room:create') {
        const name = sanitizeText(msg.name, 36);
        if (!name) {
          sendJson(ws, {
            type: 'room:error',
            message: 'Please enter a name for your private room.',
          });
          return;
        }
        const focusMinutes = clampMinutes(msg.focusMinutes, 45, 10, 120);
        const breakMinutes = clampMinutes(msg.breakMinutes, 10, 2, 30);
        const code = generatePrivateCode(name);
        const id = code.toLowerCase();

        const newRoom: StudyRoom = {
          id,
          code,
          name,
          icon: '🔒',
          tag: 'Private Circle',
          ambience: sanitizeText(msg.ambience, 24) || 'Lofi Beats',
          isPrivate: true,
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
          timer: {
            phase: 'focus',
            focusMinutes,
            breakMinutes,
            remainingSec: focusMinutes * 60,
            endsAt: null,
            isRunning: false,
            startedBy: null,
          },
          members: new Map(),
          messages: [],
        };

        rooms.set(id, newRoom);

        if (session.roomId) {
          leaveCurrentRoom(session);
        }

        const displayName = sanitizeText(msg.displayName, 32) || 'Guest Scholar';
        const avatar = sanitizeText(msg.avatar, 4) || '⭐';
        const photoURL = sanitizeText(msg.photoURL, 300);
        const topic = sanitizeText(msg.topic, 48) || 'Deep Work';

        session.roomId = newRoom.id;
        newRoom.members.set(session.memberId, {
          id: session.memberId,
          name: displayName,
          avatar,
          photoURL,
          topic,
          status: 'Hosting Room',
          joinedAt: Date.now(),
        });

        broadcastRoomState(newRoom);
        broadcastRoomsList();
        return;
      }

      if (type === 'room:leave') {
        leaveCurrentRoom(session);
        sendJson(ws, { type: 'room:left' });
        return;
      }

      if (!session.roomId) return;
      const activeRoom = rooms.get(session.roomId);
      if (!activeRoom) return;
      const member = activeRoom.members.get(session.memberId);
      activeRoom.lastActiveAt = Date.now();

      if (type === 'timer:start') {
        const t = normalizeTimer(activeRoom);
        if (!t.isRunning) {
          const secs =
            t.remainingSec > 0
              ? t.remainingSec
              : (t.phase === 'focus' ? t.focusMinutes : t.breakMinutes) * 60;
          activeRoom.timer.remainingSec = secs;
          activeRoom.timer.endsAt = Date.now() + secs * 1000;
          activeRoom.timer.isRunning = true;
          activeRoom.timer.startedBy = member?.name || 'Someone';
          broadcastRoomState(activeRoom);
          broadcastRoomsList();
        }
        return;
      }

      if (type === 'timer:pause') {
        const t = normalizeTimer(activeRoom);
        if (t.isRunning) {
          activeRoom.timer.remainingSec = t.remainingSec;
          activeRoom.timer.endsAt = null;
          activeRoom.timer.isRunning = false;
          broadcastRoomState(activeRoom);
          broadcastRoomsList();
        }
        return;
      }

      if (type === 'timer:reset') {
        const t = activeRoom.timer;
        const duration = (t.phase === 'focus' ? t.focusMinutes : t.breakMinutes) * 60;
        t.remainingSec = duration;
        t.endsAt = null;
        t.isRunning = false;
        t.startedBy = null;
        broadcastRoomState(activeRoom);
        broadcastRoomsList();
        return;
      }

      if (type === 'timer:switchPhase') {
        const t = activeRoom.timer;
        const nextPhase = t.phase === 'focus' ? 'break' : 'focus';
        t.phase = nextPhase;
        t.remainingSec = (nextPhase === 'focus' ? t.focusMinutes : t.breakMinutes) * 60;
        t.endsAt = null;
        t.isRunning = false;
        t.startedBy = null;
        broadcastRoomState(activeRoom);
        broadcastRoomsList();
        return;
      }

      if (type === 'member:status' && member) {
        const topic = sanitizeText(msg.topic, 48);
        const status = sanitizeText(msg.status, 32);
        if (topic) member.topic = topic;
        if (status) member.status = status;
        broadcastRoomState(activeRoom);
        return;
      }

      if (type === 'room:reaction') {
        const emoji = sanitizeText(msg.emoji, 6);
        if (!emoji) return;
        broadcastToRoom(activeRoom.id, {
          type: 'room:reaction',
          id: `rx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          emoji,
          senderName: member?.name || 'Scholar',
        });
        return;
      }

      if (type === 'room:message') {
        const text = sanitizeText(msg.text, 180);
        if (!text) return;
        const chatMsg: RoomMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          memberId: session.memberId,
          senderName: member?.name || 'Scholar',
          text,
          timestamp: Date.now(),
        };
        activeRoom.messages.push(chatMsg);
        if (activeRoom.messages.length > 40) {
          activeRoom.messages = activeRoom.messages.slice(-40);
        }
        broadcastToRoom(activeRoom.id, {
          type: 'room:message',
          message: chatMsg,
        });
      }
    });

    ws.on('close', () => {
      clearInterval(pingInterval);
      clients.delete(session);
      leaveCurrentRoom(session);
    });
  });

  // ── WebSocket: Gemini Live Voice Bridge (/ws/live, gemini-3.8-live) ────────
  liveWss.on('connection', (clientWs) => {
    let liveSession: Awaited<ReturnType<GoogleGenAI['live']['connect']>> | null = null;
    let sessionPromise: Promise<Awaited<ReturnType<GoogleGenAI['live']['connect']>>> | null = null;
    let isClosing = false;
    let hasReportedError = false;

    const pingInterval = setInterval(() => {
      if (clientWs.readyState === WebSocket.OPEN) {
        try {
          clientWs.ping();
        } catch {
          // ignore transient ping errors
        }
      }
    }, 25000);

    const closeLiveSession = () => {
      isClosing = true;
      if (liveSession) {
        try {
          liveSession.close();
        } catch {
          // ignore close errors
        }
        liveSession = null;
      }
      sessionPromise = null;
    };

    clientWs.on('message', async (raw) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }

      const type = String(msg.type || '');

      if (type === 'start') {
        if (sessionPromise || liveSession) return;
        isClosing = false;
        hasReportedError = false;

        let ai: GoogleGenAI;
        try {
          ai = getGeminiLiveClient();
        } catch (err) {
          sendJson(clientWs, {
            type: 'error',
            message: err instanceof Error ? err.message : 'Gemini Live API key not configured.',
          });
          return;
        }

        const requestedVoice = typeof msg.voice === 'string' ? msg.voice : 'Zephyr';
        const voiceName = ALLOWED_VOICES.has(requestedVoice) ? requestedVoice : 'Zephyr';
        const personaKey = typeof msg.persona === 'string' ? msg.persona : 'coach';
        const systemInstruction =
          sanitizeText(msg.systemInstruction, 600) ||
          `${LIVE_VOICE_SYSTEM_INSTRUCTION} ${CHAT_PERSONAS[personaKey] || ''}`.trim();

        try {
          sessionPromise = ai.live.connect({
            model: 'gemini-3.8-live',
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName } },
              },
              inputAudioTranscription: {},
              outputAudioTranscription: {},
              systemInstruction,
            },
            callbacks: {
              onmessage: (serverMsg) => {
                if (isClosing || clientWs.readyState !== WebSocket.OPEN) return;
                const content = serverMsg.serverContent;

                if (content?.inputTranscription?.text) {
                  sendJson(clientWs, {
                    type: 'inputTranscript',
                    text: content.inputTranscription.text,
                  });
                }

                if (content?.outputTranscription?.text) {
                  sendJson(clientWs, {
                    type: 'outputTranscript',
                    text: content.outputTranscription.text,
                  });
                }

                for (const part of content?.modelTurn?.parts ?? []) {
                  if (part.inlineData?.data) {
                    sendJson(clientWs, {
                      type: 'audio',
                      data: part.inlineData.data,
                    });
                  }
                }

                if (content?.interrupted) {
                  sendJson(clientWs, { type: 'interrupted' });
                }

                if (content?.turnComplete) {
                  sendJson(clientWs, { type: 'turnComplete' });
                }
              },
              onerror: (err) => {
                console.error('Gemini Live session error:', err);
                if (!hasReportedError && !isClosing) {
                  hasReportedError = true;
                  sendJson(clientWs, {
                    type: 'error',
                    message:
                      err instanceof Error
                        ? err.message
                        : 'Voice session encountered a connection error.',
                  });
                }
              },
              onclose: () => {
                liveSession = null;
                sessionPromise = null;
                if (!isClosing) {
                  sendJson(clientWs, { type: 'closed' });
                }
              },
            },
          });

          liveSession = await sessionPromise;
          if (isClosing) {
            closeLiveSession();
          } else {
            sendJson(clientWs, { type: 'ready', model: 'gemini-3.8-live', voice: voiceName });
          }
        } catch (err) {
          console.error('Failed to connect Gemini Live session:', err);
          sessionPromise = null;
          if (!hasReportedError && !isClosing) {
            hasReportedError = true;
            sendJson(clientWs, {
              type: 'error',
              message:
                err instanceof Error
                  ? err.message
                  : 'Could not start Gemini Live voice session.',
            });
          }
        }
        return;
      }

      if (type === 'audio' && typeof msg.data === 'string' && sessionPromise) {
        const audioData = msg.data;
        sessionPromise
          .then((sess) => {
            if (!isClosing && sess) {
              sess.sendRealtimeInput({
                audio: { data: audioData, mimeType: 'audio/pcm;rate=16000' },
              });
            }
          })
          .catch(() => {});
        return;
      }

      if (type === 'text' && typeof msg.text === 'string' && sessionPromise) {
        const text = sanitizeText(msg.text, 1000);
        if (!text) return;
        sessionPromise
          .then((sess) => {
            if (!isClosing && sess) {
              sess.sendRealtimeInput({ text });
            }
          })
          .catch(() => {});
        return;
      }

      if (type === 'stop') {
        closeLiveSession();
        sendJson(clientWs, { type: 'closed' });
      }
    });

    clientWs.on('close', () => {
      clearInterval(pingInterval);
      closeLiveSession();
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`FLOWSTATE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
