import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1520, height: 900 } });
await p.goto('http://localhost:5173/hud-compare', { waitUntil: 'networkidle' });
await p.waitForTimeout(9000);
await p.screenshot({ path: 'test-results/hud-compare-full.png', fullPage: false });
await b.close();
