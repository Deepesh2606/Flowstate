import React, { useState } from 'react';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const getIntensity = (seconds) => {
  if (!seconds || seconds === 0) return 0;
  if (seconds < 1800) return 1;   // < 30m
  if (seconds < 3600) return 2;   // < 1h
  if (seconds < 7200) return 3;   // < 2h
  return 4;                        // 2h+
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

const formatTime = (secs) => {
  if (!secs) return '0m';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const HeatmapCalendar = ({ monthlyData }) => {
  const [tooltip, setTooltip] = useState(null);

  const entries = Object.entries(monthlyData || {}).sort(([a], [b]) => a.localeCompare(b));

  // Build a 13-week grid (91 days, padded to start on Sunday)
  const today = new Date();
  const days = [];
  for (let i = 90; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push({ date: key, seconds: monthlyData?.[key] || 0, dayOfWeek: d.getDay() });
  }

  // Pad front to start on Sunday
  const firstDayOfWeek = days[0]?.dayOfWeek || 0;
  const padded = [...Array(firstDayOfWeek).fill(null), ...days];

  // Group into weeks (columns)
  const weeks = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  return (
    <div className="heatmap-wrapper">
      <div className="heatmap-grid">
        {/* Day labels */}
        <div className="heatmap-day-labels">
          {DAYS.map((d, i) => (
            <div key={i} className="heatmap-day-label">{i % 2 === 1 ? d : ''}</div>
          ))}
        </div>

        {/* Weeks */}
        <div className="heatmap-weeks">
          {weeks.map((week, wi) => (
            <div key={wi} className="heatmap-week-col">
              {week.map((day, di) => (
                day ? (
                  <div
                    key={di}
                    className={`heatmap-cell intensity-${getIntensity(day.seconds)}`}
                    onMouseEnter={(e) => setTooltip({ date: day.date, seconds: day.seconds, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                    title={`${formatDate(day.date)}: ${formatTime(day.seconds)}`}
                  />
                ) : (
                  <div key={di} className="heatmap-cell empty" />
                )
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="heatmap-legend">
        <span className="heatmap-legend-label">Less</span>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className={`heatmap-cell intensity-${i}`} style={{ borderRadius: '3px' }} />
        ))}
        <span className="heatmap-legend-label">More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="heatmap-tooltip"
          style={{ left: tooltip.x + 12, top: tooltip.y - 36 }}
        >
          <strong>{formatDate(tooltip.date)}</strong>
          <span>{formatTime(tooltip.seconds)} focused</span>
        </div>
      )}
    </div>
  );
};

export default HeatmapCalendar;
