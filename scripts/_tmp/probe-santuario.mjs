import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 800 } });
await page.goto('http://localhost:5173/theater-lab?scene=santuario-valle', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(4500);
await page.screenshot({ path: '/tmp/san-before.png' });
const r = await page.evaluate(() => {
  const el = document.querySelector('[data-testid="scene-reveal-region"]');
  const panel = document.querySelector('[data-testid="scene-reveal-panel"]');
  if (!el || !panel) return { region: !!el, panel: !!panel };
  const b = el.getBoundingClientRect();
  return { region: true, panel: true, x: b.x + b.width/2, y: b.y + b.height/2 };
});
console.log('state:', JSON.stringify(r));
if (r?.x) {
  await page.mouse.click(r.x, r.y);
  await page.waitForTimeout(2600);
  await page.screenshot({ path: '/tmp/san-after.png' });
}
await browser.close();
