import { useEffect, useState } from 'react';
import { PixiWorldMap } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';

/**
 * PLAN-110 R1 v0 (§13, ruling Director 2026-11-02): the Director-chosen
 * components, UNRESTORED crops, laid on the live map at the positions measured
 * by scripts/build-r1v0-crops.mjs → public/mockups/r1v0/r1v0.json.
 * Composition gate before the Gemini pilot — reference-only board.
 */

const MAP_MANIFEST = '/assets/world/mappa2/base/manifest.json';
const DATA_URL = '/mockups/r1v0/r1v0.json';
const DESIGN_W = 1600;
const DESIGN_H = 900;

interface R1Piece {
  id: string;
  title: string;
  src: string;
  at: [number, number, number, number];
  z: number;
  rule: string;
}

type Backdrop = 'map' | 'mockup' | 'none';

const LABEL: React.CSSProperties = {
  fontFamily: 'ui-monospace, monospace', fontSize: 11, letterSpacing: 1, color: '#cfe6f0',
  background: 'rgba(3,14,24,0.85)', borderRadius: 4, padding: '4px 9px', border: '1px solid transparent', cursor: 'pointer',
};

const BACKDROPS: Record<Backdrop, string | null> = {
  map: null,
  mockup: '/mockups/hud-lab/sources/zanara-v2.png',
  none: null,
};

export default function HudR1Page() {
  const [sx, setSx] = useState(1);
  const [sy, setSy] = useState(1);
  const [fit, setFit] = useState<'fill' | 'uniform'>('fill');
  const [backdrop, setBackdrop] = useState<Backdrop>('map');
  const [outline, setOutline] = useState(false);
  const [tags, setTags] = useState(false);
  const [pieces, setPieces] = useState<R1Piece[]>([]);
  useEffect(() => {
    const calc = () => {
      if (fit === 'fill') {
        setSx(window.innerWidth / DESIGN_W);
        setSy(window.innerHeight / DESIGN_H);
      } else {
        const s = Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H);
        setSx(s); setSy(s);
      }
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [fit]);
  useEffect(() => {
    fetch(DATA_URL).then((r) => r.json()).then((d: { pieces: R1Piece[] }) => setPieces(d.pieces)).catch(() => setPieces([]));
  }, []);

  const cycle = () => setBackdrop((b) => (b === 'map' ? 'mockup' : b === 'mockup' ? 'none' : 'map'));

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#0b2233' }}>
      {backdrop === 'map' && <PixiWorldMap manifestPath={MAP_MANIFEST} stageColor="#1675ad" />}
      {backdrop === 'mockup' && (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${BACKDROPS.mockup})`, backgroundSize: '100% 100%' }} />
      )}
      <div style={{ position: 'absolute', left: 0, top: 0, width: DESIGN_W, height: DESIGN_H, transform: `scale(${sx}, ${sy})`, transformOrigin: 'top left' }}>
        {[...pieces].sort((a, b) => a.z - b.z).map((p) => (
          <div key={p.id} data-r1-piece={p.id} title={`${p.title} — ${p.rule}`}
            style={{ position: 'absolute', left: p.at[0], top: p.at[1], width: p.at[2], height: p.at[3], outline: outline ? '1px dashed #ff4fd8' : undefined }}>
            <img src={p.src} alt={p.title} draggable={false} style={{ width: '100%', height: '100%', display: 'block' }} />
            {tags && (
              <span style={{ position: 'absolute', left: 0, top: -14, fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#ffe27a', background: 'rgba(3,14,24,0.9)', padding: '0 4px' }}>{p.id}</span>
            )}
          </div>
        ))}
        <div style={{ position: 'absolute', left: 540, top: 6, display: 'flex', gap: 8, zIndex: 50 }}>
          <button type="button" data-testid="r1-backdrop" onClick={cycle} style={LABEL}>fondo: {backdrop}</button>
          <button type="button" data-testid="r1-fit" onClick={() => setFit((f) => (f === 'fill' ? 'uniform' : 'fill'))} style={LABEL}>fit: {fit === 'fill' ? 'riempi' : 'uniforme'}</button>
          <button type="button" data-testid="r1-outline" onClick={() => setOutline((o) => !o)} style={{ ...LABEL, borderColor: outline ? '#d4af37' : 'transparent' }}>contorno</button>
          <button type="button" data-testid="r1-tags" onClick={() => setTags((t) => !t)} style={{ ...LABEL, borderColor: tags ? '#d4af37' : 'transparent' }}>etichette</button>
        </div>
      </div>
    </div>
  );
}
