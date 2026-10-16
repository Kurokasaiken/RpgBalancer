/**
 * questSkillCheckWarm — PLAN-040 T-004: pre-warm the skill-check surface
 * during the /game boot's slack, so the first real check does not pay the
 * astrolabe's shader compile + procedural-texture bake on the click frame.
 *
 * Strategy: mount `DestinyAstrolabeV62Standalone` once, hidden (fixed 2×2,
 * opacity 0), `autoStart: false`, `removeSounds`. The frozen kit's engine
 * starts its rAF loop on construction, so the first painted frame compiles
 * the WebGL2 goo shader and uploads every generated texture — then we force
 * a synchronous `gl.finish()`, unmount (the kit's own `destroy()` calls
 * `WEBGL_lose_context`) and drop the container. `useAstrolabeAudio` gated on
 * `removeSounds` means no AudioContext is created at all.
 *
 * Discipline (debate2 r007):
 * - measure-first: the warm ships behind `skillCheck.warmEnabled` and only
 *   earns its default if the paired-delta p25 clears `warmMinGainMs` on the
 *   playwright preview build — `?warmcheck=1` forces it on for the probe.
 * - never on the critical path: the caller schedules it after the map's
 *   `renderer.prepare.upload`, this module waits for an idle deadline, and
 *   the whole path is bounded by `WARM_TIMEOUT_MS` + `AbortSignal`.
 * - safe environments only: no WebGL2 or a software (SwiftShader) renderer
 *   means headless CI — warm is skipped, never faked.
 */

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DestinyAstrolabeV62Standalone } from '@/ui/idleVillage/frozen/kits/destinyAstrolabeV62Kit';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';

/** Hard cap on the whole warm path — mount, first frame, finish, teardown. */
const WARM_TIMEOUT_MS = 600;

export type WarmOutcome = 'warmed' | 'skipped' | 'aborted' | 'timeout';

/** One warm per page lifetime — boot runs once; HMR resets it. */
let warmed = false;
let running: Promise<WarmOutcome> | null = null;

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    warmed = false;
    running = null;
  });
}

/** `?warmcheck=1` forces the warm on for the measurement harness. */
export function isSkillCheckWarmEnabled(search: string = window.location.search): boolean {
  if (/(?:\?|&)warmcheck=1(?:&|$)/.test(search)) return true;
  return DEFAULT_GAME_FRAME_CONFIG.questWindow.skillCheck.warmEnabled;
}

const gamePerf = () => (window as unknown as { __gamePerf?: { mark: (n: string) => void } }).__gamePerf;

/**
 * Detects a software rasterizer so headless CI (SwiftShader) never pretends
 * a warm it cannot do. Returns `null` when WebGL2 is absent entirely.
 */
function probeWebGL2Renderer(): { renderer: string; dispose: () => void } | null {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');
  if (!gl) return null;
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
  return {
    renderer,
    dispose: () => {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    },
  };
}

/** Finds the engine's WebGL2 canvas inside the warm container, if mounted. */
function webglCanvasOf(container: HTMLElement): HTMLCanvasElement | null {
  for (const canvas of Array.from(container.querySelectorAll('canvas'))) {
    try {
      if (canvas.getContext('webgl2')) return canvas;
    } catch {
      /* a 2d context answers null — keep looking */
    }
  }
  return null;
}

const nextFrame = () => new Promise<number>((resolve) => requestAnimationFrame(resolve));

/**
 * Warms the astrolabe behind the caller's schedule. Resolves with the
 * outcome — never rejects, never throws, idempotent per page lifetime.
 * `timeoutMs` bounds the whole operation; `signal` aborts it cleanly.
 */
