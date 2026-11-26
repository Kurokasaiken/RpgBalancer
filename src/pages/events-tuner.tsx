/**
 * /events-tuner — visual inspector for the docked Events bar.
 *
 * Since Director ruling 2026-11-26 the bar has no independent proportions:
 * it consumes the same Time shell object, mirrored. This page therefore no
 * longer tunes scale/mirroring; it compares the production components and
 * keeps only test-only overlay/offset/ghost helpers for visual inspection.
 */
import React, { useState } from 'react';
import { HudRealTimeConnected } from '@/ui/idleVillage/hudReal/HudRealTimeConnected';
import { HudRealEventsBar } from '@/ui/idleVillage/hudReal/HudRealEventsBar';
import { HudRealEventsPanel } from '@/ui/idleVillage/hudReal/HudRealEventsPanel';
import { EVENTS_PANEL_CONFIG } from '@/balancing/config/idleVillage/eventsPanelConfig';
import { TIME_SLIM_BAR } from '@/ui/idleVillage/hudReal/timeSlimGeometry';

const FIXTURES = [
  { id: 'invasion', typeId: 'threat', title: 'Goblin host reaches the village', daysLeft: 5 },
  { id: 'harvest-1', typeId: 'harvest', title: 'Wheat harvest ready', daysLeft: 2 },
];

const PANEL_SCALE = TIME_SLIM_BAR.w / EVENTS_PANEL_CONFIG.art.w;

const EventsTunerPage: React.FC = () => {
  const [showPanel, setShowPanel] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [overlay, setOverlay] = useState(true);
  const [ghost, setGhost] = useState(true);

  const eventsStack = (
    <div style={{ position: 'relative', width: TIME_SLIM_BAR.w, height: TIME_SLIM_BAR.h }}>
      <HudRealEventsBar events={FIXTURES} open={showPanel} onToggle={() => setShowPanel((v) => !v)} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: EVENTS_PANEL_CONFIG.behavior.dockTopPx,
          width: EVENTS_PANEL_CONFIG.art.w,
          transform: `scale(${PANEL_SCALE})`,
          transformOrigin: 'top left',
          ['--hud-text-k' as string]: String(1 / PANEL_SCALE),
        }}
      >
        <HudRealEventsPanel events={FIXTURES} open={showPanel} />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0a2a30', padding: 32, color: '#f3ead0', fontFamily: 'Cardo, serif' }}>
      <h1 style={{ fontFamily: 'Marcellus, serif', fontSize: 22, marginBottom: 4 }}>Events shared-shell inspector</h1>
      <p style={{ opacity: 0.75, marginTop: 0 }}>
        Referenza: il componente Tempo invariato. Events usa lo stesso guscio, specchiato geometricamente.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '18px 0', fontSize: 14, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={showPanel} onChange={(e) => setShowPanel(e.target.checked)} />
          mostra anche la tendina aperta
        </label>
        <span style={{ opacity: 0.6, fontSize: 12 }}>solo test — non finisce su /game:</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          sposta X {offsetX}px
          <input type="range" min={-500} max={500} step={1} value={offsetX} onChange={(e) => setOffsetX(parseInt(e.target.value, 10))} style={{ width: 140 }} data-testid="offset-x-slider" />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={overlay} onChange={(e) => setOverlay(e.target.checked)} data-testid="overlay-toggle" />
          sovrapponi al Tempo
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={ghost} onChange={(e) => setGhost(e.target.checked)} data-testid="ghost-toggle" />
          fantasma (50%)
        </label>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 48, position: 'relative', minHeight: 160 }}>
        <div style={{ width: TIME_SLIM_BAR.w, height: TIME_SLIM_BAR.h, position: 'relative', flex: '0 0 auto' }}>
          <HudRealTimeConnected slim />
          {overlay && (
            <div style={{ position: 'absolute', left: offsetX, top: 0, width: TIME_SLIM_BAR.w, height: TIME_SLIM_BAR.h, zIndex: 2, pointerEvents: 'none', opacity: ghost ? 0.55 : 1 }}>
              <div style={{ pointerEvents: 'auto' }}>{eventsStack}</div>
            </div>
          )}
        </div>
        {!overlay && <div style={{ transform: `translateX(${offsetX}px)` }}>{eventsStack}</div>}
      </div>

      <pre style={{ marginTop: 32, padding: 16, background: 'rgba(0,0,0,0.35)', borderRadius: 8, fontSize: 14, lineHeight: 1.5 }}>
{`shell: TIME_SLIM_BAR ${TIME_SLIM_BAR.w}×${TIME_SLIM_BAR.h}
mirror: geometric scaleX(-1) on shared shell layers only
panel scale: ${PANEL_SCALE.toFixed(4)} (fits the legacy panel art to the shared shell width)`}
      </pre>
    </div>
  );
};

export default EventsTunerPage;
