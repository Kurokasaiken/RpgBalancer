/**
 * HudRealGlobe — emerald globe control of PLAN-110 C6 (bottom-right). A round command button built
 * from one generated image; the action and label come from the caller (view only, no mechanics).
 * Hover = brighter and lifted a pixel, focus = gold outline outside the image, pressed = settles back.
 */
import { HudTooltip } from '@/ui/idleVillage/components/gameFrame/HudTooltip';

const ASSET = '/assets/ui/hud-real/globe/globe.webp';
const W = 80;
const H = 92;
const SCOPED_CSS = `
[data-hudreal-globe] { transition: filter 140ms, transform 140ms; }
[data-hudreal-globe]:hover { filter: brightness(1.18) drop-shadow(0 0 8px rgba(120, 230, 170, 0.45)); transform: translateY(-1px); }
[data-hudreal-globe]:active { transform: translateY(0); filter: brightness(1.05); }
[data-hudreal-globe]:focus { outline: none; }
[data-hudreal-globe]:focus-visible { outline: 2px solid #e8c766; outline-offset: 2px; border-radius: 14px; }
@media (prefers-reduced-motion: reduce) { [data-hudreal-globe] { transition: none; } }
`;

export interface HudRealGlobeProps {
  label: string;
  onClick?: () => void;
  shortcut?: string;
}

export function HudRealGlobe({ label, onClick, shortcut }: HudRealGlobeProps) {
  return (
    <HudTooltip label={label} shortcut={shortcut} side="top">
      <button type="button" data-hudreal-globe="" aria-label={label} onClick={onClick}
        style={{ width: W, height: H, padding: 0, border: 0, background: 'transparent', cursor: 'pointer', display: 'block' }}>
        <style>{SCOPED_CSS}</style>
        <img src={ASSET} alt="" draggable={false} style={{ width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }} />
      </button>
    </HudTooltip>
  );
}
