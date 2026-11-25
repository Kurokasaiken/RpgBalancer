import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu'] });
const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
await pg.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 45000 });
for (let i = 0; i < 160; i++) {
  const ok = await pg.evaluate(() => {
    const c = document.querySelector('canvas');
    const t = document.body.textContent;
    return !!c && !t.includes('Preparing the world') && !t.includes('Painting the world');
  });
  if (ok) break;
  await pg.waitForTimeout(1500);
}
await pg.waitForTimeout(2500);
const inv = await pg.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll('svg')) {
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8 || r.width > 200) continue;
    const p = el.closest('[data-testid],[aria-label],[title],[data-ctl],[data-nav-id],button');
    out.push({
      x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width),
      testid: p?.getAttribute?.('data-testid') ?? undefined,
      label: p?.getAttribute?.('aria-label') ?? p?.getAttribute?.('title') ?? undefined,
      parentCls: (el.parentElement?.getAttribute?.('class') ?? '').slice(0, 50),
      inner: el.innerHTML.slice(0, 120),
    });
  }
  return out;
});
console.log(JSON.stringify(inv, null, 1));
await b.close();
