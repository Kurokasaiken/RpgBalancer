/**
 * HudRealCompass — bottom-left compass medallion with readout plaque (PLAN-110 C5).
 * One generated image (scripts/hud-real/build-plate-assets.py): medallion with an engraved star and
 * an empty enamel plaque. The plaque shows two live lines (position, phase of the day) in code.
 * A view only; the caller supplies the strings (D-5: content of the plate still open).
 */
import type { ReactNode } from 'react';
import { COMPASS_PIECE as P } from './compassPieceGeometry';

const ASSET = '/assets/ui/hud-real/compass/piece.webp';
const C = { value: '#f3ead0', shadow: '0 1px 2px rgba(3, 26, 30, 0.9)' } as const;
const GROW = 6;
/* dial centre and radius of the engraved face, as fractions of the piece (measured on the generated image) */
const DIAL = { cx: 0.272, cy: 0.5, r: 0.205 } as const;
const CARDINALS = [{ l: 'N', a: -90 }, { l: 'E', a: 0 }, { l: 'S', a: 90 }, { l: 'W', a: 180 }] as const;

export interface HudRealCompassProps {
  /** First line, e.g. "X: 1248  Y: 832". */
  position: string;
  /** Second line, e.g. the phase of the day. */
  phase?: string;
  phaseIcon?: ReactNode;
}

export function HudRealCompass({ position, phase, phaseIcon }: HudRealCompassProps) {
  const f = P.field;
  return (
    <section data-hudreal-compass="" aria-label={[position, phase].filter(Boolean).join(', ')} style={{ position: 'relative', userSelect: 'none', width: P.w, height: P.h }}>
      <img src={ASSET} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      {CARDINALS.map(({ l, a }) => (
        <span key={l} aria-hidden="true" style={{
          position: 'absolute', left: (DIAL.cx + Math.cos((a * Math.PI) / 180) * DIAL.r * 0.96) * P.w, top: (DIAL.cy + Math.sin((a * Math.PI) / 180) * DIAL.r * 1.8 * 0.96) * P.h,
          transform: 'translate(-50%, -50%)', fontFamily: 'Cinzel, "EB Garamond", serif', fontWeight: 700, fontSize: 13, color: '#f1d88a', textShadow: C.shadow, pointerEvents: 'none',
        }}>{l}</span>
      ))}
      <div style={{
        position: 'absolute', left: f.x + 12, top: f.y - GROW, width: f.w + GROW - 8, height: f.h + GROW * 2, boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1, padding: '0 4px', overflow: 'hidden',
        fontFamily: '"EB Garamond", serif', color: C.value, textShadow: C.shadow, whiteSpace: 'nowrap',
      }}>
        <span style={{ fontSize: 13, lineHeight: '15px', fontVariantNumeric: 'tabular-nums', display: 'block', minWidth: 0, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{position}</span>
        {phase && <span style={{ fontSize: 13, lineHeight: '15px', display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>{phaseIcon}<span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{phase}</span></span>}
      </div>
    </section>
  );
}
