import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { IconCheck, IconInfo, IconWarning, IconError, IconFocus, IconBreak, IconLongBreak } from '../Icons';

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const TOAST_THEMES = {
  success:   { icon: '#10B981', border: 'rgba(16, 185, 129, 0.28)' },
  focus:     { icon: '#10B981', border: 'rgba(16, 185, 129, 0.28)' },
  break:     { icon: '#38BDF8', border: 'rgba(56, 189, 248, 0.28)' },
  longbreak: { icon: '#A78BFA', border: 'rgba(167, 139, 250, 0.28)' },
  info:      { icon: '#818CF8', border: 'rgba(129, 140, 248, 0.28)' },
  warning:   { icon: '#F59E0B', border: 'rgba(245, 158, 11, 0.28)' },
  error:     { icon: '#F43F5E', border: 'rgba(244, 63, 94, 0.28)' },
};

const ICONS = {
  success: (color) => <IconCheck size={14} color={color} />,
  info: (color) => <IconInfo size={14} color={color} />,
  warning: (color) => <IconWarning size={14} color={color} />,
  error: (color) => <IconError size={14} color={color} />,
  focus: (color) => <IconFocus size={14} color={color} />,
  break: (color) => <IconBreak size={14} color={color} />,
  longbreak: (color) => <IconLongBreak size={14} color={color} />,
};

let idCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 220);
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const toast = useCallback((message, type = 'success', duration = 3000) => {
    const id = ++idCounter;
    // Keep at most 2 toasts active so notifications stay minimal and clean
    setToasts((prev) => [...prev.slice(-1), { id, message, type, exiting: false }]);
    timersRef.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => {
          const theme = TOAST_THEMES[t.type] || TOAST_THEMES.success;
          const renderIcon = ICONS[t.type] || ICONS.success;
          return (
            <div
              key={t.id}
              className={`toast-item ${t.exiting ? 'toast-exit' : 'toast-enter'}`}
              style={{
                borderColor: theme.border,
              }}
              role="alert"
              onClick={() => dismiss(t.id)}
              title="Click to dismiss"
            >
              <span className="toast-icon-wrapper" style={{ color: theme.icon }}>
                {renderIcon(theme.icon)}
              </span>
              <span className="toast-msg">{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
