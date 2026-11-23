/**
 * Pure date, aggregation, intensity, and summary utilities for the Deep Work Heatmap Calendar.
 * Decoupled from React/DOM so every calculation is deterministic and unit-tested.
 */

export const HEATMAP_RANGES = [
  { id: '90d', label: '3M', fullLabel: 'Last 90 days', days: 91 },
  { id: '180d', label: '6M', fullLabel: 'Last 6 months', days: 182 },
  { id: '365d', label: '1Y', fullLabel: 'Last 12 months', days: 365 },
];

export const HEATMAP_THEMES = [
  { id: 'cyan', label: 'Glacier', swatch: '#06b6d4' },
  { id: 'emerald', label: 'Forest', swatch: '#10b981' },
  { id: 'amber', label: 'Ember', swatch: '#f59e0b' },
];

export const INTENSITY_TIERS = [
  { level: 0, label: 'Rest Day', rangeText: '0m' },
  { level: 1, label: 'Warm-up', rangeText: '< 30m' },
  { level: 2, label: 'Steady Focus', rangeText: '30m – 1h' },
  { level: 3, label: 'Deep Session', rangeText: '1h – 2h' },
  { level: 4, label: 'Deep Flow', rangeText: '2h+' },
];

/**
 * Formats a Date into a local YYYY-MM-DD key (avoids UTC date-shift bugs).
 */
export const toLocalDateKey = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parses a YYYY-MM-DD key into a local midnight Date.
 */
