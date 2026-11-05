/**
 * HudRealBust — decorative corner figurine of PLAN-110 C9 (gold guardian with leaves and emerald),
 * a purely ornamental piece that sits on a panel corner. No content, no interaction: hidden from
 * assistive tech and transparent to the pointer.
 */
const ASSET = '/assets/ui/hud-real/bust/bust.webp';

export interface HudRealBustProps {
  width?: number;
  /** Mirror horizontally to sit on the opposite corner. */
  flip?: boolean;
}

export function HudRealBust({ width = 120, flip = false }: HudRealBustProps) {
  return (
    <img data-hudreal-bust="" src={ASSET} alt="" aria-hidden="true" draggable={false}
      style={{ width, height: 'auto', display: 'block', pointerEvents: 'none', userSelect: 'none', transform: flip ? 'scaleX(-1)' : undefined, filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))' }} />
  );
}
