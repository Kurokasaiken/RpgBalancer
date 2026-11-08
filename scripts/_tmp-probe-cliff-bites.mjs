// Cliff "eaten pieces" witness: hi-res mode SW cliff, foam on/off + non-hires compare.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const [outDir = '/tmp/cliff-bites'] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
p.on('console', (m) => { if (m.type() === 'error') console.log('PAGE-ERR', m.text().slice(0, 160)); });
await p.goto('http://127.0.0.1:5173/mappa2-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => !!window.__worldCamCtl && !!window.__pixiApp, null, { timeout: 120000 });
await p.waitForTimeout(6000);

// enable hi-res checkbox (scene tab is the default active tab)
const hiChip = p.locator('label', { hasText: 'hi-res' }).locator('input[type=checkbox]');
if (await hiChip.count()) { await hiChip.first().check(); console.log('hi-res checked'); }
await p.waitForTimeout(8000); // remount
await p.waitForFunction(() => !!window.__worldCamCtl && !!window.__pixiApp, null, { timeout: 120000 });
const hide = p.getByRole('button', { name: /hide test ui/i });
if (await hide.count()) await hide.first().click();

const center = async ({ wx, wy, zoom }) =>
  p.evaluate(async ({ wx, wy, zoom }) => {
    const app = window.__pixiApp;
    const f = (n) => (n.label === 'coast-foam' ? n : (n.children ?? []).map(f).find(Boolean));
    const anchor = f(app.stage) ?? app.stage;
    const at = (px, py) => { window.__worldCamCtl.set({ zoom, panX: px, panY: py }); return anchor.parent.toGlobal({ x: wx, y: wy }); };
    const g0 = at(0, 0), g1 = at(100, 100);
    const kx = (g1.x - g0.x) / 100 || 1, ky = (g1.y - g0.y) / 100 || 1;
    at((app.screen.width / 2 - g0.x) / kx, (app.screen.height / 2 - g0.y) / ky);
    await new Promise((r) => setTimeout(r, 60));
  }, { wx, wy, zoom });

const setFoamVisible = (on) => p.evaluate((on) => {
  const f = (n) => (n.label === 'coast-foam' ? n : (n.children ?? []).map(f).find(Boolean));
  const m = f(window.__pixiApp.stage); if (m) m.visible = on;
}, on);
const setFoamTime = (t) => p.evaluate((t) => {
  const f = (n) => (n.label === 'coast-foam' ? n : (n.children ?? []).map(f).find(Boolean));
  const m = f(window.__pixiApp.stage); if (m) m.shader.resources.u.uniforms.uTime = t;
}, t);

await p.evaluate(() => window.__pixiApp.ticker.stop());
// tight on the cliff face the Director shot: world ~(300,1180)
await center({ wx: 320, wy: 1200, zoom: 2.4 });
await p.evaluate(() => window.__pixiApp.render());
await setFoamVisible(false); await p.evaluate(() => window.__pixiApp.render());
writeFileSync(`${outDir}/hi-cliff-foamOFF.png`, await p.screenshot());
await setFoamVisible(true);
for (const t of [0.2, 2.0, 4.0]) {
  await setFoamTime(t);
  await p.evaluate(() => window.__pixiApp.render());
  writeFileSync(`${outDir}/hi-cliff-foamON-T${t}.png`, await p.screenshot());
}
await b.close();
console.log('done ->', outDir);
