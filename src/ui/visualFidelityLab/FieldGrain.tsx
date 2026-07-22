import React from 'react';

/**
 * FieldGrain — an OPT-IN texture grain overlay for a panel field (2026-07-18).
 *
 * Two versions of the field now coexist in the system by design:
 *   - PLAIN  — the field gradient alone (Forgotten Observatory).
 *   - GRAINED — this overlay on top (New Observatory).
 *
 * A real PNG texture (not procedural feTurbulence) tiled at low opacity: it
 * masks CSS-gradient banding and reads as painted material, not a web gradient.
 * Same recipe the shipped Materic skin uses on the /roster body
 * (matericSkinConfig.ts → grain: bg.png, opacity 0.1, normal blend).
 *
 * Drop it as the first child of a position:relative field; it fills the field,
 * is pointer-transparent, and inherits the field's border radius.
 */
export interface FieldGrainProps {
  /** tiled texture source (default: the shipped UI grain PNG). */
  textureUrl?: string;
  /** overlay opacity — keep it a whisper (default 0.1, as on /roster). */
  opacity?: number;
  /** blend mode against the field below (default 'normal'). */
  mixBlendMode?: React.CSSProperties['mixBlendMode'];
}

export const FieldGrain: React.FC<FieldGrainProps> = ({
  textureUrl = '/assets/ui/bg.png',
  opacity = 0.1,
  mixBlendMode = 'normal',
}) => (
  <div
    aria-hidden
    style={{
      position: 'absolute',
      inset: 0,
      backgroundImage: `url(${textureUrl})`,
      backgroundRepeat: 'repeat',
      backgroundSize: 'auto',
      opacity,
      mixBlendMode,
      pointerEvents: 'none',
      borderRadius: 'inherit',
    }}
  />
);

export default FieldGrain;
