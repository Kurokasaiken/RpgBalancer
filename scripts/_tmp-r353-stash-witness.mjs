import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
p.on('pageerror', e => console.log('PAGEERROR:', String(e).slice(0, 200)));
await p.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 90000 });
await p.waitForSelector('[data-map-ready]', { timeout: 300000 });
await p.waitForSelector('.game-boot-screen', { state: 'detached', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(2500);
await p.keyboard.press('v');
await p.waitForSelector('[data-hud-panel="villageStash"]', { timeout: 15000 }).catch(() => {});
await p.waitForTimeout(1500);
await p.screenshot({ path: '.mw/runs/20261116-r353-roster-restyle/witness-stash-full.png' });
const panel = p.locator('[data-hud-panel="villageStash"]').first();
if (await panel.count()) await panel.screenshot({ path: '.mw/runs/20261116-r353-roster-restyle/witness-stash-panel.png' });
console.log('stash panel:', await panel.count());
// bound mode: open a quest cassetto bag slot → stash bound
await b.close();
