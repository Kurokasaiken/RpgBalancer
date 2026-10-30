import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { PixiWorldMap, type PixiBootProgress, type PixiMapTune, type PixiRegionHover, type PixiWorldMapEffects } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { RegionalAtmosphereControls } from './regional-atmosphere-controls';
import { Mappa2GradeControls } from './mappa2-grade-controls';
import { useMappa2Grade } from './useMappa2Grade';
import { mountainShadeLive } from './mappa2-grade';

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

const LAB_TABS = ['scene', 'water', 'sea', 'sky', 'land'] as const;
type LabTab = typeof LAB_TABS[number];
const TAB_EFFECTS: Record<LabTab, (keyof PixiWorldMapEffects)[]> = {
  scene: [],
  water: [],
  sea: ['seaPattern', 'coastFoam', 'seabed'],
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
  waterfallFlipFps: number;
  waterfallSplash: number;
  waterfallRainbow: number;
  waterfallRainbowEveryS: number;
  swRiversOn: number;
  swRiverFlowSpeed: number;
  swBasinPosesPerS: number;
  swSeaPatchPosesPerS: number;
  swDeltaSeaPosesPerS: number;
  swRiverFlowStrength: number;
  swLakeShimmer: number;
  swConfluenceFoam: number;
  landLifeOn: number;
  landLifeLeaves: number;
  landLifeMotes: number;
  landLifeFlutter: number;
  landLifeSpeed: number;
  landLifeOpacity: number;
  ambOn: number;
  ambIntensity: number;
  ambProb: number;
  ambAlpha: number;
  ambRare: number;
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
  waterfallFlipFps: 23,
  waterfallSplash: 0.6,
  waterfallRainbow: 0.7,
  waterfallRainbowEveryS: 150,
  swRiversOn: 1,
  swRiverFlowSpeed: 1,
  swBasinPosesPerS: 4,
  swSeaPatchPosesPerS: 3.5,
  swDeltaSeaPosesPerS: 3.5,
  swRiverFlowStrength: 0.24,
  swLakeShimmer: 0.22,
  swConfluenceFoam: 0.25,
  ambOn: 1,
  ambIntensity: 0.6,
  ambProb: 0.25,
  ambAlpha: 0.16,
  ambRare: 0,
  landLifeOn: 1,
  landLifeLeaves: 0,
  landLifeMotes: 0,
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
  wonders: false, // old sea wonders removed from the lab (Director 2026-10-30)
  landLife: true,
};

/** Per-device storage key for the lab tuning (PersistenceService → localStorage on web). */
const LAB_STORAGE_KEY = 'mappa2-lab:defaults:v1';

