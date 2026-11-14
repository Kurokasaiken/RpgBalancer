import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
try { await p.waitForFunction(() => window.__worldCam, null, { timeout: 150000 }); } catch { console.log('CAM TIMEOUT'); }
await p.waitForTimeout(15000);
const marks = await p.evaluate(() => [...document.querySelectorAll('[data-poi-zanara]')].map(e => { const r = e.getBoundingClientRect(); return { f: e.getAttribute('data-poi-zanara'), cx: r.x + r.width / 2, cy: r.y + r.height / 2 }; }));
console.log(JSON.stringify(marks));
await p.screenshot({ path: 'test-results/poi-zanara-live/out-full.png', timeout: 120000 });
await b.close();
