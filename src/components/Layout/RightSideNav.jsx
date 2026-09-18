import React from 'react';
import { IconClock } from '../Icons';

const MODES = [
  { id: 'pomodoro', label: 'FOCUS' },
  { id: 'shortBreak', label: 'SHORT\nBREAK' },
  { id: 'longBreak', label: 'LONG\nBREAK' },
  { id: 'stopwatch', label: 'STOP\nWATCH' },
];

/**
 * RightSideNav
 * Vertical pill strip on the right edge that handles:
 *  - Timer sub-modes (FOCUS / SHORT BREAK / LONG BREAK / STOPWATCH)
 *  - Clock tab shortcut at the bottom
 *
 * Props:
 *  activeTab      – 'timer' | 'clock' | 'stats' | 'history'
 *  timerMode      – current timer sub-mode ('pomodoro' | 'shortBreak' | 'longBreak' | 'stopwatch')
 *  onSwitchMode   – (modeId) => void — called when a timer mode pill is clicked
 *  onTabChange    – (tabId) => void  — called to navigate to clock tab
 */
const RightSideNav = ({ activeTab, timerMode, onSwitchMode, onTabChange }) => {
  const isTimerActive = activeTab === 'timer';
  const isClockActive = activeTab === 'clock';

  return (
    <div className="right-side-nav" aria-label="Mode navigation">
      {/* Timer mode pills */}
      <div className="rsn-pills">
        {MODES.map((m) => {
          const isActive = isTimerActive && timerMode === m.id;
          return (
            <button
              key={m.id}
              id={`rsn-mode-${m.id}`}
              className={`rsn-pill ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (activeTab !== 'timer') onTabChange('timer');
                onSwitchMode(m.id);
              }}
              aria-pressed={isActive}
              title={m.label.replace('\n', ' ')}
            >
              {isActive && <span className="rsn-pill-glaze" aria-hidden="true" />}
              <span className="rsn-pill-label">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="rsn-divider" aria-hidden="true" />

      {/* Clock shortcut */}
      <button
        id="rsn-clock-btn"
        className={`rsn-clock-btn ${isClockActive ? 'active' : ''}`}
        onClick={() => onTabChange('clock')}
        aria-pressed={isClockActive}
        title="Clock"
      >
        <IconClock size={16} />
        <span className="rsn-clock-label">CLOCK</span>
      </button>
    </div>
  );
};

export default RightSideNav;
