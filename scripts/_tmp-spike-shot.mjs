import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.goto('http://localhost:5173/hud-lab');
await p.waitForTimeout(16000);
for (const slot of ['roster', 'panel']) {
  const fwd = p.locator(`[data-hud-lab-slot="${slot}"] button`).nth(1);
  for (let i = 0; i < 7; i++) { await fwd.click({ force: true }); await p.waitForTimeout(120); }
}
await p.waitForTimeout(800);
await p.screenshot({ path: 'test-results/hud-lab-spikes.png' });
await p.locator('[data-hud-lab-slot="roster"]').screenshot({ path: 'test-results/spike-medallion.png' });
await p.locator('[data-hud-lab-slot="panel"]').screenshot({ path: 'test-results/spike-panel.png' });
await b.close();
