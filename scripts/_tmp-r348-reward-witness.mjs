/* R-348 witness — stock QuestRewardPopup on /game, driven through the REAL
 * run lifecycle: demoLaunch → canonical-clock drive to `ended` → screenshot.
 * Headless + swiftshader, no foreground (CTR-foreground-001). */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const URL = process.argv[2] ?? 'http://localhost:5173/game?poiDemo=1';
const OUT = process.argv[3] ?? '.mw/runs/20261115-r348-victory-mockup';
const POI = 'poi-goblin';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on('pageerror', (e) => console.log('PAGEERROR:', String(e).slice(0, 300)));
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForSelector('[data-map-ready]', { timeout: 300000 });
await page.waitForSelector('.game-boot-screen', { state: 'detached', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(2500);

const exp = (expr) =>
  page.evaluate(
    // eslint-disable-next-line no-new-func
    new Function('poi', `const e = window.__idleVillageTestHooks?.expedition?.[poi]; return (${expr});`),
    POI,
  );

/* Launch the canonical expedition (fills slots, sends, opens run window). */
await exp('e?.demoLaunch?.()');
await page.waitForFunction(
  (poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.getRun?.() != null,
  POI,
  { timeout: 20000 },
);
console.log('run launched');

/* Drive to terminal: choose on waiting frontiers, advanceTicks on pending. */
let lastNode = '';
let repeats = 0;
let terminal = null;
for (let i = 0; i < 140; i++) {
  const run = await page.evaluate(
    (poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.getRun?.() ?? null,
    POI,
  );
  if (!run) break;
  if (run.ended) { terminal = run; break; }
  if (run.frontier?.status === 'waiting') {
    const clock = await page.evaluate(() => window.__idleVillageTestHooks?.getClock?.() ?? { currentTick: 0 });
    const lead = Math.max(0, (run.frontier.readyAt ?? 0) - clock.currentTick);
    if (lead > 0) await page.evaluate((n) => window.__idleVillageTestHooks?.advanceTicks?.(n), lead + 1);
    const options = await page.evaluate(
      (poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.getOptions?.() ?? [],
      POI,
    );
    if (!options.length) break;
    repeats = run.nodeId === lastNode ? repeats + 1 : 0;
    lastNode = run.nodeId;
    await page.evaluate(
      ([poi, opt]) => window.__idleVillageTestHooks?.expedition?.[poi]?.choose?.(opt),
      [POI, options[Math.min(repeats, options.length - 1)]],
    );
  } else {
    await page.evaluate((n) => window.__idleVillageTestHooks?.advanceTicks?.(n), 15);
    await page.waitForTimeout(120);
  }
}
console.log('terminal:', JSON.stringify({ ended: terminal?.ended, outcome: terminal?.outcome }));

/* The run window still plays the staged beat reveal («N beats left — click or
 * press a key»): `rewardVisible` is gated on `!questPresenting`, so skip every
 * beat first, then dismiss the outcome toast and close the window. */
for (let i = 0; i < 40; i++) {
  const beatsLeft = await page.evaluate(() => /beats left|battute rimaste/i.test(document.body.innerText));
  if (!beatsLeft) break;
  await page.keyboard.press('Space');
  await page.waitForTimeout(250);
}
/* Outcome overlay («DEFEAT»/«reward» card, click to dismiss). */
await page.evaluate(() => {
  const els = [...document.querySelectorAll('[data-testid], button, [role="button"], div')];
  const t = els.find((e) => /click to dismiss|clicca per chiudere/i.test(e.textContent ?? '') && e.getBoundingClientRect().width < 500);
  (t ?? els.find((e) => /Recorded in the chronicle|Registrato nella cronaca/i.test(e.textContent ?? '')))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await page.waitForTimeout(500);
/* Close the quest run window so the reward popup can mount. */
await page.keyboard.press('Escape');
await page.waitForTimeout(800);

/* Settlement can race a remount: if the boot screen is back, wait out the
 * reload — the persisted ended run re-mounts the reward popup on its own. */
const booted = await page.locator('.game-boot-screen').count();
if (booted) {
  console.log('remount detected — waiting for map again');
  await page.waitForSelector('.game-boot-screen', { state: 'detached', timeout: 120000 }).catch(() => {});
  await page.waitForSelector('[data-map-ready]', { timeout: 300000 }).catch(() => {});
  await page.waitForTimeout(3000);
}

/* Wait for the staged reward popup (it reveals stage-by-stage). */
const popup = page.locator('[data-testid="quest-reward-popup"]').first();
await popup.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
const found = await popup.count().catch(() => 0);
console.log('popup candidates:', found, await page.evaluate(() =>
  [...document.querySelectorAll('[data-testid]')].map((e) => e.getAttribute('data-testid')).filter((t) => /reward|report|return/i.test(t)).join(','),
));
/* Hurry the staged reveal (click/keypress advances each stage early). */
for (let i = 0; i < 12; i++) { await page.keyboard.press('Space'); await page.waitForTimeout(300); }
await page.screenshot({ path: `${OUT}/witness-full.png` });
if (found) {
  await popup.screenshot({ path: `${OUT}/witness-popup.png` }).catch(async () => {
    await page.screenshot({ path: `${OUT}/witness-popup.png` });
  });
}
console.log('saved to', OUT);
await browser.close();
