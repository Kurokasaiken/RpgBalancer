import { useEffect, useMemo, useState } from 'react';
import { PixiWorldMap, type PixiBootProgress, type PixiMapTune, type PixiRegionHover, type PixiWorldMapEffects } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';

const MANIFEST_PATH = '/assets/world/mappa2/base/manifest.json';
const REGIONS_BASE = '/assets/world/mappa2/base';
const STAGE_COLOR = '#1675ad';
const SEA_PATTERN_BASE = { patternScale: 1150, lineOpacity: 0.21, lineWidth: 1, motionAmount: 6.5, motionPeriod: 5, motionAngle: 200, lineColor: '#8bbac2', baseColor: '#0b5c6b', motionEnabled: true };
const COAST_FOAM_BASE = { strength: 0.4, dissolveStartWorldPx: 3, dissolveEndWorldPx: 60, crestSpeedWorldPxPerSecond: 9, color: [0.93, 0.98, 0.96] as [number, number, number] };

const FOCUS_PRESETS = [
  { id: 'overview', label: 'Overview', x: 0.5, y: 0.5 },
  { id: 'waterfall', label: 'Cascata', x: 0.43, y: 0.25 },
  { id: 'bayou', label: 'Bayou', x: 0.25, y: 0.77 },
  { id: 'volcano', label: 'Vulcano', x: 0.78, y: 0.82 },
  { id: 'archipelago', label: 'Arcipelago', x: 0.11, y: 0.68 },
] as const;

const EFFECT_TOGGLES: { id: keyof PixiWorldMapEffects; label: string }[] = [
  { id: 'seaPattern', label: 'sea' },
  { id: 'coastFoam', label: 'foam' },
  { id: 'clouds', label: 'clouds' },
  { id: 'cloudShadows', label: 'shadows' },
  { id: 'birds', label: 'birds' },
  { id: 'seabed', label: 'seabed' },
  { id: 'wonders', label: 'wonders' },
  { id: 'landLife', label: 'canopy' },
];

const LAB_TABS = ['scene', 'water', 'sky', 'land'] as const;
type LabTab = typeof LAB_TABS[number];
const TAB_EFFECTS: Record<LabTab, (keyof PixiWorldMapEffects)[]> = {
  scene: ['wonders'],
  water: ['seaPattern', 'coastFoam', 'seabed'],
  sky: ['clouds', 'cloudShadows', 'birds'],
  land: ['landLife'],
};

interface LabDefaults {
  wonderEveryS: number;
  forestSway: number;
  cloudOpacityScale: number;
  cloudTintAmount: number;
  seaTone: number;
  seaLineColor: string;
  seaLineOpacity: number;
  foamColor: string;
  foamStrength: number;
  waterfallOn: number;
  waterfallFlowSpeed: number;
  waterfallFlowStrength: number;
  waterfallMist: number;
  waterfallRipples: number;
  waterfallFoam: number;
  waterfallPainted: number;
  swRiversOn: number;
  swRiverFlowSpeed: number;
  swRiverFlowStrength: number;
  swLakeShimmer: number;
  swConfluenceFoam: number;
  landLifeOn: number;
  landLifeLeaves: number;
  landLifeMotes: number;
  landLifeFlutter: number;
  landLifeSpeed: number;
  landLifeOpacity: number;
}

const CODE_DEFAULTS: LabDefaults = {
  wonderEveryS: 45,
  forestSway: 2.2,
  cloudOpacityScale: 1.4,
  cloudTintAmount: 0.61,
  seaTone: 0,
  seaLineOpacity: 0.14,
  foamStrength: 0.34,
  waterfallOn: 1,
  waterfallFlowSpeed: 130,
  waterfallFlowStrength: 0.34,
  waterfallMist: 0.45,
  waterfallRipples: 0.7,
  waterfallFoam: 0.3,
  waterfallPainted: 1,
  swRiversOn: 1,
  swRiverFlowSpeed: 1.0,
  swRiverFlowStrength: 0.24,
  swLakeShimmer: 0.22,
  swConfluenceFoam: 0.25,
  landLifeOn: 1,
  landLifeLeaves: 0.45,
  landLifeMotes: 0.55,
  landLifeFlutter: 0,
  landLifeSpeed: 1,
  landLifeOpacity: 0.55,
  seaLineColor: '#8bbac2',
  foamColor: '#eefcf6',
};

