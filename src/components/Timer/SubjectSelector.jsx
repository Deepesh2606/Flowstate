import React, { useState, useRef, useEffect } from 'react';

const SubjectSelector = ({
  subject,
  setSubject,
  studyMode,
  setStudyMode,
  targets = [],
  isRunning = false,
  isEditing,
  setIsEditing,
}) => {
  const currentTarget = targets.find(t => t.name === studyMode) || (targets.length > 0 ? targets[0] : null);
  const [internalEditing, setInternalEditing] = useState(!subject);
  const inputRef = useRef(null);

  // Synchronize editing state with parent prop if provided
  const editing = isEditing !== undefined ? isEditing : internalEditing;
  const setEditingState = (val) => {
    if (setIsEditing) setIsEditing(val);
    setInternalEditing(val);
  };

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (subject && subject.trim()) {
      setSubject(subject.trim());
      setEditingState(false);
    }
  };

  const handleChipClick = (s) => {
    const next = subject === s ? '' : s;
    setSubject(next);
    if (next) {
      setEditingState(false);
    }
  };

  return (
    <div className={`subject-selector glass-card ${isRunning ? 'is-running' : ''}`}>
      {subject && !editing ? (
        <div className="subject-focused-card">
          <div className="subject-focused-left">
            <span className="subject-pulse-dot" />
            <span className="subject-focused-meta">Current Focus</span>
            <span className="subject-focused-name" title={subject}>{subject}</span>
          </div>
          <div className="subject-focused-right">
            <button
              type="button"
              className="subject-pill-action"
              onClick={() => setEditingState(true)}
              title="Change focus topic"
              id="btn-edit-subject"
            >
              Change
            </button>
            <button
              type="button"
              className="subject-pill-action danger"
              onClick={() => {
                setSubject('');
                setEditingState(true);
              }}
              title="Clear topic"
              id="btn-clear-subject"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Target Mode Toggle - only shown when targets are configured */}
          {targets.length > 0 && (
            <div className="mode-toggle" role="group" aria-label="Study mode">
              {targets.map(t => (
                <button
                  key={t.id}
                  className={`mode-toggle-btn ${studyMode === t.name ? 'active' : ''}`}
                  onClick={() => {
                    setStudyMode(t.name);
                    if (t.subjects && t.subjects.length > 0 && !t.subjects.includes(subject)) {
                      setSubject(t.subjects[0]);
                      setEditingState(false);
                    }
                  }}
                  aria-pressed={studyMode === t.name}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}

          {/* Subject Chips for active target */}
          {currentTarget && currentTarget.subjects && currentTarget.subjects.length > 0 && (
            <div className="subject-chips" role="group" aria-label="Select subject">
              {currentTarget.subjects.map((s) => (
                <button
                  key={s}
                  className={`subject-chip ${subject === s ? 'active' : ''}`}
                  onClick={() => handleChipClick(s)}
                  aria-pressed={subject === s}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Free text input form with submit on enter */}
          {(!currentTarget || !currentTarget.subjects || currentTarget.subjects.length === 0) && (
            <form onSubmit={handleSubmit} className="subject-input-wrapper">
              <input
                ref={inputRef}
                className="subject-input"
                type="text"
                placeholder="What are you focusing on? (Press Enter to set)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={50}
                id="subject-text-input"
                aria-label="Study subject"
              />
              {subject && subject.trim() && (
                <button type="submit" className="subject-submit-btn" id="btn-set-focus">
                  Enter Focus ⏎
                </button>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default SubjectSelector;
