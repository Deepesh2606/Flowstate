import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addSession } from '../firebase/firestore';

const MODES = {
  pomodoro: 'pomodoro',
  shortBreak: 'shortBreak',
  longBreak: 'longBreak',
  stopwatch: 'stopwatch',
};

const DEFAULT_DURATIONS = {
  pomodoro: 45 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

// Singleton Web Audio API Context to prevent memory leaks
let audioCtx = null;

// ─── Chime Styles ─────────────────────────────────────────────────────────────
const CHIME_PRESETS = {
  // Classic ascending arpeggio
  classic: { freqs: [523.25, 659.25, 783.99, 1046.5], type: 'sine', spacing: 0.18, gain: 0.18 },
  // Soft single bell
  bell: { freqs: [880, 1108.73], type: 'sine', spacing: 0.3, gain: 0.22 },
  // Deep bowl
  bowl: { freqs: [293.66, 440], type: 'sine', spacing: 0.5, gain: 0.15 },
  // Bright ping
  ping: { freqs: [1318.51, 1760], type: 'triangle', spacing: 0.12, gain: 0.20 },
  // Soft chime
  soft: { freqs: [659.25, 783.99], type: 'sine', spacing: 0.25, gain: 0.12 },
};

export const playChimeStyle = (style = 'classic', muted = false) => {
  if (muted) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const preset = CHIME_PRESETS[style] || CHIME_PRESETS.classic;
    preset.freqs.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = preset.type;
      osc.frequency.value = freq;
      const t = audioCtx.currentTime + i * preset.spacing;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(preset.gain, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      osc.start(t);
      osc.stop(t + 0.8);
    });
  } catch (e) {
    console.error('Audio chime failed:', e);
  }
};

// Keep backward compat
const playChime = (muted = false, style = 'classic') => playChimeStyle(style, muted);

// ─── Browser Notification ─────────────────────────────────────────────────────
const sendBrowserNotification = (title, body) => {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  if (!document.hidden) return; // only when tab is in background
  try {
    new Notification(title, { body, icon: '/favicon.svg', badge: '/favicon.svg' });
  } catch (e) {
    console.warn('Notification failed:', e);
  }
};

// ─── Tab title helpers ────────────────────────────────────────────────────────
const formatTitleTime = (seconds) => {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
};

