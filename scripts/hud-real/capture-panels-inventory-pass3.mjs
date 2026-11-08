#!/usr/bin/env node
/**
 * capture-panels-inventory-pass3.mjs — PLAN-113 F0 pass 3 (surgical).
 * B-family quest run via demoLaunch/send + fillRequiredResidentSlots,
 * verdict via choose/advanceTicks, G3 load + G4 settings via open game menu.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'test-results/plan113-inventory');
const BASE_URL = process.argv[2] ?? 'http://localhost:5173';
const POI = 'poi-goblin';
const shot = async (page, name) => { await page.waitForTimeout(1100); await page.screenshot({ path: join(OUT, `${name}.png`) }); console.log(name); };
const step = async (l, fn) => { try { await fn(); } catch (e) { console.warn(`[skip ${l}]`, String(e).slice(0, 160)); } };

const main = async () => {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text().slice(0, 140)); });
  await page.goto(`${BASE_URL}/game`);
  await page.waitForFunction((poi) => Boolean(window.__idleVillageTestHooks?.expedition?.[poi]), POI, { timeout: 45_000 });
  await page.waitForFunction(() => !document.querySelector('[data-testid="game-boot-screen"]'), undefined, { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(2500);

  // B — launch a run: prefer demoLaunch, fallback fillRequired+send
  await step('B-launch', async () => {
    const keys = await page.evaluate((poi) => Object.keys(window.__idleVillageTestHooks?.expedition?.[poi] ?? {}), POI);
    console.log('  expedition keys:', JSON.stringify(keys));
    const launched = await page.evaluate(async (poi) => {
      const h = window.__idleVillageTestHooks?.expedition?.[poi];
      if (h?.demoLaunch) { h.demoLaunch(); return 'demoLaunch'; }
      return null;
    }, POI);
    if (!launched) {
      await page.evaluate((poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.openDetail?.(), POI);
      await page.waitForSelector('[data-testid="quest-expedition-detail"]', { timeout: 15_000 });
      await page.evaluate(() => window.__idleVillageTestHooks?.fillRequiredResidentSlots?.());
      await page.waitForTimeout(600);
      await shot(page, '22b-B-planner-autofilled');
      await page.evaluate((poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.send?.(), POI);
    }
    await page.waitForTimeout(3000);
    await shot(page, '31-B1-run-window');
    const run = await page.evaluate((poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.getRun?.()?.phase ?? null, POI);
    console.log('  run phase:', run);
  });

  // B2 — drive beats until skill-check or end
  await step('B-drive', async () => {
    for (let i = 0; i < 12; i += 1) {
      const opts = await page.evaluate((poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.getOptions?.() ?? [], POI);
      const check = await page.$('[data-testid*="skill"], [class*="astrolabe"], [class*="Astrolabe"]');
      if (check) { await shot(page, '32-B2-skill-check'); break; }
      if (!opts.length) { console.log('  no options, beat', i); break; }
      await page.evaluate(({ poi, opt }) => window.__idleVillageTestHooks?.expedition?.[poi]?.choose?.(opt, false), { poi: POI, opt: opts[0] });
      await page.waitForTimeout(1600);
      if (i === 2) await shot(page, '32b-B-mid-run');
      if (i === 5) await page.evaluate(() => window.__idleVillageTestHooks?.advanceTicks?.(30)).catch(() => {});
    }
    await shot(page, '33-B-run-late');
  });

  // B6/B7 — settlement/verdict
  await step('B-end', async () => {
    await page.evaluate((poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.commitSettlement?.(), POI).catch(() => {});
    await page.waitForTimeout(1500);
    await shot(page, '34-B-verdict');
  });

  // G3/G4 — open menu (Escape to map first), click LOAD GAME + ALL SETTINGS
  await step('G-sub', async () => {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    // reopen the same menu the earlier pass found (3rd bottom-right round button area)
    const before = await page.locator('button').count();
    // try clicking round buttons in the bottom-right corner cluster
    const cluster = page.locator('button').filter({ has: page.locator('svg, img') });
    const n = await cluster.count();
    for (let i = n - 1; i >= 0 && i > n - 12; i -= 1) {
      const box = await cluster.nth(i).boundingBox().catch(() => null);
      if (box && box.y > 1000 && box.x > 1400) { await cluster.nth(i).click(); break; }
    }
    await page.waitForTimeout(900);
    await shot(page, '35-G2-menu-open');
    if (await page.getByText('LOAD GAME', { exact: false }).first().isVisible().catch(() => false)) {
      await page.getByText('LOAD GAME', { exact: false }).first().click();
      await page.waitForTimeout(900);
      await shot(page, '36-G3-load-panel');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }
    if (await page.getByText('ALL SETTINGS', { exact: false }).first().isVisible().catch(() => false)) {
      await page.getByText('ALL SETTINGS', { exact: false }).first().click();
      await page.waitForTimeout(900);
      await shot(page, '37-G4-settings');
      await page.keyboard.press('Escape');
    }
  });

  await browser.close();
};
main().catch((err) => { console.error(err); process.exit(1); });
