import React from 'react';
import type { CSSProperties, ReactNode } from 'react';

/**
 * CarvedBar — the FIRST extracted material primitive (2026-07-18).
 *
 * One physical construction — a channel carved into the panel — with N semantic
 * ENERGIES flowing inside. The construction never changes; only the fluid does.
 * This is how HP + Stamina (+ Mana…) coexist on one pgCard and stay legible while
 * still reading as the same object.
 *
 * Construction (fixed): COLD azure-black groove when empty (so a warm energy
 * stacks out by temperature + value), gold bottom-lip, and a BRIGHT MENISCUS on
 * the fill-front as the glance-read cue (the #1 job of a bar is instant read).
 *
 * Energy = the semantic material matrix (game-wide law):
 *   hp       → emerald/jade   (life)
 *   stamina  → amber          (vigour / energy)
 *   mana     → amethyst       (arcane — azure stays reserved for ambient)
 *   xp       → molten gold    (progress / knowledge)
 *   danger   → ember          (tension / timer — never beside stamina)
 *   capacity → desaturated bronze (slots — NOT silver; cold grey is banned)
 *
 * PROVING HOME: lives in the lab while we validate it on real consumers. Its
 * shipped home is a Consolidation decision (do not let real components import
 * from the lab long-term).
 */
export type BarEnergy = 'hp' | 'stamina' | 'mana' | 'xp' | 'danger' | 'capacity';

interface EnergyPreset {
  /** vertical fill gradient (top-lit → shaded). */
  fill: string;
  /** bright fill-front line — the read cue. */
  meniscus: string;
  /** warm/cool bloom just ahead of the fill-front. */
  glow: string;
}

/** The energy palette = the semantic material matrix. One place, all bars. */
export const BAR_ENERGY: Record<BarEnergy, EnergyPreset> = {
  hp: {
    fill: 'linear-gradient(180deg, #8fe0a8 0%, #3fa86a 55%, #1f6e42 100%)',
    meniscus: 'rgba(224,255,236,0.9)',
    glow: 'rgba(120,240,170,0.4)',
  },
  stamina: {
    fill: 'linear-gradient(180deg, #ffd98a 0%, #e8a838 55%, #a86e1c 100%)',
    meniscus: 'rgba(255,244,214,0.9)',
    glow: 'rgba(255,190,90,0.4)',
  },
  mana: {
    fill: 'linear-gradient(180deg, #d9b0f2 0%, #9a5fd0 55%, #5f2f9c 100%)',
    meniscus: 'rgba(244,228,255,0.9)',
    glow: 'rgba(190,130,240,0.4)',
  },
  xp: {
    fill: 'linear-gradient(180deg, #f2d485 0%, #d3a63e 55%, #9c6c22 100%)',
    meniscus: 'rgba(255,246,220,0.9)',
    glow: 'rgba(255,214,130,0.45)',
  },
  danger: {
    fill: 'linear-gradient(180deg, #ffb478 0%, #e8551f 55%, #8a2a0c 100%)',
    meniscus: 'rgba(255,224,190,0.9)',
    glow: 'rgba(255,120,50,0.45)',
  },
  capacity: {
    fill: 'linear-gradient(180deg, #c9b48a 0%, #9a8556 55%, #6a5836 100%)',
    meniscus: 'rgba(230,215,185,0.85)',
    glow: 'rgba(180,150,100,0.3)',
  },
};

/** The carved channel — identical for every energy. */
const TRACK: CSSProperties = {
  position: 'relative',
  borderRadius: 2,
  overflow: 'hidden',
  background: 'linear-gradient(180deg, #05101c, #02070f)',
  border: '1px solid rgba(60,110,150,0.12)',
  boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.9), inset 0 -1px 0 rgba(240,207,106,0.18)',
};

export interface CarvedBarProps {
  energy: BarEnergy;
  value: number;
  max: number;
  /** channel height in px (default 13). */
  height?: number;
  /** optional label rendered to the left (e.g. "Survey Completion"). */
  label?: ReactNode;
  /** render the numeric "value/max" to the right (default true). */
  showValue?: boolean;
  className?: string;
  /** applied to the flex wrapper. */
  style?: CSSProperties;
}

export const CarvedBar: React.FC<CarvedBarProps> = ({
  energy, value, max, height = 13, label, showValue = true, className, style,
}) => {
  const e = BAR_ENERGY[energy];
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 10, ...style }}>
      {label != null && (
        <span
          style={{
            fontFamily: 'var(--skin-font-display)',
            fontSize: 10,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--skin-label-primary, #c9a84e)',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      )}
      <div style={{ ...TRACK, flex: 1, height }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${pct}%`,
            borderRadius: '1px 0 0 1px',
            background: e.fill,
            borderRight: `1.5px solid ${e.meniscus}`,
            boxShadow: `inset 0 1px 0 rgba(255,244,214,0.5), inset 0 -2px 3px rgba(0,0,0,0.4), 2px 0 6px ${e.glow}`,
          }}
        />
      </div>
      {showValue && (
        <span
          style={{
            fontFamily: 'var(--skin-font-sans, system-ui)',
            fontSize: 11,
            color: 'var(--skin-body-color)',
            whiteSpace: 'nowrap',
          }}
        >
          {value}/{max}
        </span>
      )}
    </div>
  );
};

export default CarvedBar;
