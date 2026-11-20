import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto('https://rpg-balancer.vercel.app/game', { waitUntil: 'domcontentloaded', timeout: 45000 });
const t0 = Date.now();
let boot = null;
while (Date.now() - t0 < 240000) {
  boot = await page.evaluate(() => window.__gameBoot?.interactiveMs ?? null);
  if (boot) break;
  await page.waitForTimeout(2000);
}
const out = await page.evaluate(() => ({
  marks: performance.getEntriesByType('mark').map(m => m.name),
  measures: performance.getEntriesByType('measure').map(m => m.name).slice(0, 20),
  phase: document.querySelector('[data-boot-phase]')?.getAttribute('data-boot-phase') ?? 'gone',
}));
console.log('interactiveMs', boot, JSON.stringify(out, null, 1));
await browser.close();
