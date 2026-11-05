import { useEffect, useMemo, useState } from 'react';
import { PixiWorldMap } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';
import { useRosterKitData } from '@/ui/idleVillage/frozen/kits/rosterKit';
import type { ResidentState, ResidentStatus } from '@/engine/game/idleVillage/TimeEngine';
import { HudRealRoster } from '@/ui/idleVillage/hudReal/HudRealRoster';

/**
 * PLAN-110 C1 lab: HudRealRoster with the real roster data on the live map.
 * "Stati" shows view-only copies in every resident state (nothing is written).
 */

const MAP_MANIFEST = '/assets/world/mappa2/base/manifest.json';
const DESIGN_W = 1600;
const DESIGN_H = 900;
const STATES: Array<{ status: ResidentStatus; injured?: boolean }> = [
  { status: 'available' }, { status: 'away' }, { status: 'exhausted' }, { status: 'injured', injured: true }, { status: 'dead' }, { status: 'available' }, { status: 'available' },
];
const LABEL: React.CSSProperties = {
  fontFamily: 'ui-monospace, monospace', fontSize: 11, letterSpacing: 1, color: '#cfe6f0',
  background: 'rgba(3,14,24,0.85)', borderRadius: 4, padding: '4px 9px', border: '1px solid transparent', cursor: 'pointer',
};

export default function HudRealRosterPage() {
  const { residents } = useRosterKitData();
  const [demo, setDemo] = useState<'real' | 'states' | 'many'>('real');
  const [selected, setSelected] = useState<string | null>(null);
  const [overlay, setOverlay] = useState(false);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  const shown: ResidentState[] = useMemo(() => {
    if (demo === 'real' || residents.length === 0) return residents;
    if (demo === 'many') return Array.from({ length: 14 }, (_, i) => ({ ...residents[i % residents.length], id: `${residents[i % residents.length].id}#m${i}` }));
    return STATES.map((s, i) => {
      const r = residents[i % residents.length];
      return { ...r, id: `${r.id}#${i}`, status: s.status, isInjured: Boolean(s.injured), fatigue: s.status === 'exhausted' ? 92 : r.fatigue, currentHp: s.status === 'dead' ? 0 : r.currentHp };
    });
  }, [demo, residents]);

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <PixiWorldMap manifestPath={MAP_MANIFEST} stageColor="#1675ad" />
      <div style={{ position: 'absolute', left: 0, top: 0, width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
        {overlay && (
          <img src="/mockups/hud-lab/sources/zanara-v2.png" alt="" data-testid="mockup-overlay"
            style={{ position: 'absolute', left: 0, top: 0, width: DESIGN_W, height: 941 * DESIGN_W / 1672, opacity: 0.5, zIndex: 10, pointerEvents: 'none' }} />
        )}
        <div data-testid="hudreal-roster-slot" style={{ position: 'absolute', left: 0, top: 0 }}>
          <HudRealRoster residents={shown} selectedResidentId={selected} onResidentSelect={(id) => setSelected((s) => (s === id ? null : id))} />
        </div>
        <div style={{ position: 'absolute', left: 560, top: 12, display: 'flex', gap: 8, alignItems: 'center', pointerEvents: 'auto' }}>
          {(['real', 'states', 'many'] as const).map((m) => (
            <button key={m} type="button" data-testid={`demo-${m}`} onClick={() => setDemo(m)} style={{ ...LABEL, borderColor: demo === m ? '#d4af37' : 'transparent' }}>{m === 'real' ? 'dati reali' : m === 'states' ? 'stati (copie)' : '14 eroi (copie)'}</button>
          ))}
          <button type="button" data-testid="overlay" onClick={() => setOverlay((o) => !o)} style={{ ...LABEL, borderColor: overlay ? '#d4af37' : 'transparent' }}>mockup sovrapposto</button>
          <span style={LABEL} data-testid="roster-status">residenti: {residents.length} · selezionato: {selected ?? '—'}</span>
        </div>
      </div>
    </div>
  );
}
