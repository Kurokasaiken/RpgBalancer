import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on('pageerror', (e) => console.log('PAGE_ERROR', String(e).slice(0, 160)));
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
try { await page.waitForFunction(() => window.__worldCam, null, { timeout: 120000 }); } catch { console.log('cam timeout'); }
await page.waitForTimeout(3000);
const info = await page.evaluate(() => {
  const cam = window.__worldCam;
  const anchors = [...document.querySelectorAll('[data-poi-zoom]')].map((a) => ({
    zoom: a.getAttribute('data-poi-zoom'),
    light: a.querySelectorAll('.poi-light').length,
    detailVisible: [...a.querySelectorAll('.poi-detail')].filter((i) => getComputedStyle(i).display !== 'none').length,
  }));
  return { cam: cam ? { zoom: cam.zoom, fitZoom: cam.fitZoom } : null, anchors };
});
console.log('CAM/ANCHORS', JSON.stringify(info));
await page.screenshot({ path: '/tmp/game-poi-light.png' });
// crop a poi anchor region for detail check
const box = await page.evaluate(() => {
  const a = document.querySelector('[data-poi-zoom]');
  if (!a) return null;
  const r = a.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
console.log('ANCHOR_BOX', JSON.stringify(box));
if (box) {
  const cx = Math.max(0, box.x + box.w / 2 - 160), cy = Math.max(0, box.y + box.h / 2 - 160);
  await page.screenshot({ path: '/tmp/game-poi-light-crop.png', clip: { x: cx, y: cy, width: 320, height: 320 } });
}
await browser.close();
console.log('done');
