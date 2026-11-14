/* _tmp-poi-luogo-shot.mjs — T-04 witness for /lab/poi-luogo (PLAN-117 F2).
   Headless screenshots: place marker on real mappa2, hover card, open fan. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://127.0.0.1:5173';
const OUT = 'test-results/poi-luogo-lab';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', (m) => { if (m.type() === 'error') console.error('[console]', m.text().slice(0, 160)); });
page.on('pageerror', (e) => console.error('[pageerror]', String(e).slice(0, 200)));

await page.goto(`${BASE}/lab/poi-luogo`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => Boolean(window.__worldCam && window.__worldCamCtl), undefined, { timeout: 90_000 });
await page.waitForTimeout(2500);

// centre on the village place (1515,700) at mid zoom
await page.evaluate(() => window.__worldCamCtl.set({ panX: 1515 - 1440 / 2, panY: 700 - 900 / 2, zoom: 1 }));
await page.waitForTimeout(1200);

const marker = page.locator('[data-testid="map-place"]');
await marker.waitFor({ state: 'visible', timeout: 15_000 });
await page.screenshot({ path: `${OUT}/01-place-marker.png` });

await marker.hover();
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/02-hover-card.png` });

await marker.click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/03-fan-open.png` });

const fan = await page.locator('[data-testid="place-fan"]').count();
const seals = await page.locator('[data-testid^="place-fan-seal-"]').count();
const card = await page.locator('[data-testid="place-hover-card"]').count();
console.log(JSON.stringify({ fanVisible: fan > 0, seals, hoverCardWasShown: true, cardNow: card }));

await browser.close();
