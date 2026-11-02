import { useEffect, useState } from 'react';
import { PixiWorldMap } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';
import { RosterSpike } from './hud-lab/spikes/RosterSpike';

/** Full-HUD composition on the real map — every generated asset placed in its
 *  intended slot per the selected zanara mockups. Director + AI-review target. */

const MAP_MANIFEST = '/assets/world/mappa2/base/manifest.json';
const STAGE_COLOR = '#1675ad';
const IVORY = '#ece4cf';

const abs = (x: number | string, y: number | string, extra: React.CSSProperties = {}): React.CSSProperties => ({
  position: 'absolute', left: x, top: y, ...extra,
});

const DESIGN_W = 1600;
const DESIGN_H = 900;

export default function HudComposePage() {
  const [scale, setScale] = useState(() => Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H));
  useEffect(() => {
    const onResize = () => setScale(Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <PixiWorldMap manifestPath={MAP_MANIFEST} stageColor={STAGE_COLOR} />
      <div style={{
        position: 'absolute', left: 0, top: 0, width: DESIGN_W, height: DESIGN_H,
        transform: `scale(${scale})`, transformOrigin: 'top left',
      }}>

      {/* LEFT: full roster column */}
      <div style={{ ...abs(8, 14), zIndex: 5 }}>
        <RosterSpike />
      </div>

      {/* BOTTOM-LEFT: sextant docked to the corner */}
      <div style={{ position: 'absolute', left: 12, bottom: 14, width: 190, zIndex: 5 }}>
        <img src="/mockups/hud-lab/attach/corner-bl-alpha.png" alt="" draggable={false}
          style={{ width: 180, height: 'auto', display: 'block' }} />
        <div style={{
          position: 'absolute', left: 36, bottom: 24, zIndex: 6,
          fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: 1, color: '#0d2a22',
        }}>42°41′N · 9°12′E</div>
      </div>

      {/* TOP-LEFT: brand plaque beside the emblem */}
      <img src="/mockups/hud-lab/attach/brand-plaque-alpha.png" alt="WANDERLUST" draggable={false}
        style={{ ...abs(160, -158), width: 400, height: 'auto', zIndex: 5 }} />
      <div style={{
        ...abs(160, 94), width: 400, textAlign: 'center', zIndex: 6,
        fontFamily: '"Cinzel Decorative", "EB Garamond", serif',
        fontSize: 26, fontWeight: 700, letterSpacing: 7, color: '#f4ead0',
        textShadow: '0 2px 6px rgba(0,0,0,0.9)',
      }}>WANDERLUST</div>

      {/* TOP-RIGHT: resources bar */}
      <img src="/mockups/hud-lab/attach/resources-bar-alpha.png" alt="risorse" draggable={false}
        style={{ ...abs('auto', 18), right: 18, width: 560, height: 'auto', zIndex: 5 }} />
      <div style={{
        ...abs('auto', 30), right: 60, zIndex: 6, display: 'flex', gap: 44,
        fontFamily: '"EB Garamond", serif', fontSize: 17, fontWeight: 600, color: IVORY,
        textShadow: '0 1px 4px rgba(0,0,0,0.85)',
      }}>
        <span>🪙 1.240</span><span>💎 87</span><span>🌾 312</span><span>⚙️ 45</span>
      </div>

      {/* RIGHT: contextual panel — alabaster frame + content + CTA */}
      <div style={{ ...abs('auto', 130), right: 30, width: 340, zIndex: 5 }}>
        <div style={{ position: 'relative' }}>
          <img src="/mockups/hud-lab/attach/panel-alabastro-alpha.png" alt="" draggable={false}
            style={{ width: '100%', display: 'block' }} />
          <div style={{
            position: 'absolute', inset: '16% 11% 21%', overflow: 'hidden',
            background: 'linear-gradient(160deg, #efe7d2, #e4d8bc 60%, #d9cbaa)',
            borderRadius: 6, boxShadow: 'inset 0 2px 10px rgba(60,45,20,0.25)',
            fontFamily: '"EB Garamond", serif', color: '#2b2118', padding: '10px 14px',
          }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: '#6b5a3e', textTransform: 'uppercase' }}>Poi — Regione Nord</div>
            <div style={{ fontSize: 19, fontWeight: 600, margin: '2px 0 6px' }}>Le Cascate di Zanara</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.45 }}>
              Antiche terrazze d'acqua dove gli alchimisti di corte distillavano la rugiada stellare.
              Si dice che chi si bagni alla terza cascata veda il proprio destino.
            </div>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: '#6b5a3e', marginTop: 8, textTransform: 'uppercase' }}>Ricompense</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 11.5 }}>
              <span>◆ Gemma Stellare</span><span>◆ Rugiada ×3</span><span>◆ XP 120</span>
            </div>
          </div>
        </div>
        <div style={{ position: 'relative', marginTop: -62, display: 'flex', justifyContent: 'center' }}>
          <img src="/mockups/hud-lab/attach/cta-button-alpha.png" alt="" draggable={false}
            style={{ width: 230, height: 'auto' }} />
          <div style={{
            position: 'absolute', top: '50%', left: '55%', transform: 'translate(-50%,-52%)',
            fontFamily: '"EB Garamond", serif', fontSize: 15, fontWeight: 700, letterSpacing: 3,
            color: IVORY, textShadow: '0 1px 3px rgba(0,0,0,0.7)',
          }}>INIZIA</div>
        </div>
      </div>

      {/* victory seal anchored to the nav's right end */}
      <img src="/mockups/hud-lab/attach/seal-alpha.png" alt="sigillo vittoria" draggable={false}
        style={{ position: 'absolute', left: '50%', bottom: 64, marginLeft: 430, width: 110, height: 'auto', zIndex: 6, filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.45))' }} />

      {/* BOTTOM-CENTER: nav plinth with astrolabe + icon sockets */}
      <img src="/mockups/hud-lab/attach/nav-plinth-alpha.png" alt="navigazione" draggable={false}
        style={{ position: 'absolute', left: '50%', bottom: 14, transform: 'translateX(-50%)', width: 780, height: 'auto', zIndex: 5 }} />



      {/* BOTTOM-RIGHT: roundel cluster */}
      <img src="/mockups/hud-lab/attach/corner-br-alpha.png" alt="" draggable={false}
        style={{ position: 'absolute', right: 16, bottom: 18, width: 210, height: 'auto', zIndex: 5 }} />


      </div>
    </div>
  );
}