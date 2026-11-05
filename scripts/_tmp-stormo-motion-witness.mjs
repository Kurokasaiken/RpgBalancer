import { chromium } from '@playwright/test';
// R-316 witness: stormo motion quality — takeoff acceleration ramp (no velocity
// snap), scatter→formation gather, loose-V spread. An in-page rAF collector
// samples bird+root positions for the whole flight (timers are heavily delayed
// under swiftshader, so rAF is the only reliable clock); Node takes zoomed
// screenshots at two ages while it runs.
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 300)));
await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => window.__worldCamCtl && window.__ambientDebug?.stormo, null, { timeout: 240000 });
await p.evaluate(({ wx, wy, Z }) =>
  window.__worldCamCtl.set({ panX: wx - 1440 / (2 * Z), panY: wy - 900 / (2 * Z), zoom: Z }),
  { wx: 1105, wy: 1112, Z: 2.5 });

await p.evaluate(() => {
  const st = window.__ambientDebug.stormo;
  window.__ambientDebug.director.triggerStormo('to-meadow-sw');
  window.__stormoSeries = [];
  const t0 = performance.now();
  const step = () => {
    const f = st.flocks.find((q) => q.active);
    const age = (performance.now() - t0) / 1000;
    if (f) {
      window.__stormoSeries.push({
        age: +age.toFixed(2),
        rx: +f.root.position.x.toFixed(1),
        ry: +f.root.position.y.toFixed(1),
        alpha: +f.root.alpha.toFixed(2),
        scale: +f.root.scale.x.toFixed(2),
        rot: +f.root.rotation.toFixed(3),
        birds: f.birds.map((bb) => [+bb.sp.position.x.toFixed(1), +bb.sp.position.y.toFixed(1)]),
      });
    }
    if (age < 11) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
});

await new Promise((r) => setTimeout(r, 1500));
await p.screenshot({ path: 'test-results/plan-108-stormo/motion-gather-zoom.png' });
await new Promise((r) => setTimeout(r, 3500));
await p.screenshot({ path: 'test-results/plan-108-stormo/motion-looseV-zoom.png' });
await new Promise((r) => setTimeout(r, 5000));

const series = await p.evaluate(() => window.__stormoSeries);
console.log(`samples: ${series.length}`);
if (series.length > 2) {
  const speeds = [];
  for (let i = 1; i < series.length; i += 1) {
    const dt = series[i].age - series[i - 1].age;
    if (dt > 0.01) speeds.push(+(Math.hypot(series[i].rx - series[i - 1].rx, series[i].ry - series[i - 1].ry) / dt).toFixed(1));
  }
  console.log('speed ramp px/s:', speeds.slice(0, 40).join(' '));
  const dv = speeds.slice(1).map((v, i) => Math.abs(v - speeds[i]));
  console.log(`max Δspeed/sample: ${Math.max(...dv).toFixed(1)} px/s (no velocity snaps if small vs cruise)`);
  const first = series[0]; const mid = series[Math.floor(series.length * 0.5)]; const last = series[series.length - 1];
  console.log('t=%s birds:', first.age, JSON.stringify(first.birds));
  console.log('t=%s birds:', mid.age, JSON.stringify(mid.birds));
  console.log('t=%s birds:', last.age, JSON.stringify(last.birds));
  const xs = (s) => s.birds.map((q) => q[0]); const ys = (s) => s.birds.map((q) => q[1]);
  const rng = (a) => Math.max(...a) - Math.min(...a);
  console.log(`spread first→last: x ${rng(xs(first)).toFixed(0)}→${rng(xs(last)).toFixed(0)}, y ${rng(ys(first)).toFixed(0)}→${rng(ys(last)).toFixed(0)} px local`);
  console.log('|by| at end (V symmetry check):', JSON.stringify(ys(last).map((v) => Math.abs(v))));
  console.log(`root travelled: ${Math.hypot(last.rx - first.rx, last.ry - first.ry).toFixed(0)} px in ${(last.age - first.age).toFixed(1)}s | rot ${first.rot}→${last.rot}`);
}
await b.close();
console.log('WITNESS DONE');
