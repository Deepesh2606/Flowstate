import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const ICONS = {
  success: '✓',
  info: 'ℹ',
  warning: '⚠',
  error: '✕',
  focus: '🍅',
  break: '☕',
  longbreak: '🌙',
};

const COLORS = {
  success: { bg: 'rgba(0,200,150,0.15)', border: 'rgba(0,200,150,0.4)', icon: '#00C896' },
  info:    { bg: 'rgba(120,120,255,0.15)', border: 'rgba(120,120,255,0.4)', icon: '#7878ff' },
  warning: { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.4)', icon: '#fbbf24' },
  error:   { bg: 'rgba(255,80,80,0.15)', border: 'rgba(255,80,80,0.4)', icon: '#ff5050' },
  focus:   { bg: 'rgba(0,200,150,0.15)', border: 'rgba(0,200,150,0.4)', icon: '#00C896' },
  break:   { bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.4)', icon: '#60a5fa' },
  longbreak:{ bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.4)', icon: '#a78bfa' },
};

let idCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
    clearTimeout(timersRef.current[id]);
  }, []);

  const toast = useCallback((message, type = 'success', duration = 3500) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev.slice(-4), { id, message, type, exiting: false }]);
    timersRef.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => {
          const color = COLORS[t.type] || COLORS.success;
          return (
            <div
              key={t.id}
              className={`toast-item ${t.exiting ? 'toast-exit' : 'toast-enter'}`}
              style={{
                background: `rgba(14,14,26,0.92)`,
                border: `1px solid ${color.border}`,
                boxShadow: `0 4px 32px rgba(0,0,0,0.4), 0 0 0 1px ${color.border}`,
              }}
              role="alert"
            >
              <span className="toast-icon" style={{ color: color.icon, background: color.bg }}>
                {ICONS[t.type] || ICONS.success}
              </span>
              <span className="toast-msg">{t.message}</span>
              <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss">✕</button>
              <div
                className="toast-progress"
                style={{ background: color.icon, animationDuration: '3.5s' }}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
