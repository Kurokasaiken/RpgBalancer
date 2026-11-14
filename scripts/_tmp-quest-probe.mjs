/* Temporary R-325 quest-system probe — same boot-wait discipline as
 * r325GameProbe.mjs: dev server :5173, WebGL via swiftshader. */
import { chromium } from 'playwright';

const URL = process.argv[2] ?? 'http://localhost:5173/game';
const W = 'test-results/r325-game-restore';
const results = [];
const check = (name, pass, extra = '') => {
  results.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`);
};

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on('pageerror', (e) => console.log('PAGEERROR:', String(e).slice(0, 300)));
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE:', m.text().slice(0, 200)); });
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('[data-map-ready]', { timeout: 300000 });
console.log('map ready');
await page.waitForSelector('.game-boot-screen', { state: 'detached', timeout: 60000 }).catch(() => {});

const hooks = () => page.evaluate(() => Object.keys((window.__idleVillageTestHooks ?? {}).expedition ?? {}));
console.log('expedition hooks:', await hooks());

/* 1 — auto-reveal: the stagger mounts the authored POIs after the veil. */
await page.waitForSelector('[data-map-quest-poi-target]', { timeout: 30000 }).catch(() => null);
let n = await page.locator('[data-map-quest-poi-target]').count();
check('quest-poi-markers', n >= 1, `${n} markers`);

/* 2 — marker click opens the real expedition planner (roster auto-opens). */
const marker = page.locator('[data-map-quest-poi-target]').first();
if (await marker.count()) {
  /* The marker's entrance animation keeps Playwright's actionability waiting;
   *  dispatch the DOM click directly — same `handlePoiClick` path. */
  await page.waitForTimeout(800);
  await page.evaluate(() => document.querySelector('[data-map-quest-poi-target]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForSelector('[data-testid="quest-expedition-detail"]', { timeout: 10000 }).catch(() => null);
}
const detailOpen = (await page.locator('[data-testid="quest-expedition-detail"]').count()) > 0;
check('quest-detail-opens', detailOpen);
const rosterAuto = await page.evaluate(() => !!document.querySelector('[data-panel="roster"]'));
check('roster-auto-opens', rosterAuto);
await page.screenshot({ path: `${W}/w-quest-detail.png` });

/* 3 — Director «questRun» stages a canonical one-click expedition. */
await page.keyboard.press('Escape'); // close the planner first
await page.waitForTimeout(400);
await page.click('[data-testid="hud-director-trigger"]', { timeout: 8000 });
await page.waitForTimeout(600);
const runBtn = page.locator('[data-testid="director-panel"] [data-action-id="questRun"]');
console.log('questRun button:', await runBtn.count());
if (await runBtn.count()) await runBtn.click().catch((e) => console.log('click err', e.message));
/* demoLaunch: detail opens → slots auto-fill one per render → send → window. */
const t0 = Date.now();
let runWindow = false;
while (Date.now() - t0 < 15000) {
  runWindow = await page.evaluate(() => !!document.querySelector('[data-hud-panel="quest"]'));
  if (runWindow) break;
  await page.waitForTimeout(500);
}
if (!runWindow) {
  const diag = await page.evaluate(() => ({
    detail: !!document.querySelector('[data-testid="quest-expedition-detail"]'),
    assignments: window.__idleVillageTestHooks?.getSlotAssignments?.('poi-goblin') ?? window.__idleVillageTestHooks?.expedition?.['poi-goblin'] ? 'hooked' : null,
    questState: (() => { try { return window.__idleVillageTestHooks?.getQuestState?.(); } catch { return null; } })(),
  }));
  console.log('diag:', JSON.stringify(diag).slice(0, 500));
}
check('quest-run-window', runWindow);
const hooks2 = await page.evaluate(() => Object.keys(window.__idleVillageTestHooks ?? {}));
console.log('hooks:', hooks2.join(','));
await page.screenshot({ path: `${W}/w-quest-run.png` });

console.log('---');
const failed = results.filter((r) => !r.pass);
console.log(failed.length === 0 ? 'quest probe: all checks passed' : `quest probe: ${failed.length} FAILURES`);
await browser.close();
process.exit(failed.length ? 1 : 0);
