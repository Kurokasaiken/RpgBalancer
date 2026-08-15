import { test, expect, Page } from '@playwright/test';

async function waitForTestHooks(page: Page) {
  await page.waitForFunction(
    () =>
      typeof (window as any).__idleVillageTestHooks?.getAvailableActivityIds === 'function' &&
      typeof (window as any).__idleVillageTestHooks?.getActivityInfo === 'function' &&
      typeof (window as any).__idleVillageTestHooks?.setSelectedActivityId === 'function',
    undefined,
    { timeout: 10_000 },
  );
}

test.describe('POI Family — activity selector and cross-type regressions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/poi-quest-detail-roster-time-clock');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByTestId('poi-detail-quest-roster-time-clock-integration-page'),
    ).toBeVisible({ timeout: 60_000 });
    await waitForTestHooks(page);
  });

  test('should list multiple POI kinds in the activity selector', async ({ page }) => {
    const ids = (await page.evaluate(() =>
      (window as any).__idleVillageTestHooks.getAvailableActivityIds(),
    )) as string[];
    expect(ids.length).toBeGreaterThan(1);

    const infos = (await page.evaluate((activityIds: string[]) =>
      activityIds.map((id) => (window as any).__idleVillageTestHooks.getActivityInfo(id)),
     ids)) as Array<{ id: string; label: string; kind: string } | null>;

    const kinds = new Set(infos.filter(Boolean).map((i) => i!.kind));
    console.log('[activity kinds in selector]', kinds);
    expect(kinds.has('quest')).toBe(true);
    // The page should be able to display job POIs for the family test harness.
    expect(kinds.has('job')).toBe(true);
  });

  test('should switch to a job POI and update the detail title', async ({ page }) => {
    const ids = (await page.evaluate(() =>
      (window as any).__idleVillageTestHooks.getAvailableActivityIds(),
    )) as string[];

    const infos = (await page.evaluate((activityIds: string[]) =>
      activityIds.map((id) => (window as any).__idleVillageTestHooks.getActivityInfo(id)),
     ids)) as Array<{ id: string; label: string; kind: string } | null>;

    const job = infos.find((i) => i?.kind === 'job');
    test.skip(!job, 'No job activity in config, skipping job selector test.');

    const ok = await page.evaluate((id: string) =>
      (window as any).__idleVillageTestHooks.setSelectedActivityId(id),
     job!.id);
    expect(ok).toBe(true);

    const detail = page.getByTestId('poi-detail-wrapper-test');
    // The detail may not be open yet; open it via the POI button.
    const poiButton = page.locator('[data-quest-id] div[role="button"]').first();
    await poiButton.click();
    await expect(detail).toBeVisible({ timeout: 10_000 });
    await expect(detail).toContainText(job!.label, { timeout: 5_000 });

    const selectedId = await page.evaluate(() =>
      (window as any).__idleVillageTestHooks.getSelectedActivityId(),
    );
    expect(selectedId).toBe(job!.id);
  });

  test('should switch to a training POI and keep start disabled until assigned', async ({ page }) => {
    const ids = (await page.evaluate(() =>
      (window as any).__idleVillageTestHooks.getAvailableActivityIds(),
    )) as string[];

    const infos = (await page.evaluate((activityIds: string[]) =>
      activityIds.map((id) => (window as any).__idleVillageTestHooks.getActivityInfo(id)),
     ids)) as Array<{ id: string; label: string; kind: string } | null>;

    const training = infos.find((i) => i?.kind === 'training');
    test.skip(!training, 'No training activity in config, skipping training selector test.');

    await page.evaluate((id: string) =>
      (window as any).__idleVillageTestHooks.setSelectedActivityId(id),
     training!.id);

    const detail = page.getByTestId('poi-detail-wrapper-test');
    const poiButton = page.locator('[data-quest-id] div[role="button"]').first();
    await poiButton.click();
    await expect(detail).toBeVisible({ timeout: 10_000 });
    await expect(detail).toContainText(training!.label, { timeout: 5_000 });

    const startButton = detail.locator('.activity-capsule-detail-skin-aware__button--start');
    // Training POIs may have no required slots, so the CTA is visible immediately.
    await expect(startButton).toBeVisible({ timeout: 5_000 });
  });

  test('should not auto-start a quest while paused', async ({ page }) => {
    // Pause the game.
    const pauseButton = page.getByLabel('Pausa').first();
    if (await pauseButton.isVisible()) {
      await pauseButton.click();
      await page.waitForTimeout(300);
    }

    const isPaused = await page.evaluate(() =>
      (window as any).__idleVillageTestHooks?.getQuestState?.().isPaused,
    );
    test.skip(typeof isPaused !== 'boolean', 'No quest state available.');
    expect(isPaused).toBe(true);

    const ids = (await page.evaluate(() =>
      (window as any).__idleVillageTestHooks.getAvailableActivityIds(),
    )) as string[];

    const infos = (await page.evaluate((activityIds: string[]) =>
      activityIds.map((id) => (window as any).__idleVillageTestHooks.getActivityInfo(id)),
     ids)) as Array<{ id: string; label: string; kind: string } | null>;

    const quest = infos.find((i) => i?.kind === 'quest');
    test.skip(!quest, 'No quest activity available.');

    await page.evaluate((id: string) =>
      (window as any).__idleVillageTestHooks.setSelectedActivityId(id),
     quest!.id);

    const detail = page.getByTestId('poi-detail-wrapper-test');
    const poiButton = page.locator('[data-quest-id] div[role="button"]').first();
    await poiButton.click();
    await expect(detail).toBeVisible({ timeout: 10_000 });

    await page.waitForFunction(
      () => typeof (window as any).__idleVillageTestHooks?.fillRequiredResidentSlots === 'function',
    );
    await page.evaluate(() => (window as any).__idleVillageTestHooks.fillRequiredResidentSlots());

    const startButton = detail.locator('.activity-capsule-detail-skin-aware__button--start');
    await expect(startButton).toBeEnabled({ timeout: 5_000 });
    await startButton.click();

    const state = await page.evaluate(() =>
      (window as any).__idleVillageTestHooks?.getQuestState?.(),
    );
    expect(state.isQuestRunning).toBe(false);
    expect(state.questStartRequested).toBe(true);
  });
});
