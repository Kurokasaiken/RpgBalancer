/**
 * PLAN-033 — BV-4 (the goblin marches from the landing point to the village over the march window, and the
 * page opens with no goblin: the invasion is not restored on reload) and BV-5 (the event ledger opens for a new event and stays open — Director, 2026-10-14: the card folds into its row,
 * so the ledger can no longer close again after a second).
 */
import { expect, test, type Page } from '@playwright/test';

type Hooks = {
  startInvasion?: () => void;
  advanceTicks?: (n: number) => void;
  getInvasion?: () => { startDay: number; dueDay: number; currentDay: number; progress: number } | null;
};
type HooksWindow = Window & { __idleVillageTestHooks?: Hooks };

const MARCH_DAYS = 30;

const boot = async (page: Page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/game?capture=1');
  await page.waitForFunction(() => (window as HooksWindow).__idleVillageTestHooks?.getInvasion, { timeout: 30_000 });
};

/** Start the invasion and confirm the card, so the march starts on the current game day. */
const landInvasion = async (page: Page) => {
  await page.evaluate(() => (window as HooksWindow).__idleVillageTestHooks?.startInvasion?.());
  const body = page.getByTestId('world-event-card-body');
  await expect(body).toBeVisible({ timeout: 10_000 });
  await body.getByRole('button').first().click();
  await expect(page.getByTestId('invasion-goblin-marker')).toBeAttached({ timeout: 5_000 });
};

/** Advance the clock until the game day reaches `day` (ticks per day are a config value, so step and check). */
const advanceToDay = async (page: Page, day: number) => {
  for (let i = 0; i < 20_000; i += 1) {
    const current = await page.evaluate(() => (window as HooksWindow).__idleVillageTestHooks?.getInvasion?.()?.currentDay ?? 0);
    if (current >= day) return;
    await page.evaluate(() => (window as HooksWindow).__idleVillageTestHooks?.advanceTicks?.(5));
  }
  throw new Error(`game day ${day} not reached`);
};

const markerCentre = async (page: Page) => {
  const box = await page.getByTestId('invasion-goblin-marker').boundingBox();
  if (!box) throw new Error('marker not laid out');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

test.describe('invasion march — BV-4', () => {
  test.use({ locale: 'en-US' });

  test('the goblin walks from the landing point toward the village over 30 days', async ({ page }) => {
    await boot(page);
    await landInvasion(page);
    const startDay = (await page.evaluate(() => (window as HooksWindow).__idleVillageTestHooks?.getInvasion?.()?.startDay ?? -1));

    // The marker eases to each new position: measure only once the transition has settled.
    const settle = () => page.waitForTimeout(1_000);
    await settle();
    const at0 = await markerCentre(page);
    await advanceToDay(page, startDay + MARCH_DAYS / 2);
    await settle();
    const mid = await page.evaluate(() => (window as HooksWindow).__idleVillageTestHooks?.getInvasion?.());
    const at15 = await markerCentre(page);
    await advanceToDay(page, startDay + MARCH_DAYS);
    await settle();
    const end = await page.evaluate(() => (window as HooksWindow).__idleVillageTestHooks?.getInvasion?.());
    const at30 = await markerCentre(page);

    expect(mid!.progress).toBeCloseTo(0.5, 2);
    expect(end!.progress).toBe(1);
    // Linear walk: the midpoint sits halfway between the two ends (2% of the viewport as tolerance).
    const tol = 0.02 * 1920;
    expect(Math.abs(at15.x - (at0.x + at30.x) / 2)).toBeLessThan(tol);
    expect(Math.abs(at15.y - (at0.y + at30.y) / 2)).toBeLessThan(tol);
    expect(Math.hypot(at30.x - at0.x, at30.y - at0.y)).toBeGreaterThan(tol);
  });

  test('a reload opens a clean map: no goblin until an invasion is triggered', async ({ page }) => {
    await boot(page);
    await landInvasion(page);
    await expect(page.getByTestId('invasion-goblin-marker')).toBeAttached();
    await page.reload();
    await page.waitForFunction(() => (window as HooksWindow).__idleVillageTestHooks?.getInvasion, { timeout: 30_000 });
    // Director, 2026-10-14: the goblin sticker must not be on the map when the page opens. (It used to be restored from
    // `invasion_v1` with a position derived from a clock that does not hydrate, R-119.)
    await page.waitForTimeout(3_000);
    await expect(page.getByTestId('invasion-goblin-marker')).toHaveCount(0);
    expect(await page.evaluate(() => (window as HooksWindow).__idleVillageTestHooks?.getInvasion?.() ?? null)).toBeNull();
  });
});

// The ledger is a section labelled with its title.
const ledgerOpen = (page: Page) => page.getByRole('region', { name: 'Events', exact: true }).isVisible().catch(() => false);

test.describe('event ledger — BV-5', () => {
  test.use({ locale: 'en-US' });
  const TITLE = 'Goblin host reaches the village';

  test('a closed ledger opens for the new event and stays open', async ({ page }) => {
    await boot(page);
    // The ledger is on by default; the `e` shortcut toggles it. Close it first if it is open.
    if (await ledgerOpen(page)) {
      await page.keyboard.press('e');
      await expect.poll(() => ledgerOpen(page), { timeout: 3_000 }).toBe(false);
    }
    await landInvasion(page);
    await expect(page.getByText(TITLE).first()).toBeVisible({ timeout: 4_000 });
    // It used to close again after a second (peek). It now stays until the player closes it.
    await page.waitForTimeout(3_000);
    await expect(page.getByText(TITLE).first()).toBeVisible();
    expect(await ledgerOpen(page)).toBe(true);
  });

  test('an open ledger stays open after the new event', async ({ page }) => {
    await boot(page);
    if (!(await ledgerOpen(page))) await page.keyboard.press('e');
    await expect.poll(() => ledgerOpen(page), { timeout: 5_000 }).toBe(true);
    await landInvasion(page);
    await page.waitForTimeout(2_500);
    await expect(page.getByText(TITLE).first()).toBeVisible();
  });
});
