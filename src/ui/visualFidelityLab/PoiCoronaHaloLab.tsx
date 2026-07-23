import React, { useEffect, useState } from 'react';
import { PoiCoronaHalo } from './PoiCoronaHalo';
import { POI_SKINS } from './poiMedallionRecipe';

/**
 * PoiCoronaHaloLab — /poi-corona-lab
 *
 * Showcase of the PoiCoronaHalo prototype states, side by side, so the
 * corona-halo redesign can be judged by eye before transplanting into the
 * shared GenericPoiSkin (Clock + all POI markers + POI Detail medallion).
 *
 * NOT the real component — a lab hypothesis (same pattern as PlateQuad for
 * the Observatory wells). Dedicated route because /visual-fidelity-lab's own
 * page breaks screenshot capture (heavy WanderlustSurface SVG compositing).
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

export const PoiCoronaHaloLab: React.FC = () => {
  // Live-driven timed demo: counts down over 20s so calm→alert→critical is
  // observable, plus an onExpire log so the generic-trigger contract is visible.
  const [remaining, setRemaining] = useState(1);
  const [expireLog, setExpireLog] = useState<string[]>([]);
  const [stageLog, setStageLog] = useState<string[]>([]);

  useEffect(() => {
    const totalMs = 20000;
    const t0 = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - t0;
      const frac = Math.max(0, 1 - elapsed / totalMs);
      setRemaining(frac);
      if (frac <= 0) clearInterval(id);
    }, 100);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px 96px', background: '#0a0a14', color: '#e8e8e8' }}>
      <h1 style={{ ...label, fontSize: 14, marginBottom: 24 }}>POI Corona Halo — Lab Prototype</h1>
      <p style={{ ...sub, marginBottom: 32, maxWidth: 640 }}>
        Niente stanghette/tick ring. Menisco sul fronte + canale freddo. Fill = orario, cresce.
        Timed = antiorario, si scarica, vira verso brace per stadio (calmo→allerta→critico,
        soglie proporzionali). Ready = pieno, pulsa. Trigger generico onExpire loggato sotto.
      </p>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 40 }}>
        <div style={swatch}>
          <PoiCoronaHalo mode="fill" progress={0.62} palette={POI_SKINS.amber} size={90} icon="⚔" />
          <div style={label}>Fill 62%</div>
          <div style={sub}>orario, cresce, colore-skin</div>
        </div>

        <div style={swatch}>
          <PoiCoronaHalo mode="timed" remainingFraction={remaining} palette={POI_SKINS.amber} size={90} icon="⏳"
            onExpire={() => setExpireLog((l) => [...l.slice(-4), `expired @ ${new Date().toLocaleTimeString()}`])}
            onStageChange={(s) => setStageLog((l) => [...l.slice(-4), s])}
          />
          <div style={label}>Timed (live, 20s)</div>
          <div style={sub}>{Math.round(remaining * 100)}% rimasto</div>
        </div>

        <div style={swatch}>
          <PoiCoronaHalo mode="timed" remainingFraction={0.7} palette={POI_SKINS.lapis} size={90} icon="⏳" />
          <div style={label}>Timed · Calmo (70%)</div>
          <div style={sub}>base color, no escalation</div>
        </div>

        <div style={swatch}>
          <PoiCoronaHalo mode="timed" remainingFraction={0.35} palette={POI_SKINS.lapis} size={90} icon="⏳" />
          <div style={label}>Timed · Allerta (35%)</div>
          <div style={sub}>vira parzialmente verso brace</div>
        </div>

        <div style={swatch}>
          <PoiCoronaHalo mode="timed" remainingFraction={0.08} palette={POI_SKINS.lapis} size={90} icon="⏳" />
          <div style={label}>Timed · Critico (8%)</div>
          <div style={sub}>brace pieno, pulse rapido</div>
        </div>

        <div style={swatch}>
          <PoiCoronaHalo mode="ready" palette={POI_SKINS.verdigris} size={90} icon="✓" />
          <div style={label}>Ready (non raccolto)</div>
          <div style={sub}>pieno, pulsa leggermente</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 40 }}>
        <div>
          <div style={label}>onExpire log</div>
          <ul style={{ ...sub, fontFamily: 'monospace', textAlign: 'left' }}>
            {expireLog.length === 0 ? <li>(nessuno ancora — attendi 20s)</li> : expireLog.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
        <div>
          <div style={label}>onStageChange log</div>
          <ul style={{ ...sub, fontFamily: 'monospace', textAlign: 'left' }}>
            {stageLog.length === 0 ? <li>(nessuno ancora)</li> : stageLog.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PoiCoronaHaloLab;
