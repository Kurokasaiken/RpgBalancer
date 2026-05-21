/**
 * HaloProgressComponent
 *
 * Replaces spinning halo with a circular progress bar fill animation.
 * Shows activity timer progress as a filled arc around the medal.
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';

export interface HaloProgressProps {
  /** Progress from 0 to 1 */
  progress: number;
  /** Size of halo in pixels */
  size?: number;
  /** Color of the filled arc */
  color?: string;
  /** Background arc color */
  backgroundColor?: string;
  /** Stroke width of arc */
  strokeWidth?: number;
  /** Whether to show label inside circle */
  showLabel?: boolean;
  /** Label text (e.g., "50%") */
  label?: string;
  /** Medal type for color theming */
  medalType?: 'bronze' | 'silver' | 'gold' | 'platinum';
  /** Data testid */
  'data-testid'?: string;
}

const HaloProgressComponent = memo(({
  progress = 0,
  size = 80,
  color,
  backgroundColor = 'rgba(255, 255, 255, 0.1)',
  strokeWidth = 4,
  showLabel = true,
  label,
  medalType = 'gold',
  'data-testid': testId = 'halo-progress',
}: HaloProgressProps) => {
  // Determine color by medal type if not specified
  const fillColor = color || {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
  }[medalType];

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <motion.div
      data-testid={testId}
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* SVG circular progress bar */}
      <svg
        width={size}
        height={size}
        style={{
          position: 'absolute',
          transform: 'rotate(-90deg)',
        }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />

        {/* Progress arc (animated) */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={fillColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          animate={{
            strokeDashoffset: offset,
          }}
          transition={{
            duration: 0.3,
            ease: 'easeOut',
          }}
        />
      </svg>

      {/* Center label */}
      {showLabel && label && (
        <motion.div
          style={{
            position: 'relative',
            fontSize: Math.max(10, size * 0.3),
            fontWeight: 'bold',
            color: fillColor,
            textAlign: 'center',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {label}
        </motion.div>
      )}
    </motion.div>
  );
});

HaloProgressComponent.displayName = 'HaloProgressComponent';

export default HaloProgressComponent;
