/**
 * gameMappa2.spec.ts — `/game` is the approved mappa2 + the three signed HUD surfaces (2026-11-10);
 * the previous game page answers on `/gameOld`.
 *
 * Runs against the dev server (playwright.dev-server.config.ts → :5173).
 */
import { test, expect } from '@playwright/test';

test.describe('/game — mappa2 + signed HUD (2026-11-10)', () => {
  test('boots the mappa2 map with time, resources and nav; nav switches to the village and back', async ({ page }) => {
    test.setTimeout(300_000); // mappa2 boot in headless takes minutes, like the other mappa2 specs (180 s ready budget)
    // the dev server serves hundreds of modules: keep every resource entry so the manifest check below sees it
    await page.addInitScript(() => performance.setResourceTimingBufferSize(20_000));
    await page.goto('/game', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    const root = page.locator('[data-testid="game-mappa2"]');
    await expect(root).toBeVisible({ timeout: 60_000 });
    await expect(root).toHaveAttribute('data-map-ready', 'true', { timeout: 180_000 });
    await expect(page.locator('[data-testid="world-map-layer"] canvas').first()).toBeVisible();
    for (const slot of ['time', 'resources', 'nav']) {
      await expect(page.locator(`[data-hudslot="${slot}"]`)).toBeVisible();
    }
    // the map is mappa2, not the old wanderlust world
    const manifests = await page.evaluate(() => performance.getEntriesByType('resource').map((r) => r.name).filter((n) => n.includes('manifest.json')));
    expect(manifests.some((n) => n.includes('/mappa2/base/manifest.json'))).toBe(true);
    expect(manifests.some((n) => n.includes('/wanderlust/'))).toBe(false);

    await page.locator('[data-nav-id="village"]').click();
    await expect(root).toHaveAttribute('data-view', 'village');
    await expect(page.locator('[data-testid="world-map-layer"]')).toHaveAttribute('aria-hidden', 'true');
    await page.locator('[data-nav-id="map"]').click();
    await expect(root).toHaveAttribute('data-view', 'map');
  });

  test('camera: wheel-out lowers zoom below the resting cover fit and HUD stays fixed', async ({ page }) => {
    test.setTimeout(300_000);
    await page.goto('/game', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    const root = page.locator('[data-testid="game-mappa2"]');
    await expect(root).toHaveAttribute('data-map-ready', 'true', { timeout: 180_000 });
    await page.waitForFunction(() => window.__worldCam && window.__worldCamCtl, null, { timeout: 60_000 });

    const cam = () => page.evaluate(() => ({ ...window.__worldCam }));
    const resting = await cam();
    const nav = page.locator('[data-nav-id="village"]');
    const navBox = await nav.boundingBox();
    expect(navBox).toBeTruthy();

    // INV:pixi-world-map.INV-10 — wheel-out over the map zooms out below the cover fit
    // (was: floor = cover = resting zoom → zoom-out mathematically dead, R-331).
    await page.mouse.move(720, 450);
    await page.mouse.wheel(0, 240);
    await page.waitForTimeout(150);
    const afterOut = await cam();
    expect(afterOut.zoom, 'wheel-out must reduce zoom below resting').toBeLessThan(resting.zoom - 0.001);
    // The HUD must keep its screen rect while the world camera moves (R-331:
    // «la HUD deve rimanere fissa nella posizione e nelle proporzioni»).
    expect((await nav.boundingBox()), 'HUD rect must not move/scale on zoom-out').toEqual(navBox);

    // Same INV — a wheel over the HUD chrome (nav plinth) reaches the map as a
    // zoom, not a dead zone; and never becomes a browser page-zoom (HUD fixed).
    await page.mouse.move(navBox.x + navBox.width / 2, navBox.y + navBox.height / 2);
    await page.mouse.wheel(0, 240);
    await page.waitForTimeout(150);
    const afterHudWheel = await cam();
    expect(afterHudWheel.zoom, 'wheel over HUD chrome must zoom the map').toBeLessThan(afterOut.zoom - 0.001);
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, -240);
    await page.keyboard.up('Control');
    await page.waitForTimeout(150);
    const vvScale = await page.evaluate(() => window.visualViewport?.scale ?? 1);
    expect(vvScale, 'ctrl+wheel must not page-zoom the HUD').toBe(1);
  });

  // INV:pixi-world-map.INV-11 — the village nav restores the resting contract:
  // back on the map the camera is at default zoom/centre, not the stale user one.
  test('camera: village nav resets zoom to the default fit on return to map', async ({ page }) => {
    test.setTimeout(300_000);
    await page.goto('/game', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    const root = page.locator('[data-testid="game-mappa2"]');
    await expect(root).toHaveAttribute('data-map-ready', 'true', { timeout: 180_000 });
    await page.waitForFunction(() => window.__worldCam && window.__worldCamCtl, null, { timeout: 60_000 });

    const cam = () => page.evaluate(() => ({ ...window.__worldCam }));
    const resting = await cam();
    await page.evaluate(() => window.__worldCamCtl.set({ zoom: window.__worldCam.fitZoom * 1.6, panX: -300 }));
    await page.waitForTimeout(100);

    await page.locator('[data-nav-id="village"]').click();
    await expect(root).toHaveAttribute('data-view', 'village');
    await page.locator('[data-nav-id="map"]').click();
    await expect(root).toHaveAttribute('data-view', 'map');
    await page.waitForTimeout(300);

    const back = await cam();
    expect(back.zoom, 'village nav must reset zoom to the resting fit').toBeCloseTo(resting.zoom, 3);
  });

  test('/gameOld still serves the previous game page', async ({ page }) => {
    test.setTimeout(300_000);
    await page.goto('/gameOld', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await expect(page.locator('[data-testid="world-map-layer"] canvas').first()).toBeVisible({ timeout: 120_000 });
    await expect(page.locator('[data-testid="game-mappa2"]')).toHaveCount(0);
  });
});
