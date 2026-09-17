import React from 'react';

const formatTime = (seconds) => {
  if (seconds === 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const SubjectBreakdown = ({ subjectBreakdown }) => {
  if (!subjectBreakdown || subjectBreakdown.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📚</div>
        <div className="empty-state-text">No sessions yet. Start studying!</div>
      </div>
    );
  }

  const total = subjectBreakdown.reduce((acc, s) => acc + s.total, 0);

  const COLORS = ['#00C896', '#7C3AED', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {subjectBreakdown.map((item, i) => {
        const pct = total > 0 ? Math.round((item.total / total) * 100) : 0;
        const color = COLORS[i % COLORS.length];

        return (
          <div key={item.subject}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{
                fontSize: '13px',
                fontWeight: '600',
                fontFamily: 'Space Grotesk, sans-serif',
                color: 'rgba(255,255,255,0.9)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: color,
                  display: 'inline-block',
                  boxShadow: `0 0 6px ${color}`,
                  flexShrink: 0,
                }} />
                {item.subject}
              </span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                {formatTime(item.total)} · {pct}%
              </span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}66` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SubjectBreakdown;
