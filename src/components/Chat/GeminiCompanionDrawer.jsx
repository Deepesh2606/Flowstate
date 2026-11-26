import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IconX, IconChat, IconMic, IconMicOff, IconSparkles, IconTrash } from '../Icons';

const CHAT_STORAGE_KEY = 'flowstate_gemini_chat_v2';

const CHAT_MODELS = [
  { id: 'gemini-4-hydrogen', label: 'Gemini 4 Hydrogen', tag: 'General' },
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite', tag: 'Fast' },
];

const PERSONAS = [
  { id: 'coach', label: 'Study Coach', desc: 'Plans study blocks & keeps you locked in' },
  { id: 'tutor', label: 'Concept Tutor', desc: 'Step-by-step explanations & analogies' },
  { id: 'exam', label: 'Exam Drillmaster', desc: 'Active recall quizzes & memory checks' },
  { id: 'editor', label: 'Writing Editor', desc: 'Sharpens essays, notes & clarity' },
];

const LIVE_VOICES = [
  { id: 'Zephyr', label: 'Zephyr', tone: 'Bright & clear' },
  { id: 'Puck', label: 'Puck', tone: 'Upbeat & friendly' },
  { id: 'Charon', label: 'Charon', tone: 'Calm & informative' },
  { id: 'Kore', label: 'Kore', tone: 'Firm & focused' },
  { id: 'Fenrir', label: 'Fenrir', tone: 'Warm & energetic' },
];

const STARTER_PROMPTS = [
  'Plan a 90-minute deep work session with breaks',
  'Quiz me on active recall vs spaced repetition',
  'Explain Big-O notation with simple analogies',
  'Help me beat procrastination right now',
];

