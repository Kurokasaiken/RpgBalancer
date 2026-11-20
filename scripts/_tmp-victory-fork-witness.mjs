/**
 * _tmp-victory-fork-witness.mjs — PLAN-125 Fase 7d fork witness: drives a REAL
 * expedition on /game to `ended`, then captures the mounted
 * `hudreal-victory-reward` report for the `?victory=` variant in the URL.
 *
 * Drive model lifted from scripts/hud-real/_tmp-victory-ref.mjs (audit-harness
 * proven): `ev` retry wrapper survives vite reloads (context destroyed), the
 * boot veil + quest-window recovery handle the remount, beats/choices/verdicts
 * are DOM clicks (Enter/Space are swallowed while a button holds focus),
 * `advanceTicks(60)` is the heartbeat.
 *
 * End-of-run: click `quest-window-close-report` → `hudreal-victory-reward`
 * mounts (rewardVisible = ended && quest panel hidden) → click the report
 * shell to hurry the staged reveal until `quest-reward-collect` paints.
 *
 * Usage: node scripts/_tmp-victory-fork-witness.mjs <url> <outDir> [tag]
 * Headless only; swiftshader per the R-304 contract. T-13: shared dev server.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire('/Users/faustoboni/progetti_personali/RPG/package.json');
const { chromium } = require('playwright');

const URL_ARG = process.argv[2] ?? 'http://localhost:5173/game?poiDemo=1';
const OUT = process.argv[3] ?? '.mw/runs/victory-fork';
const TAG = process.argv[4] ?? 'run';
const POI = process.env.POI ?? 'poi-goblin';
const MAX_ATTEMPTS = Number(process.env.ATTEMPTS ?? 3);
const RUN_DEADLINE_MS = Number(process.env.DEADLINE_MS ?? 600_000);

fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(`[vfork:${TAG}]`, ...a);

const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

const waitHook = () =>
  page.waitForFunction((pid) => Boolean(window.__idleVillageTestHooks?.expedition?.[pid]), POI, { timeout: 90_000 });
const waitReady = () =>
  page
    .waitForFunction(
      (pid) =>
        !document.querySelector('[data-testid="game-boot-screen"]') &&
        document.querySelector('[data-testid="game-mappa2"]')?.hasAttribute('data-map-ready') &&
        Boolean(window.__idleVillageTestHooks?.expedition?.[pid]),
      POI,
      { timeout: 90_000 },
    )
    .catch(() => log('waitReady timeout — continuing anyway'));

await page.goto(URL_ARG, { waitUntil: 'domcontentloaded', timeout: 90_000 });
await waitHook();
await waitReady();
log(`hook up for ${POI}`);

const ev = async (fn, arg, retries = 12) => {
  for (let i = 0; ; i++) {
    try {
      return await page.evaluate(fn, arg);
    } catch (e) {
      if (i >= retries || !/Execution context|navigation|Target closed|detached|Cannot read prop/i.test(String(e))) throw e;
      log('context lost — re-waiting ready');
      await waitReady().catch(() => {});
      await page.waitForTimeout(800);
    }
  }
};
const getRun = () =>
  ev((pid) => {
    const r = window.__idleVillageTestHooks.expedition[pid].getRun();
    return r && {
      nodeId: r.nodeId, ended: r.ended, outcome: r.outcome,
      frontierStatus: r.frontier?.status, combatTurn: r.combatTurn, goblinLeft: r.goblinLeft,
      party: r.party.map((m) => ({ name: m.name, dead: !!m.dead, wounded: !!m.wounded })),
    };
  }, POI);
const getClock = () => ev(() => window.__idleVillageTestHooks.getClock?.() ?? null);
const vis = (sel) => page.locator(sel).first().isVisible().catch(() => false);
const clickIf = async (sel, opts = {}) => {
  const l = page.locator(sel).first();
  if (await l.isVisible().catch(() => false)) { await l.click(opts).catch(() => {}); return true; }
  return false;
};
const shot = (name) => page.screenshot({ path: path.join(OUT, name), timeout: 15_000 }).catch((e) => log('shot fail', name, String(e).slice(0, 80)));

let captured = null;
for (let attempt = 1; attempt <= MAX_ATTEMPTS && !captured; attempt++) {
  const existing = await getRun();
  if (existing && !existing.ended) {
    log(`attempt ${attempt}: resuming live run @ ${existing.nodeId} (${existing.frontierStatus})`);
  } else {
    log(`attempt ${attempt}: demoLaunch`);
    await ev((pid) => window.__idleVillageTestHooks.expedition[pid].demoLaunch(), POI);
  }
  let launched = await page.getByTestId('quest-window').waitFor({ state: 'visible', timeout: 45_000 }).then(() => true).catch(() => false);
  if (!launched) {
    log('no quest-window after launch — trying director reopen');
    await clickIf('[data-testid="hud-director-trigger"]');
    await page.getByTestId('director-panel').waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
    await clickIf('[data-action-id="questRun"]');
    launched = await page.getByTestId('quest-window').waitFor({ state: 'visible', timeout: 15_000 }).then(() => true).catch(() => false);
  }
  if (!launched) { log('still no quest-window;', JSON.stringify(await getRun())); break; }

  const deadline = Date.now() + RUN_DEADLINE_MS;
  let ended = null, lastLog = 0, lastSig = '', stuckSince = Date.now(), lastTick = 0;
  while (Date.now() < deadline) {
    const run = await getRun();
    if (!run) break;
    if (run.ended) { ended = run; break; }
    const sig = `${run.nodeId}|${run.frontierStatus}|${run.combatTurn}|${run.goblinLeft}`;
    if (sig !== lastSig) { lastSig = sig; stuckSince = Date.now(); log('→', sig); }
    if (Date.now() - lastLog > 20000) {
      lastLog = Date.now();
      log('state:', JSON.stringify({ node: run.nodeId, f: run.frontierStatus, tick: (await getClock())?.currentTick, turn: run.combatTurn, foes: run.goblinLeft }));
    }
    if (Date.now() - stuckSince > 60_000) {
      stuckSince = Date.now();
      const winText = await ev(() => document.querySelector('[data-testid="quest-window"]')?.innerText?.slice(0, 300) ?? null);
      log('STUCK — window text:', JSON.stringify(winText));
      await shot(`${TAG}-stuck-attempt${attempt}.png`);
    }
    if (await ev(() => Boolean(document.querySelector('[data-testid="game-boot-screen"]')))) {
      await waitReady();
      continue;
    }
    if (!(await vis('[data-testid="quest-window"]'))) {
      if (await vis('[data-testid="quest-window-minimised"]')) {
        await clickIf('[data-testid="quest-window-minimised"]');
      } else {
        await clickIf('[data-testid="quest-outcome-toast"]');
        if (await clickIf('[data-testid="hud-director-trigger"]')) {
          await page.getByTestId('director-panel').waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
          if (await clickIf('[data-action-id="questRun"]')) {
            await page.getByTestId('quest-window').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
          }
        }
      }
      await page.waitForTimeout(400);
      continue;
    }
    if (await vis('[data-testid="quest-check-column"], [data-testid="quest-check-overlay"]')) {
      const verdict = page.locator('[data-testid="quest-verdict-card"]').first();
      if (await verdict.isVisible().catch(() => false)) {
        await verdict.click({ position: { x: 20, y: 10 } }).catch(() => {});
        await page.waitForTimeout(600);
        continue;
      }
      const tira = page.locator('.da-tira').first();
      if (await tira.isVisible().catch(() => false)) {
        await tira.click().catch(async () => { await tira.click({ force: true }).catch(() => {}); });
        await page.waitForFunction(() => document.querySelector('[data-testid="quest-verdict-card"]'), null, { timeout: 25_000 }).catch(() => {});
        await page.waitForTimeout(400);
        continue;
      }
      await page.waitForTimeout(500);
      continue;
    }
    if (await vis('[data-testid="quest-window-beat"]')) {
      await page.locator('[data-testid="quest-window-beat"]').first().click().catch(() => {});
      await page.waitForTimeout(350);
      continue;
    }
    if (run.frontierStatus === 'waiting') {
      const choices = page.locator('[data-testid="quest-window-choice"]:not([disabled])');
      const n = await choices.count();
      if (n > 0) {
        const pick = choices.nth((attempt - 1) % n);
        const optId = await pick.getAttribute('data-option-id');
        log('choice @', run.nodeId, '→', optId);
        const before = `${run.nodeId}|${run.combatTurn}|${run.frontierStatus}`;
        const moved = async () => {
          const r = await getRun();
          return r && `${r.nodeId}|${r.combatTurn}|${r.frontierStatus}` !== before;
        };
        await pick.click().catch(() => {});
        for (let i = 0; i < 6 && !(await moved()); i++) await page.waitForTimeout(350);
        if (!(await moved()) && optId) {
          log('  forcing hook choose(', optId, ')');
          await ev(([pid, oid]) => window.__idleVillageTestHooks.expedition[pid].choose(oid), [POI, optId]);
          for (let i = 0; i < 4 && !(await moved()); i++) await page.waitForTimeout(350);
        }
        continue;
      }
    }
    const clk = await getClock();
    const now = clk?.currentTick ?? 0;
    if (lastTick > 0 && now < lastTick) log(`clock snap-back ${lastTick}→${now}`);
    lastTick = now;
    await ev(() => window.__idleVillageTestHooks.advanceTicks?.(60));
    await page.waitForTimeout(120);
  }

  if (!ended) { log('run deadline hit'); await shot(`${TAG}-deadline-attempt${attempt}.png`); break; }
  log(`run ended: ${ended.outcome} | party: ${JSON.stringify(ended.party)}`);

  /* The staged beat reveal keeps playing inside the run window
   *  (`rewardVisible` gates on !questPresenting) — click every beat through,
   *  then close via the window's own close-report. */
  for (let i = 0; i < 30; i++) {
    if (await vis('[data-testid="quest-window-close-report"]')) break;
    if (await vis('[data-testid="quest-window-beat"]')) {
      await page.locator('[data-testid="quest-window-beat"]').first().click().catch(() => {});
    } else {
      await page.locator('[data-testid="quest-window"]').first().click({ position: { x: 10, y: 10 } }).catch(() => {});
    }
    await page.waitForTimeout(350);
  }
  await clickIf('[data-testid="quest-outcome-toast"]');
  await page.waitForTimeout(300);
  await clickIf('[data-testid="quest-window-close-report"]');
  await page.waitForTimeout(800);

  const popup = page.locator('[data-testid="hudreal-victory-reward"]').first();
  const popupUp = await popup.waitFor({ state: 'visible', timeout: 15_000 }).then(() => true).catch(() => false);
  log('hudreal-victory-reward visible:', popupUp,
    '| variant:', await ev(() => document.querySelector('[data-testid="hudreal-victory-reward"]')?.getAttribute('data-victory-variant')));

  if (popupUp) {
    /* hurry the staged reveal — a click on the report shell advances. */
    for (let i = 0; i < 16; i++) {
      if (await vis('[data-testid="quest-reward-collect"]')) break;
      await popup.click({ position: { x: 40, y: 40 } }).catch(() => {});
      await page.waitForTimeout(350);
    }
    await page.getByTestId('quest-reward-collect').waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
    /* Park the mouse on the bare veil so no crew tooltip is open in the shot
     *  (the last DOM click leaves it wherever the close-report button was). */
    await page.mouse.move(30, 870);
    await page.waitForTimeout(500);

    await shot(`${TAG}-full.png`);
    await popup.screenshot({ path: path.join(OUT, `${TAG}-popup.png`) }).catch(() => {});
    const dump = await popup.innerText().catch(() => '');
    fs.writeFileSync(path.join(OUT, `${TAG}-text.txt`), dump);
    fs.writeFileSync(path.join(OUT, `${TAG}-meta.json`),
      JSON.stringify({ outcome: ended.outcome, attempt, party: ended.party, popupText: dump, consoleErrors: errors }, null, 2));
    log(`captured ${TAG}`);
    /* Any outcome mounts the same report surface — for a visual fork the
     *  witness is valid on wipe too (it exercises more zones: fallen crew). */
    captured = TAG;
  } else {
    log('no report — capturing end-state page');
    await shot(`${TAG}-nopopup-attempt${attempt}.png`);
    const ids = await ev(() => [...document.querySelectorAll('[data-testid]')].map((e) => e.getAttribute('data-testid')).filter(Boolean).slice(0, 60));
    log('testids on screen:', JSON.stringify(ids));
  }

  if (!captured) {
    await clickIf('[data-testid="quest-reward-collect"]');
    await page.waitForTimeout(800);
    await ev((pid) => window.__idleVillageTestHooks.expedition[pid].commitSettlement?.(), POI);
    await page.waitForTimeout(800);
  }
}

await browser.close();
log(`done. captured: ${captured ?? 'none'} | console errors: ${errors.length}`);
if (errors.length) console.log(errors.slice(0, 8).join('\n'));
process.exit(captured ? 0 : 2);
