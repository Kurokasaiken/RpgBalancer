/**
 * HudRealResources — resource bar of PLAN-110 C2, built from the generated bar
 * (scripts/hud-real/build-fullbar-assets.py): one graded image with N empty dark-glass
 * slots; each slot hosts a live resource chip. Mockup structure: cap with gem and pendant,
 * three slots, closing filigree corner.
 *
 * Same data contract as the production `ResourceReadout`: `ResourceReadoutItem[]` built
 * by `buildResourceReadoutItems(selectResourceOutlook(...))`. A view only; mechanics untouched.
 * Item i goes in slot i (extra items are not drawn: the bar is generated for the real count).
 * Danger (halo-1): vermilion value + incised hourglass + full filet; trend/detail text goes
 * to the tooltip, never crammed into the slot.
 */
import type { ReactNode } from 'react';
import { HUD_TONE_COLOR } from '@/ui/idleVillage/components/gameFrame/hudTones';
import type { ResourceReadoutItem } from '@/ui/idleVillage/components/gameFrame/ResourceReadout';
import { ZanaraTooltip } from '@/ui/idleVillage/zanara/ZanaraTooltip';
import { RESOURCES_BAR as BAR } from './resourcesBarGeometry';
import { hudPx } from './hudType';

const ASSET = '/assets/ui/hud-real/resources/bar.webp';

const C = {
  value: '#f7efd8',
  label: '#b9d2c4',
  shadow: '0 1px 2px rgba(3, 26, 30, 0.9)',
  emboss: '0 1px 0 rgba(255, 240, 200, 0.16), 0 1px 2px rgba(3, 26, 30, 0.9)',
  focus: '#e8c766',
} as const;
const G = { pad: 7, socket: 36, glyph: 22, gap: 7, valueSize: 19, labelSize: 12 } as const;

const SCOPED_CSS = `
[data-hudreal-resources] [data-hr-res]:focus { outline: none; }
[data-hudreal-resources] [data-hr-res]:focus-visible { outline: 2px solid ${C.focus}; outline-offset: -3px; border-radius: 6px; }
`;

/** Incised hourglass: the "time is running out" emblem (rubric §1.6b) — rendered
 *  inline after the label, never as value punctuation. */
function Hourglass({ color }: { color: string }) {
  return (
    <svg width="9" height="12" viewBox="0 0 9 12" aria-hidden="true" style={{ display: 'block', flex: 'none' }}>
      <path d="M1 0.75h7M1 11.25h7M1.6 0.75c0 3 2.9 3.6 2.9 5.25S1.6 8.25 1.6 11.25M7.4 0.75c0 3-2.9 3.6-2.9 5.25s2.9 2.25 2.9 5.25"
        fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** Engraved brass socket — the icon's seat, same grammar as the nav round
 *  buttons: bronze rim, dark well, top sheen, inner shadow behind the glyph. */
function IconSocket({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: G.socket,
        height: G.socket,
        flex: 'none',
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: 'radial-gradient(circle at 34% 26%, #33514a 0%, #14302b 55%, #0a1f1c 100%)',
        boxShadow: [
          'inset 0 1px 1px rgba(255, 236, 180, 0.22)',
          'inset 0 -2px 3px rgba(0, 0, 0, 0.6)',
          '0 0 0 1.5px #7a6230',
          '0 0 0 3px rgba(20, 12, 4, 0.9)',
          '0 1px 3px rgba(0, 0, 0, 0.75)',
        ].join(', '),
      }}
    >
      <div style={{ width: G.glyph, height: G.glyph, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.8))' }}>{children}</div>
    </div>
  );
}

/** Compact display for very large integers (99999 stays, 123456 -> 123K) so a chip never overflows its slot. */
function compact(v: string | number): string {
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(n) || Math.abs(n) < 100000) return String(v);
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export interface HudRealResourcesProps {
  items: ResourceReadoutItem[];
}

/** Top-right resource bar: one generated image, one chip per slot. */
export function HudRealResources({ items }: HudRealResourcesProps) {
  return (
    <section data-hudreal-resources="" style={{ position: 'relative', userSelect: 'none', width: BAR.w, height: BAR.h }}>
      <style>{SCOPED_CSS}</style>
      <img src={ASSET} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      {BAR.slots.map((slot, i) => {
        const item = items[i];
        if (!item) return null;
        const danger = item.tone === 'danger';
        const toneColor = item.tone ? HUD_TONE_COLOR[item.tone] : C.label;
        const description = item.description ?? `${item.label}: ${item.value}`;
        const hint = [description !== item.label ? description : null, item.detail ? `${item.detail}` : null].filter(Boolean).join(' — ');
        return (
          <ZanaraTooltip key={item.id} label={item.label} hint={hint || undefined}>
            <div role="group" aria-label={description} tabIndex={0} data-hr-res={item.id} data-tone={item.tone}
              style={{
                position: 'absolute', left: slot.x, top: slot.y, width: slot.w, height: slot.h, boxSizing: 'border-box',
                padding: `0 ${G.pad}px`, display: 'flex', alignItems: 'center', gap: G.gap, cursor: 'default',
                borderRadius: 10,
                /* Danger: vermilion enamel rim on the slice itself — the slot glows,
                 *  the hourglass sits at the right edge as an emblem. No hairline. */
                ...(danger
                  ? { boxShadow: `inset 0 0 0 1.5px ${HUD_TONE_COLOR.danger}d9, inset 0 0 9px ${HUD_TONE_COLOR.danger}40` }
                  : {}),
              }}>
              <IconSocket>{item.icon}</IconSocket>
              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <span style={{
                  fontFamily: '"EB Garamond", serif', fontSize: hudPx(G.valueSize), fontWeight: danger ? 700 : 600, lineHeight: hudPx(18),
                  fontVariantNumeric: 'tabular-nums', color: danger ? HUD_TONE_COLOR.danger : C.value, textShadow: C.emboss,
                  whiteSpace: 'nowrap', display: 'flex', alignItems: 'baseline', gap: 3,
                }}>
                  {compact(item.value)}
                  {item.max !== undefined && String(item.value).length <= 3 && (
                    <span style={{ fontSize: hudPx(G.labelSize), fontWeight: 500, color: C.label, opacity: 0.85 }}>/{item.max}</span>
                  )}
                </span>
                <span style={{
                  fontFamily: '"EB Garamond", serif', fontSize: hudPx(G.labelSize), lineHeight: hudPx(13), color: C.label, textShadow: C.shadow,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: 0.6,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  {item.label}
                  {danger && <Hourglass color={toneColor} />}
                </span>
              </div>
            </div>
          </ZanaraTooltip>
        );
      })}
    </section>
  );
}
