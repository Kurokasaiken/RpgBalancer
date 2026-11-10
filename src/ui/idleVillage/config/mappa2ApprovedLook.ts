/**
 * mappa2 — the APPROVED look (Director ruling 2026-11-10: «approvo quella che c'è adesso come mappa»).
 *
 * Frozen snapshot of the `/mappa2-lab` calibration on that day (lab `CODE_DEFAULTS` + effect toggles + the
 * constants the lab passes to PixiWorldMap). `/game` renders the map from here, so later lab experiments do not
 * move the game. To change the game map: calibrate in the lab, get a Director ruling, then update this snapshot
 * (the pin test `tests/unit/mappa2ApprovedLook.test.ts` makes the change explicit).
 */
import type { PixiMapTune, PixiWorldMapEffects } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';

export const MAPPA2_MANIFEST_PATH = '/assets/world/mappa2/base/manifest.json';
export const MAPPA2_REGIONS_BASE = '/assets/world/mappa2/base';
export const MAPPA2_STAGE_COLOR = '#1675ad';

/** Lab tuning values approved on 2026-11-10 (identical to the lab's code defaults and saved defaults that day). */
export const MAPPA2_APPROVED = {
  wonderEveryS: 45,
  forestSway: 2.2,
  cloudOpacityScale: 1.4,
  cloudTintAmount: 0.61,
  seaTone: 0,
  seaLineColor: '#8bbac2',
  seaLineOpacity: 0.14,
  foamColor: '#eefcf6',
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
  landLifeOn: 1,
  landLifeLeaves: 0,
  landLifeMotes: 0,
  landLifeFlutter: 0,
  landLifeSpeed: 1,
  landLifeOpacity: 0.55,
  ambOn: 1,
  ambIntensity: 0.6,
  ambProb: 0.25,
  ambAlpha: 0.16,
  ambRare: 0,
} as const;

/** Effect toggles approved with the look (lab defaults; `wonders` removed from the lab 2026-10-30, `hiRes` off). */
export const MAPPA2_APPROVED_EFFECTS: PixiWorldMapEffects = {
  seaPattern: true,
  coastFoam: true,
  waves: false,
  seaMarks: false,
  cloudShadows: true,
  birds: true,
  clouds: true,
  seabed: true,
  wonders: false,
  landLife: true,
  canopyDetail: false,
  hiRes: false,
};

const SEA_PATTERN_BASE = { patternScale: 1150, lineOpacity: 0.21, lineWidth: 1, motionAmount: 6.5, motionPeriod: 5, motionAngle: 200, lineColor: '#8bbac2', baseColor: '#0b5c6b', motionEnabled: true };
const COAST_FOAM_BASE = { strength: 0.4, dissolveStartWorldPx: 3, dissolveEndWorldPx: 60, crestSpeedWorldPxPerSecond: 9, color: [0.93, 0.98, 0.96] as [number, number, number] };

/** Mixes two CSS hex colors by `amount` (same formula as the lab). */
export const mixHex = (from: string, to: string, amount: number): string => {
  const a = Number.parseInt(from.slice(1), 16);
  const b = Number.parseInt(to.slice(1), 16);
  const mix = ((a >> 16 & 255) * (1 - amount) + (b >> 16 & 255) * amount) << 16
    | (((a >> 8 & 255) * (1 - amount) + (b >> 8 & 255) * amount) << 8)
    | ((a & 255) * (1 - amount) + (b & 255) * amount);
  return `#${Math.round(mix).toString(16).padStart(6, '0')}`;
};

