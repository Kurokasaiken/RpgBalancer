/**
 * Gold Button Component
 *
 * Interactive button component extracted from Physics Lab.
 * Provides tactile feedback with squash animation and physics-based effects.
 */

import React, { useState } from 'react';
import { type PhysicsPreset } from '@/ui/styleLab/config/physicsPresets';

export interface GoldButtonProps {
  /** Current physics preset configuration */
  config: PhysicsPreset;
  /** Optional className for styling */
  className?: string;
  /** Button text */
  children: React.ReactNode;
  /** Button click handler */
  onClick?: () => void;
  /** Button variant */
  variant?: 'primary' | 'secondary';
  /** Icon to display before text */
  icon?: string;
}

/**
 * Interactive gold button component with physics-based squash animation.
 * Provides tactile feedback based on physics preset configuration.
 */
export const GoldButton: React.FC<GoldButtonProps> = ({
  config,
  className = '',
  children,
  onClick,
  variant = 'primary',
  icon,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
    onClick?.();
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
  };

  const squashScale = isPressed ? config.buttonSquash : 1;
  const primaryGradient = 'linear-gradient(155deg, #786000 0%, #a08020 42%, #786000 100%)';
  const secondaryGradient = 'linear-gradient(155deg, #0b0f0e 0%, #141d18 42%, #0b0f0e 100%)';

  return (
    <button
      className={`gold-button ${variant} ${isPressed ? 'pressed' : ''} ${className}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '7px',
        padding: '10px 22px',
        fontFamily: '"Cinzel", serif',
        fontSize: '9px',
        fontWeight: '700',
        letterSpacing: '0.28em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        border: 'none',
        borderRadius: '3px',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
        transform: `scale(${squashScale})`,
        transition: `transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s, filter 0.18s`,
        background: variant === 'primary' ? primaryGradient : secondaryGradient,
        color: variant === 'primary' ? '#03040a' : '#f5edd8',
        boxShadow: variant === 'primary'
          ? '0 4px 12px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,1), 0 0 0 1px rgba(200,160,48,0.3), inset 0 2px 0 rgba(255,255,255,0.1), inset 0 -2px 0 rgba(0,0,0,0.9)'
          : '0 4px 12px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,1), 0 0 0 1px rgba(68,196,112,0.3), inset 0 2px 0 rgba(255,255,255,0.05), inset 0 -2px 0 rgba(0,0,0,0.9)',
        borderColor: variant === 'primary' ? '#c8a030' : '#44c470',
        borderWidth: '1px',
        borderStyle: 'solid',
      }}
    >
      {/* Shimmer Effect */}
      <div
        className="button-shimmer"
        style={{
          position: 'absolute',
          top: '0',
          left: isPressed ? '160%' : '-110%',
          width: '55%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          transform: 'skewX(-18deg)',
          pointerEvents: 'none',
          transition: isPressed ? 'left 0s' : 'left 0.48s ease',
        }}
      />

      {/* Icon */}
      {icon && <span>{icon}</span>}
      
      {/* Button Text */}
      <span>{children}</span>
    </button>
  );
};
