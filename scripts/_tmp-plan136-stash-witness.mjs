import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT = 'test-results/plan136-stash-round-sockets';
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
p.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 200)));
await p.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(3000);
for (let i = 0; i < 40; i++) {
  if (await p.evaluate(() => !!document.querySelector('[data-map-ready]')).catch(() => false)) break;
  await p.waitForTimeout(1000);
}
await p.evaluate(() => { const v = document.querySelector('[data-testid="game-boot-screen"]'); if (v) v.style.display = 'none'; });
const marker = (await p.$$('[data-testid="map-quest-poi"]'))[0];
if (!marker) throw new Error('no poi marker');
const mb = await marker.boundingBox();
await p.mouse.click(mb.x + mb.width / 2, mb.y + mb.height / 2);
await p.waitForTimeout(1000);
await p.evaluate(() => document.querySelector('[data-testid="bag-slot-empty-0"]')?.click());
await p.waitForTimeout(1000);
const panel = await p.$('[data-hud-panel="villageStash"]');
if (!panel) throw new Error('stash panel not open');
await p.screenshot({ path: `${OUT}/witness-stash-after.png`, fullPage: false });
const pb = await panel.boundingBox();
await p.screenshot({ path: `${OUT}/witness-stash-panel.png`, clip: { x: Math.max(0,pb.x-8), y: Math.max(0,pb.y-8), width: pb.width+16, height: pb.height+16 } });
const report = await p.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const rect = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return {x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height)}; };
  const panel = q('[data-hud-panel="villageStash"]');
  const title = q('#village-stash-panel-title');
  const close = q('[data-panel-close]');
  const filters = q('[data-testid="stash-filters"]');
  const shelf = q('[data-testid="stash-shelf"]');
  const item = q('[data-testid^="stash-item-"]');
  const empty = q('[data-testid="stash-empty-alcove"]');
  const track = q('[data-testid="stash-scroll-track"]');
  const img = panel?.querySelector('img');
  const cs = (el) => el ? {bg:getComputedStyle(el).backgroundImage.slice(0,140), filter:getComputedStyle(el).filter, w:getComputedStyle(el).width, h:getComputedStyle(el).height} : null;
  return {
    titleText:title?.textContent,
    backing:img?.getAttribute('src'),
    panel:rect(panel), title:rect(title), close:rect(close), filters:rect(filters), shelf:rect(shelf), item:rect(item), empty:rect(empty), track:rect(track),
    closeStyle:cs(close), filterStyle:cs(q('[data-testid^="stash-filter-"]')), alcoveStyle:cs(item), emptyAlcoveStyle:cs(empty),
    itemCount:document.querySelectorAll('[data-testid^="stash-item-"]').length,
    emptyCount:document.querySelectorAll('[data-testid="stash-empty-alcove"]').length,
    visibleBottomText:document.body.innerText.includes('planner') || document.body.innerText.includes('sacca'),
  };
});
console.log(JSON.stringify(report,null,2));
fs.writeFileSync(`${OUT}/witness-report.json`, JSON.stringify(report,null,2));
await b.close();
