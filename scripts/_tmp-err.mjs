import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const pg = await b.newPage({ viewport: { width: 1600, height: 1000 } });
pg.on('pageerror', e => console.log('PAGEERROR:', e.message.slice(0, 300)));
pg.on('console', m => { if (m.type() === 'error') console.log('CERR:', m.text().slice(0, 200)); });
await pg.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 150000 });
await pg.waitForSelector('[data-poi-zanara]', { state: 'attached', timeout: 180000 });
await pg.waitForTimeout(15000);
const state = await pg.evaluate(() => ({
  anchors: [...document.querySelectorAll('[data-world-x]')].map(e => ({ x: e.getAttribute('data-world-x'), t: e.style.transform })).slice(0, 6),
  cam: window.__worldCam ? { zoom: window.__worldCam.zoom, fitZoom: window.__worldCam.fitZoom } : null,
  veil: !!document.querySelector('[data-boot-veil], #boot-veil'),
}));
console.log(JSON.stringify(state, null, 1));
await pg.screenshot({ path: 'test-results/poi-zanara-live/dbg-state.png' });
await b.close();
