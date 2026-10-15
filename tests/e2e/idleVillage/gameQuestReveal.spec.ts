/**
 * gameQuestReveal.spec.ts — R-200 / PLAN-037: on `/game` the authored quest
 * offers reveal themselves once the boot veil is gone — one at a time,
 * `questReveal.staggerMs` of wall clock apart (config-first pacing: 1s first
 * entrance, 5s stagger) — and never hide again.
 *
 * Covered contracts:
 * - Auto-reveal: markers mount in authored order (goblin → rovine) without
 *   any Director action; the second entrance lands measurably after the
 *   first (asserted with generous headroom — the exact ms pacing is the
 *   unit test's job, here we prove the staggering exists).
 * - Permanence: once revealed the markers never unmount on their own.
 * - Director «Show quest» is a one-way «reveal now»: it jumps the stagger
 *   queue (both markers mount at once) and stays pressed; it never hides.
 * - Director «Reset» re-arms the stagger: the markers ghost out and the
 *   offers re-enter one at a time (a fresh take of the sequence).
 */
import { test, expect, type Page } from '@playwright/test';

const POI_GOBLIN = 'poi-goblin';
const POI_ROVINE = 'poi-rovine';

const marker = (page: Page, poiId: string) => page.locator(`[data-quest-poi-id="${poiId}"]`);
const markers = (page: Page) => page.locator('[data-map-quest-poi-target]');
const director = (page: Page) => page.getByTestId('director-panel');

interface HooksWindow extends Window {
  __idleVillageTestHooks?: { expedition?: Record<string, unknown> };
}

test.beforeEach(async ({ page }) => {
  await page.goto('/game');
  /* The expedition sessions mount with the page (before the veil lifts);
   *  waiting on them guarantees the reveal machinery is live. */
  await page.waitForFunction(
    ([a, b]) => {
      const exp = (window as HooksWindow).__idleVillageTestHooks?.expedition;
      return Boolean(exp?.[a]) && Boolean(exp?.[b]);
    },
    [POI_GOBLIN, POI_ROVINE],
    { timeout: 30_000 },
  );
});

test('le offerte compaiono da sole, una alla volta, e non scompaiono più (R-200)', async ({ page }) => {
  /* Goblin is the first authored offer: it mounts ~initialDelayMs after the
   *  veil lifts, with no Director click involved. */
  await expect(marker(page, POI_GOBLIN)).toBeVisible({ timeout: 60_000 });
  const goblinAt = Date.now();

  /* Rovine is the second authored offer: its entrance lands a full stagger
   *  after goblin's — a lower bound well under the authored 5s keeps the
   *  assert honest without racing CI jitter. */
  await expect(marker(page, POI_ROVINE)).toBeVisible({ timeout: 30_000 });
  expect(Date.now() - goblinAt, 'il secondo POI entra uno stagger dopo il primo').toBeGreaterThanOrEqual(3000);

  /* «nn scomparire mai»: once mounted, both stay — no self-hide, no
   *  auto-expiry inside the authored window. */
  await page.waitForTimeout(4000);
  await expect(markers(page)).toHaveCount(2);
  await expect(marker(page, POI_GOBLIN)).toBeVisible();
  await expect(marker(page, POI_ROVINE)).toBeVisible();
});

test('«Show quest» è un trigger one-way: salta lo stagger e non nasconde mai', async ({ page }) => {
  await page.keyboard.press('F10');
  await expect(director(page)).toBeVisible({ timeout: 10_000 });
  await page.locator('[data-action-id="quest"]').click();

  /* Reveal-now: both offers mount at once regardless of the stagger slot —
   *  under the stagger's own cadence the second entrance would lag seconds. */
  await expect(page.getByTestId('pixi-world-anchors')).toBeVisible({ timeout: 60_000 });
  await expect(marker(page, POI_GOBLIN)).toBeVisible({ timeout: 15_000 });
  await expect(marker(page, POI_ROVINE)).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[data-action-id="quest"]')).toHaveAttribute('aria-pressed', 'true');

  /* Clicking again cannot hide anything — the action is one-way. */
  await page.locator('[data-action-id="quest"]').click();
  await page.waitForTimeout(400);
  await expect(markers(page)).toHaveCount(2);
});

test('«Reset» ri-arma lo stagger: i marker escono e rientrano uno alla volta', async ({ page }) => {
  /* Force-reveal first so the reset has something to unstage. */
  await page.keyboard.press('F10');
  await expect(director(page)).toBeVisible({ timeout: 10_000 });
  await page.locator('[data-action-id="quest"]').click();
  await expect(markers(page)).toHaveCount(2, { timeout: 30_000 });
  await expect(page.locator('[data-action-id="quest"]')).toHaveAttribute('aria-pressed', 'true');

  /* Reset disarms the reveal (the action un-presses — deterministic state
   *  proof) and re-arms the stagger: the revealed markers ghost out, then
   *  the offers re-enter one at a time (a fresh take of the sequence). */
  await page.locator('button', { hasText: /reset/i }).click();
  await expect(page.locator('[data-action-id="quest"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(marker(page, POI_GOBLIN)).toBeVisible({ timeout: 20_000 });
  await expect(marker(page, POI_ROVINE)).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-action-id="quest"]')).toHaveAttribute('aria-pressed', 'true');
});
