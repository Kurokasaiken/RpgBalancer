import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => document.querySelector('[data-testid="game-mappa2"]')?.dataset.mapReady === 'true', null, { timeout: 180000 });
await p.waitForFunction(() => window.__worldCam, null, { timeout: 60000 });
// how many pixi canvases? and wheel listeners on window?
const info = await p.evaluate(() => {
  const canvases = [...document.querySelectorAll('canvas')].map((c) => ({
    inMapLayer: Boolean(c.closest('[data-testid="world-map-layer"]')),
    size: `${c.width}x${c.height}`,
    pe: getComputedStyle(c).pointerEvents,
    parentCls: String(c.parentElement?.className),
  }));
  return { canvases, pixiBuildCount: window.__pixiBuildCount };
});
console.log(JSON.stringify(info, null, 1));
// wheel listeners probe: temporarily wrap window.addEventListener? can't retroactively.
// Instead: dispatch wheel on document.documentElement (a Node) and see if zoom changes
const r = await p.evaluate(() => {
  const z0 = window.__worldCam.zoom;
  const ev = new WheelEvent('wheel', { deltaY: 240, clientX: 640, clientY: 360, bubbles: true, cancelable: true });
  document.documentElement.dispatchEvent(ev);
  return { z0, z1: window.__worldCam.zoom, prevented: ev.defaultPrevented };
});
console.log('html-dispatch', JSON.stringify(r));
await b.close();
