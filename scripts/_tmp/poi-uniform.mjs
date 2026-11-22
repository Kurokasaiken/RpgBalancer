import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
try { await page.waitForFunction(() => window.__worldCam, null, { timeout: 120000 }); } catch {}
await page.waitForTimeout(4000);
try { await page.waitForSelector('[data-poi-zoom]', { timeout: 30000 }); } catch {}
const info = await page.evaluate(() => {
  return [...document.querySelectorAll('[data-poi-zoom]')].map((a) => {
    const r = a.getBoundingClientRect();
    const z = a.querySelector('[data-poi-zanara]');
    return { fam: z?.getAttribute('data-poi-zanara') ?? 'none', w: Math.round(r.width), light: !!a.querySelector('.poi-light') };
  });
});
console.log(JSON.stringify(info));
const jb = await page.evaluate(() => {
  const a = [...document.querySelectorAll('[data-poi-zoom]')].find(x => x.querySelector('[data-poi-zanara="job"]'));
  if (!a) return null; const r = a.getBoundingClientRect();
  return { x: r.x + r.width/2, y: r.y + r.height/2 };
});
if (jb) await page.screenshot({ path: '/tmp/job-light.png', clip: { x: jb.x-140, y: jb.y-140, width: 280, height: 280 } });
await page.screenshot({ path: '/tmp/uniform-full.png' });
await browser.close();
