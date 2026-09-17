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

const playChime = (muted = false) => {
  if (muted) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const frequencies = [523.25, 659.25, 783.99, 1046.5];
    frequencies.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, audioCtx.currentTime + i * 0.18);
      gain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + i * 0.18 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.18 + 0.5);
      osc.start(audioCtx.currentTime + i * 0.18);
      osc.stop(audioCtx.currentTime + i * 0.18 + 0.6);
    });
  } catch (e) {
    console.error('Audio chime failed:', e);
  }
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
  const timeLeftRef = useRef(timeLeft);
  const targetTimeRef = useRef(null); // Stores the absolute timestamp for calculation

  modeRef.current = mode;
  sessionCountRef.current = sessionCount;
  timeLeftRef.current = timeLeft;

  useEffect(() => {
    if (mode === MODES.stopwatch) {
      setTimeLeft(0);
    } else {
      setTimeLeft(durations[mode]);
    }
    setIsRunning(false);
    clearInterval(intervalRef.current);
  }, [mode, durations.pomodoro, durations.shortBreak, durations.longBreak]);

  // We must define play before handleSessionComplete if handleSessionComplete calls play
  // However, handleSessionComplete can just use setTimeout(() => setIsRunning(true), 800)
  // which works with our useEffect that listens to isRunning.
  const handleSessionComplete = useCallback(async () => {
    playChime(!soundEnabled);
    const currentMode = modeRef.current;
    const currentCount = sessionCountRef.current;

    if (currentMode === MODES.pomodoro || currentMode === MODES.stopwatch) {
      // Save to Firestore
      if (currentUser) {
        try {
          await addSession(currentUser.uid, {
            subject,
            duration: currentMode === MODES.stopwatch ? sessionCountRef.currentElapsed : durations.pomodoro,
            mode: studyMode,
            date: new Date().toISOString().split('T')[0],
            timestamp: Date.now(),
          });
        } catch (e) {
          console.error('Failed to save session:', e);
        }
      }

      if (currentMode === MODES.stopwatch) {
        toast?.(`Stopwatch session saved.`, 'success', 4000);
        return; // Stopwatch just stops and saves
      }

      const newCount = currentCount + 1;
      setSessionCount(newCount);
      sessionCountRef.current = newCount;

      if (newCount % longBreakInterval === 0) {
        toast?.(`${newCount} sessions done! Time for a long break.`, 'longbreak', 5000);
        setMode(MODES.longBreak);
        if (autoStartBreaks) setTimeout(() => setIsRunning(true), 800);
      } else {
        toast?.(`Session complete! Take a short break.`, 'focus', 4000);
        setMode(MODES.shortBreak);
        if (autoStartBreaks) setTimeout(() => setIsRunning(true), 800);
      }
    } else {
      toast?.('Break over — back to focus!', 'info', 4000);
      setMode(MODES.pomodoro);
      if (autoStartPomodoros) setTimeout(() => setIsRunning(true), 800);
    }
  }, [currentUser, subject, studyMode, durations, longBreakInterval, autoStartBreaks, autoStartPomodoros, soundEnabled, toast]);

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
        targetTimeRef.current = Date.now() - (timeLeftRef.current * 1000);
      } else {
        targetTimeRef.current = Date.now() + (timeLeftRef.current * 1000);
      }

      intervalRef.current = setInterval(() => {
        const now = Date.now();
        if (modeRef.current === MODES.stopwatch) {
          const elapsed = Math.floor((now - targetTimeRef.current) / 1000);
          sessionCountRef.currentElapsed = elapsed;
          setTimeLeft(elapsed);
        } else {
          const remaining = Math.max(0, Math.ceil((targetTimeRef.current - now) / 1000));
          setTimeLeft(remaining);
          
          if (remaining <= 0) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            handleSessionComplete();
          }
        }
      }, 250); // High precision tick
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, handleSessionComplete, soundEnabled]);

  const pause = useCallback(() => setIsRunning(false), []);

  const reset = useCallback(() => {
    setIsRunning(false);
    if (modeRef.current === MODES.stopwatch) setTimeLeft(0);
    else setTimeLeft(durations[modeRef.current]);
  }, [durations]);

  const skip = useCallback(() => {
    setIsRunning(false);
    handleSessionComplete();
  }, [handleSessionComplete]);

  const switchMode = useCallback((newMode) => {
    setIsRunning(false);
    setMode(newMode);
  }, []);

  const totalDuration = durations[mode] || 1;
  const progress = mode === MODES.stopwatch ? 0 : (totalDuration - timeLeft) / totalDuration;

  return {
    mode, timeLeft, isRunning, sessionCount,
    subject, setSubject, studyMode, setStudyMode,
    progress, play, pause, reset, skip, switchMode, MODES,
  };
};
