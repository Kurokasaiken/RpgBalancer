import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 800 } });
await page.goto('http://localhost:5173/theater-lab?scene=agguato-foresta', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(5000);
const r = await page.evaluate(() => {
  const panel = document.querySelector('[data-testid="scene-reveal-panel"]');
  const sprites = document.querySelectorAll('[data-testid="scene-reveal-sprite"]');
  const region = document.querySelector('[data-testid="scene-reveal-region"]');
  return {
    panel: panel ? { src: panel.src.split('/').pop(), w: panel.offsetWidth, transform: getComputedStyle(panel).transform } : null,
    sprites: sprites.length,
    region: !!region,
  };
});
console.log(JSON.stringify(r, null, 1));
await page.screenshot({ path: '/tmp/lab-now.png' });
await browser.close();
