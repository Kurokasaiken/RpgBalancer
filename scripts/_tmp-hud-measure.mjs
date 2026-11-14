import { chromium } from 'playwright';
for (const vp of [{width:1440,height:900},{width:1280,height:800},{width:1600,height:900},{width:1512,height:982}]) {
  const page = await (await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })).newPage({ viewport: vp });
  await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__worldCam?.zoom > 0, null, { timeout: 240000 });
  await page.waitForTimeout(600);
  const m = await page.evaluate(() => {
    const out = { vw: innerWidth, vh: innerHeight, frame: document.querySelector('[data-hud-mode]')?.dataset.hudMode };
    for (const s of ['time','resources','nav']) {
      const el = document.querySelector(`[data-hudslot="${s}"]`);
      if (!el) { out[s] = 'MISSING'; continue; }
      const r = el.getBoundingClientRect();
      out[s] = { x: +r.x.toFixed(0), y: +r.y.toFixed(0), w: +r.width.toFixed(0), h: +r.height.toFixed(0), offScreen: r.x+r.width<0||r.x>innerWidth||r.y+r.height<0||r.y>innerHeight };
    }
    // actual plinth image extent (the compass overhangs the slot)
    const nav = document.querySelector('[data-hudslot="nav"]');
    let max = nav.getBoundingClientRect();
    nav.querySelectorAll('*').forEach(c => { const r = c.getBoundingClientRect(); if (r.bottom > max.bottom) max = r; });
    out.navVisualBottom = +max.bottom.toFixed(0);
    return out;
  });
  console.log(`vp ${vp.width}x${vp.height}:`, JSON.stringify(m));
  await page.close();
}
process.exit(0);
