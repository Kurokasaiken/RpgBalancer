#!/usr/bin/env node
/**
 * pass5 — PLAN-113 F0: quest run window → beats → verdict.
 * demoLaunch → poll getRun → choose() beats → captures → commitSettlement.
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

  await page.evaluate((poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.demoLaunch?.(), POI);
  for (let i = 0; i < 15; i += 1) {
    await page.waitForTimeout(4000);
    const on = await page.evaluate((poi) => Boolean(window.__idleVillageTestHooks?.expedition?.[poi]?.getRun?.()), POI);
    if (on) break;
    if (i === 5) await page.evaluate((poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.demoLaunch?.(), POI);
  }
  await page.waitForTimeout(2500);
  await shot(page, '50-B1-quest-run-cluster');

  const runShape = await page.evaluate((poi) => {
    const r = window.__idleVillageTestHooks?.expedition?.[poi]?.getRun?.();
    return r ? { keys: Object.keys(r), phase: r.phase ?? r.stage ?? null, status: r.status ?? null } : null;
  }, POI);
  console.log('run shape:', JSON.stringify(runShape));

  for (let i = 0; i < 16; i += 1) {
    const st = await page.evaluate((poi) => {
      const e = window.__idleVillageTestHooks?.expedition?.[poi];
      const r = e?.getRun?.();
      return { opts: e?.getOptions?.() ?? [], phase: r?.phase ?? r?.stage ?? r?.status ?? null, run: Boolean(r) };
    }, POI);
    const astro = await page.$('[class*="strolabe"], [class*="Astrolabe"], [data-testid*="skill-check"]');
    if (astro) { await shot(page, '51-B2-skill-check'); }
    if (!st.run || (!st.opts.length && i > 2)) { console.log('end at beat', i, JSON.stringify(st)); break; }
    if (st.opts.length) {
      await page.evaluate(({ poi, opt }) => window.__idleVillageTestHooks?.expedition?.[poi]?.choose?.(opt, false), { poi: POI, opt: st.opts[0] });
      await page.waitForTimeout(1700);
      if (i === 1) await shot(page, '52-B-beat2');
      if (i === 3) await shot(page, '53-B-beat4');
      if (i === 6) await shot(page, '54-B-beat7');
    } else {
      await page.evaluate(() => window.__idleVillageTestHooks?.advanceTicks?.(20)).catch(() => {});
      await page.waitForTimeout(1200);
    }
  }
  await shot(page, '55-B-pre-verdict');
  await page.evaluate((poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.commitSettlement?.(), POI).catch(() => {});
  await page.waitForTimeout(1800);
  await shot(page, '56-B-verdict-popup');
  await page.waitForTimeout(1200);
  await shot(page, '57-B-aftermath');
  await browser.close();
};
main().catch((e) => { console.error(e); process.exit(1); });
