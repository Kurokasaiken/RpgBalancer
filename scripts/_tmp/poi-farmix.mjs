import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'commit', timeout: 150000 });
try { await page.waitForLoadState('domcontentloaded', { timeout: 120000 }); } catch {}
try { await page.waitForFunction(() => window.__worldCam, null, { timeout: 120000 }); } catch {}
await page.waitForTimeout(6000);
try { await page.waitForSelector('[data-poi-zoom]', { timeout: 45000 }); } catch {}
const list = await page.evaluate(() => [...document.querySelectorAll('[data-poi-zoom]')].map(a => {
  const r = a.getBoundingClientRect();
  const img = a.querySelector('img.poi-light');
  const fam = img && img.src.includes('job') ? 'job' : 'quest';
  const band = getComputedStyle(a.querySelector('.poi-halo') || a).getPropertyValue('--poi-band-far');
  return { mode: a.getAttribute('data-poi-zoom'), fam, band: band.trim(), x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), w: Math.round(r.width) };
}));
console.log(JSON.stringify(list, null, 1));
const q = list.find(a => a.fam === 'quest');
const j = list.find(a => a.fam === 'job');
for (const [name, pt] of [['quest', q], ['job', j]]) {
  if (!pt) continue;
  const s = 300;
  await page.screenshot({ path: `.mw/specs/poi-map-icon/card/farmix-${name}.png`,
    clip: { x: Math.max(0, pt.x - s/2), y: Math.max(0, pt.y - s/2), width: s, height: s } });
}
await browser.close();
console.log('done');
