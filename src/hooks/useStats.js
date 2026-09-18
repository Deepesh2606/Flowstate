import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeSessions } from '../firebase/firestore';

const isSameDay = (dateStr, date) => dateStr === date.toISOString().split('T')[0];

const getDateNDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

export const useStats = () => {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setSessions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeSessions(currentUser.uid, (data, err) => {
      setSessions(data || []);
      setLoading(false);
      if (err) console.error('Stats loading error:', err);
    });
    return unsub;
  }, [currentUser]);

  const today = new Date().toISOString().split('T')[0];

  // Today's total focus time (seconds)
  const todayFocusTime = sessions
    .filter((s) => s.date === today)
    .reduce((acc, s) => acc + (s.duration || 0), 0);

  // Weekly data (last 7 days)
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = getDateNDaysAgo(6 - i);
    const total = sessions
      .filter((s) => s.date === date)
      .reduce((acc, s) => acc + (s.duration || 0), 0);
    const label = new Date(date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' });
    return { date, label, total };
  });

  // Subject breakdown (all time)
  const subjectMap = {};
  sessions.forEach((s) => {
    if (!s.subject) return;
    subjectMap[s.subject] = (subjectMap[s.subject] || 0) + (s.duration || 0);
  });
  const subjectBreakdown = Object.entries(subjectMap)
    .map(([subject, total]) => ({ subject, total }))
    .sort((a, b) => b.total - a.total);

  // Streak calculation
  const calculateStreaks = () => {
    const uniqueDates = [...new Set(sessions.map((s) => s.date))].sort().reverse();
    let current = 0;
    let longest = 0;
    let streak = 0;
    let prev = null;

    for (const dateStr of uniqueDates) {
      const d = new Date(dateStr + 'T00:00:00');
      if (!prev) {
        // Check if today or yesterday to start streak
        const todayDate = new Date(today + 'T00:00:00');
        const diffMs = todayDate - d;
        const diffDays = Math.round(diffMs / 86400000);
        if (diffDays <= 1) streak = 1;
        else break;
      } else {
        const prevDate = new Date(prev + 'T00:00:00');
        const diffMs = prevDate - d;
        const diffDays = Math.round(diffMs / 86400000);
        if (diffDays === 1) streak++;
        else break;
      }
      prev = dateStr;
    }

    current = streak;

    // Longest streak
    let tempStreak = 0;
    let tempPrev = null;
    for (const dateStr of [...uniqueDates].reverse()) {
      if (!tempPrev) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(tempPrev + 'T00:00:00');
        const currDate = new Date(dateStr + 'T00:00:00');
        const diffDays = Math.round((currDate - prevDate) / 86400000);
        if (diffDays === 1) tempStreak++;
        else tempStreak = 1;
      }
      longest = Math.max(longest, tempStreak);
      tempPrev = dateStr;
    }

    return { current, longest };
  };

  const { current: currentStreak, longest: longestStreak } = calculateStreaks();

  return {
    sessions,
    loading,
    todayFocusTime,
    weeklyData,
    subjectBreakdown,
    currentStreak,
    longestStreak,
    totalSessions: sessions.length,
  };
};
