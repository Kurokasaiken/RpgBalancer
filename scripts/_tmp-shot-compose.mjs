import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.goto('http://localhost:5173/hud-compose', { waitUntil: 'networkidle' });
await p.waitForTimeout(9000);
await p.screenshot({ path: 'test-results/hud-compose.png' });
await b.close();
