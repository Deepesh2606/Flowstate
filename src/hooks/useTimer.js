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
const playChime = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
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
  } catch (e) {
    // Silently fail if audio not supported
  }
};

export const useTimer = (settings) => {
  const { currentUser } = useAuth();
  const durations = settings?.durations || DEFAULT_DURATIONS;

  const [mode, setMode] = useState(MODES.pomodoro);
  const [timeLeft, setTimeLeft] = useState(durations.pomodoro);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0); // completed pomodoros in current cycle (0–3)
  const [subject, setSubject] = useState('Quant');
  const [studyMode, setStudyMode] = useState('SSC CGL'); // 'SSC CGL' | 'General'
  const [sessionStart, setSessionStart] = useState(null);

  const intervalRef = useRef(null);
  const modeRef = useRef(mode);
  const sessionCountRef = useRef(sessionCount);

  modeRef.current = mode;
  sessionCountRef.current = sessionCount;

  // Sync duration when mode or durations change
  useEffect(() => {
    setTimeLeft(durations[mode]);
    setIsRunning(false);
    clearInterval(intervalRef.current);
  }, [mode, durations.pomodoro, durations.shortBreak, durations.longBreak]);

  const handleSessionComplete = useCallback(async () => {
    playChime();
    const currentMode = modeRef.current;
    const currentCount = sessionCountRef.current;

    if (currentMode === MODES.pomodoro) {
      // Save completed session to Firestore
      if (currentUser && sessionStart) {
        const duration = durations.pomodoro;
        try {
          await addSession(currentUser.uid, {
            subject,
            duration,
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

      // After 4 pomodoros → long break, else short break
      if (newCount % 4 === 0) {
        setMode(MODES.longBreak);
      } else {
        setMode(MODES.shortBreak);
      }
    } else {
      // Break ended → back to pomodoro
      setMode(MODES.pomodoro);
    }
  }, [currentUser, sessionStart, subject, studyMode, durations]);

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
    mode,
    timeLeft,
    isRunning,
    sessionCount,
    subject,
    setSubject,
    studyMode,
    setStudyMode,
    progress,
    play,
    pause,
    reset,
    skip,
    switchMode,
    MODES,
  };
};
