import React, { useState, useEffect } from 'react';
import TimerDisplay from './TimerDisplay';
import ModePills from './ModePills';
import SubjectSelector from './SubjectSelector';
import SessionCounter from './SessionCounter';
import { IconBook, IconMaximize, IconMinimize } from '../Icons';
import { useTimer } from '../../hooks/useTimer';
import { useToast } from '../Toast/ToastProvider';

const TimerTab = ({ settings, hasWallpaper }) => {
  const { toast } = useToast();

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
    play,
    pause,
    reset,
    skip,
    switchMode,
  } = useTimer(settings, toast);

  const handlePlay = () => {
    play();
  };

  const handlePause = () => {
    pause();
  };

  const handleReset = () => {
    reset();
  };

  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const handleSkipClick = () => {
    setShowSkipConfirm(true);
  };

  const handleConfirmSkip = () => {
    setShowSkipConfirm(false);
    skip();
  };

  const handleSwitchMode = (newMode) => {
    switchMode(newMode);
  };

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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

      {/* Subject chip + session counter row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
        {subject ? (
          <div className="current-subject-chip" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconBook size={14} /> {subject}
          </div>
        ) : (
          <div />
        )}
        <SessionCounter count={sessionCount} />
      </div>

      {/* Controls */}
      <div className="flocus-controls">
        <button
          className="flocus-ctrl-btn"
          onClick={isRunning ? handlePause : handlePlay}
          aria-label={isRunning ? 'Pause' : 'Play'}
        >
          {isRunning ? '⏸' : '▶'}
        </button>
        <button
          className="flocus-ctrl-btn"
          onClick={handleReset}
          aria-label="Reset"
        >
          ↺
        </button>
        {mode !== 'stopwatch' && (
          <button
            className="flocus-ctrl-btn"
            onClick={handleSkipClick}
            aria-label="Skip session"
            title="Skip session"
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
      </div>

      {/* Subject Selector */}
      <SubjectSelector
        subject={subject}
        setSubject={setSubject}
        studyMode={studyMode}
        setStudyMode={setStudyMode}
        targets={settings?.targets || []}
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
                <>
                  Skipping will <strong>end this focus block</strong> early, log it to your daily stats, increment your session counter, and advance you to your <strong>{(sessionCount + 1) % (settings?.longBreakInterval || 4) === 0 ? 'Long Break' : 'Short Break'}</strong>.
                </>
              ) : (
                <>
                  Skipping will <strong>conclude your break immediately</strong> and advance directly to your next focus block.
                </>
              )}
            </div>
            <div className="skip-confirm-actions">
              <button
                type="button"
                className="skip-btn-cancel"
                onClick={() => setShowSkipConfirm(false)}
              >
                Keep Going
              </button>
              <button
                type="button"
                className="skip-btn-confirm"
                onClick={handleConfirmSkip}
              >
                Yes, Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimerTab;
