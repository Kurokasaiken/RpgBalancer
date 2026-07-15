import type { CSSProperties } from 'react';
import React from 'react';
import { useMatericSkin } from '../MatericSkinContext';
import { MATERIC_SKIN_CONFIG } from '../matericSkinConfig';

/* ════════════════════════════════════════════════════════════════════════
 *  WANDERLUST STAT BAR
 *
 *  Material-style stat bar for HP, stamina, fatigue.
 *  - Carved track with inset shadow (physical depth)
 *  - Gradient fill with specular highlight (not flat)
 *  - Label + value on sides (horizontal WanderlustField style)
 *  - GPU-only animations (transform + opacity)
 * ════════════════════════════════════════════════════════════════════════ */

export type StatBarVariant = 'hp' | 'stamina' | 'fatigue';
export type StatBarSize = 'sm' | 'md' | 'lg';

export interface WanderlustStatBarProps {
  label: string;
  value: number;
  maxValue: number;
  variant?: StatBarVariant;
  size?: StatBarSize;
  showValue?: boolean;
  className?: string;
  style?: CSSProperties;
}

// Color variants — now read from skin tokens with fallback to hardcoded defaults
const VARIANT_COLORS: Record<StatBarVariant, { start: string; end: string; shadow: string }> = {
  hp: {
    start: 'var(--skin-statbar-hp-start, #0a8a4a)',
    end: 'var(--skin-statbar-hp-end, #6ee7b7)',
    shadow: 'var(--skin-statbar-hp-glow, rgba(110,231,183,0.45))',
  },
  stamina: {
    start: 'var(--skin-statbar-stamina-start, #d4af37)',
    end: 'var(--skin-statbar-stamina-end, #f59e0b)',
    shadow: 'var(--skin-statbar-stamina-glow, rgba(245,158,11,0.45))',
  },
  fatigue: {
    start: 'var(--skin-statbar-fatigue-start, #9e5a4a)',
    end: 'var(--skin-statbar-fatigue-end, #d98a4a)',
    shadow: 'var(--skin-statbar-fatigue-glow, rgba(217,138,74,0.6))',
  },
};

// Size configurations
const SIZE_CONFIG: Record<StatBarSize, { height: string; labelSize: string; valueSize: string }> = {
  sm: { height: '6px', labelSize: '9px', valueSize: '9px' },
  md: { height: '8px', labelSize: '10px', valueSize: '10px' },
  lg: { height: '12px', labelSize: '11px', valueSize: '11px' },
};

// Wanderlust typography tokens
const FONT = {
  display: 'var(--wl-font-display, "Cinzel", "Trajan Pro", serif)',
  serif: 'var(--wl-font-serif, "EB Garamond", Georgia, serif)',
  sans: 'var(--wl-font-sans, system-ui, sans-serif)',
} as const;

const COLOR = {
  labelPrimary: 'var(--skin-label-primary, #c9a84e)',
  labelTertiary: 'var(--skin-label-tertiary, #9a8246)',
  body: 'var(--skin-body-color, rgba(237,224,196,0.92))',
} as const;

// Engraving shadows for text
const ENGRAVE = {
  thin: '0 1px 2px rgba(0,0,0,0.7)',
  faint: '0 1px 1px rgba(0,0,0,0.5)',
} as const;

