/**
 * record-party-gif.mts — Steam About GIF 3: assembling the party, the forecast
 * answering each pick. Viewport 1920×1080 so the whole planner is in frame.
 * Usage: npx tsx marketing/steam/tools/record-party-gif.mts (dev server :5173,
 * Node 20, headed Chromium). Output: test-results/steam-capture-v2/party/*.webm
 * + start.txt (seconds from context start at which the map is ready).
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT = path.join(ROOT, 'test-results/steam-capture-v2/party');
const POI = 'poi-goblin';
const hook = (name: string, ...args: unknown[]) =>
  (window as any).__idleVillageTestHooks.expedition['poi-goblin'][name](...args);

const run = async () => {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' });
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
    locale: 'en-US',
  });
  const t0 = Date.now();
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/game?capture=1', { waitUntil: 'commit', timeout: 120_000 });
  await page.waitForFunction(() => (window as any).__idleVillageTestHooks, null, { timeout: 240_000 });
  for (let i = 0; i < 60; i++) {
    await page.evaluate(() => (window as any).__idleVillageTestHooks?.revealQuestPois?.());
    if (await page.locator(`[data-quest-poi-id="${POI}"]`).isVisible()) break;
    await page.waitForTimeout(2000);
  }
  await page.waitForTimeout(1500);
  await page.locator(`[data-quest-poi-id="${POI}"]`).click({ timeout: 180_000 });
  await page.getByTestId('quest-expedition-detail').waitFor({ timeout: 180_000 });
  await page.waitForTimeout(3000);
  writeFileSync(path.join(OUT, 'start.txt'), String((Date.now() - t0) / 1000));
  await page.waitForTimeout(1500);
  await page.evaluate(([n, a, b]) => (window as any).__idleVillageTestHooks.expedition['poi-goblin'][n](a, b), ['assignToSlot', `${POI}:goblin-slot-leader`, 'hero-sir-spaccaculi']);
  await page.waitForTimeout(3500);
  await page.evaluate(([n, a, b]) => (window as any).__idleVillageTestHooks.expedition['poi-goblin'][n](a, b), ['assignToSlot', `${POI}:goblin-slot-member-1`, 'hero-giggiolillo']);
  await page.waitForTimeout(25000);
  await ctx.close();
  await browser.close();
};
void hook;
run().catch((e) => { console.error(e); process.exit(1); });
