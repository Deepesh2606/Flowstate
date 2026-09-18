import React from 'react';

/**
 * Ambient countdown glow — appears in the last 60s of a focus session.
 * Intensity scales from 0 → 1 as remaining time approaches 0.
 */
const CountdownGlow = ({ timeLeft, mode, isRunning }) => {
  if (!isRunning || mode === 'stopwatch' || mode === 'shortBreak' || mode === 'longBreak') return null;
  if (timeLeft > 60) return null;

  const intensity = Math.max(0, Math.min(1, 1 - (timeLeft / 60)));
  const pulseSpeed = timeLeft <= 10 ? '0.6s' : timeLeft <= 30 ? '1s' : '1.5s';
  const color = timeLeft <= 10
    ? `rgba(239, 68, 68, ${0.3 + intensity * 0.4})`
    : `rgba(251, 146, 60, ${0.2 + intensity * 0.3})`;

  return (
    <div
      className="countdown-glow-ring"
      style={{
        '--glow-color': color,
        '--glow-intensity': intensity,
        '--pulse-speed': pulseSpeed,
      }}
      aria-hidden="true"
    />
  );
};

export default CountdownGlow;
