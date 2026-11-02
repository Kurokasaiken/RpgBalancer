import { chromium } from 'playwright';
const OUT = '/Users/faustoboni/progetti_personali/RPG/test-results/village-witness-2026-11-02';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.setDefaultTimeout(90000);
await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => window.__worldCamCtl, { timeout: 90000 });
await p.waitForTimeout(3500);
await p.evaluate(() => { const e = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'village'); e?.click(); });
await p.waitForTimeout(800);
await p.evaluate(() => { window.__worldCamCtl.set({ panX: 1515 - 720 / 1.3, panY: 720 - 450 / 1.3, zoom: 1.3 }); });
const setStep = (i) => p.evaluate((idx) => {
  const r = [...document.querySelectorAll('input[type=range]')].find((el) => el.max === '9');
  if (!r) return false;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(r, String(idx));
  r.dispatchEvent(new Event('input', { bubbles: true }));
  r.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}, i);
for (const [i, name] of [[0, 's0-radura'], [3, 's3-torre-legno'], [5, 's5-2torri'], [6, 's6-case-pietra'], [8, 's8-torre-pietra'], [9, 's9-finale']]) {
  console.log(name, await setStep(i));
  await p.waitForTimeout(5000);
  await p.screenshot({ path: `${OUT}/tl-${name}.png` });
}
await b.close(); console.log('done');
