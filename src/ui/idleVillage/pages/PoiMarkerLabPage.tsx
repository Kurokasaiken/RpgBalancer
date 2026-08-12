/**
 * PoiMarkerLabPage — ad-hoc TestHub page for the POI "opportunity" marker.
 *
 * Two reading modes:
 *  1. In-context: markers placed over the canonical Wanderlust world surface
 *     (frozen worldSurfaceKit), which is the only honest test — the whole point
 *     of the rework is that the marker must belong to that painted map.
 *  2. Matrix: 3 types x 5 states on a neutral field, to compare the grammar.
 *
 * Clock integration: ClockWidgetStandalone for deadline-driven timing tests.
 * Route: /poi-marker-lab
 */
import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { WorldSurfaceStandalone } from '@/ui/idleVillage/frozen/kits/worldSurfaceKit';
import { ClockWidgetStandalone } from '@/ui/idleVillage/frozen/kits/clockKit';
import DayNightPoiSkin from '../components/minimal/DayNightPoiSkin';
import PoiMarker, {
  poiMarkerStyles,
  type PoiMarkerProps,
  type PoiState,
  type PoiType,
} from '../components/poi/PoiMarker';
import PoiMarkerRunic, { poiRunicStyles } from '../components/poi/PoiMarkerRunic';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

const TYPES: PoiType[] = ['quest', 'job', 'event'];
const STATES: PoiState[] = ['new', 'available', 'assigned', 'expiring', 'expired'];
const IMPORTANCES = ['normal', 'important', 'critical'] as const;
const VARIANTS = ['runic', 'baseline'] as const;

type Importance = (typeof IMPORTANCES)[number];
type Variant = (typeof VARIANTS)[number];

const MARKERS: Record<Variant, React.FC<PoiMarkerProps>> = {
  baseline: PoiMarker,
  runic: PoiMarkerRunic,
};

/** Placements over the map, in percentages of the viewport. */
const MAP_PLACEMENTS: Array<{ id: string; type: PoiType; state: PoiState; top: string; left: string }> = [
  { id: 'plain-quest', type: 'quest', state: 'available', top: '30%', left: '26%' },
  { id: 'village-job', type: 'job', state: 'assigned', top: '52%', left: '48%' },
  { id: 'ridge-event', type: 'event', state: 'expiring', top: '36%', left: '70%' },
  { id: 'south-quest', type: 'quest', state: 'new', top: '70%', left: '34%' },
  { id: 'coast-job', type: 'job', state: 'available', top: '66%', left: '66%' },
];

