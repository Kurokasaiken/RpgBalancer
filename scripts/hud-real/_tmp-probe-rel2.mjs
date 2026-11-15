import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForSelector('canvas', { timeout: 40000 }).catch(() => {});
// wait for the boot veil to actually exit
await page.waitForSelector('[data-testid="game-boot-screen"]', { state: 'detached', timeout: 30000 }).catch(() => {});
await page.waitForTimeout(1500);
await page.evaluate(() => document.querySelector('[data-testid="hud-director-trigger"]')?.click());
await page.waitForTimeout(500);
await page.evaluate(() => document.querySelector('[data-action-id="legacy"]')?.click());
await page.waitForTimeout(800);
console.log('reliquary:', await page.locator('[data-testid="hudreal-reliquary"]').count());
await page.screenshot({ path: 'test-results/reliquary-game-open.png' });
await b.close();
