import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
for (const [w, h] of [[3440, 1440], [2560, 1600], [900, 1400], [700, 900], [900, 420]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  try {
    await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 45000 });
    for (let i = 0; i < 45; i++) {
      let ok = false;
      try { ok = await p.evaluate(() => !!document.querySelector('canvas') && !document.querySelector('[data-boot-phase]')); } catch { /* nav in progress */ }
      if (ok) break;
      await p.waitForTimeout(2000);
    }
    await p.waitForTimeout(1000);
    const out = await p.evaluate(() => {
      const winW = window.innerWidth;
      const cx = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return +(((r.left + r.right) / 2) - winW / 2).toFixed(1);
      };
      return {
        mode: document.querySelector('[data-hud-mode]')?.getAttribute('data-hud-mode') ?? null,
        nav: cx('[data-hudreal-nav]'),
        res: cx('[data-hudslot="resources"]'),
        time: cx('[data-hudslot="time"]'),
      };
    });
    console.log(`${w}x${h}`, JSON.stringify(out));
  } catch (e) {
    console.log(`${w}x${h}`, 'ERR', String(e).slice(0, 160));
  }
  await p.close();
}
await b.close();
