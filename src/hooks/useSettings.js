import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveSettings, subscribeSettings } from '../firebase/firestore';

const DEFAULT_SETTINGS = {
  durations: {
    pomodoro: 45 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  },
  modePreference: '',
  clockColor: '#ffffff',
  textColor: '#ffffff',
  autoClockColor: true,
  clockStyle: 'digital', // 'digital' | 'flip'
  timerStyle: 'default', // 'default' | 'flip' | 'progress' | 'gauge' | 'dotmatrix' | 'pie'
  showTimerProgressBar: true,
  showStreakCounter: true,
  showTaskInPip: true,
  showGhostPacer: false,
  showSeconds: true,
  clockFormat: '12h', // '12h' | '24h'
  theme: 'dark', // 'dark' | 'light'
  subjectColor: '#06b6d4',
  clockFont: "'Inter', system-ui, sans-serif",
  clockFontWeight: '800',
  clockLetterSpacing: '-0.04em',
  clockTimerStyle: 'default-bold',
  targets: [],
  exams: [],
};

const SETTINGS_STORAGE_KEY = 'fmood_settings_cache';

export const useSettings = () => {
  const { currentUser } = useAuth();
  const saveTimeoutRef = useRef(null);
  const [settings, setSettings] = useState(() => {
    try {
      const cached = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Clean out legacy default SSC CGL targets containing Quant if present
        if (parsed.targets?.length === 1 && parsed.targets[0]?.name === 'SSC CGL') {
          parsed.targets = [];
        }
        const finalSettings = { ...DEFAULT_SETTINGS, ...parsed };
        if (currentUser?.email === 'deepeshsingh2606@gmail.com') {
          finalSettings.isPro = true;
        }
        return finalSettings;
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeSettings(currentUser.uid, (data) => {
      if (data) {
        const merged = {
          ...DEFAULT_SETTINGS,
          ...data,
          isPro: currentUser.email === 'deepeshsingh2606@gmail.com' ? true : data.isPro,
          autoClockColor: data.autoClockColor !== undefined ? data.autoClockColor : true,
          theme: data.theme || 'dark',
          clockStyle: data.clockStyle || 'digital',
          timerStyle: data.timerStyle || (data.clockStyle === 'flip' ? 'flip' : 'default'),
          showTimerProgressBar: data.showTimerProgressBar !== undefined ? data.showTimerProgressBar : true,
          showStreakCounter: data.showStreakCounter !== undefined ? data.showStreakCounter : true,
          showTaskInPip: data.showTaskInPip !== undefined ? data.showTaskInPip : true,
          showGhostPacer: data.showGhostPacer !== undefined ? data.showGhostPacer : false,
          showSeconds: data.showSeconds !== undefined ? data.showSeconds : true,
          clockFormat: data.clockFormat || '12h',
          clockFont: data.clockFont || DEFAULT_SETTINGS.clockFont,
          clockFontWeight: data.clockFontWeight || DEFAULT_SETTINGS.clockFontWeight,
          clockLetterSpacing: data.clockLetterSpacing || DEFAULT_SETTINGS.clockLetterSpacing,
          clockTimerStyle: data.clockTimerStyle || DEFAULT_SETTINGS.clockTimerStyle,
          clockColor: data.clockColor || data.textColor || DEFAULT_SETTINGS.clockColor,
          textColor: data.clockColor || data.textColor || DEFAULT_SETTINGS.textColor,
          durations: {
            ...DEFAULT_SETTINGS.durations,
            ...(data.durations || {}),
          },
        };
        setSettings(merged);
        try {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
        } catch {
          // ignore
        }
      }
      setLoaded(true);
    });
    return unsub;
  }, [currentUser]);

  const updateSettings = useCallback(
    (updates) => {
      let nextState;
      setSettings((prev) => {
        const color = updates.clockColor || updates.textColor || prev.clockColor || prev.textColor;
        const merged = {
          ...prev,
          ...updates,
          isPro: currentUser?.email === 'deepeshsingh2606@gmail.com' ? true : (updates.isPro !== undefined ? updates.isPro : prev.isPro),
          clockColor: color,
          textColor: color,
          durations: {
            ...prev.durations,
            ...(updates.durations || {}),
          },
        };
        nextState = merged;
        try {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
        } catch {
          // ignore
        }
        return merged;
      });

      // Debounce remote Firestore sync by 350ms for instant 0ms local response
      if (currentUser) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          if (nextState) {
            saveSettings(currentUser.uid, nextState).catch((err) =>
              console.warn('Background settings save error:', err)
            );
          }
        }, 350);
      }
    },
    [currentUser]
  );

  return { settings, updateSettings, loaded };
};
