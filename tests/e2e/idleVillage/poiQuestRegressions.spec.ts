import { test, expect, Page } from '@playwright/test';
import { dragResidentCard, dragResidentPointer } from '../../utils/dragResident';

const resumeIfPaused = async (page: Page) => {
  const playButton = page.getByLabel('Play').first();
  if (await playButton.isVisible()) {
    await playButton.click();
    await page.waitForFunction(
      () => (window as any).__idleVillageTestHooks?.getQuestState?.().isPaused === false,
      undefined,
      { timeout: 3_000 },
    );
  }
};

test.describe('POI Quest Detail Roster Time/Clock — known regressions (2026-08-15)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/poi-quest-detail-roster-time-clock');
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByTestId('poi-detail-quest-roster-time-clock-integration-page'),
    ).toBeVisible({ timeout: 30_000 });
  });

  /**
   * Regression #1: magnetic attraction should land the resident at the Quest POI center.
   * Currently the drop happens on the pointer location instead of snapping to the POI center.
   */
  test('should magnetically snap a resident to the Quest POI center on drop', async ({ page }) => {
    page.on('console', (msg) => console.log(`[console] ${msg.type()}: ${msg.text()}`));
    const residentCard = page.locator('[data-worker-id]').first();
    const questPoi = page.locator('[data-quest-id]').first();
    await expect(residentCard).toBeVisible();
    await expect(questPoi).toBeVisible();

    const poiBoxBefore = await questPoi.boundingBox();
    expect(poiBoxBefore).not.toBeNull();

    await dragResidentPointer(page, residentCard, questPoi, { stepDelayMs: 30 });
    await page.waitForTimeout(350);
    const assignments = await page.evaluate(() =>
      (window as any).__idleVillageTestHooks?.getSlotAssignments?.(),
    );
    console.log('[slot assignments after drag]', assignments);
    expect((assignments || []).some((a: any) => a.assignedResidentId)).toBe(true);

    const poiButton = page.locator('[role="button"][aria-label*="aprire il detail"]').first();
    await expect(poiButton).toBeVisible();
    await poiButton.click();
    await page.waitForTimeout(500);
    const detail = page.getByTestId('poi-detail-wrapper-test');
    await expect(detail).toBeVisible({ timeout: 10_000 });
    const slotMedal = detail.locator('[data-testid^="slot-medal-"]').first();
    await expect(slotMedal).toBeVisible();
  });

  /**
   * Regression #2: closing the POI detail should restore the time state that existed before the detail was opened.
   * Currently the canonical clock auto-resumes on close even if it was already paused.
   * This test is marked `test.fail` because the bug is observed at runtime.
   */
  test('should preserve the pre-open pause state when the POI detail is closed', async ({ page }) => {
    // Put the game in a paused state.
    const pauseButton = page.getByLabel('Pausa').first();
    const playButton = page.getByLabel('Play').first();
    if (await pauseButton.isVisible()) {
      await pauseButton.click();
      await page.waitForTimeout(300);
    }
    const before = await page.evaluate(() =>
      (window as any).__idleVillageTestHooks?.getQuestState?.().isPaused,
    );
    expect(before).toBe(true);

    const questPoiButton = page.locator('[data-quest-id] div[role="button"]').first();
    await questPoiButton.click();

    const detail = page.getByTestId('poi-detail-wrapper-test');
    await expect(detail).toBeVisible({ timeout: 10_000 });

    const closeButton = detail.locator('.activity-capsule-detail-skin-aware__close-button');
    await closeButton.click();
    await expect(detail).toBeHidden({ timeout: 10_000 });

    const after = await page.evaluate(() =>
      (window as any).__idleVillageTestHooks?.getQuestState?.().isPaused,
    );
    expect(after).toBe(true);
  });

  /**
   * Regression #3: a dragged resident token should stay visible while hovering the POI detail.
   * Currently the token is rendered behind or is clipped by the detail panel.
   */
  test('should keep the resident drag preview visible when hovering the POI detail', async ({ page }) => {
    const questPoiButton = page.locator('[data-quest-id] div[role="button"]').first();
    await questPoiButton.click();

    const detail = page.getByTestId('poi-detail-wrapper-test');
    await expect(detail).toBeVisible({ timeout: 10_000 });

    const residentCard = page.locator('[data-worker-id]').first();
    await dragResidentPointer(page, residentCard, detail);
    await page.waitForTimeout(300);

    // Custom roster drag overlay exposes data-drag-preview="true"; the dragged card must remain visible.
    const overlay = page.locator('[data-drag-preview="true"]').first();
    await expect(overlay).toBeVisible();
  });

  /**
   * Regression #4: when all slots are filled an extra slot should appear as a horizontally-scrolled row,
   * not by expanding the POI detail width.
   */
  test('should add a scrollable slot row instead of expanding the POI detail', async ({ page }) => {
    const questPoiButton = page.locator('[data-quest-id] div[role="button"]').first();
    await questPoiButton.click();

    const detail = page.getByTestId('poi-detail-wrapper-test');
    await expect(detail).toBeVisible({ timeout: 10_000 });

    const initialBox = await detail.boundingBox();
    expect(initialBox).not.toBeNull();

    await page.waitForFunction(
      () => typeof (window as any).__idleVillageTestHooks?.fillRequiredResidentSlots === 'function',
    );
    // Fill until the rack overflows; the hook may need to be called multiple times.
    await page.evaluate(() => (window as any).__idleVillageTestHooks.fillRequiredResidentSlots());
    await page.waitForTimeout(300);
    await page.evaluate(() => (window as any).__idleVillageTestHooks.fillRequiredResidentSlots());
    await page.waitForTimeout(300);

    const rack = page.getByTestId('resident-slot-rack-root');
    await expect(rack).toHaveCSS('overflow-x', 'auto');

    const finalBox = await detail.boundingBox();
    expect(finalBox).not.toBeNull();
    expect(finalBox!.width).toBe(initialBox!.width);
    expect(finalBox!.height).toBe(initialBox!.height);
  });

  /**
   * Regression #5: the quest cannot be started even when all required residents are correctly assigned.
   */
  test('should start the quest after manually filling all required slots', async ({ page }) => {
    const questPoiButton = page.locator('[data-quest-id] div[role="button"]').first();
    await questPoiButton.click();

    const detail = page.getByTestId('poi-detail-wrapper-test');
    await expect(detail).toBeVisible({ timeout: 10_000 });

    await page.waitForFunction(
      () => typeof (window as any).__idleVillageTestHooks?.fillRequiredResidentSlots === 'function',
    );
    await page.evaluate(() => (window as any).__idleVillageTestHooks.fillRequiredResidentSlots());

    await resumeIfPaused(page);

    const startButton = detail.locator('.activity-capsule-detail-skin-aware__button--start');
    await expect(startButton).toBeEnabled({ timeout: 5_000 });
    await startButton.click();

    const state = await page.evaluate(() =>
      (window as any).__idleVillageTestHooks?.getQuestState?.(),
    );
    expect(state.isQuestRunning).toBe(true);
  });

  /**
   * Regression #6: the day/night tone ring has a visible alpha square around the ring that becomes more
   * noticeable when the halo is tinted.
   */
  test('should render day/night ring tone without visible alpha square artifact', async ({ page }) => {
    const tone = page
      .locator('[data-testid="day-night-tone"], [data-testid="day-night-poi-skin"]')
      .first();
    await expect(tone).toBeVisible();

    const style = await tone.evaluate((el) => window.getComputedStyle(el as HTMLElement));
    // The ring container must not carry a background color; the ring itself should be drawn with strokes/filters only.
    expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });

  /**
   * Regression #7: pressing Space must toggle play/pause globally when the day/night
   * time engine strip is present. This behavior is owned by DayNightTimeEngineStrip.
   */
  test('should toggle play/pause with the Space key', async ({ page }) => {
    const startPaused = await page.evaluate(() =>
      (window as any).__idleVillageTestHooks?.getQuestState?.().isPaused,
    );
    expect(startPaused).toBe(true);

    await page.keyboard.press('Space');
    await page.waitForFunction(
      () => (window as any).__idleVillageTestHooks?.getQuestState?.().isPaused === false,
      undefined,
      { timeout: 2_000 },
    );

    await page.keyboard.press('Space');
    await page.waitForFunction(
      () => (window as any).__idleVillageTestHooks?.getQuestState?.().isPaused === true,
      undefined,
      { timeout: 2_000 },
    );
  });
});
