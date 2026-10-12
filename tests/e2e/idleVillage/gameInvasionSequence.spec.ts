/**
 * PLAN-033 — /game invasion sequence, geometric checks (BV-1 curtains meet, BV-2 card in the viewport).
 * Pixel checks of the rendered frame belong to the visual pass; these assert the layout the frame is built from.
 */
import { expect, test } from '@playwright/test';

const VIEWPORTS = [
  { name: '16:9', width: 1920, height: 1080 },
  { name: '21:9', width: 2560, height: 1100 },
];

type HooksWindow = Window & { __idleVillageTestHooks?: { startInvasion?: () => void } };

for (const vp of VIEWPORTS) {
  test.describe(`invasion sequence @ ${vp.name}`, () => {
    test.use({ locale: 'en-US' });

    test('BV-1: closed curtains meet at the centre, with no strip of map', async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/game?capture=1');
      await page.waitForFunction(() => (window as HooksWindow).__idleVillageTestHooks?.startInvasion, { timeout: 30_000 });
      await page.evaluate(() => (window as HooksWindow).__idleVillageTestHooks?.startInvasion?.());
      await expect(page.locator('[data-testid="ws-event-shroud"] .ws-event-shroud__half--closed')).toHaveCount(2, { timeout: 5_000 });
      // The transition is 0.9s; wait it out before measuring.
      await page.waitForTimeout(1_200);

      const cover = await page.evaluate(() => {
        const shroud = document.querySelector('[data-testid="ws-event-shroud"]')?.getBoundingClientRect();
        const left = document.querySelector('.ws-event-shroud__half--left')?.getBoundingClientRect();
        const right = document.querySelector('.ws-event-shroud__half--right')?.getBoundingClientRect();
        if (!shroud || !left || !right) return null;
        return { w: shroud.width, leftRight: left.right - shroud.left, rightLeft: right.left - shroud.left };
      });
      expect(cover).not.toBeNull();
      const mid = (cover?.w ?? 0) / 2;
      // Left box reaches past the centre, right box starts before it: the two overlap there.
      expect(cover!.leftRight).toBeGreaterThanOrEqual(mid);
      expect(cover!.rightLeft).toBeLessThanOrEqual(mid);
    });

    test('BV-2: the announcement card sits fully inside the viewport, in the middle band', async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/game?capture=1');
      await page.waitForFunction(() => (window as HooksWindow).__idleVillageTestHooks?.startInvasion, { timeout: 30_000 });
      await page.evaluate(() => (window as HooksWindow).__idleVillageTestHooks?.startInvasion?.());
      // The wrapper is 0x0 (it only anchors the card); the visible body is the modal inside it.
      const card = page.getByTestId('world-event-card-body');
      await expect(card).toBeVisible({ timeout: 10_000 });
      await page.waitForTimeout(1_200);

      const box = await card.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(vp.width);
      expect(box!.y + box!.height).toBeLessThanOrEqual(vp.height);
      const centreY = (box!.y + box!.height / 2) / vp.height;
      expect(centreY).toBeGreaterThan(0.2);
      expect(centreY).toBeLessThan(0.8);
    });
  });
}
