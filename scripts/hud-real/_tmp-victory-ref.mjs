/**
 * _tmp-victory-ref.mjs — R-348 reference capture: the STOCK victory/reward
 * surface on /game (`QuestRewardPopup`).
 *
 * Drive model (audit-harness proven): beats → click `quest-window-beat`
 * (Enter is swallowed while a button holds focus), choices →
 * `quest-window-choice` (hook `choose` fallback), checks/combat turns →
 * `.da-tira` roll (arms ~4 s after the column mounts — the board is NOT
 * the trigger) + `quest-verdict-card` dismiss; `advanceTicks(3)` is a
 * heartbeat — the page syncClocks the run on every `currentTick` change.
 *
 * End-of-run: the report mounts when `run.ended && !panels.visible.quest`
 * — we click the window's own `quest-window-close-report`, then hurry the
 * staged reveal until `quest-reward-collect` paints the full report.
 *
 * Output: test-results/victory-reference-*.png + text/meta dumps.
 * Headless only; swiftshader per the R-304 contract.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire('/Users/faustoboni/progetti_personali/RPG/package.json');
const { chromium } = require('playwright');

const BASE = process.env.HARNESS_URL ?? 'http://localhost:5173';
const POI = process.env.POI ?? 'poi-goblin';
const OUT = new URL('../../test-results/', import.meta.url).pathname;
const MAX_ATTEMPTS = Number(process.env.ATTEMPTS ?? 4);
const RUN_DEADLINE_MS = Number(process.env.DEADLINE_MS ?? 900_000);

const log = (...a) => console.log('[vref]', ...a);

const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

const waitHook = () =>
  page.waitForFunction((pid) => Boolean(window.__idleVillageTestHooks?.expedition?.[pid]), POI, { timeout: 90_000 });
/* The run/session DOM sits UNDER the boot veil — elements read "visible"
 *  while the app is still rebooting after a vite reload. Gate interaction
 *  on `veilGone` (no game-boot-screen) + `data-map-ready`. */
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

await page.goto(`${BASE}/game?poiDemo=1`);
await waitHook();
await waitReady();
log(`hook up for ${POI}`);

/* T-13: shared dev server — a vite reload destroys the context mid-probe.
 *  `ev` re-waits the hook and retries. */
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
      frontierStatus: r.frontier?.status, readyAt: r.frontier?.readyAt, combatTurn: r.combatTurn, goblinLeft: r.goblinLeft,
      party: r.party.map((m) => ({ id: m.id, name: m.name, hp: m.hp, maxHp: m.maxHp, dead: !!m.dead, wounded: !!m.wounded })),
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
const branchCount = {};
const hit = (b) => { branchCount[b] = (branchCount[b] ?? 0) + 1; };

