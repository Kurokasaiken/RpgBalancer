import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto('http://localhost:5173/mockups/victory-reward/v5.html', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: 'test-results/victory-mockup-v5.png', fullPage: true });
// element boxes for crop debugging
const boxes = await page.evaluate(() => {
  const r = {};
  for (const sel of ['.bframe','.medal','.crew','.loots','.echoes','.cta-t','.chip','.ribbon-t','.plaque-t','.x']) {
    const el = document.querySelector(sel);
    if (el) { const b = el.getBoundingClientRect(); r[sel] = [b.x, b.y, b.width, b.height].map(v => Math.round(v)); }
  }
  // also check overflow of each mrow/lrow
  const over = [];
  document.querySelectorAll('.mrow,.lrow').forEach((el,i)=>{
    if (el.scrollWidth > el.clientWidth + 1) over.push([i, el.scrollWidth, el.clientWidth]);
  });
  r._overflow = over;
  return r;
});
console.log(JSON.stringify(boxes));
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
