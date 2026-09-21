import React, { useState, useRef, useEffect, useCallback } from 'react';
import { streamGeminiResponse } from '../../utils/aiChat';
import { IconTrash, IconX } from '../Icons';

const DEFAULT_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const STORAGE_KEY = 'flowstate_chat_history';
const GEMINI_KEY_STORAGE = 'flowstate_gemini_key';

// User's own key takes priority over the app's default key
const getApiKey = () => localStorage.getItem(GEMINI_KEY_STORAGE) || DEFAULT_API_KEY;
const MIN_WIDTH = 300;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 360;

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: "Hey! I'm your **Flowstate AI** — here to help you study smarter, stay focused, and crush your sessions. 🎯\n\nAsk me anything: study tips, Pomodoro advice, quick explanations, or just a focus check-in.",
  id: 'welcome',
  ts: Date.now(),
};

function parseMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/gs, (match) => `<ul>${match}</ul>`)
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br/>');
}

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore */ }
  };
  return (
    <button className="chat-copy-btn" onClick={handleCopy} title="Copy message" aria-label="Copy message">
      {copied ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      )}
    </button>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isStreaming = message.streaming;

  return (
    <div className={`chat-bubble-row ${isUser ? 'chat-bubble-row--user' : 'chat-bubble-row--ai'}`}>
      {!isUser && (
        <div className="chat-avatar chat-avatar--ai" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
      )}
      <div className="chat-bubble-wrapper">
        <div className={`chat-bubble ${isUser ? 'chat-bubble--user' : 'chat-bubble--ai'}`}>
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <>
              <div
                className="chat-bubble-content"
                dangerouslySetInnerHTML={{ __html: `<p>${parseMarkdown(message.content)}</p>` }}
              />
              {isStreaming && (
                <span className="chat-typing-cursor" aria-hidden="true" />
              )}
            </>
          )}
        </div>
        <div className="chat-bubble-meta">
          {message.ts && <span className="chat-timestamp">{formatTime(message.ts)}</span>}
          {!isStreaming && <CopyButton text={message.content} />}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="chat-bubble-row chat-bubble-row--ai">
      <div className="chat-avatar chat-avatar--ai" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
      <div className="chat-bubble chat-bubble--ai chat-bubble--typing">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}

const SUGGESTED_PROMPTS = [
  "Help me focus for the next 25 mins",
  "Best study techniques?",
  "I'm feeling unmotivated",
  "Explain Pomodoro to me",
];

