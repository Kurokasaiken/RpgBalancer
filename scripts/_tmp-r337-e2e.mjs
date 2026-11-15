import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 160)));
await p.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
for (let i = 0; i < 90; i++) {
  if (await p.evaluate(() => !!document.querySelector('[data-map-ready]'))) { console.log('ready at', i); break; }
  await p.waitForTimeout(2000);
}
await p.evaluate(() => { const v = document.querySelector('[data-testid="game-boot-screen"]'); if (v) v.style.display = 'none'; });
const marker = (await p.$$('[data-testid="map-quest-poi"]'))[0];
if (!marker) { console.log('NO QUEST POI MARKER'); await b.close(); process.exit(1); }
const mb = await marker.boundingBox();
console.log('marker box:', JSON.stringify(mb));
await marker.click({ timeout: 5000 }).catch(async () => {
  console.log('marker.click failed, trying center click');
  await p.mouse.click(mb.x + mb.width / 2, mb.y + mb.height / 2);
});
await p.waitForTimeout(1500);
const cassetto = await p.$('[data-cassetto-bag]');
console.log('cassetto open:', !!cassetto);
if (!cassetto) { await p.screenshot({ path: '/tmp/r337-afterclick.png' }); console.log('shot /tmp/r337-afterclick.png'); await b.close(); process.exit(1); }
// click first empty bag slot → magazzino should open bound to this POI
await p.click('[data-testid="bag-slot-empty-0"]');
await p.waitForTimeout(1200);
const shelf = await p.evaluate(() => ({
  panel: !!document.querySelector('[data-hud-panel="villageStash"]'),
  mode: document.querySelector('[data-testid="stash-shelf"]')?.getAttribute('data-stash-mode'),
  rows: document.querySelectorAll('[data-testid^="stash-item-"]').length,
}));
console.log('stash:', JSON.stringify(shelf));
// click first stash row → item should land in bag slot 0
const row = await p.$('[data-testid^="stash-item-"]');
if (row) {
  await row.click();
  await p.waitForTimeout(800);
  const after = await p.evaluate(() => ({
    items: [...document.querySelectorAll('[data-testid^="loadout-item-"]')].map(e => e.getAttribute('data-testid')),
    empties: document.querySelectorAll('[data-testid^="bag-slot-empty-"]').length,
  }));
  console.log('after assign:', JSON.stringify(after));
  // click the packed item → releases back
  const packed = await p.$('[data-testid^="loadout-item-"]');
  if (packed) { await packed.click(); await p.waitForTimeout(600);
    console.log('after release:', await p.evaluate(() => document.querySelectorAll('[data-testid^="loadout-item-"]').length + ' packed, ' + document.querySelectorAll('[data-testid^="bag-slot-empty-"]').length + ' empty'));
  }
}
await p.screenshot({ path: '/tmp/r337-e2e-final.png' });
await b.close();
