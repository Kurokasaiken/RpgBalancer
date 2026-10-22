/**
 * /game boot health — CTR-game-001 (R-169, REG-001): the check the legacy spec
 * documented as a Playwright snippet, now codified. The seams it reads
 * (`window.__pixiApp`, `window.__wonders`) are exposed in dev and playwright
 * builds only (same gate as `__gamePerf`).
 */
import { expect, test, type Page } from '@playwright/test';

type BootWindow = Window & {
  __pixiApp?: {
    ticker: { lastTime: number; started: boolean };
    renderer: { renderPipes: Record<string, unknown> };
    stage: { children: unknown[] };
  };
  __wonders?: () => number;
};

const waitForGame = (page: Page) =>
  page.waitForFunction(() => (window as BootWindow).__pixiApp && (window as BootWindow).__wonders, null, {
    timeout: 60_000,
  });

test.describe('boot health (CTR-game-001)', () => {
  test.use({ locale: 'en-US', viewport: { width: 1440, height: 900 } });

  // INV:CTR-game-001.INV-1
  test('the ticker stays alive more than 10s after boot', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/game');
    await waitForGame(page);

    const first = await page.evaluate(() => (window as BootWindow).__pixiApp!.ticker.lastTime);
    await page.waitForTimeout(10_500);
    const second = await page.evaluate(() => (window as BootWindow).__pixiApp!.ticker.lastTime);
    expect(second, 'ticker.lastTime must keep advancing past the 10s mark (a throw inside the ticker kills the RAF for good)').toBeGreaterThan(first);
  });

  // INV:CTR-game-001.INV-2
  test('zero pageerror in the observed window', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/game');
    await waitForGame(page);
    await page.waitForTimeout(2_000);
    expect(errors).toEqual([]);
  });

  // INV:CTR-game-001.INV-3
  test('the Director wonder button produces one wonder within ~2s', async ({ page }) => {
    await page.goto('/game');
    await waitForGame(page);

    await page.keyboard.press('F10');
    const wonder = page.locator('[data-action-id="wonder"]');
    await wonder.waitFor({ timeout: 10_000 });
    await wonder.click();
    await expect
      .poll(async () => page.evaluate(() => (window as BootWindow).__wonders!()), { timeout: 5_000 })
      .toBe(1);
    const live = await page.evaluate(() => (window as BootWindow).__wonders!());
    expect(live, 'the wonder request must produce exactly one live wonder').toBe(1);
    await page.keyboard.press('F10');
  });

  // INV:CTR-game-001.INV-4
  test('no mounted renderable requires a render pipe the active renderer lacks', async ({ page }) => {
    await page.goto('/game');
    await waitForGame(page);

    const offenders = await page.evaluate(() => {
      const app = (window as BootWindow).__pixiApp!;
      const pipes = app.renderer.renderPipes;
      const bad: string[] = [];
      const walk = (node: { children?: unknown[]; renderPipeId?: string; label?: string }) => {
        if (node.renderPipeId && !(node.renderPipeId in pipes)) {
          bad.push(node.renderPipeId + ':' + (node.label ?? '?'));
        }
        for (const c of node.children ?? []) walk(c as typeof node);
      };
      walk(app.stage as never);
      return bad;
    });
    expect(offenders, 'every mounted renderable must be backed by a render pipe the active renderer provides (REG-001: mesh behind a missing pipe crashes the canvas fallback)').toEqual([]);
  });
});
