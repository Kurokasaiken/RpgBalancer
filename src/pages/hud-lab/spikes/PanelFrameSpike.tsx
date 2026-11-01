import type { CSSProperties } from 'react';

/**
 * T-102b spike — alabaster contextual panel, CSS-first reproduction of the
 * zanara-v1 crop. Tests BOTH the frame AND the inner surface: a beautiful
 * frame with a flat interior counts as a FAILED spike (Director amendment).
 */

const ALABASTER = {
  hi: '#f7f2e6',
  mid: '#e8e3d6',
  lo: '#cfc7b4',
  vein: 'rgba(160,150,125,0.10)',
};
const GOLD = { hi: '#f4d98b', mid: '#d4af37', lo: '#8a6a1e' };
const INK = '#2e2a20';

const filigreeCorner = (pos: CSSProperties): CSSProperties => ({
  position: 'absolute', width: 14, height: 14, ...pos,
  background: `radial-gradient(circle at center, ${GOLD.hi}, ${GOLD.mid} 60%, ${GOLD.lo})`,
  clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
});

export function PanelFrameSpike() {
  return (
    <div style={{
      position: 'relative', width: 340, padding: 5,
      background: `linear-gradient(135deg, ${GOLD.lo}, ${GOLD.mid} 30%, ${GOLD.hi} 50%, ${GOLD.mid} 70%, ${GOLD.lo})`,
      borderRadius: 6,
      boxShadow: '0 6px 18px rgba(0,0,0,0.55)',
    }}>
      {/* alabaster band */}
      <div style={{
        position: 'relative', padding: '18px 16px 14px',
        borderRadius: 4,
        background: `
          repeating-linear-gradient(115deg, transparent 0 26px, ${ALABASTER.vein} 26px 27px),
          repeating-linear-gradient(64deg, transparent 0 41px, ${ALABASTER.vein} 41px 42px),
          linear-gradient(160deg, ${ALABASTER.hi}, ${ALABASTER.mid} 45%, ${ALABASTER.lo})
        `,
        boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.65), inset 0 -2px 6px rgba(90,80,60,0.25)',
        border: `1px solid ${GOLD.lo}`,
        color: INK,
        fontFamily: '"EB Garamond", serif',
      }}>
        <span style={filigreeCorner({ top: -6, left: -6 })} />
        <span style={filigreeCorner({ top: -6, right: -6 })} />
        <span style={filigreeCorner({ bottom: -6, left: -6 })} />
        <span style={filigreeCorner({ bottom: -6, right: -6 })} />

        <div style={{ display: 'flex', gap: 12 }}>
          {/* editorial column */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 1.6, color: '#7a6a45', textTransform: 'uppercase' }}>POI — regione nord</div>
            <h3 style={{ margin: '3px 0 6px', fontFamily: 'Cinzel, serif', fontSize: 15, letterSpacing: 0.6, color: '#3a3120' }}>LE CASCATE DI ZANARA</h3>
            <p style={{ margin: '0 0 10px', fontSize: 11, lineHeight: 1.45, color: '#4a4232' }}>
              Antiche terrazze d'acqua dove gli alchimisti di corte distillavano la rugiada stellare. Si dice che chi bagni la fronte alla terza cascata veda il proprio destino.
            </p>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 1.4, color: '#7a6a45', marginBottom: 4 }}>RICOMPENSE</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {['Gemma stellare', 'Rugiada ×3', 'XP 120'].map((r) => (
                <span key={r} style={{
                  fontSize: 9, padding: '2px 7px', borderRadius: 3,
                  background: `linear-gradient(180deg, ${GOLD.hi}, ${GOLD.mid})`,
                  border: `1px solid ${GOLD.lo}`, color: '#3a2c0a', fontFamily: 'Cinzel, serif',
                }}>{r}</span>
              ))}
            </div>
            <div style={{ fontSize: 10, color: '#5a4f38', marginBottom: 10 }}>Requisito: 2 eroi · durata ~3 giorni</div>
            <button type="button" style={{
              width: '100%', padding: '7px 0', border: 'none', borderRadius: 4, cursor: 'pointer',
              background: `linear-gradient(180deg, ${GOLD.hi}, ${GOLD.mid} 55%, ${GOLD.lo})`,
              boxShadow: '0 2px 5px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.5)',
              fontFamily: 'Cinzel, serif', fontSize: 11, letterSpacing: 2, color: '#2e2106',
            }}>INIZIA</button>
          </div>
          {/* vertical illustration — right */}
          <div style={{
            width: 92, flexShrink: 0, borderRadius: 3, overflow: 'hidden',
            border: `1px solid ${GOLD.mid}`,
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.3), 0 2px 5px rgba(0,0,0,0.3)',
          }}>
            <img
              src="/assets/quest-goblin/esplorazione.jpg" alt="illustrazione" draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
