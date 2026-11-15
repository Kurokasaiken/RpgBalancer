/* _tmp-fancards-witness.mjs — T-04 witness PlaceFanCards on /lab/poi-luogo.
   Headless screenshots at 1440x900 and 1280x800 (OB-F3). */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://127.0.0.1:5173';
const OUT = 'test-results/poi-luogo-fancards';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const results = {};

for (const [w, h] of [[1440, 900], [1280, 800]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (e) => console.error('[pageerror]', String(e).slice(0, 200)));
  await page.goto(`${BASE}/lab/poi-luogo`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.__worldCam && window.__worldCamCtl), undefined, { timeout: 90_000 });
  await page.waitForTimeout(2500);
  await page.evaluate(([vw, vh]) => window.__worldCamCtl.set({ panX: 1515 - vw / 2, panY: 700 - vh / 2, zoom: 1 }), [w, h]);
  await page.waitForTimeout(1200);
  const hit = page.locator('[data-testid="place-village-hit"]');
  await hit.waitFor({ state: 'attached', timeout: 15_000 });
  await hit.click({ force: true });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/fancards-${w}x${h}.png` });
  const el = page.locator('[data-testid="place-fancards"]');
  const n = await el.count();
  if (n > 0) {
    const box = await el.first().boundingBox();
    if (box) {
      const pad = 60;
      await page.screenshot({ path: `${OUT}/fancards-zoom-${w}x${h}.png`, clip: {
        x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad),
        width: Math.min(w - Math.max(0, box.x - pad), box.width + pad * 2),
        height: Math.min(h - Math.max(0, box.y - pad), box.height + pad * 2) } });
    }
  }
  const slots = await page.locator('[data-testid^="place-fancards-slot-"]').count();
  results[`${w}x${h}`] = { fancardsVisible: n > 0, slots };
  await page.close();
}
console.log(JSON.stringify(results));
await browser.close();
