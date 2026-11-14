import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = [];
p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 120000 });
try { await p.waitForFunction(() => window.__worldCam && document.querySelectorAll('[data-poi-zanara]').length > 0, null, { timeout: 200000 }); } catch { console.log('TIMEOUT'); }
await p.waitForTimeout(6000);
const marks = await p.evaluate(() => [...document.querySelectorAll('[data-poi-zanara]')].map(e => { const r = e.getBoundingClientRect(); return { f: e.getAttribute('data-poi-zanara'), cx: r.x + r.width / 2, cy: r.y + r.height / 2 }; }));
console.log(JSON.stringify(marks), 'errs:', errs.length);
await p.screenshot({ path: 'test-results/poi-zanara-live/runes-full.png', timeout: 120000 });
await b.close();
