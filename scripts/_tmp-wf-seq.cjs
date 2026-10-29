const { chromium } = require('@playwright/test');
const fs = require('fs');
(async () => {
  const outDir = 'test-results/plan-091-mappa2-waterfall-prototype/seq';
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://127.0.0.1:5173/mappa2-lab');
  await page.waitForFunction(() => document.querySelector('[data-testid="mappa2-lab-hud"]')?.textContent?.includes('ready: yes'), null, { timeout: 90000 });
  await page.getByRole('button', { name: 'Cascata' }).click();
  await page.waitForTimeout(2000);
  const canvas = page.locator('[data-testid="pixi-world-canvas"]');
  for (let i = 0; i < 7; i++) {
    await canvas.screenshot({ path: `${outDir}/f${i}.png` });
    await page.waitForTimeout(300);
  }
  await browser.close();
})();
