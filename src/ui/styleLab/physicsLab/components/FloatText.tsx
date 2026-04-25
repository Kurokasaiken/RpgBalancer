/**
 * Float Text Component
 *
 * Floating text animation component extracted from Physics Lab.
 * Provides visual feedback for actions and events.
 */

import React, { useState, useEffect } from 'react';

export interface FloatTextProps {
  /** Text to display */
  text: string;
  /** Starting position */
  x: number;
  /** Starting position */
  y: number;
  /** Optional className for styling */
  className?: string;
  /** Animation duration in milliseconds */
  duration?: number;
  /** Text color */
  color?: string;
  /** Font size */
  fontSize?: string;
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * Floating text component with upward fade animation.
 * Provides visual feedback for actions and events.
 */
export const FloatText: React.FC<FloatTextProps> = ({
  text,
  x,
  y,
  className = '',
  duration = 1000,
  color = '#faeaaa',
  fontSize = '14px',
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [position, setPosition] = useState({ x, y });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  useEffect(() => {
    const animationTimer = setInterval(() => {
      setPosition(prev => ({
        ...prev,
        y: prev.y - 1,
      }));
    }, 16); // ~60fps

    const cleanupTimer = setTimeout(() => {
      clearInterval(animationTimer);
    }, duration);

    return () => {
      clearInterval(animationTimer);
      clearTimeout(cleanupTimer);
    };
  }, [duration]);

  if (!isVisible) return null;

  return (
    <div
      className={`float-text ${className}`}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        color,
        fontSize,
        fontFamily: '"Cinzel", serif',
        fontWeight: '700',
        textShadow: '0 0 10px rgba(200,160,48,0.8)',
        pointerEvents: 'none',
        zIndex: '1000',
        opacity: isVisible ? 1 : 0,
        transform: `translateY(${(y - position.y) * 2}px)`,
        transition: 'opacity 0.3s ease-out',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
};