const AIChatSidebar = ({ onClose, isLoading: externalLoading }) => {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [WELCOME_MESSAGE];
    } catch {
      return [WELCOME_MESSAGE];
    }
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [panelWidth, setPanelWidth] = useState(() => {
    return parseInt(localStorage.getItem('flowstate_chat_width') || DEFAULT_WIDTH, 10);
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(false);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const panelRef = useRef(null);

  // Auto-focus input box whenever chat opens or uncollapses
  useEffect(() => {
    if (!collapsed) {
      inputRef.current?.focus();
    }
  }, [collapsed]);

  // Persist chat history
  useEffect(() => {
    try {
      const toSave = messages.filter((m) => !m.streaming);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch { /* storage full */ }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update CSS variable for push layout when width changes
  useEffect(() => {
    if (!collapsed) {
      document.documentElement.style.setProperty('--chat-panel-width', `${panelWidth}px`);
      localStorage.setItem('flowstate_chat_width', panelWidth);
    }
  }, [panelWidth, collapsed]);

  // Keyboard shortcut Cmd/Ctrl+J to toggle
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setCollapsed((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Drag-to-resize logic
  const onDragStart = useCallback((e) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = panelWidth;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    const onMove = (ev) => {
      if (!isDragging.current) return;
      const delta = ev.clientX - dragStartX.current;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStartWidth.current + delta));
      setPanelWidth(newWidth);
    };
    const onUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [panelWidth]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setErrorDetails(null);
    setInput('');
    abortRef.current = false;
    if (collapsed) setCollapsed(false);

    // Keep cursor in the chat box immediately after sending
    inputRef.current?.focus();

    const userMsg = { role: 'user', content: trimmed, id: Date.now(), ts: Date.now() };
    const historyWithUser = [...messages.filter((m) => !m.streaming), userMsg];
    setMessages(historyWithUser);
    setIsLoading(true);

    const assistantId = Date.now() + 1;
    const assistantMsg = { role: 'assistant', content: '', id: assistantId, streaming: true, ts: Date.now() };
    setMessages((prev) => [...prev, assistantMsg]);

    const apiMessages = historyWithUser
      .filter((m) => m.id !== 'welcome')
      .map(({ role, content }) => ({ role, content }));

    await streamGeminiResponse(
      apiMessages,
      getApiKey(),
      (chunk) => {
        if (abortRef.current) return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + chunk } : m
          )
        );
      },
      () => {
        setIsLoading(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, streaming: false } : m
          )
        );
        // Ensure cursor remains in the chat box when response completes
        inputRef.current?.focus();
      },
      (err) => {
        setIsLoading(false);
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        inputRef.current?.focus();

        const msg = err?.message || '';
        if (msg === 'MISSING_KEY') {
          setError('missing_key');
        } else if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
          setError('rate_limit');
          setErrorDetails(trimmed);
        } else {
          setError('api_error');
          setErrorDetails(trimmed);
          console.error('Gemini error:', err);
        }
      }
    );
  }, [messages, isLoading, collapsed]);

  const retryLastMessage = () => {
    if (errorDetails) {
      sendMessage(errorDetails);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        sendMessage(input);
      }
    }
  };

  const clearChat = () => {
    abortRef.current = true;
    setMessages([WELCOME_MESSAGE]);
    setError(null);
    setErrorDetails(null);
    setIsLoading(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  const exportChat = () => {
    const lines = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => {
        const time = m.ts ? `[${formatTime(m.ts)}] ` : '';
        const role = m.role === 'user' ? 'You' : 'Flowstate AI';
        return `${time}${role}:\n${m.content}\n`;
      });
    const blob = new Blob([lines.join('\n---\n\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowstate-chat-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const showTyping = isLoading && !messages.find((m) => m.streaming && m.content.length > 0);
  const hasMsgs = messages.length > 1;

  // Collapsed mini-mode
  if (collapsed) {
    return (
      <aside className="ai-chat-panel ai-chat-panel--collapsed" ref={panelRef} aria-label="AI Chat (collapsed)">
        <button
          className="ai-chat-collapsed-expand"
          onClick={() => setCollapsed(false)}
          title="Expand AI Chat (Cmd+J)"
          aria-label="Expand AI Chat"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          {isLoading && <span className="collapsed-loading-ring" />}
        </button>
        <button className="ai-chat-collapsed-close" onClick={onClose} title="Close" aria-label="Close chat">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </aside>
    );
  }

  return (
    <aside
      className="ai-chat-panel"
      ref={panelRef}
      style={{ width: panelWidth }}
      role="complementary"
      aria-label="AI Chat Assistant"
    >
      {/* Drag handle */}
      <div
        className="ai-chat-resize-handle"
        onMouseDown={onDragStart}
        title="Drag to resize"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="ai-chat-panel-header">
        <div className="ai-chat-panel-title">
          <div className="ai-chat-panel-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <span className="ai-chat-panel-name">Flowstate AI</span>
            <span className="ai-chat-panel-model">Gemini 3.6 Flash</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {/* Export */}
          {hasMsgs && (
            <button className="ai-chat-header-btn" onClick={exportChat} title="Export chat" aria-label="Export chat">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          )}
          {/* Clear with confirmation */}
          {hasMsgs && (
            <button className="ai-chat-header-btn" onClick={() => setShowResetConfirm(true)} title="Clear chat" aria-label="Clear chat history">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
            </button>
          )}
          {/* Collapse */}
          <button className="ai-chat-header-btn" onClick={() => setCollapsed(true)} title="Collapse (Cmd+J)" aria-label="Collapse chat">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          {/* Close */}
          <button className="ai-chat-header-btn ai-chat-close-btn" onClick={onClose} aria-label="Close AI chat" title="Close">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="ai-chat-messages" role="log" aria-live="polite" aria-label="Chat messages" onClick={() => inputRef.current?.focus()}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {showTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Error states */}
      {error === 'missing_key' && (
        <div className="ai-chat-error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>
            Add your Gemini API key to <code>.env.local</code> as <code>VITE_GEMINI_API_KEY</code>.{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Get a free key →</a>
          </span>
        </div>
      )}
      {error === 'rate_limit' && (
        <div className="ai-chat-error" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>Gemini rate limit reached. Wait a few seconds or retry.</span>
          </div>
          {errorDetails && (
            <button
              type="button"
              className="skip-btn-cancel"
              onClick={retryLastMessage}
              style={{ padding: '4px 10px', fontSize: '11px', flexShrink: 0 }}
            >
              Retry
            </button>
          )}
        </div>
      )}
      {error === 'api_error' && (
        <div className="ai-chat-error" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>Unable to get response. Please try again.</span>
          </div>
          {errorDetails && (
            <button
              type="button"
              className="skip-btn-cancel"
              onClick={retryLastMessage}
              style={{ padding: '4px 10px', fontSize: '11px', flexShrink: 0 }}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Suggested prompts */}
      {messages.length === 1 && !isLoading && (
        <div className="ai-chat-suggestions">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              className="ai-chat-suggestion-chip"
              onClick={() => {
                sendMessage(prompt);
                inputRef.current?.focus();
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input — always keeps cursor focused */}
      <div className="ai-chat-input-area" onClick={() => inputRef.current?.focus()}>
        <textarea
          ref={inputRef}
          className="ai-chat-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? 'Flowstate AI is thinking…' : 'Ask Flowstate AI…'}
          rows={1}
          aria-label="Chat input"
        />
        <button
          className={`ai-chat-send-btn ${isLoading ? 'ai-chat-send-btn--loading' : ''}`}
          onClick={() => sendMessage(input)}
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
        >
          {isLoading ? (
            <span className="ai-send-spinner" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          )}
        </button>
      </div>
      <p className="ai-chat-footer-note">Powered by Gemini · Shift+Enter for newline · ⌘J to collapse</p>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div
          className="reset-modal-overlay"
          style={{ zIndex: 1200 }}
          onClick={() => {
            setShowResetConfirm(false);
            inputRef.current?.focus();
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-chat-title"
        >
          <div
            className="reset-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '360px' }}
          >
            <button
              type="button"
              className="reset-modal-close-btn"
              onClick={() => {
                setShowResetConfirm(false);
                inputRef.current?.focus();
              }}
              aria-label="Close dialog"
            >
              <IconX size={16} />
            </button>

            <div className="reset-modal-icon-ring">
              <IconTrash size={24} color="#ef4444" />
            </div>

            <h3 id="reset-chat-title" className="reset-modal-title">
              Reset Conversation?
            </h3>

            <p className="reset-modal-desc">
              Are you sure you want to <strong>clear all messages</strong> in this study session? This cannot be undone.
            </p>

            <div className="reset-modal-actions">
              <button
                type="button"
                className="reset-modal-btn-cancel"
                onClick={() => {
                  setShowResetConfirm(false);
                  inputRef.current?.focus();
                }}
              >
                Keep Chat
              </button>
              <button
                type="button"
                className="reset-modal-btn-confirm"
                onClick={() => {
                  setShowResetConfirm(false);
                  clearChat();
                  inputRef.current?.focus();
                }}
                autoFocus
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default AIChatSidebar;
