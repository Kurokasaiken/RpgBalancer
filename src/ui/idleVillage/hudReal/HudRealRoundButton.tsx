/**
 * HudRealRoundButton — round command button of PLAN-110 (review: /game has menu, panels and hide
 * controls the mockup set did not cover). One image: a gold ring around dark glass, cut from a nav
 * socket (public/assets/ui/hud-real/round/round.webp). The glyph is live content in code.
 * States derive from the same image: hover = brighter, active = gold halo, focus = outline outside.
 * A view only; the caller owns the action.
 */
import type { ReactNode } from 'react';
import { HudTooltip } from '@/ui/idleVillage/components/gameFrame/HudTooltip';

const ASSET = '/assets/ui/hud-real/round/round.webp';
const SCOPED_CSS = `
[data-hudreal-round] { transition: filter 140ms; }
[data-hudreal-round]:not(:disabled):hover { filter: brightness(1.2) drop-shadow(0 0 6px rgba(240, 201, 135, 0.45)); }
[data-hudreal-round]:disabled { opacity: 0.55; cursor: default; }
[data-hudreal-round]:focus { outline: none; }
[data-hudreal-round]:focus-visible { outline: 2px solid #e8c766; outline-offset: 2px; border-radius: 50%; }
@media (prefers-reduced-motion: reduce) { [data-hudreal-round] { transition: none; } }
`;

export interface HudRealRoundButtonProps {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  shortcut?: string;
  /** Diameter in design px (the image scales). */
  size?: number;
}

export function HudRealRoundButton({ label, children, onClick, active = false, disabled = false, shortcut, size = 40 }: HudRealRoundButtonProps) {
  return (
    <HudTooltip label={label} shortcut={shortcut} side="top" wrap>
      <button type="button" data-hudreal-round="" aria-label={label} aria-pressed={active} disabled={disabled} onClick={onClick}
        style={{
          position: 'relative', width: size, height: size, padding: 0, border: 0, borderRadius: '50%', userSelect: 'none',
          background: `url(${ASSET}) center / 100% 100% no-repeat`, cursor: 'pointer', display: 'grid', placeItems: 'center',
          color: active ? '#f1d88a' : '#d8c68a', boxShadow: active ? '0 0 0 2px #e8c766, 0 0 12px rgba(240, 201, 135, 0.5)' : undefined,
        }}>
        <style>{SCOPED_CSS}</style>
        <span style={{ display: 'grid', placeItems: 'center', filter: 'drop-shadow(0 1px 2px rgba(3, 26, 30, 0.9))' }}>{children}</span>
      </button>
    </HudTooltip>
  );
}
