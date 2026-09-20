import React, { useState, useEffect, useRef, useCallback } from 'react';

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Lost time is never found again.", author: "Benjamin Franklin" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Concentrate all your thoughts upon the work at hand.", author: "Alexander Graham Bell" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Absorb what is useful, discard what is useless.", author: "Bruce Lee" },
  { text: "What you do today can improve all your tomorrows.", author: "Ralph Marston" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Push yourself because no one else is going to do it for you.", author: "Unknown" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
  { text: "Small steps every day.", author: "Unknown" },
  { text: "You are capable of more than you know.", author: "Unknown" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
  { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "If you want to lift yourself up, lift up someone else.", author: "Booker T. Washington" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Our greatest weakness lies in giving up.", author: "Thomas A. Edison" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "The harder the conflict, the greater the triumph.", author: "George Washington" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
];

const MotivationalQuote = ({ enabled = true, isRunning, sessionCount, onSessionStart }) => {
  const [quote, setQuote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [visible, setVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const prevIsRunning = useRef(isRunning);
  const prevSessionCount = useRef(sessionCount);
  const fadeTimeoutRef = useRef(null);

  // Smoothly rotate to a new quote
  const rotateQuote = useCallback(() => {
    setIsFading(true);
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    fadeTimeoutRef.current = setTimeout(() => {
      setQuote((prev) => {
        let next;
        do {
          next = QUOTES[Math.floor(Math.random() * QUOTES.length)];
        } while (next.text === prev?.text && QUOTES.length > 1);
        return next;
      });
      setIsFading(false);
    }, 250);
  }, []);

  // Handle genuine session start or session count advance
  useEffect(() => {
    const justStarted = !prevIsRunning.current && isRunning;
    const sessionAdvanced = sessionCount !== undefined && sessionCount !== prevSessionCount.current;

    if (justStarted || sessionAdvanced) {
      rotateQuote();
      setVisible(true);
    }
    prevIsRunning.current = isRunning;
    prevSessionCount.current = sessionCount;
  }, [isRunning, sessionCount, rotateQuote]);

  // Handle backwards-compatible onSessionStart if passed without isRunning
  const prevSessionStartProp = useRef(onSessionStart);
  useEffect(() => {
    if (isRunning === undefined && onSessionStart && onSessionStart !== prevSessionStartProp.current) {
      rotateQuote();
      setVisible(true);
    }
    prevSessionStartProp.current = onSessionStart;
  }, [onSessionStart, isRunning, rotateQuote]);

  // Gentle auto-rotation every 90 seconds (does not rush the reader)
  useEffect(() => {
    if (!enabled || !visible) return;
    const interval = setInterval(() => {
      if (!document.hidden) {
        rotateQuote();
      }
    }, 90000);
    return () => clearInterval(interval);
  }, [enabled, visible, rotateQuote]);

  // Initial show on mount
  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return;
    }
    const t = setTimeout(() => setVisible(true), 350);
    return () => clearTimeout(t);
  }, [enabled]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, []);

  if (!enabled || !visible) return null;

  return (
    <div
      className={`motivational-quote ${isFading ? 'fade-out' : 'fade-in'}`}
      role="complementary"
      aria-live="polite"
    >
      <div className="quote-content">
        <span className="quote-text">“{quote.text}”</span>
        <span className="quote-author">— {quote.author}</span>
      </div>
      <div className="quote-actions">
        <button
          type="button"
          className="quote-action-btn"
          onClick={rotateQuote}
          title="New quote"
          aria-label="New quote"
        >
          ↻
        </button>
        <button
          type="button"
          className="quote-action-btn"
          onClick={() => setVisible(false)}
          title="Dismiss quote"
          aria-label="Dismiss quote"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default MotivationalQuote;
