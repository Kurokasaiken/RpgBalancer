import { chromium } from 'playwright';
const OUT = '/Users/faustoboni/progetti_personali/RPG/test-results/village-witness-2026-11-02/framed';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1200, height: 750 } });
p.setDefaultTimeout(90000);
await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => window.__worldCamCtl, { timeout: 90000 });
await p.waitForTimeout(4000);
await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'village')?.click());
await p.evaluate(() => { const i=[...document.querySelectorAll('input[type=number]')].find(x=>x.step==='0.5'); });
const Z = 1.9;
await p.evaluate((Z) => window.__worldCamCtl.set({ panX: 1515 - 600 / Z, panY: 720 - 375 / Z, zoom: Z }), Z);
await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'play')?.click());
await p.keyboard.press('h'); // hide test UI
for (let i = 0; i < 10; i++) { await p.waitForTimeout(i ? 1000 : 600); await p.screenshot({ path: OUT + '/f' + i + '.png' }); }
await b.close(); console.log('done');
