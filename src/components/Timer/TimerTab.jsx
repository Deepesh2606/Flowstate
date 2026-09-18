import React, { useState, useEffect } from 'react';
import TimerDisplay from './TimerDisplay';
import ModePills from './ModePills';
import SubjectSelector from './SubjectSelector';
import SessionCounter from './SessionCounter';
import { IconBook, IconMaximize, IconMinimize, IconPip } from '../Icons';
import { usePictureInPicture, PiPWindowPortal } from './PictureInPicture';
import PipHelpModal from './PipHelpModal';
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

  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const { isPipActive, togglePip, pipDoc, showPipHelp, setShowPipHelp } = usePictureInPicture({
    timeLeft,
    stopwatchMs,
    mode,
    isRunning,
    progress,
    subject,
    sessionCount,
    clockStyle: settings?.clockStyle || "digital",
    play: handlePlay,
    pause: handlePause,
    reset: handleReset,
    skip: handleConfirmSkip,
    toast,
  });


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
              setTimeout(() => {
                const el = document.getElementById('subject-text-input');
                if (el) el.focus();
              }, 60);
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
        <button
          className={`flocus-ctrl-btn ${isPipActive ? "active" : ""}`}
          onClick={togglePip}
          aria-label="Picture-in-Picture"
          title="Picture-in-Picture (floating mini timer)"
          style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          id="timer-pip-btn"
        >
          <IconPip size={18} />
        </button>
      </div>

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
      {/* PiP Help Modal for Safari / Unsupported Browsers */}
      <PipHelpModal
        isOpen={showPipHelp}
        onClose={() => setShowPipHelp(false)}
      />
    </div>
  );
};

export default TimerTab;
