/**
 * ZanaraResources — resource wing in the Zanara language (LINGUAGGIO-v1,
 * F1 lastra K7 + painted world icons, icons-1).
 *
 * Same contract as the production `ResourceReadout`: `ResourceReadoutItem[]`
 * built by `buildResourceReadoutItems(selectResourceOutlook(...))`. Only the
 * view changes: chips with one anatomy (icon · value/max · name · trend when
 * there is one), a fixed minimum width so the bar does not jump, and danger
 * said the way halo-1 asks: incised shape (hourglass) + text + full filet,
 * in the danger tone.
 */
import type { CSSProperties } from 'react';
import { HUD_TONE_COLOR } from '@/ui/idleVillage/components/gameFrame/hudTones';
import type { ResourceReadoutItem } from '@/ui/idleVillage/components/gameFrame/ResourceReadout';
import { ZANARA_COLORS as C, zanaraLastraFrame } from './zanaraKit';
import { ZanaraTooltip } from './ZanaraTooltip';

export interface ZanaraResourcesProps {
  items: ResourceReadoutItem[];
}

const G = {
  h: 70,
  padX: 8,
  chipMinW: 104,
  icon: 36,
  gap: 8,
  valueSize: 19,
  labelSize: 12,
  filet: 2,
} as const;

const line: CSSProperties = { lineHeight: '14px', whiteSpace: 'nowrap' };

/** Incised hourglass — the "time is running out" shape (rubric §1.6b). */
function Hourglass({ color }: { color: string }) {
  return (
    <svg width="9" height="12" viewBox="0 0 9 12" aria-hidden="true" style={{ flex: 'none' }}>
      <path d="M1 0.75h7M1 11.25h7M1.6 0.75c0 3 2.9 3.6 2.9 5.25S1.6 8.25 1.6 11.25M7.4 0.75c0 3-2.9 3.6-2.9 5.25s2.9 2.25 2.9 5.25"
        fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M3 9.6h3L4.5 7.6z" fill={color} />
    </svg>
  );
}

function Chip({ item }: { item: ResourceReadoutItem }) {
  const danger = item.tone === 'danger';
  const toneColor = item.tone ? HUD_TONE_COLOR[item.tone] : C.label;
  const description = item.description ?? `${item.label}: ${item.value}`;
  return (
    <ZanaraTooltip label={item.label} hint={description !== item.label ? description : undefined}>
      <div role="group" aria-label={description} tabIndex={0} data-zanara-resource={item.id} data-tone={item.tone}
        style={{ minWidth: G.chipMinW, display: 'flex', alignItems: 'center', gap: G.gap, flex: 'none', position: 'relative' }}>
        <div style={{ width: G.icon, height: G.icon, flex: 'none', filter: 'drop-shadow(0 1px 2px rgba(3, 26, 30, 0.8))' }}>{item.icon}</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{
            fontFamily: '"EB Garamond", serif', fontSize: G.valueSize, fontWeight: danger ? 700 : 600, lineHeight: '20px',
            fontVariantNumeric: 'tabular-nums', color: danger ? HUD_TONE_COLOR.danger : C.value, textShadow: C.textShadow, whiteSpace: 'nowrap',
          }}>
            {item.value}
            {item.max !== undefined && <span style={{ fontSize: G.labelSize + 1, fontWeight: 500, opacity: 0.8 }}>/{item.max}</span>}
          </span>
          <span style={{ ...line, fontFamily: 'var(--font-header, "Cinzel", serif)', fontSize: G.labelSize, letterSpacing: 1, color: C.label }}>{item.label}</span>
          {item.detail && (
            <span style={{ ...line, fontFamily: '"EB Garamond", serif', fontSize: G.labelSize, color: toneColor, display: 'flex', alignItems: 'center', gap: 4 }}>
              {danger && <Hourglass color={toneColor} />}
              {item.detail}
            </span>
          )}
        </div>
        {danger && <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: -4, height: G.filet, background: toneColor, borderRadius: 1 }} />}
      </div>
    </ZanaraTooltip>
  );
}

/** Top-right resource wing: one lastra, chips separated by gold rules. */
export function ZanaraResources({ items }: ZanaraResourcesProps) {
  return (
    <section data-zanara-resources="" style={{ position: 'relative', height: G.h, display: 'inline-flex', alignItems: 'center', padding: `0 ${G.padX}px` }}>
      <style>{`[data-zanara-resource]:focus { outline: none; } [data-zanara-resource]:focus-visible { outline: 2px solid ${C.title}; outline-offset: 4px; border-radius: 4px; }`}</style>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, boxSizing: 'border-box', ...zanaraLastraFrame() }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: '0 10px' }}>
        {items.map((item, i) => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {i > 0 && <div aria-hidden="true" style={{ width: 1, height: G.h - 24, background: C.divider }} />}
            <Chip item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
