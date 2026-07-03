import type { CSSProperties } from 'react';
import React from 'react';

/* ════════════════════════════════════════════════════════════════════════
 *  WANDERLUST PORTRAIT
 *
 *  Circular portrait frame with gold border and atmospheric glow.
 *  - Circular frame with gold border (matching roster_wanderlust_reskin.html)
 *  - Radial gradient background (dark bronze)
 *  - Optional image or initials fallback
 *  - Inset shadow for depth
 *  - Outer glow for hero/emissive states
 * ════════════════════════════════════════════════════════════════════════ */

export interface WanderlustPortraitProps {
  portraitUrl?: string;
  initials?: string;
  size?: number;
  isHero?: boolean;
  className?: string;
  style?: CSSProperties;
}

// Wanderlust color tokens (matching roster_wanderlust_reskin.html)
const COLOR = {
  gold: '#d8b13e',
  goldBright: '#f0cf6a',
  label: '#c9a84e',
  labelDim: '#9a8246',
  parchment: '#ede0c4',
} as const;

const FONT = {
  display: 'var(--wl-font-display, "Cinzel", "Trajan Pro", serif)',
} as const;

export const WanderlustPortrait: React.FC<WanderlustPortraitProps> = ({
  portraitUrl,
  initials,
  size = 56,
  isHero = false,
  className,
  style,
}) => {
  const containerStyle: CSSProperties = {
    position: 'relative',
    width: `${size}px`,
    height: `${size}px`,
    flexShrink: 0,
    ...style,
  };

  const frameStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    overflow: 'hidden',
    border: `1.5px solid ${COLOR.gold}`,
    boxShadow: `
      inset 0 1px 4px rgba(0,0,0,0.5),
      0 0 12px rgba(216,177,62,0.2)
    `,
    background: 'radial-gradient(circle at 38% 32%, #2a1810, #0a0503)',
  };

  const heroGlowStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    pointerEvents: 'none',
    boxShadow: isHero
      ? `0 0 16px rgba(216,177,62,0.12), inset 0 0 0 1px rgba(216,177,62,0.25)`
      : 'none',
  };

  const imageStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  const initialsStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: FONT.display,
    fontSize: `${size * 0.32}px`,
    fontWeight: 700,
    color: COLOR.goldBright,
    letterSpacing: '0.03em',
  };

  return (
    <div className={className} style={containerStyle}>
      <div style={frameStyle}>
        {portraitUrl ? (
          <img src={portraitUrl} alt="" style={imageStyle} draggable={false} />
        ) : (
          <div style={initialsStyle}>{initials}</div>
        )}
      </div>
      {isHero && <div style={heroGlowStyle} />}
    </div>
  );
};

export default WanderlustPortrait;
