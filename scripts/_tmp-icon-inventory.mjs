import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu'] });
const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
await pg.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 45000 });
for (let i = 0; i < 160; i++) {
  const ok = await pg.evaluate(() => {
    const c = document.querySelector('canvas');
    const boot = document.body.textContent.includes('Preparing the world') || document.body.textContent.includes('Painting the world');
    return !!c && !boot;
  });
  if (ok) break;
  await pg.waitForTimeout(1500);
}
await pg.waitForTimeout(3000);
await pg.evaluate(() => document.querySelector('[data-nav-id="villageStash"]')?.click());
for (let i = 0; i < 20; i++) {
  const ok = await pg.evaluate(() => !!document.querySelector('[data-hud-panel="villageStash"]'));
  if (ok) break;
  await pg.waitForTimeout(1000);
}
await pg.waitForTimeout(2000);
const inv = await pg.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll('img, svg, [data-nav-id], [data-poi], [data-ctl], [data-piastrina-cornice]')) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || r.width > 500) continue;
    out.push({
      tag: el.tagName.toLowerCase(),
      src: el.getAttribute('src') ?? undefined,
      nav: el.getAttribute('data-nav-id') ?? undefined,
      ctl: el.getAttribute('data-ctl') ?? undefined,
      poi: el.getAttribute('data-poi') ?? undefined,
      testid: el.getAttribute('data-testid') ?? undefined,
      cls: (el.getAttribute('class') ?? '').slice(0, 60),
      x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
    });
  }
  return out;
});
console.log(JSON.stringify(inv, null, 0).slice(0, 20000));
await pg.screenshot({ path: '.mw/runs/20261124-poi-nav-icone/gen/inv-full.png' });
await b.close();
