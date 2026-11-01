import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
p.on('console', m => { if (m.type() === 'error') console.log('[err]', m.text().slice(0,200)); });
await p.goto('http://localhost:5173/hud-lab');
await p.waitForTimeout(14000);
await p.screenshot({ path: 'test-results/hud-lab-v1.png' });
await b.close();
