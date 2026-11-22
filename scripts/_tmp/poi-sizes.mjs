import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
try { await page.waitForFunction(() => window.__worldCam, null, { timeout: 120000 }); } catch (e) { console.log('cam timeout'); }
await page.waitForTimeout(4000);
try { await page.waitForSelector('[data-poi-zoom]', { timeout: 30000 }); } catch { console.log('no anchors'); }
const info = await page.evaluate(() => {
  return [...document.querySelectorAll('[data-poi-zoom]')].map((a) => {
    const r = a.getBoundingClientRect();
    const z = a.querySelector('[data-poi-zanara]');
    const halo = a.querySelector('.poi-halo');
    const glow = a.querySelector('.poi-glow');
    return {
      fam: z?.getAttribute('data-poi-zanara') ?? 'none',
      w: Math.round(r.width), h: Math.round(r.height),
      haloW: halo ? Math.round(halo.getBoundingClientRect().width) : null,
      glowW: glow ? Math.round(glow.getBoundingClientRect().width) : null,
      light: !!a.querySelector('.poi-light'),
    };
  });
});
console.log(JSON.stringify(info));
await browser.close();
