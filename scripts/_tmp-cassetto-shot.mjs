/* _tmp-cassetto-shot.mjs — T-04 witness: cassetto on /hud-compose + /game. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://127.0.0.1:5173';
const OUT = 'test-results/cassetto-review';
mkdirSync(OUT, { recursive: true });

const url = process.env.URL || `${BASE}/hud-compose?comp=cassetto`;
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => console.error('[pageerror]', String(e).slice(0, 200)));
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForTimeout(6000);
await page.screenshot({ path: `${OUT}/compose-cassetto-1440x900.png` });
console.log('done');
await browser.close();
