import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => document.querySelector('[data-testid="game-mappa2"]')?.dataset.mapReady === 'true', null, { timeout: 180000 });
await p.waitForFunction(() => window.__worldCam, null, { timeout: 60000 });
const r = await p.evaluate(() => {
  const canvas = document.querySelector('[data-testid="world-map-layer"] canvas');
  const target = document.querySelector('[data-nav-id="village"]');
  const scrollables = [];
  for (let n = target; n; n = n.parentElement) {
    if (n === document.body || n === document.documentElement) break;
    const s = getComputedStyle(n);
    if ((s.overflowY === 'auto' || s.overflowY === 'scroll') && n.scrollHeight > n.clientHeight + 1)
      scrollables.push(`${n.tagName}.${String(n.className).slice(0, 40)}`);
  }
  // synthetic wheel on the nav button (bubbles to window)
  const z0 = window.__worldCam.zoom;
  const ev = new WheelEvent('wheel', { deltaY: 240, clientX: 640, clientY: 690, bubbles: true, cancelable: true });
  target.dispatchEvent(ev);
  const z1 = window.__worldCam.zoom;
  return { contains: canvas.contains(target), pe: getComputedStyle(canvas).pointerEvents, scrollables, z0, z1, prevented: ev.defaultPrevented };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
