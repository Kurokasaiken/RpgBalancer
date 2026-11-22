import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-goblin&pcts=96,4&risk=3', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForSelector('[data-cassetto-column]', { timeout: 45000 });
await p.waitForTimeout(2500);
await p.screenshot({ path: '/tmp/cass-empty.png', clip: { x: 880, y: 0, width: 560, height: 900 } });
const dbg = await p.$('[data-cassetto-debug="select-first"]');
if (dbg) { for (let i = 0; i < 4; i++) { await dbg.dispatchEvent('click'); await p.waitForTimeout(600); } }
await p.waitForTimeout(2000);
await p.screenshot({ path: '/tmp/cass-party.png', clip: { x: 880, y: 0, width: 560, height: 900 } });
await p.screenshot({ path: '/tmp/cass-party-full.png' });
await b.close();
console.log('done');
