const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://127.0.0.1:5173/mappa2-lab');
  await page.waitForFunction(() => document.querySelector('[data-testid="mappa2-lab-hud"]')?.textContent?.includes('ready: yes'), null, { timeout: 90000 });
  await page.getByRole('button', { name: 'Cascata' }).click();
  await page.getByRole('button', { name: 'water', exact: true }).click();
  // set flow speed slider to 200
  const slider = page.locator('label', { hasText: 'flow speed' }).locator('input');
  await slider.fill('200');
  await page.waitForTimeout(1600);
  const canvas = page.locator('[data-testid="pixi-world-canvas"]');
  await canvas.screenshot({ path: 'test-results/plan-091-mappa2-waterfall-prototype/dir-a.png' });
  await page.waitForTimeout(420);
  await canvas.screenshot({ path: 'test-results/plan-091-mappa2-waterfall-prototype/dir-b.png' });
  await browser.close();
})();
