/* _tmp-detail-lab-shot.mjs — T-04 witness: detail-lab mockup candidates. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = 'test-results/detail-lab';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 3100, height: 1400 } });
await page.goto('http://127.0.0.1:5173/mockups/detail-lab/index.html', { waitUntil: 'networkidle', timeout: 30_000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/all-candidates.png`, fullPage: true });
const cands = await page.$$('.cand');
for (let i = 0; i < cands.length; i++) {
  await cands[i].screenshot({ path: `${OUT}/cand-${i + 1}.png` });
}
console.log('done', cands.length);
await browser.close();
