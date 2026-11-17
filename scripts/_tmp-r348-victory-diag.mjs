/* R-348 diagnostic witness — same drive as _tmp-r348-victory-live-witness.mjs,
 * then polls WHY the signed report did not mount. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const URL = process.argv[2] ?? 'http://localhost:5173/game?poiDemo=1';
const OUT = process.argv[3] ?? '.mw/runs/20261116-r348-victory-diag';
const POI = 'poi-goblin';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on('pageerror', (e) => console.log('PAGEERROR:', String(e).slice(0, 300)));
page.on('console', (m) => { const t = m.text(); if (/error|warn/i.test(t) && !/Download the React|DevTools/i.test(t)) console.log('CONSOLE:', t.slice(0, 200)); });
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForSelector('[data-map-ready]', { timeout: 300000 });
await page.waitForSelector('.game-boot-screen', { state: 'detached', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(2500);

const exp = (expr) =>
  page.evaluate(new Function('poi', `const e = window.__idleVillageTestHooks?.expedition?.[poi]; return (${expr});`), POI);

let navCount = 0;
page.on('framenavigated', (f) => { if (f === page.mainFrame()) { navCount += 1; console.log('NAVIGATION #' + navCount, f.url().slice(0, 80)); } });
await exp('e?.demoLaunch?.()');
await page.waitForFunction((poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.getRun?.() != null, POI, { timeout: 20000 });
console.log('run launched');

let lastNode = '', repeats = 0, terminal = null;
for (let i = 0; i < 140; i++) {
  const run = await page.evaluate((poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.getRun?.() ?? null, POI);
  if (!run) break;
  if (run.ended) { terminal = run; break; }
  if (run.frontier?.status === 'waiting') {
    const clock = await page.evaluate(() => window.__idleVillageTestHooks?.getClock?.() ?? { currentTick: 0 });
    const lead = Math.max(0, (run.frontier.readyAt ?? 0) - clock.currentTick);
    if (lead > 0) await page.evaluate((n) => window.__idleVillageTestHooks?.advanceTicks?.(n), lead + 1);
    const options = await page.evaluate((poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.getOptions?.() ?? [], POI);
    if (!options.length) break;
    repeats = run.nodeId === lastNode ? repeats + 1 : 0;
    lastNode = run.nodeId;
    await page.evaluate(([poi, opt]) => window.__idleVillageTestHooks?.expedition?.[poi]?.choose?.(opt), [POI, options[Math.min(repeats, options.length - 1)]]);
  } else {
    await page.evaluate((n) => window.__idleVillageTestHooks?.advanceTicks?.(n), 15);
    await page.waitForTimeout(120);
  }
}
console.log('terminal:', JSON.stringify({ ended: terminal?.ended, outcome: terminal?.outcome }));

for (let i = 0; i < 40; i++) {
  const beatsLeft = await page.evaluate(() => /beats left|battute rimaste/i.test(document.body.innerText));
  if (!beatsLeft) break;
  await page.keyboard.press('Space');
  await page.waitForTimeout(250);
}
await page.evaluate(() => {
  const els = [...document.querySelectorAll('[data-testid], button, [role="button"], div')];
  const t = els.find((e) => /click to dismiss|clicca per chiudere/i.test(e.textContent ?? '') && e.getBoundingClientRect().width < 500);
  (t ?? els.find((e) => /Recorded in the chronicle|Registrato nella cronaca/i.test(e.textContent ?? '')))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await page.waitForTimeout(500);
/* HMR/reload (T-13) can navigate the page mid-ceremony — re-arm on the map. */
await page.waitForSelector('[data-map-ready]', { timeout: 300000 }).catch(() => {});
await page.waitForSelector('.game-boot-screen', { state: 'detached', timeout: 90000 }).catch(() => {});
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/diag-before-escape.png` });
/* The report may already be mounted (window closed earlier) — Escape then
 * would dismiss it. Close the run window via its own report-close button
 * when needed, never via a blind Escape. */
const reportUp = await page.locator('[data-testid="hudreal-victory-reward"]').count();
if (reportUp) {
  console.log('report already mounted — no window close needed');
} else {
  const closeBtn = page.locator('[data-testid="quest-window-close-report"]');
  if (await closeBtn.count()) { await closeBtn.first().click(); }
  else { await page.keyboard.press('Escape'); }
}

/* Poll diagnostics for 20s — WHY is the report not mounted. */
for (let i = 0; i < 20; i++) {
  await page.waitForTimeout(1000);
  const d = await page.evaluate((poi) => {
    const e = window.__idleVillageTestHooks?.expedition?.[poi];
    const run = e?.getRun?.() ?? null;
    const testids = [...document.querySelectorAll('[data-testid]')].map((x) => x.getAttribute('data-testid'));
    const panels = [...document.querySelectorAll('[data-panel-id]')].map((x) => x.getAttribute('data-panel-id'));
    const stagePanels = [...document.querySelectorAll('.hud-panel, [class*="stage-panel"], [data-stage-panel]')].map((x) => x.className.slice(0, 60));
    return {
      run: run ? { ended: run.ended, outcome: run.outcome, settlement: run.settlement?.status ?? null } : null,
      popup: testids.filter((t) => /reward|report|victory|epilogue|outcome/i.test(t)),
      questWin: testids.filter((t) => /quest/i.test(t)).slice(0, 12),
      panels, stagePanels: stagePanels.slice(0, 8),
      bodyHasReportText: /EXPEDITION REPORT|REWARD EARNED|RAPPORTO/i.test(document.body.innerText),
    };
  }, POI);
  if (d.popup.length || i === 19 || i === 4) console.log(`t+${i + 1}s:`, JSON.stringify(d));
  if (d.popup.length) break;
}
/* Hurry the staged reveal to the CTA, then settle. */
for (let i = 0; i < 10; i++) { await page.keyboard.press('Space'); await page.waitForTimeout(350); }
await page.waitForTimeout(600);
const cta = await page.evaluate(() => [...document.querySelectorAll('[data-testid]')].map((x) => x.getAttribute('data-testid')).filter((t) => /collect|reward/i.test(t)));
console.log('cta:', JSON.stringify(cta));
await page.locator('[data-testid="hudreal-victory-reward"]').first().screenshot({ path: `${OUT}/diag-popup.png` }).catch((e) => console.log('popup shot fail', String(e).slice(0, 120)));
await page.screenshot({ path: `${OUT}/diag-final.png` });
await browser.close();
