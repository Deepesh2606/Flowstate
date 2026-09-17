import React from 'react';

const WeeklyBarChart = ({ weeklyData }) => {
  if (!weeklyData || weeklyData.length === 0) return null;

  const maxVal = Math.max(...weeklyData.map((d) => d.total), 1);
  const today = new Date().toISOString().split('T')[0];
  const SVG_HEIGHT = 120;
  const BAR_W = 28;
  const BAR_GAP = 10;
  const SVG_WIDTH = weeklyData.length * (BAR_W + BAR_GAP) - BAR_GAP + 20;

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="chart-container">
      <svg
        width="100%"
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT + 36}`}
        aria-label="Weekly focus time bar chart"
        role="img"
      >
        {weeklyData.map((day, i) => {
          const x = i * (BAR_W + BAR_GAP) + 10;
          const barH = day.total === 0 ? 4 : Math.max(8, (day.total / maxVal) * SVG_HEIGHT);
          const y = SVG_HEIGHT - barH;
          const isToday = day.date === today;
          const barColor = isToday ? '#00C896' : 'rgba(255,255,255,0.18)';
          const barGlow = isToday ? 'drop-shadow(0 0 8px rgba(0,200,150,0.6))' : 'none';

          return (
            <g key={day.date}>
              {/* Bar background */}
              <rect
                x={x}
                y={0}
                width={BAR_W}
                height={SVG_HEIGHT}
                rx="6"
                fill="rgba(255,255,255,0.04)"
              />
              {/* Actual bar */}
              <rect
                x={x}
                y={y}
                width={BAR_W}
                height={barH}
                rx="6"
                fill={barColor}
                style={{ filter: barGlow, transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1)' }}
              />
              {/* Day label */}
              <text
                x={x + BAR_W / 2}
                y={SVG_HEIGHT + 18}
                textAnchor="middle"
                fontSize="11"
                fontFamily="Inter, sans-serif"
                fontWeight={isToday ? '700' : '400'}
                fill={isToday ? '#00C896' : 'rgba(255,255,255,0.4)'}
              >
                {day.label}
              </text>
              {/* Time tooltip on hover — show only for non-zero days */}
              {day.total > 0 && (
                <title>{`${day.label}: ${formatTime(day.total)}`}</title>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default WeeklyBarChart;
