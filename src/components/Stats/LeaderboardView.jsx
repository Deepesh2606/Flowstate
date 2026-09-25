import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateLeaderboardUser, subscribeLeaderboard } from '../../firebase/firestore';

const formatTime = (seconds) => {
  if (!seconds || seconds <= 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m > 0 ? `${m}m` : ''}`;
  return `${m}m`;
};

export const LeaderboardView = ({
  todayFocusTime = 0,
  weeklyData = [],
  totalFocusTime = 0,
  currentStreak = 0,
  subjectBreakdown = [],
}) => {
  const { currentUser } = useAuth();
  const [timeframe, setTimeframe] = useState('today'); // 'today' | 'week' | 'allTime'
  const [search, setSearch] = useState('');
  const [communityUsers, setCommunityUsers] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeLeaderboard((list) => {
      const formatted = list.map(u => ({
        id: u.id,
        name: u.displayName || 'Anonymous Student',
        avatar: u.photoURL || null,
        subject: u.subject || 'Deep Work',
        todaySeconds: u.todaySeconds || 0,
        weekSeconds: u.weekSeconds || 0,
        allTimeSeconds: u.allTimeSeconds || 0,
        streak: u.streak || 0,
      }));
      setCommunityUsers(formatted);
    });
    return () => unsubscribe();
  }, []);

  // Calculate current user's weekly focus time from weeklyData
  const weeklyUserSeconds = useMemo(() => {
    return weeklyData.reduce((acc, d) => acc + (d.total || 0), 0);
  }, [weeklyData]);

  // Current user's top subject
  const topSubject = subjectBreakdown?.[0]?.subject || 'Deep Work';

  // Sync current user's stats to Firestore leaderboard collection if signed in
  useEffect(() => {
    if (currentUser?.uid && (todayFocusTime > 0 || totalFocusTime > 0)) {
      updateLeaderboardUser(currentUser.uid, {
        displayName: currentUser.displayName || 'Anonymous Student',
        photoURL: currentUser.photoURL || null,
        todaySeconds: todayFocusTime,
        weekSeconds: weeklyUserSeconds,
        allTimeSeconds: totalFocusTime,
        streak: currentStreak,
        subject: topSubject,
      });
    }
  }, [currentUser, todayFocusTime, weeklyUserSeconds, totalFocusTime, currentStreak, topSubject]);

  // Current user item
  const currentUserItem = useMemo(() => ({
    id: currentUser?.uid || 'current_user',
    name: currentUser?.displayName || 'You',
    avatar: currentUser?.photoURL || null,
    subject: topSubject,
    todaySeconds: todayFocusTime,
    weekSeconds: weeklyUserSeconds,
    allTimeSeconds: totalFocusTime,
    streak: currentStreak,
    isCurrent: true,
  }), [currentUser, todayFocusTime, weeklyUserSeconds, totalFocusTime, currentStreak, topSubject]);

  // Combine community users with current user and sort by active timeframe
  const rankedUsers = useMemo(() => {
    const combined = [
      ...communityUsers.filter(u => u.id !== currentUser?.uid),
      currentUserItem,
    ];

    const sortKey = timeframe === 'today' ? 'todaySeconds' : timeframe === 'week' ? 'weekSeconds' : 'allTimeSeconds';

    combined.sort((a, b) => b[sortKey] - a[sortKey]);

    return combined.map((user, idx) => ({
      ...user,
      rank: idx + 1,
    }));
  }, [communityUsers, currentUserItem, currentUser?.uid, timeframe]);

  // Find user's current rank
  const myRankInfo = useMemo(() => {
    return rankedUsers.find(u => u.isCurrent) || { rank: rankedUsers.length };
  }, [rankedUsers]);

  // Filter by search query
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return rankedUsers;
    const q = search.toLowerCase();
    return rankedUsers.filter(u =>
      u.name.toLowerCase().includes(q) ||
      (u.subject && u.subject.toLowerCase().includes(q))
    );
  }, [rankedUsers, search]);

  const topThree = rankedUsers.slice(0, 3);

  const getSortScore = (u) => {
    const secs = timeframe === 'today' ? u.todaySeconds : timeframe === 'week' ? u.weekSeconds : u.allTimeSeconds;
    return formatTime(secs);
  };

  return (
    <div className="leaderboard-view">
      {/* Top Controls: Timeframe Filter + Search */}
      <div className="leaderboard-controls">
        <div className="leaderboard-pills" role="tablist">
          <button
            type="button"
            className={`leaderboard-pill ${timeframe === 'today' ? 'active' : ''}`}
            onClick={() => setTimeframe('today')}
          >
            Today
          </button>
          <button
            type="button"
            className={`leaderboard-pill ${timeframe === 'week' ? 'active' : ''}`}
            onClick={() => setTimeframe('week')}
          >
            This Week
          </button>
          <button
            type="button"
            className={`leaderboard-pill ${timeframe === 'allTime' ? 'active' : ''}`}
            onClick={() => setTimeframe('allTime')}
          >
            All Time
          </button>
        </div>

        <input
          type="text"
          className="leaderboard-search"
          placeholder="Search by student or subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Current User Standing Banner */}
      <div className="leaderboard-user-banner">
        <div className="user-banner-left">
          <div className="user-banner-rank-badge">
            #{myRankInfo.rank}
          </div>
          <div className="user-banner-avatar-wrapper">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="You" className="user-banner-avatar" />
            ) : (
              <div className="user-banner-avatar-placeholder">👤</div>
            )}
          </div>
          <div>
            <div className="user-banner-name">
              {currentUser?.displayName || 'You'} <span className="user-banner-tag">You</span>
            </div>
            <div className="user-banner-sub">
              {topSubject} · 🔥 {currentStreak} day streak
            </div>
          </div>
        </div>

        <div className="user-banner-right">
          <div className="user-banner-time-label">
            {timeframe === 'today' ? "Today's Focus" : timeframe === 'week' ? "This Week" : "All Time"}
          </div>
          <div className="user-banner-time-val">{getSortScore(currentUserItem)}</div>
          {myRankInfo.rank > 1 && (
            <div className="user-banner-overtake">
              {(() => {
                const aheadUser = rankedUsers[myRankInfo.rank - 2];
                if (!aheadUser) return null;
                const sortKey = timeframe === 'today' ? 'todaySeconds' : timeframe === 'week' ? 'weekSeconds' : 'allTimeSeconds';
                const gap = Math.max(0, aheadUser[sortKey] - currentUserItem[sortKey]);
                return `${formatTime(gap)} to pass #${myRankInfo.rank - 1}`;
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Podium for Top 3 (Shown when not searching) */}
      {!search.trim() && topThree.length === 3 && (
        <div className="leaderboard-podium">
          {/* 2nd Place */}
          <div className="podium-col second">
            <div className="podium-badge">🥈 #2</div>
            <img src={topThree[1].avatar} alt={topThree[1].name} className="podium-avatar" />
            <div className="podium-name">{topThree[1].name.split(' ')[0]}</div>
            <div className="podium-time">{getSortScore(topThree[1])}</div>
            <div className="podium-bar second-bar" />
          </div>

          {/* 1st Place */}
          <div className="podium-col first">
            <div className="podium-crown">👑</div>
            <div className="podium-badge gold">🥇 #1</div>
            <img src={topThree[0].avatar} alt={topThree[0].name} className="podium-avatar first-avatar" />
            <div className="podium-name">{topThree[0].name.split(' ')[0]}</div>
            <div className="podium-time">{getSortScore(topThree[0])}</div>
            <div className="podium-bar first-bar" />
          </div>

          {/* 3rd Place */}
          <div className="podium-col third">
            <div className="podium-badge bronze">🥉 #3</div>
            <img src={topThree[2].avatar} alt={topThree[2].name} className="podium-avatar" />
            <div className="podium-name">{topThree[2].name.split(' ')[0]}</div>
            <div className="podium-time">{getSortScore(topThree[2])}</div>
            <div className="podium-bar third-bar" />
          </div>
        </div>
      )}

      {/* Leaderboard Table / Rows */}
      <div className="leaderboard-list">
        {filteredUsers.map((user) => {
          const isTop3 = user.rank <= 3;
          const rankIcon = user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : `#${user.rank}`;

          return (
            <div
              key={user.id}
              className={`leaderboard-row ${user.isCurrent ? 'is-me' : ''} ${isTop3 ? `top-${user.rank}` : ''}`}
            >
              <div className="leaderboard-rank-col">
                <span className={`rank-indicator ${isTop3 ? 'medal' : ''}`}>{rankIcon}</span>
              </div>

              <div className="leaderboard-user-col">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="leaderboard-avatar" />
                ) : (
                  <div className="leaderboard-avatar-placeholder">
                    {user.name.charAt(0)}
                  </div>
                )}
                <div className="leaderboard-user-info">
                  <div className="leaderboard-user-name">
                    {user.name} {user.isCurrent && <span className="me-badge">You</span>}
                  </div>
                  <div className="leaderboard-user-subject">{user.subject}</div>
                </div>
              </div>

              <div className="leaderboard-streak-col">
                <span className="streak-tag">🔥 {user.streak}d</span>
              </div>

              <div className="leaderboard-score-col">
                <span className="score-val">{getSortScore(user)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="leaderboard-footer-note">
        💡 <em>Focus time updates automatically as you complete sessions.</em>
      </div>
    </div>
  );
};

export default LeaderboardView;