export const useTimer = (settings, toast, { linkedTaskId, onTaskComplete } = {}) => {
  const { currentUser } = useAuth();
  const durations = settings?.durations || DEFAULT_DURATIONS;
  const longBreakInterval = settings?.longBreakInterval || 4;
  const autoStartBreaks = settings?.autoStartBreaks ?? false;
  const autoStartPomodoros = settings?.autoStartPomodoros ?? false;
  const soundEnabled = settings?.soundEnabled ?? true;
  const notifyOnComplete = settings?.notifyOnComplete ?? true;
  const chimeStyle = settings?.chimeStyle || 'classic';

  const [mode, setMode] = useState(MODES.pomodoro);
  const [timeLeft, setTimeLeft] = useState(durations.pomodoro);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [subject, setSubject] = useState('');
  const [studyMode, setStudyMode] = useState(settings?.modePreference || settings?.targets?.[0]?.name || '');
  const [sessionStart, setSessionStart] = useState(null);
  const [stopwatchMs, setStopwatchMs] = useState(0);

  const intervalRef = useRef(null);
  const modeRef = useRef(mode);
  const sessionCountRef = useRef(sessionCount);
  const timeLeftRef = useRef(timeLeft);
  const stopwatchMsRef = useRef(stopwatchMs);
  const targetTimeRef = useRef(null); // Stores the absolute timestamp for calculation

  modeRef.current = mode;
  sessionCountRef.current = sessionCount;
  timeLeftRef.current = timeLeft;
  stopwatchMsRef.current = stopwatchMs;

  useEffect(() => {
    if (mode === MODES.stopwatch) {
      setTimeLeft(0);
      setStopwatchMs(0);
    } else {
      setTimeLeft(durations[mode]);
    }
    setIsRunning(false);
    clearInterval(intervalRef.current);
  }, [mode, durations.pomodoro, durations.shortBreak, durations.longBreak]);

  // We must define play before handleSessionComplete if handleSessionComplete calls play
  // However, handleSessionComplete can just use setTimeout(() => setIsRunning(true), 800)
  // which works with our useEffect that listens to isRunning.
  const handleSessionComplete = useCallback(async (isSkipped = false) => {
    playChime(!soundEnabled, chimeStyle);
    const currentMode = modeRef.current;
    const currentCount = sessionCountRef.current;

    if (currentMode === MODES.pomodoro || currentMode === MODES.stopwatch) {
      // Calculate actual studied duration
      let studiedDuration = durations.pomodoro;
      if (currentMode === MODES.stopwatch) {
        studiedDuration = sessionCountRef.currentElapsed || 0;
      } else if (isSkipped) {
        // If skipped, record only the time studied so far (total duration minus time remaining)
        studiedDuration = Math.max(0, durations.pomodoro - timeLeftRef.current);
      }

      // Save to Firestore if user studied for at least 1 second
      if (currentUser && studiedDuration > 0) {
        try {
          await addSession(currentUser.uid, {
            subject,
            duration: studiedDuration,
            mode: studyMode,
            date: new Date().toISOString().split('T')[0],
            timestamp: Date.now(),
          });
        } catch (e) {
          console.error('Failed to save session:', e);
        }
      }

      if (currentMode === MODES.stopwatch) {
        if (notifyOnComplete) toast?.('Stopwatch session recorded.', 'success', 3000);
        sendBrowserNotification('Flowstate', 'Stopwatch session recorded!');
        return; // Stopwatch just stops and saves
      }

      // Auto-complete linked task on focus session end
      if (linkedTaskId && onTaskComplete) {
        onTaskComplete(linkedTaskId);
      }

      const newCount = currentCount + 1;
      setSessionCount(newCount);
      sessionCountRef.current = newCount;

      if (newCount % longBreakInterval === 0) {
        const msg = `${newCount} sessions done — long break time! 🎉`;
        if (notifyOnComplete) toast?.(msg, 'longbreak', 4000);
        sendBrowserNotification('Flowstate — Long Break!', msg);
        setMode(MODES.longBreak);
        if (autoStartBreaks) setTimeout(() => setIsRunning(true), 800);
      } else {
        if (notifyOnComplete) {
          if (isSkipped && studiedDuration > 0) {
            const mins = Math.floor(studiedDuration / 60);
            const secs = studiedDuration % 60;
            const timeLabel = mins > 0 ? `${mins}m${secs > 0 ? ` ${secs}s` : ''}` : `${secs}s`;
            toast?.(`Focus session ended early (${timeLabel} logged). Take a short break.`, 'focus', 3500);
          } else {
            toast?.('Session complete. Take a short break! ☕', 'focus', 3500);
          }
        }
        sendBrowserNotification('Flowstate — Break Time!', 'Great focus session! Take a short break.');
        setMode(MODES.shortBreak);
        if (autoStartBreaks) setTimeout(() => setIsRunning(true), 800);
      }
    } else {
      if (notifyOnComplete) toast?.('Break over — back to focus! 🚀', 'info', 3500);
      sendBrowserNotification('Flowstate — Focus Time!', 'Break is over. Time to focus!');
      setMode(MODES.pomodoro);
      if (autoStartPomodoros) setTimeout(() => setIsRunning(true), 800);
    }
  }, [currentUser, subject, studyMode, durations, longBreakInterval, autoStartBreaks, autoStartPomodoros, soundEnabled, notifyOnComplete, chimeStyle, linkedTaskId, onTaskComplete, toast]);

  const play = useCallback(() => {
    setIsRunning(true);
  }, []);

  useEffect(() => {
    if (isRunning) {
      // Initialize Web Audio API context on first user interaction if needed
      if (soundEnabled && !audioCtx) {
         try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
      }

      setSessionStart(Date.now());
      if (modeRef.current === MODES.stopwatch) {
        targetTimeRef.current = Date.now() - (timeLeftRef.current * 1000) - (stopwatchMsRef.current * 10);
      } else {
        targetTimeRef.current = Date.now() + (timeLeftRef.current * 1000);
      }

      const tickRate = modeRef.current === MODES.stopwatch ? 35 : 250;

      intervalRef.current = setInterval(() => {
        const now = Date.now();
        if (modeRef.current === MODES.stopwatch) {
          const elapsedTotalMs = Math.max(0, now - targetTimeRef.current);
          const elapsedSec = Math.floor(elapsedTotalMs / 1000);
          const centis = Math.floor((elapsedTotalMs % 1000) / 10);
          sessionCountRef.currentElapsed = elapsedSec;
          setTimeLeft(elapsedSec);
          setStopwatchMs(centis);
          // Tab title for stopwatch
          const sw_m = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
          const sw_s = String(elapsedSec % 60).padStart(2, '0');
          document.title = `[${sw_m}:${sw_s}] Flowstate`;
        } else {
          const remaining = Math.max(0, Math.ceil((targetTimeRef.current - now) / 1000));
          setTimeLeft(remaining);
          // Update tab title with live countdown
          const modeLabel = modeRef.current === MODES.pomodoro ? '🎯' :
                            modeRef.current === MODES.shortBreak ? '☕' : '🌙';
          document.title = `${modeLabel} [${formatTitleTime(remaining)}] Flowstate`;
          
          if (remaining <= 0) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            document.title = 'Flowstate';
            handleSessionComplete(false);
          }
        }
      }, tickRate);
    } else {
      clearInterval(intervalRef.current);
      // Restore tab title when paused
      document.title = 'Flowstate';
    }
    return () => {
      clearInterval(intervalRef.current);
      document.title = 'Flowstate';
    };
  }, [isRunning, handleSessionComplete, soundEnabled]);

  const pause = useCallback(() => setIsRunning(false), []);

  const reset = useCallback(() => {
    setIsRunning(false);
    if (modeRef.current === MODES.stopwatch) {
      setTimeLeft(0);
      setStopwatchMs(0);
    } else {
      setTimeLeft(durations[modeRef.current]);
    }
  }, [durations]);

  const skip = useCallback(() => {
    setIsRunning(false);
    handleSessionComplete(true);
  }, [handleSessionComplete]);

  const switchMode = useCallback((newMode) => {
    setIsRunning(false);
    setMode(newMode);
  }, []);

  const totalDuration = durations[mode] || 1;
  const progress = mode === MODES.stopwatch ? 0 : (totalDuration - timeLeft) / totalDuration;

  return {
    mode, timeLeft, stopwatchMs, isRunning, sessionCount,
    subject, setSubject, studyMode, setStudyMode,
    progress, play, pause, reset, skip, switchMode, MODES,
    totalDuration,
  };
};
