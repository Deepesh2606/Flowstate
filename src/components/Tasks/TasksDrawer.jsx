import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTasks } from '../../hooks/useTasks';
import { IconCheck, IconTrash, IconTasks } from '../Icons';
import GoogleSignInButton from '../Auth/GoogleSignInButton';

const TasksDrawer = ({ onClose }) => {
  const { currentUser } = useAuth();
  const { tasks, loading, addTask, toggleTask, deleteTask } = useTasks();
  const [newTask, setNewTask] = useState('');

  if (!currentUser) {
    return (
      <>
        <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />
        <aside className="drawer" role="dialog" aria-label="Tasks" aria-modal="true">
          <div className="drawer-header">
            <h2 className="drawer-title">Tasks & Notes</h2>
            <button className="drawer-close" onClick={onClose} aria-label="Close tasks">✕</button>
          </div>
          <div className="auth-feature-gate">
            <div className="auth-feature-icon">
              <IconTasks size={30} color="var(--accent)" />
            </div>
            <h3 className="auth-feature-title">Cloud Tasks & Notes</h3>
            <p className="auth-feature-desc">
              Sign in with Google to manage and sync your study checklist across devices.
            </p>
            <div style={{ marginTop: '16px' }}>
              <GoogleSignInButton size="md" />
            </div>
          </div>
        </aside>
      </>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    addTask(newTask);
    setNewTask('');
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-label="Tasks" aria-modal="true">
        <div className="drawer-header">
          <h2 className="drawer-title">Tasks & Notes</h2>
          <button className="drawer-close" onClick={onClose} aria-label="Close tasks">✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <input
            className="subject-input"
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            style={{
              padding: '0 16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '10px',
              color: '#fff',
              fontWeight: '600'
            }}
          >
            Add
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading ? (
            <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Loading...</div>
          ) : tasks.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: '40px' }}>
              No active tasks.<br/>Jot down what you want to study!
            </div>
          ) : (
            tasks.map(t => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  opacity: t.completed ? 0.5 : 1
                }}
              >
                <button
                  onClick={() => toggleTask(t.id, t.completed)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    border: `2px solid ${t.completed ? '#00C896' : 'rgba(255,255,255,0.3)'}`,
                    background: t.completed ? '#00C896' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                >
                  {t.completed && <IconCheck size={16} color="#000" />}
                </button>
                <span
                  style={{
                    flex: 1,
                    color: '#fff',
                    fontFamily: 'Inter',
                    fontSize: '14px',
                    lineHeight: '1.4',
                    textDecoration: t.completed ? 'line-through' : 'none'
                  }}
                >
                  {t.text}
                </span>
                <button
                  onClick={() => deleteTask(t.id)}
                  style={{
                    color: 'rgba(255,255,255,0.3)',
                    padding: '4px',
                    marginTop: '-2px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ff5050'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                >
                  <IconTrash size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
};

export default TasksDrawer;
