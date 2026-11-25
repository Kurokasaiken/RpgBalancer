import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
await p.goto('http://localhost:5173/game', { waitUntil: 'commit', timeout: 150000 });
try { await p.waitForLoadState('domcontentloaded', { timeout: 120000 }); } catch {}
try { await p.waitForSelector('[data-poi-zoom] .poi-light, [data-poi-zoom] img', { timeout: 150000 }); } catch {}
await p.waitForTimeout(8000);
const info = await p.evaluate(() => [...document.querySelectorAll('[data-poi-zoom]')].map(a => {
  const r = a.getBoundingClientRect();
  return { w: Math.round(r.width), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2),
    mode: a.getAttribute('data-poi-zoom'),
    zanara: !!a.querySelector('img[src*="poi-quest"], img[src*="poi-job"], .poi-light'),
    v37: !!a.querySelector('.poiv3_7') };
}));
console.log(JSON.stringify(info));
const pt = info.find(a => a.zanara && !a.v37) ?? info[0];
const s = 320;
await p.screenshot({ path: '.mw/specs/poi-map-icon/card/zanara-back.png',
  clip: { x: Math.max(0, pt.x - s / 2), y: Math.max(0, pt.y - s / 2), width: s, height: s } });
await b.close();
console.log('done');
