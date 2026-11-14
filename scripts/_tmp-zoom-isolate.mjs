import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => document.querySelector('[data-testid="game-mappa2"]')?.dataset.mapReady === 'true', null, { timeout: 180000 });
await p.waitForFunction(() => window.__worldCam, null, { timeout: 60000 });
const info = await p.evaluate(() => {
  const canvas = document.querySelector('[data-testid="world-map-layer"] canvas');
  const host = canvas?.parentElement;
  const navBtn = document.querySelector('[data-nav-id="village"]');
  return {
    canvasPe: canvas ? getComputedStyle(canvas).pointerEvents : null,
    hostPe: host ? getComputedStyle(host).pointerEvents : null,
    layerPe: getComputedStyle(document.querySelector('[data-testid="world-map-layer"]')).pointerEvents,
    canvasInNav: canvas?.contains(navBtn) ?? null,
    navInCanvas: navBtn?.contains(canvas) ?? null,
  };
});
console.log(JSON.stringify(info));
// now: dispatch a synthetic wheel directly on window target=nav path and watch cam
const nav = await p.locator('[data-nav-id="village"]').boundingBox();
await p.mouse.move(nav.x + nav.width / 2, nav.y + nav.height / 2);
const before = await p.evaluate(() => window.__worldCam.zoom);
await p.mouse.wheel(0, 240);
await p.waitForTimeout(250);
const after = await p.evaluate(() => window.__worldCam.zoom);
console.log('zoom', before, '→', after);
await b.close();
