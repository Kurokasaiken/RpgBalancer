import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 300)));
await p.goto('http://localhost:5173/hud-compare');
await p.waitForTimeout(4000);
await p.screenshot({ path: 'test-results/hud-compare.png', fullPage: false });
await b.close();
