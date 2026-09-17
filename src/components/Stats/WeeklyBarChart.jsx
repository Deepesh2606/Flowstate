import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.total === 0) return null;
    return (
      <div style={{ background: 'rgba(0,0,0,0.8)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{data.label}</p>
        <p style={{ margin: 0, fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>{formatTime(data.total)}</p>
      </div>
    );
  }
  return null;
};

const WeeklyBarChart = ({ weeklyData }) => {
  if (!weeklyData || weeklyData.length === 0) return null;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="chart-container" style={{ width: '100%', height: 160 }}>
      <ResponsiveContainer>
        <BarChart data={weeklyData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <XAxis 
            dataKey="label" 
            axisLine={false} 
            tickLine={false} 
            tick={(props) => {
              const { x, y, payload } = props;
              const isToday = weeklyData[payload.index]?.date === today;
              return (
                <text 
                  x={x} 
                  y={y + 10} 
                  textAnchor="middle" 
                  fill={isToday ? '#00C896' : 'rgba(255,255,255,0.4)'} 
                  fontSize="11" 
                  fontWeight={isToday ? '700' : '400'}
                  fontFamily="Inter, sans-serif"
                >
                  {payload.value}
                </text>
              );
            }} 
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
          <Bar dataKey="total" radius={[6, 6, 6, 6]} minPointSize={4}>
            {weeklyData.map((entry, index) => {
              const isToday = entry.date === today;
              return (
                <Cell 
                  key={`cell-${index}`} 
                  fill={isToday ? '#00C896' : 'rgba(255,255,255,0.18)'} 
                  style={{
                    filter: isToday ? 'drop-shadow(0 0 8px rgba(0,200,150,0.6))' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklyBarChart;
