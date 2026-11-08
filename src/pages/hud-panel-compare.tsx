/**
 * /hud-panel-compare — PLAN-112 F3.3: the panel frame candidates side by side on the live map, with the real content.
 * Lab page: it never replaces the production piece. Assets live in .mw/specs/hud-real/f3 and are served through /@fs.
 */
import { PixiWorldMap } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';

interface Cand { id: string; label: string; src: string; geo: { w: number; h: number; field: { x: number; y: number; w: number; h: number }; window: { x: number; y: number; w: number; h: number }; plaque: { x: number; y: number; w: number; h: number } } }
const FS = '/@fs/Users/faustoboni/progetti_personali/RPG/.mw/specs/hud-real/f3/';
const CANDS: Cand[] = [
  { id: 'current', label: 'ATTUALE', src: FS + 'panel-frame-current.webp', geo: { w: 340, h: 433.31, field: { x: 39.62, y: 62.21, w: 258.2, h: 316.57 }, window: { x: 246.27, y: 79.25, w: 64.34, h: 175.96 }, plaque: { x: 88.2, y: 343.41, w: 164.46, h: 32.38 } } },
  { id: 'pf1', label: 'pf-1', src: FS + 'cand/pf1/frame.webp', geo: { w: 340, h: 533.37, field: { x: 47.16, y: 74.17, w: 246.1, h: 365.73 }, window: { x: 230.67, y: 95.18, w: 77.18, h: 213.09 }, plaque: { x: 79.75, y: 417.6, w: 169.36, h: 41.16 } } },
  { id: 'pf3', label: 'pf-3', src: FS + 'cand/pf3/frame.webp', geo: { w: 340, h: 512.73, field: { x: 50.43, y: 74.81, w: 240.82, h: 364.38 }, window: { x: 235.77, y: 123.98, w: 65.14, h: 173.15 }, plaque: { x: 82.79, y: 416.07, w: 153.82, h: 42.87 } } },
];
const INK = '#2b2118';

function Panel({ c }: { c: Cand }) {
  const g = c.geo;
  const bodyTop = g.window.y;
  const textRight = g.window.x - 8;
  return (
    <div data-testid={`pc-${c.id}`} style={{ position: 'relative', width: g.w, height: g.h, flex: 'none' }}>
      <img src={c.src} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', left: g.field.x + 12, top: bodyTop, width: textRight - g.field.x - 12, height: g.plaque.y - bodyTop - 6, overflow: 'hidden', color: INK, fontFamily: '"EB Garamond", serif' }}>
        <div style={{ fontSize: 14, letterSpacing: 1, textTransform: 'uppercase', color: '#6b5a3e' }}>POI — Regione Nord</div>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 21, fontWeight: 600, lineHeight: '23px', margin: '1px 0 3px' }}>Le Cascate di Zanara</div>
        <div style={{ fontSize: 16, lineHeight: '21px' }}>Antiche terrazze d'acqua dove gli alchimisti di corte distillavano la rugiada stellare. Si dice che chi si bagni alla terza cascata veda il proprio destino.</div>
        <div style={{ fontSize: 14, letterSpacing: 1, textTransform: 'uppercase', color: '#6b5a3e', marginTop: 6 }}>Ricompense</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 1, fontSize: 16 }}>
          {[['gold', '350'], ['food', '50'], ['wood', '12']].map(([k, v]) => <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><img src={`/assets/ui/resources/res-${k}-64.webp`} alt="" width={22} height={22} />{v}</span>)}
        </div>
      </div>
      <div style={{ position: 'absolute', left: g.window.x, top: g.window.y, width: g.window.w, height: g.window.h, overflow: 'hidden', borderRadius: '30px 30px 18px 18px / 26px 26px 18px 18px' }}>
        <img src="/assets/ui/hud-real/panel/illustration-waterfall.webp" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ position: 'absolute', left: g.plaque.x, top: g.plaque.y - 4, width: g.plaque.w, height: g.plaque.h + 8, display: 'grid', placeItems: 'center', fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 17, letterSpacing: 3, color: '#f3ead0', textShadow: '0 1px 2px rgba(3,26,30,.9)' }}>INIZIA</div>
    </div>
  );
}

export default function HudPanelComparePage() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <PixiWorldMap manifestPath="/assets/world/mappa2/base/manifest.json" stageColor="#1675ad" />
      <div style={{ position: 'absolute', left: 24, top: 24, display: 'flex', gap: 28, alignItems: 'flex-start' }}>
        {CANDS.map((c) => (
          <div key={c.id}><div style={{ color: '#fff', font: '600 15px system-ui', textShadow: '0 1px 3px #000', marginBottom: 6 }}>{c.label}</div><Panel c={c} /></div>
        ))}
      </div>
    </div>
  );
}
