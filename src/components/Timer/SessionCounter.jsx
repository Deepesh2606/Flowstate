import React from 'react';
import { IconStar } from '../Icons';

const SessionCounter = ({ count }) => {
  const cycleCount = count % 4;
  const completed = cycleCount === 0 && count > 0 ? 4 : cycleCount;

  return (
    <div className="session-counter" aria-label={`${completed} of 4 pomodoros completed`}>
      {Array.from({ length: 4 }, (_, i) => (
        <span
          key={i}
          className={`session-star ${i < completed ? 'filled' : 'empty'}`}
          title={i < completed ? 'Completed' : 'Remaining'}
        >
          <IconStar size={20} />
        </span>
      ))}
    </div>
  );
};

export default SessionCounter;
