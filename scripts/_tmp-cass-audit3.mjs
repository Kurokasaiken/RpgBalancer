import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [], logs = [];
p.on('pageerror', (e) => errs.push('PAGEERR ' + String(e).slice(0, 200)));
p.on('console', (m) => { if (m.type() === 'error') logs.push(m.text().slice(0, 200)); });
const r = await p.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-goblin', { waitUntil: 'domcontentloaded', timeout: 60000 });
console.log('status', r.status(), 'url', p.url());
await p.waitForTimeout(6000);
const info = await p.evaluate(() => ({
  title: document.title,
  bodyChildren: document.body.children.length,
  rootChildren: document.getElementById('root')?.children.length,
  lift: !!document.querySelector('[data-hudreal-lift]'),
  overlay: !!document.querySelector('vite-error-overlay'),
  bodyText: document.body.innerText.slice(0, 300),
}));
console.log(JSON.stringify(info, null, 1));
console.log('errs', errs.slice(0, 6), 'console', logs.slice(0, 6));
await b.close();
