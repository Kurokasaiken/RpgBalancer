// Foam-on-cliff witness: diff(foamON, foamOFF) at deterministic shader times,
// masked to LAND pixels (land_distance.webp G > 128) via the camera transform.
// usage: VIEWS='{...}' TIMES='0,2,4' node scripts/_tmp-probe-foam-land-leak.mjs <outDir> <tag>
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { writeFileSync } from 'node:fs';
import sharp from 'sharp';

const [outDir = '/tmp', tag = 'leak'] = process.argv.slice(2);
const ROOT = new URL('..', import.meta.url).pathname;
const { data: land, info: li } = await sharp(`${ROOT}public/assets/world/mappa2/base/masks/land_distance.webp`)
  .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { data: coast } = await sharp(`${ROOT}public/assets/world/mappa2/base/masks/coast_distance.webp`)
  .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { data: clean } = await sharp(`${ROOT}public/assets/world/mappa2/base/masks/foam_clean.webp`)
  .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const cleanAt = (wx, wy) => {
  const x = Math.round(wx), y = Math.round(wy);
  if (x < 0 || y < 0 || x >= li.width || y >= li.height) return 0;
  return clean[(y * li.width + x) * li.channels + 3];
};
const landAt = (wx, wy) => {
  const x = Math.round(wx), y = Math.round(wy);
  if (x < 0 || y < 0 || x >= li.width || y >= li.height) return 0;
  return land[(y * li.width + x) * li.channels + 1];
};
const seaAt = (wx, wy) => {
  const x = Math.round(wx), y = Math.round(wy);
  if (x < 0 || y < 0 || x >= li.width || y >= li.height) return 0;
  return coast[(y * li.width + x) * li.channels + 1];
};
// Land pixel with no sea in the downward cone at ~its sea distance = the leak class
// (silhouette/face pixels the sea-below gate must suppress).
const noSeaBelow = (wx, wy) => {
  const ldd = (landAt2(wx, wy) / 255) * 160;
  let below = 0;
  for (const s of [0.7, 1.3]) {
    const rr = ldd * s + 4;
    below = Math.max(below, seaAt(wx, wy + rr), seaAt(wx + rr * 0.4, wy + rr * 0.92), seaAt(wx - rr * 0.4, wy + rr * 0.92));
  }
  return below <= 128;
};
const landAt2 = (wx, wy) => {
  const x = Math.round(wx), y = Math.round(wy);
  if (x < 0 || y < 0 || x >= li.width || y >= li.height) return 0;
  return land[(y * li.width + x) * li.channels + 0];
};

