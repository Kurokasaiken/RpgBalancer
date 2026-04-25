/**
 * Food HUD Component
 * 
 * Displays current food status with warning indicators and days remaining.
 * Uses GPU-optimized animations for smooth transitions.
 * 
 * @module FoodHUD
 */

import React, { useMemo } from 'react';
import type { JSX } from 'react';
import type { FoodState } from '../../../balancing/config/idleVillage/types/survivalTypes';
import { getWarningColor } from '../../../balancing/config/idleVillage/survivalConfig';
import { getFoodPercentage } from '../../../engine/game/idleVillage/SurvivalEngine';

/**
 * Props for FoodHUD component
 */
export interface FoodHUDProps {
  /** Current food state */
  foodState: FoodState;
  /** Days remaining until starvation */
  daysRemaining: number;
  /** Warning message */
  warningMessage?: string;
  /** Whether to show compact view */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Food HUD Component
 * 
 * Displays:
 * - Current food amount with progress bar
 * - Days remaining indicator
 * - Warning level with color coding
 * - Max food capacity
 * 
 * Uses GPU-optimized CSS (transform/opacity only) for animations.
 */
export function FoodHUD({
  foodState,
  daysRemaining,
  warningMessage,
  compact = false,
  className = '',
}: FoodHUDProps): JSX.Element {
  const percentage = useMemo(
    () => getFoodPercentage(foodState.currentFood, foodState.maxFood),
    [foodState.currentFood, foodState.maxFood]
  );

  const warningColor = useMemo(
    () => getWarningColor(foodState.warningLevel),
    [foodState.warningLevel]
  );

  const daysRemainingDisplay = useMemo(() => {
    if (!isFinite(daysRemaining)) {
      return '∞';
    }
    return Math.floor(daysRemaining).toString();
  }, [daysRemaining]);

  return (
    <div
      className={`food-hud ${className}`}
      style={{
        padding: compact ? '8px 12px' : '12px 16px',
        backgroundColor: 'rgba(15, 26, 29, 0.95)',
        borderRadius: '8px',
        border: `2px solid ${warningColor}`,
        minWidth: compact ? '200px' : '280px',
        backdropFilter: 'blur(8px)',
        transition: 'border-color 0.3s ease',
      }}
      role="status"
      aria-label="Food status display"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              fontSize: compact ? '18px' : '24px',
            }}
            role="img"
            aria-label="Food icon"
          >
            🍖
          </span>
          <span
            style={{
              fontSize: compact ? '13px' : '14px',
              fontWeight: 600,
              color: 'rgb(240, 239, 228)',
            }}
          >
            Food
          </span>
        </div>
        <span
          style={{
            fontSize: compact ? '12px' : '14px',
            fontWeight: 600,
            color: warningColor,
          }}
        >
          {Math.floor(foodState.currentFood)}/{foodState.maxFood}
        </span>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          height: compact ? '8px' : '12px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '6px',
          overflow: 'hidden',
          marginBottom: '8px',
          position: 'relative',
        }}
        role="progressbar"
        aria-valuenow={Math.floor(percentage * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Progress fill - GPU optimized with transform */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
            backgroundColor: warningColor,
            transform: `scaleX(${percentage})`,
            transformOrigin: 'left',
            transition: 'transform 0.3s ease, background-color 0.3s ease',
            willChange: 'transform',
          }}
        />
        
        {/* Shine effect - GPU optimized */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
            transform: `translateX(${percentage * 100 - 100}%)`,
            transition: 'transform 0.3s ease',
            willChange: 'transform',
          }}
        />
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: compact ? '11px' : '12px',
        }}
      >
        {/* Days Remaining */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: warningColor,
          }}
        >
          <span role="img" aria-label="Calendar">
            📅
          </span>
          <span style={{ fontWeight: 600 }}>
            {daysRemainingDisplay} {daysRemainingDisplay === '1' ? 'day' : 'days'}
          </span>
        </div>

        {/* Warning Level Badge */}
        <div
          style={{
            padding: '2px 8px',
            backgroundColor: warningColor,
            color: '#050509',
            borderRadius: '4px',
            fontSize: compact ? '9px' : '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {foodState.warningLevel}
        </div>
      </div>

      {/* Warning Message */}
      {warningMessage && foodState.warningLevel !== 'safe' && (
        <div
          style={{
            marginTop: '8px',
            padding: '6px 8px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
            fontSize: compact ? '10px' : '11px',
            color: warningColor,
            lineHeight: 1.3,
            // Pulse animation for critical warnings - GPU optimized
            animation: foodState.warningLevel === 'critical' 
              ? 'food-hud-pulse 2s ease-in-out infinite' 
              : 'none',
          }}
        >
          {warningMessage}
        </div>
      )}

      {/* CSS Keyframes for pulse animation */}
      <style>{`
        @keyframes food-hud-pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.02);
          }
        }
      `}</style>
    </div>
  );
}

export default FoodHUD;
