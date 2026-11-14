/* _tmp-poi-radial-shot.mjs — T-04 witness for the inclined radial (F2 sub-plan). */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://127.0.0.1:5173';
const OUT = 'test-results/poi-luogo-radial';
mkdirSync(OUT, { recursive: true });

for (const vp of [{ width: 1440, height: 900 }, { width: 1280, height: 800 }]) {
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: vp });
  page.on('pageerror', (e) => console.error('[pageerror]', String(e).slice(0, 200)));
  await page.goto(`${BASE}/lab/poi-luogo`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.__worldCam && window.__worldCamCtl), undefined, { timeout: 90_000 });
  await page.waitForTimeout(2000);
  await page.evaluate(([w, h]) => window.__worldCamCtl.set({ panX: 1515 - w / 2, panY: 700 - h / 2, zoom: 1 }), [vp.width, vp.height]);
  await page.waitForTimeout(1000);
  const marker = page.locator('[data-testid="map-place"]');
  await marker.waitFor({ state: 'visible', timeout: 15_000 });
  await marker.click();
  await page.waitForTimeout(700);
  const tag = `${vp.width}x${vp.height}`;
  await page.screenshot({ path: `${OUT}/${tag}-radial-open.png` });
  // dwell on slot 0 → card
  await page.locator('[data-testid="place-radial-slot-0"]').hover({ force: true });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${tag}-radial-card.png` });
  const slots = await page.locator('[data-testid^="place-radial-slot-"]').count();
  const card = await page.locator('[data-testid="place-radial-card"]').count();
  console.log(JSON.stringify({ tag, slots, card: card > 0 }));
  await browser.close();
}
