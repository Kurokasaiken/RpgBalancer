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
    const icon = [...a.querySelectorAll('img')].map(i => i.src.split('/').pop()).pop();
    return { fam: z?.getAttribute('data-poi-zanara') ?? '?', w: Math.round(r.width), icon,
      tid: a.getAttribute('data-testid') || z?.getAttribute('data-testid') || '' };
  });
});
console.log(JSON.stringify(info, null, 0));
await browser.close();
