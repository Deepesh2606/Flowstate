import React, { useMemo, useState } from 'react';

const toLocalDate = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const daysUntil = (value) => {
  const target = toLocalDate(value);
  if (!target) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
};

const countdownLabel = (days) => {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 0) return `${Math.abs(days)}d ago`;
  return `${days} days left`;
};

const dateKey = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');

const ExamPlanner = ({ exams = [], onChange, showExamDeadline = true, onToggleShow = () => {} }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [monthOffset, setMonthOffset] = useState(0);

  const sortedExams = useMemo(
    () => [...exams].sort((a, b) => a.date.localeCompare(b.date)),
    [exams]
  );

  const calendar = useMemo(() => {
    const current = new Date();
    const view = new Date(current.getFullYear(), current.getMonth() + monthOffset, 1);
    const startPadding = view.getDay();
    const totalDays = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    const cells = Array.from({ length: startPadding + totalDays }, (_, index) => {
      const day = index - startPadding + 1;
      return day > 0 ? new Date(view.getFullYear(), view.getMonth(), day) : null;
    });
    return { view, cells };
  }, [monthOffset]);

  const addExam = (event) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle || !date) return;
    onChange([...exams, { id: `${Date.now()}-${cleanTitle}`, title: cleanTitle, date }]);
    setTitle('');
    setDate('');
  };

  const removeExam = (id) => onChange(exams.filter((exam) => exam.id !== id));

  return (
    <section className="exam-planner" aria-label="Exam calendar and countdowns">
      <div className="exam-planner-heading">
        <div>
          <span className="exam-planner-eyebrow">STUDY PLAN</span>
          <h2>Exam countdowns</h2>
        </div>
        <span className="exam-planner-icon" aria-hidden="true">🗓️</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '0 8px' }}>
        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Show on Home Screen</span>
        <label className="ios-toggle">
          <input
            type="checkbox"
            checked={showExamDeadline}
            onChange={(e) => onToggleShow(e.target.checked)}
          />
          <span className="ios-toggle-slider" />
        </label>
      </div>

      <form className="exam-form" onSubmit={addExam}>
        <label className="sr-only" htmlFor="exam-title">Exam name</label>
        <input id="exam-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Exam or deadline" maxLength={60} />
        <label className="sr-only" htmlFor="exam-date">Exam date</label>
        <input id="exam-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <button type="submit" disabled={!title.trim() || !date}>Add</button>
      </form>

      {sortedExams.length > 0 ? (
        <div className="exam-countdowns">
          {sortedExams.map((exam) => {
            const days = daysUntil(exam.date);
            return (
              <article className={`exam-countdown ${days <= 7 && days >= 0 ? 'is-soon' : ''}`} key={exam.id}>
                <div className="exam-countdown-copy">
                  <strong>{exam.title}</strong>
                  <span>{toLocalDate(exam.date)?.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="exam-countdown-side">
                  <b>{countdownLabel(days)}</b>
                  <button type="button" onClick={() => removeExam(exam.id)} aria-label={`Remove ${exam.title}`}>×</button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="exam-empty-state">Add an exam or deadline to turn your study time into a clear plan.</p>
      )}

      <div className="exam-calendar" aria-label={`${calendar.view.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} calendar`}>
        <div className="exam-calendar-header">
          <button type="button" onClick={() => setMonthOffset((value) => value - 1)} aria-label="Previous month">‹</button>
          <strong>{calendar.view.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong>
          <button type="button" onClick={() => setMonthOffset((value) => value + 1)} aria-label="Next month">›</button>
        </div>
        <div className="exam-calendar-grid">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <span className="exam-weekday" key={`${day}-${index}`}>{day}</span>)}
          {calendar.cells.map((cell, index) => {
            if (!cell) return <span className="exam-calendar-day is-empty" key={`empty-${index}`} />;
            const key = dateKey(cell);
            const exam = exams.find((item) => item.date === key);
            const isToday = key === dateKey(new Date());
            const isSelected = key === date;
            return (
              <button
                type="button"
                key={key}
                title={exam?.title || 'Select date'}
                onClick={() => setDate(key)}
                className={`exam-calendar-day ${isToday ? 'is-today' : ''} ${exam ? 'has-exam' : ''} ${isSelected ? 'is-selected' : ''}`}
                style={{ cursor: 'pointer', border: 'none', background: isSelected ? 'var(--accent)' : 'transparent', color: isSelected ? '#fff' : 'inherit' }}
              >
                {cell.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ExamPlanner;
