import React from 'react';

const SubjectSelector = ({ subject, setSubject, studyMode, setStudyMode, targets = [] }) => {
  const currentTarget = targets.find(t => t.name === studyMode) || (targets.length > 0 ? targets[0] : null);

  return (
    <div className="subject-selector glass-card">
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
              onClick={() => setSubject(subject === s ? '' : s)}
              aria-pressed={subject === s}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Free text input when no targets configured or to type a subject */}
      {(!currentTarget || !currentTarget.subjects || currentTarget.subjects.length === 0) && (
        <input
          className="subject-input"
          type="text"
          placeholder="What are you focusing on?"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={50}
          id="subject-text-input"
          aria-label="Study subject"
        />
      )}
    </div>
  );
};

export default SubjectSelector;
