const { chromium } = require('@playwright/test');
const fs = require('fs');
(async () => {
  const outDir = 'test-results/plan-091-mappa2-waterfall-prototype';
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('console', (m) => { if (m.type() === 'error') console.log('[pageerror]', m.text()); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto('http://127.0.0.1:5173/mappa2-lab');
  await page.waitForFunction(() => document.querySelector('[data-testid="mappa2-lab-hud"]')?.textContent?.includes('ready: yes'), null, { timeout: 90000 });
  // tag the app instance so we can prove no rebuild happened across control changes
  const appTag = await page.evaluate(() => { const a = window.__pixiApp; if (a) a.__wfTag = (a.__wfTag ?? Math.random()); return a ? a.__wfTag : null; });
  console.log('appTag', appTag);
  // focus the waterfall
  await page.getByRole('button', { name: 'Cascata' }).click();
  await page.waitForTimeout(1800);
  const canvas = page.locator('[data-testid="pixi-world-canvas"]');
  await canvas.screenshot({ path: `${outDir}/wf-frame-a.png` });
  await page.waitForTimeout(420);
  await canvas.screenshot({ path: `${outDir}/wf-frame-b.png` });
  await page.screenshot({ path: `${outDir}/wf-full.png` });
  const cam = await page.evaluate(() => window.__worldCam ?? null);
  console.log('cam', JSON.stringify(cam));
  // toggle waterfall off via Water tab (live, must not rebuild)
  await page.getByRole('button', { name: 'water', exact: true }).click();
  await page.locator('label', { hasText: 'waterfall' }).locator('input').uncheck();
  await page.waitForTimeout(300);
  const appTagAfter = await page.evaluate(() => window.__pixiApp?.__wfTag ?? null);
  console.log('appTagAfter', appTagAfter, 'sameApp:', appTag === appTagAfter);
  await canvas.screenshot({ path: `${outDir}/wf-off.png` });
  await browser.close();
})();
