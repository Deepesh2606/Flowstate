import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStats } from '../../hooks/useStats';
import { useToast } from '../Toast/ToastProvider';
import { deleteSession, updateSession } from '../../firebase/firestore';
import { IconHistory, IconTrash, IconEdit, IconCheck } from '../Icons';
import GoogleSignInButton from '../Auth/GoogleSignInButton';

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

const HistoryTab = ({ onTabChange }) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { sessions, loading } = useStats();

  const [filterSubject, setFilterSubject] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  if (!currentUser) {
    return (
      <div className="auth-tab-gate">
        <div className="auth-tab-card">
          <div className="auth-tab-icon">
            <IconHistory size={36} color="var(--accent)" />
          </div>
          <h2 className="auth-tab-title">Session History</h2>
          <p className="auth-tab-desc">
            Sign in with Google to review your completed study sessions, filter by subject, and sync logs.
          </p>
          <div style={{ marginTop: '20px' }}>
            <GoogleSignInButton size="md" />
          </div>
        </div>
      </div>
    );
  }

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
      toast?.('Session deleted', 'info', 2000);
    } catch (e) {
      console.error('Delete failed:', e);
      toast?.('Failed to delete session', 'error', 3000);
    } finally {
      setDeleting(null);
    }
  };

  const handleStartEdit = (session) => {
    setEditingId(session.id);
    setEditName(session.subject || '');
  };

  const handleSaveEdit = async (sessionId) => {
    if (!currentUser) return;
    const trimmed = editName.trim() || 'Untitled Session';
    setSaving(true);
    try {
      await updateSession(currentUser.uid, sessionId, { subject: trimmed });
      setEditingId(null);
      toast?.('Session renamed', 'success', 2000);
    } catch (e) {
      console.error('Rename failed:', e);
      toast?.('Failed to rename session', 'error', 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  if (loading) return <div className="spinner" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Header */}
      <div className="history-header">
        <div className="history-title-group">
          <IconHistory size={20} color="var(--accent)" />
          <h2 className="history-title">Session History</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onTabChange && (
            <button
              type="button"
              className="history-leaderboard-btn"
              onClick={() => onTabChange('stats', 'leaderboard')}
              title="View Community Leaderboard"
            >
              <span>🏆</span> Leaderboard
            </button>
          )}
          <span className="history-count-badge">
            {filtered.length} {filtered.length === 1 ? 'session' : 'sessions'}
          </span>
        </div>
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
        <div className="filter-date-group">
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
        </div>
        {(filterSubject || filterFrom || filterTo) && (
          <button
            className="filter-clear-btn"
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
          <div className="empty-state-icon"><IconHistory size={36} /></div>
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
                {editingId === session.id ? (
                  <form
                    className="history-edit-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveEdit(session.id);
                    }}
                  >
                    <input
                      type="text"
                      className="history-edit-input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Session name..."
                      autoFocus
                      disabled={saving}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      id={`edit-input-${session.id}`}
                    />
                    <div className="history-edit-actions">
                      <button
                        type="submit"
                        className="history-edit-btn history-edit-save"
                        disabled={saving || !editName.trim()}
                        title="Save changes (Enter)"
                        aria-label="Save session name"
                        id={`save-session-${session.id}`}
                      >
                        {saving ? '…' : <IconCheck size={14} />}
                      </button>
                      <button
                        type="button"
                        className="history-edit-btn history-edit-cancel"
                        onClick={handleCancelEdit}
                        disabled={saving}
                        title="Cancel (Esc)"
                        aria-label="Cancel editing"
                        id={`cancel-edit-${session.id}`}
                      >
                        ✕
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="history-subject-row">
                    <span className="history-subject" title={session.subject || 'Unknown'}>
                      {session.subject || 'Unknown'}
                    </span>
                    <button
                      type="button"
                      className="history-edit-trigger-btn"
                      onClick={() => handleStartEdit(session)}
                      title="Edit session name"
                      aria-label={`Edit session name: ${session.subject || 'Unknown'}`}
                      id={`edit-session-${session.id}`}
                    >
                      <IconEdit size={13} />
                    </button>
                  </div>
                )}
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
                {deleting === session.id ? '…' : <IconTrash size={16} />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
