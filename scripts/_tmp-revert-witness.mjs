import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
mkdirSync('test-results/witness-perquest', { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-rovine', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForSelector('[data-cassetto-debug], [data-testid="expedition-drawer-expand"]', { timeout: 30000 });
await p.waitForTimeout(1000);
const sel = await p.$('[data-cassetto-debug="select-first"]');
if (sel) { await p.evaluate((el) => el.click(), sel); await p.waitForTimeout(3500); }
const exp = await p.$('[data-testid="expedition-drawer-expand"]');
if (exp) { await exp.click(); await p.waitForTimeout(900); }
await p.screenshot({ path: 'test-results/witness-perquest/reverted-rovine-full.png' });
const col = await p.$('[data-hudreal-cassetto] > div');
if (col) await col.screenshot({ path: 'test-results/witness-perquest/reverted-rovine-column.png' });
await b.close();
console.log('DONE');
