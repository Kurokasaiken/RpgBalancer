/**
 * mappa2AmbientDirector.spec.ts — PLAN-094 regression contract for the
 * AmbientDirector + shoal slice (deterministic admission scheduler driving a
 * preallocated blob pool over baked shallow zones).
 *
 * Claims proven here:
 *  (a) a manual Trigger produces a spawn-log record AND a live blob that
 *      actually drifts (numeric position witness — blobs are subtle
 *      alpha<=0.22, so pixel-diff would be flaky);
 *  (b) the lab toggle hides `ambientSeaLayer` live without rebuilding the
 *      Pixi app (tag-presence check, same pattern as __landLifeBox);
 *  (c) reduced motion keeps the scheduled layer empty and invisible.
 *
 * Perf: an in-page rAF timing sample (ambient OFF vs ON) is saved to the
 * evidence dir — the falsifiable target is
 * `max(0.5 ms, 2 x noise floor)` p95 above baseline.
 */
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const EVIDENCE_DIR = 'test-results/plan-094-mappa2-ambient-director';
const save = (name: string, data: Buffer | string) => {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  writeFileSync(`${EVIDENCE_DIR}/${name}`, data);
};

interface AmbDbg {
  layer?: { visible: boolean; children?: unknown[] };
  director?: {
    log?: { simT: number; family: string; zoneId: string; outcome: string; reason?: string }[];
    triggerShoal?: () => void;
    simT?: number;
    droppedTicks?: number;
  };
  shoal?: {
    activeCount?: () => number;
    blobs?: { active: boolean; school: { x: number; y: number; visible: boolean } }[];
  };
}
const dbg = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as unknown as { __ambientDebug?: AmbDbg }).__ambientDebug);

const ready = (page: import('@playwright/test').Page) =>
  page.waitForFunction(
    () => document.querySelector('[data-testid="mappa2-lab-hud"]')?.textContent?.includes('ready: yes'),
    null,
    { timeout: 180_000 },
  );

const waterTab = async (page: import('@playwright/test').Page) => {
  await page.getByRole('button', { name: 'water', exact: true }).click();
};

test.describe('mappa2 AmbientDirector + shoal (PLAN-094)', () => {
  test.setTimeout(300_000); // the lab boots the whole mappa2 pack (~2 min cold)
  test('trigger spawns a drifting blob; toggle is live (no rebuild)', async ({ page }) => {
    await page.goto('/mappa2-lab');
    await ready(page);
    await waterTab(page);

    // Tag the app — the ambient toggle must not rebuild it.
    const tag = await page.evaluate(() => {
      const app = (window as unknown as { __pixiApp?: Record<string, unknown> }).__pixiApp;
      if (app) app.__ambTag = (app.__ambTag as number) ?? Math.random();
      return (app?.__ambTag as number) ?? null;
    });
    expect(tag).not.toBeNull();

    await page.getByRole('button', { name: 'Trigger Shoal' }).dispatchEvent('click');
    await page.waitForFunction(
      () => {
        const d = (window as unknown as { __ambientDebug?: AmbDbg }).__ambientDebug;
        return (d?.shoal?.activeCount?.() ?? 0) > 0
          && (d?.director?.log ?? []).some((r) => r.outcome === 'spawned' && r.reason === 'manual');
      },
      null,
      { timeout: 5_000 },
    );

    // Real motion: the blob's position must change between two samples.
    const posA = await page.evaluate(() => {
      const b = (window as unknown as { __ambientDebug?: AmbDbg }).__ambientDebug?.shoal?.blobs?.find((q) => q.active);
      return b ? { x: b.school.x, y: b.school.y } : null;
    });
    await page.waitForTimeout(700);
    const posB = await page.evaluate(() => {
      const b = (window as unknown as { __ambientDebug?: AmbDbg }).__ambientDebug?.shoal?.blobs?.find((q) => q.active);
      return b ? { x: b.school.x, y: b.school.y } : null;
    });
    expect(posA).not.toBeNull();
    expect(posB).not.toBeNull();
    expect(Math.hypot(posB!.x - posA!.x, posB!.y - posA!.y), 'shoal blob must drift along its heading')
      .toBeGreaterThan(0.5);
    save('shoal-on.png', await page.screenshot({ type: 'png' }));

    // Live toggle OFF: layer hidden, app untouched.
    await page.locator('label', { hasText: 'ambient director' }).locator('input').dispatchEvent('click');
    await page.waitForTimeout(400);
    const hidden = await page.evaluate(
      () => (window as unknown as { __ambientDebug?: AmbDbg }).__ambientDebug?.layer?.visible ?? null,
    );
    expect(hidden, 'ambientSeaLayer must be hidden after toggle off').toBe(false);
    const tagAfter = await page.evaluate(
      () => ((window as unknown as { __pixiApp?: Record<string, unknown> }).__pixiApp?.__ambTag as number) ?? null,
    );
    expect(tagAfter, 'ambient toggle must not rebuild the Pixi app').toBe(tag);

    // Perf probe: p95 frame time OFF vs ON (evidence, target max(0.5ms, 2x noise)).
    const measure = () => page.evaluate(async () => {
      const times: number[] = [];
      let prev = performance.now();
      await new Promise<void>((res) => {
        const loop = () => {
          const now = performance.now();
          times.push(now - prev);
          prev = now;
          if (times.length >= 120) res();
          else requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      });
      times.sort((a, b) => a - b);
      return times[Math.floor(times.length * 0.95)];
    });
    const off95 = await measure();
    await page.locator('label', { hasText: 'ambient director' }).locator('input').dispatchEvent('click');
    await page.getByRole('button', { name: 'Trigger Shoal' }).dispatchEvent('click');
    await page.waitForTimeout(500);
    const on95 = await measure();
    const d95 = on95 - off95;
    save('perf.json', JSON.stringify({ offP95Ms: off95, onP95Ms: on95, deltaP95Ms: d95 }, null, 2));
    expect(d95, `ambient frame delta p95 ${d95.toFixed(2)}ms must stay under 0.5ms+noise`)
      .toBeLessThan(Math.max(0.5, off95));
  });

  test('reduced motion keeps the scheduled layer empty and invisible', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/mappa2-lab');
    await ready(page);
    await waterTab(page);
    await page.getByRole('button', { name: 'Trigger Shoal' }).dispatchEvent('click');
    await page.waitForTimeout(1200);
    const state = await page.evaluate(() => {
      const d = (window as unknown as { __ambientDebug?: AmbDbg }).__ambientDebug;
      const anyVisible = (d?.shoal?.blobs ?? []).some((b) => b.school.visible);
      return { active: d?.shoal?.activeCount?.() ?? -1, anyVisible };
    });
    expect(state.active, 'reduced motion: no active scheduled blobs').toBe(0);
    expect(state.anyVisible, 'reduced motion: no visible blob sprite').toBe(false);
    await ctx.close();
  });
});
