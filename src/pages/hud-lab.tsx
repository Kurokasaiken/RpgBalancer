import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { PixiWorldMap, type PixiBootProgress } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';

const MAP_MANIFEST = '/assets/world/mappa2/base/manifest.json';
const STAGE_COLOR = '#1675ad';
const HUD_MANIFEST_URL = '/mockups/hud-lab/manifest.json';

interface HudIteration { id: string; label: string; src: string; provenance: string }
interface HudSlot { id: string; label: string; iterations: HudIteration[] }
interface HudManifest { generated: string; slots: HudSlot[] }

/** Display family of an iteration id (production-* collapses to one group). */
const familyOf = (id: string) =>
  id.startsWith('production') ? 'production' : id === 'mockup1-classic' ? 'mockup1' : id;

const FAMILY_LABELS: Record<string, string> = {
  'zanara-v1': 'Zanara v1',
  'zanara-v2': 'Zanara v2',
  'zanara-v3': 'Zanara v3',
  'board-palette': 'Tavola palette',
  'board-breakdown': 'Tavola breakdown',
  mockup1: 'Mockup 1 (classico)',
  production: 'Produzione /game',
};

interface SlotLayout { style: CSSProperties; controls: 'above' | 'below' }
const SLOT_LAYOUT: Record<string, SlotLayout> = {
  brand: { style: { left: '0.6%', top: '0.6%', width: '27%' }, controls: 'below' },
  resources: { style: { right: '0.8%', top: '0.8%', width: '40%' }, controls: 'below' },
  seal: { style: { right: '0.8%', top: '11.5%', width: '12%' }, controls: 'below' },
  roster: { style: { left: '0.4%', top: '20%', width: '15%' }, controls: 'above' },
  panel: { style: { right: '0.8%', top: '31%', width: '20%' }, controls: 'above' },
  nav: { style: { left: '50%', bottom: '0.6%', width: '56%', transform: 'translateX(-50%)' }, controls: 'above' },
  cornerBL: { style: { left: '0.4%', bottom: '0.6%', width: '18%' }, controls: 'above' },
  cornerBR: { style: { right: '0.6%', bottom: '0.6%', width: '20%' }, controls: 'above' },
};

const ctrlBtn: CSSProperties = {
  padding: '2px 7px',
  border: '1px solid #56758d',
  borderRadius: 4,
  color: '#dff4ff',
  background: 'rgba(10, 26, 38, 0.85)',
  cursor: 'pointer',
  fontSize: 11,
  lineHeight: '16px',
};

const SlotControl = ({
  slot, index, total, onStep, onGallery,
}: {
  slot: HudSlot; index: number; total: number;
  onStep: (delta: number) => void; onGallery: () => void;
}) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 4, pointerEvents: 'auto',
    background: 'rgba(3, 14, 24, 0.82)', border: '1px solid rgba(125,180,220,0.35)',
    borderRadius: 6, padding: '2px 5px', width: 'max-content', maxWidth: '100%',
  }}>
    <span style={{ fontSize: 10, opacity: 0.75, textTransform: 'uppercase', letterSpacing: 0.4 }}>{slot.label}</span>
    <button type="button" style={ctrlBtn} onClick={() => onStep(-1)} disabled={total < 2}>‹</button>
    <span style={{ fontSize: 11, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 190 }}>
      {slot.iterations[index]?.label ?? '—'} <span style={{ opacity: 0.6 }}>{index + 1}/{total}</span>
    </span>
    <button type="button" style={ctrlBtn} onClick={() => onStep(1)} disabled={total < 2}>›</button>
    <button type="button" style={ctrlBtn} onClick={onGallery} title="tutte le iterazioni">≡</button>
  </div>
);

