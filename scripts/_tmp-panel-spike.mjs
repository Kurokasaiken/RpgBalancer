import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.goto('http://localhost:5173/hud-lab');
await p.waitForTimeout(16000);
const fwd = p.locator('[data-hud-lab-slot="panel"] button').nth(1);
for (let i = 0; i < 7; i++) { await fwd.click({ force: true }); await p.waitForTimeout(150); }
await p.waitForTimeout(700);
await p.locator('[data-hud-lab-slot="panel"]').screenshot({ path: 'test-results/spike-panel.png' });
await b.close();
