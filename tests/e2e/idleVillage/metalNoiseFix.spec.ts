import { test } from '@playwright/test';

test('verify metal noise square gone', async ({ page }) => {
  await page.goto('/day-night-poi-skin-debug');
  await page.waitForLoadState('networkidle');
  await page.locator('h1').waitFor({ state: 'visible', timeout: 30_000 });

  // Disable all layers except metal noise to see the artifact
  const all = page.locator('input[type="checkbox"]');
  const count = await all.count();
  for (let i = 0; i < count; i++) {
    await all.nth(i).uncheck();
  }
  // Re-enable only metal noise
  await page.locator('label:has-text("Metal noise") input').check();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'test-results/metal-noise-only.png' });

  // Disable metal noise and enable all else
  await page.locator('label:has-text("Metal noise") input').uncheck();
  for (let i = 0; i < count; i++) {
    if (await all.nth(i).isVisible()) {
      const label = await all.nth(i).locator('..').textContent();
      if (label && !label.includes('Metal noise')) {
        await all.nth(i).check();
      }
    }
  }
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'test-results/metal-noise-disabled.png' });
});
