import { useCallback, useMemo, useState } from 'react';
import {
  WorldSurfaceStandalone,
  type WorldSurfaceVisualStateOverride,
} from '@/ui/idleVillage/frozen/kits/worldSurfaceKit';
import { PixiWorldMap } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { atmosphereAssets } from '@/ui/idleVillage/config/atmosphereAssets';

/**
 * `/map-benchmark` — dev instrument (not product UI: not translated, not skinned,
 * same precedent as WorldSurfacePerfHud). Mounts one map renderer and replays the
 * same scripted input on it — a mouse drag along a fixed path plus a wheel zoom every
 * second, sent as real DOM events — while measuring frame times with rAF.
 *
 * Only meaningful in a visible window (rAF does not run in a hidden one). Run it in
 * the Tauri app to judge WKWebView.
 */

type Mode = 'dom-full' | 'dom-base' | 'pixi' | 'pixi-full';

const MODES: { id: Mode; label: string }[] = [
  { id: 'dom-full', label: 'DOM · as /game-frame' },
  { id: 'dom-base', label: 'DOM · base layers only' },
  { id: 'pixi', label: 'Pixi · base layers only' },
  { id: 'pixi-full', label: 'Pixi · as /game-frame-pixi' },
];

const RUN_MS = 8000;

const PIXI_BASE_ONLY = { seaPattern: false, coastFoam: false, waves: false, seaMarks: false, cloudShadows: false, birds: false, clouds: false };

interface Result {
  mode: Mode;
  p50: number;
  p95: number;
  worst: number;
  over33: number;
  over50: number;
  frames: number;
}

function pct(sorted: number[], q: number) {
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * q))] ?? 0;
}

