// Verify squared-sea fix across several sea regions in hi-res mode.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const [outDir = '/tmp/sea-smooth'] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
await p.goto('http://127.0.0.1:5173/mappa2-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => !!window.__worldCamCtl && !!window.__pixiApp, null, { timeout: 120000 });
await p.waitForTimeout(6000);
const hiChip = p.locator('label', { hasText: 'hi-res' }).locator('input[type=checkbox]');
if (await hiChip.count()) await hiChip.first().check();
await p.waitForTimeout(9000);
const hide = p.getByRole('button', { name: /hide test ui/i });
if (await hide.count()) await hide.first().click();
await p.evaluate(() => window.__pixiApp.ticker.stop());
// hide clouds so the sea is fully visible
await p.evaluate(() => {
  const app = window.__pixiApp;
  const w = app.stage.children.find((c) => (c.children?.length ?? 0) > 5);
  window.__w = w;
  for (const c of w.children) if (c.zIndex >= 9 && c.zIndex <= 12) c.visible = false;
});
const center = async (wx, wy, zoom) => p.evaluate(({ wx, wy, zoom }) => {
  const w = window.__w;
  const at = (px, py) => { window.__worldCamCtl.set({ zoom, panX: px, panY: py }); return w.toGlobal({ x: wx, y: wy }); };
  const g0 = at(0, 0), g1 = at(100, 100);
  const kx = (g1.x - g0.x) / 100 || 1, ky = (g1.y - g0.y) / 100 || 1;
  at((700 - g0.x) / kx, (450 - g0.y) / ky);
}, { wx, wy, zoom });

const views = {
  userShot: { wx: 480, wy: 1050, zoom: 1.7 },   // SW archipelago (user screenshot area)
  deepWest: { wx: 250, wy: 500, zoom: 1.5 },    // dark west sea (low-chroma zone)
  bay: { wx: 600, wy: 1030, zoom: 1.7 },        // shallows bay
  southSea: { wx: 1400, wy: 1300, zoom: 1.5 },  // south deep sea
};
for (const [name, v] of Object.entries(views)) {
  await center(v.wx, v.wy, v.zoom);
  await p.evaluate(() => window.__pixiApp.render());
  writeFileSync(`${outDir}/${name}.png`, await p.screenshot());
  console.log('shot', name);
}
await b.close();
console.log('done');
