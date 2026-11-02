import { useState } from 'react';
import { PixiWorldMap } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';
import { RosterCropColumn, type RosterHero } from './hud-lab/spikes/RosterCropSpike';

/** Roster test: mockup column vs reconstruction cut from the same mockup
 *  (mockup portraits → frame fidelity), then the live column on the real map. */

const MAP_MANIFEST = '/assets/world/mappa2/base/manifest.json';
const REF = '/mockups/hud-lab/roster-crop/ref/';
const COL_H = 668;

const MOCKUP_HEROES: RosterHero[] = [
  { id: 'kael', name: 'Kael', lv: 12, xp: 82, portrait: `${REF}portrait-0.png` },
  { id: 'seraphine', name: 'Seraphine', lv: 11, xp: 74, portrait: `${REF}portrait-1.png` },
  { id: 'bran', name: 'Bran', lv: 10, xp: 70, portrait: `${REF}portrait-2.png` },
  { id: 'lyra', name: 'Lyra', lv: 9, xp: 80, portrait: `${REF}portrait-3.png` },
];

const WARRIOR = '/assets/portraits/portrait male warrior.png';
const MAGE = '/assets/portraits/portrait female magician.png';
const LIVE_HEROES: RosterHero[] = [
  { id: 'kael', name: 'Kael', lv: 12, xp: 82, portrait: WARRIOR },
  { id: 'seraphine', name: 'Seraphine', lv: 11, xp: 74, portrait: MAGE },
  { id: 'bran', name: 'Bran', lv: 10, xp: 70, portrait: WARRIOR },
  { id: 'lyra', name: 'Lyra', lv: 9, xp: 80, portrait: MAGE },
  { id: 'torm', name: 'Torm', lv: 8, xp: 35, portrait: WARRIOR },
  { id: 'wen', name: 'Wen', lv: 7, xp: 50, portrait: MAGE },
  { id: 'aldo', name: 'Aldo', lv: 5, xp: 12, portrait: WARRIOR },
];

const LABEL: React.CSSProperties = {
  fontFamily: 'ui-monospace, monospace', fontSize: 11, letterSpacing: 1.2, color: '#9fd4e8',
  textTransform: 'uppercase', background: 'rgba(3,14,24,0.85)', borderRadius: 5, padding: '4px 10px',
};

type Mode = 'side' | 'overlay' | 'diff';

export default function HudRosterCropPage() {
  const [zoom, setZoom] = useState(1.25);
  const [mode, setMode] = useState<Mode>('side');
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'auto' }}>
      <div style={{ position: 'fixed', inset: 0 }}>
        <PixiWorldMap manifestPath={MAP_MANIFEST} stageColor="#1675ad" />
      </div>
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 10, padding: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {(['side', 'overlay', 'diff'] as Mode[]).map((m) => (
          <button key={m} type="button" data-testid={`mode-${m}`} onClick={() => setMode(m)}
            style={{ ...LABEL, cursor: 'pointer', border: m === mode ? '1px solid #d4af37' : '1px solid transparent' }}>{m}</button>
        ))}
        {[1, 1.25, 1.5, 2].map((z) => (
          <button key={z} type="button" onClick={() => setZoom(z)}
            style={{ ...LABEL, cursor: 'pointer', border: z === zoom ? '1px solid #d4af37' : '1px solid transparent' }}>{z}×</button>
        ))}
        <span style={LABEL}>selezionato: {selected ?? '—'}</span>
      </div>

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 24, padding: '0 12px 24px', alignItems: 'flex-start' }}>
        {/* 1. mockup column, untouched */}
        {mode === 'side' && (
          <figure style={{ margin: 0 }}>
            <figcaption style={LABEL}>mockup zanara-v2</figcaption>
            <div style={{ width: 260 * zoom, height: COL_H * zoom, marginTop: 6 }}>
              <img src={`${REF}column.png`} alt="mockup" style={{ width: 260, height: COL_H, transform: `scale(${zoom})`, transformOrigin: 'top left' }} />
            </div>
          </figure>
        )}

        {/* 2. reconstruction with mockup portraits — frame fidelity at the same scale */}
        <figure style={{ margin: 0 }} data-testid="recon">
          <figcaption style={LABEL}>ricostruzione (ritratti del mockup){mode !== 'side' ? ` · ${mode}` : ''}</figcaption>
          <div style={{ width: 260 * zoom, height: COL_H * zoom, marginTop: 6, background: '#0d1a14' }}>
            <div style={{ position: 'relative', width: 260, height: COL_H, transform: `scale(${zoom})`, transformOrigin: 'top left', isolation: 'isolate' }}>
              <RosterCropColumn heroes={MOCKUP_HEROES} onSelect={setSelected} />
              {mode !== 'side' && (
                <img src={`${REF}column.png`} alt="" style={{
                  position: 'absolute', left: 0, top: 0, width: 260, height: COL_H, pointerEvents: 'none',
                  opacity: mode === 'overlay' ? 0.5 : 1, mixBlendMode: mode === 'diff' ? 'difference' : 'normal',
                }} />
              )}
            </div>
          </div>
        </figure>

        {/* 3. live column on the real map: 7 heroes, 4 visible, scroll */}
        <figure style={{ margin: 0 }}>
          <figcaption style={LABEL}>vivo su mappa · 7 eroi, scroll</figcaption>
          <div style={{ width: 260 * zoom, height: COL_H * zoom, marginTop: 6 }}>
            <div style={{ width: 260, transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
              <RosterCropColumn heroes={LIVE_HEROES} onSelect={setSelected} />
            </div>
          </div>
        </figure>
      </div>
    </div>
  );
}
