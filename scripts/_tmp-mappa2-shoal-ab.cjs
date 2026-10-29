// A/B witness: same camera, ambientSeaLayer visible vs hidden -> isolate the
// shoal's own pixels; crop around the blob for the eye-check.
const { chromium } = require('@playwright/test');
const fs = require('fs');
(async () => {
  const outDir = 'test-results/plan-094-mappa2-ambient-director/eyecheck';
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto('http://127.0.0.1:5173/mappa2-lab');
  await page.waitForFunction(
    () => document.querySelector('[data-testid="mappa2-lab-hud"]')?.textContent?.includes('ready: yes'),
    null, { timeout: 180_000 });
  const canvas = page.locator('[data-testid="pixi-world-canvas"]');
  // click 'sea' tab until the ambient controls render (hydration race)
  for (let i = 0; i < 5; i++) {
    await page.getByRole('button', { name: 'sea', exact: true }).click();
    const ok = await page.waitForFunction(
      () => [...document.querySelectorAll('button')].some((b) => b.textContent.trim() === 'Trigger Shoal'),
      null, { timeout: 4000 }).then(() => true).catch(() => false);
    if (ok) break;
    console.log('sea tab click retry', i);
  }
  await page.getByRole('button', { name: 'Trigger Shoal' }).dispatchEvent('click');
  await page.waitForFunction(() => (window.__ambientDebug?.shoal?.activeCount?.() ?? 0) > 0, null, { timeout: 8_000 });
  const blob = await page.evaluate(() => {
    const d = window.__ambientDebug;
    const b = (d?.shoal?.blobs ?? []).find((x) => x.active);
    return b ? { x: b.sp.x, y: b.sp.y } : null;
  });
  console.log('blob', JSON.stringify(blob));
  await page.waitForTimeout(1200);
  await page.evaluate(() => { window.__pixiApp?.ticker?.stop(); });
  const zoom = 3;
  await page.evaluate(({ b, zoom }) => {
    window.__worldCamCtl?.set({ panX: b.x - 640 / zoom, panY: b.y - 360 / zoom, zoom });
    window.__pixiApp?.render();
  }, { b: blob, zoom });
  await page.waitForTimeout(300);
  await canvas.screenshot({ path: `${outDir}/ab-on.png` });
  await page.evaluate(() => { const d = window.__ambientDebug; if (d?.layer) d.layer.visible = false; window.__pixiApp?.render(); });
  await canvas.screenshot({ path: `${outDir}/ab-off.png` });
  await page.evaluate(() => { const d = window.__ambientDebug; if (d?.layer) d.layer.visible = true; window.__pixiApp?.render(); });
  await browser.close();
})();
