/**
 * PLAN-115 F4 — device tiers for the /game map (budgets signed by the Director 2026-11-10, G0):
 * texture GPU memory Desktop ≤ 420 MB, Steam Deck ≤ 320 MB, Mobile ≤ 160 MB (`__pixiTextureReport` + tiles).
 *
 * `detectTier` is pure (unit-tested); `readTierEnv` reads the browser once. The look is the same everywhere (look v2):
 * the tiers only change how many texels are loaded and which effect the device cannot reach (the Alt glass globe).
 */
import type { TileBudget } from '@/ui/idleVillage/pixiSpike/baseTiles';
import { MAPPA2_GAME_GPU_LIGHT, MAPPA2_GAME_GRADE } from './mappa2ApprovedLook';

export type MapTier = 'desktop' | 'deck' | 'mobile';

export interface TierEnv {
  coarsePointer: boolean;
  screenW: number;
  screenH: number;
  userAgent: string;
  gpuRenderer: string | null;
}

export interface TierProfile {
  /** Canopy cut-outs: '.v2hi' 5504 (crisp when zoomed) or '.v2' 2752. */
  canopySuffix: '.v2hi' | '.v2';
  tiles: Partial<TileBudget>;
  gpuLight: { halfDistanceMasks: boolean; halfSeaTile: boolean; foamBaseFromDisplayed: boolean; halfFoamMasks: boolean; halfSeaField: boolean };
  grade: { multUrl: string; addUrl: string; opacity: number; addScale: number };
  /** Seabed reveal: needs the Alt key (glass globe) — off where there is no keyboard. */
  seabed: boolean;
}

const halfGrade = {
  ...MAPPA2_GAME_GRADE,
  multUrl: MAPPA2_GAME_GRADE.multUrl.replace('.webp', '.half.webp'),
  addUrl: MAPPA2_GAME_GRADE.addUrl.replace('.webp', '.half.webp'),
};

export const TIER_PROFILES: Record<MapTier, TierProfile> = {
  // Retina overview is already magnified 1.17x: the whole map (66 cells ≈ 67 MB) may be resident.
  desktop: { canopySuffix: '.v2hi', tiles: { budgetCells: 72, minScale: 1.05, marginCells: 1 }, gpuLight: { ...MAPPA2_GAME_GPU_LIGHT, halfFoamMasks: false, halfSeaField: false }, grade: { ...MAPPA2_GAME_GRADE }, seabed: true },
  // 1280x800 at density 1: cells only when zoomed past ~2x; a screenful + margin ≈ 20 cells.
  deck: { canopySuffix: '.v2hi', tiles: { budgetCells: 48, minScale: 1.05, marginCells: 1 }, gpuLight: { ...MAPPA2_GAME_GPU_LIGHT, halfFoamMasks: false, halfSeaField: false }, grade: { ...MAPPA2_GAME_GRADE }, seabed: true },
  // phone: half-size sheets, 2752 cut-outs, a small cell budget only when clearly zoomed, no unreachable seabed.
  mobile: { canopySuffix: '.v2', tiles: { budgetCells: 16, minScale: 1.3, marginCells: 0 }, gpuLight: { ...MAPPA2_GAME_GPU_LIGHT, halfFoamMasks: true, halfSeaField: true }, grade: halfGrade, seabed: false },
};

const DECK_GPU = /vangogh|AMD Custom GPU 040[0-9]/i;

/** Pure tier decision from what the browser exposes. */
export function detectTier(env: TierEnv): MapTier {
  const shortSide = Math.min(env.screenW, env.screenH);
  if (env.coarsePointer && shortSide < 1100 && !/SteamOS|Steam Deck/i.test(env.userAgent)) return 'mobile';
  const linux = /Linux/i.test(env.userAgent) && !/Android/i.test(env.userAgent);
  if (/SteamOS|Steam Deck/i.test(env.userAgent) || (env.gpuRenderer && DECK_GPU.test(env.gpuRenderer))) return 'deck';
  if (linux && Math.max(env.screenW, env.screenH) === 1280 && shortSide === 800) return 'deck';
  return 'desktop';
}

/** Read the browser environment once (WebGL renderer string when the debug extension is exposed). */
export function readTierEnv(): TierEnv {
  let gpuRenderer: string | null = null;
  try {
    const gl = document.createElement('canvas').getContext('webgl2') as WebGL2RenderingContext | null;
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    if (gl && ext) gpuRenderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL));
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    gpuRenderer = null;
  }
  return {
    coarsePointer: window.matchMedia?.('(pointer: coarse)').matches ?? false,
    screenW: window.screen?.width ?? window.innerWidth,
    screenH: window.screen?.height ?? window.innerHeight,
    userAgent: navigator.userAgent,
    gpuRenderer,
  };
}

export const isMapTier = (v: string | null | undefined): v is MapTier => v === 'desktop' || v === 'deck' || v === 'mobile';

/** Tier for the «Qualità grafica» setting (PLAN-115 D4): auto = the detected device; a valid dev override wins. */
export function tierForQuality(quality: 'auto' | 'high' | 'medium' | 'low', detected: MapTier, override?: string | null): MapTier {
  if (isMapTier(override)) return override;
  if (quality === 'high') return 'desktop';
  if (quality === 'medium') return 'deck';
  if (quality === 'low') return 'mobile';
  return detected;
}
