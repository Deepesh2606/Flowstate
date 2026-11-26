import React, { useState, useEffect } from 'react';
import {
  MIN_DAILY_GOAL_MINUTES,
  MAX_DAILY_GOAL_MINUTES,
  clampDailyGoalMinutes,
} from '../../utils/goalUtils';

const GOAL_PRESET_MINUTES = [60, 90, 120, 180, 240];
const STEP_MINUTES = 15;

const DailyGoalInput = ({ goalMinutes, onChangeGoalMinutes }) => {
  const [draft, setDraft] = useState(String(goalMinutes));
  const [validationHint, setValidationHint] = useState('');

  useEffect(() => {
    setDraft(String(goalMinutes));
    setValidationHint('');
  }, [goalMinutes]);

  const commitValue = (raw) => {
    const clamped = clampDailyGoalMinutes(raw, goalMinutes);
    setDraft(String(clamped));
    setValidationHint('');
    if (clamped !== goalMinutes) {
      onChangeGoalMinutes(clamped);
    }
  };

  const handleInputChange = (e) => {
    const raw = e.target.value;
    setDraft(raw);

    if (raw.trim() === '') {
      setValidationHint(`Enter ${MIN_DAILY_GOAL_MINUTES}–${MAX_DAILY_GOAL_MINUTES} min`);
      return;
    }

    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      setValidationHint('Enter a valid number of minutes');
      return;
    }

    if (parsed < MIN_DAILY_GOAL_MINUTES) {
      setValidationHint(`Minimum is ${MIN_DAILY_GOAL_MINUTES} min`);
      return;
    }

    if (parsed > MAX_DAILY_GOAL_MINUTES) {
      setValidationHint(`Maximum is ${MAX_DAILY_GOAL_MINUTES} min (24h)`);
      return;
    }

    setValidationHint('');
    const rounded = Math.round(parsed);
    if (rounded !== goalMinutes) {
      onChangeGoalMinutes(rounded);
    }
  };

  const handleStep = (delta) => {
    const base = Number.isFinite(Number(draft)) && draft.trim() !== '' ? Number(draft) : goalMinutes;
    const next = clampDailyGoalMinutes(base + delta, goalMinutes);
    setDraft(String(next));
    setValidationHint('');
    if (next !== goalMinutes) {
      onChangeGoalMinutes(next);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitValue(draft);
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setDraft(String(goalMinutes));
      setValidationHint('');
      e.currentTarget.blur();
    }
  };

  return (
    <div className="daily-goal-input-group" data-testid="daily-goal-input-component">
      <div className="goal-ring-input-row">
        <label htmlFor="daily-goal-minutes-input" className="goal-ring-input-label">
          Daily target
        </label>

        <div className="goal-stepper-control">
          <button
            type="button"
            className="goal-stepper-btn"
            onClick={() => handleStep(-STEP_MINUTES)}
            disabled={goalMinutes <= MIN_DAILY_GOAL_MINUTES}
            aria-label={`Decrease daily goal by ${STEP_MINUTES} minutes`}
            title={`-${STEP_MINUTES} min`}
            data-testid="daily-goal-decrement"
          >
            −
          </button>

          <div className={`goal-ring-input-box ${validationHint ? 'has-hint' : ''}`}>
            <input
              id="daily-goal-minutes-input"
              data-testid="daily-goal-minutes-input"
              type="number"
              inputMode="numeric"
              min={MIN_DAILY_GOAL_MINUTES}
              max={MAX_DAILY_GOAL_MINUTES}
              step={5}
              value={draft}
              onChange={handleInputChange}
              onBlur={(e) => commitValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="goal-minutes-input tabular-nums"
              aria-label="Daily deep work goal in minutes"
              aria-describedby={validationHint ? 'daily-goal-hint' : undefined}
            />
            <span className="goal-minutes-unit" aria-hidden="true">
              min
            </span>
          </div>

          <button
            type="button"
            className="goal-stepper-btn"
            onClick={() => handleStep(STEP_MINUTES)}
            disabled={goalMinutes >= MAX_DAILY_GOAL_MINUTES}
            aria-label={`Increase daily goal by ${STEP_MINUTES} minutes`}
            title={`+${STEP_MINUTES} min`}
            data-testid="daily-goal-increment"
          >
            +
          </button>
        </div>

        <div className="goal-presets-row" role="group" aria-label="Quick daily goal presets">
          {GOAL_PRESET_MINUTES.map((mins) => (
            <button
              key={mins}
              type="button"
              className={`goal-preset-btn tabular-nums ${goalMinutes === mins ? 'active' : ''}`}
              aria-pressed={goalMinutes === mins}
              onClick={() => commitValue(mins)}
              data-testid={`daily-goal-preset-${mins}`}
            >
              {mins}m
            </button>
          ))}
        </div>
      </div>

      {validationHint && (
        <div id="daily-goal-hint" className="goal-input-hint" role="status">
          {validationHint}
        </div>
      )}
    </div>
  );
};

export default DailyGoalInput;