let captured = null;
for (let attempt = 1; attempt <= MAX_ATTEMPTS && !captured; attempt++) {
  /* Resume > relaunch: the run persists in the store across reloads — a
   *  live frontier restored at `gob-esplora-extra` is minutes of saved
   *  march. demoLaunch only fires when nothing live exists. */
  const existing = await getRun();
  if (existing && !existing.ended) {
    log(`attempt ${attempt}: resuming live run @ ${existing.nodeId} (${existing.frontierStatus})`);
  } else {
    log(`attempt ${attempt}: demoLaunch`);
    await ev((pid) => window.__idleVillageTestHooks.expedition[pid].demoLaunch(), POI);
  }
  let launched = await page.getByTestId('quest-window').waitFor({ state: 'visible', timeout: 45_000 }).then(() => true).catch(() => false);
  if (!launched) {
    /* run may exist headless (panels.visible.quest reset by a reload) —
     *  reopen through the Director panel's questRun row once, then let the
     *  drive loop's step-0 keep it alive. */
    log('no quest-window after launch — trying director reopen');
    await clickIf('[data-testid="hud-director-trigger"]');
    await page.getByTestId('director-panel').waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
    await clickIf('[data-action-id="questRun"]');
    launched = await page.getByTestId('quest-window').waitFor({ state: 'visible', timeout: 15_000 }).then(() => true).catch(() => false);
  }
  if (!launched) { console.log('still no quest-window;', JSON.stringify(await getRun())); break; }

  const deadline = Date.now() + RUN_DEADLINE_MS;
  let ended = null, lastLog = 0, lastNode = '', stuckSince = Date.now(), lastTick = 0;
  while (Date.now() < deadline) {
    const run = await getRun();
    if (!run) break;
    if (run.ended) { ended = run; break; }
    /* stuck watchdog resets on ANY meaningful frontier movement — combat
     *  turns and pending marches keep nodeId constant for minutes. */
    const sig = `${run.nodeId}|${run.frontierStatus}|${run.combatTurn}|${run.goblinLeft}`;
    if (sig !== lastNode) { lastNode = sig; stuckSince = Date.now(); log('→', sig); }
    if (Date.now() - lastLog > 20000) {
      lastLog = Date.now();
      log('state:', JSON.stringify({ node: run.nodeId, f: run.frontierStatus, tick: (await getClock())?.currentTick, readyAt: run.readyAt, turn: run.combatTurn, foes: run.goblinLeft }));
    }

    /* stuck watchdog first — never shadowed by the continue branches. */
    if (Date.now() - stuckSince > 60_000) {
      stuckSince = Date.now();
      const diag = await ev(() => ({
        ids: [...document.querySelectorAll('[data-testid]')].map((e) => e.getAttribute('data-testid')).filter(Boolean),
        winText: document.querySelector('[data-testid="quest-window"]')?.innerText?.slice(0, 400) ?? null,
      }));
      log('STUCK — branches:', JSON.stringify(branchCount), '| testids:', JSON.stringify(diag?.ids ?? []));
      log('window text:', JSON.stringify(diag?.winText ?? ''));
      await shot(`victory-reference-stuck-attempt${attempt}.png`);
    }

    /* -1. boot veil (vite reload from the parallel session): the DOM is
     *     mounted under the veil but nothing is live — wait it out. */
    if (await ev(() => Boolean(document.querySelector('[data-testid="game-boot-screen"]')))) {
      hit('boot-veil');
      await waitReady();
      continue;
    }

    /* 0. window recovery — `panels.visible.quest` is React state: an
     *    external reset (vite reload from the parallel session) unmounts the
     *    window while the run lives on in the store. Reopen through the
     *    Director panel's questRun row (real `openRunWindow` path). */
    if (!(await vis('[data-testid="quest-window"]'))) {
      hit('recover');
      if (await vis('[data-testid="quest-window-minimised"]')) {
        await clickIf('[data-testid="quest-window-minimised"]');
      } else {
        /* a settled outcome toast can sit over the trigger — dismiss it. */
        await clickIf('[data-testid="quest-outcome-toast"]');
        if (await clickIf('[data-testid="hud-director-trigger"]')) {
          await page.getByTestId('director-panel').waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
          if (await clickIf('[data-action-id="questRun"]')) {
            await page.getByTestId('quest-window').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
          }
          /* leave the director panel as found — harmless if it stays open. */
        }
      }
      await page.waitForTimeout(400);
      continue;
    }

    /* 1. check flow (skill checks AND combat turns) — proven audit-harness
     *    sequence: the ROLL TRIGGER is `.da-tira` (arms ~4 s after the column
     *    mounts — the board itself is NOT clickable), then dismiss the
     *    verdict card at a corner offset. Clicking the board was the
     *    march-phase stall: no gesture registered, no verdict ever came. */
    if (await vis('[data-testid="quest-check-column"], [data-testid="quest-check-overlay"]')) {
      const verdict = page.locator('[data-testid="quest-verdict-card"]').first();
      if (await verdict.isVisible().catch(() => false)) {
        hit('verdict');
        await verdict.click({ position: { x: 20, y: 10 } }).catch(() => {});
        await page.waitForTimeout(600);
        continue;
      }
      const tira = page.locator('.da-tira').first();
      if (await tira.isVisible().catch(() => false)) {
        hit('roll');
        await tira.click().catch(async () => { await tira.click({ force: true }).catch(() => {}); });
        /* the throw resolves into a verdict card — wait, then loop back so
         *  the verdict branch above dismisses it. */
        await page
          .waitForFunction(() => document.querySelector('[data-testid="quest-verdict-card"]'), null, { timeout: 25_000 })
          .catch(() => {});
        await page.waitForTimeout(400);
        continue;
      }
      /* column mounted but throw not armed yet (~4 s intro). */
      hit('check-arming');
      await page.waitForTimeout(500);
      continue;
    }

    /* 2. theatre beat — click the beat itself (`onAdvance`): pressing Enter
     *  does NOT work while focus sits on a button — the window's key handler
     *  returns early for `target.closest('button, a[href]')`, and the last
     *  clicked choice keeps focus. */
    if (await vis('[data-testid="quest-window-beat"]')) {
      hit('beat');
      await page.locator('[data-testid="quest-window-beat"]').first().click().catch(() => {});
      await page.waitForTimeout(350);
      continue;
    }

    /* 3. waiting frontier with enabled choices — click one; on a covered /
     *    dead click fall back to the hook (`choose` is the same api the
     *    window buttons call). Otherwise heartbeat `advanceTicks(3)` — the
     *    page's useEffect syncClocks the run on every currentTick change,
     *    which matures pending marches and unlocks timed frontiers. A vite
     *    reload snaps the store clock back to the last autosave, so the
     *    heartbeat must keep firing (and we log snap-backs for the report). */
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
        hit('choice');
        continue;
      }
      hit('wait-no-choice');
    }

    /* 4. clock heartbeat — small deltas every iteration (proven harness
     *    cadence); reload-resilient because it re-fires forever. */
    const clk = await getClock();
    const now = clk?.currentTick ?? 0;
    if (lastTick > 0 && now < lastTick) { hit('clock-snap'); log(`clock snap-back ${lastTick}→${now} (vite reload / autosave restore)`); }
    lastTick = now;
    hit('heartbeat');
    /* 60/iteration: the journey's catch-up path handles the jump; a full
     *  7-phase run needs ~300 ticks and a small heartbeat blew the first
     *  deadline mid-combat. Pending marches mature in 1–2 iterations. */
    await ev(() => window.__idleVillageTestHooks.advanceTicks?.(60));
    await page.waitForTimeout(120);
  }

  if (!ended) { log('run deadline hit'); await shot(`victory-reference-deadline-attempt${attempt}.png`); break; }
  log(`run ended: ${ended.outcome} | party: ${JSON.stringify(ended.party)}`);

  /* Close the window via its own close-report — mounts the floating report
   *  plaque (rewardVisible = ended && quest panel hidden). */
  await clickIf('[data-testid="quest-window-close-report"]');
  await page.waitForTimeout(800);
  const popupUp = await page.getByTestId('quest-reward-popup').waitFor({ state: 'visible', timeout: 15_000 }).then(() => true).catch(() => false);

  if (popupUp) {
    for (let i = 0; i < 16; i++) {
      if (await vis('[data-testid="quest-reward-collect"]')) break;
      await page.locator('[data-reward-body]').click().catch(() => {});
      await page.waitForTimeout(350);
    }
    await page.getByTestId('quest-reward-collect').waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(400);

    const tag = `${ended.outcome}-attempt${attempt}`;
    await shot(`victory-reference-${tag}-page.png`);
    const el = page.locator('[data-testid="quest-reward-popup"]');
    await el.screenshot({ path: path.join(OUT, `victory-reference-${tag}-popup.png`) }).catch(() => {});
    const dump = await el.innerText().catch(() => '');
    fs.writeFileSync(path.join(OUT, `victory-reference-${tag}-text.txt`), dump);
    fs.writeFileSync(path.join(OUT, `victory-reference-${tag}-meta.json`),
      JSON.stringify({ outcome: ended.outcome, attempt, party: ended.party, popupText: dump, consoleErrors: errors }, null, 2));
    log(`captured ${tag}`);
    if (ended.outcome === 'reward' || ended.outcome === 'survived') captured = tag;
  } else {
    log('no reward popup — capturing end-state page');
    await shot(`victory-reference-${ended.outcome}-attempt${attempt}-page.png`);
    const lostSurface = await ev(() => [...document.querySelectorAll('[data-testid]')].map((e) => e.getAttribute('data-testid')).filter((x) => /lost|reward/i.test(x ?? '')));
    log('lost/reward testids on screen:', JSON.stringify(lostSurface));
  }

  if (!captured) {
    /* settle the ended run so the next demoLaunch can fire */
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
