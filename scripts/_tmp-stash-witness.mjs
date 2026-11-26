import { chromium } from 'playwright';
const OUT = '.mw/runs/stash-witness-20261126';
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
p.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 200)));
p.on('framenavigated', (f) => { if (f === p.mainFrame()) console.log('NAVIGATED', f.url().slice(0, 100)); });
await p.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(4000);
for (let i = 0; i < 90; i++) {
  try {
    if (await p.evaluate(() => !!document.querySelector('[data-map-ready]'))) break;
  } catch (e) { /* page reloaded mid-check (vite HMR) — keep polling */ }
  await p.waitForTimeout(2000);
}
await p.waitForTimeout(3000);
await p.evaluate(() => { const v = document.querySelector('[data-testid="game-boot-screen"]'); if (v) v.style.display = 'none'; });
const marker = (await p.$$('[data-testid="map-quest-poi"]'))[0];
const mb = await marker.boundingBox();
await p.mouse.click(mb.x + mb.width / 2, mb.y + mb.height / 2);
await p.waitForTimeout(1500);
const cassettoOpen = await p.evaluate(() => !!document.querySelector('[data-cassetto-bag]'));
console.log('cassetto open:', cassettoOpen);
await p.evaluate(() => document.querySelector('[data-testid="bag-slot-empty-0"]')?.click());
await p.waitForTimeout(1500);
const shelf = await p.$('[data-testid="stash-shelf"]');
console.log('stash shelf:', !!shelf, shelf ? await shelf.getAttribute('data-stash-mode') : '-');
const panel = await p.$('[data-hud-panel="villageStash"]');
const pb = panel ? await panel.boundingBox() : null;
console.log('panel box:', JSON.stringify(pb));
if (pb) {
  await p.screenshot({ path: `${OUT}/stash-bound-panel.png`, clip: { x: pb.x - 10, y: pb.y - 10, width: pb.width + 20, height: pb.height + 20 } });
  const close = await p.$('[data-panel-close]');
  const cb = await close.boundingBox();
  console.log('close box:', JSON.stringify(cb));
  await p.screenshot({ path: `${OUT}/stash-close-zoom.png`, clip: { x: cb.x - 30, y: cb.y - 30, width: cb.width + 60, height: cb.height + 60 } });
}
const tb = await (await p.$('[data-hudslot="time"]'))?.boundingBox();
if (tb && pb) {
  const x0 = Math.max(0, Math.min(tb.x, pb.x) - 10);
  const y0 = Math.max(0, tb.y - 10);
  await p.screenshot({ path: `${OUT}/compare-time-stash.png`, clip: { x: x0, y: y0, width: Math.max(tb.x + tb.width, pb.x + pb.width) - x0 + 10, height: pb.y + pb.height - y0 + 10 } });
  console.log('compare shot saved', JSON.stringify(tb));
}
const styles = await p.evaluate(() => {
  const cs = (el, props) => { const c = getComputedStyle(el); return Object.fromEntries(props.map((k) => [k, c[k]])); };
  const cell = document.querySelector('[data-testid^="stash-item-"]');
  const well = document.querySelector('[data-testid="stash-well-empty"]');
  const filter = document.querySelector('[data-testid^="stash-filter-"]');
  const close = document.querySelector('[data-panel-close]');
  const time = document.querySelector('[data-hudslot="time"] button');
  const P = ['width', 'height', 'borderTopColor', 'borderTopWidth', 'backgroundColor', 'backgroundImage', 'boxShadow', 'borderRadius'];
  return { cell: cell && cs(cell, P), well: well && cs(well, P), filter: filter && cs(filter, P), close: close && cs(close, P), timeBtn: time && cs(time, P) };
});
console.log('STYLES', JSON.stringify(styles));
const rects = await p.evaluate(() => {
  const r = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
  const shelf = document.querySelector('[data-testid="stash-shelf"]');
  const items = [...shelf.querySelectorAll(':scope > [role="listitem"]')].slice(0, 6);
  return {
    shelf: r(shelf),
    cells: items.map((li) => ({ li: r(li), btn: li.querySelector('button') ? r(li.querySelector('button')) : null, badge: li.querySelector('[data-testid="stash-qty-badge"]') ? r(li.querySelector('[data-testid="stash-qty-badge"]')) : null, tile: li.querySelector('[data-testid="stash-item-tile"]') ? r(li.querySelector('[data-testid="stash-item-tile"]')) : null })),
    rowCount: [...new Set([...shelf.querySelectorAll(':scope > [role="listitem"]')].map((li) => li.getBoundingClientRect().y))].length,
  };
});
console.log(JSON.stringify(rects, null, 1));
await b.close();
