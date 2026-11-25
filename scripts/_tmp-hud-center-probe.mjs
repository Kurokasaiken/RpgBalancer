import { chromium } from 'playwright';
const url = process.argv[2] ?? 'http://localhost:5173/game';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e.stack ?? e).slice(0, 400)));
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
for (let i = 0; i < 60; i++) {
  const ok = await p.evaluate(() => !!document.querySelector('canvas') && !document.querySelector('[data-boot-phase]'));
  if (ok) break;
  await p.waitForTimeout(2000);
}
await p.waitForTimeout(1500);
const out = await p.evaluate(() => {
  const winW = window.innerWidth;
  const rect = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: +r.left.toFixed(1), right: +r.right.toFixed(1), top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1), w: +r.width.toFixed(1), cx: +((r.left + r.right) / 2).toFixed(1), deltaCx: +(((r.left + r.right) / 2) - winW / 2).toFixed(1) };
  };
  const imgRect = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: +r.left.toFixed(1), right: +r.right.toFixed(1), w: +r.width.toFixed(1), cx: +((r.left + r.right) / 2).toFixed(1), deltaCx: +(((r.left + r.right) / 2) - winW / 2).toFixed(1) };
  };
  return {
    winW,
    mode: document.querySelector('[data-hud-mode]')?.getAttribute('data-hud-mode') ?? null,
    navSlot: rect('[data-hudslot="nav"]'),
    navImg: imgRect('[data-hudslot="nav"] img, [data-hudreal-nav] img'),
    navEl: rect('[data-hudreal-nav]'),
    resourcesSlot: rect('[data-hudslot="resources"]'),
    timeSlot: rect('[data-hudslot="time"]'),
    topChrome: rect('[data-testid="game-top-chrome"]'),
    chromeDay: rect('[data-testid="chrome-day-banner"]'),
    chromeRes: rect('[data-testid="chrome-resources"]'),
  };
});
console.log(JSON.stringify(out, null, 2));
await p.screenshot({ path: 'test-results/hud-center-probe.png' });
await b.close();
