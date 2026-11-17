/* Gameplay showcase recording — /game walkthrough, real surfaces, fixed-timing
 * scenes for caption overlay. Headless + swiftshader + recordVideo. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const URL = process.argv[2] ?? 'http://localhost:4173/game?poiDemo=1';
const OUT = process.argv[3] ?? 'deliverables/tambu-prima-pubblicazione/06_Gameplay_Showcase/raw';
const POI = 'poi-goblin';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({
  viewport: { width: 1600, height: 900 },
  recordVideo: { dir: OUT, size: { width: 1600, height: 900 } },
});
const page = await ctx.newPage();
const t0 = Date.now();
const at = (s) => ((Date.now() - t0) / 1000).toFixed(1);
page.on('framenavigated', (f) => { if (f === page.mainFrame()) console.log('NAV at', at(), '->', f.url().slice(0,90)); });
page.on('pageerror', (e) => console.log('PAGEERROR:', String(e).slice(0, 200)));
const sleep = (ms) => page.waitForTimeout(ms);

console.log('SCENE boot');
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForSelector('[data-map-ready]', { timeout: 300000 });
await page.waitForSelector('.game-boot-screen', { state: 'detached', timeout: 60000 }).catch(() => {});
await sleep(3000);
console.log('map ready at', at());

/* SCENE 1 — world map: slow pan + zoom (canvas center drags). */
console.log('SCENE mappa');
const cx = 800, cy = 450;
await page.mouse.move(cx, cy);
await page.mouse.down();
await page.mouse.move(cx - 260, cy - 80, { steps: 40 });
await page.mouse.up();
await sleep(1400);
await page.mouse.move(cx, cy);
await page.mouse.wheel(0, -600);
await sleep(1400);
await page.mouse.move(cx, cy);
await page.mouse.down();
await page.mouse.move(cx + 200, cy + 120, { steps: 40 });
await page.mouse.up();
await sleep(2000);
console.log('mappa done at', at());

/* SCENE 2 — planner detail via hook openDetail (stesso componente del marker,
 * ma deterministico: niente click fragili sul marker Pixi). */
console.log('SCENE planner');
await page.evaluate((poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.openDetail?.(), POI);
await sleep(6000);
console.log('planner linger at', at());
await page.evaluate((poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.closeDetail?.(), POI);
await sleep(1200);
const diag = await page.evaluate((poi) => ({
  keys: Object.keys(window.__idleVillageTestHooks?.expedition ?? {}),
  open: window.__idleVillageTestHooks?.expedition?.[poi]?.isDetailOpen?.() ?? null,
  resolved: !!window.__idleVillageTestHooks?.expedition?.[poi]?.getResolvedOffer?.(),
}), POI);
console.log('exp diag:', JSON.stringify(diag));
const dl = await page.evaluate((poi) => { try { window.__idleVillageTestHooks?.expedition?.[poi]?.demoLaunch?.(); return 'called'; } catch(e){ return 'ERR '+e.message; } }, POI);
console.log('demoLaunch:', dl, 'at', at());
await page.waitForFunction(
  (poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.getRun?.() != null,
  POI, { timeout: 90000 },
);
console.log('run launched at', at());
await sleep(3500);

/* SCENE 4 — quest run: drive to `ended`, pausing on each node so the
 * narrative phases + skill checks read on camera. */
console.log('SCENE quest');
let lastNode = '', repeats = 0, terminal = null;
for (let i = 0; i < 140; i++) {
  const run = await page.evaluate(
    (poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.getRun?.() ?? null, POI);
  if (!run) break;
  if (run.ended) { terminal = run; break; }
  if (run.frontier?.status === 'waiting') {
    const clock = await page.evaluate(() => window.__idleVillageTestHooks?.getClock?.() ?? { currentTick: 0 });
    const lead = Math.max(0, (run.frontier.readyAt ?? 0) - clock.currentTick);
    if (lead > 0) await page.evaluate((n) => window.__idleVillageTestHooks?.advanceTicks?.(n), lead + 1);
    const options = await page.evaluate(
      (poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.getOptions?.() ?? [], POI);
    if (!options.length) break;
    repeats = run.nodeId === lastNode ? repeats + 1 : 0;
    lastNode = run.nodeId;
    await sleep(2400); /* let the node read on camera */
    await page.evaluate(
      ([poi, opt]) => window.__idleVillageTestHooks?.expedition?.[poi]?.choose?.(opt),
      [POI, options[Math.min(repeats, options.length - 1)]]);
    await sleep(2400); /* let the resolution read on camera */
  } else {
    await page.evaluate((n) => window.__idleVillageTestHooks?.advanceTicks?.(n), 2);
    await sleep(700);
  }
}
console.log('quest ended at', at(), 'terminal:', JSON.stringify(terminal?.outcome ?? null));
await sleep(5000);

/* SCENE 5 — reward/report popup: linger, then click collect/close if present. */
console.log('SCENE reward');
for (const txt of [/COLLECT REWARDS/i, /Riscuoti/i, /Collect/i, /Chiudi/i, /Close/i, /Continua/i]) {
  const btn = page.locator('button', { hasText: txt }).first();
  if (await btn.count()) { try { await btn.click({ timeout: 4000 }); break; } catch {} }
}
await sleep(3500);
console.log('final at', at());

try { await ctx.close(); } catch {} /* flushes video */
await browser.close();
console.log('VIDEO_DONE');
