import { useEffect, useMemo, useState } from 'react';
import { PixiWorldMap } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';
import { useRosterKitData } from '@/ui/idleVillage/frozen/kits/rosterKit';
import type { ResidentState, ResidentStatus } from '@/engine/game/idleVillage/TimeEngine';
import { ZanaraRoster } from '@/ui/idleVillage/zanara/ZanaraRoster';

/**
 * Lab for ZanaraRoster: the real roster data (same bundle as the production
 * roster) in the Zanara column, in its /hud-target slot on the live map.
 * "Stati" shows view-only copies of the residents in every real state, and
 * extra copies to exercise the scroll; nothing is written to the store.
 */

const MAP_MANIFEST = '/assets/world/mappa2/base/manifest.json';
const DESIGN_W = 1600;
const DESIGN_H = 900;
const SLOT = { x: 16, y: 96 };
const STATES: Array<{ status: ResidentStatus; injured?: boolean }> = [
  { status: 'available' }, { status: 'away' }, { status: 'exhausted' }, { status: 'injured', injured: true }, { status: 'dead' }, { status: 'available' }, { status: 'available' },
];
const LABEL: React.CSSProperties = {
  fontFamily: 'ui-monospace, monospace', fontSize: 11, letterSpacing: 1, color: '#cfe6f0',
  background: 'rgba(3,14,24,0.85)', borderRadius: 4, padding: '4px 9px', border: '1px solid transparent', cursor: 'pointer',
};

export default function HudZanaraRosterPage() {
  const { residents } = useRosterKitData();
  const [demo, setDemo] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(0);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const shown: ResidentState[] = useMemo(() => {
    if (!demo || residents.length === 0) return residents;
    return STATES.map((s, i) => {
      const r = residents[i % residents.length];
      return { ...r, id: `${r.id}#${i}`, status: s.status, isInjured: Boolean(s.injured), fatigue: s.status === 'exhausted' ? 92 : r.fatigue, currentHp: s.status === 'dead' ? 0 : r.currentHp };
    });
  }, [demo, residents]);

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <PixiWorldMap manifestPath={MAP_MANIFEST} stageColor="#1675ad" />
      <div style={{ position: 'absolute', left: 0, top: 0, width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <div data-testid="zanara-roster-slot" style={{ position: 'absolute', left: SLOT.x, top: SLOT.y }}>
          <ZanaraRoster residents={shown} lockedResidentIds={[]} onResidentSelect={setSelected} onExpand={() => setExpanded((n) => n + 1)} />
        </div>
        <div style={{ position: 'absolute', left: 260, top: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" data-testid="demo-states" onClick={() => setDemo((d) => !d)}
            style={{ ...LABEL, borderColor: demo ? '#d4af37' : 'transparent' }}>{demo ? 'dati reali' : 'stati + scroll (copie di prova)'}</button>
          <span style={LABEL} data-testid="roster-status">residenti: {residents.length} · selezionato: {selected ?? '—'} · espandi: {expanded}</span>
        </div>
      </div>
    </div>
  );
}