export default function MapBenchmarkPage() {
  const [mode, setMode] = useState<Mode>('dom-full');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [pixiStats, setPixiStats] = useState<{ textures: number; textureMB: number } | null>(null);
  const { worldDressing } = DEFAULT_GAME_FRAME_CONFIG;

  const overrides = useMemo<WorldSurfaceVisualStateOverride[]>(
    () => worldDressing.hiddenLayerIds.map((layerId) => ({ type: 'set_visibility' as const, layerId, visible: false })),
    [worldDressing],
  );

  const run = useCallback(async () => {
    const target =
      mode === 'pixi' || mode === 'pixi-full'
        ? document.querySelector<HTMLElement>('[data-testid="pixi-world-canvas"]')
        : document.querySelector<HTMLElement>('[data-testid="world-surface-renderer"]');
    if (!target) return;
    setRunning(true);
    const rect = target.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const mouse = (type: string, x: number, y: number) =>
      target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, buttons: 1 }));

    const deltas: number[] = [];
    let last = 0;
    let nextWheel = 1000;
    let wheelSign = -1;
    const start = performance.now();
    mouse('mousedown', cx, cy);

    await new Promise<void>((resolve) => {
      const frame = (now: number) => {
        if (last) deltas.push(now - last);
        last = now;
        const t = now - start;
        mouse('mousemove', cx + 300 * Math.sin((2 * Math.PI * t) / 4000), cy + 150 * Math.sin((2 * Math.PI * t) / 2000));
        if (t >= nextWheel) {
          target.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, clientX: cx, clientY: cy, deltaY: 240 * wheelSign }));
          wheelSign = -wheelSign;
          nextWheel += 1000;
        }
        if (t < RUN_MS) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });
    mouse('mouseup', cx, cy);

    const sorted = [...deltas].sort((a, b) => a - b);
    setResults((prev) => [
      ...prev.filter((r) => r.mode !== mode),
      {
        mode,
        p50: pct(sorted, 0.5),
        p95: pct(sorted, 0.95),
        worst: sorted[sorted.length - 1] ?? 0,
        over33: deltas.filter((d) => d > 33).length,
        over50: deltas.filter((d) => d > 50).length,
        frames: deltas.length,
      },
    ]);
    setRunning(false);
  }, [mode]);

  const bare = { showSeaMarks: false, showWaves: false, showSeaRipple: false, showSeaPattern: false, showCoastFoam: false, showFoam: false, showGlass: false, breathEnabled: false, showAtmosphere: false };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#02060a', color: '#e5e7eb', fontFamily: 'ui-monospace, monospace' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        {mode === 'pixi' || mode === 'pixi-full' ? (
          <PixiWorldMap
            key={mode}
            manifestPath={worldDressing.manifestPath}
            hiddenLayerIds={worldDressing.hiddenLayerIds}
            safeFit={worldDressing.safeFit.enabled ? worldDressing.safeFit : undefined}
            effects={mode === 'pixi' ? PIXI_BASE_ONLY : undefined}
            onStats={setPixiStats}
          />
        ) : (
          <WorldSurfaceStandalone
            key={mode}
            manifestPath={worldDressing.manifestPath}
            visualStateOverrides={overrides}
            {...(mode === 'dom-base'
              ? bare
              : {
                  showAtmosphere: worldDressing.showAtmosphere,
                  showSeaMarks: worldDressing.showSeaMarks,
                  showWaves: worldDressing.showWaves,
                  showSeaRipple: worldDressing.showSeaRipple,
                  seaRippleConfig: { ...atmosphereAssets.seaRipple, mode: worldDressing.rippleMode, animateFrequency: worldDressing.rippleAnimateFrequency },
                  breathEnabled: worldDressing.breathEnabled,
                  showSeaPattern: worldDressing.showSeaPattern,
                  showFoam: worldDressing.showFoam,
                  showCoastFoam: worldDressing.showCoastFoam,
                  showGlass: worldDressing.showGlass,
                })}
          />
        )}
      </div>

      <div style={{ position: 'absolute', top: 12, left: 12, padding: 12, background: 'rgba(2,6,10,0.88)', border: '1px solid #334155', borderRadius: 6, fontSize: 12, minWidth: 420 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              disabled={running}
              onClick={() => setMode(m.id)}
              style={{ padding: '4px 8px', border: '1px solid #475569', borderRadius: 4, background: m.id === mode ? '#1e3a5f' : 'transparent', color: 'inherit' }}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={running}
          onClick={run}
          style={{ padding: '4px 10px', border: '1px solid #4ade80', borderRadius: 4, background: 'transparent', color: '#4ade80' }}
        >
          {running ? 'Running 8 s…' : `Run benchmark (${RUN_MS / 1000} s drag + zoom)`}
        </button>
        {typeof document !== 'undefined' && document.hidden && (
          <p style={{ color: '#fbbf24' }}>Window hidden: rAF is paused, results would be meaningless.</p>
        )}
        {(mode === 'pixi' || mode === 'pixi-full') && pixiStats && (
          <p style={{ color: '#94a3b8', margin: '6px 0 0' }}>
            Pixi: {pixiStats.textures} textures, ~{pixiStats.textureMB} MB GPU incl. mipmaps
          </p>
        )}
        <table style={{ marginTop: 8, borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr style={{ color: '#94a3b8', textAlign: 'right' }}>
              <th style={{ textAlign: 'left' }}>renderer</th><th>p50 ms</th><th>p95 ms</th><th>worst</th><th>&gt;33</th><th>&gt;50</th><th>frames</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.mode} style={{ textAlign: 'right' }}>
                <td style={{ textAlign: 'left' }}>{MODES.find((m) => m.id === r.mode)?.label}</td>
                <td>{r.p50.toFixed(1)}</td>
                <td style={{ color: r.p95 > 33 ? '#f87171' : r.p95 > 17.5 ? '#fbbf24' : '#4ade80' }}>{r.p95.toFixed(1)}</td>
                <td>{r.worst.toFixed(0)}</td>
                <td>{r.over33}</td>
                <td>{r.over50}</td>
                <td>{r.frames}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
