import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { IconBook } from '../Icons';

const formatTime = (seconds) => {
  if (seconds === 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ background: 'rgba(0,0,0,0.8)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>{data.subject}</p>
        <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{formatTime(data.total)}</p>
      </div>
    );
  }
  return null;
};

const SubjectBreakdown = ({ subjectBreakdown }) => {
  const [activeIndex, setActiveIndex] = useState(-1);

  if (!subjectBreakdown || subjectBreakdown.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><IconBook size={32} /></div>
        <div className="empty-state-text">No sessions yet. Start studying!</div>
      </div>
    );
  }

  const COLORS = ['#00C896', '#7C3AED', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];
  const total = subjectBreakdown.reduce((acc, s) => acc + s.total, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '16px' }}>
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={subjectBreakdown}
              dataKey="total"
              nameKey="subject"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              stroke="none"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(-1)}
            >
              {subjectBreakdown.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  style={{ 
                    filter: activeIndex === index || activeIndex === -1 ? `drop-shadow(0 0 8px ${COLORS[index % COLORS.length]}80)` : 'none',
                    opacity: activeIndex === index || activeIndex === -1 ? 1 : 0.5,
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
        {subjectBreakdown.map((item, i) => {
          const pct = total > 0 ? Math.round((item.total / total) * 100) : 0;
          const color = COLORS[i % COLORS.length];

          return (
            <div 
              key={item.subject} 
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px',
                opacity: activeIndex === i || activeIndex === -1 ? 1 : 0.5,
                transition: 'opacity 0.3s ease'
              }}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(-1)}
            >
              <span style={{
                width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0,
                boxShadow: `0 0 6px ${color}`
              }} />
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.subject}
                </span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                  {formatTime(item.total)} ({pct}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubjectBreakdown;
