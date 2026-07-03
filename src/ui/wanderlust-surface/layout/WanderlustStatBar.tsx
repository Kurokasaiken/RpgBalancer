import type { CSSProperties } from 'react';
import React from 'react';

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

// Color variants for different stat types (matching roster_wanderlust_reskin.html)
const VARIANT_COLORS: Record<StatBarVariant, { start: string; end: string; shadow: string }> = {
  hp: {
    start: '#4a9e5a',
    end: '#7bc96f',
    shadow: 'rgba(123,201,111,0.3)',
  },
  stamina: {
    start: '#b8862a',
    end: '#e0b23e',
    shadow: 'rgba(224,178,62,0.3)',
  },
  fatigue: {
    start: '#9e5a4a',
    end: '#d98a4a',
    shadow: 'rgba(217,138,74,0.6)',
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
  labelPrimary: 'var(--wl-label-primary, #c9a84e)',
  labelTertiary: 'var(--wl-label-tertiary, #9a8246)',
  body: 'var(--wl-text-body, rgba(237,224,196,0.92))',
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

  const trackStyle: CSSProperties = {
    flex: 1,
    height: sizeConfig.height,
    position: 'relative',
    background: 'rgba(6,4,3,0.7)',
    border: '1px solid rgba(216,177,62,0.06)',
    borderRadius: '5px',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(216,177,62,0.06)',
    overflow: 'hidden',
  };

  const fillStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: `${percent}%`,
    background: `linear-gradient(90deg, ${colors.start}, ${colors.end})`,
    boxShadow: `0 0 8px ${colors.shadow}`,
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

  // Add specular highlight (matching roster_wanderlust_reskin.html)
  const fillHighlightStyle: CSSProperties = {
    position: 'absolute',
    inset: '0 0 50% 0',
    borderRadius: '5px 5px 0 0',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.22), transparent)',
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
