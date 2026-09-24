import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStats } from '../../hooks/useStats';
import { useSettings } from '../../hooks/useSettings';
import { IconStats } from '../Icons';
import GoogleSignInButton from '../Auth/GoogleSignInButton';
import WeeklyBarChart from './WeeklyBarChart';
import SubjectBreakdown from './SubjectBreakdown';
import HeatmapCalendar from './HeatmapCalendar';
import SubjectTrendChart from './SubjectTrendChart';
import ReportCard from './ReportCard';
import LeaderboardView from './LeaderboardView';
import ExamPlanner from '../Planner/ExamPlanner';

const formatTime = (seconds) => {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

// Daily Goal Ring (SVG)
const GoalRing = ({ current, goal }) => {
  const goalSecs = (goal || 8) * 3600;
  const progress = Math.min(1, current / goalSecs);
  const r = 36, cx = 44, cy = 44;
  const circ = 2 * Math.PI * r;
  const dash = circ * progress;
  const pct = Math.round(progress * 100);

  return (
    <div className="goal-ring-wrapper">
      <svg width={88} height={88} viewBox="0 0 88 88" aria-label={`Daily goal: ${pct}%`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8} />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={progress >= 1 ? '#10b981' : '#06b6d4'}
          strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill="#ffffff">
          {pct}%
        </text>
      </svg>
      <div className="goal-ring-label">
        <div className="goal-ring-title">Daily Goal</div>
        <div className="goal-ring-sub">{formatTime(current)} / {goal || 8}h</div>
      </div>
    </div>
  );
};

// Export helper
const exportSessions = (sessions, format = 'csv') => {
  if (format === 'csv') {
    const header = 'date,subject,duration_min,mode,timestamp\n';
    const rows = sessions.map(s =>
      `${s.date},${(s.subject || '').replace(/,/g, ';')},${Math.round((s.duration || 0) / 60)},${s.mode || ''},${s.timestamp || ''}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'fmood-sessions.csv'; a.click();
    URL.revokeObjectURL(url);
  } else {
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'fmood-sessions.json'; a.click();
    URL.revokeObjectURL(url);
  }
};

const StatsTab = ({ initialSubTab = 'stats', onSubTabConsumed, onOpenStudyGroups }) => {
  const { currentUser } = useAuth();
  const { settings, updateSettings } = useSettings();
  const {
    loading,
    sessions,
    todayFocusTime,
    weeklyData,
    subjectBreakdown,
    currentStreak,
    longestStreak,
    totalSessions,
    monthlyData,
    bestTimeOfDay,
    weeklySubjectTrend,
    totalFocusTime,
  } = useStats();

  const [subTab, setSubTab] = useState(initialSubTab);
  const [showDetails, setShowDetails] = useState(true);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
      onSubTabConsumed?.();
    }
  }, [initialSubTab, onSubTabConsumed]);

  const renderSubNav = () => (
    <div className="stats-subnav-container">
      <div className="stats-subnav-pills" role="tablist">
        <button
          type="button"
          className={`stats-subnav-pill ${subTab === 'stats' ? 'active' : ''}`}
          onClick={() => setSubTab('stats')}
          role="tab"
          aria-selected={subTab === 'stats'}
        >
          <span>📊</span> My Stats
        </button>
        <button
          type="button"
          className={`stats-subnav-pill ${subTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setSubTab('leaderboard')}
          role="tab"
          aria-selected={subTab === 'leaderboard'}
        >
          <span>🏆</span> Leaderboard
        </button>
        <button
          type="button"
          className={`stats-subnav-pill ${subTab === 'planner' ? 'active' : ''}`}
          onClick={() => setSubTab('planner')}
          role="tab"
          aria-selected={subTab === 'planner'}
        >
          <span>🗓️</span> Exam Plan
        </button>
      </div>
    </div>
  );

  if (subTab === 'leaderboard') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {renderSubNav()}
        <LeaderboardView
          todayFocusTime={todayFocusTime}
          weeklyData={weeklyData}
          totalFocusTime={totalFocusTime}
          currentStreak={currentStreak}
          subjectBreakdown={subjectBreakdown}
        />
      </div>
    );
  }

  if (subTab === 'planner') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {renderSubNav()}
        <ExamPlanner
          exams={settings?.exams || []}
          onChange={(exams) => updateSettings({ exams })}
          showExamDeadline={settings?.showExamDeadline ?? true}
          onToggleShow={(val) => updateSettings({ showExamDeadline: val })}
        />
        <button type="button" className="planner-groups-btn" onClick={onOpenStudyGroups}>
          <span>👥</span>
          <span><strong>Study with a group</strong><small>Create a private group or join a live focus room.</small></span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {renderSubNav()}
        <div className="auth-tab-gate">
          <div className="auth-tab-card">
            <div className="auth-tab-icon"><IconStats size={36} color="var(--accent)" /></div>
            <h2 className="auth-tab-title">Focus Analytics & Streaks</h2>
            <p className="auth-tab-desc">Sign in with Google to record your study time, monitor weekly charts, track streaks, and unlock your focus heatmap.</p>
            <div style={{ marginTop: '20px' }}><GoogleSignInButton size="md" /></div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="spinner" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {renderSubNav()}
      {/* Top row: Goal ring + Streak */}
      <div className="stats-top-row">
        <GoalRing current={todayFocusTime} goal={settings?.dailyGoal} />
        <div className="streak-badge-large">
          <span className="streak-flame">🔥</span>
          <div>
            <div className="streak-number">{currentStreak}</div>
            <div className="streak-label">day streak</div>
          </div>
        </div>
        {bestTimeOfDay && (
          <div className="best-time-chip">
            <div className="best-time-icon">⚡</div>
            <div>
              <div className="best-time-label">Peak Focus</div>
              <div className="best-time-value">{bestTimeOfDay.label}</div>
            </div>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-card-label">Today's Focus</div>
          <div className="stat-card-value">{formatTime(todayFocusTime)}</div>
          <div className="stat-card-sub">Keep it up!</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Total Sessions</div>
          <div className="stat-card-value">{totalSessions}</div>
          <div className="stat-card-sub">all time</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">All-Time Focus</div>
          <div className="stat-card-value">{formatTime(totalFocusTime)}</div>
          <div className="stat-card-sub">cumulative</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Longest Streak</div>
          <div className="stat-card-value">{longestStreak}d</div>
          <div className="stat-card-sub">personal best</div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="stats-actions-row">
        <button
          className="stats-action-btn"
          onClick={() => setShowReport(true)}
          id="stats-report-btn"
        >
          📊 Weekly Report
        </button>
        <button
          className="stats-action-btn"
          onClick={() => exportSessions(sessions, 'csv')}
          id="stats-export-csv-btn"
        >
          ⬇ Export CSV
        </button>
        <button
          className="stats-action-btn"
          onClick={() => exportSessions(sessions, 'json')}
          id="stats-export-json-btn"
        >
          ⬇ Export JSON
        </button>
      </div>

      {/* Toggle detailed breakdown */}
      <button
        className="toggle-btn"
        onClick={() => setShowDetails(v => !v)}
        id="stats-toggle-details"
        aria-expanded={showDetails}
      >
        {showDetails ? '▲' : '▼'} {showDetails ? 'Hide' : 'Show'} Details
      </button>

      {showDetails && (
        <>
          {/* Activity Heatmap */}
          <div className="glass-card">
            <div className="section-header">
              <span className="section-title">Activity Heatmap</span>
              <span className="section-sub">Last 90 days</span>
            </div>
            <HeatmapCalendar monthlyData={monthlyData} />
          </div>

          {/* Weekly Bar Chart */}
          <div className="glass-card">
            <div className="section-header">
              <span className="section-title">This Week</span>
            </div>
            <WeeklyBarChart weeklyData={weeklyData} />
          </div>

          {/* Subject Trend */}
          {weeklySubjectTrend?.length > 0 && (
            <div className="glass-card">
              <div className="section-header">
                <span className="section-title">Subject Trend</span>
                <span className="section-sub">Last 4 weeks</span>
              </div>
              <SubjectTrendChart weeklySubjectTrend={weeklySubjectTrend} />
            </div>
          )}

          {/* Subject Breakdown */}
          <div className="glass-card">
            <div className="section-header">
              <span className="section-title">By Subject</span>
            </div>
            <SubjectBreakdown subjectBreakdown={subjectBreakdown} />
          </div>
        </>
      )}

      {/* Report Card Modal */}
      <ReportCard
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        weeklyData={weeklyData}
        subjectBreakdown={subjectBreakdown}
        currentStreak={currentStreak}
        totalFocusTime={totalFocusTime}
        totalSessions={totalSessions}
      />
    </div>
  );
};

export default StatsTab;
