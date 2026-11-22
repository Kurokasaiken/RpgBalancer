import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
try { await page.waitForFunction(() => window.__worldCam, null, { timeout: 120000 }); } catch {}
await page.waitForTimeout(4000);
try { await page.waitForSelector('[data-poi-zoom]', { timeout: 30000 }); } catch {}
const boxes = await page.evaluate(() => {
  return [...document.querySelectorAll('[data-poi-zoom]')].map((a) => {
    const r = a.getBoundingClientRect();
    const z = a.querySelector('[data-poi-zanara]');
    const html = [...a.querySelectorAll('img')].map(i => i.src.split('/').pop());
    return { fam: z?.getAttribute('data-poi-zanara') ?? 'none', cx: r.x + r.width/2, cy: r.y + r.height/2, w: r.width, imgs: html };
  });
});
console.log(JSON.stringify(boxes, null, 1));
const big = boxes.filter(b => b.fam === 'job').sort((a,b)=>b.w-a.w)[0];
if (big) await page.screenshot({ path: '/tmp/job-poi.png', clip: { x: big.cx-160, y: big.cy-160, width: 320, height: 320 } });
await browser.close();
