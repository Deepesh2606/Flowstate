import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_DAILY_GOAL_MINUTES,
  clampDailyGoalMinutes,
  resolveDailyGoalMinutes,
  formatGoalMinutes,
  computeDailyGoalProgress,
} from './goalUtils';

test('clampDailyGoalMinutes enforces valid bounds and fallback', () => {
  assert.equal(clampDailyGoalMinutes(90), 90);
  assert.equal(clampDailyGoalMinutes(2), 5);
  assert.equal(clampDailyGoalMinutes(2000), 1440);
  assert.equal(clampDailyGoalMinutes('invalid'), DEFAULT_DAILY_GOAL_MINUTES);
  assert.equal(clampDailyGoalMinutes(0), DEFAULT_DAILY_GOAL_MINUTES);
});

test('resolveDailyGoalMinutes reads dailyGoalMinutes or falls back to default', () => {
  assert.equal(resolveDailyGoalMinutes({ dailyGoalMinutes: 150 }), 150);
  assert.equal(resolveDailyGoalMinutes({}), DEFAULT_DAILY_GOAL_MINUTES);
  assert.equal(resolveDailyGoalMinutes(null), DEFAULT_DAILY_GOAL_MINUTES);
});

test('formatGoalMinutes formats minutes with concise hour equivalent', () => {
  assert.equal(formatGoalMinutes(45), '45m');
  assert.equal(formatGoalMinutes(120), '120m (2h)');
  assert.equal(formatGoalMinutes(90), '90m (1h 30m)');
});

test('computeDailyGoalProgress calculates exact ring progress, percentage, and completion', () => {
  const half = computeDailyGoalProgress(1800, 60); // 30m of 60m
  assert.equal(half.goalMinutes, 60);
  assert.equal(half.progress, 0.5);
  assert.equal(half.percentage, 50);
  assert.equal(half.remainingSeconds, 1800);
  assert.equal(half.isComplete, false);

  const complete = computeDailyGoalProgress(5400, 60); // 90m of 60m
  assert.equal(complete.progress, 1);
  assert.equal(complete.percentage, 100);
  assert.equal(complete.remainingSeconds, 0);
  assert.equal(complete.isComplete, true);
});
