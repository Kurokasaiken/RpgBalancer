import { chromium } from 'playwright';
const OUT = '/Users/faustoboni/progetti_personali/RPG/test-results/village-witness-2026-11-03';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1200, height: 750 } });
p.setDefaultTimeout(90000);
await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => window.__worldCamCtl, { timeout: 90000 });
await p.waitForTimeout(5000);
await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.textContent.trim().toLowerCase() === 'village')?.click());
await p.waitForTimeout(400);
const Z = 1.5;
await p.evaluate((Z) => window.__worldCamCtl.set({ panX: 1515 - 600 / Z, panY: 720 - 375 / Z, zoom: Z }), Z);
const n = await p.evaluate(() => Number([...document.querySelectorAll('input[type=range]')].find((i) => i.parentElement?.previousElementSibling?.textContent?.includes('timeline:')).max) + 1);
for (let s = 0; s < n; s++) {
  await p.evaluate((s) => { const r = [...document.querySelectorAll('input[type=range]')].find((i) => i.parentElement?.previousElementSibling?.textContent?.includes('timeline:'));
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(r, String(s)); r.dispatchEvent(new Event('input', { bubbles: true })); }, s);
  await p.keyboard.press('h'); await p.waitForTimeout(900);
  await p.screenshot({ path: OUT + '/s' + s + '.png' });
  await p.keyboard.press('h'); await p.waitForTimeout(150);
}
await b.close(); console.log('done', n);
