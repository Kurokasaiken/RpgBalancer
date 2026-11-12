// Headless /game village probe for R-326: opens the Village director view,
// asserts house-small-west is absent from the panel, toggles every layer on and
// screenshots the stage.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = '.mw/runs/20261112-r326-village-layer-recut/visual';
mkdirSync(OUT, { recursive: true });

const url = 'http://localhost:5173/game';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
p.on('pageerror', (e) => console.log('[pageerror]', String(e.stack ?? e).slice(0, 600)));
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

// wait for the map/game to be ready
await p.waitForSelector('[data-testid="game-mappa2"][data-map-ready]', { timeout: 120000 });
console.log('game ready');

await p.click('[data-nav-id="village"]');
await p.waitForSelector('[data-testid="village-director-view"]', { timeout: 30000 });
// wait for base image + layer images to load
await p.waitForFunction(() => {
  const imgs = [...document.querySelectorAll('[data-testid="village-stage"] img')];
  return imgs.length > 0 && imgs.every((i) => i.complete);
}, { timeout: 30000 });
console.log('village view open');

const actionIds = await p.$$eval('[data-testid="director-panel"] [data-action-id]',
  (els) => els.map((e) => e.getAttribute('data-action-id')));
console.log('actions:', JSON.stringify(actionIds));
const hasSmallWest = actionIds.includes('house-small-west');
console.log('house-small-west in menu:', hasSmallWest);

// toggle everything on for the full-composite screenshot
for (const id of actionIds) await p.click(`[data-action-id="${id}"]`);
await p.waitForTimeout(800);
await p.locator('[data-testid="village-stage"]').screenshot({ path: `${OUT}/village-all-on.png` });
await p.locator('[data-testid="director-panel"]').screenshot({ path: `${OUT}/director-panel.png` });
console.log('screenshots saved');

await b.close();
process.exit(hasSmallWest ? 1 : 0);
