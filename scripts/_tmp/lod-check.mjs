import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = [];
p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 120000 });
try { await p.waitForFunction(() => window.__worldCam && document.querySelectorAll('[data-poi-zanara]').length > 0, null, { timeout: 200000 }); } catch { console.log('TIMEOUT'); }
await p.waitForTimeout(5000);
const state = await p.evaluate(() => ({
  cam: { zoom: window.__worldCam?.zoom, fit: window.__worldCam?.fitZoom },
  anchors: [...document.querySelectorAll('[data-anchor-id]')].map(a => ({ id: a.getAttribute('data-anchor-id'), lod: a.getAttribute('data-zoom-lod'), state: a.getAttribute('data-poi-zoom') })),
}));
console.log(JSON.stringify(state), 'errs:', errs.length);
// FAR state shot (should already be far at fit)
await p.screenshot({ path: 'test-results/poi-zanara-live/lod-far.png', timeout: 120000 });
// NEAR state: force zoom on the camera
await p.evaluate(() => { const c = window.__worldCam; c.zoom = c.fitZoom * 2; });
await p.waitForTimeout(800);
const near = await p.evaluate(() => [...document.querySelectorAll('[data-anchor-id]')].map(a => a.getAttribute('data-poi-zoom')));
console.log('near states:', JSON.stringify(near));
await p.screenshot({ path: 'test-results/poi-zanara-live/lod-near.png', timeout: 120000 });
await b.close();
