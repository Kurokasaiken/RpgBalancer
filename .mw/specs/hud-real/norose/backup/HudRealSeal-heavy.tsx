/**
 * HudRealSeal — verdict seal of PLAN-110 C7: laurel medallion with crossed swords, an empty dark
 * field for the live value (e.g. success chance) and five sockets holding live danger/victory marks.
 * One generated image (build-fullbar-assets.py --square --field); value and marks are code.
 * Rulings: only victory + danger marks (skulls ok), no drop %. A view only.
 */
import { HudTooltip } from '@/ui/idleVillage/components/gameFrame/HudTooltip';
import { SEAL_BAR as G } from './sealGeometry';

const ASSET = '/assets/ui/hud-real/seal/bar.webp';
const C = { value: '#f3ead0', danger: '#e0583f', win: '#f1d88a', off: '#3b4a4a', shadow: '0 1px 2px rgba(3, 26, 30, 0.9)' } as const;

export type SealMark = 'win' | 'danger' | 'off';

function Skull({ color }: { color: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 16 16" aria-hidden="true" style={{ display: 'block' }}>
      <path d="M8 1.5c-3.3 0-5.5 2.2-5.5 5 0 1.8.9 3 2 3.7V13h2v-1.5h3V13h2V10.2c1.1-.7 2-1.9 2-3.7 0-2.8-2.2-5-5.5-5zM5.6 8.6a1.3 1.3 0 110-2.6 1.3 1.3 0 010 2.6zm4.8 0a1.3 1.3 0 110-2.6 1.3 1.3 0 010 2.6z" fill={color} fillRule="evenodd" />
    </svg>
  );
}

export interface HudRealSealProps {
  /** Text in the central field, already formatted (e.g. "68%"). */
  value: string;
  /** One mark per socket (extra marks are dropped, missing ones stay empty). */
  marks?: SealMark[];
  /** Accessible and tooltip description. */
  label: string;
  hint?: string;
}

export function HudRealSeal({ value, marks = [], label, hint }: HudRealSealProps) {
  const f = G.field;
  return (
    <HudTooltip label={label} hint={hint} side="top" wrap>
      <section data-hudreal-seal="" aria-label={`${label}: ${value}`} style={{ position: 'relative', userSelect: 'none', width: G.w, height: G.h }}>
        <img src={ASSET} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
        <div style={{
          position: 'absolute', left: f.x, top: f.y, width: f.w, height: f.h, display: 'grid', placeItems: 'center',
          fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: 32, fontWeight: 600, color: C.value, textShadow: C.shadow, fontVariantNumeric: 'tabular-nums',
        }}>{value}</div>
        {G.slots.map((slot, i) => {
          const m = marks[i];
          if (!m) return null;
          return (
            <div key={i} data-mark={m} style={{ position: 'absolute', left: slot.x, top: slot.y, width: slot.w, height: slot.h, display: 'grid', placeItems: 'center' }}>
              <Skull color={m === 'danger' ? C.danger : m === 'win' ? C.win : C.off} />
            </div>
          );
        })}
      </section>
    </HudTooltip>
  );
}
