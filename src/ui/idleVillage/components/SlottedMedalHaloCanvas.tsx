/**
 * SlottedMedalHaloCanvas Component
 * 
 * Separate component for animated halo effects around medals.
 * Renders different halo styles based on medal state and configuration.
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useStyleLabTokens } from '@/ui/styleLab/hooks/useStyleLabTokens';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import type { MedalState } from '@/ui/idleVillage/hooks/useSlottedMedalBehavior';

export interface SlottedMedalHaloCanvasProps {
  /** Medal state from behavior hook */
  state: MedalState;
  /** Medal type for visual styling */
  medalType: 'bronze' | 'silver' | 'gold' | 'platinum';
  /** Unique medal identifier */
  medalId: string;
  /** Whether to show the halo (hidden for empty state) */
  showHalo?: boolean;
  /** Size preset for different contexts */
  sizePreset?: 'small' | 'medium' | 'large';
  /** Animation intensity level */
  animationLevel?: 'minimal' | 'normal' | 'intense';
}

const SlottedMedalHaloCanvas = memo<SlottedMedalHaloCanvasProps>(({
  state,
  medalType,
  medalId,
  showHalo = true,
  sizePreset = 'medium',
  animationLevel = 'normal',
}) => {
  const styleLabTokens = useStyleLabTokens();
  const { config: idleConfig } = useIdleVillageConfig();
  
  // Don't render halo for empty state or when disabled
  if (state === 'empty' || !showHalo) {
    return null;
  }

  // Get medal configuration for halo styling
  const medalConfig = idleConfig?.slottedMedal?.medalTypes?.[medalType] as any;
  
  // Get halo colors from config or fallback
  const getHaloColors = () => {
    if (medalConfig?.halo?.colors) {
      const resolveColor = (tokenRef: { token: string; fallback: string }) => {
        const tokenValue = styleLabTokens[tokenRef.token as keyof typeof styleLabTokens];
        return (typeof tokenValue === 'string' ? tokenValue : tokenRef.fallback);
      };
      
      return {
        primary: resolveColor(medalConfig.halo.colors[0]),
        secondary: resolveColor(medalConfig.halo.colors[1]),
      };
    }
    
    // Fallback colors
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

  const colors = getHaloColors();

  // Size configuration based on preset
  const getSizeConfig = () => {
    switch (sizePreset) {
      case 'small':
        return { canvas: 48, radius: 12, strokeWidth: 2 };
      case 'large':
        return { canvas: 80, radius: 24, strokeWidth: 4 };
      default: // medium
        return { canvas: 64, radius: 16, strokeWidth: 3 };
    }
  };

  const sizeConfig = getSizeConfig();

  // Get halo width from config or fallback
  const getHaloWidth = (isActive: boolean) => {
    if (medalConfig?.halo) {
      return isActive ? medalConfig.halo.activeWidth : medalConfig.halo.idleWidth;
    }
    return isActive ? 8 : 2;
  };

  // Different halo paths based on state
  const getHaloPath = () => {
    const r = sizeConfig.radius;
    switch (state) {
      case 'idle':
        // Dashed counter-clockwise arc
        return `M ${24 - r},24 A ${r},${r} 0 1,1 ${24 + r},24`;
      case 'active':
        // Continuous clockwise arc
        return `M ${24 - r},24 A ${r},${r} 0 1,0 ${24 + r},24`;
      case 'landing':
        // Pulsing circle
        return `M ${24 - r},24 A ${r},${r} 0 1,1 ${24 - r},23.9`;
      case 'locked':
        // Locked state - broken arc
        return `M ${24 - r},24 A ${r},${r} 0 1,1 ${20},24 M ${28},24 A ${r},${r} 0 1,1 ${24 + r},24`;
      case 'unlocking':
        // Unlocking animation - pulsing circle
        return `M ${24 - r},24 A ${r},${r} 0 1,1 ${24 - r},23.9`;
      default:
        return `M ${24 - r},24 A ${r},${r} 0 1,1 ${24 + r},24`;
    }
  };

  // Halo styling based on state and animation level
  const getHaloStyle = () => {
    const baseWidth = getHaloWidth(state === 'active' || state === 'locked');
    const width = animationLevel === 'intense' ? baseWidth * 1.5 : 
                 animationLevel === 'minimal' ? baseWidth * 0.7 : baseWidth;

    switch (state) {
      case 'idle':
        return {
          stroke: colors.primary,
          strokeWidth: width,
          fill: 'none',
          strokeDasharray: '4 2',
          opacity: 0.6,
          filter: `drop-shadow(0 0 ${width * 2}px ${colors.primary})`,
        };
      case 'active':
        return {
          stroke: colors.primary,
          strokeWidth: width,
          fill: 'none',
          opacity: 1,
          filter: `drop-shadow(0 0 ${width * 3}px ${colors.primary})`,
        };
      case 'landing':
        return {
          stroke: colors.secondary,
          strokeWidth: width,
          fill: 'none',
          opacity: 0.8,
          filter: `drop-shadow(0 0 ${width * 4}px ${colors.secondary})`,
        };
      case 'locked':
        return {
          stroke: colors.primary,
          strokeWidth: width,
          fill: 'none',
          strokeDasharray: '8 4',
          opacity: 0.9,
          filter: `drop-shadow(0 0 ${width * 3}px ${colors.primary})`,
        };
      case 'unlocking':
        return {
          stroke: colors.secondary,
          strokeWidth: width,
          fill: 'none',
          opacity: 1,
          filter: `drop-shadow(0 0 ${width * 4}px ${colors.secondary})`,
        };
      default:
        return {
          stroke: colors.primary,
          strokeWidth: width,
          fill: 'none',
          opacity: 0.6,
        };
    }
  };

  // Animation configuration based on state and level
  const getAnimationConfig = () => {
    const duration = animationLevel === 'intense' ? 2 : 
                    animationLevel === 'minimal' ? 4 : 3;

    switch (state) {
      case 'idle':
        return {
          initial: { opacity: 0, scale: 0.8 },
          animate: { 
            opacity: 0.6, 
            scale: 1,
            rotate: 360,
          },
          transition: { 
            duration: duration * 2,
            repeat: Infinity,
            ease: 'linear' as const,
          },
        };
      case 'active':
        return {
          initial: { opacity: 0, scale: 0.8 },
          animate: { 
            opacity: 1, 
            scale: 1,
            rotate: -360,
          },
          transition: { 
            duration,
            repeat: Infinity,
            ease: 'linear' as const,
          },
        };
      case 'landing':
        return {
          initial: { opacity: 0, scale: 0.5 },
          animate: { 
            opacity: [0.8, 1, 0.8], 
            scale: [1, 1.2, 1],
          },
          transition: { 
            duration: duration / 2,
            repeat: 2,
            ease: 'easeInOut' as const,
          },
        };
      case 'locked':
        return {
          initial: { opacity: 0, scale: 0.8 },
          animate: { 
            opacity: [0.5, 0.9, 0.5], 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          },
          transition: { 
            duration: duration / 3,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          },
        };
      case 'unlocking':
        return {
          initial: { opacity: 0, scale: 0.5 },
          animate: { 
            opacity: 1, 
            scale: 1,
            rotate: 720,
          },
          transition: { 
            duration: duration / 2,
            ease: 'easeOut' as const,
          },
        };
      default:
        return {
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 0.6, scale: 1 },
          transition: { duration },
        };
    }
  };

  const animationConfig = getAnimationConfig();

  return (
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
        zIndex: 1,
      }}
      {...animationConfig}
    >
      {/* Multiple halo layers for depth */}
      {[0, 1].map((layer) => (
        <g key={layer}>
          <path
            d={getHaloPath()}
            {...getHaloStyle()}
            opacity={layer === 0 ? 1 : 0.3}
            scale={layer === 0 ? 1 : 1.2}
          />
          
          {/* Additional glow effects for intense animations */}
          {animationLevel === 'intense' && state === 'active' && (
            <path
              d={getHaloPath()}
              {...getHaloStyle()}
              opacity={0.2}
              scale={1.4}
            />
          )}
        </g>
      ))}
      
      {/* Particle effects for landing state */}
      {state === 'landing' && animationLevel !== 'minimal' && (
        <>
          {[...Array(6)].map((_, i) => (
            <circle
              key={`particle-${i}`}
              cx={24 + Math.cos((i * 60) * Math.PI / 180) * sizeConfig.radius}
              cy={24 + Math.sin((i * 60) * Math.PI / 180) * sizeConfig.radius}
              r="2"
              fill={colors.secondary}
              opacity={0.8}
            >
              <animate
                attributeName="opacity"
                values="0.8;0;0.8"
                dur="1s"
                repeatCount="indefinite"
                begin={`${i * 0.2}s`}
              />
              <animate
                attributeName="r"
                values="2;4;2"
                dur="1s"
                repeatCount="indefinite"
                begin={`${i * 0.2}s`}
              />
            </circle>
          ))}
        </>
      )}
    </motion.svg>
  );
});

SlottedMedalHaloCanvas.displayName = 'SlottedMedalHaloCanvas';

export default SlottedMedalHaloCanvas;
