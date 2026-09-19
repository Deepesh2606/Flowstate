import React, { useState, useEffect, useRef, useCallback } from 'react';
import TimerDisplay from './TimerDisplay';
import ModePills from './ModePills';
import SubjectSelector from './SubjectSelector';
import SessionCounter from './SessionCounter';
import CountdownGlow from './CountdownGlow';
import SessionNoteModal from './SessionNoteModal';
import MotivationalQuote from './MotivationalQuote';
import ShareCard from './ShareCard';
import { IconBook, IconMaximize, IconMinimize, IconPip } from '../Icons';
import { usePictureInPicture, PiPWindowPortal } from './PictureInPicture';
import PipHelpModal from './PipHelpModal';
import { useTimer } from '../../hooks/useTimer';
import { useToast } from '../Toast/ToastProvider';
import { useAuth } from '../../contexts/AuthContext';
import { useTasks } from '../../hooks/useTasks';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const TimerTab = ({ settings, hasWallpaper, onTabChange, initialMode, onInitialModeConsumed, timerActionsRef, onModeChange }) => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { tasks } = useTasks();

  // ─── Session note + share state ────────────────────────────────────────────
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteSessionInfo, setNoteSessionInfo] = useState(null);
  const [showShareCard, setShowShareCard] = useState(false);
  const [shareInfo, setShareInfo] = useState(null);
  const lastSessionDurationRef = useRef(0);

  // ─── Linked task state ─────────────────────────────────────────────────────
  const [linkedTaskId, setLinkedTaskId] = useState(null);
  const [showTaskPicker, setShowTaskPicker] = useState(false);

  const handleTaskComplete = useCallback(async (taskId) => {
    if (!currentUser || !taskId) return;
    try {
      const ref = doc(db, 'users', currentUser.uid, 'tasks', taskId);
      await updateDoc(ref, { completed: true });
      toast('✅ Linked task marked complete!', 'success', 3000);
      setLinkedTaskId(null);
    } catch (e) {
      console.warn('Failed to auto-complete task:', e);
    }
  }, [currentUser, toast]);

  const {
    mode,
    timeLeft,
    stopwatchMs,
    isRunning,
    sessionCount,
    subject,
    setSubject,
    studyMode,
    setStudyMode,
    progress,
    totalDuration,
    play,
    pause,
    reset,
    skip,
    switchMode,
  } = useTimer(settings, toast, { linkedTaskId, onTaskComplete: handleTaskComplete });

  // ─── Stopwatch laps ────────────────────────────────────────────────────────
  const [laps, setLaps] = useState([]);
  const lastLapTimeRef = useRef(0);

  const handleLap = useCallback(() => {
    const currentMs = timeLeft * 1000 + (stopwatchMs * 10);
    const delta = currentMs - lastLapTimeRef.current;
    const lapNum = laps.length + 1;
    setLaps(prev => [...prev, { num: lapNum, total: currentMs, delta }]);
    lastLapTimeRef.current = currentMs;
  }, [timeLeft, stopwatchMs, laps.length]);

  const formatLapTime = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(centis).padStart(2,'0')}`;
  };

  // Reset laps when stopwatch resets
  useEffect(() => {
    if (mode === 'stopwatch' && timeLeft === 0 && !isRunning) {
      setLaps([]);
      lastLapTimeRef.current = 0;
    }
  }, [mode, timeLeft, isRunning]);

  // ─── Session note trigger after session completes ──────────────────────────
  const prevIsRunningRef = useRef(isRunning);
  const prevModeRef = useRef(mode);

  useEffect(() => {
    // Detect transition: was running focus → now stopped and mode changed (session ended)
    if (
      prevIsRunningRef.current &&
      !isRunning &&
      prevModeRef.current === 'pomodoro' &&
      mode !== 'pomodoro'
    ) {
      const duration = totalDuration ? totalDuration - Math.max(0, timeLeft) : 0;
      if (duration > 30) { // only show for sessions > 30s
        lastSessionDurationRef.current = duration;
        setNoteSessionInfo({ duration, subject });
        setTimeout(() => setShowNoteModal(true), 600); // short delay so mode transition completes
      }
    }
    prevIsRunningRef.current = isRunning;
    prevModeRef.current = mode;
  }, [isRunning, mode, subject, timeLeft, totalDuration]);

  const handleNoteSave = useCallback(({ note, mood }) => {
    if (note || mood) {
      console.log('[Flowstate] Session note:', { note, mood, duration: lastSessionDurationRef.current });
      toast(`Note saved ${mood ? mood : ''}`, 'success', 2000);
    }
    setShowNoteModal(false);
    // Offer share card
    setShareInfo({ duration: lastSessionDurationRef.current, subject: noteSessionInfo?.subject });
    setTimeout(() => setShowShareCard(true), 400);
  }, [toast, noteSessionInfo]);

  // ─── Timer controls ────────────────────────────────────────────────────────
  const handlePlay = () => play();
  const handlePause = () => pause();
  const handleReset = () => {
    reset();
    setLaps([]);
    lastLapTimeRef.current = 0;
  };

  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const handleSkipClick = () => setShowSkipConfirm(true);
  const handleConfirmSkip = () => {
    setShowSkipConfirm(false);
    skip();
  };
  const handleSwitchMode = (newMode) => {
    switchMode(newMode);
    onModeChange?.(newMode);
  };

  // Sync external mode changes (auto-advance) back to AppShell
  useEffect(() => {
    onModeChange?.(mode);
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Expose timer actions to AppShell for keyboard shortcuts
  useEffect(() => {
    if (timerActionsRef) {
      timerActionsRef.current = {
        togglePlay: () => (isRunning ? handlePause() : handlePlay()),
        reset: handleReset,
        skip: mode !== 'stopwatch' ? handleSkipClick : undefined,
      };
    }
  });

  // ─── Initial mode from clock navigation ───────────────────────────────────
  useEffect(() => {
    if (initialMode) {
      switchMode(initialMode);
      if (onInitialModeConsumed) onInitialModeConsumed();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode]);

  // ─── Fullscreen ───────────────────────────────────────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.warn(err));
    } else {
      document.exitFullscreen();
    }
  };

  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const { isPipActive, togglePip, pipDoc, showPipHelp, setShowPipHelp } = usePictureInPicture({
    timeLeft, stopwatchMs, mode, isRunning, progress, subject, sessionCount,
    clockStyle: settings?.clockStyle || 'digital',
    play: handlePlay, pause: handlePause, reset: handleReset, skip: handleConfirmSkip, toast,
  });

  const linkedTask = tasks?.find(t => t.id === linkedTaskId && !t.completed);
  const pendingTasks = tasks?.filter(t => !t.completed) || [];

  return (
    <div className="timer-tab-wrapper">
      {/* Countdown Glow */}
      <CountdownGlow timeLeft={timeLeft} mode={mode} isRunning={isRunning} />

      {/* Mode Pills */}
      <ModePills mode={mode} onSwitch={handleSwitchMode} />

      {/* Timer Card */}
      <TimerDisplay
        progress={progress}
        timeLeft={timeLeft}
        stopwatchMs={stopwatchMs}
        mode={mode}
        isRunning={isRunning}
        hasWallpaper={hasWallpaper}
        clockStyle={settings?.clockStyle || 'digital'}
        showSeconds={settings?.showSeconds ?? true}
      />

      {/* Centered Focus Topic Badge & Session Counter */}
      <div className="timer-focus-center-container">
        {subject ? (
          <div
            className="current-focus-badge"
            onClick={() => setIsEditingSubject(true)}
            title="Click to change what you are focusing on"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditingSubject(true)}
            id="current-focus-badge"
          >
            <span className="focus-badge-pulse" />
            <span className="focus-badge-tag">FOCUSING ON</span>
            <span className="focus-badge-text">{subject}</span>
            <span className="focus-badge-edit-icon" aria-hidden="true">✎</span>
          </div>
        ) : (
          <button
            type="button"
            className="current-focus-prompt-btn"
            onClick={() => {
              setIsEditingSubject(true);
              setTimeout(() => { const el = document.getElementById('subject-text-input'); if (el) el.focus(); }, 60);
            }}
            id="btn-set-focus-prompt"
          >
            <span className="focus-prompt-plus">+</span>
            <span>Set what you're focusing on</span>
          </button>
        )}
        <div className="timer-counter-wrapper">
          <SessionCounter count={sessionCount} />
        </div>
      </div>

      {/* Linked Task Row */}
      {currentUser && mode === 'pomodoro' && (
        <div className="linked-task-row">
          {linkedTask ? (
            <div className="linked-task-badge">
              <span className="linked-task-icon">🔗</span>
              <span className="linked-task-text">{linkedTask.text}</span>
              <button
                type="button"
                className="linked-task-unlink"
                onClick={() => setLinkedTaskId(null)}
                title="Unlink task"
              >✕</button>
            </div>
          ) : (
            <button
              type="button"
              className="linked-task-prompt"
              onClick={() => setShowTaskPicker(v => !v)}
              id="btn-link-task"
            >
              <span>🔗</span> Link a task
            </button>
          )}
          {showTaskPicker && !linkedTask && (
            <div className="linked-task-picker">
              {pendingTasks.length === 0 ? (
                <div className="linked-task-picker-empty">No pending tasks</div>
              ) : (
                pendingTasks.slice(0, 6).map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className="linked-task-option"
                    onClick={() => { setLinkedTaskId(t.id); setShowTaskPicker(false); }}
                  >
                    {t.text}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flocus-controls">
        <button
          className="flocus-ctrl-btn"
          onClick={isRunning ? handlePause : handlePlay}
          aria-label={isRunning ? 'Pause' : 'Play'}
          title={isRunning ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isRunning ? '⏸' : '▶'}
        </button>
        <button className="flocus-ctrl-btn" onClick={handleReset} aria-label="Reset" title="Reset (R)">
          ↺
        </button>
        {mode === 'stopwatch' && isRunning && (
          <button
            className="flocus-ctrl-btn"
            onClick={handleLap}
            aria-label="Lap"
            title="Record lap time"
            style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em' }}
          >
            LAP
          </button>
        )}
        {mode !== 'stopwatch' && (
          <button
            className="flocus-ctrl-btn"
            onClick={handleSkipClick}
            aria-label="Skip session"
            title="Skip (S)"
          >
            ⏭
          </button>
        )}
        <button
          className="flocus-ctrl-btn"
          onClick={toggleFullscreen}
          aria-label="Toggle Fullscreen"
          style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isFullscreen ? <IconMinimize size={20} /> : <IconMaximize size={20} />}
        </button>
        <button
          className={`flocus-ctrl-btn ${isPipActive ? 'active' : ''}`}
          onClick={togglePip}
          aria-label="Picture-in-Picture"
          title="Picture-in-Picture (floating mini timer)"
          style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          id="timer-pip-btn"
        >
          <IconPip size={18} />
        </button>
      </div>

      {/* Keyboard shortcut hint */}
      <div className="keyboard-hints">
        <span>Space <span className="keyboard-hint-sep">·</span> play/pause</span>
        <span>R <span className="keyboard-hint-sep">·</span> reset</span>
        {mode !== 'stopwatch' && <span>S <span className="keyboard-hint-sep">·</span> skip</span>}
      </div>

      {/* Motivational Quote */}
      <MotivationalQuote
        enabled={settings?.showQuotes ?? true}
        onSessionStart={isRunning ? Date.now() : null}
      />

      {/* Stopwatch Laps */}
      {mode === 'stopwatch' && laps.length > 0 && (
        <div className="stopwatch-laps-container">
          <div className="stopwatch-laps-header">
            <span>Lap Times</span>
            <button type="button" className="laps-clear-btn" onClick={() => { setLaps([]); lastLapTimeRef.current = 0; }}>
              Clear
            </button>
          </div>
          <div className="stopwatch-laps-list">
            {[...laps].reverse().map((lap, i) => (
              <div key={lap.num} className={`stopwatch-lap-row ${i === 0 ? 'lap-latest' : ''}`}>
                <span className="lap-num">Lap {lap.num}</span>
                <span className="lap-delta">+{formatLapTime(lap.delta)}</span>
                <span className="lap-total">{formatLapTime(lap.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subject Selector */}
      <SubjectSelector
        subject={subject}
        setSubject={setSubject}
        studyMode={studyMode}
        setStudyMode={setStudyMode}
        targets={settings?.targets || []}
        isRunning={isRunning}
        isEditing={isEditingSubject}
        setIsEditing={setIsEditingSubject}
      />

      {/* Skip Confirmation Dialog */}
      {showSkipConfirm && (
        <div
          className="drawer-overlay"
          style={{ zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => setShowSkipConfirm(false)}
        >
          <div
            className="skip-confirm-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="skip-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="skip-confirm-header">
              <span className="skip-confirm-icon">⏭</span>
              <h3 id="skip-confirm-title" className="skip-confirm-title">
                Skip {mode === 'pomodoro' ? 'Focus Session' : 'Break'}?
              </h3>
            </div>
            <div className="skip-confirm-desc">
              {mode === 'pomodoro' ? (
                <>Skipping will <strong>end this focus block</strong> early, log it to your daily stats, and advance to your <strong>{(sessionCount + 1) % (settings?.longBreakInterval || 4) === 0 ? 'Long Break' : 'Short Break'}</strong>.</>
              ) : (
                <>Skipping will <strong>conclude your break immediately</strong> and advance directly to your next focus block.</>
              )}
            </div>
            <div className="skip-confirm-actions">
              <button type="button" className="skip-btn-cancel" onClick={() => setShowSkipConfirm(false)}>Keep Going</button>
              <button type="button" className="skip-btn-confirm" onClick={handleConfirmSkip}>Yes, Skip</button>
            </div>
          </div>
        </div>
      )}

      {/* PiP Portal */}
      <PiPWindowPortal
        pipDoc={pipDoc}
        timeLeft={timeLeft}
        mode={mode}
        isRunning={isRunning}
        subject={subject}
        sessionCount={sessionCount}
        onPlay={handlePlay}
        onPause={handlePause}
        onReset={handleReset}
        onSkip={handleConfirmSkip}
      />

      {/* PiP Help Modal */}
      <PipHelpModal isOpen={showPipHelp} onClose={() => setShowPipHelp(false)} />

      {/* Session Note Modal */}
      <SessionNoteModal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        onSave={handleNoteSave}
        sessionInfo={noteSessionInfo}
      />

      {/* Share Card */}
      <ShareCard
        isOpen={showShareCard}
        onClose={() => setShowShareCard(false)}
        duration={shareInfo?.duration}
        subject={shareInfo?.subject}
        sessionCount={sessionCount}
      />
    </div>
  );
};

export default TimerTab;
