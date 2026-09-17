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
    if (mode === 'pomodoro') toast(subject ? `Focusing on ${subject}` : 'Focus session started', 'focus');
    else if (mode === 'shortBreak') toast('Short break started', 'break');
    else if (mode === 'longBreak') toast('Long break started', 'longbreak');
    else toast('Stopwatch active', 'focus');
  };

  const handlePause = () => {
    pause();
    // User requested no toast on pause
  };

  const handleReset = () => {
    reset();
    toast('Timer reset', 'info');
  };

  const handleSkip = () => {
    skip();
    toast('Session skipped', 'warning');
  };

  const handleSwitchMode = (newMode) => {
    switchMode(newMode);
    // User requested NO toast when switching mode manually
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
        mode={mode}
        isRunning={isRunning}
        hasWallpaper={hasWallpaper}
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
            onClick={handleSkip}
            aria-label="Skip"
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
    </div>
  );
};

export default TimerTab;