const DEFAULT_EFFECTS: PixiWorldMapEffects = {
  seaPattern: true,
  coastFoam: true,
  waves: false,
  seaMarks: false,
  cloudShadows: true,
  birds: true,
  clouds: true,
  seabed: true,
  wonders: true,
  landLife: true,
};

interface FrameStats { p50: number; p95: number; worst: number; frames: number }

/** Mixes two CSS hex colors by `amount` and returns the resulting hex. */
const mixHex = (from: string, to: string, amount: number): string => {
  const a = Number.parseInt(from.slice(1), 16);
  const b = Number.parseInt(to.slice(1), 16);
  const mix = ((a >> 16 & 255) * (1 - amount) + (b >> 16 & 255) * amount) << 16
    | (((a >> 8 & 255) * (1 - amount) + (b >> 8 & 255) * amount) << 8)
    | ((a & 255) * (1 - amount) + (b & 255) * amount);
  return `#${Math.round(mix).toString(16).padStart(6, '0')}`;
};

/** Converts a CSS hex color to Pixi's 0..1 RGB uniforms. */
const hexToRgb01 = (hex: string): [number, number, number] => {
  const n = Number.parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/** `/mappa2-lab` — runtime testbed for the generated mappa2 pack, on the production Pixi renderer. */
export default function Mappa2LabPage() {
  const [stats, setStats] = useState<{ textures: number; textureMB: number } | null>(null);
  const [frameStats, setFrameStats] = useState<FrameStats>({ p50: 0, p95: 0, worst: 0, frames: 0 });
  const [boot, setBoot] = useState<PixiBootProgress | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ x: number; y: number; n: number } | null>(null);
  const [hover, setHover] = useState<PixiRegionHover | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<LabTab>('scene');
  const [effects, setEffects] = useState<PixiWorldMapEffects>(DEFAULT_EFFECTS);
  const [wonderEveryS, setWonderEveryS] = useState(CODE_DEFAULTS.wonderEveryS);
  const [forestSway, setForestSway] = useState(CODE_DEFAULTS.forestSway);
  const [cloudOpacityScale, setCloudOpacityScale] = useState(CODE_DEFAULTS.cloudOpacityScale);
  const [cloudTintAmount, setCloudTintAmount] = useState(CODE_DEFAULTS.cloudTintAmount);
  const [seaTone, setSeaTone] = useState(CODE_DEFAULTS.seaTone);
  const [seaLineColor, setSeaLineColor] = useState(CODE_DEFAULTS.seaLineColor);
  const [seaLineOpacity, setSeaLineOpacity] = useState(CODE_DEFAULTS.seaLineOpacity);
  const [foamColor, setFoamColor] = useState(CODE_DEFAULTS.foamColor);
  const [foamStrength, setFoamStrength] = useState(CODE_DEFAULTS.foamStrength);
  const [waterfallOn, setWaterfallOn] = useState(CODE_DEFAULTS.waterfallOn === 1);
  const [waterfallFlowSpeed, setWaterfallFlowSpeed] = useState(CODE_DEFAULTS.waterfallFlowSpeed);
  const [waterfallFlowStrength, setWaterfallFlowStrength] = useState(CODE_DEFAULTS.waterfallFlowStrength);
  const [waterfallMist, setWaterfallMist] = useState(CODE_DEFAULTS.waterfallMist);
  const [waterfallRipples, setWaterfallRipples] = useState(CODE_DEFAULTS.waterfallRipples);
  const [waterfallFoam, setWaterfallFoam] = useState(CODE_DEFAULTS.waterfallFoam);
  const [waterfallPainted, setWaterfallPainted] = useState(CODE_DEFAULTS.waterfallPainted === 1);
  const [swRiversOn, setSwRiversOn] = useState(CODE_DEFAULTS.swRiversOn === 1);
  const [swRiverFlowSpeed, setSwRiverFlowSpeed] = useState(CODE_DEFAULTS.swRiverFlowSpeed);
  const [swRiverFlowStrength, setSwRiverFlowStrength] = useState(CODE_DEFAULTS.swRiverFlowStrength);
  const [swLakeShimmer, setSwLakeShimmer] = useState(CODE_DEFAULTS.swLakeShimmer);
  const [swConfluenceFoam, setSwConfluenceFoam] = useState(CODE_DEFAULTS.swConfluenceFoam);
  const [landLifeOn, setLandLifeOn] = useState(CODE_DEFAULTS.landLifeOn === 1);
  const [landLifeLeaves, setLandLifeLeaves] = useState(CODE_DEFAULTS.landLifeLeaves);
  const [landLifeMotes, setLandLifeMotes] = useState(CODE_DEFAULTS.landLifeMotes);
  const [landLifeFlutter, setLandLifeFlutter] = useState(CODE_DEFAULTS.landLifeFlutter);
  const [landLifeSpeed, setLandLifeSpeed] = useState(CODE_DEFAULTS.landLifeSpeed);
  const [landLifeOpacity, setLandLifeOpacity] = useState(CODE_DEFAULTS.landLifeOpacity);
  const [savedDefaultsNote, setSavedDefaultsNote] = useState('');
  const [wonderRequest, setWonderRequest] = useState(0);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key.toLowerCase() === 'h' && target?.tagName !== 'INPUT') setControlsVisible((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const deltas: number[] = [];
    const tick = (now: number) => {
      if (last) {
        deltas.push(now - last);
        if (deltas.length > 900) deltas.shift();
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    const report = window.setInterval(() => {
      const sorted = [...deltas].sort((a, b) => a - b);
      const p50 = sorted[Math.floor((sorted.length - 1) * 0.5)] ?? 0;
      const p95 = sorted[Math.floor((sorted.length - 1) * 0.95)] ?? 0;
      setFrameStats({ p50, p95, worst: sorted[sorted.length - 1] ?? 0, frames: deltas.length });
    }, 1000);
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.clearInterval(report); };
  }, []);

  const seaPatternConfig = useMemo(
    () => ({ ...SEA_PATTERN_BASE, lineColor: seaLineColor, lineOpacity: seaLineOpacity }),
    [seaLineColor, seaLineOpacity],
  );
  const coastFoamConfig = useMemo(
    () => ({ ...COAST_FOAM_BASE, color: hexToRgb01(foamColor), strength: foamStrength }),
    [foamColor, foamStrength],
  );

  const tune: Partial<PixiMapTune> = {
    cloudParallax: 1,
    cloudMorph: 1,
    smokeAmount: 0.8,
    wonderEveryS,
    deepSeaFadePx: 360,
    forestSway,
    regionLinePx: 8,
  };

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <PixiWorldMap
        manifestPath={MANIFEST_PATH}
        stageColor={STAGE_COLOR}
        tune={tune}
        seabed={effects.seabed ? { opacity: 0.45, parallax: 0.82 } : undefined}
        effects={effects}
        cloudOpacityScale={cloudOpacityScale}
        cloudTint={mixHex('#ffffff', '#bfeff2', cloudTintAmount)}
        seaTone={seaTone}
        seaPatternConfig={seaPatternConfig}
        coastFoamConfig={coastFoamConfig}
        waterfallConfig={{ enabled: waterfallOn, flowSpeed: waterfallFlowSpeed, flowStrength: waterfallFlowStrength, mistAmount: waterfallMist, ripples: waterfallRipples, foamPulse: waterfallFoam, paintedFlow: waterfallPainted }}
        secondaryWaterConfig={{ riversOn: swRiversOn, riverFlowSpeed: swRiverFlowSpeed, riverFlowStrength: swRiverFlowStrength, lakeShimmer: swLakeShimmer, confluenceFoam: swConfluenceFoam }}
        landLifeConfig={{ enabled: landLifeOn, leaves: landLifeLeaves, motes: landLifeMotes, flutter: landLifeFlutter, speed: landLifeSpeed, opacity: landLifeOpacity }}
        regions={{ assetBase: REGIONS_BASE, onHover: setHover }}
        focusRequest={focusRequest}
        wonderRequest={wonderRequest}
        onStats={setStats}
        onBootProgress={setBoot}
        onReady={() => setReady(true)}
        onBootError={(err) => setError(err.message)}
      />

      {controlsVisible ? (
      <div
        data-testid="mappa2-lab-hud"
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 20,
          padding: 12,
          width: 390,
          color: '#e5eef7',
          background: 'rgba(3, 14, 24, 0.88)',
          border: '1px solid rgba(125, 180, 220, 0.35)',
          borderRadius: 8,
          fontFamily: 'ui-monospace, monospace',
          fontSize: 12,
          pointerEvents: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontWeight: 700 }}>
          <span>mappa2 lab</span>
          <button type="button" onClick={() => setControlsVisible(false)} style={{ padding: '2px 6px', border: '1px solid #56758d', borderRadius: 4, color: 'inherit', background: '#172b40', cursor: 'pointer' }}>Hide test UI</button>
        </div>
        <div>manifest: {MANIFEST_PATH}</div>
        <div>boot: {boot ? `${boot.phase} ${boot.loaded}/${boot.total}` : 'manifest'}</div>
        <div>ready: {ready ? 'yes' : 'no'} · textures: {stats ? `${stats.textures} (~${stats.textureMB} MB)` : '—'}</div>
        <div>frame: p50 {frameStats.p50.toFixed(1)}ms · p95 {frameStats.p95.toFixed(1)}ms · worst {frameStats.worst.toFixed(0)}ms · n {frameStats.frames}</div>
        <div>region: {hover?.region.id ?? '—'} @ {hover ? `${Math.round(hover.x)},${Math.round(hover.y)}` : '—'}</div>
        {error && <div style={{ color: '#fca5a5', marginTop: 6 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
          {LAB_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '4px 6px',
                border: '1px solid #56758d',
                borderRadius: 4,
                color: activeTab === tab ? '#dff4ff' : '#9fb8c8',
                background: activeTab === tab ? '#17415f' : 'rgba(20, 55, 80, 0.45)',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {TAB_EFFECTS[activeTab].map((id) => {
            const fx = EFFECT_TOGGLES.find((item) => item.id === id)!;
            return (
              <label key={fx.id} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={effects[fx.id]}
                  onChange={(event) => setEffects((current) => ({ ...current, [fx.id]: event.target.checked }))}
                />
                {fx.label}
              </label>
            );
          })}
        </div>

        {activeTab === 'scene' && (
          <>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 10 }}>
              {FOCUS_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setFocusRequest((current) => ({ x: preset.x, y: preset.y, n: (current?.n ?? 0) + 1 }))}
                  style={{ padding: '4px 7px', border: '1px solid #56758d', borderRadius: 4, color: 'inherit', background: 'rgba(20, 55, 80, 0.75)', cursor: 'pointer' }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <label style={{ display: 'block', marginTop: 10 }}>
              wonder cadence {wonderEveryS}s
              <input type="range" min={10} max={120} value={wonderEveryS} onChange={(e) => setWonderEveryS(Number(e.target.value))} style={{ width: '100%' }} />
            </label>
            <button
              type="button"
              onClick={() => setWonderRequest((n) => n + 1)}
              style={{ marginTop: 8, padding: '5px 9px', border: '1px solid #8bb7d5', borderRadius: 4, color: '#dff4ff', background: '#17415f', cursor: 'pointer' }}
            >
              Trigger rare sea event
            </button>
          </>
        )}

        {activeTab === 'water' && (
          <>
            <label style={{ display: 'block', marginTop: 8 }}>
              sea tone (darker ↔ lighter) {seaTone.toFixed(2)}
              <input type="range" min={-0.45} max={0.45} step={0.01} value={seaTone} onChange={(e) => setSeaTone(Number(e.target.value))} style={{ width: '100%' }} />
            </label>
            <label style={{ display: 'block', marginTop: 8 }}>
              sea line color / opacity {seaLineOpacity.toFixed(2)}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="color" value={seaLineColor} onChange={(e) => setSeaLineColor(e.target.value)} />
                <input type="range" min={0} max={0.8} step={0.02} value={seaLineOpacity} onChange={(e) => setSeaLineOpacity(Number(e.target.value))} style={{ flex: 1 }} />
              </div>
            </label>
            <label style={{ display: 'block', marginTop: 8 }}>
              cliff foam color / strength {foamStrength.toFixed(2)}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="color" value={foamColor} onChange={(e) => setFoamColor(e.target.value)} />
                <input type="range" min={0} max={1} step={0.02} value={foamStrength} onChange={(e) => setFoamStrength(Number(e.target.value))} style={{ flex: 1 }} />
              </div>
            </label>
            <div style={{ marginTop: 10, borderTop: '1px solid rgba(125,180,220,0.25)', paddingTop: 8 }}>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="checkbox" checked={waterfallOn} onChange={(e) => setWaterfallOn(e.target.checked)} />
                waterfall
              </label>
              <label>
                <input type="checkbox" checked={waterfallPainted} onChange={(e) => setWaterfallPainted(e.target.checked)} />
                painted scroll
              </label>
              <label style={{ display: 'block', marginTop: 6 }}>
                flow speed {waterfallFlowSpeed} px/s
                <input type="range" min={0} max={200} step={2} value={waterfallFlowSpeed} onChange={(e) => setWaterfallFlowSpeed(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
              <label style={{ display: 'block', marginTop: 6 }}>
                flow strength {waterfallFlowStrength.toFixed(2)}
                <input type="range" min={0} max={1} step={0.02} value={waterfallFlowStrength} onChange={(e) => setWaterfallFlowStrength(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
              <label style={{ display: 'block', marginTop: 6 }}>
                mist {waterfallMist.toFixed(2)}
                <input type="range" min={0} max={1} step={0.02} value={waterfallMist} onChange={(e) => setWaterfallMist(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
              <label style={{ display: 'block', marginTop: 6 }}>
                basin ripples {waterfallRipples.toFixed(2)}
                <input type="range" min={0} max={1} step={0.02} value={waterfallRipples} onChange={(e) => setWaterfallRipples(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
              <label style={{ display: 'block', marginTop: 6 }}>
                foam pulse {waterfallFoam.toFixed(2)}
                <input type="range" min={0} max={1} step={0.02} value={waterfallFoam} onChange={(e) => setWaterfallFoam(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="checkbox" checked={swRiversOn} onChange={(e) => setSwRiversOn(e.target.checked)} />
                rivers & lakes
              </label>
              <label>
                river flow speed {swRiverFlowSpeed.toFixed(2)}x
                <input type="range" min={0} max={2} step={0.05} value={swRiverFlowSpeed} onChange={(e) => setSwRiverFlowSpeed(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
              <label>
                river strength {swRiverFlowStrength.toFixed(2)}
                <input type="range" min={0} max={0.6} step={0.02} value={swRiverFlowStrength} onChange={(e) => setSwRiverFlowStrength(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
              <label>
                lake shimmer {swLakeShimmer.toFixed(2)}
                <input type="range" min={0} max={0.6} step={0.02} value={swLakeShimmer} onChange={(e) => setSwLakeShimmer(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
              <label>
                confluence foam {swConfluenceFoam.toFixed(2)}
                <input type="range" min={0} max={0.6} step={0.02} value={swConfluenceFoam} onChange={(e) => setSwConfluenceFoam(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
            </div>
          </>
        )}

        {activeTab === 'sky' && (
          <>
            <label style={{ display: 'block', marginTop: 6 }}>
              cloud visibility {cloudOpacityScale.toFixed(2)}x
              <input type="range" min={0} max={3} step={0.05} value={cloudOpacityScale} onChange={(e) => setCloudOpacityScale(Number(e.target.value))} style={{ width: '100%' }} />
            </label>
            <label style={{ display: 'block', marginTop: 6 }}>
              cloud cyan tint {Math.round(cloudTintAmount * 100)}%
              <input type="range" min={0} max={1} step={0.01} value={cloudTintAmount} onChange={(e) => setCloudTintAmount(Number(e.target.value))} style={{ width: '100%' }} />
            </label>
          </>
        )}

        {activeTab === 'land' && (
          <>
            <label style={{ display: 'block', marginTop: 6 }}>
              forest sway {forestSway.toFixed(1)}px
              <input type="range" min={0} max={12} step={0.1} value={forestSway} onChange={(e) => setForestSway(Number(e.target.value))} style={{ width: '100%' }} />
            </label>
            <div style={{ marginTop: 10, borderTop: '1px solid rgba(125,180,220,0.25)', paddingTop: 8 }}>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="checkbox" checked={landLifeOn} onChange={(e) => setLandLifeOn(e.target.checked)} />
                land life
              </label>
              <label style={{ display: 'block', marginTop: 6 }}>
                leaves {landLifeLeaves.toFixed(2)}
                <input type="range" min={0} max={1} step={0.02} value={landLifeLeaves} onChange={(e) => setLandLifeLeaves(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
              <label style={{ display: 'block', marginTop: 6 }}>
                motes {landLifeMotes.toFixed(2)}
                <input type="range" min={0} max={1} step={0.02} value={landLifeMotes} onChange={(e) => setLandLifeMotes(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
              <label style={{ display: 'block', marginTop: 6 }}>
                flutter {landLifeFlutter.toFixed(2)}
                <input type="range" min={0} max={1} step={0.02} value={landLifeFlutter} onChange={(e) => setLandLifeFlutter(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
              <label style={{ display: 'block', marginTop: 6 }}>
                speed {landLifeSpeed.toFixed(2)}x
                <input type="range" min={0} max={3} step={0.05} value={landLifeSpeed} onChange={(e) => setLandLifeSpeed(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
              <label style={{ display: 'block', marginTop: 6 }}>
                opacity {landLifeOpacity.toFixed(2)}
                <input type="range" min={0} max={1} step={0.02} value={landLifeOpacity} onChange={(e) => setLandLifeOpacity(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <button
            type="button"
            onClick={() => {
              const defaults: LabDefaults = { wonderEveryS, forestSway, cloudOpacityScale, cloudTintAmount, seaTone, seaLineColor, seaLineOpacity, foamColor, foamStrength, waterfallOn: waterfallOn ? 1 : 0, waterfallFlowSpeed, waterfallFlowStrength, waterfallMist, waterfallRipples, waterfallFoam, waterfallPainted: waterfallPainted ? 1 : 0, swRiversOn: swRiversOn ? 1 : 0, swRiverFlowSpeed, swRiverFlowStrength, swLakeShimmer, swConfluenceFoam, landLifeOn: landLifeOn ? 1 : 0, landLifeLeaves, landLifeMotes, landLifeFlutter, landLifeSpeed, landLifeOpacity };
              setSavedDefaultsNote('saving…');
              void fetch('/__mappa2-lab-defaults', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ defaults }),
              })
                .then(async (res) => {
                  const body = await res.json() as { ok?: boolean; error?: string };
                  if (!res.ok || !body.ok) throw new Error(body.error ?? 'save failed');
                  setSavedDefaultsNote('code defaults saved');
                })
                .catch((err: unknown) => setSavedDefaultsNote(err instanceof Error ? err.message : 'save failed'));
            }}
            style={{ padding: '5px 9px', border: '1px solid #8bd5b8', borderRadius: 4, color: '#dfffe8', background: '#145f43', cursor: 'pointer' }}
          >
            Save defaults
          </button>
          <button
            type="button"
            onClick={() => {
              setWonderEveryS(CODE_DEFAULTS.wonderEveryS); setForestSway(CODE_DEFAULTS.forestSway); setCloudOpacityScale(CODE_DEFAULTS.cloudOpacityScale); setCloudTintAmount(CODE_DEFAULTS.cloudTintAmount); setSeaTone(CODE_DEFAULTS.seaTone); setSeaLineColor(CODE_DEFAULTS.seaLineColor); setSeaLineOpacity(CODE_DEFAULTS.seaLineOpacity); setFoamColor(CODE_DEFAULTS.foamColor); setFoamStrength(CODE_DEFAULTS.foamStrength); setWaterfallOn(CODE_DEFAULTS.waterfallOn === 1); setWaterfallFlowSpeed(CODE_DEFAULTS.waterfallFlowSpeed); setWaterfallFlowStrength(CODE_DEFAULTS.waterfallFlowStrength); setWaterfallMist(CODE_DEFAULTS.waterfallMist); setWaterfallRipples(CODE_DEFAULTS.waterfallRipples); setWaterfallFoam(CODE_DEFAULTS.waterfallFoam); setWaterfallPainted(CODE_DEFAULTS.waterfallPainted === 1); setSwRiversOn(CODE_DEFAULTS.swRiversOn === 1); setSwRiverFlowSpeed(CODE_DEFAULTS.swRiverFlowSpeed); setSwRiverFlowStrength(CODE_DEFAULTS.swRiverFlowStrength); setSwLakeShimmer(CODE_DEFAULTS.swLakeShimmer); setSwConfluenceFoam(CODE_DEFAULTS.swConfluenceFoam); setLandLifeOn(CODE_DEFAULTS.landLifeOn === 1); setLandLifeLeaves(CODE_DEFAULTS.landLifeLeaves); setLandLifeMotes(CODE_DEFAULTS.landLifeMotes); setLandLifeFlutter(CODE_DEFAULTS.landLifeFlutter); setLandLifeSpeed(CODE_DEFAULTS.landLifeSpeed); setLandLifeOpacity(CODE_DEFAULTS.landLifeOpacity);
            }}
            style={{ padding: '5px 9px', border: '1px solid #8bb7d5', borderRadius: 4, color: '#dff4ff', background: '#31465f', cursor: 'pointer' }}
          >
            Reset
          </button>
        </div>
        {savedDefaultsNote && <div style={{ color: '#8bd5b8', marginTop: 5 }}>{savedDefaultsNote}</div>}
      </div>
      ) : (
        <button
          type="button"
          data-testid="mappa2-lab-show-controls"
          onClick={() => setControlsVisible(true)}
          style={{ position: 'absolute', top: 12, left: 12, zIndex: 20, padding: '4px 8px', border: '1px solid rgba(125,180,220,0.45)', borderRadius: 6, color: '#dff4ff', background: 'rgba(3,14,24,0.68)', fontFamily: 'ui-monospace, monospace', fontSize: 11, cursor: 'pointer' }}
        >
          Lab controls (H)
        </button>
      )}
    </div>
  );
}
