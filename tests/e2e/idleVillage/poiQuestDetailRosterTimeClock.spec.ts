import { test, expect, Page } from '@playwright/test';
import { dragResidentCard } from '../../utils/dragResident';

const resumeIfPaused = async (page: Page) => {
  const playButton = page.getByLabel('Play').first();
  if (await playButton.isVisible()) {
    await playButton.click();
    await page.waitForFunction(() =>
      (window as any).__idleVillageTestHooks?.getQuestState?.().isPaused === false,
      undefined,
      { timeout: 3_000 },
    );
  }
};

/**
 * POI Quest — Detail / Roster / Time / Clock — UI test suite.
 *
 * Each test starts from the page workflow and the component specs. One truth at a time.
 */

test.describe('POI Quest Detail Roster Time/Clock — page load', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/poi-quest-detail-roster-time-clock');
    await page.waitForLoadState('networkidle');

    const pageShell = page.getByTestId('poi-detail-quest-roster-time-clock-integration-page');
    await expect(pageShell).toBeVisible({ timeout: 30_000 });
  });

  test('should render the page shell, clock, roster and QuestPOI', async ({ page }) => {
    // Time / Day-Night strip is mounted on the same canonical store (§1 workflow).
    const clock = page.getByTestId('time-engine-strip-compact');
    await expect(clock).toBeVisible();

    // Roster is present and has draggable cards.
    const rosterPanel = page.getByTestId('resident-roster-panel');
    await expect(rosterPanel).toBeVisible();

    const residentCards = page.locator('[data-worker-id]');
    await expect(residentCards.first()).toBeVisible();
    expect(await residentCards.count()).toBeGreaterThan(0);

    // Quest POI medallion and its concentric overlay are visible.
    const questPoi = page.locator('[data-quest-id]');
    await expect(questPoi).toBeVisible();

    const medallionOverlay = page.locator('[data-testid="quest-poi-medallion-overlay"]');
    await expect(medallionOverlay).toBeVisible();
  });

  test('should open the Quest POI detail and show the ResidentSlotRack', async ({ page }) => {
    const questPoiButton = page.locator('[data-quest-id] div[role="button"]').first();
    await questPoiButton.click();

    const detail = page.getByTestId('poi-detail-wrapper-test');
    await expect(detail).toBeVisible({ timeout: 10_000 });

    const rack = page.getByTestId('resident-slot-rack-root');
    await expect(rack).toBeVisible();
    const slotCount = await page.locator('[data-testid^="slot-button-"]').count();
    expect(slotCount).toBeGreaterThan(0);
  });

  test('should pause the game when opening the Quest POI detail', async ({ page }) => {
    await page.waitForFunction(() =>
      typeof (window as any).__idleVillageTestHooks?.getQuestState === 'function',
    );

    // If the page started paused, resume first so we can observe the pause-on-open behavior.
    const playButton = page.getByLabel('Play');
    if (await playButton.isVisible()) {
      await playButton.click();
      await page.waitForTimeout(300);
    }

    const before = await page.evaluate(() =>
      (window as any).__idleVillageTestHooks.getQuestState(),
    );
    expect(before.isPaused).toBe(false);

    const questPoiButton = page.locator('[data-quest-id] div[role="button"]').first();
    await questPoiButton.click();

    const detail = page.getByTestId('poi-detail-wrapper-test');
    await expect(detail).toBeVisible({ timeout: 10_000 });

    const after = await page.evaluate(() =>
      (window as any).__idleVillageTestHooks.getQuestState(),
    );
    expect(after.isPaused).toBe(true);
  });

  test('should keep Start disabled until slots are filled and time is running', async ({ page }) => {
    const questPoiButton = page.locator('[data-quest-id] div[role="button"]').first();

    // Open the pre-start quest detail and verify the Start CTA is disabled.
    await questPoiButton.click();

    const detail = page.getByTestId('poi-detail-wrapper-test');
    await expect(detail).toBeVisible({ timeout: 10_000 });

    const startButton = detail.locator('.activity-capsule-detail-skin-aware__button--start');
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeDisabled();

    // Fill all required slots via the test hook.
    await page.waitForFunction(() =>
      typeof (window as any).__idleVillageTestHooks?.fillRequiredResidentSlots === 'function',
    );
    const filledCount = await page.evaluate(() =>
      (window as any).__idleVillageTestHooks.fillRequiredResidentSlots(),
    );
    expect(filledCount).toBeGreaterThan(0);

    // Opening the detail pauses the game, so Start must remain disabled while paused.
    await page.waitForFunction(
      () => (window as any).__idleVillageTestHooks?.getQuestState?.().isPaused === true,
      undefined,
      { timeout: 3_000 },
    );
    await expect(startButton).toBeDisabled({ timeout: 2_000 });

    // Resume the canonical clock from the TimeEngineStrip; only then Start becomes enabled.
    await resumeIfPaused(page);
    await expect(startButton).toBeEnabled({ timeout: 5_000 });
  });

  test('should reject a drop on a non-droppable target and keep the roster card available', async ({ page }) => {
    const residentCard = page.locator('[data-worker-id]').first();
    const header = page.locator('header h1').first();
    const cardCountBefore = await page.locator('[data-worker-id]').count();

    await dragResidentCard(page, residentCard, header, { fallbackToNativeDrag: false });
    await page.waitForTimeout(500);

    // The roster card must still be present and the count unchanged.
    await expect(residentCard).toBeVisible();
    expect(await page.locator('[data-worker-id]').count()).toBe(cardCountBefore);

    // No slot should be filled anywhere on the page.
    expect(await page.locator('[data-testid^="slot-medal-"]').count()).toBe(0);
  });

  test('should drag the POI detail panel by its header', async ({ page }) => {
    const questPoiButton = page.locator('[data-quest-id] div[role="button"]').first();
    await questPoiButton.click();

    const detail = page.getByTestId('poi-detail-wrapper-test');
    await expect(detail).toBeVisible({ timeout: 10_000 });

    const header = detail.locator('.activity-capsule-detail-skin-aware__drag-handle');
    await expect(header).toBeVisible();

    const initialBox = await detail.boundingBox();
    expect(initialBox).not.toBeNull();

    const headerBox = await header.boundingBox();
    expect(headerBox).not.toBeNull();

    // Drag the header by 120px to the right.
    await page.mouse.move(headerBox!.x + headerBox!.width / 2, headerBox!.y + headerBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(headerBox!.x + headerBox!.width / 2 + 120, headerBox!.y + headerBox!.height / 2);
    await page.mouse.up();
    await page.waitForTimeout(300);

    const movedBox = await detail.boundingBox();
    expect(movedBox).not.toBeNull();
    expect(movedBox!.x).toBeGreaterThan(initialBox!.x);
  });

  test('should resume the game when the POI detail is closed and reopen on POI click', async ({ page }) => {
    const questPoiButton = page.locator('[data-quest-id] div[role="button"]').first();
    await questPoiButton.click();

    const detail = page.getByTestId('poi-detail-wrapper-test');
    await expect(detail).toBeVisible({ timeout: 10_000 });

    // Opening the detail must auto-pause the canonical clock.
    await page.waitForFunction(
      () => (window as any).__idleVillageTestHooks?.getQuestState?.().isPaused === true,
      undefined,
      { timeout: 3_000 },
    );

    // Close the detail and wait for the canonical clock to resume.
    const closeButton = detail.locator('.activity-capsule-detail-skin-aware__close-button');
    await closeButton.click();
    await expect(detail).toBeHidden({ timeout: 10_000 });

    await page.waitForFunction(
      () => (window as any).__idleVillageTestHooks?.getQuestState?.().isPaused === false,
      undefined,
      { timeout: 5_000 },
    );

    // Clicking the POI again reopens the detail.
    await questPoiButton.click();
    await expect(detail).toBeVisible({ timeout: 10_000 });
  });

  test('should resolve a milestone skill check via the astrolabe', async ({ page }) => {
    test.setTimeout(120_000);
    const questPoiButton = page.locator('[data-quest-id] div[role="button"]').first();
    await questPoiButton.click();

    const detail = page.getByTestId('poi-detail-wrapper-test');
    await expect(detail).toBeVisible({ timeout: 10_000 });

    await page.waitForFunction(() =>
      typeof (window as any).__idleVillageTestHooks?.fillRequiredResidentSlots === 'function',
    );
    await page.evaluate(() =>
      (window as any).__idleVillageTestHooks.fillRequiredResidentSlots(),
    );

    const startButton = detail.locator('.activity-capsule-detail-skin-aware__button--start');
    await resumeIfPaused(page);
    await expect(startButton).toBeEnabled({ timeout: 10_000 });
    await startButton.click();

    const milestoneModal = page.getByTestId('milestone-check-modal');
    await expect(milestoneModal).toBeVisible({ timeout: 10_000 });

    const rollButton = page.getByTestId('milestone-roll-button');
    await rollButton.waitFor({ state: 'visible', timeout: 10_000 });
    await rollButton.click();

    // The astrolabe arms and shows a real THROW control; trigger it directly.
    const throwButton = page.getByLabel('Throw');
    await throwButton.waitFor({ state: 'visible', timeout: 10_000 });
    await throwButton.evaluate((el) => (el as HTMLElement).click());

    await page.getByTestId('milestone-result-label').waitFor({ state: 'visible', timeout: 30_000 });
    await page.getByTestId('milestone-dismiss-button').waitFor({ state: 'visible', timeout: 30_000 });
    await page.getByTestId('milestone-dismiss-button').evaluate((el) => (el as HTMLElement).click());

    await expect(milestoneModal).toBeHidden({ timeout: 10_000 });
  });

  test('should run the quest end-to-end, auto-resolve milestones and collect rewards', async ({ page }) => {
    test.setTimeout(120_000);
    const questPoiButton = page.locator('[data-quest-id] div[role="button"]').first();
    await questPoiButton.click();

    const detail = page.getByTestId('poi-detail-wrapper-test');
    await expect(detail).toBeVisible({ timeout: 10_000 });

    await page.waitForFunction(() =>
      typeof (window as any).__idleVillageTestHooks?.fillRequiredResidentSlots === 'function',
    );
    await page.evaluate(() =>
      (window as any).__idleVillageTestHooks.fillRequiredResidentSlots(),
    );

    const startButton = detail.locator('.activity-capsule-detail-skin-aware__button--start');
    await resumeIfPaused(page);
    await expect(startButton).toBeEnabled({ timeout: 10_000 });
    await startButton.click();

    const questCard = page.getByTestId('floating-panel-quest-card');
    await expect(questCard).toBeVisible({ timeout: 10_000 });

    // Closing the quest card puts the skill checks off-screen; resolve the active one,
    // then the engine auto-resolves the rest and the quest runs to completion.
    await page.getByTestId('floating-panel-close-quest-card').evaluate((el) => (el as HTMLElement).click());
    await expect(questCard).toBeHidden({ timeout: 10_000 });

    await page.evaluate(() =>
      (window as any).__idleVillageTestHooks.resolveActiveMilestone(),
    );

    // Speed up to 8x to shorten the run.
    await page.getByTestId('time-engine-strip-compact').getByLabel('8x velocità').click();

    await page.waitForFunction(
      () => (window as any).__idleVillageTestHooks.getQuestState().embarkResult !== null,
      undefined,
      { timeout: 30_000 },
    );
    await questPoiButton.click();

    await page.getByTestId('quest-reward-panel').waitFor({ state: 'visible', timeout: 10_000 });
    expect(await page.getByTestId('quest-reward-rewards').locator('li').count()).toBeGreaterThan(0);
    expect(await page.getByTestId('quest-reward-party').locator('li').count()).toBeGreaterThan(0);

    const beforeResources = await page.evaluate(() =>
      (window as any).__idleVillageTestHooks.getVillageResources(),
    );

    await page.getByTestId('quest-reward-collect').click();
    await expect(questCard).toBeHidden({ timeout: 10_000 });

    const afterResources = await page.evaluate(() =>
      (window as any).__idleVillageTestHooks.getVillageResources(),
    );
    expect(afterResources.xp).toBeGreaterThan(beforeResources.xp);

    await expect(page.locator('[data-worker-id]:disabled')).toHaveCount(0);
    await expect(page.getByText('Away')).toHaveCount(0);
  });

  test('should toggle the QuestChronicle via the POI while the quest runs', async ({ page }) => {
    test.setTimeout(120_000);
    const questPoiButton = page.locator('[data-quest-id] div[role="button"]').first();
    await questPoiButton.click();

    const detail = page.getByTestId('poi-detail-wrapper-test');
    await expect(detail).toBeVisible({ timeout: 10_000 });

    await page.waitForFunction(
      () => typeof (window as any).__idleVillageTestHooks?.fillRequiredResidentSlots === 'function',
    );
    await page.evaluate(() => (window as any).__idleVillageTestHooks.fillRequiredResidentSlots());

    const startButton = detail.locator('.activity-capsule-detail-skin-aware__button--start');
    await resumeIfPaused(page);
    await expect(startButton).toBeEnabled({ timeout: 10_000 });
    await startButton.click();

    // After embark the quest card (QuestChronicle) must replace the detail.
    const questCard = page.getByTestId('floating-panel-quest-card');
    const chronicleRope = page.getByTestId('quest-chronicle-rope');
    await expect(questCard).toBeVisible({ timeout: 10_000 });
    await expect(chronicleRope).toBeVisible({ timeout: 10_000 });

    // Closing the quest card should not stop the running quest.
    const closeButton = page.getByTestId('floating-panel-close-quest-card');
    await closeButton.click();
    await expect(questCard).toBeHidden({ timeout: 10_000 });

    await page.waitForFunction(
      () => (window as any).__idleVillageTestHooks?.getQuestState?.().isQuestRunning === true,
      undefined,
      { timeout: 3_000 },
    );
    expect(await page.evaluate(() => (window as any).__idleVillageTestHooks?.getQuestState?.().isPaused)).toBe(false);

    // Clicking the POI while the quest is running reopens the quest card.
    await questPoiButton.click();
    await expect(questCard).toBeVisible({ timeout: 10_000 });
    await expect(chronicleRope).toBeVisible({ timeout: 10_000 });
  });

  test('should pause and resume the quest timer', async ({ page }) => {
    test.setTimeout(120_000);
    const questPoiButton = page.locator('[data-quest-id] div[role="button"]').first();
    await questPoiButton.click();

    const detail = page.getByTestId('poi-detail-wrapper-test');
    await expect(detail).toBeVisible({ timeout: 10_000 });

    await page.waitForFunction(() =>
      typeof (window as any).__idleVillageTestHooks?.fillRequiredResidentSlots === 'function',
    );
    await page.evaluate(() =>
      (window as any).__idleVillageTestHooks.fillRequiredResidentSlots(),
    );

    const startButton = detail.locator('.activity-capsule-detail-skin-aware__button--start');
    await resumeIfPaused(page);
    await expect(startButton).toBeEnabled({ timeout: 10_000 });
    await startButton.click();

    const questCard = page.getByTestId('floating-panel-quest-card');
    await expect(questCard).toBeVisible({ timeout: 10_000 });

    // Close the quest card so milestones auto-resolve and the timer can run.
    // The milestone panel may be on top, so use a direct element click to bypass it.
    await page.getByTestId('floating-panel-close-quest-card').evaluate((el) => (el as HTMLElement).click());
    await expect(questCard).toBeHidden({ timeout: 10_000 });

    // The currently-active milestone (if any) pauses the timer; resolve it so
    // the timer is actually running before we test pause/resume (ERR-014).
    await page.evaluate(() =>
      (window as any).__idleVillageTestHooks?.resolveActiveMilestone?.(),
    );

    await page.waitForFunction(() =>
      typeof (window as any).__idleVillageTestHooks?.getQuestState === 'function' &&
      (window as any).__idleVillageTestHooks.getQuestState().elapsedMs > 0,
    );
    const before = await page.evaluate(() =>
      (window as any).__idleVillageTestHooks.getQuestState(),
    );

    // Pause via the time strip.
    await page.getByTestId('time-engine-strip-compact').getByLabel('Pausa').click();
    await page.waitForFunction(() =>
      (window as any).__idleVillageTestHooks.getQuestState().isPaused,
    );
    const pausedBefore = await page.evaluate(() =>
      (window as any).__idleVillageTestHooks.getQuestState(),
    );
    await page.waitForTimeout(1000);
    const pausedAfter = await page.evaluate(() =>
      (window as any).__idleVillageTestHooks.getQuestState(),
    );
    expect(pausedAfter.elapsedMs).toBe(pausedBefore.elapsedMs);

    // Resume.
    await page.getByTestId('time-engine-strip-compact').getByLabel('Play').click();
    await page.waitForFunction(() =>
      !(window as any).__idleVillageTestHooks.getQuestState().isPaused,
    );
    const resumedBefore = await page.evaluate(() =>
      (window as any).__idleVillageTestHooks.getQuestState(),
    );
    await page.waitForTimeout(600);
    const resumed = await page.evaluate(() =>
      (window as any).__idleVillageTestHooks.getQuestState(),
    );
    expect(resumed.elapsedMs).toBeGreaterThan(resumedBefore.elapsedMs);
  });

  test('should mark non-compatible residents as disabled and prevent assignment', async ({ page }) => {
    await page.waitForFunction(() =>
      typeof (window as any).__idleVillageTestHooks?.getResidentCompatibility === 'function',
    );
    const residentIds = await page.locator('[data-worker-id]').evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-worker-id')).filter(Boolean),
    );
    expect(residentIds.length).toBeGreaterThan(0);

    const compatMap: Record<string, { state?: 'idle' | 'valid' | 'invalid' }> = await page.evaluate(
      (ids: string[]) => Object.fromEntries(ids.map((id) => [id, (window as any).__idleVillageTestHooks.getResidentCompatibility(id)])),
      residentIds as string[],
    );
    const invalidId = residentIds.find((id) => compatMap[id as string]?.state === 'invalid');
    if (!invalidId) {
      test.skip(true, 'No incompatible resident in current test roster');
      return;
    }

    const card = page.locator(`[data-worker-id="${invalidId}"]`);
    await expect(card).toHaveAttribute('data-compatibility', 'invalid');
    await expect(card).toHaveAttribute('aria-disabled', 'true');
    const classes = await card.getAttribute('class');
    expect(classes).toMatch(/grayscale/);
    expect(classes).toMatch(/opacity-35/);

    const before = await page.evaluate(() =>
      (window as any).__idleVillageTestHooks.getAssignments(),
    );
    await card.click();
    await page.waitForTimeout(300);
    const after = await page.evaluate(() =>
      (window as any).__idleVillageTestHooks.getAssignments(),
    );
    expect(after).toEqual(before);
  });

  test('should bloom the QuestPOI valid for a compatible resident and invalid for an incompatible one', async ({ page }) => {
    await page.waitForFunction(() =>
      typeof (window as any).__idleVillageTestHooks?.getResidentCompatibility === 'function' &&
      typeof (window as any).__idleVillageTestHooks?.setDraggingResidentId === 'function',
    );
    const residentIds = await page.locator('[data-worker-id]').evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-worker-id')).filter(Boolean),
    );
    const compatMap: Record<string, { state?: 'idle' | 'valid' | 'invalid' }> = await page.evaluate(
      (ids: string[]) => Object.fromEntries(ids.map((id) => [id, (window as any).__idleVillageTestHooks.getResidentCompatibility(id)])),
      residentIds as string[],
    );
    const validId = residentIds.find((id) => compatMap[id as string]?.state === 'valid');
    const invalidId = residentIds.find((id) => compatMap[id as string]?.state === 'invalid');
    const medallion = page.locator('.poi-detail-stage__medallion').first();

    if (validId) {
      await page.evaluate((id: string) =>
        (window as any).__idleVillageTestHooks.setDraggingResidentId(id),
        validId as string,
      );
      await page.waitForTimeout(100);
      const filter = await medallion.evaluate((el) => (el as HTMLElement).style.filter);
      expect(filter).toMatch(/drop-shadow/);
      await page.evaluate(() => (window as any).__idleVillageTestHooks.setDraggingResidentId(null));
    }

    if (invalidId) {
      await page.evaluate((id: string) =>
        (window as any).__idleVillageTestHooks.setDraggingResidentId(id),
        invalidId as string,
      );
      await page.waitForTimeout(100);
      const filter = await medallion.evaluate((el) => (el as HTMLElement).style.filter);
      expect(filter).toMatch(/grayscale\(0\.7\)/);
      await page.evaluate(() => (window as any).__idleVillageTestHooks.setDraggingResidentId(null));
    }
  });

  test('should bloom detail slots valid/invalid based on dragged resident', async ({ page }) => {
    const questPoiButton = page.locator('[data-quest-id] div[role="button"]').first();
    await questPoiButton.click();
    const detail = page.getByTestId('poi-detail-wrapper-test');
    await expect(detail).toBeVisible({ timeout: 10_000 });

    await page.waitForFunction(() =>
      typeof (window as any).__idleVillageTestHooks?.getResidentCompatibility === 'function' &&
      typeof (window as any).__idleVillageTestHooks?.setDraggingResidentId === 'function',
    );
    const residentIds = await page.locator('[data-worker-id]').evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-worker-id')).filter(Boolean),
    );
    const compatMap: Record<string, { state?: 'idle' | 'valid' | 'invalid' }> = await page.evaluate(
      (ids: string[]) => Object.fromEntries(ids.map((id) => [id, (window as any).__idleVillageTestHooks.getResidentCompatibility(id)])),
      residentIds as string[],
    );
    const validId = residentIds.find((id) => compatMap[id as string]?.state === 'valid');
    const invalidId = residentIds.find((id) => compatMap[id as string]?.state === 'invalid');

    if (validId) {
      await page.evaluate((id: string) =>
        (window as any).__idleVillageTestHooks.setDraggingResidentId(id),
        validId as string,
      );
      await page.waitForTimeout(100);
      await expect(page.locator('[data-drop-state="valid"]').first()).toBeVisible({ timeout: 2_000 });
      await page.evaluate(() => (window as any).__idleVillageTestHooks.setDraggingResidentId(null));
    }

    if (invalidId) {
      await page.evaluate((id: string) =>
        (window as any).__idleVillageTestHooks.setDraggingResidentId(id),
        invalidId as string,
      );
      await page.waitForTimeout(100);
      await expect(page.locator('[data-drop-state="invalid"]').first()).toBeVisible({ timeout: 2_000 });
      await page.evaluate(() => (window as any).__idleVillageTestHooks.setDraggingResidentId(null));
    }
  });

  test('should assign a compatible resident via the API and reflect it in the detail', async ({ page }) => {
    test.setTimeout(120_000);
    await page.waitForFunction(() =>
      typeof (window as any).__idleVillageTestHooks?.getResidentCompatibility === 'function' &&
      typeof (window as any).__idleVillageTestHooks?.assignResident === 'function',
    );
    const residentIds = await page.locator('[data-worker-id]').evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-worker-id')).filter(Boolean),
    );
    const compatMap: Record<string, { state?: 'idle' | 'valid' | 'invalid' }> = await page.evaluate(
      (ids: string[]) => Object.fromEntries(ids.map((id) => [id, (window as any).__idleVillageTestHooks.getResidentCompatibility(id)])),
      residentIds as string[],
    );
    const validId = residentIds.find((id) => compatMap[id as string]?.state === 'valid');
    if (!validId) {
      test.skip(true, 'No compatible resident in current test roster');
      return;
    }

    const assigned = await page.evaluate((id: string) =>
      (window as any).__idleVillageTestHooks.assignResident(id),
      validId as string,
    );
    expect(assigned).toBe(validId);

    const questPoiButton = page.locator('[data-quest-id] div[role="button"]').first();
    await questPoiButton.click();
    const detail = page.getByTestId('poi-detail-wrapper-test');
    await expect(detail).toBeVisible({ timeout: 10_000 });

    const assignments = await page.evaluate(() =>
      (window as any).__idleVillageTestHooks.getAssignments(),
    );
    expect(Object.values(assignments).some((id) => id === validId)).toBe(true);
    await expect(page.locator(`[data-resident-id="${validId}"]`).first()).toBeVisible();
  });

  test('should advance the day/night cycle halo while time runs', async ({ page }) => {
    const dayNight = page.getByTestId('day-night-poi-skin');
    await expect(dayNight).toBeVisible();

    await resumeIfPaused(page);
    await expect(dayNight).toHaveAttribute('data-paused', 'false');

    const initialProgress = Number(await dayNight.getAttribute('data-progress'));
    expect(initialProgress).toBe(0);

    const strip = page.getByTestId('time-engine-strip-compact');
    // 4x speed adds 4 ticks per second; with dayTimeUnits=5 it lands inside day.
    await strip.getByLabel('4x velocità').click();

    // Wait for the canonical store to advance the cycle.
    await page.waitForFunction(
      () => (window as any).__idleVillageTestHooks?.getQuestState?.().currentTick > 0,
      undefined,
      { timeout: 10_000 },
    );

    // The DayNightPoiSkin must reflect the same progress.
    await page.waitForFunction(
      () => Number(document.querySelector('[data-testid="day-night-poi-skin"]')?.getAttribute('data-progress')) > 0,
      undefined,
      { timeout: 2_000 },
    );

    await expect(dayNight).toHaveAttribute('data-paused', 'false');
  });

  test('should pause the day/night cycle and stop progress', async ({ page }) => {
    const dayNight = page.getByTestId('day-night-poi-skin');
    await expect(dayNight).toBeVisible();

    await resumeIfPaused(page);
    await expect(dayNight).toHaveAttribute('data-paused', 'false');

    const strip = page.getByTestId('time-engine-strip-compact');
    await strip.getByLabel('4x velocità').click();

    // Wait for the canonical cycle to advance, then pause.
    await page.waitForFunction(
      () => (window as any).__idleVillageTestHooks?.getQuestState?.().currentTick > 0,
      undefined,
      { timeout: 10_000 },
    );

    const pausedButton = strip.getByLabel('Pausa');
    await pausedButton.click();
    await expect(dayNight).toHaveAttribute('data-paused', 'true');

    const pausedProgress = Number(await dayNight.getAttribute('data-progress'));
    await page.waitForTimeout(1_000);
    const laterProgress = Number(await dayNight.getAttribute('data-progress'));
    expect(laterProgress).toBe(pausedProgress);
  });

  test('should transition from day to night and flip the icon/color', async ({ page }) => {
    const dayNight = page.getByTestId('day-night-poi-skin');
    await expect(dayNight).toBeVisible();
    await expect(dayNight).toHaveAttribute('data-phase', 'day');

    await resumeIfPaused(page);
    await expect(dayNight).toHaveAttribute('data-paused', 'false');

    const strip = page.getByTestId('time-engine-strip-compact');
    await strip.getByLabel('4x velocità').click();

    await page.waitForFunction(
      () => (window as any).__idleVillageTestHooks?.getQuestState?.().isDayPhase === false,
      undefined,
      { timeout: 5_000 },
    );

    await expect(dayNight).toHaveAttribute('data-phase', 'night');
    await expect(dayNight).toHaveAttribute('data-paused', 'false');
  });
});
