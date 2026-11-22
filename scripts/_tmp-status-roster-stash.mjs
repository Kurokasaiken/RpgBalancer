import { chromium } from 'playwright';
const OUT = '.mw/runs/20261122-status-roster-stash';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('PAGEERROR:', String(e).slice(0, 200)));
await p.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 90000 });
await p.waitForSelector('[data-map-ready]', { timeout: 300000 });
await p.waitForSelector('.game-boot-screen', { state: 'detached', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(2500);
await p.screenshot({ path: `${OUT}/01-baseline.png` });
// roster (hotkey r)
await p.keyboard.press('r');
await p.waitForSelector('[data-panel="roster"]', { timeout: 15000 }).catch(() => {});
await p.waitForTimeout(1200);
await p.screenshot({ path: `${OUT}/02-roster.png` });
console.log('roster panels:', await p.locator('[data-panel="roster"]').count());
// stash (hotkey v)
await p.keyboard.press('v');
await p.waitForSelector('[data-hud-panel="villageStash"]', { timeout: 15000 }).catch(() => {});
await p.waitForTimeout(1200);
await p.screenshot({ path: `${OUT}/03-roster+stash.png` });
console.log('stash panels:', await p.locator('[data-hud-panel="villageStash"]').count());
// close roster via Escape / its close button, keep stash
await p.keyboard.press('Escape');
await p.waitForTimeout(600);
await p.screenshot({ path: `${OUT}/04-stash-only.png` });
// cassetto via POI detail (test hooks)
try {
  await p.evaluate(() => window.__idleVillageTestHooks?.expedition?.['poi-goblin']?.openDetail?.());
  await p.waitForSelector('[data-hud-panel="expeditionDrawer"], [class*="cassetto"], [data-testid*="cassetto"]', { timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/05-cassetto.png` });
  console.log('roster with cassetto open:', await p.locator('[data-panel="roster"]:visible').count());
} catch (e) { console.log('cassetto open failed:', String(e).slice(0, 150)); }
await b.close();
