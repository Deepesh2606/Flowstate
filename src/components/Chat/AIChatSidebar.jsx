import React, { useState, useRef, useEffect, useCallback } from 'react';
import { streamGeminiResponse } from '../../utils/aiChat';
import { IconTrash, IconX } from '../Icons';

const DEFAULT_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const STORAGE_KEY = 'flowstate_chat_history';
const GEMINI_KEY_STORAGE = 'flowstate_gemini_key';

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
  const handleCopy = async (e) => {
    e.stopPropagation();
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
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

const AIChatSidebar = ({ onClose }) => {
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
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [panelWidth, setPanelWidth] = useState(() => {
    return parseInt(localStorage.getItem('flowstate_chat_width') || DEFAULT_WIDTH, 10);
  });

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(false);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const currentWidthRef = useRef(panelWidth);
  const rafIdRef = useRef(null);
  const panelRef = useRef(null);

  // Sync current width ref
  useEffect(() => {
    currentWidthRef.current = panelWidth;
    document.documentElement.style.setProperty('--chat-panel-width', `${panelWidth}px`);
  }, [panelWidth]);

  // Persist chat history
  useEffect(() => {
    try {
      const toSave = messages.filter((m) => !m.streaming);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch { /* storage full */ }
  }, [messages]);

  // Scroll to bottom smoothly for new messages, or instantly during streaming
  const scrollToBottom = useCallback((instant = false) => {
    if (messagesContainerRef.current) {
      if (instant) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  // Keyboard shortcut: Escape or C (when not in textarea) to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // If key is 'c' and focus is NOT in an input/textarea, close the chat
      const isInput =
        e.target?.tagName?.toLowerCase() === 'input' ||
        e.target?.tagName?.toLowerCase() === 'textarea' ||
        e.target?.isContentEditable;

      if (!isInput && (e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Smooth 120fps Drag-to-resize without re-rendering React or syncing storage on every frame
  const onDragStart = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = currentWidthRef.current;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    const onMove = (ev) => {
      if (!isDragging.current) return;
      const delta = ev.clientX - dragStartX.current;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStartWidth.current + delta));
      currentWidthRef.current = newWidth;

      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        if (panelRef.current) {
          panelRef.current.style.width = `${newWidth}px`;
        }
        document.documentElement.style.setProperty('--chat-panel-width', `${newWidth}px`);
      });
    };

    const onUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);

      const finalWidth = currentWidthRef.current;
      setPanelWidth(finalWidth);
      try {
        localStorage.setItem('flowstate_chat_width', finalWidth);
      } catch { /* ignore */ }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseup', onUp);
  }, []);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setErrorDetails(null);
    setInput('');
    abortRef.current = false;

    const userMsg = { role: 'user', content: trimmed, id: Date.now(), ts: Date.now() };
    const historyWithUser = [...messages.filter((m) => !m.streaming), userMsg];
    setMessages(historyWithUser);
    setIsLoading(true);

    // Scroll immediately after user sends message
    requestAnimationFrame(() => scrollToBottom(false));

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
        // Fast instant scroll during streaming chunks for butter smoothness
        scrollToBottom(true);
      },
      () => {
        setIsLoading(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, streaming: false } : m
          )
        );
        scrollToBottom(false);
      },
      (err) => {
        setIsLoading(false);
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));

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
  }, [messages, isLoading, scrollToBottom]);

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
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
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

  const showTyping = isLoading && !messages.find((m) => m.streaming && m.content.length > 0);
  const hasMsgs = messages.length > 1;

  return (
    <aside
      className="ai-chat-panel"
      ref={panelRef}
      style={{ width: panelWidth }}
      role="complementary"
      aria-label="AI Chat Assistant"
    >
      {/* Drag handle for resizing */}
      <div
        className="ai-chat-resize-handle"
        onMouseDown={onDragStart}
        title="Drag to resize"
        aria-hidden="true"
      />

      {/* Sleek Minimal Header */}
      <div className="ai-chat-panel-header">
        <div className="ai-chat-panel-title">
          <div className="ai-chat-panel-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className="ai-chat-title-group">
            <span className="ai-chat-panel-name">Ask AI</span>
            <span className="ai-chat-panel-model">Gemini</span>
          </div>
        </div>

        <div className="ai-chat-header-actions">
          {/* Clear history button */}
          {hasMsgs && (
            <button
              className="ai-chat-header-btn"
              onClick={() => setShowResetConfirm(true)}
              title="Clear chat"
              aria-label="Clear chat history"
            >
              <IconTrash size={14} />
            </button>
          )}

          {/* Close button with C / Esc hint */}
          <button
            className="ai-chat-header-btn ai-chat-close-btn"
            onClick={onClose}
            aria-label="Close AI chat (C or Esc)"
            title="Close (C or Esc)"
          >
            <IconX size={15} />
            <span className="ai-chat-kbd-hint">Esc</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="ai-chat-messages"
        ref={messagesContainerRef}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
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
        <div className="ai-chat-error">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>Rate limit reached. Try again in a moment.</span>
          </div>
          {errorDetails && (
            <button
              type="button"
              className="skip-btn-cancel"
              onClick={retryLastMessage}
              style={{ padding: '3px 8px', fontSize: '11px', flexShrink: 0 }}
            >
              Retry
            </button>
          )}
        </div>
      )}
      {error === 'api_error' && (
        <div className="ai-chat-error">
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
              style={{ padding: '3px 8px', fontSize: '11px', flexShrink: 0 }}
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
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Minimal Input Area */}
      <div className="ai-chat-input-area">
        <div className="ai-chat-input-box">
          <textarea
            ref={inputRef}
            className="ai-chat-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? 'Flowstate AI is thinking…' : 'Ask anything… (Enter to send)'}
            rows={1}
            aria-label="Chat input"
          />
          <button
            className={`ai-chat-send-btn ${isLoading ? 'ai-chat-send-btn--loading' : ''}`}
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
            title="Send"
          >
            {isLoading ? (
              <span className="ai-send-spinner" />
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </div>
        <div className="ai-chat-footer-hint">
          <span>Enter to send · Shift+Enter newline · <strong>C</strong> / <strong>Esc</strong> to close</span>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div
          className="reset-modal-overlay"
          style={{ zIndex: 1200 }}
          onClick={() => setShowResetConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-chat-title"
        >
          <div
            className="reset-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '340px' }}
          >
            <button
              type="button"
              className="reset-modal-close-btn"
              onClick={() => setShowResetConfirm(false)}
              aria-label="Close dialog"
            >
              <IconX size={15} />
            </button>

            <div className="reset-modal-icon-ring">
              <IconTrash size={22} color="#ef4444" />
            </div>

            <h3 id="reset-chat-title" className="reset-modal-title">
              Clear Conversation?
            </h3>

            <p className="reset-modal-desc">
              Are you sure you want to clear all messages in this study session?
            </p>

            <div className="reset-modal-actions">
              <button
                type="button"
                className="reset-modal-btn-cancel"
                onClick={() => setShowResetConfirm(false)}
              >
                Keep
              </button>
              <button
                type="button"
                className="reset-modal-btn-confirm"
                onClick={() => {
                  setShowResetConfirm(false);
                  clearChat();
                }}
                autoFocus
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default AIChatSidebar;
