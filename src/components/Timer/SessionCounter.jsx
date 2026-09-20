import React from 'react';

const SessionCounter = ({ count = 0 }) => {
  const cycleCount = count % 4;
  const completed = cycleCount === 0 && count > 0 ? 4 : cycleCount;

  return (
    <div
      className="session-counter"
      role="status"
      aria-label={`${completed} of 4 sessions completed`}
      title={`${completed} of 4 sessions completed`}
    >
      <span className="session-done-icon" aria-hidden="true" title="Sessions completed">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      <div className="session-pips" aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => {
          const isDone = i < completed;
          return (
            <span
              key={i}
              className={`session-pip ${isDone ? 'filled' : 'empty'}`}
              title={`Session ${i + 1}: ${isDone ? 'Done' : 'Pending'}`}
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
      <span className="session-counter-badge" title="Current cycle">{completed}/4</span>
      {count > 0 && (
        <span className="session-counter-total" title="Total focuses today" style={{ marginLeft: '12px', fontSize: '0.85em', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Total: {count}
        </span>
      )}
    </div>
  );
};

export default SessionCounter;
