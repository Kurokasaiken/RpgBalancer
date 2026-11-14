import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 120000 });
try { await p.waitForFunction(() => window.__worldCam && document.querySelectorAll('[data-poi-zanara]').length > 0, null, { timeout: 200000 }); } catch {}
await p.waitForTimeout(5000);
const marks = await p.evaluate(() => [...document.querySelectorAll('[data-poi-zanara]')].map(e => { const r = e.getBoundingClientRect(); return { f: e.getAttribute('data-poi-zanara'), cx: r.x + r.width / 2, cy: r.y + r.height / 2 }; }));
// FAR state already active (zoomRatio 1 < 1.35)
await p.screenshot({ path: 'test-results/poi-zanara-live/lodA-far.png', timeout: 120000 });
// NEAR: tag anchors
await p.evaluate(() => document.querySelectorAll('[data-anchor-id]').forEach(a => a.setAttribute('data-poi-zoom', 'near')));
await p.waitForTimeout(400);
await p.screenshot({ path: 'test-results/poi-zanara-live/lodA-near.png', timeout: 120000 });
console.log(JSON.stringify(marks));
await b.close();
