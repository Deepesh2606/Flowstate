import React from 'react';

const COLORS = ['#06b6d4', '#a78bfa', '#fb923c', '#34d399', '#f472b6'];

const formatTime = (secs) => {
  if (!secs) return '0m';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const SubjectTrendChart = ({ weeklySubjectTrend }) => {
  if (!weeklySubjectTrend || weeklySubjectTrend.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: '13px' }}>
        No subject data yet. Start labeling your sessions!
      </div>
    );
  }

  // Find max value for scaling
  const allValues = weeklySubjectTrend.flatMap(s => s.data.map(d => d.total));
  const maxVal = Math.max(...allValues, 3600); // at least 1h scale

  const W = 280, H = 100;
  const weeks = weeklySubjectTrend[0].data;
  const xStep = W / (weeks.length - 1 || 1);

  return (
    <div className="subject-trend-wrapper">
      <svg viewBox={`0 0 ${W} ${H}`} className="subject-trend-svg" aria-label="Subject trend chart">
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map(p => (
          <line
            key={p}
            x1={0} y1={H - p * H}
            x2={W} y2={H - p * H}
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={1}
          />
        ))}

        {/* Lines per subject */}
        {weeklySubjectTrend.map((subj, si) => {
          const color = COLORS[si % COLORS.length];
          const points = subj.data.map((d, i) => ({
            x: i * xStep,
            y: H - (d.total / maxVal) * (H - 8) - 4,
          }));
          const pathD = points.reduce((d, p, i) =>
            i === 0 ? `M ${p.x} ${p.y}` : `${d} L ${p.x} ${p.y}`, '');

          return (
            <g key={subj.subject}>
              <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={3} fill={color}>
                  <title>{subj.subject}: {formatTime(subj.data[i].total)}</title>
                </circle>
              ))}
            </g>
          );
        })}

        {/* Week labels */}
        {weeks.map((w, i) => (
          <text key={i} x={i * xStep} y={H} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.4)">
            {w.label}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="subject-trend-legend">
        {weeklySubjectTrend.map((subj, si) => (
          <div key={subj.subject} className="trend-legend-item">
            <span className="trend-legend-dot" style={{ background: COLORS[si % COLORS.length] }} />
            <span className="trend-legend-label">{subj.subject}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjectTrendChart;
