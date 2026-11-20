import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 500)));
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log(m.type().toUpperCase(), m.text().slice(0, 300)); });
await p.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-rovine', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(15000);
const info = await p.evaluate(() => ({
  hudslot: !!document.querySelector('[data-hudslot="cassetto"]'),
  hudslotHtml: document.querySelector('[data-hudslot="cassetto"]')?.innerHTML?.slice(0, 300) ?? null,
  errEls: Array.from(document.querySelectorAll('[class*="error"],[data-error]')).length,
  bodySnippet: document.body.innerText?.slice(0, 300),
}));
console.log(JSON.stringify(info, null, 1));
await b.close();
