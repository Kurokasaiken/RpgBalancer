import { chromium } from '@playwright/test';
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const p = await (await b.newContext()).newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 300)));
p.on('console', (m) => { if (m.type() === 'error') errs.push('[console] ' + m.text().slice(0, 250)); });
await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(25000);
const s = await p.evaluate(() => ({
  cam: !!window.__worldCamCtl, dbg: !!window.__ambientDebug,
  stormo: !!window.__ambientDebug?.stormo,
  body: document.body.innerText.slice(0, 200),
}));
console.log(JSON.stringify(s));
console.log('ERRS:', errs.slice(0, 5).join(' | ') || 'none');
await b.close();
