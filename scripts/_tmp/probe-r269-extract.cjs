/* R-269 headless witness v3: waits for the assign to COMMIT before clearing,
 * then rAF-samples every painted frame: the medallion must sit on at least
 * one carrier (seat medal OR flight proxy) for the whole window. */
const { chromium } = require('playwright');

const POI = 'poi-goblin';
const SLOT = `${POI}:goblin-slot-leader`;
const RID = 'hero-sir-spaccaculi';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction((poi) => Boolean(window.__idleVillageTestHooks?.expedition?.[poi]), POI, { timeout: 30000 });
  await page.keyboard.press('r');
  await page.waitForSelector('[data-testid="drag-test-container"], [data-testid="resident-roster-panel"]', { timeout: 15000 });
  await page.evaluate((poi) => window.__idleVillageTestHooks.expedition[poi].openDetail(), POI);
  await page.waitForSelector('[data-testid="quest-expedition-detail"]', { timeout: 15000 });
  const assigned = await page.evaluate(
    ({ poi, slot, rid }) => window.__idleVillageTestHooks.expedition[poi].assignToSlot(slot, rid),
    { poi: POI, slot: SLOT, rid: RID },
  );
  console.log('assigned:', assigned);
  /* Wait for the assign transition to COMMIT — the seat must actually hold
   * the resident before the clear (real users extract a seated resident). */
  await page.waitForFunction(
    ({ poi, slot, rid }) => window.__idleVillageTestHooks.expedition[poi].getAssignments()[slot] === rid,
    { poi: POI, slot: SLOT, rid: RID },
    { timeout: 20000 },
  );
  await page.waitForSelector(`[data-testid="slot-medal-${SLOT}"]`, { timeout: 10000 });
  await page.screenshot({ path: 'test-results/r269-0-before-clear.png' });

  await page.evaluate((slot) => {
    window.__frames = [];
    const t0 = performance.now();
    const loop = () => {
      const seatMedal = Boolean(
        document.querySelector(`[data-testid="slot-medal-${slot}"]`)
        || document.querySelector(`[data-testid="slot-token-${slot}"]`),
      );
      const proxy = Boolean(document.querySelector('[data-testid="flight-proxy"]'));
      window.__frames.push({ t: performance.now() - t0, seatMedal, proxy });
      if (performance.now() - t0 < 5000) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }, SLOT);
  await page.evaluate(({ poi, slot }) => window.__idleVillageTestHooks.expedition[poi].clearSlot(slot), { poi: POI, slot: SLOT });

  /* Screenshots across the window (capture latency distorts labels; kept as
   * a visual trail, the rAF frames are the verdict). */
  await page.waitForTimeout(250);
  await page.screenshot({ path: 'test-results/r269-mid-a.png' });
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'test-results/r269-mid-b.png' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'test-results/r269-9-after-land.png' });

  const frames = await page.evaluate(() => window.__frames);
  const assignments = await page.evaluate(
    ({ poi, slot }) => window.__idleVillageTestHooks.expedition[poi].getAssignments()[slot],
    { poi: POI, slot: SLOT },
  );
  const firstProxy = frames.findIndex((f) => f.proxy);
  const lastProxy = frames.map((f, i) => (f.proxy ? i : -1)).reduce((a, b) => Math.max(a, b), -1);
  const window_ = frames.slice(0, lastProxy === -1 ? frames.length : lastProxy + 1);
  const carrierless = window_.filter((f) => !f.seatMedal && !f.proxy);
  console.log(JSON.stringify({
    frames: frames.length,
    firstProxyAt: firstProxy === -1 ? null : frames[firstProxy].t.toFixed(0),
    lastProxyAt: lastProxy === -1 ? null : frames[lastProxy].t.toFixed(0),
    carrierlessFrames: carrierless.length,
    carrierlessSamples: carrierless.slice(0, 5).map((f) => f.t.toFixed(0)),
    finalAssignment: assignments ?? null,
    verdict: carrierless.length === 0 && firstProxy !== -1 ? 'PASS' : 'FAIL',
    pageerrors: errors.slice(0, 3),
  }, null, 2));
  await browser.close();
})();