const hexToRgb01 = (hex: string): [number, number, number] => {
  const n = Number.parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const v = MAPPA2_APPROVED;

/** The PixiWorldMap props that make the approved look (everything except camera, regions and callbacks). */
export const MAPPA2_APPROVED_MAP_PROPS = {
  manifestPath: MAPPA2_MANIFEST_PATH,
  stageColor: MAPPA2_STAGE_COLOR,
  tune: {
    cloudParallax: 1,
    cloudMorph: 1,
    smokeAmount: 0.8,
    wonderEveryS: v.wonderEveryS,
    deepSeaFadePx: 360,
    forestSway: v.forestSway,
    regionLinePx: 8,
  } satisfies Partial<PixiMapTune>,
  seabed: MAPPA2_APPROVED_EFFECTS.seabed ? { opacity: 0.45, parallax: 0.82 } : undefined,
  effects: MAPPA2_APPROVED_EFFECTS,
  cloudOpacityScale: v.cloudOpacityScale,
  cloudTint: mixHex('#ffffff', '#bfeff2', v.cloudTintAmount),
  seaTone: v.seaTone,
  seaPatternConfig: { ...SEA_PATTERN_BASE, lineColor: v.seaLineColor, lineOpacity: v.seaLineOpacity },
  coastFoamConfig: { ...COAST_FOAM_BASE, color: hexToRgb01(v.foamColor), strength: v.foamStrength },
  waterfallConfig: {
    enabled: v.waterfallOn === 1, flowSpeed: v.waterfallFlowSpeed, flowStrength: v.waterfallFlowStrength, mistAmount: v.waterfallMist,
    ripples: v.waterfallRipples, foamPulse: v.waterfallFoam, paintedFlow: v.waterfallPainted === 1, flipFps: v.waterfallFlipFps,
    splash: v.waterfallSplash, rainbow: v.waterfallRainbow, rainbowEveryS: v.waterfallRainbowEveryS, rainbowRequest: 0,
  },
  secondaryWaterConfig: {
    riversOn: v.swRiversOn === 1, basinPosesPerS: v.swBasinPosesPerS, seaPatchPosesPerS: v.swSeaPatchPosesPerS, deltaSeaPosesPerS: v.swDeltaSeaPosesPerS,
    riverFlowSpeed: v.swRiverFlowSpeed, riverFlowStrength: v.swRiverFlowStrength, lakeShimmer: v.swLakeShimmer, confluenceFoam: v.swConfluenceFoam,
  },
  landLifeConfig: {
    enabled: v.landLifeOn === 1, leaves: v.landLifeLeaves, motes: v.landLifeMotes, flutter: v.landLifeFlutter, speed: v.landLifeSpeed, opacity: v.landLifeOpacity,
  },
  ambientDirectorConfig: {
    enabled: v.ambOn === 1, intensity: v.ambIntensity,
    families: { shoal: { enabled: v.ambOn === 1, probability: v.ambProb, alpha: v.ambAlpha } },
    rare: { enabled: v.ambRare === 1, p: 0.15 },
  },
};

/**
 * The approved grade collapsed into ONE multiply + add pair (`scripts/build-mappa2-game-grade.py`): mountain shade,
 * sapphire sea (mult + add) and mountain clarity, all at opacity 1, as one affine map per pixel. Same image as the
 * four live sheets of the lab (≤1-2 levels of 8-bit rounding), two textures and three full-screen passes fewer.
 * The additive sheet is stored x1 (it reaches 0.92 on the clarity highlights).
 */
export const MAPPA2_GAME_GRADE = {
  multUrl: '/assets/world/mappa2/base/fx/game-grade-mult.webp',
  addUrl: '/assets/world/mappa2/base/fx/game-grade-add.webp',
  opacity: 1,
  addScale: 1,
} as const;

/**
 * GPU-budget options /game turns on (PixiWorldMap `gpuLight`, 2026-11-10): half-resolution distance fields and sea
 * line tile, and the surf re-sampling the painting already on screen. Measured A/B against the full-size sources in
 * `.mw/runs/20261110-game-mappa2/`; the lab keeps the full-size sources.
 */
export const MAPPA2_GAME_GPU_LIGHT = { halfDistanceMasks: true, halfSeaTile: true, foamBaseFromDisplayed: true } as const;

/**
 * Look v2 of the /game map (PLAN-115, Director 2026-11-10: D1 «2» = the hi-res land as it is, D2 «2 · mare hi-res»).
 * Resident 2752 set + canopy cut-outs + the seabed-reveal sea, built by `scripts/build-mappa2-tiles.py`.
 * `canopySuffix` '.v2hi' = 5504 cut-outs (desktop/Deck); low tiers may pass '.v2' (2752).
 */
export const MAPPA2_V2_LAND = {
  baseFile: 'base_flat.nocanopy.v2.webp',
  canopySuffix: '.v2hi',
  revealSeaFile: 'Mare.v2.webp',
  fullBaseFile: 'base_flat.v2.webp',
} as const;

/** Hi-res cells streamed where the player zooms (PLAN-115 F3, `pixiSpike/baseTiles.ts`). Budget per tier comes in F4. */
export const MAPPA2_V2_TILES = {
  manifestUrl: '/assets/world/mappa2/base/tiles/v2/tiles.json',
  budget: { budgetCells: 72 }, // desktop Retina: at overview the whole map (66 cells, ~70 MB) is already magnified 1.17x
} as const;
