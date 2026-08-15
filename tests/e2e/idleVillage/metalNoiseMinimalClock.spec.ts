import { test } from '@playwright/test';

test('minimal clock after metal noise fix', async ({ page }) => {
  await page.goto('/minimal-clock');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/minimal-clock-metal-noise-fix.png' });
});
