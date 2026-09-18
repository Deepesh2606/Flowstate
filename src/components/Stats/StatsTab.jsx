import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStats } from '../../hooks/useStats';
import { IconStats } from '../Icons';
import GoogleSignInButton from '../Auth/GoogleSignInButton';
import WeeklyBarChart from './WeeklyBarChart';
import SubjectBreakdown from './SubjectBreakdown';

const formatTime = (seconds) => {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const StatsTab = () => {
  const { currentUser } = useAuth();
  const {
    loading,
    todayFocusTime,
    weeklyData,
    subjectBreakdown,
    currentStreak,
    longestStreak,
    totalSessions,
  } = useStats();

  const [showDetails, setShowDetails] = useState(true);

  if (!currentUser) {
    return (
      <div className="auth-tab-gate">
        <div className="auth-tab-card">
          <div className="auth-tab-icon">
            <IconStats size={36} color="var(--accent)" />
          </div>
          <h2 className="auth-tab-title">Focus Analytics & Streaks</h2>
          <p className="auth-tab-desc">
            Sign in with Google to record your study time, monitor weekly charts, and track focus streaks.
          </p>
          <div style={{ marginTop: '20px' }}>
            <GoogleSignInButton size="md" />
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="spinner" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
          <div className="stat-card-label">Current Streak</div>
          <div className="stat-card-value">{currentStreak}d</div>
          <div className="stat-card-sub">days in a row</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Longest Streak</div>
          <div className="stat-card-value">{longestStreak}d</div>
          <div className="stat-card-sub">personal best</div>
        </div>
      </div>

      {/* Toggle detailed breakdown */}
      <button
        className="toggle-btn"
        onClick={() => setShowDetails((v) => !v)}
        id="stats-toggle-details"
        aria-expanded={showDetails}
      >
        {showDetails ? '▲' : '▼'} {showDetails ? 'Hide' : 'Show'} Details
      </button>

      {showDetails && (
        <>
          {/* Weekly Bar Chart */}
          <div className="glass-card">
            <div className="section-header">
              <span className="section-title">This Week</span>
            </div>
            <WeeklyBarChart weeklyData={weeklyData} />
          </div>

          {/* Subject Breakdown */}
          <div className="glass-card">
            <div className="section-header">
              <span className="section-title">By Subject</span>
            </div>
            <SubjectBreakdown subjectBreakdown={subjectBreakdown} />
          </div>
        </>
      )}
    </div>
  );
};

export default StatsTab;
