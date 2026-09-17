import React from 'react';

const SessionCounter = ({ count }) => {
  const cycleCount = count % 4;
  const completed = cycleCount === 0 && count > 0 ? 4 : cycleCount;

  return (
    <div className="session-counter" aria-label={`${completed} of 4 pomodoros completed`}>
      {Array.from({ length: 4 }, (_, i) => (
        <span
          key={i}
          className={`tomato ${i < completed ? 'filled' : 'empty'}`}
          title={i < completed ? 'Completed' : 'Remaining'}
        >
          🍅
        </span>
      ))}
    </div>
  );
};

export default SessionCounter;
