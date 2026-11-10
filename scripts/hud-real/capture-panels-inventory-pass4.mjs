#!/usr/bin/env node
/**
 * pass4 — PLAN-113 F0: drive the real expedition to a quest run.
 * openDetail → getAssignments() blueprint ids → checkEligibility+assignToSlot
 * → send → choose() beats → verdict. Real gates only.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'test-results/plan113-inventory');
const BASE_URL = process.argv[2] ?? 'http://localhost:5173';
const POI = 'poi-goblin';
const shot = async (p, n) => { await p.waitForTimeout(1100); await p.screenshot({ path: join(OUT, `${n}.png`) }); console.log(n); };

const main = async () => {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text().slice(0, 140)); });
  await page.goto(`${BASE_URL}/gameOld`);
  await page.waitForFunction((poi) => Boolean(window.__idleVillageTestHooks?.expedition?.[poi]), POI, { timeout: 45_000 });
  await page.waitForFunction(() => !document.querySelector('[data-testid="game-boot-screen"]'), undefined, { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(2500);

  await page.evaluate((poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.openDetail?.(), POI);
  await page.waitForSelector('[data-testid="quest-expedition-detail"]', { timeout: 15_000 });
  await page.waitForTimeout(1500);

  const fill = await page.evaluate((poi) => {
    const e = window.__idleVillageTestHooks?.expedition?.[poi];
    const assignments = e?.getAssignments?.() ?? {};
    const residents = (e?.getVillage?.()?.residents ?? []).map((r) => r.id);
    const bids = Object.keys(assignments);
    const log = [];
    for (const bid of bids) {
      for (const rid of residents) {
        if (e?.checkEligibility?.(bid, rid)?.eligible && e?.assignToSlot?.(bid, rid)) {
          log.push(`${bid}<-${rid}`); break;
        }
      }
    }
    return { bids, residents, log };
  }, POI);
  console.log('fill:', JSON.stringify(fill));
  await page.waitForTimeout(800);
  await shot(page, '40-B-planner-assigned');

  await page.evaluate((poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.send?.(), POI);
  await page.waitForTimeout(3000);
  const phase = await page.evaluate((poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.getRun?.()?.phase ?? null, POI);
  console.log('run phase after send:', phase);
  await shot(page, '41-B1-run-window');

  if (phase) {
    for (let i = 0; i < 14; i += 1) {
      const st = await page.evaluate((poi) => {
        const e = window.__idleVillageTestHooks?.expedition?.[poi];
        return { opts: e?.getOptions?.() ?? [], phase: e?.getRun?.()?.phase ?? null };
      }, POI);
      const check = await page.$('[class*="strolabe"], [data-testid*="skill"], canvas');
      if (check && st.phase && String(st.phase).includes('check')) { await shot(page, '42-B2-skill-check'); break; }
      if (!st.phase || !st.opts.length) { console.log('beat', i, 'phase', st.phase, 'opts', st.opts.length); break; }
      await page.evaluate(({ poi, opt }) => window.__idleVillageTestHooks?.expedition?.[poi]?.choose?.(opt, false), { poi: POI, opt: st.opts[0] });
      await page.waitForTimeout(1600);
      if (i === 1) await shot(page, '42b-B-mid-run');
      if (i === 4) await shot(page, '42c-B-late-run');
    }
    await shot(page, '43-B-run-final');
    await page.evaluate((poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.commitSettlement?.(), POI).catch(() => {});
    await page.waitForTimeout(1800);
    await shot(page, '44-B-verdict-settlement');
  }
  await browser.close();
};
main().catch((e) => { console.error(e); process.exit(1); });
