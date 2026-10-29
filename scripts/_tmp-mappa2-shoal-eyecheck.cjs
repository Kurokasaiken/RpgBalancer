// PLAN-094 shoal eye-check probe: boots /mappa2-lab headless, triggers a shoal,
// finds the live blob world position via __ambientDebug, captures fit + zoomed
// frames so a witness can actually SEE the shoal (T-04).
const { chromium } = require('@playwright/test');
const fs = require('fs');
(async () => {
  const outDir = 'test-results/plan-094-mappa2-ambient-director/eyecheck';
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.log('[console.error]', m.text()); });
  await page.goto('http://127.0.0.1:5173/mappa2-lab');
  await page.waitForFunction(
    () => document.querySelector('[data-testid="mappa2-lab-hud"]')?.textContent?.includes('ready: yes'),
    null, { timeout: 180_000 });
  console.log('ready');
  const canvas = page.locator('[data-testid="pixi-world-canvas"]');
  await page.getByRole('button', { name: 'sea', exact: true }).click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Trigger Shoal' }).dispatchEvent('click');
  await page.waitForFunction(() => {
    const d = window.__ambientDebug;
    return (d?.shoal?.activeCount?.() ?? 0) > 0;
  }, null, { timeout: 8_000 });
  const blobInfo = await page.evaluate(() => {
    const d = window.__ambientDebug;
    const b = (d?.shoal?.blobs ?? []).find((x) => x.active && x.sp?.visible !== false);
    const cam = window.__worldCam ?? null;
    const log = (d?.director?.log ?? []).slice(-5);
    return { blob: b ? { x: b.sp.x, y: b.sp.y } : null, cam, log, zones: d?.zones };
  });
  console.log('blobInfo', JSON.stringify(blobInfo));
  // settle a moment so the blob is visible mid-drift, then capture fit view
  await page.waitForTimeout(1500);
  await canvas.screenshot({ path: `${outDir}/shoal-fit.png` });
  // zoom to the blob (2x of resting zoom, centred on blob)
  if (blobInfo.blob && blobInfo.cam) {
    const { cam, blob } = blobInfo;
    const zoom = Math.min((cam.zoom ?? 0.5) * 2.5, 3);
    await page.evaluate(({ panX, panY, zoom }) => {
      window.__worldCamCtl?.set({ panX, panY, zoom });
    }, { panX: blob.x - 640 / zoom, panY: blob.y - 360 / zoom, zoom });
    await page.waitForTimeout(600);
    await canvas.screenshot({ path: `${outDir}/shoal-zoom-a.png` });
    await page.waitForTimeout(1200);
    await canvas.screenshot({ path: `${outDir}/shoal-zoom-b.png` });
    // even closer for texture witness
    const zoom2 = Math.min(zoom * 1.8, 6);
    await page.evaluate(({ panX, panY, zoom }) => {
      window.__worldCamCtl?.set({ panX, panY, zoom });
    }, { panX: blob.x - 640 / zoom2, panY: blob.y - 360 / zoom2, zoom: zoom2 });
    await page.waitForTimeout(500);
    await canvas.screenshot({ path: `${outDir}/shoal-zoom-c.png` });
  }
  const after = await page.evaluate(() => {
    const d = window.__ambientDebug;
    return { active: d?.shoal?.activeCount?.() ?? -1, simT: d?.director?.simT, logTail: (d?.director?.log ?? []).slice(-3) };
  });
  console.log('after', JSON.stringify(after));
  fs.writeFileSync(`${outDir}/eyecheck.json`, JSON.stringify({ blobInfo, after }, null, 2));
  await browser.close();
})();
