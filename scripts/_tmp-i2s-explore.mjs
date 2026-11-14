import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 900 } });
await page.goto('http://127.0.0.1:4173/figma-sim.html', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);
for (const f of page.frames()) {
  console.log('FRAME:', f.url());
  const btns = await f.locator('button').evaluateAll(els => els.map(e => (e.textContent||'').trim()).filter(Boolean));
  console.log('  BUTTONS:', JSON.stringify(btns.slice(0,60)));
  const inputs = await f.locator('input').evaluateAll(els => els.map(e => `${e.type}:${e.accept||''}:${e.id||''}`));
  console.log('  INPUTS:', JSON.stringify(inputs));
}
await browser.close();
