import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
try { await page.waitForFunction(() => window.__worldCam, null, { timeout: 120000 }); } catch {}
await page.waitForTimeout(4000);
try { await page.waitForSelector('[data-poi-zoom]', { timeout: 30000 }); } catch {}
const info = await page.evaluate(() => {
  return [...document.querySelectorAll('[data-poi-zoom]')].filter(a => a.getAttribute('data-testid') === 'map-quest-poi' || a.querySelector('[data-testid="map-quest-poi"]')).map((a) => {
    const r = a.getBoundingClientRect();
    const z = a.querySelector('[data-poi-zanara]');
    const zr = z?.getBoundingClientRect();
    const inner = a.querySelector('[data-testid="map-quest-poi"]');
    const ir = inner?.getBoundingClientRect();
    return { anchor: Math.round(r.width), zanara: zr ? Math.round(zr.width) : null,
      innerTid: ir ? Math.round(ir.width) : null,
      tf: inner ? getComputedStyle(inner).transform : '',
      ztf: z ? getComputedStyle(z).transform : '',
      zw: z ? getComputedStyle(z).width : '' };
  });
});
console.log(JSON.stringify(info, null, 0));
await browser.close();
