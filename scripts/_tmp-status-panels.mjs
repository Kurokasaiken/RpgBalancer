import { chromium } from 'playwright';
const OUT = '.mw/runs/20261122-status-roster-stash';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('PAGEERROR:', String(e).slice(0, 200)));
await p.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 90000 });
await p.waitForSelector('[data-map-ready]', { timeout: 300000 });
await p.waitForSelector('.game-boot-screen', { state: 'detached', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(2500);
// roster only
await p.keyboard.press('r');
await p.waitForSelector('[data-panel="roster"]', { timeout: 15000 }).catch(() => {});
await p.waitForTimeout(1200);
await p.locator('[data-panel="roster"]').first().screenshot({ path: `${OUT}/panel-roster.png` }).catch(e => console.log('roster shot fail', String(e).slice(0,120)));
// close roster via its close button (top-right X) — toggle with r
await p.keyboard.press('r');
await p.waitForTimeout(800);
// stash only
await p.keyboard.press('v');
await p.waitForSelector('[data-hud-panel="villageStash"]', { timeout: 15000 }).catch(() => {});
await p.waitForTimeout(1200);
await p.locator('[data-hud-panel="villageStash"]').first().screenshot({ path: `${OUT}/panel-stash.png` }).catch(e => console.log('stash shot fail', String(e).slice(0,120)));
console.log('roster visible:', await p.locator('[data-panel="roster"]:visible').count(), '| stash visible:', await p.locator('[data-hud-panel="villageStash"]:visible').count());
await b.close();
