/**
 * SlottedMedalSkin Component
 * 
 * Base visual component for medal rendering without behavior logic.
 * Configurable via skinPreset prop for different visual variations.
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useStyleLabTokens } from '@/ui/styleLab/hooks/useStyleLabTokens';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';

export interface SlottedMedalSkinProps {
  /** Unique medal identifier */
  id: string;
  /** Medal type for visual styling */
  type: 'bronze' | 'silver' | 'gold' | 'platinum';
  /** Whether the medal is currently active in a slot */
  isActive?: boolean;
  /** Skin preset for visual variations */
  skinPreset?: 'minimal' | 'enhanced' | 'ceremonial';
  /** Custom className */
  className?: string;
  /** Data-testid for testing */
  'data-testid'?: string;
  /** Transform style from drag operations */
  transform?: { x: number; y: number } | null;
  /** Drag state */
  isDragging?: boolean;
}

const SlottedMedalSkin = memo<SlottedMedalSkinProps>(({
  id,
  type,
  isActive = false,
  skinPreset = 'minimal',
  className = '',
  'data-testid': testId = 'slotted-medal-skin',
  transform,
  isDragging = false,
}) => {
  const styleLabTokens = useStyleLabTokens();
  const { config: idleConfig } = useIdleVillageConfig();
  
  // Get medal configuration from centralized config
  const medalConfig = idleConfig?.slottedMedal?.medalTypes?.[type] as any;
  
  // Get medal colors from config or fallback to Style Lab tokens
  const getMedalColors = () => {
    if (medalConfig) {
      // Use config colors with Style Lab token resolution
      const resolveColor = (tokenRef: { token: string; fallback: string }) => {
        const tokenValue = styleLabTokens[tokenRef.token as keyof typeof styleLabTokens];
        return (typeof tokenValue === 'string' ? tokenValue : tokenRef.fallback);
      };
      
      return {
        primary: resolveColor(medalConfig.halo.colors[0]),
        secondary: resolveColor(medalConfig.halo.colors[1]),
        shadow: medalConfig.dropShadow,
        glyph: medalConfig.glyph,
      };
    }
    
    // Fallback to predefined colors (Style Lab tokens not yet available for metallic)
    switch (type) {
      case 'bronze':
        return {
          primary: '#CD7F32',
          secondary: '#B87333',
          shadow: 'rgba(205, 127, 50, 0.3)',
          glyph: '🥉',
        };
      case 'silver':
        return {
          primary: '#C0C0C0',
          secondary: '#B8B8B8',
          shadow: 'rgba(192, 192, 192, 0.3)',
          glyph: '🥈',
        };
      case 'gold':
        return {
          primary: '#FFD700',
          secondary: '#FFA500',
          shadow: 'rgba(255, 215, 0, 0.3)',
          glyph: '🥇',
        };
      case 'platinum':
        return {
          primary: '#E5E4E2',
          secondary: '#CCCCCC',
          shadow: 'rgba(229, 228, 226, 0.3)',
          glyph: '💎',
        };
      default:
        return {
          primary: '#CD7F32',
          secondary: '#B87333',
          shadow: 'rgba(205, 127, 50, 0.3)',
          glyph: '🥉',
        };
    }
  };

  const colors = getMedalColors();

  // Base styles with skin preset variations
  const getBaseStyles = () => {
    const base = {
      width: skinPreset === 'enhanced' ? '56px' : skinPreset === 'ceremonial' ? '64px' : '48px',
      height: skinPreset === 'enhanced' ? '56px' : skinPreset === 'ceremonial' ? '64px' : '48px',
      borderRadius: '50%',
      position: 'relative' as const,
      cursor: isDragging ? 'grabbing' : 'grab',
      userSelect: 'none' as const,
      WebkitUserSelect: 'none' as const,
      MozUserSelect: 'none' as const,
      msUserSelect: 'none' as const,
      transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    };

    if (isActive) {
      return {
        ...base,
        boxShadow: `inset 0 2px 8px rgba(0,0,0,0.3), 0 0 20px ${colors.shadow}`,
        transform: `${transform ? `translate(${transform.x}px, ${transform.y}px) ` : ''}scale(0.92) translateY(2px)`,
      };
    }

    return {
      ...base,
      boxShadow: `0 4px 12px ${colors.shadow}`,
    };
  };

  // Animation presets based on skin preset
  const getAnimationProps = () => {
    const baseProps = {
      initial: { scale: 1, opacity: 1 },
      whileHover: { 
        scale: isActive ? 1 : (skinPreset === 'ceremonial' ? 1.08 : 1.05),
        transition: { type: 'spring' as const, stiffness: 400, damping: 25 }
      },
      whileTap: { 
        scale: 0.95,
        transition: { type: 'spring' as const, stiffness: 600, damping: 30 }
      },
    };

    if (skinPreset === 'ceremonial') {
      return {
        ...baseProps,
        whileHover: {
          ...baseProps.whileHover,
          rotate: 5,
        },
      };
    }

    return baseProps;
  };

  return (
    <motion.div
      data-testid={testId}
      className={className}
      style={getBaseStyles()}
      {...getAnimationProps()}
    >
      {/* Medal SVG layers */}
      <svg
        width={skinPreset === 'enhanced' ? '56' : skinPreset === 'ceremonial' ? '64' : '48'}
        height={skinPreset === 'enhanced' ? '56' : skinPreset === 'ceremonial' ? '64' : '48'}
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <defs>
          {/* Medal gradient */}
          <radialGradient id={`medal-gradient-${id}`} cx="40%" cy="30%" r="60%">
            <stop offset="0%" stopColor={colors.secondary} />
            <stop offset="100%" stopColor={colors.primary} />
          </radialGradient>

          {/* Shine effect */}
          <linearGradient id={`medal-shine-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          {/* Enhanced skin additional gradients */}
          {skinPreset === 'enhanced' && (
            <>
              <radialGradient id={`medal-enhance-${id}`} cx="60%" cy="40%" r="40%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
            </>
          )}

          {/* Ceremonial skin additional effects */}
          {skinPreset === 'ceremonial' && (
            <>
              <filter id={`medal-glow-${id}`}>
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/> 
                </feMerge>
              </filter>
            </>
          )}
        </defs>

        {/* Main medal body */}
        <circle
          cx="24"
          cy="24"
          r={skinPreset === 'ceremonial' ? '22' : '20'}
          fill={`url(#medal-gradient-${id})`}
          stroke={colors.primary}
          strokeWidth={skinPreset === 'ceremonial' ? '3' : '2'}
          filter={skinPreset === 'ceremonial' ? `url(#medal-glow-${id})` : undefined}
        />

        {/* Inner ring (enhanced and ceremonial only) */}
        {(skinPreset === 'enhanced' || skinPreset === 'ceremonial') && (
          <circle
            cx="24"
            cy="24"
            r={skinPreset === 'ceremonial' ? '18' : '16'}
            fill="none"
            stroke={colors.secondary}
            strokeWidth="1"
            opacity="0.6"
          />
        )}

        {/* Shine overlay */}
        <circle
          cx="24"
          cy="24"
          r={skinPreset === 'ceremonial' ? '20' : '18'}
          fill={`url(#medal-shine-${id})`}
          opacity={isActive ? 0.3 : 0.6}
        />

        {/* Enhanced skin additional shine */}
        {skinPreset === 'enhanced' && (
          <circle
            cx="24"
            cy="24"
            r="12"
            fill={`url(#medal-enhance-${id})`}
            opacity="0.8"
          />
        )}

        {/* Center emblem */}
        <text
          x="24"
          y="30"
          textAnchor="middle"
          fontSize={skinPreset === 'ceremonial' ? '18' : '16'}
          fontWeight="bold"
          fill={colors.primary}
          style={{ 
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            filter: skinPreset === 'ceremonial' ? `url(#medal-glow-${id})` : undefined,
          }}
        >
          {colors.glyph}
        </text>
      </svg>
    </motion.div>
  );
});

SlottedMedalSkin.displayName = 'SlottedMedalSkin';

export default SlottedMedalSkin;
