import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 45000 });
await p.waitForSelector('canvas', { timeout: 120000 });
try { await p.waitForSelector('[data-boot-phase]', { state: 'detached', timeout: 120000 }); } catch {}
await p.waitForTimeout(1000);
const info = await p.evaluate(() => {
  const pick = (el, n = 8) => {
    const out = [];
    let e = el;
    while (e && out.length < n) {
      out.push({
        tag: e.tagName.toLowerCase(),
        tid: e.getAttribute('data-testid'),
        cls: typeof e.className === 'string' ? e.className.slice(0, 60) : '',
        aria: e.getAttribute('aria-label'),
        rect: e.getBoundingClientRect().toJSON(),
      });
      e = e.parentElement;
    }
    return out;
  };
  // bust: bottom-left portrait — find element near bottom-left with an <img> or role button
  const cand = [...document.querySelectorAll('[data-testid], button, img, [role="button"]')];
  const bust = cand.find((e) => { const r = e.getBoundingClientRect(); return r.left < 200 && r.bottom > innerHeight - 200 && r.width > 40 && r.width < 300; });
  // nav: bottom-center — astrolabe button
  const navCands = cand.filter((e) => { const r = e.getBoundingClientRect(); return r.top > innerHeight - 160 && r.left > innerWidth / 3 && r.left < innerWidth * 2 / 3; });
  const corner = document.querySelector('[data-hud-corner]');
  return {
    bustEl: bust ? { tid: bust.getAttribute('data-testid'), aria: bust.getAttribute('aria-label'), tag: bust.tagName } : null,
    bustPath: bust ? pick(bust, 6) : null,
    navPath: navCands.length ? pick(navCands[0], 6) : null,
    navCount: navCands.length,
    cornerRect: corner ? corner.getBoundingClientRect().toJSON() : null,
    cornerPath: corner ? pick(corner, 4) : null,
  };
});
const keep = { bustEl: info.bustEl, navCount: info.navCount };
  keep.bustPath = (info.bustPath || []).map((e) => ({ tag: e.tag, tid: e.tid, aria: e.aria, w: Math.round(e.rect.width), h: Math.round(e.rect.height), x: Math.round(e.rect.x), y: Math.round(e.rect.y) }));
  keep.navPath = (info.navPath || []).map((e) => ({ tag: e.tag, tid: e.tid, aria: e.aria, w: Math.round(e.rect.width), h: Math.round(e.rect.height), x: Math.round(e.rect.x), y: Math.round(e.rect.y) }));
  console.log(JSON.stringify(keep, null, 1));
await b.close();
