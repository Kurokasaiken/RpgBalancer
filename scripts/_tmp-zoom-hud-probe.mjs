import { chromium } from 'playwright';
const page = await (await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })).newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__worldCam?.zoom > 0, null, { timeout: 240000 });
await page.waitForTimeout(800);
const rest = await page.evaluate(() => window.__worldCam.zoom);
console.log('RESTING zoom', rest.toFixed(4), 'bounds', JSON.stringify(await page.evaluate(() => window.__worldCamBounds)));

// snapshot every visible element's rect + signature
const snap = (tag) => page.evaluate((t) => {
  const out = {};
  document.querySelectorAll('body *').forEach((el, i) => {
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || r.width > 3000) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const sig = [el.tagName, el.dataset.hudslot || el.dataset.navId || el.dataset.anchorId || '', (el.className || '').toString().slice(0, 40)].join('|');
    out[sig + '#' + i] = { w: +r.width.toFixed(1), h: +r.height.toFixed(1), x: +r.x.toFixed(1), y: +r.y.toFixed(1), pe: cs.pointerEvents };
  });
  return out;
}, tag);

const before = await snap('before');
await page.evaluate(() => window.__worldCamCtl.set({ zoom: window.__worldCam.zoom * 2 }));
await page.waitForTimeout(300);
const mid = await page.evaluate(() => window.__worldCam.zoom);
const after = await snap('after');
console.log('ZOOMED to', mid);

// report elements whose SIZE changed (not just position)
let n = 0;
for (const k of Object.keys(before)) {
  const a = before[k], b = after[k];
  if (!b) continue;
  const wr = b.w / a.w, hr = b.h / a.h;
  if (Math.abs(wr - 1) > 0.02 || Math.abs(hr - 1) > 0.02) {
    n++;
    if (n < 25) console.log('SIZE-CHANGE', k.split('#')[0], `${a.w}x${a.h} -> ${b.w}x${b.h}`, 'pe:' + a.pe);
  }
}
console.log('total size-changed elements:', n);

// zoom-out difficulty: wheel-out steps needed to reach floor
await page.evaluate(() => window.__worldCamCtl.refit());
await page.waitForTimeout(200);
let z = (await page.evaluate(() => window.__worldCam.zoom));
const steps = [z];
await page.mouse.move(720, 450);
for (let i = 0; i < 40 && z > 0.18; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(60); z = (await page.evaluate(() => window.__worldCam.zoom)); steps.push(z); }
console.log('ZOOM-OUT steps (deltaY=100):', steps.map(s => s.toFixed(3)).join(' '));
console.log('vv.scale:', await page.evaluate(() => visualViewport.scale));
process.exit(0);
