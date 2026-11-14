import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => document.querySelector('[data-testid="game-mappa2"]')?.dataset.mapReady === 'true', null, { timeout: 180000 });
await p.waitForFunction(() => window.__worldCam, null, { timeout: 60000 });
await p.evaluate(() => {
  window.__wheelLog = [];
  window.addEventListener('wheel', (e) => {
    const t = e.target;
    window.__wheelLog.push({ tag: t.tagName, cls: String(t.className).slice(0, 60), nav: t.closest?.('[data-nav-id]')?.dataset.navId ?? null, ctrl: e.ctrlKey, dy: e.deltaY, defaultPrevented: e.defaultPrevented });
  }, { capture: false });
});
const nav = await p.locator('[data-nav-id="village"]').boundingBox();
await p.mouse.move(nav.x + nav.width / 2, nav.y + nav.height / 2);
await p.mouse.wheel(0, 240);
await p.waitForTimeout(300);
const hit = await p.evaluate((pt) => {
  const el = document.elementFromPoint(pt[0], pt[1]);
  const chain = [];
  let n = el;
  while (n && chain.length < 10) {
    const s = getComputedStyle(n);
    chain.push(`${n.tagName}${n.id ? '#' + n.id : ''} pe:${s.pointerEvents} ov:${s.overflowY} sh:${n.scrollHeight}>ch:${n.clientHeight}`);
    n = n.parentElement;
  }
  return { chain, log: window.__wheelLog, zoom: window.__worldCam.zoom };
}, [nav.x + nav.width / 2, nav.y + nav.height / 2]);
console.log(JSON.stringify(hit, null, 1));
await b.close();
