import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 800 } });
await page.goto('http://localhost:5173/theater-lab?scene=agguato-foresta', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(4000);
const r = await page.evaluate(() => {
  const el = document.querySelector('[data-testid="scene-reveal-region"]');
  if (!el) return { found: false };
  const rect = el.getBoundingClientRect();
  const top = document.elementFromPoint(rect.x + rect.width/2, rect.y + rect.height/2);
  return { found: true,
    rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
    onTop: top ? `${top.tagName}.${(top.getAttribute('data-testid')||top.className||'').toString().slice(0,60)}` : null,
    isSelf: top === el };
});
console.log(JSON.stringify(r));
if (r.found) {
  await page.mouse.click(r.rect.x + r.rect.w/2, r.rect.y + r.rect.h/2);
  await page.waitForTimeout(2500);
  console.log('plate:', await page.$('[data-testid="scene-revealed-plate"]') !== null,
              '| cutout:', await page.$('[data-testid="scene-reveal-cutout"]') !== null);
}
await browser.close();
