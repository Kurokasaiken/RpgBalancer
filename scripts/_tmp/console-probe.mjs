import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
const errs = [];
p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
p.on('pageerror', e => errs.push('PAGEERROR: ' + String(e).slice(0, 300)));
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
try { await p.waitForFunction(() => window.__worldCam, null, { timeout: 120000 }); } catch { errs.push('CAM_TIMEOUT'); }
await p.waitForTimeout(4000);
console.log('ERRORS:', errs.length); errs.slice(0, 15).forEach(e => console.log(' -', e));
await b.close();
