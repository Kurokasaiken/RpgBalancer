#!/usr/bin/env node
/**
 * capture-panels-inventory-pass2.mjs — PLAN-113 F0 pass 2.
 *
 * Surfaces that need state (fixtures via real game actions + test hooks):
 * village view (nav), invasion shroud (hook), quest run cluster (send a real
 * expedition), skill-check, verdict, reward popup, settlement, menus.
 * Every capture exercises the REAL path (nav click, hook seams, send boundary).
 *
 * Usage: node scripts/hud-real/capture-panels-inventory-pass2.mjs [baseUrl]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'test-results/plan113-inventory');
const BASE_URL = process.argv[2] ?? 'http://localhost:5173';
const VW = Number(process.env.CAP_W ?? 1920);
const VH = Number(process.env.CAP_H ?? 1080);
const POI = 'poi-goblin';
const shot = async (page, name) => {
  await page.waitForTimeout(1000);
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  console.log(name);
};
const step = async (label, fn) => { try { await fn(); } catch (e) { console.warn(`[skip ${label}]`, String(e).slice(0, 140)); } };

const main = async () => {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: VW, height: VH } });
  page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text().slice(0, 140)); });

  await page.goto(`${BASE_URL}/game`);
  await page.waitForFunction(() => Boolean(window.__idleVillageTestHooks?.expedition?.['poi-goblin']), undefined, { timeout: 45_000 });
  await page.waitForFunction(() => !document.querySelector('[data-testid="game-boot-screen"]'), undefined, { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(2500);

  // C1 — village view via real nav click
  await step('C1', async () => {
    await page.getByText('VILLAGE', { exact: false }).first().click();
    await page.waitForTimeout(1500);
    await shot(page, '20-C1-village-view');
    await page.getByText('MAP', { exact: false }).first().click();
    await page.waitForTimeout(1200);
  });

  // F5 — invasion shroud/card via hook seam
  await step('F5', async () => {
    await page.evaluate(() => window.__idleVillageTestHooks?.startInvasion?.());
    await shot(page, '21-F5-invasion-shroud');
    await page.waitForTimeout(2500);
    await shot(page, '21b-F5-invasion-card');
    await page.keyboard.press('Escape');
  });

  // B-family — real expedition: open detail, fill slots, send
  await step('B-plan', async () => {
    await page.evaluate((poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.openDetail?.(), POI);
    await page.waitForSelector('[data-testid="quest-expedition-detail"]', { timeout: 15_000 });
    // fill required slots through the real assign gate
    const filled = await page.evaluate((poi) => {
      const h = window.__idleVillageTestHooks?.expedition?.[poi];
      const village = h?.getVillage?.();
      const offer = h?.getResolvedOffer?.();
      const residents = village?.residents ?? [];
      const slots = offer?.slots ?? offer?.slotBlueprints ?? [];
      let n = 0;
      for (const s of slots) {
        const sid = s.blueprintId ?? s.id;
        for (const r of residents) {
          if (h?.assignToSlot?.(sid, r.id ?? r.residentId)) { n += 1; break; }
        }
      }
      return { filled: n, slots: slots.length, residents: residents.length };
    }, POI);
    console.log('  [B] slots filled:', JSON.stringify(filled));
    await shot(page, '22-B-planner-filled');
    await page.evaluate((poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.send?.(), POI);
    await page.waitForTimeout(2500);
    await shot(page, '23-B1-quest-run-cluster');
  });

  // B2 — skill check if the run surfaces one; else drive a beat
  await step('B-beats', async () => {
    for (let i = 0; i < 8; i += 1) {
      const opts = await page.evaluate((poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.getOptions?.() ?? [], POI);
      const hasCheck = await page.$('[data-testid*="skill-check"], [class*="skillCheck"], [class*="astrolabe"]');
      if (hasCheck) { await shot(page, '24-B2-skill-check'); break; }
      if (!opts.length) break;
      await page.evaluate(({ poi, opt }) => window.__idleVillageTestHooks?.expedition?.[poi]?.choose?.(opt, false), { poi: POI, opt: opts[0] });
      await page.waitForTimeout(1400);
      if (i === 1) await shot(page, '24b-B-mid-run');
    }
  });

  // B6/B7 — advance to settlement/verdict
  await step('B-end', async () => {
    await page.evaluate((poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.commitSettlement?.(), POI).catch(() => {});
    await page.waitForTimeout(1500);
    await shot(page, '25-B7-outcome-popup');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    await shot(page, '26-B6-verdict-or-aftermath');
  });

  // G — menus: try the bottom-right round buttons one at a time
  await step('G-menu', async () => {
    const btns = page.locator('button, [role="button"]');
    const n = await btns.count();
    for (let i = 0; i < Math.min(n, 60); i += 1) {
      const b = btns.nth(i);
      const box = await b.boundingBox().catch(() => null);
      if (box && box.y > VH - 80 && box.x > VW - 220) {
        await b.click();
        await page.waitForTimeout(700);
        const menu = await page.$('[role="dialog"], [data-testid*="menu"], [class*="menu"]');
        await shot(page, `30-G-menu-try${i}`);
        if (menu) break;
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    }
  });

  await browser.close();
};

main().catch((err) => { console.error(err); process.exit(1); });