// ─── Safe Markdown Renderer (no dangerouslySetInnerHTML) ──────────────────────
const renderInline = (text) => {
  const parts = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('`')) {
      parts.push(
        <code key={key++} className="gc-inline-code">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**')) {
      parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*')) {
      parts.push(<em key={key++}>{token.slice(1, -1)}</em>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
};

const MessageBody = ({ content }) => {
  if (!content) return null;
  const segments = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="gc-msg-body">
      {segments.map((seg, idx) => {
        if (seg.startsWith('```') && seg.endsWith('```')) {
          const inner = seg.slice(3, -3).replace(/^[a-zA-Z0-9_-]+\n/, '');
          return (
            <pre key={idx} className="gc-code-block">
              <code>{inner}</code>
            </pre>
          );
        }
        const lines = seg.split('\n');
        return (
          <div key={idx} className="gc-text-block">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lIdx} className="gc-line-spacer" />;
              if (/^[-*•]\s+/.test(trimmed)) {
                return (
                  <div key={lIdx} className="gc-bullet-line">
                    <span className="gc-bullet-dot">•</span>
                    <span>{renderInline(trimmed.replace(/^[-*•]\s+/, ''))}</span>
                  </div>
                );
              }
              if (/^#{1,3}\s+/.test(trimmed)) {
                return (
                  <div key={lIdx} className="gc-heading-line">
                    {renderInline(trimmed.replace(/^#{1,3}\s+/, ''))}
                  </div>
                );
              }
              return <p key={lIdx}>{renderInline(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
};

// ─── PCM Audio Helpers for Gemini Live API ────────────────────────────────────
const floatTo16BitBase64 = (float32Array) => {
  const int16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
};

const base64PcmToAudioBuffer = (base64, audioCtx, sampleRate = 24000) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
  const buffer = audioCtx.createBuffer(1, int16.length, sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < int16.length; i++) {
    channel[i] = int16[i] / 32768.0;
  }
  return buffer;
};

const GeminiCompanionDrawer = ({ mode = 'chat', onModeChange, onClose }) => {
  // ── Shared Persona & Drawer Width ──────────────────────────────────────────
  const [persona, setPersona] = useState('coach');
  const [customInstruction, setCustomInstruction] = useState('');
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);

  // ── Chat State ─────────────────────────────────────────────────────────────
  const [selectedModel, setSelectedModel] = useState(CHAT_MODELS[0].id);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(-40);
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatError, setChatError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const chatAbortRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // ── Live Voice State (gemini-3.8-live) ─────────────────────────────────────
  const [selectedVoice, setSelectedVoice] = useState('Zephyr');
  const [voiceStatus, setVoiceStatus] = useState('idle'); // 'idle' | 'connecting' | 'connected' | 'error'
  const [voiceError, setVoiceError] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [voiceTurns, setVoiceTurns] = useState([]);
  const [voiceTextInput, setVoiceTextInput] = useState('');

  const wsRef = useRef(null);
  const inputCtxRef = useRef(null);
  const outputCtxRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const processorRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const nextStartTimeRef = useRef(0);
  const activeAudioSourcesRef = useRef(new Set());
  const isMutedRef = useRef(false);
  const isConnectedRef = useRef(false);
  const voiceTranscriptEndRef = useRef(null);

  isMutedRef.current = isMuted;

  // Persist chat history
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      // ignore storage errors
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  useEffect(() => {
    voiceTranscriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [voiceTurns]);

  useEffect(() => {
    if (mode === 'chat') {
      setTimeout(() => chatInputRef.current?.focus(), 60);
    }
  }, [mode]);

  // ── Voice Cleanup ──────────────────────────────────────────────────────────
  const stopAllPlayback = useCallback(() => {
    for (const src of activeAudioSourcesRef.current) {
      try {
        src.stop();
      } catch {
        // already stopped
      }
    }
    activeAudioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsAiSpeaking(false);
  }, []);

  const stopVoiceSession = useCallback(
    (resetStatus = true) => {
      isConnectedRef.current = false;
      stopAllPlayback();

      if (wsRef.current) {
        try {
          if (wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'stop' }));
          }
          wsRef.current.close();
        } catch {
          // ignore
        }
        wsRef.current = null;
      }

      if (processorRef.current) {
        try {
          processorRef.current.disconnect();
        } catch {
          // ignore
        }
        processorRef.current = null;
      }

      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.disconnect();
        } catch {
          // ignore
        }
        sourceNodeRef.current = null;
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }

      if (inputCtxRef.current) {
        inputCtxRef.current.close().catch(() => {});
        inputCtxRef.current = null;
      }

      if (outputCtxRef.current) {
        outputCtxRef.current.close().catch(() => {});
        outputCtxRef.current = null;
      }

      setMicLevel(0);
      setIsMuted(false);
      if (resetStatus) {
        setVoiceStatus('idle');
      }
    },
    [stopAllPlayback]
  );

  // Clean up voice & chat stream on unmount
  useEffect(() => {
    return () => {
      chatAbortRef.current?.abort();
      stopVoiceSession(false);
    };
  }, [stopVoiceSession]);

  // ── Append or merge live voice transcript ──────────────────────────────────
  const appendVoiceTranscript = useCallback((role, chunkText) => {
    if (!chunkText) return;
    setVoiceTurns((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === role && !last.finalized) {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...last,
          text: `${last.text}${chunkText}`,
        };
        return updated;
      }
      return [
        ...prev.map((t) => ({ ...t, finalized: true })),
        { id: `vt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, role, text: chunkText, finalized: false },
      ];
    });
  }, []);

  const finalizeVoiceTurns = useCallback(() => {
    setVoiceTurns((prev) => prev.map((t) => (t.finalized ? t : { ...t, finalized: true })));
  }, []);

  // ── Start Gemini 3.8 Live Voice Session ────────────────────────────────────
  const startVoiceSession = useCallback(async () => {
    if (voiceStatus === 'connecting' || voiceStatus === 'connected') return;

    setVoiceError('');
    setVoiceStatus('connecting');

    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceStatus('error');
      setVoiceError('Microphone access is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const inputCtx = new AudioCtx({ sampleRate: 16000 });
      const outputCtx = new AudioCtx({ sampleRate: 24000 });
      if (inputCtx.state === 'suspended') await inputCtx.resume();
      if (outputCtx.state === 'suspended') await outputCtx.resume();
      inputCtxRef.current = inputCtx;
      outputCtxRef.current = outputCtx;
      nextStartTimeRef.current = 0;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/live`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: 'start',
            voice: selectedVoice,
            persona,
            systemInstruction: customInstruction.trim() || undefined,
          })
        );
      };

      ws.onmessage = (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        if (msg.type === 'ready') {
          isConnectedRef.current = true;
          setVoiceStatus('connected');

          // Start streaming 16kHz PCM from microphone
          const source = inputCtx.createMediaStreamSource(stream);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          sourceNodeRef.current = source;
          processorRef.current = processor;

          processor.onaudioprocess = (audioEvent) => {
            if (!isConnectedRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
              return;
            }
            const channelData = audioEvent.inputBuffer.getChannelData(0);
            let sumSq = 0;
            for (let i = 0; i < channelData.length; i++) {
              sumSq += channelData[i] * channelData[i];
            }
            const rms = Math.sqrt(sumSq / channelData.length);
            setMicLevel(isMutedRef.current ? 0 : Math.min(1, rms * 8));

            if (isMutedRef.current) return;

            const base64Pcm = floatTo16BitBase64(channelData);
            wsRef.current.send(JSON.stringify({ type: 'audio', data: base64Pcm }));
          };

          source.connect(processor);
          processor.connect(inputCtx.destination);
          return;
        }

        if (msg.type === 'audio' && msg.data && outputCtxRef.current) {
          const ctx = outputCtxRef.current;
          if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
          }
          const audioBuffer = base64PcmToAudioBuffer(msg.data, ctx, 24000);
          const bufferSource = ctx.createBufferSource();
          bufferSource.buffer = audioBuffer;
          bufferSource.connect(ctx.destination);

          const startAt = Math.max(nextStartTimeRef.current, ctx.currentTime + 0.01);
          bufferSource.start(startAt);
          nextStartTimeRef.current = startAt + audioBuffer.duration;
          activeAudioSourcesRef.current.add(bufferSource);
          setIsAiSpeaking(true);

          bufferSource.onended = () => {
            activeAudioSourcesRef.current.delete(bufferSource);
            if (activeAudioSourcesRef.current.size === 0) {
              setIsAiSpeaking(false);
            }
          };
          return;
        }

        if (msg.type === 'interrupted') {
          stopAllPlayback();
          finalizeVoiceTurns();
          return;
        }

        if (msg.type === 'inputTranscript' && msg.text) {
          appendVoiceTranscript('user', msg.text);
          return;
        }

        if (msg.type === 'outputTranscript' && msg.text) {
          appendVoiceTranscript('assistant', msg.text);
          return;
        }

        if (msg.type === 'turnComplete') {
          finalizeVoiceTurns();
          return;
        }

        if (msg.type === 'error') {
          setVoiceError(msg.message || 'Voice session error.');
          setVoiceStatus('error');
          stopVoiceSession(false);
          return;
        }

        if (msg.type === 'closed') {
          if (isConnectedRef.current) {
            stopVoiceSession(true);
          }
        }
      };

      let handledError = false;

      ws.onerror = () => {
        if (handledError) return;
        handledError = true;
        setVoiceError('Could not connect to Live Voice service.');
        setVoiceStatus('error');
        stopVoiceSession(false);
      };

      ws.onclose = () => {
        if (isConnectedRef.current) {
          stopVoiceSession(true);
        } else if (!handledError) {
          handledError = true;
          setVoiceError((prev) => prev || 'Voice session closed before connecting.');
          setVoiceStatus('error');
          stopVoiceSession(false);
        }
      };
    } catch (err) {
      const msg =
        err?.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Allow mic access to start a voice conversation.'
          : err?.message || 'Unable to start voice conversation.';
      setVoiceError(msg);
      setVoiceStatus('error');
      stopVoiceSession(false);
    }
  }, [voiceStatus, selectedVoice, persona, customInstruction, stopAllPlayback, appendVoiceTranscript, finalizeVoiceTurns, stopVoiceSession]);

  const handleSendVoiceText = (e) => {
    e.preventDefault();
    const trimmed = voiceTextInput.trim();
    if (!trimmed || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'text', text: trimmed }));
    setVoiceTurns((prev) => [
      ...prev.map((t) => ({ ...t, finalized: true })),
      { id: `vt_${Date.now()}`, role: 'user', text: trimmed, finalized: true },
    ]);
    setVoiceTextInput('');
  };

  // ── Send Multi-Turn Chat Message (SSE Stream) ──────────────────────────────
  const sendChatMessage = useCallback(
    async (textOverride) => {
      const text = (typeof textOverride === 'string' ? textOverride : input).trim();
      if (!text || isStreaming) return;

      setChatError('');
      setInput('');

      const userMsg = {
        id: `u_${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };
      const assistantId = `a_${Date.now() + 1}`;
      const nextThread = [...messages, userMsg];

      setMessages([
        ...nextThread,
        { id: assistantId, role: 'assistant', content: '', model: selectedModel, timestamp: Date.now() },
      ]);
      setIsStreaming(true);

      const controller = new AbortController();
      chatAbortRef.current = controller;

      try {
        const res = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: selectedModel,
            persona,
            systemInstruction: customInstruction.trim() || undefined,
            messages: nextThread.map((m) => ({ role: m.role, content: m.content })),
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `Request failed (${res.status})`);
        }

        const reader = res.body?.getReader();
        if (!reader) {
          throw new Error('Streaming response unavailable.');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split('\n\n');
          buffer = events.pop() || '';

          for (const rawEvent of events) {
            const line = rawEvent.trim();
            if (!line.startsWith('data:')) continue;
            let payload;
            try {
              payload = JSON.parse(line.slice(5).trim());
            } catch {
              continue;
            }
            if (payload.error) {
              throw new Error(payload.error);
            }
            if (payload.text) {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + payload.text } : m))
              );
            }
          }
        }
      } catch (err) {
        if (err?.name !== 'AbortError') {
          const msg = err instanceof Error ? err.message : 'Unable to reach Gemini right now.';
          setChatError(msg);
          setMessages((prev) => prev.filter((m) => m.id !== assistantId || m.content.trim().length > 0));
        }
      } finally {
        chatAbortRef.current = null;
        setIsStreaming(false);
      }
    },
    [input, isStreaming, messages, selectedModel, persona, customInstruction]
  );

  const handleStopStream = () => {
    chatAbortRef.current?.abort();
    setIsStreaming(false);
  };

  const handleClearChat = () => {
    chatAbortRef.current?.abort();
    setIsStreaming(false);
    setChatError('');
    setMessages([]);
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleCopyMessage = async (msg) => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      // ignore
    }
  };

  const activePersona = PERSONAS.find((p) => p.id === persona) || PERSONAS[0];

  return (
    <>
      <div className="ai-chat-mobile-overlay" onClick={onClose} aria-hidden="true" />
      <aside
        className="ai-chat-panel gc-companion-drawer"
        role="complementary"
        aria-label="Gemini Chat and Live Voice"
        data-testid="gemini-companion-drawer"
      >
        <div className="ai-chat-sheet-handle" aria-hidden="true" />

        {/* Header with Mode Switcher (Gemini Chat | Live Voice) */}
        <div className="gc-header">
          <div className="gc-mode-tabs" role="tablist" aria-label="Gemini interaction mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'chat'}
              className={`gc-mode-tab ${mode === 'chat' ? 'active' : ''}`}
              onClick={() => onModeChange?.('chat')}
              data-testid="gemini-tab-chat"
            >
              <IconChat size={14} />
              <span>Gemini Chat</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'voice'}
              className={`gc-mode-tab ${mode === 'voice' ? 'active' : ''}`}
              onClick={() => onModeChange?.('voice')}
              data-testid="gemini-tab-voice"
            >
              <IconMic size={14} />
              <span>Live Voice</span>
              {voiceStatus === 'connected' && <span className="gc-live-dot" aria-hidden="true" />}
            </button>
          </div>

          <div className="gc-header-actions">
            {mode === 'chat' && messages.length > 0 && (
              <button
                type="button"
                className="ai-chat-header-btn"
                onClick={handleClearChat}
                title="Clear conversation"
                aria-label="Clear conversation"
              >
                <IconTrash size={14} />
              </button>
            )}
            <button
              type="button"
              className="ai-chat-header-btn ai-chat-close-btn"
              onClick={onClose}
              title="Close (Esc)"
              aria-label="Close Gemini panel"
            >
              <IconX size={15} />
            </button>
          </div>
        </div>

        {/* Shared Persona / Role & Instructions Bar */}
        <div className="gc-config-bar">
          <div className="gc-config-row">
            <label className="gc-config-field">
              <span>Role</span>
              <select
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                disabled={mode === 'voice' && voiceStatus === 'connected'}
                aria-label="Select assistant role"
                data-testid="gemini-role-select"
              >
                {PERSONAS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>

            {mode === 'chat' ? (
              <label className="gc-config-field">
                <span>Model</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  aria-label="Select Gemini model"
                  data-testid="gemini-model-select"
                >
                  {CHAT_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label} ({m.tag})
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="gc-config-field">
                <span>Voice</span>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  disabled={voiceStatus === 'connected' || voiceStatus === 'connecting'}
                  aria-label="Select Live Voice"
                  data-testid="gemini-voice-select"
                >
                  {LIVE_VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label} · {v.tone}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="gc-instruction-toggle-row">
            <span className="gc-role-desc">{activePersona.desc}</span>
            <button
              type="button"
              className="gc-instruction-toggle"
              onClick={() => setShowCustomPrompt((v) => !v)}
            >
              {showCustomPrompt ? 'Hide instructions' : 'System prompt'}
            </button>
          </div>

          {showCustomPrompt && (
            <textarea
              className="gc-custom-instruction"
              rows={2}
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="Optional custom system instructions (overrides default role prompt)..."
              maxLength={600}
            />
          )}
        </div>

        {/* ════════════ TAB 1: GEMINI MULTI-TURN CHATBOT ════════════ */}
        {mode === 'chat' && (
          <div className="gc-chat-container">
            <div className="ai-chat-messages gc-messages-scroll" data-testid="gemini-chat-thread">
              {messages.length === 0 ? (
                <div className="gc-empty-state">
                  <div className="gc-empty-icon">
                    <IconSparkles size={20} />
                  </div>
                  <h3 className="gc-empty-title">Gemini Study Companion</h3>
                  <p className="gc-empty-desc">
                    Multi-turn chat with context memory. Pick a role above or jump right in with a prompt below.
                  </p>
                  <div className="ai-chat-suggestions">
                    {STARTER_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        className="ai-chat-suggestion-chip"
                        onClick={() => sendChatMessage(prompt)}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`gc-msg-row ${msg.role === 'user' ? 'gc-msg-row--user' : 'gc-msg-row--assistant'}`}
                  >
                    <div className="gc-msg-meta">
                      <span>{msg.role === 'user' ? 'You' : 'Gemini'}</span>
                      {msg.role === 'assistant' && msg.content && (
                        <button
                          type="button"
                          className="gc-copy-btn"
                          onClick={() => handleCopyMessage(msg)}
                        >
                          {copiedId === msg.id ? 'Copied' : 'Copy'}
                        </button>
                      )}
                    </div>
                    <div className={`gc-bubble ${msg.role === 'user' ? 'gc-bubble--user' : 'gc-bubble--assistant'}`}>
                      {msg.content ? (
                        <MessageBody content={msg.content} />
                      ) : (
                        <span className="gc-typing-dots" aria-label="Gemini is responding">
                          <span />
                          <span />
                          <span />
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}

              {chatError && (
                <div className="ai-chat-error" role="alert">
                  <span>{chatError}</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              className="ai-chat-input-area"
              onSubmit={(e) => {
                e.preventDefault();
                sendChatMessage();
              }}
            >
              <div className="ai-chat-input-box">
                <textarea
                  ref={chatInputRef}
                  className="ai-chat-textarea"
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage();
                    }
                  }}
                  placeholder={`Message ${activePersona.label}...`}
                  disabled={isStreaming}
                  data-testid="gemini-chat-input"
                />
                {isStreaming ? (
                  <button
                    type="button"
                    className="ai-chat-send-btn gc-stop-btn"
                    onClick={handleStopStream}
                    title="Stop generating"
                    aria-label="Stop generating"
                  >
                    ■
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="ai-chat-send-btn"
                    disabled={!input.trim()}
                    title="Send message (Enter)"
                    aria-label="Send message"
                    data-testid="gemini-chat-send"
                  >
                    ↑
                  </button>
                )}
              </div>
              <div className="ai-chat-footer-hint">
                <span>Enter to send · Shift+Enter for new line</span>
                <strong>{selectedModel}</strong>
              </div>
            </form>
          </div>
        )}

        {/* ════════════ TAB 2: GEMINI 3.8 LIVE VOICE ════════════ */}
        {mode === 'voice' && (
          <div className="gc-voice-container" data-testid="gemini-voice-panel">
            <div className="gc-voice-stage">
              <div
                className={`gc-voice-orb gc-voice-orb--${voiceStatus} ${isAiSpeaking ? 'is-speaking' : ''}`}
                style={{
                  '--mic-scale': 1 + micLevel * 0.28,
                }}
                aria-hidden="true"
              >
                <div className="gc-voice-orb-core">
                  {voiceStatus === 'connected' && isMuted ? <IconMicOff size={24} /> : <IconMic size={24} />}
                </div>
              </div>

              <div className="gc-voice-status-text">
                {voiceStatus === 'idle' && 'Ready for live voice conversation'}
                {voiceStatus === 'connecting' && 'Connecting to Gemini 3.8 Live...'}
                {voiceStatus === 'connected' &&
                  (isAiSpeaking
                    ? 'Gemini is speaking — interrupt anytime'
                    : isMuted
                      ? 'Microphone muted'
                      : 'Listening live... speak naturally')}
                {voiceStatus === 'error' && 'Voice connection paused'}
              </div>

              <div className="gc-voice-model-pill">gemini-3.8-live · {selectedVoice}</div>

              {voiceStatus === 'connected' && (
                <div className="gc-level-meter" aria-label="Microphone audio level">
                  <div className="gc-level-fill" style={{ width: `${Math.round(micLevel * 100)}%` }} />
                </div>
              )}

              <div className="gc-voice-controls">
                {voiceStatus !== 'connected' && voiceStatus !== 'connecting' ? (
                  <button
                    type="button"
                    className="gc-voice-primary-btn"
                    onClick={startVoiceSession}
                    data-testid="gemini-voice-start-btn"
                  >
                    <IconMic size={16} />
                    <span>Start Voice Conversation</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className={`gc-voice-ctrl-btn ${isMuted ? 'is-muted' : ''}`}
                      onClick={() => setIsMuted((v) => !v)}
                      disabled={voiceStatus !== 'connected'}
                    >
                      {isMuted ? <IconMicOff size={15} /> : <IconMic size={15} />}
                      <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                    </button>
                    <button
                      type="button"
                      className="gc-voice-end-btn"
                      onClick={() => stopVoiceSession(true)}
                      data-testid="gemini-voice-stop-btn"
                    >
                      End Call
                    </button>
                  </>
                )}
              </div>

              {voiceError && (
                <div className="ai-chat-error" role="alert">
                  <span>{voiceError}</span>
                </div>
              )}
            </div>

            {/* Live Transcript Thread */}
            <div className="gc-voice-transcript-header">
              <span>Live Transcript</span>
              {voiceTurns.length > 0 && (
                <button
                  type="button"
                  className="gc-copy-btn"
                  onClick={() => setVoiceTurns([])}
                >
                  Clear
                </button>
              )}
            </div>
            <div className="gc-voice-transcript" data-testid="gemini-voice-transcript">
              {voiceTurns.length === 0 ? (
                <p className="gc-transcript-empty">
                  Start a voice conversation to talk hands-free with your {activePersona.label.toLowerCase()}. Live transcripts appear here.
                </p>
              ) : (
                voiceTurns.map((turn) => (
                  <div
                    key={turn.id}
                    className={`gc-transcript-line ${turn.role === 'user' ? 'is-user' : 'is-ai'}`}
                  >
                    <strong>{turn.role === 'user' ? 'You' : 'Gemini'}</strong>
                    <span>{turn.text}</span>
                  </div>
                ))
              )}
              <div ref={voiceTranscriptEndRef} />
            </div>

            {/* Optional text nudge while live call is connected */}
            {voiceStatus === 'connected' && (
              <form className="gc-voice-text-form" onSubmit={handleSendVoiceText}>
                <input
                  type="text"
                  value={voiceTextInput}
                  onChange={(e) => setVoiceTextInput(e.target.value)}
                  placeholder="Or type a note into the live voice session..."
                  maxLength={400}
                />
                <button type="submit" disabled={!voiceTextInput.trim()}>
                  Send
                </button>
              </form>
            )}
          </div>
        )}
      </aside>
    </>
  );
};

export default GeminiCompanionDrawer;
