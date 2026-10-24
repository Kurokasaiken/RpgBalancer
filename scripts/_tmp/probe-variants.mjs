import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
for (const fx of ['sprites','strips']) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 800 } });
  await page.goto(`http://localhost:5173/theater-lab?scene=agguato-foresta&revealfx=${fx}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `/tmp/v-${fx}-before.png` });
  const r = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="scene-reveal-region"]');
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: b.x + b.width/2, y: b.y + b.height/2 };
  });
  if (!r) { console.log(fx, 'NO REGION'); continue; }
  await page.mouse.click(r.x, r.y);
  await page.waitForTimeout(1200); // mid-slide
  await page.screenshot({ path: `/tmp/v-${fx}-mid.png` });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `/tmp/v-${fx}-after.png` });
  console.log(fx, 'captured');
  await page.close();
}
await browser.close();
