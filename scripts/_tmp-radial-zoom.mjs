import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 2 });
await p.goto('http://localhost:5173/lab/poi-luogo', { waitUntil: 'domcontentloaded', timeout: 90000 });
await p.waitForSelector('[data-testid="place-village-hit"]', { timeout: 90000 });
await p.waitForTimeout(5000);
let ok = false;
for (let i = 0; i < 10 && !ok; i += 1) {
  const e = await p.evaluate(() => document.querySelector('[data-testid="place-village-hit"]')?.getAttribute('aria-expanded'));
  if (e !== 'true') await p.evaluate(() => document.querySelector('[data-testid="place-village-hit"]').click());
  try { await p.waitForSelector('[data-testid="place-radial-disc"]', { state: 'attached', timeout: 5000 }); ok = true; } catch { await p.waitForTimeout(1000); }
}
await p.evaluate(() => {
  const disc = document.querySelector('[data-testid="place-radial-disc"]');
  let n = disc;
  while (n && n !== document.body) { n.style.visibility = 'visible'; n = n.parentElement; }
  const root = document.querySelector('[data-testid="place-radial"]');
  if (root) { root.style.position = 'fixed'; root.style.left = '600px'; root.style.top = '430px'; root.style.zIndex = '9999'; }
});
await p.waitForTimeout(2500);
const disc = await p.$('[data-testid="place-radial-disc"]');
const box = await disc.boundingBox();
// crop solo la metà alta del disco
await p.screenshot({ path: '/tmp/radial-top.png', clip: { x: box.x + box.width * 0.15, y: Math.max(0, box.y - 30), width: box.width * 0.7, height: box.height * 0.55 }, timeout: 90000 });
await b.close();
