import React, { useState, useEffect, useRef, useCallback } from 'react';

const QUOTES = [
  // ── Psychology & Cognitive Science ──
  { text: "Between stimulus and response there is a space. In that space is our power to choose our response.", author: "Viktor E. Frankl", tag: "Psychology" },
  { text: "Until you make the unconscious conscious, it will direct your life and you will call it fate.", author: "Carl Jung", tag: "Psychology" },
  { text: "The curious paradox is that when I accept myself just as I am, then I can change.", author: "Carl Rogers", tag: "Psychology" },
  { text: "The greatest weapon against stress is our ability to choose one thought over another.", author: "William James", tag: "Psychology" },
  { text: "We can be blind to the obvious, and we are also blind to our blindness.", author: "Daniel Kahneman", tag: "Cognitive Science" },
  { text: "The view you adopt for yourself profoundly affects the way you lead your life.", author: "Carol S. Dweck", tag: "Mindset" },
  { text: "Control of consciousness determines the quality of life.", author: "Mihaly Csikszentmihalyi", tag: "Flow State" },
  { text: "In any given moment we have two options: to step forward into growth or step back into safety.", author: "Abraham Maslow", tag: "Psychology" },
  { text: "Self-belief does not ensure success, but self-disbelief assuredly spawns failure.", author: "Albert Bandura", tag: "Psychology" },
  { text: "Enthusiasm is common. Endurance is rare.", author: "Angela Duckworth", tag: "Grit" },
  { text: "Neurons that fire together, wire together. What you practice grows stronger.", author: "Donald Hebb", tag: "Neuroscience" },
  { text: "The mind is divided, like a rider on an elephant; the rider's job is to serve the elephant.", author: "Jonathan Haidt", tag: "Psychology" },
  { text: "Creativity requires the courage to let go of certainties.", author: "Erich Fromm", tag: "Psychology" },
  { text: "Knowing your own darkness is the best method for dealing with the darkness of others.", author: "Carl Jung", tag: "Psychology" },
  { text: "I am not what happened to me, I am what I choose to become.", author: "Carl Jung", tag: "Psychology" },
  { text: "What you resist not only persists, but will grow in size.", author: "Carl Jung", tag: "Psychology" },
  { text: "The feeling of being hurried is not a result of living in modern times, but of trying to control outcomes we cannot.", author: "Oliver Burkeman", tag: "Psychology" },
  { text: "Comparison is the thief of joy.", author: "Theodore Roosevelt", tag: "Mindset" },

  // ── Practical Real-Life Wisdom & Habits ──
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear", tag: "Habits" },
  { text: "Every action you take is a vote for the type of person you wish to become.", author: "James Clear", tag: "Habits" },
  { text: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius", tag: "Stoicism" },
  { text: "We suffer more often in imagination than in reality.", author: "Seneca", tag: "Mindset" },
  { text: "It's not what happens to you, but how you react to it that matters.", author: "Epictetus", tag: "Stoicism" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius", tag: "Resilience" },
  { text: "A fit body, a calm mind, a house full of love. These cannot be bought — they must be earned.", author: "Naval Ravikant", tag: "Life" },
  { text: "Clarity about what matters provides clarity about what does not.", author: "Cal Newport", tag: "Deep Work" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss", tag: "Focus" },
  { text: "Absorb what is useful, discard what is not, add what is uniquely your own.", author: "Bruce Lee", tag: "Wisdom" },
  { text: "Pain plus reflection equals progress.", author: "Ray Dalio", tag: "Growth" },
  { text: "Small disciplines repeated with consistency every day lead to great achievements.", author: "John C. Maxwell", tag: "Consistency" },
  { text: "If it's not a clear 'yes', it's a 'no'.", author: "Derek Sivers", tag: "Decisions" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain", tag: "Action" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", tag: "Perseverance" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt", tag: "Action" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier", tag: "Consistency" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson", tag: "Focus" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn", tag: "Discipline" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein", tag: "Perspective" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James", tag: "Purpose" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche", tag: "Resilience" }
];

const ROTATION_INTERVAL_MS = 30000; // 30 seconds

const MotivationalQuote = ({ enabled = true, isRunning, sessionCount, onSessionStart }) => {
  const [quote, setQuote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [visible, setVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [cycleKey, setCycleKey] = useState(0);
  const prevIsRunning = useRef(isRunning);
  const prevSessionCount = useRef(sessionCount);
  const fadeTimeoutRef = useRef(null);
  const intervalRef = useRef(null);

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
      setCycleKey((k) => k + 1);
      setIsFading(false);
    }, 220);
  }, []);

  // Set up 15-second rotation interval that resets cleanly whenever rotateQuote occurs
  useEffect(() => {
    if (!enabled || !visible) return;

    intervalRef.current = setInterval(() => {
      if (!document.hidden) {
        rotateQuote();
      }
    }, ROTATION_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, visible, rotateQuote, cycleKey]);

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
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!enabled || !visible) return null;

  return (
    <div
      className={`motivational-quote ${isFading ? 'fade-out' : 'fade-in'}`}
      role="complementary"
      aria-live="polite"
    >
      <div className="quote-top-bar">
        {quote.tag && <span className="quote-tag">{quote.tag}</span>}
        <div className="quote-actions">
          <button
            type="button"
            className="quote-action-btn"
            onClick={rotateQuote}
            title="Next quote (changes automatically every 30s)"
            aria-label="Next quote"
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

      <div className="quote-content">
        <p className="quote-text">“{quote.text}”</p>
        <span className="quote-author">— {quote.author}</span>
      </div>

      {/* Subtle 30-second timer progress indicator */}
      <div className="quote-progress-track">
        <div key={cycleKey} className="quote-progress-bar" />
      </div>
    </div>
  );
};

export default MotivationalQuote;
