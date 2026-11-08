/**
 * /hud-layout — PLAN-112 F1: the HUD blueprint (B) as flat silhouettes on the live map. No generated art.
 * Reads the contract in hudReal/layout/hudLayoutB.ts. Views: overview (persistent only), context (+ panel), narrative (+ notification).
 * Shows the guides (8 px grid, margin, top-row centre line) and the live coverage figures (DOM bounding boxes, T-101b figure 1).
 */
import { useEffect, useMemo, useState } from 'react';
import { PixiWorldMap } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';
import {
  GRID, M, SLOTS_B, TOP_ROW_H, allowedSteps, blueprintMode, coveragePct, zoomFor, frameFor, resolveAll, resolveSlots, type HudView, type Slot, type Variant,
} from '@/ui/idleVillage/hudReal/layout/hudLayoutB';

const MAP_MANIFEST = '/assets/world/mappa2/base/manifest.json';
const STAGE_COLOR = '#1675ad';
const VIEWS: Array<{ id: HudView; label: string }> = [
  { id: 'overview', label: 'Panoramica' }, { id: 'context', label: 'Contestuale' }, { id: 'narrative', label: 'Narrativa' },
];
const FILL: Record<Slot['mode'], string> = { persistent: 'rgba(18, 140, 112, 0.62)', contextual: 'rgba(214, 150, 40, 0.66)', temporary: 'rgba(214, 150, 40, 0.66)' };
const EDGE: Record<Slot['mode'], string> = { persistent: '#8ff0cf', contextual: '#ffd98a', temporary: '#ffd98a' };


const LONG = Array.from({ length: 14 }, (_, i) => `Riga ${i + 1}: Antiche terrazze d'acqua dove gli alchimisti di corte distillavano la rugiada stellare; chi si bagni alla terza cascata veda il proprio destino.`).join(' ');

/** F1 probe of the scrolling panel (D6c): fixed title, scrolling body, fixed action. Flat silhouette, not final art. */
function ScrollPanelProbe({ h, w, long }: { h: number; w: number; long: boolean }) {
  const [atEnd, setAtEnd] = useState(false);
  const [atStart, setAtStart] = useState(true);
  return (
    <div data-testid="probe-panel" style={{ width: w, height: h, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', color: '#2b2118', font: '15px/21px "EB Garamond", Georgia, serif' }}>
      <div data-testid="probe-title" style={{ flex: 'none', padding: '8px 14px 4px', font: '600 21px/23px Georgia, serif' }}>Le Cascate di Zanara</div>
      <div data-testid="probe-scroll" tabIndex={0} role="region" aria-label="Dettaglio, scorre"
        onScroll={(e) => { const el = e.currentTarget; setAtStart(el.scrollTop <= 1); setAtEnd(el.scrollTop + el.clientHeight >= el.scrollHeight - 1); }}
        style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', padding: '0 14px', scrollbarWidth: 'thin', scrollbarColor: '#b8893a rgba(18,60,48,0.25)',
          WebkitMaskImage: `linear-gradient(to bottom, ${atStart ? '#000' : 'transparent'} 0, #000 14px, #000 calc(100% - 16px), ${atEnd ? '#000' : 'transparent'} 100%)`,
          maskImage: `linear-gradient(to bottom, ${atStart ? '#000' : 'transparent'} 0, #000 14px, #000 calc(100% - 16px), ${atEnd ? '#000' : 'transparent'} 100%)`, outlineOffset: -2 }}>
        <p style={{ margin: 0 }}>{long ? LONG : LONG.slice(0, 160)}</p>
      </div>
      <div data-testid="probe-action" style={{ flex: 'none', margin: '6px 14px 10px', height: 40, borderRadius: 8, background: '#0e5a47', color: '#f3ead0', display: 'grid', placeItems: 'center', font: '600 16px Georgia, serif', letterSpacing: 2 }}>INIZIA</div>
    </div>
  );
}

