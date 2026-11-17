import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
await page.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForFunction(() => document.querySelectorAll('canvas').length > 0 && typeof window.__idleVillageTestHooks?.expedition?.['poi-goblin']?.openDetail === 'function' && document.querySelectorAll('[data-testid="game-boot-screen"]').length === 0, null, { timeout: 150000, polling: 1000 });
await page.waitForTimeout(1000);
await page.evaluate(() => window.__idleVillageTestHooks.expedition['poi-goblin'].openDetail());
await page.waitForSelector('[data-testid^="slot-button-"]', { state: 'attached', timeout: 10000 });
await page.waitForTimeout(600);
await page.evaluate(() => window.__idleVillageTestHooks.expedition['poi-goblin'].assignToSlot('poi-goblin:goblin-slot-member-2', 'villager-lisetta'));
for (const t of [1, 3, 6, 10]) {
  await page.waitForTimeout(t === 1 ? 1000 : t === 3 ? 2000 : t === 6 ? 3000 : 4000);
  console.log(`t+${t}s: medals=${await page.locator('[data-testid^="slot-medal-"] img').count()} assign=${JSON.stringify(await page.evaluate(() => window.__idleVillageTestHooks.expedition['poi-goblin'].getAssignments()))} veil=${await page.locator('[data-testid="game-boot-screen"]').count()}`);
}
console.log('errors:', errors.slice(0, 5));
await b.close();
