// A/B witness v2: shoal alpha pushed to max via lab slider + tight crop on
// the diff region, so the eye-check judges the blob's real contribution.
const { chromium } = require('@playwright/test');
const fs = require('fs');
(async () => {
  const outDir = 'test-results/plan-094-mappa2-ambient-director/eyecheck';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto('http://127.0.0.1:5173/mappa2-lab');
  await page.waitForFunction(
    () => document.querySelector('[data-testid="mappa2-lab-hud"]')?.textContent?.includes('ready: yes'),
    null, { timeout: 180_000 });
  const canvas = page.locator('[data-testid="pixi-world-canvas"]');
  for (let i = 0; i < 5; i++) {
    await page.getByRole('button', { name: 'sea', exact: true }).click();
    const ok = await page.waitForFunction(
      () => [...document.querySelectorAll('button')].some((b) => b.textContent.trim() === 'Trigger Shoal'),
      null, { timeout: 4000 }).then(() => true).catch(() => false);
    if (ok) break;
  }
  // push shoal alpha slider to max (0.4) and intensity to max (2)
  await page.evaluate(() => {
    const setRange = (labelText, v) => {
      const lab = [...document.querySelectorAll('label')].find((l) => l.textContent.includes(labelText));
      const inp = lab?.querySelector('input[type=range]');
      if (!inp) return false;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(inp, String(v));
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    };
    console.log('alpha', setRange('shoal alpha', 0.4), 'intensity', setRange('intensity', 2), 'prob', setRange('shoal probability', 1));
  });
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Trigger Shoal' }).dispatchEvent('click');
  await page.waitForFunction(() => (window.__ambientDebug?.shoal?.activeCount?.() ?? 0) > 0, null, { timeout: 8_000 });
  await page.waitForTimeout(800);
  const blob = await page.evaluate(() => {
    const d = window.__ambientDebug;
    const b = (d?.shoal?.blobs ?? []).find((x) => x.active);
    return b ? { x: b.sp.x, y: b.sp.y, alpha: b.sp.alpha, scale: { x: b.sp.scale.x, y: b.sp.scale.y } } : null;
  });
  console.log('blob', JSON.stringify(blob));
  await page.evaluate(() => window.__pixiApp?.ticker?.stop());
  const zoom = 3;
  await page.evaluate(({ b, zoom }) => {
    window.__worldCamCtl?.set({ panX: b.x - 640 / zoom, panY: b.y - 360 / zoom, zoom });
    window.__pixiApp?.render();
  }, { b: blob, zoom });
  await page.waitForTimeout(300);
  await canvas.screenshot({ path: `${outDir}/ab2-on.png` });
  await page.evaluate(() => { const d = window.__ambientDebug; if (d?.layer) d.layer.visible = false; window.__pixiApp?.render(); });
  await canvas.screenshot({ path: `${outDir}/ab2-off.png` });
  await browser.close();
})();