export default function HudLabPage() {
  const [manifest, setManifest] = useState<HudManifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sel, setSel] = useState<Record<string, number>>({});
  const [gallerySlot, setGallerySlot] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [boot, setBoot] = useState<PixiBootProgress | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    fetch(HUD_MANIFEST_URL)
      .then((r) => { if (!r.ok) throw new Error(`manifest ${r.status}`); return r.json(); })
      .then((m: HudManifest) => {
        setManifest(m);
        const init: Record<string, number> = {};
        for (const s of m.slots) init[s.id] = 0;
        setSel(init);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'h' || e.key === 'H') setControlsVisible((v) => !v); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const families = useMemo(() => {
    if (!manifest) return [] as string[];
    const set = new Set<string>();
    for (const s of manifest.slots) for (const it of s.iterations) set.add(familyOf(it.id));
    return [...set];
  }, [manifest]);

  const applyFamily = useCallback((fam: string) => {
    setSel((cur) => {
      const next = { ...cur };
      for (const s of manifest?.slots ?? []) {
        const idx = s.iterations.findIndex((it) => familyOf(it.id) === fam);
        if (idx >= 0) next[s.id] = idx;
      }
      return next;
    });
  }, [manifest]);

  const step = useCallback((slotId: string, delta: number) => {
    setSel((cur) => {
      const s = manifest?.slots.find((x) => x.id === slotId);
      if (!s || s.iterations.length === 0) return cur;
      const n = s.iterations.length;
      return { ...cur, [slotId]: (((cur[slotId] ?? 0) + delta) % n + n) % n };
    });
  }, [manifest]);

  const galleryDef = manifest?.slots.find((s) => s.id === gallerySlot) ?? null;

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <PixiWorldMap
        manifestPath={MAP_MANIFEST}
        stageColor={STAGE_COLOR}
        onBootProgress={setBoot}
        onReady={() => setMapReady(true)}
        onBootError={(err) => setMapError(err.message)}
      />

      {/* Boot feedback — the map pack is heavy and takes seconds to mount */}
      {!mapReady && (
        <div style={{
          position: 'absolute', left: '50%', top: '45%', transform: 'translate(-50%, -50%)', zIndex: 25,
          background: 'rgba(3, 14, 24, 0.85)', border: '1px solid rgba(125,180,220,0.35)',
          borderRadius: 8, padding: '10px 16px', color: '#e5eef7',
          fontFamily: 'ui-monospace, monospace', fontSize: 12, textAlign: 'center',
        }}>
          {mapError
            ? <span style={{ color: '#fca5a5' }}>map boot error: {mapError}</span>
            : <>loading map… {boot ? `${boot.phase} ${boot.loaded}/${boot.total}` : 'manifest'}</>}
        </div>
      )}

      {/* HUD component slots — crops float over the live map; controls interactive */}
      {manifest?.slots.map((slot) => {
        const layout = SLOT_LAYOUT[slot.id];
        if (!layout || slot.iterations.length === 0) return null;
        const it = slot.iterations[sel[slot.id] ?? 0];
        const control = controlsVisible ? (
          <SlotControl
            slot={slot} index={sel[slot.id] ?? 0} total={slot.iterations.length}
            onStep={(d) => step(slot.id, d)}
            onGallery={() => setGallerySlot(slot.id)}
          />
        ) : null;
        return (
          <div key={slot.id} data-hud-lab-slot={slot.id} style={{ position: 'absolute', pointerEvents: 'none', ...layout.style }}>
            {layout.controls === 'above' && control}
            <img
              src={it?.src} alt={it?.label} draggable={false}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
            {layout.controls === 'below' && control}
          </div>
        );
      })}

      {/* Lab chrome */}
      {controlsVisible && (
        <div style={{
          position: 'absolute', left: '50%', top: 10, transform: 'translateX(-50%)', zIndex: 30,
          display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'auto',
          background: 'rgba(3, 14, 24, 0.85)', border: '1px solid rgba(125,180,220,0.35)',
          borderRadius: 8, padding: '4px 8px', color: '#e5eef7',
          fontFamily: 'ui-monospace, monospace', fontSize: 11, maxWidth: '30%',
        }}>
          <span style={{ fontWeight: 700 }}>hud lab</span>
          <select
            aria-label="famiglia mockup"
            onChange={(e) => applyFamily(e.target.value)}
            defaultValue=""
            style={{ background: '#0a1a26', color: '#dff4ff', border: '1px solid #56758d', borderRadius: 4, fontSize: 11, padding: '2px 4px', maxWidth: 150 }}
          >
            <option value="" disabled>famiglia…</option>
            {families.map((f) => (
              <option key={f} value={f}>{FAMILY_LABELS[f] ?? f}</option>
            ))}
          </select>
          <button type="button" style={ctrlBtn} onClick={() => setControlsVisible(false)}>Hide UI (H)</button>
        </div>
      )}
      {!controlsVisible && (
        <button
          type="button" onClick={() => setControlsVisible(true)}
          style={{ ...ctrlBtn, position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 30, pointerEvents: 'auto', opacity: 0.5 }}
        >hud lab (H)</button>
      )}

      {error && (
        <div style={{ position: 'absolute', top: 44, left: '50%', transform: 'translateX(-50%)', color: '#fca5a5', fontSize: 12, fontFamily: 'monospace', zIndex: 40 }}>
          manifest error: {error}
        </div>
      )}

      {/* Iteration gallery for one slot */}
      {galleryDef && (
        <div
          style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 50,
            background: 'rgba(3, 14, 24, 0.94)', borderTop: '1px solid rgba(125,180,220,0.35)',
            padding: '8px 12px', color: '#e5eef7', fontFamily: 'ui-monospace, monospace',
            maxHeight: '42vh', overflowY: 'auto',
          }}
          onClick={() => setGallerySlot(null)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
            <span>{galleryDef.label} — {galleryDef.iterations.length} iterazioni</span>
            <span style={{ opacity: 0.6 }}>click per chiudere</span>
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
            {galleryDef.iterations.map((it, i) => (
              <button
                key={it.id} type="button"
                onClick={(e) => { e.stopPropagation(); setSel((c) => ({ ...c, [galleryDef.id]: i })); setGallerySlot(null); }}
                style={{
                  flex: '0 0 auto', border: i === sel[galleryDef.id] ? '2px solid #7dd3fc' : '1px solid #33586e',
                  borderRadius: 6, background: 'rgba(10,26,38,0.9)', padding: 4, cursor: 'pointer',
                }}
              >
                <img src={it.src} alt={it.label} draggable={false} style={{ display: 'block', maxWidth: 220, maxHeight: 160, width: 'auto', height: 'auto' }} />
                <div style={{ fontSize: 10, marginTop: 3, color: '#dff4ff' }}>{it.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
