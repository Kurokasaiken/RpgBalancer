import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
await p.goto('http://localhost:5173/hud-compare', { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
await p.screenshot({ path: 'test-results/hud-compare-v2.png' });
await b.close();
