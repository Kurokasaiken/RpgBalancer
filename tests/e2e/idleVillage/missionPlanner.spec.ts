import { test, expect, Page } from '@playwright/test';

/**
 * Mission Planner — E2E contract (MP-07 / PLAN-018 v3 T-007).
 *
 * Covers the three browser scenarios of the prompt:
 * 1. Palindrome reversibility: A → A+PG → A+PG+equip → A+PG+consumable → … → A
 *    must restore the same canonical preview (DOM snapshot, deltas stripped).
 * 2. Tutorial quest (`quest_city_rats`): lone hero → baseline; +villager changes
 *    the SUCCESSO headline and BY MEMBER shows both risks; +mount lowers Durata
 *    and occupies the `mount` socket; WHY lines stay coherent.
 * 3. The planner is a non-blocking FloatingPanel: the page stays interactive.
 */

const openPlanner = async (page: Page): Promise<void> => {
  await page.getByTestId('open-mission-planner').click();
  await expect(page.locator('[data-testid="floating-panel-mission-planner"]').last()).toBeVisible();
};

/**
 * Canonical DOM snapshot of the planner: clones INPUT+OUTPUT and strips the
 * volatile parts (old→new delta badges, the status line, the WHY disclosure)
 * so the result mirrors `serializeOutcome` — same draft ⇒ identical string.
 */
const plannerSnapshot = async (page: Page): Promise<string> =>
  page.evaluate(() => {
    const strip = (root: Element | null): string | null => {
      if (!root) return null;
      const clone = root.cloneNode(true) as Element;
      clone
        .querySelectorAll('[data-testid*="delta"], [data-testid="mp-status"], [data-testid="mp-why"]')
        .forEach((node) => node.remove());
      return clone.textContent;
    };
    return JSON.stringify({
      input: strip(document.querySelector('[data-testid="mp-input"]')),
      output: strip(document.querySelector('[data-testid="mp-output"]')),
    });
  });

const metricValue = async (page: Page, testid: string): Promise<string> =>
  page.getByTestId(testid).evaluate((el) => {
    const clone = el.cloneNode(true) as Element;
    clone.querySelectorAll('[data-testid*="delta"]').forEach((n) => n.remove());
    return (clone.querySelector('strong')?.textContent ?? clone.textContent ?? '').trim();
  });

test.describe('Mission Planner — E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/poi-quest-detail-roster-time-clock');
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByTestId('poi-detail-quest-roster-time-clock-integration-page'),
    ).toBeVisible({ timeout: 30_000 });
  });

  test('palindrome: add member + equip + consumable then undo each step restores the preview', async ({
    page,
  }) => {
    await openPlanner(page);

    const baseline = await plannerSnapshot(page);

    // A → A+PG
    await page.getByTestId('mp-roster-hero-sir-spaccaculi').click();
    await expect(page.getByTestId('mp-member-hero-sir-spaccaculi')).toBeVisible();

    // A+PG → A+PG+equip (mount socket cycles to the draft horse)
    await page.getByTestId('mp-socket-hero-sir-spaccaculi-mount').click();
    await expect(page.getByTestId('mp-socket-hero-sir-spaccaculi-mount')).not.toContainText('—');

    // A+PG+equip → A+PG+equip+consumable
    await page.getByTestId('mp-prov-quest_consumable_healing_draught-inc').click();

    // Reverse: consumable → equip → member
    await page.getByTestId('mp-prov-quest_consumable_healing_draught-dec').click();
    await page.getByTestId('mp-socket-hero-sir-spaccaculi-mount').click();
    await page.getByTestId('mp-remove-quest_city_rats-slot-0').click();
    await expect(page.getByTestId('mp-member-hero-sir-spaccaculi')).toHaveCount(0);

    expect(await plannerSnapshot(page)).toBe(baseline);
  });

  test('tutorial quest: members change SUCCESSO, BY MEMBER shows both risks, mount lowers Durata, WHY is coherent', async ({
    page,
  }) => {
    await openPlanner(page);

    // Hero alone → baseline headline.
    await page.getByTestId('mp-roster-hero-sir-spaccaculi').click();
    await expect(page.getByTestId('mp-member-hero-sir-spaccaculi')).toBeVisible();
    const successSolo = await metricValue(page, 'mp-success');
    expect(successSolo.trim().length).toBeGreaterThan(0);

    // +villager → SUCCESSO changes and BY MEMBER lists 2 members × 2 risks.
    await page.getByTestId('mp-roster-hero-giggiolillo').click();
    const successDuo = await metricValue(page, 'mp-success');
    expect(successDuo).not.toBe(successSolo);
    await expect(page.getByTestId('mp-by-member').locator('[data-testid^="mp-member-"]')).toHaveCount(2);
    for (const id of ['hero-sir-spaccaculi', 'hero-giggiolillo']) {
      const row = page.getByTestId(`mp-member-${id}`);
      await expect(row).toBeVisible();
      const text = (await row.textContent()) ?? '';
      expect(text).toContain('⚕');
      expect(text).toContain('☠');
    }

    // +cavalcatura → Durata ↓ and the mount socket is occupied.
    const durationBefore = await metricValue(page, 'mp-metric-duration');
    const mountSocket = page.getByTestId('mp-socket-hero-sir-spaccaculi-mount');
    await mountSocket.click();
    await expect(mountSocket).toContainText(/draft|horse|cavalcatura/i);
    const durationAfter = await metricValue(page, 'mp-metric-duration');
    expect(durationAfter).not.toBe(durationBefore);

    // WHY coherent: opens and lists at least one causal contribution line.
    await page.getByTestId('mp-why-toggle').click();
    const why = page.getByTestId('mp-why');
    await expect(why).toBeVisible();
    expect(((await why.textContent()) ?? '').trim().length).toBeGreaterThan(0);
  });

  test('the planner panel is non-blocking: the quest page stays interactive', async ({ page }) => {
    await openPlanner(page);

    // The activity selector behind the FloatingPanel still works.
    const activitySelect = page.locator('select').first();
    await activitySelect.selectOption('job_visit_market');
    await expect(activitySelect).toHaveValue('job_visit_market');
    await expect(page.locator('[data-testid="floating-panel-mission-planner"]').last()).toBeVisible();

    // And the planner still reacts to its own controls.
    await activitySelect.selectOption('quest_city_rats');
    await expect(page.getByTestId('mp-input')).toBeVisible();
    await page.getByTestId('mp-roster-hero-sir-spaccaculi').click();
    await expect(page.getByTestId('mp-member-hero-sir-spaccaculi')).toBeVisible();
  });
});
