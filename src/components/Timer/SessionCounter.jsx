import React from 'react';
import { IconStar } from '../Icons';

const SessionCounter = ({ count }) => {
  const cycleCount = count % 4;
  const completed = cycleCount === 0 && count > 0 ? 4 : cycleCount;

  return (
    <div className="session-counter" aria-label={`${completed} of 4 pomodoros completed`} title={`${completed} of 4 pomodoros completed`}>
      {Array.from({ length: 4 }, (_, i) => {
        const isFilled = i < completed;
        return (
          <span
            key={i}
            className={`session-star ${isFilled ? 'filled' : 'empty'}`}
            title={isFilled ? 'Completed pomodoro' : 'Remaining pomodoro'}
          >
            <IconStar
              size={17}
              fill={isFilled ? 'currentColor' : 'rgba(255, 255, 255, 0.16)'}
              color={isFilled ? 'currentColor' : 'rgba(255, 255, 255, 0.65)'}
            />
          </span>
        );
      })}
    </div>
  );
};

export default SessionCounter;
