export const DEFAULT_DAILY_GOAL_MINUTES = 120;
export const MIN_DAILY_GOAL_MINUTES = 5;
export const MAX_DAILY_GOAL_MINUTES = 1440;

/**
 * Clamps a user-supplied daily deep work goal in minutes to safe bounds [5, 1440].
 */
export const clampDailyGoalMinutes = (value, fallback = DEFAULT_DAILY_GOAL_MINUTES) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return fallback;
  }
  return Math.max(MIN_DAILY_GOAL_MINUTES, Math.min(MAX_DAILY_GOAL_MINUTES, Math.round(numeric)));
};

/**
 * Resolves the effective daily goal in minutes from settings, supporting both the
 * dedicated `dailyGoalMinutes` field and legacy `dailyGoal` (hours) if needed.
 */
export const resolveDailyGoalMinutes = (settings) => {
  if (settings && Number.isFinite(Number(settings.dailyGoalMinutes)) && Number(settings.dailyGoalMinutes) > 0) {
    return clampDailyGoalMinutes(settings.dailyGoalMinutes);
  }
  return DEFAULT_DAILY_GOAL_MINUTES;
};

/**
 * Formats a minute goal concisely for the Goal Ring subtitle (e.g. "90m" or "120m (2h)").
 */
export const formatGoalMinutes = (minutes) => {
  const safe = clampDailyGoalMinutes(minutes);
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h === 0) return `${safe}m`;
  if (m === 0) return `${safe}m (${h}h)`;
  return `${safe}m (${h}h ${m}m)`;
};

/**
 * Computes normalized progress [0..1], rounded percentage [0..100], remaining seconds,
 * and completion flag for the Daily Deep Work Goal Ring.
 */
export const computeDailyGoalProgress = (todayFocusSeconds = 0, goalMinutes = DEFAULT_DAILY_GOAL_MINUTES) => {
  const safeMinutes = clampDailyGoalMinutes(goalMinutes);
  const goalSeconds = safeMinutes * 60;
  const currentSeconds = Math.max(0, Number(todayFocusSeconds) || 0);
  const rawProgress = goalSeconds > 0 ? currentSeconds / goalSeconds : 0;
  const progress = Math.min(1, Math.max(0, rawProgress));
  const percentage = Math.round(progress * 100);
  const remainingSeconds = Math.max(0, goalSeconds - currentSeconds);

  return {
    goalMinutes: safeMinutes,
    goalSeconds,
    currentSeconds,
    progress,
    percentage,
    remainingSeconds,
    isComplete: currentSeconds >= goalSeconds,
  };
};
