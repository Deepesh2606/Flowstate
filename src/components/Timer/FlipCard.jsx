import React, { useState, useEffect, useRef } from 'react';

/**
 * A realistic retro-modern 3D flip card for flip clock display.
 * Uses 3D transform perspective and top/bottom split cards.
 */
const FlipCard = ({ value, label }) => {
  const [currentVal, setCurrentVal] = useState(value);
  const [prevVal, setPrevVal] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value !== prevRef.current) {
      setPrevVal(prevRef.current);
      setCurrentVal(value);
      setIsFlipping(true);
      prevRef.current = value;

      const timer = setTimeout(() => {
        setIsFlipping(false);
        setPrevVal(value);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [value]);

  const displayCurrent = String(currentVal).padStart(2, '0');
  const displayPrev = String(prevVal).padStart(2, '0');

  return (
    <div className="flip-card-unit">
      <div className={`flip-card-wrapper ${isFlipping ? 'flipping' : ''}`}>
        {/* Upper Static Flap (shows current value) */}
        <div className="flip-flap flip-top-static">
          <span>{displayCurrent}</span>
        </div>

        {/* Lower Static Flap (shows previous value during flip, current value when idle) */}
        <div className="flip-flap flip-bottom-static">
          <span>{isFlipping ? displayPrev : displayCurrent}</span>
        </div>

        {/* Animated Upper Leaf (flips down from 0 to -90 deg during first half) */}
        <div className="flip-flap flip-leaf-top">
          <span>{displayPrev}</span>
        </div>

        {/* Animated Lower Leaf (flips down from 90 to 0 deg during second half) */}
        <div className="flip-flap flip-leaf-bottom">
          <span>{displayCurrent}</span>
        </div>

        {/* Horizontal Seam / Groove Divider */}
        <div className="flip-divider-seam" />
      </div>
      {label && <div className="flip-card-label">{label}</div>}
    </div>
  );
};

export default FlipCard;
