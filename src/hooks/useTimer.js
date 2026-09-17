import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addSession } from '../firebase/firestore';

const MODES = {
  pomodoro: 'pomodoro',
  shortBreak: 'shortBreak',
  longBreak: 'longBreak',
};

const DEFAULT_DURATIONS = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

// Web Audio API chime
const playChime = (muted = false) => {
  if (muted) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const frequencies = [523.25, 659.25, 783.99, 1046.5];
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.18 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.5);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.6);
    });
  } catch (e) {}
};

export const useTimer = (settings, toast) => {
  const { currentUser } = useAuth();
  const durations = settings?.durations || DEFAULT_DURATIONS;
  const longBreakInterval = settings?.longBreakInterval || 4;
  const autoStartBreaks = settings?.autoStartBreaks ?? false;
  const autoStartPomodoros = settings?.autoStartPomodoros ?? false;
  const soundEnabled = settings?.soundEnabled ?? true;

  const [mode, setMode] = useState(MODES.pomodoro);
  const [timeLeft, setTimeLeft] = useState(durations.pomodoro);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [subject, setSubject] = useState('Quant');
  const [studyMode, setStudyMode] = useState('SSC CGL');
  const [sessionStart, setSessionStart] = useState(null);

  const intervalRef = useRef(null);
  const modeRef = useRef(mode);
  const sessionCountRef = useRef(sessionCount);

  modeRef.current = mode;
  sessionCountRef.current = sessionCount;

  useEffect(() => {
    setTimeLeft(durations[mode]);
    setIsRunning(false);
    clearInterval(intervalRef.current);
  }, [mode, durations.pomodoro, durations.shortBreak, durations.longBreak]);

  const handleSessionComplete = useCallback(async () => {
    playChime(!soundEnabled);
    const currentMode = modeRef.current;
    const currentCount = sessionCountRef.current;

    if (currentMode === MODES.pomodoro) {
      // Save to Firestore
      if (currentUser) {
        try {
          await addSession(currentUser.uid, {
            subject,
            duration: durations.pomodoro,
            mode: studyMode,
            date: new Date().toISOString().split('T')[0],
            timestamp: Date.now(),
          });
        } catch (e) {
          console.error('Failed to save session:', e);
        }
      }

      const newCount = currentCount + 1;
      setSessionCount(newCount);
      sessionCountRef.current = newCount;

      if (newCount % longBreakInterval === 0) {
        toast?.(`🍅 ${newCount} sessions done! Time for a long break 🌙`, 'longbreak', 5000);
        setMode(MODES.longBreak);
        if (autoStartBreaks) setTimeout(() => setIsRunning(true), 800);
      } else {
        toast?.(`🍅 Session complete! Take a short break ☕`, 'focus', 4000);
        setMode(MODES.shortBreak);
        if (autoStartBreaks) setTimeout(() => setIsRunning(true), 800);
      }
    } else {
      toast?.('Break over — back to work! 🎯', 'info', 4000);
      setMode(MODES.pomodoro);
      if (autoStartPomodoros) setTimeout(() => setIsRunning(true), 800);
    }
  }, [currentUser, subject, studyMode, durations, longBreakInterval, autoStartBreaks, autoStartPomodoros, soundEnabled, toast]);

  useEffect(() => {
    if (isRunning) {
      setSessionStart(Date.now());
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, handleSessionComplete]);

  const play = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(durations[modeRef.current]);
  }, [durations]);

  const skip = useCallback(() => {
    setIsRunning(false);
    handleSessionComplete();
  }, [handleSessionComplete]);

  const switchMode = useCallback((newMode) => {
    setIsRunning(false);
    setMode(newMode);
  }, []);

  const totalDuration = durations[mode];
  const progress = (totalDuration - timeLeft) / totalDuration;

  return {
    mode, timeLeft, isRunning, sessionCount,
    subject, setSubject, studyMode, setStudyMode,
    progress, play, pause, reset, skip, switchMode, MODES,
  };
};
