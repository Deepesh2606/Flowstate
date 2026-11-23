import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getIntensityLevel,
  formatFocusDuration,
  toLocalDateKey,
  buildDailyMapFromSessions,
  buildHeatmapGrid,
  computeHeatmapSummary,
  generateSampleDeepWorkHistory,
} from './heatmapUtils';

test('getIntensityLevel maps focus seconds to the 5-tier scale accurately', () => {
  assert.equal(getIntensityLevel(0), 0);
  assert.equal(getIntensityLevel(-50), 0);
  assert.equal(getIntensityLevel(300), 1); // 5m
  assert.equal(getIntensityLevel(1799), 1); // 29m59s
  assert.equal(getIntensityLevel(1800), 2); // 30m
  assert.equal(getIntensityLevel(3599), 2); // 59m59s
  assert.equal(getIntensityLevel(3600), 3); // 1h
  assert.equal(getIntensityLevel(7199), 3); // 1h59m59s
  assert.equal(getIntensityLevel(7200), 4); // 2h
  assert.equal(getIntensityLevel(14400), 4); // 4h
});

test('formatFocusDuration formats seconds cleanly across minutes and hours', () => {
  assert.equal(formatFocusDuration(0), '0m');
  assert.equal(formatFocusDuration(45), '< 1m');
  assert.equal(formatFocusDuration(1500), '25m');
  assert.equal(formatFocusDuration(3600), '1h');
  assert.equal(formatFocusDuration(5400), '1h 30m');
});

test('buildDailyMapFromSessions aggregates multiple sessions and subjects per day', () => {
  const map = buildDailyMapFromSessions(
    [
      { date: '2026-11-20', duration: 1500, subject: 'Algorithms' },
      { date: '2026-11-20', duration: 2100, subject: 'System Design' },
      { date: '2026-11-20', duration: 900, subject: 'Algorithms' },
      { date: '2026-11-21', duration: 3600, subject: 'Calculus' },
    ],
    { '2026-11-19': 1800 }
  );

  assert.equal(map['2026-11-19'].seconds, 1800);
  assert.equal(map['2026-11-20'].seconds, 4500);
  assert.equal(map['2026-11-20'].sessionsCount, 3);
  assert.equal(map['2026-11-20'].subjects['Algorithms'], 2400);
  assert.equal(map['2026-11-20'].subjects['System Design'], 2100);
  assert.equal(map['2026-11-21'].seconds, 3600);
});

test('buildHeatmapGrid aligns weeks to Sunday and generates non-overlapping month labels', () => {
  const endDate = new Date(2026, 10, 22); // Nov 22, 2026 (Sunday)
  const dailyMap = {
    '2026-11-22': { seconds: 7200, sessionsCount: 2, subjects: { Math: 7200 } },
    '2026-11-21': { seconds: 1800, sessionsCount: 1, subjects: { Reading: 1800 } },
  };

  const grid = buildHeatmapGrid({ dailyMap, rangeDays: 91, endDate });
  assert.equal(grid.days.length, 91);
  assert.equal(grid.todayKey, '2026-11-22');
  assert.equal(grid.days[grid.days.length - 1].isToday, true);
  assert.equal(grid.days[grid.days.length - 1].intensity, 4);

  // Every week column has exactly 7 slots
  grid.weeks.forEach((week) => {
    assert.equal(week.length, 7);
  });

  // Month labels are spaced at least 2 weeks apart
  for (let i = 1; i < grid.monthLabels.length; i++) {
    assert.ok(grid.monthLabels[i].weekIndex - grid.monthLabels[i - 1].weekIndex >= 2);
  }
});

test('computeHeatmapSummary calculates streaks, consistency, and peak day accurately', () => {
  const endDate = new Date(2026, 10, 22);
  const dailyMap = {
    '2026-11-16': { seconds: 3600, sessionsCount: 1, subjects: {} },
    '2026-11-17': { seconds: 7800, sessionsCount: 2, subjects: {} },
    '2026-11-18': { seconds: 1800, sessionsCount: 1, subjects: {} },
    // 11-19 gap
    '2026-11-20': { seconds: 2400, sessionsCount: 1, subjects: {} },
    '2026-11-21': { seconds: 3000, sessionsCount: 1, subjects: {} },
    // 11-22 (today) is 0 -> streak still counts yesterday + day before = 2
  };

  const { days } = buildHeatmapGrid({ dailyMap, rangeDays: 10, endDate });
  const summary = computeHeatmapSummary(days);

  assert.equal(summary.activeDays, 5);
  assert.equal(summary.totalDays, 10);
  assert.equal(summary.consistencyRate, 50);
  assert.equal(summary.bestStreak, 3);
  assert.equal(summary.currentStreak, 2);
  assert.equal(summary.bestDay.date, '2026-11-17');
  assert.equal(summary.bestDay.seconds, 7800);
  assert.equal(summary.totalSeconds, 18600);
});

test('generateSampleDeepWorkHistory is deterministic and populates recent streak days', () => {
  const endDate = new Date(2026, 10, 22);
  const sampleA = generateSampleDeepWorkHistory(endDate, 91);
  const sampleB = generateSampleDeepWorkHistory(endDate, 91);

  assert.deepEqual(sampleA, sampleB);
  const todayKey = toLocalDateKey(endDate);
  assert.ok(sampleA[todayKey]?.seconds > 0);
});
