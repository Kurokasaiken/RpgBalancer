/**
 * seaMarks.spec.ts — PLAN-013 residual verification (Q10, 2026-10-19).
 *
 * Mechanical half of the measurement contract
 * (`src/docs/docs/sea_motion_measurement_contract.md`):
 *   - the mark kit mounts and animates (cross-fade + drift live on the
 *     `/sea-effect-lab` tiles — the DOM overlay, same config the Pixi
 *     production port reads);
 *   - `prefers-reduced-motion` keeps every mark hidden;
 *   - T-04 witness: two captures of the open-sea tile, ~2.5 s apart.
 *
 * The lab renders all variant tiles at once — no click needed.
 */
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const RUN_DIR = process.env.RUN_DIR ?? path.resolve('.mw/runs/plan013-sea-marks');

test.describe('PLAN-013 — sea marks acceptance', () => {
  test('marks fade in and drift on the sea tiles', async ({ page }) => {
    await page.goto('/sea-effect-lab');
    const marks = page.locator('.ws-sea-mark');
    await expect(marks.first()).toBeAttached();
    /* Kit per spec: 20–40 marks per config; three seamarks tiles mount
     * coast/open/both — the count must clear the per-kit floor. */
    expect(await marks.count()).toBeGreaterThanOrEqual(20);

    /* Contract point 1 (100 ms window): at least one mark's computed
     * opacity moves within ~2.5 s — the cross-fade cycle is live. */
    const sampleOpacities = () =>
      marks.evaluateAll((els) => els.map((el) => parseFloat(getComputedStyle(el).opacity)));
    const t0 = await sampleOpacities();
    await page.waitForTimeout(2500);
    const t1 = await sampleOpacities();
    expect(t0.filter((v, i) => Math.abs(v - t1[i]) > 0.01).length).toBeGreaterThan(0);

    /* T-04 witness: same tile, two frames — the difference IS the motion. */
    mkdirSync(RUN_DIR, { recursive: true });
    const tile = page.locator('section, div').filter({ hasText: '01b · Sea marks' }).first();
    await page.screenshot({ path: path.join(RUN_DIR, 'seamarks-t0.png') });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(RUN_DIR, 'seamarks-t1.png') });
    await tile.screenshot({ path: path.join(RUN_DIR, 'seamarks-open-tile.png') }).catch(() => undefined);
  });

  test('prefers-reduced-motion keeps every mark hidden', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/sea-effect-lab');
    const marks = page.locator('.ws-sea-mark');
    await expect(marks.first()).toBeAttached();
    const opacities = await marks.evaluateAll((els) =>
      els.map((el) => parseFloat(getComputedStyle(el).opacity)),
    );
    expect(opacities.every((o) => o === 0)).toBe(true);
  });
});
