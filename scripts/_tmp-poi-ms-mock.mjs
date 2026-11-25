import { chromium } from 'playwright';
const page = await (await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })).newPage({ viewport: { width: 1600, height: 900 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(() => window.__worldCam?.zoom > 0, null, { timeout: 240000 });
await page.waitForSelector('[data-poi-zanara="quest"]', { timeout: 120000 });
await page.waitForTimeout(1000);
await page.evaluate(() => {
  document.querySelectorAll('[data-poi-zanara="quest"]').forEach(m => {
    m.querySelectorAll('img').forEach(i => { i.src = i.src.replace('/layers/', '/layers/_mock/ms-'); });
    const h = m.querySelector('.poi-halo');
    if (h) {
      // magenta enamel tones for the band/glow; metal stays painted
      h.style.setProperty('--poi-band-far', '#9c2f63');
      h.style.setProperty('--poi-band-near', '#ff6fa8');
      h.style.setProperty('--poi-glow', '#ff6fa8');
    }
  });
});
await page.waitForTimeout(700);
await page.screenshot({ path: '.mw/runs/20261124-hud-critique-multi-ai/mockups/poi-magenta-silver.jpg', type: 'jpeg', quality: 85, timeout: 60000 });
await page.close(); process.exit(0);
