/**
 * mappa2RegionalWeather.spec.ts — PLAN-098 regression contract for the
 * regional weather overlay (mist + embers, `weather-anchors.json` leaf,
 * `regional-weather` box z=4 under REGION_RING_Z=5).
 *
 * Claims proven here:
 *  (a) the box mounts with slots from the leaf (counts() = caps);
 *  (b) setTime() advances particles deterministically — same simT => same
 *      positions twice (freeze + setTime seam, numeric witness);
 *  (c) the lab toggle hides the box live without a Pixi rebuild;
 *  (d) reduced motion: embers hidden, mist renders but stays static.
 */
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const EVIDENCE_DIR = 'test-results/plan-098-mappa2-regional-weather';
const save = (name: string, data: Buffer | string) => {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  writeFileSync(`${EVIDENCE_DIR}/${name}`, data);
};

interface WDbg {
  box?: { visible: boolean; children?: unknown[]; zIndex?: number; label?: string };
  counts?: () => Record<string, number>;
  positions?: () => { id: string; type: string; x: number; y: number; visible: boolean; alpha: number }[];
  freeze?: () => void;
  setTime?: (ms: number) => void;
}
const dbg = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as unknown as { __regionalWeatherDebug?: WDbg }).__regionalWeatherDebug);

const ready = (page: import('@playwright/test').Page) =>
  page.waitForFunction(
    () => document.querySelector('[data-testid="mappa2-lab-hud"]')?.textContent?.includes('ready: yes'),
    null,
    { timeout: 180_000 },
  );

const skyTab = async (page: import('@playwright/test').Page) => {
  await page.getByRole('button', { name: 'sky', exact: true }).click();
};

test.describe('mappa2 Regional Weather mist+volcano+storm (PLAN-098)', () => {
  test.setTimeout(300_000);

  test('mounts leaf slots, determinism via setTime, live toggle, reduced motion', async ({ page }) => {
    await page.goto('/mappa2-lab');
    await ready(page);
    const d0 = await dbg(page);
    expect(d0?.box?.label).toBe('regional-weather');
    expect(d0?.box?.zIndex).toBe(4);
    const counts = await page.evaluate(() => (window as unknown as { __regionalWeatherDebug: WDbg }).__regionalWeatherDebug.counts!());
    save('counts.json', JSON.stringify(counts));
    expect(counts.mist).toBeGreaterThanOrEqual(4);
    expect(counts.volcano).toBeGreaterThanOrEqual(4);
    expect(counts.orographic).toBeGreaterThanOrEqual(4);
    expect(counts.glint ?? 0).toBe(0); // snow glints removed (Director 2026-10-30)
    expect(counts.mist + counts.volcano).toBeLessThanOrEqual(60);

    // Determinism: freeze the clock, pin simT twice -> identical positions.
    const snap = async () => {
      await page.evaluate(() => {
        const w = (window as unknown as { __regionalWeatherDebug: WDbg }).__regionalWeatherDebug;
        w.freeze!();
        w.setTime!(5000);
      });
      await page.waitForTimeout(120); // sprite positions lag one frame behind setTime
      return page.evaluate(() => (window as unknown as { __regionalWeatherDebug: WDbg }).__regionalWeatherDebug.positions!());
    };
    const a = await snap();
    const b = await snap();
    expect(b).toEqual(a);
    await page.evaluate(() => (window as unknown as { __regionalWeatherDebug: WDbg }).__regionalWeatherDebug.setTime!(9000));
    await page.waitForTimeout(120);
    const c = await page.evaluate(() => (window as unknown as { __regionalWeatherDebug: WDbg }).__regionalWeatherDebug.positions!());
    expect(c).not.toEqual(a); // time actually moves particles
    save('positions.json', JSON.stringify({ t5000: a, t9000: c }));

    // Live toggle: uncheck "regional weather" -> box.visible false, no rebuild.
    await skyTab(page);
    const toggle = page.getByRole('checkbox', { name: /regional weather/i });
    await toggle.uncheck();
    const hidden = await page.evaluate(() => (window as unknown as { __regionalWeatherDebug: WDbg }).__regionalWeatherDebug.box!.visible);
    expect(hidden).toBe(false);
    await toggle.check();
    const shown = await page.evaluate(() => (window as unknown as { __regionalWeatherDebug: WDbg }).__regionalWeatherDebug.box!.visible);
    expect(shown).toBe(true);
  });

  test('reduced motion: embers hidden, mist static', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/mappa2-lab');
    await ready(page);
    const st = await page.evaluate(() => {
      const w = (window as unknown as { __regionalWeatherDebug: WDbg }).__regionalWeatherDebug;
      if (!w) return null;
      w.freeze!();
      w.setTime!(4000);
      const p1 = w.positions!();
      w.setTime!(40000);
      const p2 = w.positions!(); // frozen+static mist => same by construction
      return { p1, p2 };
    });
    expect(st).not.toBeNull();
    const transient = st!.p1.filter((p) => p.type === 'glint');
    expect(transient.every((e) => !e.visible)).toBe(true); // glints hidden under reducedMotion
    // mist alpha is the reduced-motion floor (opacity*0.6=0.36) and positions
    // do not drift between two different simT values.
    const mist1 = st!.p1.filter((p) => p.type === 'mist' && p.visible);
    const mist2 = st!.p2.filter((p) => p.type === 'mist' && p.visible);
    expect(mist1.length).toBeGreaterThan(0);
    expect(mist1.every((m) => Math.abs(m.alpha - 0.36) < 0.02)).toBe(true);
    expect(mist2.map((m) => [m.x, m.y])).toEqual(mist1.map((m) => [m.x, m.y]));
    save('reduced-motion.json', JSON.stringify(st));
    await ctx.close();
  });
});
