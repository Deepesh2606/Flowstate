import React, { useState, useEffect, useCallback } from 'react';
import { streamGeminiResponse } from '../../utils/aiChat';

const DEFAULT_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_KEY_STORAGE = 'fmood_gemini_key';
const getApiKey = () => localStorage.getItem(GEMINI_KEY_STORAGE) || DEFAULT_API_KEY;

export const ActiveRecallModal = ({ isOpen, onClose, notes = '', subject = '' }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [ratings, setRatings] = useState({}); // { [index]: 'mastered' | 'review' }
  const [isFinished, setIsFinished] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsFlipped(false);
    setCurrentIndex(0);
    setRatings({});
    setIsFinished(false);

    const apiKey = getApiKey();
    if (!apiKey) {
      setError('MISSING_KEY');
      setLoading(false);
      return;
    }

    const notesContent = notes?.trim()
      ? `Student's study notes:\n${notes.trim()}`
      : `No notes provided. The student is focusing on "${subject || 'General Study'}".`;

    const prompt = `You are a cognitive science tutor specializing in active recall and spaced repetition.
Based on the provided information, generate EXACTLY 3 high-yield question and answer flashcards that test the most essential concepts.

Subject: ${subject || 'General Study'}
${notesContent}

Output STRICTLY as a raw JSON array of 3 objects with keys "question" and "answer". Do NOT include any markdown code fences, backticks, or other text:
[
  {"question": "...", "answer": "..."},
  {"question": "...", "answer": "..."},
  {"question": "...", "answer": "..."}
]`;

    let fullText = '';

    streamGeminiResponse(
      [{ role: 'user', content: prompt }],
      apiKey,
      (chunk) => {
        fullText += chunk;
      },
      () => {
        try {
          // Clean up potential markdown formatting like ```json
          let cleaned = fullText.trim();
          if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');
          }
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFlashcards(parsed.slice(0, 3));
          } else {
            throw new Error('Invalid format');
          }
        } catch {
          // Fallback if parsing failed
          setFlashcards([
            {
              question: subject ? `What are the core foundational principles of ${subject}?` : 'What was the primary goal of your study session?',
              answer: notes?.trim() ? notes.slice(0, 120) + '...' : 'Review your session notes to reinforce core understanding.',
            },
            {
              question: 'How would you explain the hardest concept you encountered in simple terms?',
              answer: 'The Feynman Technique: if you can explain it simply to a beginner, you truly understand it.',
            },
            {
              question: 'What is one practical application or example of what you just studied?',
              answer: 'Connecting abstract concepts to real-world examples creates durable mental anchors.',
            },
          ]);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Active recall generation error:', err);
        setError(err.message || 'Failed to generate flashcards');
        setLoading(false);
      }
    );
  }, [notes, subject]);

  useEffect(() => {
    if (isOpen) {
      generateCards();
    }
  }, [isOpen, generateCards]);

  if (!isOpen) return null;

  const currentCard = flashcards[currentIndex];

  const handleRate = (type) => {
    const nextRatings = { ...ratings, [currentIndex]: type };
    setRatings(nextRatings);
    setIsFlipped(false);

    if (currentIndex + 1 < flashcards.length) {
      setTimeout(() => setCurrentIndex(c => c + 1), 180);
    } else {
      setTimeout(() => setIsFinished(true), 250);
    }
  };

  const handleCopyAll = async () => {
    try {
      const text = flashcards
        .map((c, i) => `Q${i + 1}: ${c.question}\nA: ${c.answer}`)
        .join('\n\n');
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const masteredCount = Object.values(ratings).filter(r => r === 'mastered').length;

  return (
    <div className="active-recall-overlay" role="dialog" aria-modal="true" aria-label="Active recall flashcards">
      <div className="active-recall-card">
        {/* Header */}
        <div className="active-recall-header">
          <div className="active-recall-title-group">
            <span className="active-recall-icon">⚡</span>
            <div>
              <div className="active-recall-title">Instant Active Recall</div>
              <div className="active-recall-sub">
                {subject ? `${subject} · ` : ''}3 High-Yield Flashcards
              </div>
            </div>
          </div>
          <button
            type="button"
            className="active-recall-close"
            onClick={onClose}
            aria-label="Close active recall"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="active-recall-body">
          {loading && (
            <div className="active-recall-loading">
              <div className="active-recall-spinner" />
              <div className="active-recall-loading-text">
                Analyzing session notes & crafting 3 recall questions...
              </div>
              <div className="active-recall-loading-sub">
                Powered by Gemini AI · Active Recall improves memory by up to 300%
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="active-recall-error">
              <span style={{ fontSize: '32px' }}>🔑</span>
              <div style={{ fontWeight: 600, color: '#fff', marginTop: '8px' }}>
                {error === 'MISSING_KEY' ? 'Gemini API Key Needed' : 'Could not generate flashcards'}
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', maxWidth: '320px', margin: '6px auto 16px' }}>
                {error === 'MISSING_KEY'
                  ? 'Add your free Gemini API key in the Ask AI sidebar (bottom left) to unlock instant flashcards.'
                  : 'Check your internet connection or try again.'}
              </p>
              <button
                type="button"
                className="active-recall-btn-retry"
                onClick={generateCards}
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && !isFinished && currentCard && (
            <div className="active-recall-flashcard-stage">
              {/* Progress Indicator */}
              <div className="active-recall-progress-bar">
                {flashcards.map((_, i) => (
                  <div
                    key={i}
                    className={`active-recall-step ${i === currentIndex ? 'current' : i < currentIndex ? 'completed' : ''}`}
                  />
                ))}
              </div>

              {/* 3D Flip Card */}
              <div
                className={`active-recall-flip-container ${isFlipped ? 'flipped' : ''}`}
                onClick={() => setIsFlipped(v => !v)}
              >
                <div className="active-recall-flipper">
                  {/* FRONT: Question */}
                  <div className="active-recall-card-face active-recall-front">
                    <span className="active-recall-face-badge">Question {currentIndex + 1} of 3</span>
                    <div className="active-recall-question-text">{currentCard.question}</div>
                    <div className="active-recall-flip-hint">
                      <span>Tap to reveal answer 🔄</span>
                    </div>
                  </div>

                  {/* BACK: Answer */}
                  <div className="active-recall-card-face active-recall-back">
                    <span className="active-recall-face-badge answer-badge">Answer</span>
                    <div className="active-recall-answer-text">{currentCard.answer}</div>
                    <div className="active-recall-flip-hint">
                      <span>Tap to view question 🔄</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Self-Rating Controls (Shown when card is flipped) */}
              <div className="active-recall-controls">
                {!isFlipped ? (
                  <button
                    type="button"
                    className="active-recall-action-btn flip-btn"
                    onClick={() => setIsFlipped(true)}
                  >
                    Reveal Answer
                  </button>
                ) : (
                  <div className="active-recall-rating-row">
                    <button
                      type="button"
                      className="active-recall-action-btn review-btn"
                      onClick={() => handleRate('review')}
                    >
                      🔁 Needs Review
                    </button>
                    <button
                      type="button"
                      className="active-recall-action-btn mastered-btn"
                      onClick={() => handleRate('mastered')}
                    >
                      ✅ Got It!
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Finished Screen */}
          {!loading && !error && isFinished && (
            <div className="active-recall-finished">
              <span className="active-recall-trophy">
                {masteredCount === 3 ? '🏆' : masteredCount >= 2 ? '🎯' : '💪'}
              </span>
              <div className="active-recall-finish-title">Recall Complete!</div>
              <div className="active-recall-score-pill">
                <strong>{masteredCount} of 3</strong> cards mastered
              </div>
              <p className="active-recall-finish-quote">
                "Testing yourself immediately after a study block cements knowledge into long-term memory."
              </p>

              <div className="active-recall-finish-actions">
                <button
                  type="button"
                  className="active-recall-btn-copy"
                  onClick={handleCopyAll}
                >
                  {copied ? 'Copied!' : 'Copy 3 Flashcards'}
                </button>
                <button
                  type="button"
                  className="active-recall-btn-again"
                  onClick={() => {
                    setCurrentIndex(0);
                    setIsFlipped(false);
                    setRatings({});
                    setIsFinished(false);
                  }}
                >
                  Review Again
                </button>
                <button
                  type="button"
                  className="active-recall-btn-done"
                  onClick={onClose}
                >
                  Done (Take Break ☕)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiveRecallModal;