export const WanderlustStatBar: React.FC<WanderlustStatBarProps> = ({
  label,
  value,
  maxValue,
  variant = 'hp',
  size = 'md',
  showValue = true,
  className,
  style,
}) => {
  const percent = maxValue > 0 ? Math.max(0, Math.min(100, (value / maxValue) * 100)) : 0;
  const colors = VARIANT_COLORS[variant];
  const sizeConfig = SIZE_CONFIG[size];
  const isMateric = useMatericSkin();

  const containerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    ...style,
  };

  const labelStyle: CSSProperties = {
    fontFamily: FONT.sans,
    fontSize: sizeConfig.labelSize,
    fontWeight: 600,
    letterSpacing: '0.3em',
    textTransform: 'uppercase',
    color: COLOR.labelPrimary,
    whiteSpace: 'nowrap',
    textShadow: ENGRAVE.thin,
    minWidth: '24px',
  };

  const trackStyle: CSSProperties = isMateric
    ? {
        flex: 1,
        height: sizeConfig.height,
        position: 'relative',
        backgroundColor: MATERIC_SKIN_CONFIG.track.backgroundColor,
        backgroundImage: MATERIC_SKIN_CONFIG.track.backgroundImage,
        backgroundBlendMode: MATERIC_SKIN_CONFIG.track.backgroundBlendMode,
        backgroundRepeat: MATERIC_SKIN_CONFIG.track.backgroundRepeat,
        backgroundSize: MATERIC_SKIN_CONFIG.track.backgroundSize,
        border: MATERIC_SKIN_CONFIG.track.border,
        borderRadius: MATERIC_SKIN_CONFIG.track.borderRadius,
        boxShadow: MATERIC_SKIN_CONFIG.track.boxShadow,
        overflow: 'hidden',
      }
    : {
        flex: 1,
        height: sizeConfig.height,
        position: 'relative',
        background: 'var(--skin-statbar-track, linear-gradient(180deg, #0c0b0a, #050505))',
        border: '1px solid var(--skin-statbar-track-border, rgba(216,177,62,0.08))',
        borderRadius: '6px',
        boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.85), inset 0 1px 0 rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.03)',
        overflow: 'hidden',
      };

  const fillConfig = MATERIC_SKIN_CONFIG[variant === 'hp' ? 'hpFill' : variant === 'stamina' ? 'staminaFill' : 'fatigueFill'];

  const fillStyle: CSSProperties = isMateric
    ? {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: `${percent}%`,
        backgroundImage: fillConfig.backgroundImage,
        backgroundSize: fillConfig.backgroundSize,
        backgroundBlendMode: fillConfig.backgroundBlendMode,
        borderRadius: fillConfig.borderRadius,
        boxShadow: fillConfig.boxShadow,
        transition: 'width 280ms cubic-bezier(0.34,1.56,0.64,1)',
        willChange: 'width',
      }
    : {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: `${percent}%`,
        background: `linear-gradient(90deg, ${colors.start}, ${colors.end})`,
        borderRadius: '5px',
        boxShadow: `inset 0 0 0 0.5px color-mix(in srgb, var(--skin-icon-color, #dfb857) 85%, transparent), 0 0 8px rgba(0,0,0,0.35), 0 0 6px ${colors.shadow}`,
        transition: 'width 280ms cubic-bezier(0.34,1.56,0.64,1)',
        willChange: 'width',
      };

  const valueStyle: CSSProperties = {
    fontFamily: FONT.sans,
    fontSize: sizeConfig.valueSize,
    fontWeight: 600,
    letterSpacing: '0.04em',
    color: COLOR.body,
    textShadow: ENGRAVE.faint,
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
    minWidth: '40px',
    textAlign: 'right',
  };

  // Add specular highlight (liquid-gem / resin glossy top sheen)
  const fillHighlightStyle: CSSProperties = isMateric
    ? {
        position: 'absolute',
        inset: '0 0 50% 0',
        borderRadius: MATERIC_SKIN_CONFIG.fillHighlight.borderRadius,
        backgroundImage: MATERIC_SKIN_CONFIG.fillHighlight.backgroundImage,
        pointerEvents: 'none',
      }
    : {
        position: 'absolute',
        inset: '0 0 50% 0',
        borderRadius: '5px 5px 0 0',
        background: 'radial-gradient(ellipse 70% 55% at 50% 0%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 45%, transparent 70%), linear-gradient(180deg, rgba(255,255,255,0.22), transparent)',
        pointerEvents: 'none',
      };

  return (
    <div className={className} style={containerStyle}>
      <span style={labelStyle}>{label}</span>
      <div style={trackStyle}>
        <div style={fillStyle}>
          <div style={fillHighlightStyle} />
        </div>
      </div>
      {showValue && (
        <span style={valueStyle}>
          {value}/{maxValue}
        </span>
      )}
    </div>
  );
};

export default WanderlustStatBar;