/** What gets persisted per device: the slider/color defaults plus the effect toggles. */
interface LabPersistedState {
  defaults: LabDefaults;
  effects: PixiWorldMapEffects;
}

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
  const [waterfallFlipFps, setWaterfallFlipFps] = useState(CODE_DEFAULTS.waterfallFlipFps);
  const [waterfallSplash, setWaterfallSplash] = useState(CODE_DEFAULTS.waterfallSplash);
  const [waterfallRainbow, setWaterfallRainbow] = useState(CODE_DEFAULTS.waterfallRainbow);
  const [waterfallRainbowEveryS, setWaterfallRainbowEveryS] = useState(CODE_DEFAULTS.waterfallRainbowEveryS);
  const [rainbowRequest, setRainbowRequest] = useState(0);
  const [swRiversOn, setSwRiversOn] = useState(CODE_DEFAULTS.swRiversOn === 1);
  const [swRiverFlowSpeed, setSwRiverFlowSpeed] = useState(CODE_DEFAULTS.swRiverFlowSpeed);
  const [swBasinPosesPerS, setSwBasinPosesPerS] = useState(CODE_DEFAULTS.swBasinPosesPerS);
  const [swSeaPatchPosesPerS, setSwSeaPatchPosesPerS] = useState(CODE_DEFAULTS.swSeaPatchPosesPerS);
  const [swDeltaSeaPosesPerS, setSwDeltaSeaPosesPerS] = useState(CODE_DEFAULTS.swDeltaSeaPosesPerS);
  const [swRiverFlowStrength, setSwRiverFlowStrength] = useState(CODE_DEFAULTS.swRiverFlowStrength);
  const [swLakeShimmer, setSwLakeShimmer] = useState(CODE_DEFAULTS.swLakeShimmer);
  const [swConfluenceFoam, setSwConfluenceFoam] = useState(CODE_DEFAULTS.swConfluenceFoam);
  const [landLifeOn, setLandLifeOn] = useState(CODE_DEFAULTS.landLifeOn === 1);
  const [landLifeLeaves, setLandLifeLeaves] = useState(CODE_DEFAULTS.landLifeLeaves);
  const [landLifeMotes, setLandLifeMotes] = useState(CODE_DEFAULTS.landLifeMotes);
  const [landLifeFlutter, setLandLifeFlutter] = useState(CODE_DEFAULTS.landLifeFlutter);
  const [landLifeSpeed, setLandLifeSpeed] = useState(CODE_DEFAULTS.landLifeSpeed);
  const [landLifeOpacity, setLandLifeOpacity] = useState(CODE_DEFAULTS.landLifeOpacity);
  const [ambOn, setAmbOn] = useState(CODE_DEFAULTS.ambOn === 1);
  const [ambIntensity, setAmbIntensity] = useState(CODE_DEFAULTS.ambIntensity);
  const [ambProb, setAmbProb] = useState(CODE_DEFAULTS.ambProb);
  const [ambAlpha, setAmbAlpha] = useState(CODE_DEFAULTS.ambAlpha);
  const [ambRare, setAmbRare] = useState(CODE_DEFAULTS.ambRare === 1);
  const [ambLogTick, setAmbLogTick] = useState(0);
  const [savedDefaultsNote, setSavedDefaultsNote] = useState('');
  const [wonderRequest, setWonderRequest] = useState(0);
  const [defaultsLoaded, setDefaultsLoaded] = useState(false);
  const isMobile = useIsMobile();
  const mappa2Grade = useMappa2Grade();

  /** Current slider/color values as a LabDefaults record (toggles as 0/1, colors as hex). */
  const collectLabDefaults = (): LabDefaults => ({
    wonderEveryS, forestSway, cloudOpacityScale, cloudTintAmount, seaTone, seaLineColor, seaLineOpacity, foamColor, foamStrength,
    waterfallOn: waterfallOn ? 1 : 0, waterfallFlowSpeed, waterfallFlowStrength, waterfallMist, waterfallRipples, waterfallFoam,
    waterfallPainted: waterfallPainted ? 1 : 0, waterfallFlipFps, waterfallSplash, waterfallRainbow, waterfallRainbowEveryS,
    swRiversOn: swRiversOn ? 1 : 0, swRiverFlowSpeed, swBasinPosesPerS, swSeaPatchPosesPerS, swDeltaSeaPosesPerS, swRiverFlowStrength, swLakeShimmer, swConfluenceFoam,
    landLifeOn: landLifeOn ? 1 : 0, landLifeLeaves, landLifeMotes, landLifeFlutter, landLifeSpeed, landLifeOpacity,
    ambOn: ambOn ? 1 : 0, ambIntensity, ambProb, ambAlpha, ambRare: ambRare ? 1 : 0,
  });

  /** Applies a LabDefaults record to every lab control — shared by Reset and by the storage restore. */
  const applyLabDefaults = (d: LabDefaults) => {
    setWonderEveryS(d.wonderEveryS); setForestSway(d.forestSway); setCloudOpacityScale(d.cloudOpacityScale); setCloudTintAmount(d.cloudTintAmount); setSeaTone(d.seaTone); setSeaLineColor(d.seaLineColor); setSeaLineOpacity(d.seaLineOpacity); setFoamColor(d.foamColor); setFoamStrength(d.foamStrength); setWaterfallOn(d.waterfallOn === 1); setWaterfallFlowSpeed(d.waterfallFlowSpeed); setWaterfallFlowStrength(d.waterfallFlowStrength); setWaterfallMist(d.waterfallMist); setWaterfallRipples(d.waterfallRipples); setWaterfallFoam(d.waterfallFoam); setWaterfallPainted(d.waterfallPainted === 1); setWaterfallFlipFps(d.waterfallFlipFps); setWaterfallSplash(d.waterfallSplash); setWaterfallRainbow(d.waterfallRainbow); setWaterfallRainbowEveryS(d.waterfallRainbowEveryS); setSwRiversOn(d.swRiversOn === 1); setSwRiverFlowSpeed(d.swRiverFlowSpeed); setSwBasinPosesPerS(d.swBasinPosesPerS); setSwSeaPatchPosesPerS(d.swSeaPatchPosesPerS); setSwDeltaSeaPosesPerS(d.swDeltaSeaPosesPerS); setSwRiverFlowStrength(d.swRiverFlowStrength); setSwLakeShimmer(d.swLakeShimmer); setSwConfluenceFoam(d.swConfluenceFoam); setLandLifeOn(d.landLifeOn === 1); setLandLifeLeaves(d.landLifeLeaves); setLandLifeMotes(d.landLifeMotes); setLandLifeFlutter(d.landLifeFlutter); setLandLifeSpeed(d.landLifeSpeed); setLandLifeOpacity(d.landLifeOpacity); setAmbOn(d.ambOn === 1); setAmbIntensity(d.ambIntensity); setAmbProb(d.ambProb); setAmbAlpha(d.ambAlpha); setAmbRare(d.ambRare === 1);
  };

  // Restore the per-device tuning saved by autosave — works on any surface (dev, preview, Vercel).
  useEffect(() => {
    void loadData<LabPersistedState | null>(LAB_STORAGE_KEY, null)
      .then((saved) => {
        if (saved && typeof saved === 'object') {
          applyLabDefaults({ ...CODE_DEFAULTS, ...(saved.defaults ?? {}) });
          if (saved.effects && typeof saved.effects === 'object') {
            setEffects({ ...DEFAULT_EFFECTS, ...saved.effects });
          }
        }
      })
      .catch(() => undefined)
      .finally(() => setDefaultsLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apply-once restore at mount
  }, []);

  // Autosave every change per device (same pattern as grade / regional weather).
  const labPayload: LabPersistedState = { defaults: collectLabDefaults(), effects };
  const labPayloadJson = JSON.stringify(labPayload);
  useEffect(() => {
    if (!defaultsLoaded) return;
    void saveData(LAB_STORAGE_KEY, labPayload).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the serialized payload
  }, [labPayloadJson, defaultsLoaded]);

  useLayoutEffect(() => {
    document.body.dataset.mappa2Lab = 'true';
    return () => {
      delete document.body.dataset.mappa2Lab;
    };
  }, []);

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
        mountainShade={mountainShadeLive}
        seaPatternConfig={seaPatternConfig}
        coastFoamConfig={coastFoamConfig}
        waterfallConfig={{ enabled: waterfallOn, flowSpeed: waterfallFlowSpeed, flowStrength: waterfallFlowStrength, mistAmount: waterfallMist, ripples: waterfallRipples, foamPulse: waterfallFoam, paintedFlow: waterfallPainted, flipFps: waterfallFlipFps, splash: waterfallSplash, rainbow: waterfallRainbow, rainbowEveryS: waterfallRainbowEveryS, rainbowRequest }}
        secondaryWaterConfig={{ riversOn: swRiversOn, basinPosesPerS: swBasinPosesPerS, seaPatchPosesPerS: swSeaPatchPosesPerS, deltaSeaPosesPerS: swDeltaSeaPosesPerS, riverFlowSpeed: swRiverFlowSpeed, riverFlowStrength: swRiverFlowStrength, lakeShimmer: swLakeShimmer, confluenceFoam: swConfluenceFoam }}
        landLifeConfig={{ enabled: landLifeOn, leaves: landLifeLeaves, motes: landLifeMotes, flutter: landLifeFlutter, speed: landLifeSpeed, opacity: landLifeOpacity }}
        ambientDirectorConfig={{ enabled: ambOn, intensity: ambIntensity, families: { shoal: { enabled: ambOn, probability: ambProb, alpha: ambAlpha } }, rare: { enabled: ambRare, p: 0.15 } }}
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
          maxHeight: 'calc(100vh - 24px)',
          overflowY: 'auto',
          boxSizing: 'border-box',
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
            <Mappa2GradeControls grade={mappa2Grade.grade} onPatch={mappa2Grade.set} />
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
          </>
        )}

        {activeTab === 'water' && (
          <>
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
                falls speed {waterfallFlipFps} poses/s
                <input type="range" min={6} max={90} step={1} value={waterfallFlipFps} onChange={(e) => setWaterfallFlipFps(Number(e.target.value))} style={{ width: '100%' }} />
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
                impact splash {waterfallSplash.toFixed(2)}
                <input type="range" min={0} max={1} step={0.02} value={waterfallSplash} onChange={(e) => setWaterfallSplash(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
              <label style={{ display: 'block', marginTop: 6 }}>
                rainbow {waterfallRainbow.toFixed(2)} · every ~{waterfallRainbowEveryS}s
                <input type="range" min={0} max={1} step={0.02} value={waterfallRainbow} onChange={(e) => setWaterfallRainbow(Number(e.target.value))} style={{ width: '100%' }} />
                <input type="range" min={30} max={600} step={10} value={waterfallRainbowEveryS} onChange={(e) => setWaterfallRainbowEveryS(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
              <button type="button" onClick={() => setRainbowRequest((n) => n + 1)} style={{ marginTop: 6, padding: '4px 8px', border: '1px solid #56758d', borderRadius: 4, color: 'inherit', background: '#172b40', cursor: 'pointer' }}>
                Trigger rainbow
              </button>
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
                falls basin speed {swBasinPosesPerS} poses/s
                <input type="range" min={0} max={20} step={1} value={swBasinPosesPerS} onChange={(e) => setSwBasinPosesPerS(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
              <label>
                bay & river mouths speed {swSeaPatchPosesPerS.toFixed(1)} poses/s
                <input type="range" min={0} max={12} step={0.5} value={swSeaPatchPosesPerS} onChange={(e) => setSwSeaPatchPosesPerS(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
              <label>
                sea below delta speed {swDeltaSeaPosesPerS.toFixed(1)} poses/s
                <input type="range" min={0} max={12} step={0.5} value={swDeltaSeaPosesPerS} onChange={(e) => setSwDeltaSeaPosesPerS(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
              <label style={{ display: 'block', marginTop: 6 }}>
                river flow speed {swRiverFlowSpeed.toFixed(2)}x ({Math.round(12 * swRiverFlowSpeed)} poses/s)
                <input type="range" min={0} max={3} step={0.05} value={swRiverFlowSpeed} onChange={(e) => setSwRiverFlowSpeed(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
              <label>
                river strength {swRiverFlowStrength.toFixed(2)}
                <input type="range" min={0} max={0.6} step={0.02} value={swRiverFlowStrength} onChange={(e) => setSwRiverFlowStrength(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
              <label>
                lake shimmer {swLakeShimmer.toFixed(2)}
                <input type="range" min={0} max={0.6} step={0.02} value={swLakeShimmer} onChange={(e) => setSwLakeShimmer(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
            </div>
          </>
        )}

        {activeTab === 'sea' && (
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
                <input type="checkbox" checked={ambOn} onChange={(e) => setAmbOn(e.target.checked)} />
                ambient director
              </label>
              <label>
                intensity {ambIntensity.toFixed(2)}
                <input type="range" min={0} max={2} step={0.05} value={ambIntensity} onChange={(e) => setAmbIntensity(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
              <label>
                shoal probability {ambProb.toFixed(2)}
                <input type="range" min={0} max={1} step={0.05} value={ambProb} onChange={(e) => setAmbProb(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
              <label>
                shoal alpha {ambAlpha.toFixed(2)}
                <input type="range" min={0} max={0.4} step={0.01} value={ambAlpha} onChange={(e) => setAmbAlpha(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="checkbox" checked={ambRare} onChange={(e) => setAmbRare(e.target.checked)} />
                rare events (nullRare)
              </label>
              <div style={{ marginTop: 6, fontSize: 11, opacity: 0.8 }}>sea life · click to spawn now</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                {([
                  ['banco di pesci', 'school', undefined],
                  ['manta', 'giant', 'manta'],
                  ['pescione', 'giant', 'pescione'],
                  ['pesce martello', 'giant', 'martello'],
                  ['tartaruga', 'turtle', undefined],
                  ['delfini', 'dolphin', undefined],
                ] as const).map(([label, kind, species]) => (
                  <button
                    key={label}
                    type="button"
                    style={{ fontSize: 12 }}
                    onClick={() => {
                      (window as unknown as {
                        __ambientDebug?: { director?: { triggerShoal: (zoneId?: string, pick?: { kind?: string; species?: string }) => void } };
                      }).__ambientDebug?.director?.triggerShoal(undefined, { kind, species });
                      setAmbLogTick((v) => v + 1);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                style={{ marginTop: 4, fontSize: 12 }}
                onClick={() => setAmbLogTick((v) => v + 1)}
              >
                refresh log
              </button>
              <div style={{ marginTop: 6, fontSize: 11, fontFamily: 'monospace', maxHeight: 110, overflow: 'auto', opacity: 0.8 }} data-amb-logtick={ambLogTick}>
                {(() => {
                  const dbg = (window as unknown as {
                    __ambientDebug?: { director?: { log?: { simT: number; family: string; zoneId: string; outcome: string; reason?: string }[]; occupancy?: { count: () => number } } };
                  }).__ambientDebug;
                  const occ = dbg?.director?.occupancy?.count() ?? 0;
                  const rows = (dbg?.director?.log ?? []).slice(-10).reverse();
                  return (
                    <>
                      <div>occupancy: {occ} · log {rows.length} entries</div>
                      {rows.map((r, i) => (
                        <div key={i}>{`t${r.simT} ${r.family} ${r.zoneId} ${r.outcome}${r.reason ? ` (${r.reason})` : ''}`}</div>
                      ))}
                    </>
                  );
                })()}
              </div>
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
            <RegionalAtmosphereControls />
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
              const defaults = collectLabDefaults();
              setSavedDefaultsNote('saving…');
              // The bake endpoint only exists on the vite dev server (MODE==='development');
              // playwright-mode builds report DEV=true but have no middleware.
              if (import.meta.env.MODE === 'development') {
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
              } else {
                void saveData(LAB_STORAGE_KEY, { defaults, effects })
                  .then(() => setSavedDefaultsNote('saved on this device'))
                  .catch(() => setSavedDefaultsNote('save failed'));
              }
            }}
            style={{ padding: '5px 9px', border: '1px solid #8bd5b8', borderRadius: 4, color: '#dfffe8', background: '#145f43', cursor: 'pointer' }}
          >
            Save defaults
          </button>
          <button
            type="button"
            onClick={() => applyLabDefaults(CODE_DEFAULTS)}
            style={{ padding: '5px 9px', border: '1px solid #8bb7d5', borderRadius: 4, color: '#dff4ff', background: '#31465f', cursor: 'pointer' }}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => {
              // WhatsApp-ready text: label + single-line JSON the agent can bake into CODE_DEFAULTS.
              const text = `mappa2-lab tuning — defaults da cuocere nel codice:\n${JSON.stringify({ defaults: collectLabDefaults(), effects })}`;
              const writeClipboard = () =>
                Promise.resolve()
                  .then(() => navigator.clipboard.writeText(text))
                  .then(() => setSavedDefaultsNote('defaults copied — paste in chat (WhatsApp/Telegram)'))
                  .catch(() => setSavedDefaultsNote('copy failed'));
              // Phone only: native share sheet → straight into WhatsApp.
              // Desktop Chrome also exposes navigator.share but the sheet can hang
              // headless / steal focus — clipboard is the right path there.
              if (isMobile && typeof navigator.share === 'function') {
                void navigator.share({ text })
                  .then(() => setSavedDefaultsNote('defaults shared'))
                  .catch((err: unknown) => {
                    if (err instanceof Error && err.name === 'AbortError') {
                      setSavedDefaultsNote('share cancelled');
                      return;
                    }
                    void writeClipboard();
                  });
              } else {
                void writeClipboard();
              }
            }}
            style={{ padding: '5px 9px', border: '1px solid #d5c98b', borderRadius: 4, color: '#fff4d0', background: '#5f4f1f', cursor: 'pointer' }}
          >
            Copy defaults
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
