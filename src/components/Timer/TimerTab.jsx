import React from 'react';
import TimerDisplay from './TimerDisplay';
import ModePills from './ModePills';
import TimerControls from './TimerControls';
import SubjectSelector from './SubjectSelector';
import SessionCounter from './SessionCounter';
import { useTimer } from '../../hooks/useTimer';
import { useToast } from '../Toast/ToastProvider';

const TimerTab = ({ settings }) => {
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
    if (mode === 'pomodoro') toast(`Focusing on ${subject || 'session'} — Let's go! 🎯`, 'focus');
    else if (mode === 'shortBreak') toast('Break started — breathe! ☕', 'break');
    else toast('Long break — you earned it 🌙', 'longbreak');
  };

  const handlePause = () => {
    pause();
    toast('Timer paused ⏸', 'info');
  };

  const handleReset = () => {
    reset();
    toast('Timer reset ↺', 'info');
  };

  const handleSkip = () => {
    skip();
    toast('Session skipped ⏭', 'warning');
  };

  const handleSwitchMode = (newMode) => {
    switchMode(newMode);
    const labels = { pomodoro: 'Focus mode 🍅', shortBreak: 'Short break ☕', longBreak: 'Long break 🌙' };
    toast(labels[newMode] || 'Mode switched', 'info');
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
      />

      {/* Subject chip + session counter row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
        {subject ? (
          <div className="current-subject-chip">📚 {subject}</div>
        ) : (
          <div />
        )}
        <SessionCounter count={sessionCount} />
      </div>

      {/* Controls */}
      <TimerControls
        isRunning={isRunning}
        onPlay={handlePlay}
        onPause={handlePause}
        onReset={handleReset}
        onSkip={handleSkip}
      />

      {/* Subject Selector */}
      <SubjectSelector
        subject={subject}
        setSubject={setSubject}
        studyMode={studyMode}
        setStudyMode={setStudyMode}
      />
    </div>
  );
};

export default TimerTab;
