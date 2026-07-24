import React, { useState } from 'react';
import { GenericPoiSkin } from '@/ui/idleVillage/frozen/kits/poiKit';
import { POI_SKINS } from './poiMedallionRecipe';

/**
 * PoiCoronaHaloLab — /poi-corona-lab
 *
 * Now shows the REAL, transplanted `GenericPoiSkin` (not the superseded lab
 * prototype) — the 4 approved palettes side by side, sharing ONE "Avanza
 * tempo" control so the corona can be judged at realistic fill levels, not
 * just the near-empty (~6-8%) values the /minimal-poi demo fixtures happen
 * to use (a thick round-capped arc at very low fill reads as a floating
 * "pill", which is misleading — this page lets you rule that in/out).
 */

const swatch: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
  padding: 20, borderRadius: 12,
  background: 'radial-gradient(circle at 50% 30%, #0e1a26 0%, #060f16 70%)',
  boxShadow: '0 0 0 1px rgba(223,184,87,0.22), inset 0 0 40px rgba(0,0,0,0.5)',
  minWidth: 140,
};
const label: React.CSSProperties = {
  fontFamily: 'Cinzel, serif', fontSize: 11, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: '#c9a84e', textAlign: 'center',
};
const sub: React.CSSProperties = { fontSize: 10, opacity: 0.6, color: '#e8e8e8', textAlign: 'center' };
const btn: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
  border: '1px solid rgba(223,184,87,0.5)', background: 'rgba(223,184,87,0.12)',
  color: '#e8e8e8', font: '600 12px Cinzel, serif', letterSpacing: '0.05em',
};

const PALETTES = [
  { id: 'amber', name: 'Ambra', palette: POI_SKINS.amber, icon: '⚔' },
  { id: 'lapis', name: 'Lapislazzuli', palette: POI_SKINS.lapis, icon: '🔍' },
  { id: 'ember', name: 'Brace', palette: POI_SKINS.ember, icon: '🪓' },
  { id: 'verdigris', name: 'Verderame', palette: POI_SKINS.verdigris, icon: '📜' },
] as const;

export const PoiCoronaHaloLab: React.FC = () => {
  const [progress, setProgress] = useState(0.06);

  const advance = () => setProgress((p) => (p >= 1 ? 0 : Math.min(1, p + 0.15)));

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px 96px', background: '#0a0a14', color: '#e8e8e8' }}>
      <h1 style={{ ...label, fontSize: 14, marginBottom: 24 }}>POI Corona Halo — componente reale, 4 palette</h1>
      <p style={{ ...sub, marginBottom: 20, maxWidth: 640 }}>
        `GenericPoiSkin` vero (stesso usato da Clock + POI + POI Detail), 4 palette affiancate.
        Il bottone avanza il riempimento (0→100%, poi torna a 0) così si giudica la corona a
        livelli di fill realistici, non solo il ~6% quasi-vuoto delle fixture di /minimal-poi.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button type="button" style={btn} onClick={advance}>Avanza tempo (+15%)</button>
        <span style={{ ...label, fontSize: 13 }}>{Math.round(progress * 100)}%</span>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {PALETTES.map((p) => (
          <div key={p.id} style={swatch}>
            <GenericPoiSkin
              icon={p.icon}
              progress={progress}
              coronaCore={p.palette.coronaCore}
              coronaGlow={p.palette.coronaGlow}
              rimColors={p.palette.rimColors as [string, string, string]}
              stoneColors={p.palette.stoneColors as [string, string]}
              stoneAmbient={p.palette.stoneAmbient}
              pinColor={p.palette.pinColor}
              size={90}
              enableHover
            />
            <div style={label}>{p.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PoiCoronaHaloLab;
