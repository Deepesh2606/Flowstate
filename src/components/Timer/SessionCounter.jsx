import React from 'react';

const SessionCounter = ({ count = 0, dailyGoal = 8, longBreakInterval = 4, pomodoroDuration = 2700 }) => {
  const goal = Math.max(1, Number(dailyGoal) || 8);
  const current = Math.max(0, Number(count) || 0);

  // Background tracking for long break cycle
  const interval = Math.max(1, Number(longBreakInterval) || 4);
  const cycleCount = current % interval;
  const sessionsUntilLongBreak = interval - cycleCount;
  const longBreakStatus = sessionsUntilLongBreak === interval && current > 0
    ? 'Long break ready!'
    : `${sessionsUntilLongBreak} session${sessionsUntilLongBreak === 1 ? '' : 's'} until long break`;

  const totalSeconds = current * pomodoroDuration;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  const isGoalReached = current >= goal;
  const pipCount = Math.min(goal, 12);
  const showPips = goal <= 12;

  return (
    <div
      className={`session-counter ${isGoalReached ? 'goal-reached' : ''}`}
      role="status"
      aria-label={`Daily Focus: ${current} of ${goal} sessions completed (${longBreakStatus})`}
      title={`Daily Focus: ${current} of ${goal} completed • ${longBreakStatus}`}
    >
      <span className="session-done-icon" aria-hidden="true" title="Daily Focus Goal">
        {isGoalReached ? (
          <span style={{ fontSize: '11px', lineHeight: 1 }}>🎯</span>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>

      <span className="session-counter-label">Daily Focus</span>

      {showPips ? (
        <div className="session-pips" aria-hidden="true">
          {Array.from({ length: pipCount }, (_, i) => {
            const isDone = i < current;
            return (
              <span
                key={i}
                className={`session-pip ${isDone ? 'filled' : 'empty'}`}
                title={`Focus session ${i + 1}: ${isDone ? 'Completed' : 'Pending'}`}
              >
                {isDone && (
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
            );
          })}
        </div>
      ) : (
        <div className="session-counter-progress-bar" aria-hidden="true">
          <div
            className="session-counter-progress-fill"
            style={{ width: `${Math.min(100, Math.round((current / goal) * 100))}%` }}
          />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="session-counter-badge" title="Completed / Daily Goal">
          {current}/{goal}
        </span>
        <span className="session-counter-badge" style={{ background: 'rgba(255,255,255,0.1)' }} title="Total focus time completed">
          {timeString}
        </span>
      </div>

      {isGoalReached && (
        <span className="session-counter-goal-tag" title="Daily Goal Accomplished!">
          🎉 Goal Met
        </span>
      )}
    </div>
  );
};

export default SessionCounter;