export const PoiMarkerLabPage: React.FC = () => {
  const { t } = useTranslation('idleVillage');
  const label = useCallback((key: string) => String(t(`poiMarkerLab.${key}` as never)), [t]);

  // Marker controls
  const [variant, setVariant] = useState<Variant>('runic');
  const [type, setType] = useState<PoiType>('quest');
  const [state, setState] = useState<PoiState>('available');
  const [importance, setImportance] = useState<Importance>('normal');
  const [progress, setProgress] = useState(0.62);
  const [size, setSize] = useState(112);
  const [counterClockwise, setCounterClockwise] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Clock state for deadline-driven testing
  const [isPaused, setIsPaused] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [currentDay, setCurrentDay] = useState(1);
  const [hour, setHour] = useState(6);
  const [progressFraction, setProgressFraction] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clock tick loop
  useEffect(() => {
    if (isPaused) {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }
    tickRef.current = setInterval(() => {
      setHour((h) => {
        if (h >= 23) {
          setCurrentDay((d) => d + 1);
          return 0;
        }
        return h + 1;
      });
      setProgressFraction((p) => {
        const next = p + 1 / 24;
        return next >= 1 ? 0 : next;
      });
    }, 1000 / speed);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [isPaused, speed]);

  const timerDirection = counterClockwise ? 'counterclockwise' : 'clockwise';
  const Marker = MARKERS[variant];

  const handleSelect = useCallback(
    (id: string, poiType: PoiType, poiState: PoiState) => {
      setSelectedId((current) => (current === id ? null : id));
      trackTelemetryEvent('poi_select', {
        data: { poiId: id, poiType, poiState },
        context: 'poi-marker-lab',
        timestamp: Date.now(),
        metadata: { surface: 'lab' },
      });
    },
    [],
  );

  const controls = useMemo(
    () => (
      <div className="poi-lab__controls">
        <fieldset>
          <legend>{label('variant')}</legend>
          {VARIANTS.map((value) => (
            <button
              key={value}
              type="button"
              data-active={variant === value}
              onClick={() => setVariant(value)}
            >
              {label(`variants.${value}`)}
            </button>
          ))}
        </fieldset>

        <fieldset>
          <legend>{label('type')}</legend>
          {TYPES.map((value) => (
            <button
              key={value}
              type="button"
              data-active={type === value}
              onClick={() => setType(value)}
            >
              {label(`types.${value}`)}
            </button>
          ))}
        </fieldset>

        <fieldset>
          <legend>{label('state')}</legend>
          {STATES.map((value) => (
            <button
              key={value}
              type="button"
              data-active={state === value}
              onClick={() => setState(value)}
            >
              {label(`states.${value}`)}
            </button>
          ))}
        </fieldset>

        <fieldset>
          <legend>{label('importance')}</legend>
          {IMPORTANCES.map((value) => (
            <button
              key={value}
              type="button"
              data-active={importance === value}
              onClick={() => setImportance(value)}
            >
              {label(`importances.${value}`)}
            </button>
          ))}
        </fieldset>

        <label className="poi-lab__slider">
          <span>{`${label('progress')} · ${Math.round(progress * 100)}%`}</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(progress * 100)}
            onChange={(e) => setProgress(Number(e.target.value) / 100)}
          />
        </label>

        <label className="poi-lab__slider">
          <span>{`${label('size')} · ${size}px`}</span>
          <input
            type="range"
            min={28}
            max={180}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
        </label>

        <label className="poi-lab__toggle">
          <input
            type="checkbox"
            checked={counterClockwise}
            onChange={(e) => setCounterClockwise(e.target.checked)}
          />
          <span>{label('counterClockwise')}</span>
        </label>

        <label className="poi-lab__toggle">
          <input
            type="checkbox"
            checked={showMap}
            onChange={(e) => setShowMap(e.target.checked)}
          />
          <span>{label('showMap')}</span>
        </label>
      </div>
    ),
    [label, variant, type, state, importance, progress, size, counterClockwise, showMap],
  );

  const pageContent = (
    <div className="poi-lab">
      <style>{poiMarkerStyles}</style>
      <style>{poiRunicStyles}</style>
      <style>{labPageStyles}</style>

      <header className="poi-lab__header">
        <h1>{label('title')}</h1>
        <p>{label('subtitle')}</p>
      </header>

      {/* Clock widget for deadline-driven timing tests */}
      <ClockWidgetStandalone
        currentDay={currentDay}
        isPaused={isPaused}
        speedMultiplier={speed}
        defaultSpeedMultiplier={1}
        maxSpeedMultiplier={8}
        tickIntervalMs={1000}
        warmupDelayMs={0}
        accentHex="#f59e0b"
        onSpeedChange={setSpeed}
        onTogglePause={() => setIsPaused(!isPaused)}
        showTimingDetails={false}
      />

      {controls}

      <section className="poi-lab__stage" aria-label={label('inContext')}>
        {showMap && <WorldSurfaceStandalone className="poi-lab__map" />}
        <div className="poi-lab__overlay">
          {MAP_PLACEMENTS.map((placement) => (
            <div
              key={placement.id}
              className="poi-lab__pin"
              style={{ top: placement.top, left: placement.left }}
            >
              <Marker
                type={placement.type}
                state={placement.state}
                progress={placement.state === 'assigned' || placement.state === 'expiring' ? progress : 1}
                importance={placement.state === 'expiring' ? 'critical' : 'normal'}
                size={size}
                timerDirection={timerDirection}
                selected={selectedId === placement.id}
                onClick={() => handleSelect(placement.id, placement.type, placement.state)}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="poi-lab__matrix" aria-label={label('matrix')}>
        <h2>{label('matrix')}</h2>
        <div className="poi-lab__grid">
          <div />
          {STATES.map((s) => (
            <div key={s} className="poi-lab__col-head">
              {label(`states.${s}`)}
            </div>
          ))}
          {TYPES.map((rowType) => (
            <React.Fragment key={rowType}>
              <div className="poi-lab__row-head">{label(`types.${rowType}`)}</div>
              {STATES.map((cellState) => (
                <div key={`${rowType}-${cellState}`} className="poi-lab__cell">
                  <Marker
                    type={rowType}
                    state={cellState}
                    progress={
                      cellState === 'assigned' ? 0.62 : cellState === 'expiring' ? 0.18 : 1
                    }
                    importance={cellState === 'expiring' ? 'critical' : 'normal'}
                    size={96}
                    timerDirection={timerDirection}
                  />
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="poi-lab__playground" aria-label={label('playground')}>
        <h2>{label('playground')}</h2>
        <div className="poi-lab__playground-body">
          <Marker
            type={type}
            state={state}
            progress={progress}
            importance={importance}
            size={size}
            timerDirection={timerDirection}
            selected={selectedId === 'playground'}
            onClick={() => handleSelect('playground', type, state)}
          />
          <div className="poi-lab__scale">
            {[112, 72, 48, 32].map((s) => (
              <Marker
                key={s}
                type={type}
                state={state}
                progress={progress}
                importance={importance}
                size={s}
                timerDirection={timerDirection}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="poi-lab__reference" aria-label="Reference: Day/Night POI Cycle">
        <h2>Reference: Day/Night Cycle POI (for comparison)</h2>
        <p style={{ fontSize: '11px', opacity: 0.65, marginBottom: '16px' }}>
          This is how a real POI behaves with the clock. Press Play above to see the halo fill/empty.
          The cycle is 24 hours; paused state shows frozen glass effect.
        </p>
        <div className="poi-lab__reference-body">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '9px', opacity: 0.6, marginBottom: '8px' }}>Day (running)</div>
                <DayNightPoiSkin isDayPhase={true} cycleProgress={progressFraction} isPaused={isPaused} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '9px', opacity: 0.6, marginBottom: '8px' }}>Night (running)</div>
                <DayNightPoiSkin isDayPhase={false} cycleProgress={progressFraction} isPaused={isPaused} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '9px', opacity: 0.6, marginBottom: '8px' }}>Paused</div>
                <DayNightPoiSkin isDayPhase={true} cycleProgress={0.5} isPaused={true} />
              </div>
            </div>
            <div style={{ fontSize: '10px', opacity: 0.55, maxWidth: '60ch' }}>
              Notice: the ring **fills as time passes**, the icon shows phase (☀️ day / 🌙 night),
              bloom intensifies when running, and frosted glass appears on pause. This is the POI contract.
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  return pageContent;
};

/** Page chrome only — the marker's own material lives in `poiMarkerStyles`. */
const labPageStyles = `
.poi-lab {
  min-height: 100vh;
  background: #0b0e0c;
  color: #e7e1cf;
  font-family: system-ui, sans-serif;
  padding: 20px 24px 64px;
}
.poi-lab__header h1 { margin: 0; font-size: 20px; letter-spacing: .04em; }
.poi-lab__header p { margin: 4px 0 16px; font-size: 12px; opacity: .65; max-width: 70ch; }
.poi-lab__controls {
  display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end;
  padding: 12px; border: 1px solid #2b2f27; border-radius: 8px; background: #12150f;
}
.poi-lab__controls fieldset { border: 0; margin: 0; padding: 0; display: flex; gap: 6px; flex-wrap: wrap; }
.poi-lab__controls legend { font-size: 10px; text-transform: uppercase; letter-spacing: .12em; opacity: .55; padding: 0 0 4px; }
.poi-lab__controls button {
  background: #1c211a; color: #ddd6c2; border: 1px solid #333a2e;
  border-radius: 4px; padding: 4px 10px; font-size: 12px; cursor: pointer;
}
.poi-lab__controls button[data-active="true"] { background: #4a3a16; border-color: #b88b30; color: #ffe3a0; }
.poi-lab__slider { display: flex; flex-direction: column; gap: 4px; font-size: 11px; opacity: .8; }
.poi-lab__toggle { display: flex; gap: 6px; align-items: center; font-size: 11px; opacity: .8; }
.poi-lab__stage {
  position: relative; margin-top: 20px; height: 62vh; min-height: 420px;
  border: 1px solid #2b2f27; border-radius: 8px; overflow: hidden; background: #172019;
}
.poi-lab__map { position: absolute; inset: 0; }
.poi-lab__overlay { position: absolute; inset: 0; pointer-events: none; }
.poi-lab__pin { position: absolute; transform: translate(-50%, -50%); pointer-events: auto; }
.poi-lab__matrix, .poi-lab__playground { margin-top: 32px; }
.poi-lab__matrix h2, .poi-lab__playground h2 { font-size: 13px; letter-spacing: .1em; text-transform: uppercase; opacity: .6; margin: 0 0 12px; }
.poi-lab__grid { display: grid; grid-template-columns: 90px repeat(5, 1fr); gap: 8px; align-items: center; }
.poi-lab__col-head, .poi-lab__row-head { font-size: 11px; opacity: .55; text-align: center; }
.poi-lab__row-head { text-align: left; }
.poi-lab__cell {
  display: grid; place-items: center; padding: 10px; border-radius: 6px;
  background: radial-gradient(circle at 50% 40%, #2b3327, #151a13);
}
.poi-lab__playground-body { display: flex; gap: 40px; align-items: center; flex-wrap: wrap; padding: 20px; border-radius: 8px; background: radial-gradient(circle at 40% 35%, #2b3327, #101410); }
.poi-lab__scale { display: flex; gap: 20px; align-items: center; }
.poi-lab__reference { margin-top: 32px; padding: 16px; border: 1px solid #2b2f27; border-radius: 8px; background: #0f1208; }
.poi-lab__reference h2 { font-size: 13px; letter-spacing: .1em; text-transform: uppercase; opacity: .6; margin: 0 0 12px; }
.poi-lab__reference-body { padding: 16px; border-radius: 6px; background: radial-gradient(circle at 50% 40%, #2b3327, #151a13); }
`;

export default PoiMarkerLabPage;
