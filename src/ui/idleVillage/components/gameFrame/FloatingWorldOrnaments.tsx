import type { CSSProperties } from 'react';

/**
 * Placeholder-fidelity floating ornaments — NOT final art. Director asked (2026-09-22)
 * to keep only two details from the boxed-frame mockup ("finestra dentro la finestra",
 * rejected as a composition) while deciding what to actually generate: a glowing orb
 * hung at the map's edge, and a compass-coin. Both render as deliberately unfinished
 * wireframes (dashed rim, low opacity) so nobody mistakes them for shipped art —
 * swap each for a real asset once the Director picks a direction.
 */

const PLACEHOLDER_LABEL_STYLE: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--skin-font-display)',
  fontSize: 8,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.55)',
  pointerEvents: 'none',
};

export interface GlowOrbProps {
  size?: number;
  style?: CSSProperties;
}

/** Placeholder for the "sfera luminosa laterale" — a hung, glowing sphere. */
export function GlowOrb({ size = 56, style }: GlowOrbProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '50%',
        border: '1px dashed rgba(240,207,106,0.45)',
        background:
          'radial-gradient(circle at 38% 32%, rgba(255,244,200,0.35), rgba(240,207,106,0.12) 55%, transparent 78%)',
        boxShadow: '0 0 24px rgba(240,207,106,0.18)',
        ...style,
      }}
    >
      <span style={PLACEHOLDER_LABEL_STYLE}>orb</span>
    </div>
  );
}

export interface CompassCoinProps {
  size?: number;
  style?: CSSProperties;
}

/** Placeholder for the "moneta-bussola" — a coin-sized compass rose. */
export function CompassCoin({ size = 48, style }: CompassCoinProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '50%',
        border: '1px dashed rgba(240,207,106,0.5)',
        background: 'radial-gradient(circle, rgba(20,26,20,0.35), rgba(20,26,20,0.55) 70%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" style={{ opacity: 0.6 }}>
        <polygon points="12,2 15,12 12,22 9,12" fill="rgba(240,207,106,0.55)" />
        <polygon points="2,12 12,9 22,12 12,15" fill="rgba(240,207,106,0.3)" />
      </svg>
      <span style={{ ...PLACEHOLDER_LABEL_STYLE, top: '62%', fontSize: 7 }}>compass</span>
    </div>
  );
}

export interface FloatingWorldOrnamentsProps {
  /** Show the glow orb, hung at the left edge. */
  showOrb?: boolean;
  /** Show the compass coin, resting near the bottom-left. */
  showCompass?: boolean;
}

/**
 * Drop-in slot for `GameFrame`'s `floatingSlot` prop. Absolute-positioned over
 * the map, `pointerEvents: none` so it never blocks map interaction — these are
 * dressing, not controls.
 */
export function FloatingWorldOrnaments({ showOrb = true, showCompass = true }: FloatingWorldOrnamentsProps) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {showOrb && (
        <GlowOrb style={{ position: 'absolute', left: 18, top: '38%', transform: 'translateY(-50%)' }} />
      )}
      {showCompass && <CompassCoin style={{ position: 'absolute', left: 22, bottom: 88 }} />}
    </div>
  );
}

export default FloatingWorldOrnaments;
