/**
 * attestEnv — helper riusabile per i capture Playwright (R-189).
 *
 * Raccoglie l'attestazione ambiente che il gate richiede per obbligazioni
 * `dom-temporal` / `pixel-temporal` / `fps`: visibilityState, viewport,
 * contatore requestAnimationFrame su ~500 ms e differenza tra due screenshot.
 * Scrivi il risultato dentro l'artefatto `metrics`/`env` del run
 * (campo `env`): il validatore rifiuta prove senza attestazione valida
 * (INVALID_ENV — copre l'incidente del pane hidden / rAF fermo).
 *
 * Uso:
 *   import { collectEnvAttestation } from '../../scripts/verification/attestEnv';
 *   const env = await collectEnvAttestation(page);
 *   metrics.env = env;
 */

interface PageLike {
  viewportSize(): { width: number; height: number } | null;
  evaluate<T>(fn: () => T | Promise<T>): Promise<T>;
  screenshot(opts?: { type?: 'png' | 'jpeg' }): Promise<Buffer>;
}

export interface EnvAttestationResult {
  visibilityState: string;
  viewport: { width: number; height: number };
  rafTicks: number;
  frameDiff: number;
  headed: boolean;
  collectedAt: string;
}

export async function collectEnvAttestation(page: PageLike): Promise<EnvAttestationResult> {
  const viewport = page.viewportSize() ?? { width: 0, height: 0 };

  const dom = await page.evaluate(async () => {
    const count = await new Promise<number>((resolve) => {
      let ticks = 0;
      const start = performance.now();
      const loop = () => {
        ticks += 1;
        if (performance.now() - start < 500) {
          requestAnimationFrame(loop);
        } else {
          resolve(ticks);
        }
      };
      requestAnimationFrame(loop);
    });
    return { visibilityState: document.visibilityState, rafTicks: count };
  });

  // frame-diff con sonda deliberata: un div a copertura piena prova che il
  // compositor produce frame diversi — misurare su una scena a riposo dà un
  // falso INVALID_ENV (la scena idle è legittimamente statica).
  const shotA = await page.screenshot();
  await page.evaluate(() => {
    const d = document.createElement('div');
    d.id = '__env_probe';
    d.style.cssText = 'position:fixed;inset:0;background:#f0f;z-index:2147483647;';
    document.body.appendChild(d);
  });
  const shotB = await page.screenshot();
  await page.evaluate(() => document.getElementById('__env_probe')?.remove());
  let diff = 0;
  const len = Math.min(shotA.length, shotB.length);
  for (let i = 0; i < len; i += 1) {
    if (shotA[i] !== shotB[i]) diff += 1;
  }
  const frameDiff = len > 0 ? diff / len : 0;

  return {
    visibilityState: dom.visibilityState,
    viewport,
    rafTicks: dom.rafTicks,
    frameDiff: Math.round(frameDiff * 10000) / 10000,
    headed: process.env.HEADED === '1' || !!process.env.DISPLAY,
    collectedAt: new Date().toISOString(),
  };
}
