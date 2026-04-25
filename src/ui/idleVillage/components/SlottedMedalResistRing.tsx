/**
 * SlottedMedalResistRing Component
 * 
 * Resistance feedback ring that appears when attempting to detach an active medal.
 * Shows visual feedback for the resistance duration and magnetic pull behavior.
 */

import React, { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStyleLabTokens } from '@/ui/styleLab/hooks/useStyleLabTokens';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import type { MedalState } from '@/ui/idleVillage/hooks/useSlottedMedalBehavior';

export interface SlottedMedalResistRingProps {
  /** Whether resistance is currently active */
  isResisting?: boolean;
  /** Medal type for visual styling */
  medalType: 'bronze' | 'silver' | 'gold' | 'platinum';
  /** Resistance progress (0-1) */
  resistanceProgress?: number;
  /** Whether magnetic pull is enabled */
  magneticPullEnabled?: boolean;
  /** Size preset for different contexts */
  sizePreset?: 'small' | 'medium' | 'large';
  /** Show resistance timer */
  showTimer?: boolean;
  /** Resistance duration in milliseconds */
  resistanceDuration?: number;
  /** Medal state from behavior hook */
  medalState?: MedalState;
}

const SlottedMedalResistRing = memo<SlottedMedalResistRingProps>(({
  isResisting = false,
  medalType,
  resistanceProgress = 0,
  magneticPullEnabled = true,
  sizePreset = 'medium',
  showTimer = true,
  resistanceDuration = 1500,
  medalState,
}) => {
  const styleLabTokens = useStyleLabTokens();
  const { config: idleConfig } = useIdleVillageConfig();
  const [timeRemaining, setTimeRemaining] = useState(resistanceDuration);

  // Update timer when resistance is active
  useEffect(() => {
    if (!isResisting) {
      setTimeRemaining(resistanceDuration);
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 100;
        return next <= 0 ? 0 : next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isResisting, resistanceDuration]);

  // Get resistance configuration from centralized config
  const behaviorConfig = idleConfig?.slottedMedal?.behavior as any;
  const magneticElasticity = behaviorConfig?.magneticPull?.elasticity ?? 1.2;

  // Get medal colors for styling
  const getResistColors = () => {
    // Use fallback colors for warning/error (Style Lab tokens not yet available)
    const warningColor = '#ef4444';
    const warningSecondary = '#f59e0b';
    
    switch (medalType) {
      case 'bronze':
        return { primary: '#CD7F32', secondary: '#B87333' };
      case 'silver':
        return { primary: '#C0C0C0', secondary: '#B8B8B8' };
      case 'gold':
        return { primary: '#FFD700', secondary: '#FFA500' };
      case 'platinum':
        return { primary: '#E5E4E2', secondary: '#CCCCCC' };
      default:
        return { primary: '#CD7F32', secondary: '#B87333' };
    }
  };

  const colors = getResistColors();

  // Size configuration based on preset
  const getSizeConfig = () => {
    switch (sizePreset) {
      case 'small':
        return { canvas: 56, radius: 20, strokeWidth: 3 };
      case 'large':
        return { canvas: 88, radius: 32, strokeWidth: 5 };
      default: // medium
        return { canvas: 72, radius: 26, strokeWidth: 4 };
    }
  };

  const sizeConfig = getSizeConfig();

  // Calculate resistance ring properties
  const getRingPath = () => {
    const radius = sizeConfig.radius;
    const progress = resistanceProgress;
    
    // Create arc path based on progress
    const startAngle = -90; // Start from top
    const endAngle = startAngle + (360 * progress);
    
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = 36 + radius * Math.cos(startRad);
    const y1 = 36 + radius * Math.sin(startRad);
    const x2 = 36 + radius * Math.cos(endRad);
    const y2 = 36 + radius * Math.sin(endRad);
    
    const largeArcFlag = progress > 0.5 ? 1 : 0;
    
    return `M ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag},1 ${x2},${y2}`;
  };

  // Magnetic pull visualization
  const getMagneticFieldLines = () => {
    if (!magneticPullEnabled) return [];
    
    const lines = [];
    const lineCount = Math.floor(magneticElasticity * 3);
    
    for (let i = 0; i < lineCount; i++) {
      const angle = (i * 360) / lineCount;
      const rad = (angle * Math.PI) / 180;
      const innerRadius = sizeConfig.radius + 5;
      const outerRadius = sizeConfig.radius + 15;
      
      lines.push({
        x1: 36 + innerRadius * Math.cos(rad),
        y1: 36 + innerRadius * Math.sin(rad),
        x2: 36 + outerRadius * Math.cos(rad),
        y2: 36 + outerRadius * Math.sin(rad),
      });
    }
    
    return lines;
  };

  const magneticLines = getMagneticFieldLines();

  return (
    <AnimatePresence>
      {isResisting && (
        <motion.svg
          width={sizeConfig.canvas}
          height={sizeConfig.canvas}
          viewBox={`0 0 ${sizeConfig.canvas} ${sizeConfig.canvas}`}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          {/* Background ring */}
          <circle
            cx="36"
            cy="36"
            r={sizeConfig.radius}
            fill="none"
            stroke={colors.primary}
            strokeWidth={sizeConfig.strokeWidth}
            opacity={0.2}
          />

          {/* Resistance progress ring */}
          <motion.path
            d={getRingPath()}
            fill="none"
            stroke={colors.secondary}
            strokeWidth={sizeConfig.strokeWidth}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              filter: `drop-shadow(0 0 8px ${colors.secondary})`,
            }}
          />

          {/* Magnetic field lines */}
          <AnimatePresence>
            {magneticPullEnabled && magneticLines.map((line, index) => (
              <motion.line
                key={`magnetic-${index}`}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={colors.primary}
                strokeWidth="2"
                opacity={0.6}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: 1, 
                  opacity: [0, 0.6, 0.6, 0],
                }}
                exit={{ pathLength: 0, opacity: 0 }}
                transition={{
                  duration: 1,
                  delay: index * 0.1,
                  ease: 'easeInOut',
                }}
                style={{
                  filter: `drop-shadow(0 0 4px ${colors.primary})`,
                }}
              />
            ))}
          </AnimatePresence>

          {/* Resistance particles */}
          <AnimatePresence>
            {isResisting && [...Array(8)].map((_, i) => (
              <motion.circle
                key={`particle-${i}`}
                cx={36}
                cy={36}
                r="2"
                fill={colors.secondary}
                initial={{ 
                  scale: 0,
                  x: 0,
                  y: 0,
                  opacity: 0,
                }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i * 45) * Math.PI / 180) * (sizeConfig.radius + 10),
                  y: Math.sin((i * 45) * Math.PI / 180) * (sizeConfig.radius + 10),
                  opacity: [0, 1, 0],
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: 'easeOut',
                }}
              />
            ))}
          </AnimatePresence>

          {/* Timer display */}
          {showTimer && (
            <motion.text
              x="36"
              y="36"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fontWeight="bold"
              fill={colors.secondary}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{
                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                filter: `drop-shadow(0 0 4px ${colors.secondary})`,
              }}
            >
              {Math.ceil(timeRemaining / 1000)}s
            </motion.text>
          )}

          {/* Resistance indicator icon */}
          <motion.g
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              transformOrigin: '36px 36px',
            }}
          >
            <path
              d="M 36,20 L 36,28 M 28,36 L 36,36 M 36,36 L 44,36 M 36,36 L 36,44"
              stroke={colors.primary}
              strokeWidth="3"
              strokeLinecap="round"
              opacity={0.8}
              style={{
                filter: `drop-shadow(0 0 6px ${colors.primary})`,
              }}
            />
          </motion.g>
        </motion.svg>
      )}
    </AnimatePresence>
  );
});

SlottedMedalResistRing.displayName = 'SlottedMedalResistRing';

export default SlottedMedalResistRing;
