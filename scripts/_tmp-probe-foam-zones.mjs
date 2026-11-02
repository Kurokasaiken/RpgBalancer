// R-299 witness: coast foam ON vs OFF on the snow peaks and on the arch bay (mappa2-lab).
// usage: node scripts/_tmp-probe-foam-zones.mjs <outDir> [tag]
import { chromium } from 'playwright';
const [outDir = '/tmp', tag = 'now'] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
await p.goto('http://127.0.0.1:5173/mappa2-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => !!window.__worldCamCtl && !!window.__pixiApp, null, { timeout: 120000 });
await p.waitForTimeout(6000);
const hide = p.getByRole('button', { name: /hide test ui/i });
if (await hide.count()) await hide.first().click();
const views = process.env.VIEWS ? JSON.parse(process.env.VIEWS) : {
  peaks: { wx: 1380, wy: 190, zoom: 1.6 },
  bay: { wx: 300, wy: 560, zoom: 1.5 },
  lakes: { wx: 1330, wy: 420, zoom: 1.4 },
};
const center = async ({ wx, wy, zoom }) =>
  p.evaluate(async ({ wx, wy, zoom }) => {
    const app = window.__pixiApp;
    const find = (c) => c.label === 'coast-foam' ? c : (c.children ?? []).map(find).find(Boolean);
    const foam = find(app.stage);
    const at = (px, py) => { window.__worldCamCtl.set({ zoom, panX: px, panY: py }); return foam.parent.toGlobal({ x: wx, y: wy }); };
    const g0 = at(0, 0), g1 = at(100, 100);
    const kx = (g1.x - g0.x) / 100 || 1, ky = (g1.y - g0.y) / 100 || 1;
    at((app.screen.width / 2 - g0.x) / kx, (app.screen.height / 2 - g0.y) / ky);
    await new Promise((r) => setTimeout(r, 50));
    const g = foam.parent.toGlobal({ x: wx, y: wy });
    return { gx: Math.round(g.x), gy: Math.round(g.y) };
  }, { wx, wy, zoom });
// clouds (zIndex 10 = CLOUD_BAND_Z) drift over the frame and pollute the on/off measures
const hideClouds = () => p.evaluate(() => {
  const find = (c) => c.label === 'coast-foam' ? c : (c.children ?? []).map(find).find(Boolean);
  for (const c of find(window.__pixiApp.stage).parent.children) if (c.zIndex === 10) c.visible = false;
});
const setFoam = (on) => p.evaluate((on) => {
  const find = (c) => c.label === 'coast-foam' ? c : (c.children ?? []).map(find).find(Boolean);
  find(window.__pixiApp.stage).visible = on;
}, on);
for (const [name, v] of Object.entries(views)) {
  const at = await center(v);
  console.log(name, 'centre at', at);
  if (process.env.NO_CLOUDS) await hideClouds();
  if (process.env.TIMES) {
    // deterministic: drive the foam shader's clock directly, one frozen frame per time
    await p.evaluate(() => window.__pixiApp.ticker.stop());
    for (const t of process.env.TIMES.split(',').map(Number)) {
      await p.evaluate((t) => {
        const find = (c) => c.label === 'coast-foam' ? c : (c.children ?? []).map(find).find(Boolean);
        const m = find(window.__pixiApp.stage); m.visible = true;
        m.shader.resources.u.uniforms.uTime = t;
        window.__pixiApp.render();
      }, t);
      await p.screenshot({ path: `${outDir}/${tag}-${name}-T${t}.png` });
    }
    await setFoam(false); await p.evaluate(() => window.__pixiApp.render());
    await p.screenshot({ path: `${outDir}/${tag}-${name}-Toff.png` });
    await setFoam(true);
    await p.evaluate(() => window.__pixiApp.ticker.start());
    continue;
  }
  const samples = Number(process.env.SAMPLES ?? 1);
  for (let k = 0; k < samples; k += 1) {
    await p.waitForTimeout(k === 0 ? 1500 : Number(process.env.INTERVAL ?? 2300));
    const sfx = samples > 1 ? `-t${k}` : '';
    // frozen pair: same frame, only the foam mesh differs
    await p.evaluate(() => window.__pixiApp.ticker.stop());
    await setFoam(true); await p.evaluate(() => window.__pixiApp.render());
    await p.screenshot({ path: `${outDir}/${tag}-${name}-on${sfx}.png` });
    await setFoam(false); await p.evaluate(() => window.__pixiApp.render());
    await p.screenshot({ path: `${outDir}/${tag}-${name}-off${sfx}.png` });
    await setFoam(true);
    await p.evaluate(() => window.__pixiApp.ticker.start());
  }
  await setFoam(true);
}
await b.close();
