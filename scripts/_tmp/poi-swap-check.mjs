import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
try { await page.waitForFunction(() => window.__worldCam, null, { timeout: 120000 }); } catch {}
await page.waitForTimeout(4000);
try { await page.waitForSelector('[data-poi-zoom]', { timeout: 30000 }); } catch {}
const boxes = await page.evaluate(() => {
  const out = {}; const cam = window.__worldCam;
  for (const a of document.querySelectorAll('[data-poi-zoom]')) {
    const f = a.querySelector('[data-poi-zanara]')?.getAttribute('data-poi-zanara');
    if (f && !out[f]) { const r = a.getBoundingClientRect(); out[f] = { x: r.x + r.width/2, y: r.y + r.height/2, zoom: a.getAttribute('data-poi-zoom') }; }
  }
  return { out, camKeys: Object.keys(cam || {}), fit: cam?.fitZoom, zoom: cam?.zoom };
});
console.log(JSON.stringify(boxes));
for (const [f, b] of Object.entries(boxes.out)) {
  await page.screenshot({ path: `/tmp/swap-far-${f}.png`, clip: { x: b.x-140, y: b.y-140, width: 280, height: 280 } });
}
// zoom in on the quest poi: try cam.setZoom / assign
const zoomed = await page.evaluate((pt) => {
  const cam = window.__worldCam;
  if (!cam) return 'nocam';
  if (cam.setZoom) { cam.setZoom(cam.fitZoom * 1.8, pt); return 'setZoom'; }
  if (cam.zoom !== undefined) { cam.zoom = cam.fitZoom * 1.8; return 'assign'; }
  return 'noapi:' + Object.keys(cam).join(',');
}, boxes.out.quest);
console.log('ZOOM', zoomed);
await page.waitForTimeout(1200);
const after = await page.evaluate((pt) => {
  const cam = window.__worldCam;
  const a = [...document.querySelectorAll('[data-poi-zoom]')].find(x => x.querySelector('[data-poi-zanara="quest"]'));
  const r = a.getBoundingClientRect();
  return { mode: a.getAttribute('data-poi-zoom'), x: r.x + r.width/2, y: r.y + r.height/2, zoom: cam?.zoom };
}, boxes.out.quest);
console.log('AFTER', JSON.stringify(after));
await page.screenshot({ path: '/tmp/swap-near-quest.png', clip: { x: Math.max(0,after.x-160), y: Math.max(0,after.y-160), width: 320, height: 320 } });
await browser.close();
console.log('done');
