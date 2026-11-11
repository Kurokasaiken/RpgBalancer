/**
 * HudRealNav — bottom navigation dock of PLAN-110 C3, built from the generated dock
 * (scripts/hud-real/build-fullbar-assets.py --square): one graded image with six empty round
 * sockets and the astrolabe medallion at the centre. Each nav voice sits in a socket; the
 * astrolabe is the real map re-centre control (D-4).
 *
 * Same data contract as the production nav: `GameFrameNavItemConfig[]` + activeNavId + onNavSelect.
 * Voices fill the sockets in pairs next to the medallion (the outermost sockets stay empty glass
 * when there are fewer than six). Label and locked hint go to the tooltip, never into the image.
 * A view only; mechanics untouched.
 */
import { useTranslation } from 'react-i18next';
import type { GameFrameNavItemConfig } from '@/balancing/config/idleVillage/gameFrameConfig';
import { HudGlyph } from '@/ui/idleVillage/components/gameFrame/hudIcons';
import { HudTooltip } from '@/ui/idleVillage/components/gameFrame/HudTooltip';
import { NAV_BAR as BAR } from './navBarGeometry';
import { hudPx } from './hudType';

const ASSET = '/assets/ui/hud-real/nav/bar.webp';
const C = { gold: '#f1d88a', dim: '#7d8f86', focus: '#e8c766', glow: 'rgba(240, 201, 135, 0.55)' } as const;

const SCOPED_CSS = `
[data-hudreal-nav] button { background: transparent; border: 0; padding: 0; cursor: pointer; border-radius: 50%; }
[data-hudreal-nav] button:disabled { cursor: default; }
[data-hudreal-nav] button:focus { outline: none; }
[data-hudreal-nav] button:focus-visible { outline: 2px solid ${C.focus}; outline-offset: 2px; }
[data-hudreal-nav] [data-hr-nav]:not(:disabled):hover [data-hr-glyph] { filter: brightness(1.25) drop-shadow(0 0 6px ${C.glow}); }
`;

export interface HudRealNavProps {
  navItems: GameFrameNavItemConfig[];
  activeNavId: string;
  onNavSelect?: (id: string) => void;
  onRecenter: () => void;
  /** Narrow screens: outer labels move this many design px outwards and inner ones as much towards the compass, so the
   *  compensated labels never touch (measured 2026-11-10 on 390 px: «Workshop|Tavern», «Villaggio|Mappa»). Default 0. */
  labelSpread?: number;
  /** Show the engraved label under each voice. Off on /game: the tooltip and aria-label still carry it. Default true. */
  showLabels?: boolean;
}

/** Socket index per voice: inner sockets first, left and right alternating so the dock stays symmetric. */
function socketOrder(n: number): number[] {
  const half = BAR.slots.length / 2;
  const left = Array.from({ length: half }, (_, i) => half - 1 - i); // inner → outer
  const right = Array.from({ length: half }, (_, i) => half + i);
  const out: number[] = [];
  for (let i = 0; i < Math.min(n, BAR.slots.length); i++) out.push(i % 2 === 0 ? left[i >> 1] : right[i >> 1]);
  return out.sort((a, b) => a - b);
}

export function HudRealNav({ navItems, activeNavId, onNavSelect, onRecenter, labelSpread = 0, showLabels = true }: HudRealNavProps) {
  const { t } = useTranslation('idleVillage');
  const order = socketOrder(navItems.length);
  const half = BAR.slots.length / 2;
  const gapL = BAR.slots[half - 1];
  const gapR = BAR.slots[half];
  const cx = (gapL.x + gapL.w + gapR.x) / 2;
  const cy = gapL.y + gapL.h / 2;
  const medal = 96;
  const recenter = t('gameFrame.compass.recenter');
  return (
    <nav data-hudreal-nav="" aria-label={t('gameFrame.nav.ariaLabel')} style={{ position: 'relative', userSelect: 'none', width: BAR.w, height: BAR.h, marginBottom: 20 }}>
      <style>{SCOPED_CSS}</style>
      <img src={ASSET} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      {navItems.slice(0, order.length).map((item, i) => {
        const slot = BAR.slots[order[i]];
        const active = item.id === activeNavId;
        const label = t(item.labelKey);
        return (
          <HudTooltip key={item.id} label={label} hint={item.locked ? t('gameFrame.nav.locked') : undefined} side="top" wrap when>
            <button
              type="button" data-hr-nav={item.id} data-nav-id={item.id} aria-pressed={active} disabled={item.locked}
              aria-label={item.locked ? `${label} — ${t('gameFrame.nav.locked')}` : label}
              onClick={item.locked ? undefined : () => onNavSelect?.(item.id)}
              style={{
                position: 'absolute', left: slot.x, top: slot.y, width: slot.w, height: slot.h, display: 'grid', placeItems: 'center',
                boxShadow: active ? `0 0 0 2px ${C.gold}, 0 0 14px ${C.glow}` : undefined,
                background: active ? 'radial-gradient(circle, rgba(240, 201, 135, 0.18), rgba(240, 201, 135, 0) 70%)' : undefined,
              }}
            >
              <span data-hr-glyph="" style={{ display: 'grid', placeItems: 'center', filter: 'drop-shadow(0 1px 2px rgba(3, 26, 30, 0.9))' }}>
                <HudGlyph iconId={item.icon} label={label} size={36} style={{ color: item.locked ? '#9fb3a8' : active ? '#fff1bd' : C.gold, opacity: item.locked ? 0.85 : 1, filter: item.locked ? 'none' : 'drop-shadow(0 1px 0 rgba(255, 244, 200, 0.55)) drop-shadow(0 -1px 0 rgba(60, 38, 4, 0.8))' }} />
              </span>
            </button>
          </HudTooltip>
        );
      })}
      {navItems.slice(0, order.length).map((item, i) => {
        const slot = BAR.slots[order[i]];
        const active = item.id === activeNavId;
        // outer labels move outwards, inner ones towards the compass (which carries no label): every pair separates
        const side = order[i] < half ? -1 : 1;
        const outer = order[i] === 0 || order[i] === BAR.slots.length - 1 ? side : -side;
        if (!showLabels) return null;
        return (
          <span key={`l-${item.id}`} aria-hidden="true" style={{
            position: 'absolute', left: slot.x - 16 + outer * labelSpread, top: slot.y + slot.h + 17, width: slot.w + 32, textAlign: 'center', pointerEvents: 'none',
            fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: hudPx(13), fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', whiteSpace: 'nowrap',
            color: active ? C.gold : item.locked ? C.dim : '#e6dcb8', textShadow: '0 0 4px rgba(2, 18, 22, 1), 0 1px 2px rgba(2, 18, 22, 1), 0 0 8px rgba(2, 18, 22, 0.9)',
          }}>{t(item.labelKey)}</span>
        );
      })}
      <HudTooltip label={recenter} side="top" wrap when>
        <button type="button" data-hr-nav="recenter" aria-label={recenter} onClick={onRecenter}
          style={{ position: 'absolute', left: cx - medal / 2, top: cy - medal / 2, width: medal, height: medal }} />
      </HudTooltip>
    </nav>
  );
}
