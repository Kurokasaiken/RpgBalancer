/**
 * record-offer-gif.mts — Steam About GIF 1: a quest offer on the living map.
 *
 * Boots `/game?capture=1` (headed Chromium: no GPU = no map), waits for the
 * world gate, then records: map idle → hover the goblin offer → open its
 * planner. Logs the offset where the clean part starts so ffmpeg can trim the
 * boot screen. Usage: npx tsx marketing/steam/tools/record-offer-gif.mts
 * Output: test-results/steam-capture-v2/offer/*.webm + offer/start.txt
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT = path.join(ROOT, 'test-results/steam-capture-v2/offer');
const POI = 'poi-goblin';

const run = async () => {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: false });
  const t0 = Date.now();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 810 },
    recordVideo: { dir: OUT, size: { width: 1440, height: 810 } },
    locale: 'en-US',
  });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/game?capture=1', { waitUntil: 'commit', timeout: 120_000 });
  await page.waitForFunction(() => (window as any).__idleVillageTestHooks, null, { timeout: 240_000 });
  for (let i = 0; i < 60; i++) {
    await page.evaluate(() => (window as any).__idleVillageTestHooks?.revealQuestPois?.());
    if (await page.locator(`[data-quest-poi-id="${POI}"]`).isVisible()) break;
    await page.waitForTimeout(2000);
  }
  await page.waitForTimeout(1500);
  const start = (Date.now() - t0) / 1000;
  writeFileSync(path.join(OUT, 'start.txt'), String(start));
  await page.waitForTimeout(2500);
  const poi = page.locator(`[data-quest-poi-id="${POI}"]`);
  const box = await poi.boundingBox();
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 20 });
  await page.waitForTimeout(1500);
  await poi.click();
  await page.getByTestId('quest-expedition-detail').waitFor();
  await page.waitForTimeout(4500);
  await ctx.close();
  await browser.close();
  console.log('start', start);
};
run().catch((e) => { console.error(e); process.exit(1); });
