/**
 * HudRealSeal — verdict seal of PLAN-110 C7 (v2, light): a thin gold laurel ring (empty teal glass), crossed swords and a
 * big gold figure in code, and below it a strip with five large skulls. Two generated images (build-seal2-assets.py:
 * disc + strip); everything inside is live content. Rulings: only victory + danger marks (skulls ok), no drop %.
 * A view only.
 */
import { HudTooltip } from '@/ui/idleVillage/components/gameFrame/HudTooltip';
import { EngravedIcon } from '@/ui/idleVillage/components/gameFrame/engravedIcons';
import { SEAL2 as G } from './seal2Geometry';

const DISC = '/assets/ui/hud-real/seal/disc.webp';
const STRIP = '/assets/ui/hud-real/seal/strip.webp';
const C = { value: '#f3d98a', sign: '#e8dcb4', danger: '#ee6a52', win: '#e9e3b0', off: '#4a5a5c', shadow: '0 1px 2px rgba(2, 20, 22, 0.95)' } as const;

export type SealMark = 'win' | 'danger' | 'off';

function Skull({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" style={{ display: 'block', filter: 'drop-shadow(0 1px 1px rgba(2, 20, 22, 0.9))' }}>
      <path d="M8 1.2c-3.5 0-5.8 2.3-5.8 5.2 0 1.9 1 3.2 2.2 3.9V13h2.1v-1.6h3V13h2.1V10.3c1.2-.7 2.2-2 2.2-3.9 0-2.9-2.3-5.2-5.8-5.2zM5.5 8.7a1.4 1.4 0 110-2.8 1.4 1.4 0 010 2.8zm5 0a1.4 1.4 0 110-2.8 1.4 1.4 0 010 2.8zM7.2 10.4h1.6l-.8 1.3z" fill={color} fillRule="evenodd" />
    </svg>
  );
}

export interface HudRealSealProps {
  /** Number shown in the disc, already formatted without the sign (e.g. "68"). */
  value: string;
  /** One mark per skull (extra marks are dropped, missing ones stay dim). */
  marks?: SealMark[];
  label: string;
  hint?: string;
  /** 'stack' (default) keeps the PLAN-110 column; 'row' lays disc + skull strip side by side —
   *  the compact probability row that lives INSIDE the panel's free zone (PLAN-112 contract). */
  layout?: 'stack' | 'row';
  /** Row layout height in px (default 96): the probability row must fit the panel's free zone. */
  rowHeight?: number;
}

export function HudRealSeal({ value, marks = [], label, hint, layout = 'stack', rowHeight = 96 }: HudRealSealProps) {
  const d = G.disc;
  const s = G.strip;
  const width = Math.max(d.w, s.w);
  const discLeft = s.offsetX < 0 ? -s.offsetX : 0;
  const stripLeft = s.offsetX < 0 ? 0 : s.offsetX;
  const stripTop = d.h + G.gap;
  const f = s.field;
  const slots = 5;
  const slotW = f.w / slots;
  if (layout === 'row') {
    const H = rowHeight;
    const k = H / d.h;                                    // the disc sets the row height
    const dw = d.w * k, dh = d.h * k;
    const strip = { w: s.w * k, h: s.h * k, y: (dh - s.h * k) / 2 };
    const fs = { x: dw + f.x * k, y: strip.y + f.y * k, w: f.w * k, h: f.h * k };
    return (
      <HudTooltip label={label} hint={hint} side="top" wrap>
        <section data-hudreal-seal="" data-layout="row" aria-label={`${label}: ${value}%`}
          style={{ position: 'relative', userSelect: 'none', width: dw + s.w * k, height: dh }}>
          <img src={DISC} alt="" draggable={false} style={{ position: 'absolute', left: 0, top: 0, width: dw, height: dh, display: 'block' }} />
          <div style={{ position: 'absolute', left: (d.cx - d.r) * k, top: (d.cy - d.r) * k, width: d.r * 2 * k, height: d.r * 2 * k, display: 'grid', gridTemplateRows: 'auto auto', placeContent: 'center', justifyItems: 'center', gap: 0 }}>
            <span style={{ color: C.sign, filter: 'drop-shadow(0 1px 2px rgba(2, 20, 22, 0.9))' }}><EngravedIcon id="evt-combat" size={Math.round(d.r * 0.82 * k)} /></span>
            <span style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontWeight: 600, fontSize: Math.round(d.r * 0.74 * k), lineHeight: 1, color: C.value, textShadow: C.shadow, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'baseline' }}>
              {value}<span style={{ fontSize: Math.round(d.r * 0.3 * k), marginLeft: 2, color: C.sign }}>%</span>
            </span>
          </div>
          <img src={STRIP} alt="" draggable={false} style={{ position: 'absolute', left: dw, top: strip.y, width: strip.w, height: strip.h, display: 'block' }} />
          <div style={{ position: 'absolute', left: fs.x, top: fs.y, width: fs.w, height: fs.h, display: 'flex' }}>
            {Array.from({ length: slots }, (_, i) => {
              const m = marks[i] ?? 'off';
              return (
                <div key={i} data-mark={m} style={{ width: fs.w / slots, height: '100%', display: 'grid', placeItems: 'center' }}>
                  <Skull color={m === 'danger' ? C.danger : m === 'win' ? C.win : C.off} size={Math.min(16, fs.h - 4)} />
                </div>
              );
            })}
          </div>
        </section>
      </HudTooltip>
    );
  }
  return (
    <HudTooltip label={label} hint={hint} side="top" wrap>
      <section data-hudreal-seal="" aria-label={`${label}: ${value}%`} style={{ position: 'relative', userSelect: 'none', width, height: stripTop + s.h }}>
        <img src={DISC} alt="" draggable={false} style={{ position: 'absolute', left: discLeft, top: 0, width: d.w, height: d.h, display: 'block' }} />
        <div style={{ position: 'absolute', left: discLeft + d.cx - d.r, top: d.cy - d.r, width: d.r * 2, height: d.r * 2, display: 'grid', gridTemplateRows: 'auto auto', placeContent: 'center', justifyItems: 'center', gap: 0 }}>
          <span style={{ color: C.sign, filter: 'drop-shadow(0 1px 2px rgba(2, 20, 22, 0.9))' }}><EngravedIcon id="evt-combat" size={Math.round(d.r * 0.82)} /></span>
          <span style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontWeight: 600, fontSize: Math.round(d.r * 0.74), lineHeight: 1, color: C.value, textShadow: C.shadow, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'baseline' }}>
            {value}<span style={{ fontSize: Math.round(d.r * 0.3), marginLeft: 2, color: C.sign }}>%</span>
          </span>
        </div>
        <img src={STRIP} alt="" draggable={false} style={{ position: 'absolute', left: stripLeft, top: stripTop, width: s.w, height: s.h, display: 'block' }} />
        <div style={{ position: 'absolute', left: stripLeft + f.x, top: stripTop + f.y, width: f.w, height: f.h, display: 'flex' }}>
          {Array.from({ length: slots }, (_, i) => {
            const m = marks[i] ?? 'off';
            return (
              <div key={i} data-mark={m} style={{ width: slotW, height: '100%', display: 'grid', placeItems: 'center' }}>
                <Skull color={m === 'danger' ? C.danger : m === 'win' ? C.win : C.off} size={Math.min(26, f.h - 4)} />
              </div>
            );
          })}
        </div>
      </section>
    </HudTooltip>
  );
}
