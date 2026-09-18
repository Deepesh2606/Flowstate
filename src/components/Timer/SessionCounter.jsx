import React from 'react';

const SessionCounter = ({ count = 0 }) => {
  const cycleCount = count % 4;
  const completed = cycleCount === 0 && count > 0 ? 4 : cycleCount;

  return (
    <div
      className="session-counter"
      role="status"
      aria-label={`${completed} of 4 focus sessions completed in this cycle`}
      title={`${completed} of 4 focus sessions completed`}
    >
      <span className="session-counter-icon" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      </span>
      <div className="session-pips" aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => {
          const isFilled = i < completed;
          const isCurrent = i === completed;
          return (
            <span
              key={i}
              className={`session-pip ${isFilled ? 'filled' : isCurrent ? 'current' : 'empty'}`}
              title={isFilled ? `Session ${i + 1} completed` : `Session ${i + 1}`}
            />
          );
        })}
      </div>
      <span className="session-counter-badge">{completed}/4</span>
    </div>
  );
};

export default SessionCounter;
