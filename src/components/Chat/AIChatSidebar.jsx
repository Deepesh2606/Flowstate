import React, { useState, useRef, useEffect, useCallback } from 'react';
import { streamGeminiResponse } from '../../utils/aiChat';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const STORAGE_KEY = 'flowstate_chat_history';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: "Hey! I'm your **Flowstate AI** — here to help you study smarter, stay focused, and crush your sessions. 🎯\n\nAsk me anything: study tips, Pomodoro advice, quick explanations, or just a focus check-in.",
  id: 'welcome',
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
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(false);

  // Persist chat history
  useEffect(() => {
    try {
      const toSave = messages.filter((m) => !m.streaming);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // storage full — ignore
    }
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setInput('');
    abortRef.current = false;

    const userMsg = { role: 'user', content: trimmed, id: Date.now() };
    const historyWithUser = [...messages.filter((m) => !m.streaming), userMsg];
    setMessages(historyWithUser);
    setIsLoading(true);

    const assistantId = Date.now() + 1;
    const assistantMsg = { role: 'assistant', content: '', id: assistantId, streaming: true };
    setMessages((prev) => [...prev, assistantMsg]);

    // Build the history to send (exclude welcome id, exclude streaming)
    const apiMessages = historyWithUser
      .filter((m) => m.id !== 'welcome')
      .map(({ role, content }) => ({ role, content }));

    await streamGeminiResponse(
      apiMessages,
      API_KEY,
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
      },
      (err) => {
        setIsLoading(false);
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        if (err.message === 'MISSING_KEY') {
          setError('missing_key');
        } else {
          setError('api_error');
          console.error('Gemini error:', err);
        }
      }
    );
  }, [messages, isLoading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    abortRef.current = true;
    setMessages([WELCOME_MESSAGE]);
    setError(null);
    setIsLoading(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  const showTyping = isLoading && !messages.find((m) => m.streaming && m.content.length > 0);
  const hasMsgs = messages.length > 1;

  return (
    <aside className="ai-chat-panel" role="complementary" aria-label="AI Chat Assistant">
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
            <span className="ai-chat-panel-model">Gemini 2.0 Flash</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {hasMsgs && (
            <button
              className="ai-chat-header-btn"
              onClick={clearChat}
              title="Clear chat"
              aria-label="Clear chat history"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6"/>
                <path d="M14 11v6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
            </button>
          )}
          <button
            className="ai-chat-header-btn ai-chat-close-btn"
            onClick={onClose}
            aria-label="Close AI chat"
            title="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="ai-chat-messages" role="log" aria-live="polite" aria-label="Chat messages">
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
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
              Get a free key →
            </a>
          </span>
        </div>
      )}
      {error === 'api_error' && (
        <div className="ai-chat-error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>Something went wrong. Check your API key and try again.</span>
        </div>
      )}

      {/* Suggested prompts — show only at start */}
      {messages.length === 1 && !isLoading && (
        <div className="ai-chat-suggestions">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              className="ai-chat-suggestion-chip"
              onClick={() => sendMessage(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="ai-chat-input-area">
        <textarea
          ref={inputRef}
          className="ai-chat-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Flowstate AI…"
          rows={1}
          aria-label="Chat input"
          disabled={isLoading}
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
      <p className="ai-chat-footer-note">Powered by Gemini · Shift+Enter for newline</p>
    </aside>
  );
};

export default AIChatSidebar;