export default function HudLayoutPage() {
  const params = new URLSearchParams(window.location.search);
  const [view, setView] = useState<HudView>((params.get('view') as HudView) || 'overview');
  const [variant, setVariant] = useState<Variant>((params.get('variant') as Variant) || 'B1');
  const [step, setStep] = useState(Number(params.get('step')) || 1);
  const [guides, setGuides] = useState(params.get('guides') !== '0');
  const [mapOn, setMapOn] = useState(params.get('map') !== '0');
  const longContent = params.get('content') === 'long';
  const [hover, setHover] = useState(false);
  const [win, setWin] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const on = () => setWin({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const mode = blueprintMode(win.w);
  const autoZoom = zoomFor('auto', win.w, win.h);
  const steps = allowedSteps(win.w, win.h, [1, 1.25, 1.5, 2], variant);
  const effStep = steps.includes(step) ? step : 1;
  const f = useMemo(() => frameFor(win.w, win.h, effStep), [win, effStep]);
  const resolved = useMemo(() => resolveSlots(f, variant), [f, variant]);
  const rects = useMemo(() => resolveAll(resolved.slots, f), [resolved, f]);
  const visible = resolved.slots.filter((s) => s.views.includes(view));
  const persistentPct = coveragePct(resolved.slots, f, (s) => s.mode === 'persistent', variant);
  const shownPct = coveragePct(visible, f, undefined, variant);
  const rosterRect = rects.roster;

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0d2230', overflow: 'hidden' }}>
      {mapOn && <PixiWorldMap manifestPath={MAP_MANIFEST} stageColor={STAGE_COLOR} />}
      <div data-testid="hud-layout-canvas" style={{ position: 'absolute', left: 0, top: 0, width: f.W, height: f.H, transform: `scale(${f.scale})`, transformOrigin: 'top left' }}>
        {guides && (
          <>
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)`, backgroundSize: `${GRID * 4}px ${GRID * 4}px`, pointerEvents: 'none' }} />
            <div aria-hidden="true" style={{ position: 'absolute', left: M, top: M, right: M, bottom: M, border: '1px dashed rgba(255, 120, 120, 0.8)', pointerEvents: 'none' }} />
            <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: M + TOP_ROW_H / 2, borderTop: '1px dashed rgba(255, 240, 120, 0.85)', pointerEvents: 'none' }} />
          </>
        )}
        {visible.map((s) => {
          const r = rects[s.id];
          return (
            <div key={s.id} data-testid={`layout-${s.id}`} data-mode={s.mode}
              style={{ position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, boxSizing: 'border-box', background: s.id === 'panel' && params.get('probe') === '1' ? '#e8dcc0' : FILL[s.mode], border: `${s.tier === 1 ? 2 : 1}px solid ${EDGE[s.mode]}`, borderRadius: 6,
                display: 'grid', placeItems: s.id === 'panel' && params.get('probe') === '1' ? 'stretch' : 'center', color: '#fff', font: '600 15px/1.2 system-ui, sans-serif', textShadow: '0 1px 2px rgba(0,0,0,0.9)', textAlign: 'center', padding: s.id === 'panel' && params.get('probe') === '1' ? 0 : 6, overflow: 'hidden' }}
              onMouseEnter={s.id === 'roster' ? () => setHover(true) : undefined} onMouseLeave={s.id === 'roster' ? () => setHover(false) : undefined}>
              {s.id === 'panel' && params.get('probe') === '1' ? <ScrollPanelProbe h={r.h} w={r.w} long={longContent} /> : <span>{s.label}<br /><span style={{ font: '400 12px/1.2 system-ui, sans-serif', opacity: 0.9 }}>{Math.round(r.w)}x{Math.round(r.h)} · liv. {s.tier}</span></span>}
            </div>
          );
        })}
        {(hover || guides) && view !== undefined && (
          <div aria-hidden="true" style={{ position: 'absolute', left: rosterRect.x + rosterRect.w + 6, top: rosterRect.y + 60, width: 200, height: 64, border: '1px dashed #8ff0cf', borderRadius: 6, color: '#8ff0cf', font: '12px system-ui, sans-serif', display: 'grid', placeItems: 'center', background: 'rgba(18,140,112,0.18)' }}>placca al passaggio (fuori ingombro)</div>
        )}
      </div>
      <div style={{ position: 'fixed', left: '50%', top: '38%', transform: 'translateX(-50%)', background: 'rgba(8, 20, 28, 0.9)', color: '#e8f5f0', border: '1px solid #2a5a52', borderRadius: 8, padding: '10px 14px', font: '13px/1.5 system-ui, sans-serif', zIndex: 10, minWidth: 330 }}>
        <div style={{ font: '600 14px system-ui', marginBottom: 6 }}>Pianta {variant} · pixel CSS, zoom del gioco (auto = x{autoZoom})</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          {(['B1', 'B2', 'B3'] as Variant[]).map((v) => <button key={v} data-variant={v} onClick={() => setVariant(v)} style={{ padding: '2px 10px', borderRadius: 6, border: '1px solid #b8893a', background: variant === v ? '#b8893a' : 'transparent', color: '#fff', cursor: 'pointer' }}>{v}</button>)}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {VIEWS.map((v) => <button key={v.id} data-view={v.id} onClick={() => setView(v.id)} style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid #3a7a6e', background: view === v.id ? '#1d9e75' : 'transparent', color: '#fff', cursor: 'pointer' }}>{v.label}</button>)}
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <label><input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} /> guide</label>
          <label><input type="checkbox" checked={mapOn} onChange={(e) => setMapOn(e.target.checked)} /> mappa</label>
          <span>interfaccia{' '}
            {[1, 1.25, 1.5, 2].map((s) => <button key={s} disabled={!steps.includes(s)} data-step={s} onClick={() => setStep(s)} style={{ marginLeft: 4, padding: '1px 7px', borderRadius: 5, border: '1px solid #3a7a6e', background: effStep === s ? '#1d9e75' : 'transparent', color: steps.includes(s) ? '#fff' : '#6b7f7a', cursor: steps.includes(s) ? 'pointer' : 'not-allowed' }}>{Math.round(s * 100)}%</button>)}
          </span>
        </div>
        <div style={{ marginTop: 8 }} data-testid="layout-figures">
          Ingombro riquadri: <b>fissi {persistentPct.toFixed(1)}%</b> (tetto 18%) · in vista {shownPct.toFixed(1)}%<br />
          Tela {Math.round(f.W)}x{Math.round(f.H)} px CSS · zoom x{f.scale.toFixed(2)} · testo 16 → {(16 * f.scale).toFixed(1)} px reali<br />{mode === 'base-fallback' ? <b style={{ color: '#ffd98a' }}>Sotto 768 px: HUD base con il suo mobile-fit (la pianta non si applica). </b> : null}<br />Riflusso: barra alta {resolved.topReflow ? 'SI' : 'no'} · riga bassa {resolved.bottomReflow ? 'SI' : 'no'} · pannello a scorrimento {resolved.panelScrolls ? 'SI' : 'no'}
        </div>
        <div style={{ marginTop: 6, font: '12px system-ui', opacity: 0.85 }}>Verde = sempre visibile · ambra = a evento · rosso = margine 24 · giallo = linea centrale della barra alta</div>
      </div>
    </div>
  );
}
