import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
try { await page.waitForFunction(() => window.__worldCam, null, { timeout: 120000 }); } catch {}
await page.waitForTimeout(4000);
try { await page.waitForSelector('[data-poi-zoom]', { timeout: 30000 }); } catch {}
const boxes = await page.evaluate(() => {
  const out = {};
  for (const a of document.querySelectorAll('[data-poi-zoom]')) {
    const f = a.querySelector('[data-poi-zanara]')?.getAttribute('data-poi-zanara');
    if (f && !out[f]) { const r = a.getBoundingClientRect(); out[f] = { x: r.x + r.width/2, y: r.y + r.height/2 }; }
  }
  return out;
});
for (const [f, b] of Object.entries(boxes)) {
  await page.screenshot({ path: `/tmp/v3-${f}.png`, clip: { x: b.x-140, y: b.y-140, width: 280, height: 280 } });
}
await page.screenshot({ path: '/tmp/v3-full.png' });
await browser.close();
console.log('ok', JSON.stringify(boxes));
