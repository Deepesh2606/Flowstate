import React from 'react';
import { IconRotateCcw, IconPlay, IconPause, IconSkipForward } from '../Icons';

const TimerControls = ({ isRunning, onPlay, onPause, onReset, onSkip }) => {
  return (
    <div className="timer-controls" role="group" aria-label="Timer controls">
      <button
        className="ctrl-btn"
        onClick={onReset}
        title="Reset timer"
        id="timer-reset-btn"
        aria-label="Reset timer"
      >
        <IconRotateCcw size={18} />
      </button>

      <button
        className="ctrl-btn primary"
        onClick={isRunning ? onPause : onPlay}
        title={isRunning ? 'Pause' : 'Start'}
        id="timer-play-pause-btn"
        aria-label={isRunning ? 'Pause timer' : 'Start timer'}
      >
        {isRunning ? <IconPause size={20} /> : <IconPlay size={20} />}
      </button>

      <button
        className="ctrl-btn"
        onClick={onSkip}
        title="Skip to next session"
        id="timer-skip-btn"
        aria-label="Skip to next session"
      >
        <IconSkipForward size={18} />
      </button>
    </div>
  );
};

export default TimerControls;
