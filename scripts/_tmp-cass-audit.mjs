import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e)));
await p.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-goblin&pcts=96,4&risk=3', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForSelector('[data-testid="expedition-drawer"]', { timeout: 30000 }).catch(() => null);
const exp = await p.$('[data-testid="expedition-drawer-expand"]');
if (exp) { await exp.click(); await p.waitForTimeout(800); }
await p.waitForTimeout(1200);
await p.screenshot({ path: '/tmp/cass-empty.png' });
const dbg = await p.$('[data-cassetto-debug="select-first"]');
if (dbg) { for (let i = 0; i < 4; i++) { await dbg.dispatchEvent('click'); await p.waitForTimeout(500); } }
await p.waitForTimeout(1500);
await p.screenshot({ path: '/tmp/cass-party.png' });
console.log('errors:', errs.slice(0, 5));
await b.close();