const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
await p.goto('http://127.0.0.1:5173/mappa2-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => !!window.__worldCamCtl && !!window.__pixiApp, null, { timeout: 120000 });
await p.waitForTimeout(6000);
const hide = p.getByRole('button', { name: /hide test ui/i });
if (await hide.count()) await hide.first().click();

const center = async ({ wx, wy, zoom }) =>
  p.evaluate(async ({ wx, wy, zoom }) => {
    const app = window.__pixiApp;
    const f = (n) => n.label === 'coast-foam' ? n : (n.children ?? []).map(f).find(Boolean);
    const foam = f(app.stage);
    const at = (px, py) => { window.__worldCamCtl.set({ zoom, panX: px, panY: py }); return foam.parent.toGlobal({ x: wx, y: wy }); };
    const g0 = at(0, 0), g1 = at(100, 100);
    const kx = (g1.x - g0.x) / 100 || 1, ky = (g1.y - g0.y) / 100 || 1;
    at((app.screen.width / 2 - g0.x) / kx, (app.screen.height / 2 - g0.y) / ky);
    await new Promise((r) => setTimeout(r, 50));
  }, { wx, wy, zoom });

const toWorld = (pts) => p.evaluate((pts) => {
  const f = (n) => n.label === 'coast-foam' ? n : (n.children ?? []).map(f).find(Boolean);
  const m = f(window.__pixiApp.stage);
  return pts.map(([x, y]) => { const w = m.parent.toLocal({ x, y }); return [w.x, w.y]; });
}, pts);
const setFoamTime = (t) => p.evaluate((t) => {
  const f = (n) => n.label === 'coast-foam' ? n : (n.children ?? []).map(f).find(Boolean);
  const m = f(window.__pixiApp.stage);
  m.visible = true;
  m.shader.resources.u.uniforms.uTime = t;
}, t);
const setFoamVisible = (on) => p.evaluate((on) => {
  const f = (n) => n.label === 'coast-foam' ? n : (n.children ?? []).map(f).find(Boolean);
  f(window.__pixiApp.stage).visible = on;
}, on);
const hideClouds = () => p.evaluate(() => {
  const f = (n) => n.label === 'coast-foam' ? n : (n.children ?? []).map(f).find(Boolean);
  for (const c of f(window.__pixiApp.stage).parent.children) if (c.zIndex === 10) c.visible = false;
});

const views = process.env.VIEWS ? JSON.parse(process.env.VIEWS) : { overview: { wx: 1376, wy: 768, zoom: 0.48 } };
const times = process.env.TIMES ? process.env.TIMES.split(',').map(Number) : [0, 2, 4, 6, 8];
await p.evaluate(() => window.__pixiApp.ticker.stop());
if (process.env.NO_CLOUDS !== '0') await hideClouds();

let totalWhiteLeaks = 0;
const runView = async (name, v) => {
  await center(v);
  await p.evaluate(() => window.__pixiApp.render());
  await setFoamVisible(false); await p.evaluate(() => window.__pixiApp.render());
  const offBuf = await p.screenshot();
  await setFoamVisible(true);
  for (const t of times) {
    await setFoamTime(t);
    await p.evaluate(() => window.__pixiApp.render());
    const onBuf = await p.screenshot();
    const a = PNG.sync.read(offBuf), c = PNG.sync.read(onBuf);
    const d = new PNG({ width: a.width, height: a.height });
    // collect changed px, then map to world in one call
    const hits = [];
    const brightened = [];
    for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) {
      const i = (y * a.width + x) * 4;
      const dd = Math.max(Math.abs(c.data[i] - a.data[i]), Math.abs(c.data[i + 1] - a.data[i + 1]), Math.abs(c.data[i + 2] - a.data[i + 2]));
      if (dd > 10) hits.push([x, y]);
      // «piccoli effetti di luce»: the foam made the pixel markedly WHITER
      const m0 = Math.min(a.data[i], a.data[i + 1], a.data[i + 2]);
      const m1 = Math.min(c.data[i], c.data[i + 1], c.data[i + 2]);
      if (m1 - m0 > 50 && m1 > 140) brightened.push([x, y]);
    }
    const world = await toWorld(hits);
    const worldB = await toWorld(brightened);
    let landHits = 0, waterHits = 0, leakHits = 0, whiteLeaks = 0;
    const leakPts = [];
    const onLand = new Set();
    for (let k = 0; k < hits.length; k++) {
      const [wx, wy] = world[k];
      if (landAt(wx, wy) > 128) {
        landHits++; onLand.add(hits[k][1] * a.width + hits[k][0]);
        if (noSeaBelow(wx, wy)) leakHits++;
      } else waterHits++;
    }
    for (let k = 0; k < brightened.length; k++) {
      const [wx, wy] = worldB[k];
      if (landAt(wx, wy) > 128 && noSeaBelow(wx, wy)) {
        // plate pixels within ~12px of the waterline are the designed impact churn at
        // rock feet (cl.a>8) — a defect is a speck OFF the plate or far from the waterline
        const ldd = (landAt2(wx, wy) / 255) * 160;
        if (cleanAt(wx, wy) > 8 && ldd < 12) continue;
        whiteLeaks++;
        leakPts.push([Math.round(wx), Math.round(wy)]);
      }
    }
    if (leakPts.length) writeFileSync(`${outDir}/${tag}-${name}-T${t}-whiteleaks.json`, JSON.stringify(leakPts));
    totalWhiteLeaks += whiteLeaks;
    for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) {
      const i = (y * a.width + x) * 4;
      const on = onLand.has(y * a.width + x);
      d.data[i] = on ? 255 : 0; d.data[i + 1] = on ? 40 : 0; d.data[i + 2] = on ? 40 : 0; d.data[i + 3] = 255;
    }
    writeFileSync(`${outDir}/${tag}-${name}-T${t}-on.png`, onBuf);
    writeFileSync(`${outDir}/${tag}-${name}-T${t}-land.png`, PNG.sync.write(d));
    console.log(`${name} T${t}: changed=${hits.length} onLand=${landHits} leakClass=${leakHits} whiteLeaks=${whiteLeaks} onWater=${waterHits}`);
  }
};
// a vite reload in the shared worktree kills the page mid-view: re-open and retry once
for (const [name, v] of Object.entries(views)) {
  try {
    await runView(name, v);
  } catch (e) {
    console.log(`${name}: retry after ${String(e).slice(0, 80)}`);
    await p.goto('http://127.0.0.1:5173/mappa2-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await p.waitForFunction(() => !!window.__worldCamCtl && !!window.__pixiApp, null, { timeout: 120000 });
    await p.waitForTimeout(6000);
    const h = p.getByRole('button', { name: /hide test ui/i });
    if (await h.count()) await h.first().click();
    await p.evaluate(() => window.__pixiApp.ticker.stop());
    await runView(name, v);
  }
}
await b.close();
const cap = Number(process.env.ASSERT_WHITE_LEAKS_MAX ?? Infinity);
console.log(`whiteLeaks total=${totalWhiteLeaks} cap=${cap}`);
if (totalWhiteLeaks > cap) process.exit(1);
