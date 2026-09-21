import React, { useState, useEffect, useRef, useCallback } from 'react';
import TimerDisplay from './TimerDisplay';
import ModePills from './ModePills';
import SubjectSelector from './SubjectSelector';
import SessionCounter from './SessionCounter';
import CountdownGlow from './CountdownGlow';
import SessionNoteModal from './SessionNoteModal';
import MotivationalQuote from './MotivationalQuote';
import ShareCard from './ShareCard';
import { IconBook, IconMaximize, IconMinimize, IconPip, IconHeadphones, IconRotateCcw, IconX, IconSave, IconTrash, IconClock, IconPlay, IconPause, IconSkipForward } from '../Icons';
import { usePictureInPicture, PiPWindowPortal } from './PictureInPicture';
import PipHelpModal from './PipHelpModal';
import GhostPacer from './GhostPacer';
import SessionScratchpad from './SessionScratchpad';
import ActiveRecallModal from './ActiveRecallModal';
import { useTimer } from '../../hooks/useTimer';
import { useToast } from '../Toast/ToastProvider';
import { useAuth } from '../../contexts/AuthContext';
import { useAudio } from '../../contexts/AudioContext';
import { useTasks } from '../../hooks/useTasks';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const TimerTab = ({ settings, onUpdateSettings, hasWallpaper, onTabChange, initialMode, onInitialModeConsumed, timerActionsRef, onModeChange }) => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { tasks } = useTasks();
  const { isAnyPlaying, isPlaybackPaused, openMusicPlayer, setShowAudioDrawer } = useAudio();

  // ─── Session note + share state ────────────────────────────────────────────
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteSessionInfo, setNoteSessionInfo] = useState(null);
  const [showShareCard, setShowShareCard] = useState(false);
  const [shareInfo, setShareInfo] = useState(null);
  const lastSessionDurationRef = useRef(0);

  // ─── Linked task state ─────────────────────────────────────────────────────
  const [linkedTaskId, setLinkedTaskId] = useState(null);
  const [showTaskPicker, setShowTaskPicker] = useState(false);

  // ─── Active Recall state ───────────────────────────────────────────────────
  const [showActiveRecall, setShowActiveRecall] = useState(false);
  const [recallContext, setRecallContext] = useState({ notes: '', subject: '' });

  const handleTriggerRecall = useCallback((notes, subj) => {
    setRecallContext({ notes: notes || '', subject: subj || subject || '' });
    setShowActiveRecall(true);
  }, [subject]);

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
    saveAndReset,
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

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const handleResetClick = () => {
    const elapsed = mode === 'stopwatch' ? timeLeft : (totalDuration - timeLeft);
    if (isRunning || (mode === 'stopwatch' ? (stopwatchMs > 0 || timeLeft > 0) : elapsed > 5)) {
      setShowResetConfirm(true);
    } else {
      handleReset();
    }
  };
  const handleConfirmReset = () => {
    setShowResetConfirm(false);
    handleReset();
  };
  const handleSaveAndReset = async () => {
    setShowResetConfirm(false);
    await saveAndReset();
    setLaps([]);
    lastLapTimeRef.current = 0;
  };
  const handleSwitchMode = (newMode) => {
    switchMode(newMode);
    onModeChange?.(newMode);
  };

  const handlePresetClick = (mins) => {
    const sec = mins * 60;
    if (onUpdateSettings) {
      onUpdateSettings({
        durations: {
          ...settings?.durations,
          pomodoro: sec,
        },
      });
    }
    if (settings?.durations?.pomodoro === sec) {
      handleReset();
    }
  };

  // Sync external mode changes (auto-advance) back to AppShell
  useEffect(() => {
    onModeChange?.(mode);
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Expose timer actions to AppShell for keyboard shortcuts
  useEffect(() => {
    if (timerActionsRef) {
      timerActionsRef.current = {
        play: handlePlay,
        pause: handlePause,
        togglePlay: () => (isRunning ? handlePause() : handlePlay()),
        reset: handleResetClick,
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

      {/* Popular Focus Presets (Minimal Buttons for 15m, 25m, 45m, 50m, 60m) */}
      {mode === 'pomodoro' && (
        <div className="focus-presets-row" role="group" aria-label="Quick focus durations">
          {[
            { mins: 15, label: '15m' },
            { mins: 25, label: '25m', popular: true },
            { mins: 45, label: '45m' },
            { mins: 50, label: '50m' },
            { mins: 60, label: '60m' },
          ].map((preset) => {
            const currentMins = Math.round((settings?.durations?.pomodoro || 45 * 60) / 60);
            const isSelected = currentMins === preset.mins;
            return (
              <button
                key={preset.mins}
                type="button"
                className={`focus-preset-btn ${isSelected ? 'active' : ''}`}
                onClick={() => handlePresetClick(preset.mins)}
                title={preset.popular ? `Popular 25 min Pomodoro timer` : `Set focus timer to ${preset.mins} minutes`}
              >
                {preset.popular && <span className="focus-preset-popular-dot" aria-hidden="true" />}
                {preset.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Timer Card */}
      <TimerDisplay
        progress={progress}
        timeLeft={timeLeft}
        stopwatchMs={stopwatchMs}
        mode={mode}
        isRunning={isRunning}
        hasWallpaper={hasWallpaper}
        clockStyle={settings?.clockStyle || 'digital'}
        timerStyle={settings?.timerStyle || 'default'}
        showProgressBar={settings?.showTimerProgressBar ?? true}
        showSeconds={settings?.showSeconds ?? true}
      />

      {/* Centered Focus Topic Badge & Session Counter */}
      <div className="timer-focus-center-container">
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
        <div className="timer-counter-wrapper">
          <SessionCounter
            count={sessionCount}
            dailyGoal={settings?.dailyGoal || 8}
            longBreakInterval={settings?.longBreakInterval || 4}
          />
        </div>
      </div>

      {/* Ghost Pacer: Race Against Yesterday's You */}
      <GhostPacer />

      {/* Session Scratchpad for active notes & flashcard generation */}
      <SessionScratchpad onTriggerRecall={handleTriggerRecall} subject={subject} />

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
          {isRunning ? <IconPause size={20} /> : <IconPlay size={20} />}
        </button>
        <button className="flocus-ctrl-btn" onClick={handleResetClick} aria-label="Reset" title="Reset (R)">
          <IconRotateCcw size={18} />
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
            <IconSkipForward size={18} />
          </button>
        )}
        <button
          className="flocus-ctrl-btn"
          onClick={toggleFullscreen}
          aria-label="Toggle Fullscreen"
          title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
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
        <button
          className={`flocus-ctrl-btn ${(isAnyPlaying || isPlaybackPaused) ? 'active' : ''}`}
          onClick={() => {
            if (isAnyPlaying || isPlaybackPaused) {
              setShowAudioDrawer(true);
            } else {
              openMusicPlayer('spotify');
            }
          }}
          aria-label="Focus Music Player (Spotify, Apple Music, YouTube Music)"
          title="Focus Music (Spotify, Apple Music, YT Music, Lofi)"
          style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
          id="timer-music-btn"
        >
          <IconHeadphones size={18} />
          {(isAnyPlaying || isPlaybackPaused) && (
            <span
              style={{
                position: 'absolute',
                top: '7px',
                right: '7px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--accent, #06b6d4)',
                boxShadow: '0 0 6px var(--accent, #06b6d4)',
              }}
            />
          )}
        </button>
      </div>

      {/* Keyboard shortcut hint */}
      <div className="keyboard-hints">
        <span>Space <span className="keyboard-hint-sep">·</span> play/pause</span>
        <span>R <span className="keyboard-hint-sep">·</span> reset</span>
        {mode !== 'stopwatch' && <span>S <span className="keyboard-hint-sep">·</span> skip</span>}
        <span>F <span className="keyboard-hint-sep">·</span> fullscreen</span>
        {mode !== 'pomodoro' && <span>T <span className="keyboard-hint-sep">·</span> timer</span>}
      </div>

      {/* Motivational Quote */}
      <MotivationalQuote
        enabled={settings?.showQuotes ?? true}
        isRunning={isRunning}
        sessionCount={sessionCount}
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

      {/* Bottom clearance spacer to prevent any overlap with bottom bar */}
      <div className="timer-tab-bottom-spacer" aria-hidden="true" />

      {/* Premium Skip Confirmation Dialog */}
      {showSkipConfirm && (
        <div
          className="reset-modal-overlay"
          onClick={() => setShowSkipConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="skip-confirm-title"
        >
          <div
            className="reset-modal-card skip-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="reset-modal-close-btn"
              onClick={() => setShowSkipConfirm(false)}
              aria-label="Close dialog"
            >
              <IconX size={16} />
            </button>

            <div className="reset-modal-icon-ring skip-ring">
              <IconSkipForward size={24} color="var(--accent, #06b6d4)" />
            </div>

            <h3 id="skip-confirm-title" className="reset-modal-title">
              Skip {mode === 'pomodoro' ? 'Focus Session' : 'Break'}?
            </h3>

            <p className="reset-modal-desc">
              {mode === 'pomodoro' ? (
                <>Ending early will log your progress and advance to your <strong>{(sessionCount + 1) % (settings?.longBreakInterval || 4) === 0 ? 'Long Break' : 'Short Break'}</strong>.</>
              ) : (
                <>This will conclude your break immediately and start your next <strong>Focus Session</strong>.</>
              )}
            </p>

            <div className="reset-modal-actions">
              <button
                type="button"
                className="reset-modal-btn-cancel"
                onClick={() => setShowSkipConfirm(false)}
              >
                Keep Going
              </button>
              <button
                type="button"
                className="reset-modal-btn-confirm skip-confirm"
                onClick={handleConfirmSkip}
                autoFocus
              >
                Skip Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div
          className="reset-modal-overlay"
          onClick={() => setShowResetConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-confirm-title"
        >
          <div
            className="reset-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="reset-modal-close-btn"
              onClick={() => setShowResetConfirm(false)}
              aria-label="Close dialog"
            >
              <IconX size={16} />
            </button>

            <div className="reset-modal-icon-ring">
              <IconRotateCcw size={26} color="#ef4444" />
            </div>

            <h3 id="reset-confirm-title" className="reset-modal-title">
              Reset {mode === 'pomodoro' ? 'Focus Session' : mode === 'stopwatch' ? 'Stopwatch' : 'Timer'}?
            </h3>

            {/* Session Stats & Progress Card */}
            {(() => {
              const elapsed = mode === 'stopwatch' ? timeLeft : Math.max(0, totalDuration - timeLeft);
              const m = Math.floor(elapsed / 60);
              const s = elapsed % 60;
              const timeLabel = m > 0 ? `${m}m ${s}s` : `${s}s`;
              const pct = mode === 'stopwatch' ? 100 : Math.min(100, Math.round((elapsed / totalDuration) * 100));

              return (
                <div className="reset-modal-progress-card">
                  <div className="reset-modal-progress-header">
                    <div className="reset-modal-time-badge">
                      <IconClock size={14} />
                      <span><strong>{timeLabel}</strong> elapsed</span>
                    </div>
                    {subject && (
                      <span className="reset-modal-subject-pill">
                        {subject}
                      </span>
                    )}
                  </div>
                  {mode !== 'stopwatch' && (
                    <div className="reset-modal-progress-bar-track">
                      <div
                        className="reset-modal-progress-bar-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                  <p className="reset-modal-desc">
                    {elapsed >= 15 && (mode === 'pomodoro' || mode === 'stopwatch') ? (
                      <>You've made good progress! You can <strong>save these minutes</strong> to your stats or start fresh.</>
                    ) : (
                      <>This will clear current progress and return the timer to <strong>{Math.round(totalDuration / 60)}:00</strong>.</>
                    )}
                  </p>
                </div>
              );
            })()}

            <div className="reset-modal-actions-stacked">
              {(() => {
                const elapsed = mode === 'stopwatch' ? timeLeft : Math.max(0, totalDuration - timeLeft);
                const canSave = elapsed >= 15 && (mode === 'pomodoro' || mode === 'stopwatch');

                return (
                  <>
                    {canSave && (
                      <button
                        type="button"
                        className="reset-modal-btn-save"
                        onClick={handleSaveAndReset}
                      >
                        <IconSave size={16} />
                        <span>Save & Reset ({Math.floor(elapsed / 60)}m logged)</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="reset-modal-btn-discard"
                      onClick={handleConfirmReset}
                      autoFocus={!canSave}
                    >
                      <IconTrash size={16} />
                      <span>{canSave ? 'Discard & Reset' : 'Reset Timer'}</span>
                    </button>
                    <button
                      type="button"
                      className="reset-modal-btn-cancel"
                      onClick={() => setShowResetConfirm(false)}
                    >
                      Keep Going
                    </button>
                  </>
                );
              })()}
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
        onTriggerRecall={handleTriggerRecall}
        sessionInfo={noteSessionInfo}
      />

      {/* Active Recall AI Flashcards */}
      <ActiveRecallModal
        isOpen={showActiveRecall}
        onClose={() => setShowActiveRecall(false)}
        notes={recallContext.notes}
        subject={recallContext.subject}
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
