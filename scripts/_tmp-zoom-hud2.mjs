import { chromium } from 'playwright';
const page = await (await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })).newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__worldCam?.zoom > 0, null, { timeout: 240000 });
await page.waitForTimeout(800);

// which HUD elements change size on zoom — identify by hudslot/nav/anchor ancestry
const probe = () => page.evaluate(() => {
  const out = [];
  document.querySelectorAll('body *').forEach((el) => {
    const hud = el.closest('[data-hudslot],[data-nav-id],nav,[data-anchor-id],[data-hud-mode]');
    el.__hud = hud ? (hud.dataset.hudslot || hud.dataset.navId || hud.dataset.anchorId || hud.dataset.hudMode || 'nav') : null;
  });
  return true;
});
await probe();
const snap = () => page.evaluate(() => {
  const out = {};
  document.querySelectorAll('body *').forEach((el, i) => {
    if (!el.__hud) return;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return;
    out[el.__hud + '#' + i] = { w: +r.width.toFixed(1), h: +r.height.toFixed(1), tag: el.tagName, aid: el.dataset.anchorId || '' };
  });
  return out;
});
const b = await snap();
await page.evaluate(() => window.__worldCamCtl.set({ zoom: window.__worldCam.zoom * 2 }));
await page.waitForTimeout(300);
const a = await snap();
const groups = {};
for (const k of Object.keys(b)) {
  if (!a[k]) continue;
  const wr = a[k].w / b[k].w;
  if (Math.abs(wr - 1) > 0.02) { const g = k.split('#')[0]; groups[g] = (groups[g] || 0) + 1; }
}
console.log('HUD-group elements that changed size on zoom:', JSON.stringify(groups));

// wheel-out over every piece of chrome — which are still dead?
const targets = await page.evaluate(() => {
  const t = {};
  const q = (sel, name) => { const el = document.querySelector(sel); if (el) { const r = el.getBoundingClientRect(); t[name] = { x: r.x + r.width / 2, y: r.y + r.height / 2 }; } };
  q('[data-hudslot="time"]', 'time-bar');
  q('[data-hudslot="resources"]', 'resources-bar');
  q('[data-hudslot="nav"]', 'nav-plinth');
  q('.game-boot-screen', 'boot-screen');
  q('[data-nav-id="village"]', 'village-btn');
  return t;
});
console.log('targets', JSON.stringify(targets));
await page.evaluate(() => window.__worldCamCtl.refit());
await page.waitForTimeout(200);
for (const [name, p] of Object.entries(targets)) {
  const z0 = await page.evaluate(() => window.__worldCam.zoom);
  await page.mouse.move(p.x, p.y);
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(120);
  const z1 = await page.evaluate(() => window.__worldCam.zoom);
  const tgt = await page.evaluate((pt) => { const el = document.elementFromPoint(pt.x, pt.y); return el ? el.tagName + '.' + (el.className||'').toString().slice(0,40) + (el.dataset.anchorId ? ' aid:'+el.dataset.anchorId : '') + (el.closest('[data-anchor-id]') ? ' in-anchor:'+el.closest('[data-anchor-id]').dataset.anchorId : '') : 'null'; }, p);
  console.log(`wheel-out @${name} (${tgt}): ${z0.toFixed(3)} -> ${z1.toFixed(3)}`, Math.abs(z1 - z0) < 0.001 ? 'DEAD' : 'ok');
  await page.evaluate(() => window.__worldCamCtl.refit());
}
process.exit(0);
