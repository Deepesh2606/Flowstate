import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStats } from '../../hooks/useStats';
import { deleteSession } from '../../firebase/firestore';

const formatTime = (seconds) => {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

const HistoryTab = () => {
  const { currentUser } = useAuth();
  const { sessions, loading } = useStats();

  const [filterSubject, setFilterSubject] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [deleting, setDeleting] = useState(null);

  const allSubjects = [...new Set(sessions.map((s) => s.subject).filter(Boolean))];

  const filtered = sessions.filter((s) => {
    if (filterSubject && s.subject !== filterSubject) return false;
    if (filterFrom && s.date < filterFrom) return false;
    if (filterTo && s.date > filterTo) return false;
    return true;
  });

  const handleDelete = async (sessionId) => {
    if (!currentUser) return;
    setDeleting(sessionId);
    try {
      await deleteSession(currentUser.uid, sessionId);
    } catch (e) {
      console.error('Delete failed:', e);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Header */}
      <div style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '1.1rem',
        fontWeight: '700',
        marginBottom: '16px',
        color: 'rgba(255,255,255,0.9)',
      }}>
        Session History
        <span style={{
          marginLeft: '10px',
          fontSize: '13px',
          fontWeight: '400',
          color: 'rgba(255,255,255,0.4)',
          fontFamily: 'Inter, sans-serif',
        }}>
          {filtered.length} sessions
        </span>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <select
          className="filter-select"
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          id="filter-subject"
          aria-label="Filter by subject"
        >
          <option value="">All Subjects</option>
          {allSubjects.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          className="filter-date"
          type="date"
          value={filterFrom}
          onChange={(e) => setFilterFrom(e.target.value)}
          id="filter-from-date"
          aria-label="From date"
          title="From date"
        />
        <input
          className="filter-date"
          type="date"
          value={filterTo}
          onChange={(e) => setFilterTo(e.target.value)}
          id="filter-to-date"
          aria-label="To date"
          title="To date"
        />
        {(filterSubject || filterFrom || filterTo) && (
          <button
            className="pill"
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => { setFilterSubject(''); setFilterFrom(''); setFilterTo(''); }}
            id="filter-clear-btn"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Session List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">
            {sessions.length === 0
              ? 'No sessions yet. Complete a Pomodoro to see history!'
              : 'No sessions match your filters.'}
          </div>
        </div>
      ) : (
        <div>
          {filtered.map((session) => (
            <div key={session.id} className="history-item">
              <div className="history-dot" />
              <div className="history-info">
                <div className="history-subject">{session.subject || 'Unknown'}</div>
                <div className="history-meta">
                  {formatDate(session.date)}
                  {session.mode && (
                    <span style={{ marginLeft: '8px', opacity: 0.6 }}>· {session.mode}</span>
                  )}
                </div>
              </div>
              <div className="history-duration">{formatTime(session.duration)}</div>
              <button
                className="delete-btn"
                onClick={() => handleDelete(session.id)}
                disabled={deleting === session.id}
                aria-label={`Delete session: ${session.subject}`}
                id={`delete-session-${session.id}`}
              >
                {deleting === session.id ? '…' : '🗑'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
