import { chromium } from 'playwright';
const page = await (await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })).newPage({ viewport: { width: 1600, height: 900 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(() => window.__worldCam?.zoom > 0, null, { timeout: 240000 });
await page.waitForSelector('[data-poi-zanara]', { timeout: 120000 });
await page.waitForTimeout(600);
const m = await page.evaluate(() => {
  const pois = [...document.querySelectorAll('[data-poi-zanara]')].map(el => {
    const r = el.getBoundingClientRect();
    return { family: el.dataset.poiZanara, w: +r.width.toFixed(1), h: +r.height.toFixed(1), x: +r.x.toFixed(0), y: +r.y.toFixed(0) };
  });
  const nav = document.querySelector('[data-hudslot="nav"] button')?.getBoundingClientRect();
  const corner = document.querySelector('[data-hud-corner]')?.getBoundingClientRect();
  return { vw: innerWidth, vh: innerHeight, zoom: window.__worldCam?.zoom, pois, navBtn: nav ? +nav.width.toFixed(1) : null, corner: corner ? { w: +corner.width.toFixed(0), h: +corner.height.toFixed(0) } : null };
});
console.log(JSON.stringify(m, null, 1));
await page.close(); process.exit(0);
