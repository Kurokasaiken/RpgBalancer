import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.goto('http://localhost:5173/hud-lab');
await p.waitForTimeout(16000);
const fwd = p.locator('[data-hud-lab-control="roster"] button').nth(1);
for (let i = 0; i < 7; i++) { await fwd.click({ force: true }); await p.waitForTimeout(150); }
await p.waitForTimeout(700);
await p.locator('[data-hud-lab-slot="roster"]').screenshot({ path: 'test-results/spike-roster-v2.png' });
await b.close();
