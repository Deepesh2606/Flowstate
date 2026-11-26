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
import ProUpgradeModal from '../Settings/ProUpgradeModal';
import { IconLock } from '../Icons';
import {
  clampDailyGoalMinutes,
  resolveDailyGoalMinutes,
  formatGoalMinutes,
  computeDailyGoalProgress,
} from '../../utils/goalUtils';
import DailyGoalInput from './DailyGoalInput';

const formatTime = (seconds) => {
  if (!seconds || seconds <= 0) return '0m';
  if (seconds > 0 && seconds < 60) return '< 1m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

// Daily Deep Work Goal Ring (SVG progress bar synced with DailyGoalInput)
const GoalRing = ({ current, goalMinutes, onChangeGoalMinutes }) => {
  const safeMinutes = clampDailyGoalMinutes(goalMinutes);
  const { progress, percentage, remainingSeconds, isComplete } = computeDailyGoalProgress(
    current,
    safeMinutes
  );

  const r = 36;
  const cx = 44;
  const cy = 44;
  const circ = 2 * Math.PI * r;
  const dash = circ * progress;

  return (
    <div className="goal-ring-wrapper" data-testid="goal-ring-card">
      <svg
        width={88}
        height={88}
        viewBox="0 0 88 88"
        role="progressbar"
        aria-label="Daily deep work goal progress"
        aria-valuemin={0}
        aria-valuemax={safeMinutes}
        aria-valuenow={Math.min(safeMinutes, Math.round((current || 0) / 60))}
        aria-valuetext={`${percentage}% (${formatTime(current)} of ${formatGoalMinutes(safeMinutes)})`}
        className="goal-ring-svg"
      >
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={7} />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={isComplete ? '#10b981' : '#38bdf8'}
          strokeWidth={7}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          data-testid="goal-ring-arc"
          style={{ transition: 'stroke-dasharray 0.35s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.25s ease' }}
        />
        <text
          x={cx}
          y={cy + 5}
          textAnchor="middle"
          fontSize={15}
          fontWeight={700}
          fill="#ffffff"
          className="tabular-nums"
          data-testid="goal-ring-percentage"
        >
          {percentage}%
        </text>
      </svg>

      <div className="goal-ring-label">
        <div className="goal-ring-header-row">
          <div className="goal-ring-title">Daily Deep Work Goal</div>
          <div className="goal-ring-sub tabular-nums" data-testid="goal-ring-summary">
            {formatTime(current)} / {formatGoalMinutes(safeMinutes)}
          </div>
        </div>

        <DailyGoalInput
          goalMinutes={safeMinutes}
          onChangeGoalMinutes={onChangeGoalMinutes}
        />

        <div className={`goal-ring-status ${isComplete ? 'is-complete' : ''}`} data-testid="goal-ring-status">
          {isComplete
            ? 'Goal reached today'
            : `${formatTime(remainingSeconds)} remaining to reach goal`}
        </div>
      </div>
    </div>
  );
};

// XP & Leveling System
const LevelBar = ({ totalFocusTime }) => {
  const totalXP = Math.floor((totalFocusTime || 0) / 60) * 10;
  const currentLevel = Math.floor(Math.sqrt(totalXP / 100)) + 1;
  const xpForCurrentLevel = Math.pow(currentLevel - 1, 2) * 100;
  const xpForNextLevel = Math.pow(currentLevel, 2) * 100;
  const progressPct = Math.min(100, Math.max(0, ((totalXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100));

  return (
    <div className="level-bar-container">
      <div className="level-bar-header">
        <div className="level-badge">
          <span className="level-text">Level {currentLevel}</span>
        </div>
        <div className="xp-text tabular-nums">{totalXP} / {xpForNextLevel} XP</div>
      </div>
      <div className="level-progress-track">
        <div className="level-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>
    </div>
  );
};

// Unlockable Badges Gamification
const UnlockableBadges = ({ currentStreak, totalSessions, totalFocusTime }) => {
  const BADGES = [
    { id: 'first_session', name: 'First Step', icon: '🌱', desc: 'Completed first session', unlocked: totalSessions >= 1 },
    { id: 'streak_3', name: 'On Fire', icon: '🔥', desc: '3 Day Streak', unlocked: currentStreak >= 3 },
    { id: 'streak_7', name: 'Unstoppable', icon: '⚡', desc: '7 Day Streak', unlocked: currentStreak >= 7 },
    { id: 'hours_10', name: 'Dedicated', icon: '⏳', desc: '10 Hours Focused', unlocked: totalFocusTime >= 36000 },
    { id: 'hours_50', name: 'Scholar', icon: '🎓', desc: '50 Hours Focused', unlocked: totalFocusTime >= 180000 },
    { id: 'sessions_100', name: 'Centurion', icon: '💯', desc: '100 Sessions', unlocked: totalSessions >= 100 },
  ];

  return (
    <div className="glass-card">
      <div className="section-header">
        <span className="section-title">Unlockable Badges</span>
        <span className="section-sub">{BADGES.filter(b => b.unlocked).length} / {BADGES.length} Unlocked</span>
      </div>
      <div className="badges-grid">
        {BADGES.map(badge => (
          <div key={badge.id} className={`badge-card ${badge.unlocked ? 'unlocked' : 'locked'}`} title={badge.desc}>
            <div className="badge-icon">{badge.unlocked ? badge.icon : '🔒'}</div>
            <div className="badge-name">{badge.name}</div>
            <div className="badge-desc">{badge.desc}</div>
          </div>
        ))}
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
    const a = document.createElement('a'); a.href = url; a.download = 'flowstate-sessions.csv'; a.click();
    URL.revokeObjectURL(url);
  } else {
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'flowstate-sessions.json'; a.click();
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
  const [showProModal, setShowProModal] = useState(false);

  const handleSubTabChange = (tab) => {
    if (tab === 'leaderboard' && !settings?.isPro) {
      setShowProModal(true);
      return;
    }
    setSubTab(tab);
  };

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
          onClick={() => handleSubTabChange('stats')}
          role="tab"
          aria-selected={subTab === 'stats'}
        >
          My Stats
        </button>
        <button
          type="button"
          className={`stats-subnav-pill ${subTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => handleSubTabChange('leaderboard')}
          role="tab"
          aria-selected={subTab === 'leaderboard'}
        >
          Leaderboard {settings?.isPro ? '' : <IconLock size={12} style={{ marginLeft: '4px' }} />}
        </button>
        <button
          type="button"
          className={`stats-subnav-pill ${subTab === 'planner' ? 'active' : ''}`}
          onClick={() => handleSubTabChange('planner')}
          role="tab"
          aria-selected={subTab === 'planner'}
        >
          Exam Plan
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
        <ProUpgradeModal isOpen={showProModal} onClose={() => setShowProModal(false)} />
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
          <span><strong>Study with a group</strong><small>Create a private room or join a live focus hall.</small></span>
          <span aria-hidden="true">→</span>
        </button>
        <ProUpgradeModal isOpen={showProModal} onClose={() => setShowProModal(false)} />
      </div>
    );
  }

  if (loading) return <div className="spinner" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {renderSubNav()}

      {!currentUser && (
        <div className="stats-guest-sync-bar">
          <div className="stats-guest-sync-copy">
            <strong>Local Analytics Mode</strong>
            <span>Sessions save on this device. Sign in to sync your deep work history across devices.</span>
          </div>
          <GoogleSignInButton size="sm" label="Sign in to Sync" />
        </div>
      )}

      {/* Level & XP Bar */}
      <LevelBar totalFocusTime={totalFocusTime} />

      {/* Top row: Goal ring + Streak */}
      <div className="stats-top-row">
        <GoalRing
          current={todayFocusTime}
          goalMinutes={resolveDailyGoalMinutes(settings)}
          onChangeGoalMinutes={(mins) =>
            updateSettings({ dailyGoalMinutes: clampDailyGoalMinutes(mins) })
          }
        />
        <div className="streak-badge-large">
          <div>
            <div className="streak-number tabular-nums">{currentStreak}</div>
            <div className="streak-label">Day streak</div>
          </div>
        </div>
        {bestTimeOfDay && (
          <div className="best-time-chip">
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

      {/* Deep Work History Heatmap (primary visual focal anchor) */}
      <div className="glass-card heatmap-host-card">
        <HeatmapCalendar monthlyData={monthlyData} sessions={sessions} />
      </div>

      {/* Action buttons */}
      <div className="stats-actions-row">
        <button
          className="stats-action-btn"
          onClick={() => setShowReport(true)}
          id="stats-report-btn"
        >
          Weekly Report
        </button>
        <button
          className="stats-action-btn"
          onClick={() => exportSessions(sessions, 'csv')}
          id="stats-export-csv-btn"
        >
          Export CSV
        </button>
        <button
          className="stats-action-btn"
          onClick={() => exportSessions(sessions, 'json')}
          id="stats-export-json-btn"
        >
          Export JSON
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
          {/* Weekly Bar Chart + Subject Breakdown side-by-side on desktop */}
          <div className="stats-charts-row">
            <div className="glass-card">
              <div className="section-header">
                <span className="section-title">This Week</span>
              </div>
              <WeeklyBarChart weeklyData={weeklyData} />
            </div>

            <div className="glass-card">
              <div className="section-header">
                <span className="section-title">By Subject</span>
              </div>
              <SubjectBreakdown subjectBreakdown={subjectBreakdown} />
            </div>
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

          {/* Unlockable Badges */}
          <UnlockableBadges currentStreak={currentStreak} totalSessions={totalSessions} totalFocusTime={totalFocusTime} />
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
      <ProUpgradeModal isOpen={showProModal} onClose={() => setShowProModal(false)} />
    </div>
  );
};

export default StatsTab;