export const parseDateKey = (dateKey) => {
  const [y, m, d] = String(dateKey).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

/**
 * Maps daily focus duration (seconds) to a 0–4 heatmap intensity level.
 */
export const getIntensityLevel = (seconds) => {
  const secs = Number(seconds) || 0;
  if (secs <= 0) return 0;
  if (secs < 1800) return 1; // < 30m
  if (secs < 3600) return 2; // 30m – < 1h
  if (secs < 7200) return 3; // 1h – < 2h
  return 4; // 2h+
};

export const getIntensityTier = (seconds) => {
  const level = getIntensityLevel(seconds);
  return INTENSITY_TIERS[level] || INTENSITY_TIERS[0];
};

export const formatFocusDuration = (seconds) => {
  const secs = Math.max(0, Math.round(Number(seconds) || 0));
  if (secs === 0) return '0m';
  if (secs < 60) return '< 1m';
  const hours = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
};

export const formatCalendarDate = (dateKey, { long = false } = {}) => {
  if (!dateKey) return '';
  const d = parseDateKey(dateKey);
  return d.toLocaleDateString('en-US', {
    weekday: long ? 'long' : 'short',
    month: 'short',
    day: 'numeric',
    ...(long ? { year: 'numeric' } : {}),
  });
};

/**
 * Combines session records and any pre-aggregated date->seconds map into rich per-day entries.
 */
export const buildDailyMapFromSessions = (sessions = [], extraDailyTotals = {}) => {
  const map = {};

  if (extraDailyTotals && typeof extraDailyTotals === 'object') {
    Object.entries(extraDailyTotals).forEach(([dateKey, secs]) => {
      const val = Number(secs) || 0;
      if (val > 0) {
        map[dateKey] = {
          seconds: val,
          sessionsCount: 1,
          subjects: {},
        };
      }
    });
  }

  if (Array.isArray(sessions) && sessions.length > 0) {
    // Re-aggregate directly from sessions for days that have session objects so counts & subjects are exact
    const sessionDayMap = {};
    sessions.forEach((s) => {
      if (!s) return;
      const dateKey = s.date || (s.timestamp ? toLocalDateKey(new Date(s.timestamp)) : null);
      if (!dateKey) return;
      const duration = Math.max(0, Number(s.duration) || 0);
      if (!sessionDayMap[dateKey]) {
        sessionDayMap[dateKey] = { seconds: 0, sessionsCount: 0, subjects: {} };
      }
      sessionDayMap[dateKey].seconds += duration;
      sessionDayMap[dateKey].sessionsCount += 1;
      const subj = (s.subject || '').trim();
      if (subj) {
        sessionDayMap[dateKey].subjects[subj] = (sessionDayMap[dateKey].subjects[subj] || 0) + duration;
      }
    });

    Object.entries(sessionDayMap).forEach(([dateKey, entry]) => {
      map[dateKey] = entry;
    });
  }

  return map;
};

/**
 * Builds a Sunday-aligned week matrix and collision-free month labels for the heatmap grid.
 */
export const buildHeatmapGrid = ({
  dailyMap = {},
  rangeDays = 91,
  endDate = new Date(),
} = {}) => {
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const todayKey = toLocalDateKey(end);
  const totalDays = Math.max(7, Number(rangeDays) || 91);

  const days = [];
  for (let offset = totalDays - 1; offset >= 0; offset--) {
    const d = new Date(end);
    d.setDate(end.getDate() - offset);
    const key = toLocalDateKey(d);
    const entry = dailyMap[key];
    const seconds = entry?.seconds || 0;
    const subjectsList = entry?.subjects
      ? Object.entries(entry.subjects)
          .sort((a, b) => b[1] - a[1])
          .map(([name, secs]) => ({ name, seconds: secs }))
      : [];

    days.push({
      date: key,
      dayOfWeek: d.getDay(),
      month: d.getMonth(),
      monthShort: d.toLocaleDateString('en-US', { month: 'short' }),
      dayOfMonth: d.getDate(),
      seconds,
      sessionsCount: entry?.sessionsCount || (seconds > 0 ? 1 : 0),
      subjects: subjectsList,
      intensity: getIntensityLevel(seconds),
      isToday: key === todayKey,
    });
  }

  // Pad front with nulls so column 0 row 0 starts on Sunday
  const leadingPad = days[0]?.dayOfWeek || 0;
  const padded = [...Array(leadingPad).fill(null), ...days];

  // Pad trailing week to 7 cells for clean grid alignment
  const trailingPad = (7 - (padded.length % 7)) % 7;
  const fullPadded = [...padded, ...Array(trailingPad).fill(null)];

  const weeks = [];
  for (let i = 0; i < fullPadded.length; i += 7) {
    weeks.push(fullPadded.slice(i, i + 7));
  }

  // Compute month labels aligned to week columns (avoiding overlapping adjacent labels)
  const monthLabels = [];
  let lastLabeledMonth = null;
  let lastLabelWeekIdx = -10;

  // If week 1 or 2 already begins a brand-new month, skip labeling the tiny partial month at week 0
  const hasEarlyMonthStart = weeks.slice(1, 3).some((w) => w.some((d) => d !== null && d.dayOfMonth === 1));

  weeks.forEach((week, weekIdx) => {
    const firstValidDay = week.find((d) => d !== null);
    if (!firstValidDay) return;

    const monthStartDay = week.find((d) => d !== null && d.dayOfMonth === 1);
    const targetDay = weekIdx === 0 ? (hasEarlyMonthStart ? null : firstValidDay) : monthStartDay;
    if (!targetDay) return;

    const monthId = `${targetDay.date.slice(0, 7)}`;
    if (monthId !== lastLabeledMonth && weekIdx - lastLabelWeekIdx >= 2) {
      monthLabels.push({
        weekIndex: weekIdx,
        label: targetDay.monthShort,
      });
      lastLabeledMonth = monthId;
      lastLabelWeekIdx = weekIdx;
    }
  });

  return { days, weeks, monthLabels, todayKey };
};

/**
 * Computes deep work consistency metrics for the visible range.
 */
export const computeHeatmapSummary = (days = []) => {
  if (!Array.isArray(days) || days.length === 0) {
    return {
      totalSeconds: 0,
      activeDays: 0,
      totalDays: 0,
      consistencyRate: 0,
      currentStreak: 0,
      bestStreak: 0,
      averageActiveSeconds: 0,
      bestDay: null,
    };
  }

  let totalSeconds = 0;
  let activeDays = 0;
  let bestStreak = 0;
  let runningStreak = 0;
  let bestDay = null;

  days.forEach((day) => {
    const secs = day.seconds || 0;
    totalSeconds += secs;
    if (secs > 0) {
      activeDays += 1;
      runningStreak += 1;
      if (runningStreak > bestStreak) bestStreak = runningStreak;
      if (!bestDay || secs > bestDay.seconds) {
        bestDay = { date: day.date, seconds: secs };
      }
    } else {
      runningStreak = 0;
    }
  });

  // Current streak: count backwards from today (allowing today to be 0 if yesterday was active)
  let currentStreak = 0;
  let idx = days.length - 1;
  if (idx >= 0 && (days[idx].seconds || 0) === 0) {
    idx -= 1;
  }
  while (idx >= 0 && (days[idx].seconds || 0) > 0) {
    currentStreak += 1;
    idx -= 1;
  }

  const totalDays = days.length;
  const consistencyRate = totalDays > 0 ? Math.round((activeDays / totalDays) * 100) : 0;
  const averageActiveSeconds = activeDays > 0 ? Math.round(totalSeconds / activeDays) : 0;

  return {
    totalSeconds,
    activeDays,
    totalDays,
    consistencyRate,
    currentStreak,
    bestStreak,
    averageActiveSeconds,
    bestDay,
  };
};

/**
 * Deterministic seeded deep-work sample history for first-time empty-state preview.
 */
export const generateSampleDeepWorkHistory = (endDate = new Date(), totalDays = 365) => {
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const subjects = ['System Design', 'Algorithms', 'Deep Reading', 'Calculus', 'Writing'];
  const map = {};

  // Mulberry32 deterministic PRNG
  let seed = 20260417;
  const rand = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (let offset = totalDays - 1; offset >= 0; offset--) {
    const d = new Date(end);
    d.setDate(end.getDate() - offset);
    const key = toLocalDateKey(d);
    const dow = d.getDay();
    const isWeekend = dow === 0 || dow === 6;

    // Make recent 6 days active so current streak feels alive in sample preview
    const r = rand();
    const activeThreshold = offset < 6 ? 0.0 : isWeekend ? 0.48 : 0.24;
    if (r < activeThreshold) continue;

    // Intensity distribution across all 4 active tiers
    const tierRoll = rand();
    let minutes;
    if (tierRoll < 0.2) minutes = 15 + Math.floor(rand() * 14); // Tier 1: 15-28m
    else if (tierRoll < 0.48) minutes = 30 + Math.floor(rand() * 28); // Tier 2: 30-57m
    else if (tierRoll < 0.78) minutes = 60 + Math.floor(rand() * 55); // Tier 3: 60-114m
    else minutes = 120 + Math.floor(rand() * 115); // Tier 4: 2h-3h55m

    const seconds = minutes * 60;
    const sessionsCount = Math.max(1, Math.round(minutes / 35));
    const primarySubj = subjects[Math.floor(rand() * subjects.length)];
    const secondarySubj = subjects[(subjects.indexOf(primarySubj) + 1) % subjects.length];

    const daySubjects = {};
    if (sessionsCount >= 2) {
      const firstShare = Math.round(seconds * 0.65);
      daySubjects[primarySubj] = firstShare;
      daySubjects[secondarySubj] = seconds - firstShare;
    } else {
      daySubjects[primarySubj] = seconds;
    }

    map[key] = {
      seconds,
      sessionsCount,
      subjects: daySubjects,
    };
  }

  return map;
};
