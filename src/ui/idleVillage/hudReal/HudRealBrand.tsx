/**
 * HudRealBrand — brand lockup of PLAN-110 C8 (D-8): compass emblem + empty emerald plaque; the title
 * (WANDERLUST) is live text in code, never in the image. One generated image
 * (scripts/hud-real/build-plate-assets.py). A view only.
 */
import { BRAND_PIECE as P } from './brandPieceGeometry';

const ASSET = '/assets/ui/hud-real/brand/piece.webp';
const C = { title: '#f0d58c', sub: '#b9d2c4', shadow: '0 1px 2px rgba(3, 26, 30, 0.9)' } as const;
const GROW_X = 44;
const GROW_Y = 6;

export interface HudRealBrandProps {
  title: string;
  subtitle?: string;
}

export function HudRealBrand({ title, subtitle }: HudRealBrandProps) {
  const f = P.field;
  /* long titles shrink (floor 12 px) before they are cut with an ellipsis */
  const base = subtitle ? 15 : 19;
  const size = Math.max(12, Math.min(base, Math.floor((base * 11) / Math.max(title.length, 11))));
  return (
    <header data-hudreal-brand="" style={{ position: 'relative', userSelect: 'none', width: P.w, height: P.h }}>
      <img src={ASSET} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      <div style={{
        position: 'absolute', left: f.x - GROW_X, top: f.y - GROW_Y, width: f.w + GROW_X - 6, height: f.h + GROW_Y * 2, boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflowX: 'hidden', overflowY: 'visible', whiteSpace: 'nowrap',
        textShadow: C.shadow,
      }}>
        <h1 style={{ margin: 0, fontFamily: 'Cinzel, "EB Garamond", serif', fontWeight: 600, fontSize: size, letterSpacing: 2, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.1, color: C.title, textTransform: 'uppercase' }}>{title}</h1>
        {subtitle && <span style={{ fontFamily: '"EB Garamond", serif', fontSize: 12, letterSpacing: 1, color: C.sub }}>{subtitle}</span>}
      </div>
    </header>
  );
}
