import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  HEATMAP_RANGES,
  HEATMAP_THEMES,
  INTENSITY_TIERS,
  buildDailyMapFromSessions,
  buildHeatmapGrid,
  computeHeatmapSummary,
  formatFocusDuration,
  formatCalendarDate,
  getIntensityTier,
  generateSampleDeepWorkHistory,
} from '../../utils/heatmapUtils';

const WEEKDAY_LABELS = [
  { index: 0, text: '' },
  { index: 1, text: 'Mon' },
  { index: 2, text: '' },
  { index: 3, text: 'Wed' },
  { index: 4, text: '' },
  { index: 5, text: 'Fri' },
  { index: 6, text: '' },
];

const HeatmapCalendar = ({ monthlyData = {}, sessions = [] }) => {
  const [rangeId, setRangeId] = useState('180d');
  const [themeId, setThemeId] = useState('cyan');
  const [showSample, setShowSample] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);
  const panelRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const activeRange = useMemo(
    () => HEATMAP_RANGES.find((r) => r.id === rangeId) || HEATMAP_RANGES[0],
    [rangeId]
  );

  // Build real daily map from sessions + pre-aggregated totals
  const realDailyMap = useMemo(
    () => buildDailyMapFromSessions(sessions, monthlyData),
    [sessions, monthlyData]
  );

  const hasRealData = useMemo(
    () => Object.values(realDailyMap).some((entry) => (entry?.seconds || 0) > 0),
    [realDailyMap]
  );

  const sampleDailyMap = useMemo(() => generateSampleDeepWorkHistory(new Date(), 365), []);

  const isPreviewMode = !hasRealData && showSample;
  const activeDailyMap = isPreviewMode ? sampleDailyMap : realDailyMap;

  const { days, weeks, monthLabels, todayKey } = useMemo(
    () =>
      buildHeatmapGrid({
        dailyMap: activeDailyMap,
        rangeDays: activeRange.days,
      }),
    [activeDailyMap, activeRange.days]
  );

  const summary = useMemo(() => computeHeatmapSummary(days), [days]);

  // Default selected day to the most recent active day or today
  const resolvedSelectedDay = useMemo(() => {
    if (selectedDate) {
      const found = days.find((d) => d.date === selectedDate);
      if (found) return found;
    }
    const lastActive = [...days].reverse().find((d) => d.seconds > 0);
    return lastActive || days[days.length - 1] || null;
  }, [days, selectedDate]);

  // Auto-scroll to the rightmost (most recent) week when range changes
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollLeft = el.scrollWidth;
    }
  }, [rangeId, isPreviewMode]);

  const handleCellEnter = (e, day) => {
    const panelEl = panelRef.current;
    if (!panelEl) return;
    const panelRect = panelEl.getBoundingClientRect();
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipHalfW = 115;
    const relLeft = rect.left - panelRect.left + rect.width / 2;
    const clampedLeft = Math.max(
      tooltipHalfW,
      Math.min(panelRect.width - tooltipHalfW, relLeft)
    );
    const relTop = rect.top - panelRect.top;
    const showBelow = relTop < 72;
    setHoveredDay({
      day,
      left: clampedLeft,
      top: showBelow ? rect.bottom - panelRect.top + 8 : relTop - 8,
      showBelow,
    });
  };

  const selectedTier = resolvedSelectedDay ? getIntensityTier(resolvedSelectedDay.seconds) : INTENSITY_TIERS[0];

  return (
    <section
      ref={panelRef}
      className={`heatmap-panel heatmap-theme-${themeId} heatmap-range-${rangeId}`}
      aria-label="Deep Work History Heatmap Calendar"
      data-testid="deep-work-heatmap"
    >
      {/* Header Row */}
      <div className="heatmap-header">
        <div className="heatmap-title-group">
          <div className="heatmap-title-line">
            <h3 className="heatmap-title">Deep Work History</h3>
            {isPreviewMode && (
              <span className="heatmap-preview-note">Sample preview</span>
            )}
          </div>
          <p className="heatmap-subtitle">
            <span className="tabular-nums">{formatFocusDuration(summary.totalSeconds)}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{summary.activeDays} active {summary.activeDays === 1 ? 'day' : 'days'}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{summary.consistencyRate}% consistency</span>
          </p>
        </div>

        <div className="heatmap-controls">
          {!hasRealData && (
            <button
              type="button"
              className={`heatmap-sample-btn ${isPreviewMode ? 'active' : ''}`}
              onClick={() => {
                setShowSample((v) => !v);
                setSelectedDate(null);
              }}
            >
              {isPreviewMode ? 'Exit Sample' : 'Preview Sample'}
            </button>
          )}

          {/* Color scale switcher */}
          <div className="heatmap-palette-picker" role="group" aria-label="Heatmap color theme">
            {HEATMAP_THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`heatmap-palette-dot ${themeId === t.id ? 'active' : ''}`}
                style={{ '--swatch': t.swatch }}
                onClick={() => setThemeId(t.id)}
                aria-label={`${t.label} color theme`}
                aria-pressed={themeId === t.id}
                title={`${t.label} palette`}
              />
            ))}
          </div>

          {/* Range switcher */}
          <div className="heatmap-range-tabs" role="group" aria-label="Time range">
            {HEATMAP_RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`heatmap-range-btn ${rangeId === r.id ? 'active' : ''}`}
                onClick={() => setRangeId(r.id)}
                aria-pressed={rangeId === r.id}
                title={r.fullLabel}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Consistency KPI Strip (hairline divided, single elevation) */}
      <div className="heatmap-kpi-strip" role="list" aria-label="Deep work consistency metrics">
        <div className="heatmap-kpi-item" role="listitem">
          <span className="heatmap-kpi-label">Total Focus</span>
          <strong className="heatmap-kpi-value tabular-nums">{formatFocusDuration(summary.totalSeconds)}</strong>
        </div>
        <div className="heatmap-kpi-item" role="listitem">
          <span className="heatmap-kpi-label">Current Streak</span>
          <strong className="heatmap-kpi-value tabular-nums">
            {summary.currentStreak} {summary.currentStreak === 1 ? 'day' : 'days'}
          </strong>
        </div>
        <div className="heatmap-kpi-item" role="listitem">
          <span className="heatmap-kpi-label">Best Streak</span>
          <strong className="heatmap-kpi-value tabular-nums">
            {summary.bestStreak} {summary.bestStreak === 1 ? 'day' : 'days'}
          </strong>
        </div>
        <div className="heatmap-kpi-item" role="listitem">
          <span className="heatmap-kpi-label">Peak Day</span>
          <strong className="heatmap-kpi-value tabular-nums">
            {summary.bestDay
              ? `${formatFocusDuration(summary.bestDay.seconds)} · ${formatCalendarDate(summary.bestDay.date).replace(/^[^,]+,\s*/, '')}`
              : '—'}
          </strong>
        </div>
      </div>

      {/* Empty prompt when no sessions logged and not previewing */}
      {!hasRealData && !isPreviewMode && (
        <div className="heatmap-empty-banner">
          <span>Complete a focus session to start lighting up your deep work calendar — or toggle </span>
          <button
            type="button"
            className="heatmap-empty-link"
            onClick={() => setShowSample(true)}
          >
            Preview Sample
          </button>
          <span> to explore how intensity &amp; streaks visualize over time.</span>
        </div>
      )}

      {/* Heatmap Matrix */}
      <div className="heatmap-scroll-area" ref={scrollContainerRef}>
        <div className="heatmap-matrix">
          {/* Month labels aligned to exact week columns */}
          <div className="heatmap-months-row" aria-hidden="true">
            <div className="heatmap-weekday-spacer" />
            <div
              className="heatmap-months-track"
              style={{ gridTemplateColumns: `repeat(${weeks.length}, var(--hm-cell-size))` }}
            >
              {monthLabels.map((m) => (
                <span
                  key={`${m.weekIndex}-${m.label}`}
                  className="heatmap-month-label"
                  style={{ gridColumnStart: m.weekIndex + 1 }}
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          {/* Weekday labels + Grid cells */}
          <div className="heatmap-body-row">
            <div className="heatmap-weekday-col" aria-hidden="true">
              {WEEKDAY_LABELS.map((w) => (
                <span key={w.index} className="heatmap-weekday-label">
                  {w.text}
                </span>
              ))}
            </div>

            <div
              className="heatmap-weeks-grid"
              role="grid"
              aria-label={`Daily focus intensity for ${activeRange.fullLabel}`}
              data-testid="heatmap-cells-grid"
            >
              {weeks.map((week, wi) => (
                <div key={wi} className="heatmap-week-column" role="row">
                  {week.map((day, di) => {
                    if (!day) {
                      return <span key={di} className="heatmap-cell-slot is-padding" aria-hidden="true" />;
                    }
                    const isSelected = resolvedSelectedDay?.date === day.date;
                    const tier = getIntensityTier(day.seconds);
                    const ariaLabel = `${formatCalendarDate(day.date, { long: true })}: ${formatFocusDuration(day.seconds)} focused (${tier.label})${
                      day.sessionsCount > 0 ? `, ${day.sessionsCount} ${day.sessionsCount === 1 ? 'session' : 'sessions'}` : ''
                    }`;

                    return (
                      <button
                        key={day.date}
                        type="button"
                        className={`heatmap-cell-btn intensity-${day.intensity}${day.isToday ? ' is-today' : ''}${isSelected ? ' is-selected' : ''}`}
                        onClick={() => setSelectedDate(day.date)}
                        onMouseEnter={(e) => handleCellEnter(e, day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        onFocus={(e) => handleCellEnter(e, day)}
                        onBlur={() => setHoveredDay(null)}
                        aria-label={ariaLabel}
                        aria-pressed={isSelected}
                        data-date={day.date}
                        data-intensity={day.intensity}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Selected Day Inspector + Intensity Scale Legend */}
      <div className="heatmap-footer">
        <div className="heatmap-inspector" data-testid="heatmap-day-inspector" aria-live="polite">
          {resolvedSelectedDay ? (
            <>
              <div className="heatmap-inspector-primary">
                <span
                  className={`heatmap-inspector-swatch intensity-${resolvedSelectedDay.intensity}`}
                  aria-hidden="true"
                />
                <span className="heatmap-inspector-date">
                  {formatCalendarDate(resolvedSelectedDay.date, { long: true })}
                  {resolvedSelectedDay.date === todayKey ? ' (Today)' : ''}
                </span>
                <span className="heatmap-sep" aria-hidden="true">·</span>
                <strong className="heatmap-inspector-duration tabular-nums">
                  {formatFocusDuration(resolvedSelectedDay.seconds)}
                </strong>
                <span className="heatmap-sep" aria-hidden="true">·</span>
                <span className="heatmap-inspector-tier">{selectedTier.label}</span>
              </div>
              {resolvedSelectedDay.subjects?.length > 0 && (
                <div className="heatmap-inspector-subjects">
                  {resolvedSelectedDay.subjects.slice(0, 3).map((subj, idx) => (
                    <React.Fragment key={subj.name}>
                      {idx > 0 && <span className="heatmap-sep" aria-hidden="true">·</span>}
                      <span>
                        {subj.name}{' '}
                        <span className="tabular-nums" style={{ opacity: 0.7 }}>
                          {formatFocusDuration(subj.seconds)}
                        </span>
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </>
          ) : (
            <span className="heatmap-inspector-muted">Select any day to inspect daily deep work details</span>
          )}
        </div>

        <div className="heatmap-legend-bar" aria-label="Color intensity scale from 0 minutes to 2 hours or more">
          <span className="heatmap-legend-text">Less</span>
          <div className="heatmap-legend-cells">
            {INTENSITY_TIERS.map((tier) => (
              <span
                key={tier.level}
                className={`heatmap-legend-cell intensity-${tier.level}`}
                title={`${tier.label} (${tier.rangeText})`}
                aria-label={`${tier.label}: ${tier.rangeText}`}
              />
            ))}
          </div>
          <span className="heatmap-legend-text">More</span>
          <span className="heatmap-legend-scale tabular-nums">0m · 30m · 1h · 2h+</span>
        </div>
      </div>

      {/* Floating Viewport-Clamped Tooltip */}
      {hoveredDay && (
        <div
          className={`heatmap-floating-tooltip ${hoveredDay.showBelow ? 'below' : 'above'}`}
          style={{ left: `${hoveredDay.left}px`, top: `${hoveredDay.top}px` }}
          role="tooltip"
        >
          <div className="heatmap-tooltip-date">
            {formatCalendarDate(hoveredDay.day.date, { long: true })}
          </div>
          <div className="heatmap-tooltip-meta">
            <strong className="tabular-nums">{formatFocusDuration(hoveredDay.day.seconds)}</strong>
            <span aria-hidden="true">·</span>
            <span>{getIntensityTier(hoveredDay.day.seconds).label}</span>
            {hoveredDay.day.sessionsCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {hoveredDay.day.sessionsCount} {hoveredDay.day.sessionsCount === 1 ? 'session' : 'sessions'}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default HeatmapCalendar;
