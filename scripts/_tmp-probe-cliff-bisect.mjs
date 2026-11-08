// Bisect: hide each world child one at a time -> which layer paints the cyan gouges?
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const [outDir = '/tmp/cliff-bites'] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
await p.goto('http://127.0.0.1:5173/mappa2-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => !!window.__worldCamCtl && !!window.__pixiApp, null, { timeout: 120000 });
await p.waitForTimeout(6000);
const hiChip = p.locator('label', { hasText: 'hi-res' }).locator('input[type=checkbox]');
if (await hiChip.count()) await hiChip.first().check();
await p.waitForTimeout(9000);
await p.waitForFunction(() => !!window.__pixiApp && !!window.__worldCamCtl, null, { timeout: 120000 });
const hide = p.getByRole('button', { name: /hide test ui/i });
if (await hide.count()) await hide.first().click();
await p.evaluate(() => window.__pixiApp.ticker.stop());
await p.evaluate(() => {
  const app = window.__pixiApp;
  const w = app.stage.children.find((c) => (c.children?.length ?? 0) > 5) ?? app.stage;
  window.__w = w;
  const at = (px, py) => { window.__worldCamCtl.set({ zoom: 2.4, panX: px, panY: py }); return w.toGlobal({ x: 320, y: 1200 }); };
  const g0 = at(0, 0), g1 = at(100, 100);
  const kx = (g1.x - g0.x) / 100 || 1, ky = (g1.y - g0.y) / 100 || 1;
  at((700 - g0.x) / kx, (450 - g0.y) / ky);
  window.__dbg = { check: w.toGlobal({ x: 320, y: 1200 }), kx, ky };
});
console.log('center', JSON.stringify(await p.evaluate(() => window.__dbg)));
const n = await p.evaluate(() => window.__w.children.length);
const meta = await p.evaluate(() => window.__w.children.map((c, i) => `${i}:${c.constructor?.name}:${c.label ?? ''}:${c.zIndex}`));
console.log(meta.join(' '));
for (let i = 0; i < n; i++) {
  const was = await p.evaluate((i) => { const c = window.__w.children[i]; const v = c.visible; c.visible = false; window.__pixiApp.render(); return v; }, i);
  if (was === false) { continue; }
  writeFileSync(`${outDir}/bisect-${i}.png`, await p.screenshot());
  await p.evaluate((i) => { window.__w.children[i].visible = true; }, i);
}
await p.evaluate(() => window.__pixiApp.render());
writeFileSync(`${outDir}/bisect-all.png`, await p.screenshot());
await b.close();
console.log('done', n);
