import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 800 } });
await page.goto('http://localhost:5173/theater-lab?scene=agguato-foresta', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(4500);
await page.screenshot({ path: '/tmp/reveal-before.png' });
const r = await page.evaluate(() => {
  const el = document.querySelector('[data-testid="scene-reveal-region"]');
  if (!el) return null;
  const b = el.getBoundingClientRect();
  return { x: b.x + b.width/2, y: b.y + b.height/2 };
});
if (r) {
  await page.mouse.click(r.x, r.y);
  await page.waitForTimeout(2600);
  await page.screenshot({ path: '/tmp/reveal-after.png' });
  const plate = await page.$('[data-testid="scene-revealed-plate"]');
  const style = plate ? await plate.evaluate(el => getComputedStyle(el).clipPath) : null;
  console.log('after click → plate:', !!plate, 'clip:', style);
} else console.log('region NOT FOUND');
await browser.close();
