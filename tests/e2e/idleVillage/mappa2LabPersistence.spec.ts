/**
 * mappa2LabPersistence.spec.ts — R-297 follow-up regression contract.
 *
 * The lab tuning must persist per device on every surface (dev, preview,
 * Vercel): move a slider, reload, the value is still there. On production
 * «Save defaults» writes per-device storage and reports it honestly —
 * the dev-only code-bake endpoint is never called.
 */
import { test, expect } from '@playwright/test';

const LAB_MARKER = 'body[data-mappa2-lab="true"]';
const STORAGE_KEY = 'mappa2-lab:defaults:v1';
const SEA_TONE_RE = /sea tone/i;

test.describe('mappa2-lab tuning persistence (R-297)', () => {
  test('slider change survives a reload via per-device storage', async ({ page }) => {
    await page.goto('/mappa2-lab');
    await page.waitForSelector(LAB_MARKER, { timeout: 90000 });

    await page.getByRole('button', { name: 'sea', exact: true }).click();
    const slider = page.getByRole('slider', { name: SEA_TONE_RE });
    await slider.waitFor({ timeout: 90000 });
    const original = await slider.inputValue();
    const next = original === '0.2' ? '0' : '0.2';
    await slider.fill(next);

    // autosave is a fire-and-forget PersistenceService write — give it a beat.
    // playwright runtime persists to sessionStorage, production to localStorage.
    await page.waitForFunction(
      (key) =>
        window.localStorage.getItem(key) !== null ||
        window.sessionStorage.getItem(key) !== null,
      STORAGE_KEY,
      { timeout: 15000 },
    );

    await page.reload();
    await page.waitForSelector(LAB_MARKER, { timeout: 90000 });
    await page.getByRole('button', { name: 'sea', exact: true }).click();
    await page.getByRole('slider', { name: SEA_TONE_RE }).waitFor({ timeout: 90000 });

    const restored = await page.getByRole('slider', { name: SEA_TONE_RE }).inputValue();
    expect(restored).toBe(next);
  });

  test('«Save defaults» reports a real save (device storage on prod, code bake on dev)', async ({ page }) => {
    await page.goto('/mappa2-lab');
    await page.waitForSelector(LAB_MARKER, { timeout: 90000 });

    await page.getByRole('button', { name: 'Save defaults' }).click();
    const note = page.locator('text=/saved|saving/i').last();
    await expect(note).toBeVisible({ timeout: 15000 });
    await expect(note).not.toContainText(/fail/i);
  });

  test('«Share config» produces shareable text (share sheet or clipboard)', async ({ page }) => {
    // headless Chromium denies clipboard-write without an explicit grant;
    // real browsers allow it under user gesture on HTTPS.
    await page.context().grantPermissions(['clipboard-write']);
    await page.goto('/mappa2-lab');
    await page.waitForSelector(LAB_MARKER, { timeout: 90000 });

    await page.getByRole('button', { name: 'Share config' }).click();
    const note = page.locator('text=/copied|shared/i').last();
    await expect(note).toBeVisible({ timeout: 15000 });
  });
});
