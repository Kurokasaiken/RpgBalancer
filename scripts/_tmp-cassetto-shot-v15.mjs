/* _tmp-cassetto-shot-v15.mjs — T-04 witness: cassetto con roster chiuso, dopo enamel-edge mask. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://127.0.0.1:5173';
const OUT = 'test-results/cassetto-review';
mkdirSync(OUT, { recursive: true });

const url = `${BASE}/hud-compose?comp=cassetto`;
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => console.error('[pageerror]', String(e).slice(0, 200)));
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForTimeout(12000);
// hide the lab roster docked left of the cassetto column (right:400, width:300)
await page.evaluate(() => {
  for (const el of document.querySelectorAll('div,section')) {
    const r = el.getBoundingClientRect();
    if (r.width === 300 && Math.abs(r.left - 740) < 2) { el.style.display = 'none'; }
  }
});
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/compose-cassetto-v15.png` });
console.log('done');
await browser.close();
