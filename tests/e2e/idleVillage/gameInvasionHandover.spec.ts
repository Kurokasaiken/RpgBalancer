/**
 * PLAN-033 — BV-3 (never two goblins on screen during the window → sticker → map
 * handover) and BV-6 (region rings render under the cloud bands, and hovering a
 * territory still picks the same region it used to).
 *
 * BV-3 samples every rendered frame from inside the page: a Playwright-driven
 * polling loop would miss the single-commit swaps the contract cares about.
 */
import { expect, test, type Page } from '@playwright/test';

type WorldLayers = {
  sortable: boolean;
  rings: number[];
  clouds: number[];
  nightWash: number;
  mapSize: { width: number; height: number };
  cam: { panX: number; panY: number; zoom: number };
  canvasRect: { left: number; top: number; width: number; height: number };
  cursor: string | null;
  hoverDelayS: number;
};
type HooksWindow = Window & {
  __idleVillageTestHooks?: { startInvasion?: () => void };
  __worldLayers?: () => WorldLayers;
};

const boot = async (page: Page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/game?capture=1');
  await page.waitForFunction(() => (window as HooksWindow).__idleVillageTestHooks?.startInvasion, { timeout: 30_000 });
};

test.describe('goblin handover — BV-3', () => {
  test.use({ locale: 'en-US' });

  test('at most one goblin is visible on every frame of the transition', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => {
      type Audit = { frames: number; doubleFrames: number; seenFlight: boolean; seenMarkerOn: boolean };
      const w = window as unknown as { __goblinAudit?: Audit };
      const audit: Audit = { frames: 0, doubleFrames: 0, seenFlight: false, seenMarkerOn: false };
      w.__goblinAudit = audit;
      const VIS = 0.5;
      const tick = () => {
        audit.frames++;
        let n = 0;
        /* The warm-up card carries a second window sticker inside an opacity-0.01 shell:
         * the computed-opacity threshold counts only the live one. */
        for (const el of document.querySelectorAll<HTMLElement>('[data-testid="goblin-window-sticker"]'))
          if (parseFloat(getComputedStyle(el).opacity) > VIS) n++;
        const flight = document.querySelector<HTMLElement>('[data-testid="goblin-flight-sticker"]');
        if (flight) {
          audit.seenFlight = true;
          if (parseFloat(getComputedStyle(flight).opacity) > VIS) n++;
        }
        const marker = document.querySelector<HTMLElement>('[data-testid="invasion-goblin-marker"]');
        if (marker && parseFloat(getComputedStyle(marker).opacity) > VIS) {
          n++;
          audit.seenMarkerOn = true;
        }
        if (n >= 2) audit.doubleFrames++;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    await page.evaluate(() => (window as HooksWindow).__idleVillageTestHooks?.startInvasion?.());
    const body = page.getByTestId('world-event-card-body');
    await expect(body).toBeVisible({ timeout: 10_000 });
    await body.getByRole('button').first().click();

    /* Sequence end: the map marker owns the goblin (the flying sticker has landed). */
    await expect
      .poll(
        async () =>
          page
            .getByTestId('invasion-goblin-marker')
            .evaluate((el) => parseFloat(getComputedStyle(el).opacity))
            .catch(() => 0),
        { timeout: 15_000 },
      )
      .toBeGreaterThan(0.5);
    await expect(page.getByTestId('goblin-flight-sticker')).toHaveCount(0);

    const audit = await page.evaluate(
      () => (window as unknown as { __goblinAudit?: { frames: number; doubleFrames: number; seenFlight: boolean; seenMarkerOn: boolean } }).__goblinAudit,
    );
    expect(audit).not.toBeNull();
    // The sequence really ran: peeled sticker flew and the marker lit up.
    expect(audit!.seenFlight).toBe(true);
    expect(audit!.seenMarkerOn).toBe(true);
    expect(audit!.frames).toBeGreaterThan(30);
    // BV-3: no frame ever drew two goblins.
    expect(audit!.doubleFrames).toBe(0);
  });
});

test.describe('map layers and region hover — BV-6', () => {
  test.use({ locale: 'en-US' });

  /* Pointer position for a territory's centre, via the same world→screen math the
   * renderer uses (`sx = (wx - panX) * zoom`, then the canvas' own page offset). */
  const regionScreenPoint = (layers: WorldLayers, center: [number, number]) => ({
    x: layers.canvasRect.left + (center[0] * layers.mapSize.width - layers.cam.panX) * layers.cam.zoom,
    y: layers.canvasRect.top + (center[1] * layers.mapSize.height - layers.cam.panY) * layers.cam.zoom,
  });

  test('rings stay under clouds and hovering still selects the same territories', async ({ page }) => {
    await boot(page);
    await page.waitForFunction(() => (window as HooksWindow).__worldLayers, { timeout: 30_000 });

    const regions = await page.evaluate(async () => {
      const r = await fetch('/assets/world/wanderlust/base/regions.json');
      return (await r.json()).regions as { id: string; index: number; center: [number, number] }[];
    });
    /* `center` is a label centroid, not guaranteed inside the shape: meadows/eastern_woods
     * centre on neighbouring regions. Pick territories whose centroid is self-contained. */
    const northern = regions.find((r) => r.id === 'northern_forest');
    const southern = regions.find((r) => r.id === 'southern_mountains');
    expect(northern && southern).toBeTruthy();

    const layers = await page.evaluate(() => (window as HooksWindow).__worldLayers!());
    const dwellMs = layers.hoverDelayS * 1000 + 600;

    // Hover a territory: after the dwell its name plate appears — the id map still resolves it.
    const p1 = regionScreenPoint(layers, northern!.center);
    await page.mouse.move(p1.x, p1.y);
    await expect(page.getByRole('tooltip')).toHaveText('Whispering Woods', { timeout: dwellMs + 5_000 });
    const afterHover = await page.evaluate(() => (window as HooksWindow).__worldLayers!());
    expect(afterHover.cursor).toBe('point');

    // BV-6a: every ring sprite sits strictly below every cloud band in a sorted world.
    expect(afterHover.sortable).toBe(true);
    expect(afterHover.clouds.length).toBeGreaterThan(0);
    expect(afterHover.rings.length).toBeGreaterThan(0);
    for (const z of afterHover.rings) expect(z).toBeLessThan(Math.min(...afterHover.clouds));

    // A second territory resolves to its own name — the hover mapping did not drift.
    const p2 = regionScreenPoint(layers, southern!.center);
    await page.mouse.move(p2.x, p2.y);
    await expect(page.getByRole('tooltip')).toHaveText('Southern Crags', { timeout: dwellMs + 5_000 });
  });
});
