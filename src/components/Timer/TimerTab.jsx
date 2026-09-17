import React from 'react';
import CircularProgress from './CircularProgress';
import ModePills from './ModePills';
import TimerControls from './TimerControls';
import SubjectSelector from './SubjectSelector';
import SessionCounter from './SessionCounter';
import { useTimer } from '../../hooks/useTimer';

const TimerTab = ({ settings }) => {
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
  } = useTimer(settings);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Mode Pills */}
      <ModePills mode={mode} onSwitch={switchMode} />

      {/* Circular Timer Ring */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <CircularProgress
          progress={progress}
          timeLeft={timeLeft}
          mode={mode}
          isRunning={isRunning}
        />

        {/* Current subject chip */}
        {subject && (
          <div className="current-subject-chip">
            📚 {subject}
          </div>
        )}

        {/* Session counter */}
        <SessionCounter count={sessionCount} />
      </div>

      {/* Controls */}
      <TimerControls
        isRunning={isRunning}
        onPlay={play}
        onPause={pause}
        onReset={reset}
        onSkip={skip}
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