export function prewarmQuestSkillCheck(opts: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<WarmOutcome> {
  if (typeof document === 'undefined') return Promise.resolve('skipped');
  if (warmed) return Promise.resolve('skipped');
  if (running) return running;
  running = run(opts).finally(() => {
    running = null;
  });
  return running;
}

async function run({ signal, timeoutMs = WARM_TIMEOUT_MS }: { signal?: AbortSignal; timeoutMs?: number }): Promise<WarmOutcome> {
  const mark = gamePerf();
  mark?.mark('quest-check-warm:begin');
  const outcome = await guarded(signal, timeoutMs);
  mark?.mark(`quest-check-warm:${outcome}`);
  return outcome;
}

async function guarded(signal: AbortSignal | undefined, timeoutMs: number): Promise<WarmOutcome> {
  if (signal?.aborted) return 'aborted';
  const probe = probeWebGL2Renderer();
  if (!probe) return 'skipped';
  const software = /swiftshader|software|llvmpipe/i.test(probe.renderer);
  probe.dispose();
  if (software) return 'skipped';

  /* Idle slice first: the warm must never contend with the veil's exit or
   * the first-pan frames — it only runs when the main thread is quiet. */
  const first = await new Promise<'idle' | 'timeout' | 'aborted'>((resolve) => {
    let done = false;
    const finish = (v: 'idle' | 'timeout' | 'aborted') => {
      if (!done) {
        done = true;
        resolve(v);
      }
    };
    window.requestIdleCallback(() => finish('idle'), { timeout: timeoutMs });
    window.setTimeout(() => finish('timeout'), timeoutMs);
    signal?.addEventListener('abort', () => finish('aborted'), { once: true });
  });
  if (first !== 'idle') return first;

  /* Hidden mount — 2×2 so the engine still paints real pixels. */
  const container = document.createElement('div');
  container.setAttribute('data-testid', 'quest-check-warm');
  container.setAttribute('aria-hidden', 'true');
  container.style.cssText = 'position:fixed;left:-8px;top:-8px;width:2px;height:2px;overflow:hidden;opacity:0;pointer-events:none;z-index:-1;';
  document.body.appendChild(container);

  let root: Root | null = null;
  try {
    root = createRoot(container);
    root.render(
      React.createElement(DestinyAstrolabeV62Standalone, {
        skills: [],
        autoStart: false,
        removeSounds: true,
      }),
    );

    /* Wait until the engine's WebGL2 canvas exists and two frames painted —
     * the deadline bounds engine init on slow machines. */
    const painted = await bounded(timeoutMs, signal, async () => {
      for (let i = 0; i < 20 && !webglCanvasOf(container); i += 1) await nextFrame();
      const canvas = webglCanvasOf(container);
      if (!canvas) return false;
      await nextFrame();
      await nextFrame();
      const gl = canvas.getContext('webgl2');
      gl?.finish();
      return true;
    });
    if (painted === 'aborted') return 'aborted';
    if (painted === 'timeout') return 'timeout';
    if (!painted) return 'skipped';
    warmed = true;
    return 'warmed';
  } catch {
    return 'skipped';
  } finally {
    /* Teardown: unmount runs the kit's destroy() (engine rAF stop, textures,
     * `WEBGL_lose_context` inside tarGooRenderer). No AudioContext exists —
     * the muted audio hook never creates one. */
    try {
      root?.unmount();
    } catch {
      /* unmount racing engine teardown is best-effort */
    }
    container.remove();
  }
}

/** Races `job` against the timeout and the abort signal. */
async function bounded<T>(
  timeoutMs: number,
  signal: AbortSignal | undefined,
  job: () => Promise<T>,
): Promise<T | 'timeout' | 'aborted'> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v: T | 'timeout' | 'aborted') => {
      if (!done) {
        done = true;
        resolve(v);
      }
    };
    const timerId = window.setTimeout(() => finish('timeout'), timeoutMs);
    signal?.addEventListener('abort', () => finish('aborted'), { once: true });
    void job().then(
      (v) => {
        window.clearTimeout(timerId);
        finish(v);
      },
      () => {
        window.clearTimeout(timerId);
        finish('timeout');
      },
    );
  });
}
