/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  PERFORMANCE TIER DETECTION
 *
 *  Rileva la capability del device una sola volta all'avvio e stampa
 *  `data-perf-tier` + `data-input-mode` su <html>. I fogli di stile e i
 *  componenti scalano gli effetti di conseguenza:
 *
 *    high    → CSS + parallax + WebGL glow/particelle (desktop dGPU)
 *    medium  → CSS + parallax (laptop, Steam Deck, tablet recenti)
 *    low     → solo CSS essenziale (mobile economico, no WebGL)
 *
 *  Nessun effetto costoso è "sempre on": la baseline CSS (bevel, incisione,
 *  clip-path) gira ovunque a costo ~0; parallax e WebGL sono additivi.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type PerfTier = 'high' | 'medium' | 'low';
export type InputMode = 'pointer' | 'touch';

export interface DeviceCapabilities {
  tier: PerfTier;
  input: InputMode;
  hasWebGL2: boolean;
  deviceMemoryGB: number | null;
  logicalCores: number;
  isSteamDeck: boolean;
  prefersReducedMotion: boolean;
}

let cached: DeviceCapabilities | null = null;

function detectWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('webgl2');
  } catch {
    return false;
  }
}

/** Steam Deck (Gaming Mode) reports a recognizable UA token. */
function detectSteamDeck(): boolean {
  const ua = navigator.userAgent || '';
  return /SteamDeck|Valve Steam Gamepad/i.test(ua);
}

export function detectCapabilities(): DeviceCapabilities {
  if (cached) return cached;

  const hasWebGL2 = detectWebGL2();
  // navigator.deviceMemory is non-standard; only Chromium exposes it.
  const deviceMemoryGB = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null;
  const logicalCores = navigator.hardwareConcurrency || 4;
  const isSteamDeck = detectSteamDeck();
  const isTouch = matchMedia('(hover: none) and (pointer: coarse)').matches;
  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const lowMemory = deviceMemoryGB !== null && deviceMemoryGB <= 4;
  const fewCores = logicalCores <= 4;

  let tier: PerfTier;
  if (!hasWebGL2 || (lowMemory && fewCores)) {
    tier = 'low';
  } else if (isSteamDeck || lowMemory || fewCores || isTouch) {
    // Steam Deck has a capable APU but a tight 15W thermal budget →
    // treat as medium: keep parallax, skip heavy per-frame WebGL.
    tier = 'medium';
  } else {
    tier = 'high';
  }

  cached = {
    tier,
    input: isTouch ? 'touch' : 'pointer',
    hasWebGL2,
    deviceMemoryGB,
    logicalCores,
    isSteamDeck,
    prefersReducedMotion,
  };
  return cached;
}

/** Writes the detected tier onto <html> so CSS can key off it. */
export function applyPerfTier(target: HTMLElement = document.documentElement): DeviceCapabilities {
  const caps = detectCapabilities();
  target.dataset.perfTier = caps.tier;
  target.dataset.inputMode = caps.input;
  if (caps.prefersReducedMotion) target.dataset.reducedMotion = 'true';
  return caps;
}

/** True when it is safe to spin up per-frame WebGL work (glow, particles). */
export function canUseHeavyWebGL(): boolean {
  const caps = detectCapabilities();
  return caps.tier === 'high' && caps.hasWebGL2 && !caps.prefersReducedMotion;
}

/** True when the mouse-parallax sheen should run (skip on touch / reduced-motion). */
export function canUseParallax(): boolean {
  const caps = detectCapabilities();
  return caps.tier !== 'low' && caps.input === 'pointer' && !caps.prefersReducedMotion;
}
