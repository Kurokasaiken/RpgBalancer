import { chromium } from 'playwright';
const OUT = '/Users/faustoboni/progetti_personali/RPG/test-results/village-elements-2026-11-04';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1200, height: 750 } });
p.setDefaultTimeout(90000); p.on('pageerror', (e) => console.log('PAGEERROR', e.message.slice(0, 300)));
const errs = []; p.on('console', (m) => { if (m.type() === 'error' || m.text().includes('village-zone')) errs.push(m.text()); });
await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => window.__worldCamCtl && window.__villageZoneLive?.zone, { timeout: 90000 });
await p.waitForTimeout(5000); p.on('framenavigated', (f) => { if (f === p.mainFrame()) console.log('NAV', new Date().toISOString()); });
const clickText = (t) => p.evaluate((t) => [...document.querySelectorAll('button')].find((x) => x.textContent.trim().toLowerCase().startsWith(t))?.click(), t);
await clickText('village');
await p.waitForTimeout(300);
await p.evaluate(() => [...document.querySelectorAll('label')].find((l) => l.textContent.includes('prototipo R-313'))?.querySelector('input')?.click());
const Z = 1.5, panX = 1515 - 600 / Z, panY = 720 - 375 / Z;
await p.evaluate(([Z, panX, panY]) => window.__worldCamCtl.set({ panX, panY, zoom: Z }), [Z, panX, panY]);
const range = () => p.evaluate(() => [...document.querySelectorAll('input[type=range]')].find((i) => i.parentElement?.previousElementSibling?.textContent?.includes('timeline:')));
const setStep = (s) => p.evaluate((s) => { const r = [...document.querySelectorAll('input[type=range]')].find((i) => i.parentElement?.previousElementSibling?.textContent?.includes('timeline:'));
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(r, String(s)); r.dispatchEvent(new Event('input', { bubbles: true })); }, s);
const shot = async (name) => { await p.keyboard.press('h'); await p.waitForTimeout(900); await p.screenshot({ path: OUT + '/' + name + '.png' }); await p.keyboard.press('h'); await p.waitForTimeout(150); };
for (const s of [2, 3, 5, 7, 9]) { await setStep(s); await shot('step' + s); console.log('step', s, JSON.stringify(await p.evaluate(() => ({ mode: window.__villageZoneLive?.mode, drawn: window.__villageZoneLive?.drawnElements, d: window.__villageZoneLive?.defence })))); }
// free placement: arm stone tower, real mouse clicks on the map at zone coords
await setStep(5);
await clickText('+ tower-stone');
const toScreen = (zx, zy) => [((1260 + zx) - panX) * Z, ((505 + zy) - panY) * Z];
await p.keyboard.press('h'); await p.waitForTimeout(200);
for (const [zx, zy] of [[120, 200], [300, 150], [250, 310], [440, 230]]) {
  const [sx, sy] = toScreen(zx, zy);
  await p.mouse.move(sx - 3, sy - 3); await p.mouse.move(sx, sy, { steps: 3 }); await p.waitForTimeout(120);
  await p.mouse.click(sx, sy); await p.waitForTimeout(150);
}
await p.mouse.move(5, 740); await p.waitForTimeout(900);
await p.screenshot({ path: OUT + '/placed.png' });
await p.keyboard.press('h'); await p.waitForTimeout(200);
const n = await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.textContent.includes('clear elementi'))?.textContent);
console.log('placed button:', n, 'live', JSON.stringify(await p.evaluate(() => ({ els: window.__villageZoneLive?.elements, drawn: window.__villageZoneLive?.drawnElements, hover: [window.__villageZoneLive?.hoverX, window.__villageZoneLive?.hoverY] }))), 'errors:', JSON.stringify(errs.slice(0, 5)));
await b.close();
