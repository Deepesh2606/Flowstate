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
      try {
        const saved = JSON.parse(localStorage.getItem('flowstate_guest_sessions') || '[]');
        setSessions(saved);
      } catch (e) {
        setSessions([]);
      }
      setLoading(false);

      const handleGuestUpdate = () => {
        try {
          const saved = JSON.parse(localStorage.getItem('flowstate_guest_sessions') || '[]');
          setSessions(saved);
        } catch (e) {}
      };
      window.addEventListener('flowstate_guest_sessions_updated', handleGuestUpdate);
      return () => window.removeEventListener('flowstate_guest_sessions_updated', handleGuestUpdate);
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

  // Monthly data (last 90 days for heatmap)
  const monthlyData = (() => {
    const result = {};
    for (let i = 89; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      result[key] = 0;
    }
    sessions.forEach(s => {
      if (s.date && result[s.date] !== undefined) {
        result[s.date] += s.duration || 0;
      }
    });
    return result; // { 'YYYY-MM-DD': seconds }
  })();

  // Best time of day (which 2-hour window has the most focus time)
  const bestTimeOfDay = (() => {
    const buckets = new Array(12).fill(0); // 12 two-hour buckets
    sessions.forEach(s => {
      if (!s.timestamp) return;
      const hour = new Date(s.timestamp).getHours();
      const bucket = Math.floor(hour / 2);
      buckets[bucket] += s.duration || 0;
    });
    const maxIdx = buckets.indexOf(Math.max(...buckets));
    if (buckets[maxIdx] === 0) return null;
    const startH = maxIdx * 2;
    const endH = startH + 2;
    const fmt = (h) => {
      const ampm = h >= 12 ? 'pm' : 'am';
      return `${h % 12 === 0 ? 12 : h % 12}${ampm}`;
    };
    return { label: `${fmt(startH)}–${fmt(endH)}`, totalSeconds: buckets[maxIdx] };
  })();

  // Weekly subject trend (last 4 weeks, top subjects)
  const weeklySubjectTrend = (() => {
    const weeks = [0, 1, 2, 3].map(w => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (w * 7 + 6));
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - (w * 7));
      return { start: weekStart.toISOString().split('T')[0], end: weekEnd.toISOString().split('T')[0], label: w === 0 ? 'This week' : `${w}w ago` };
    }).reverse();

    const subjectSet = new Set(sessions.slice(0, 100).map(s => s.subject).filter(Boolean));
    const topSubjects = [...subjectSet].slice(0, 3);

    return topSubjects.map(subj => ({
      subject: subj,
      data: weeks.map(w => ({
        label: w.label,
        total: sessions
          .filter(s => s.subject === subj && s.date >= w.start && s.date <= w.end)
          .reduce((acc, s) => acc + (s.duration || 0), 0),
      })),
    }));
  })();

  // All-time total focus hours
  const totalFocusTime = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);

  return {
    sessions,
    loading,
    todayFocusTime,
    weeklyData,
    subjectBreakdown,
    currentStreak,
    longestStreak,
    totalSessions: sessions.length,
    monthlyData,
    bestTimeOfDay,
    weeklySubjectTrend,
    totalFocusTime,
  };
};
