import React, { useState, useEffect, useRef } from 'react';

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

const MotivationalQuote = ({ enabled, onSessionStart }) => {
  const [quote, setQuote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [visible, setVisible] = useState(false);
  const prevSessionStart = useRef(onSessionStart);

  // Show quote on new session start
  useEffect(() => {
    if (onSessionStart && onSessionStart !== prevSessionStart.current) {
      const next = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      setQuote(next);
      setVisible(true);
    }
    prevSessionStart.current = onSessionStart;
  }, [onSessionStart]);

  // Show on mount after a short delay
  useEffect(() => {
    if (!enabled) { setVisible(false); return; }
    const t = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(t);
  }, [enabled]);

  if (!enabled || !visible) return null;

  return (
    <div className="motivational-quote" role="complementary">
      <span className="quote-text">"{quote.text}"</span>
      <span className="quote-author">— {quote.author}</span>
      <button
        type="button"
        className="quote-dismiss"
        onClick={() => setVisible(false)}
        aria-label="Dismiss quote"
      >×</button>
    </div>
  );
};

export default MotivationalQuote;
