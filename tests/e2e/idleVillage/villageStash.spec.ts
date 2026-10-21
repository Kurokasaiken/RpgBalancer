/**
 * villageStash.spec.ts — PLAN-073 (R-240): the village warehouse as a REAL
 * shared reservation ledger on `/game`.
 *
 *
 * Covered flows: planner-bound interactive shelf (click-assign → first free
 * slot, click on a packed item → release, release-all), read-only surface
 * without a planner, the shared pool across two open planners, draft
 * persistence across reload, and the LOADOUT header's non-overlap contract
 * at the two audited viewports (1280×800, 1440×900).
 */
import { test, expect, type Page } from '@playwright/test';
import { dragElement } from '../../utils/dragActions';
import { VILLAGE_STASH_CONFIG } from '../../../src/balancing/config/idleVillage/villageStashConfig';

const POI = 'poi-goblin';
const POI_ROVINE = 'poi-rovine';
const FIRST_ITEM = VILLAGE_STASH_CONFIG.items[0].itemId;
const SECOND_ITEM = VILLAGE_STASH_CONFIG.items[1].itemId;

interface TestHooksWindow extends Window {
  __idleVillageTestHooks?: {
    expedition?: Record<string, Record<string, (...a: unknown[]) => unknown>>;
  };
}

const callExpedition = async <T,>(page: Page, poiId: string, action: string, ...args: unknown[]): Promise<T> =>
  (await page.evaluate(
    ({ poiId, act, fnArgs }) => {
      const exp = (window as TestHooksWindow).__idleVillageTestHooks?.expedition?.[poiId] as
        | Record<string, (...a: unknown[]) => unknown>
        | undefined;
      if (!exp || typeof exp[act] !== 'function') throw new Error(`expedition hook "${act}" missing`);
      return exp[act](...fnArgs);
    },
    { poiId, act: action, fnArgs: args },
  )) as T;

const openDetail = (page: Page, poiId: string) => callExpedition<void>(page, poiId, 'openDetail');

/** Bounding boxes must be disjoint — the overlap regression this spec guards. */
const boxesDisjoint = async (page: Page, selA: string, selB: string) => {
  const a = await page.locator(selA).boundingBox();
  const b = await page.locator(selB).boundingBox();
  expect(a, `${selA} must have a box`).not.toBeNull();
  expect(b, `${selB} must have a box`).not.toBeNull();
  const overlapX = Math.min(a!.x + a!.width, b!.x + b!.width) - Math.max(a!.x, b!.x);
  const overlapY = Math.min(a!.y + a!.height, b!.y + b!.height) - Math.max(a!.y, b!.y);
  expect(overlapX <= 0 || overlapY <= 0, `${selA} overlaps ${selB}`).toBe(true);
};

test.beforeEach(async ({ page }) => {
  await page.goto('/game');
  /* A clean ledger per test: the playwright-mode persistence lives in
   * sessionStorage, which survives the goto inside one context. */
  await page.evaluate(() => sessionStorage.removeItem('idleVillage.stashLedger.v1'));
  await page.waitForFunction(
    ([goblin, rovine]) => {
      const exp = (window as TestHooksWindow).__idleVillageTestHooks?.expedition;
      return Boolean(exp?.[goblin]) && Boolean(exp?.[rovine]);
    },
    [POI, POI_ROVINE],
    { timeout: 30_000 },
  );
});

test.describe('PLAN-073 — village stash ledger on /game', () => {
  test('warehouse without a planner is strictly read-only (D ruling)', async ({ page }) => {
    await page.keyboard.press('v');
    const shelf = page.getByTestId('stash-shelf');
    await expect(shelf).toBeVisible({ timeout: 15_000 });
    /* Auto-bind fires only with exactly one open planner — none open here. */
    await expect(shelf).toHaveAttribute('data-stash-mode', 'readonly');
    /* No interactive affordance inside a row: the only button is the close X. */
    await expect(shelf.locator('button')).toHaveCount(0);
    await expect(page.getByTestId('stash-mode-hint')).toBeVisible();
  });

  test('click assigns to the first free slot; the row leaves the shelf (qty 1)', async ({ page }) => {
    await openDetail(page, POI);
    await expect(page.getByTestId('quest-expedition-detail')).toBeVisible();
    await page.getByTestId('quest-open-stash').click();
    const shelf = page.getByTestId('stash-shelf');
    await expect(shelf).toHaveAttribute('data-stash-mode', 'interactive');

    await page.getByTestId(`stash-item-${FIRST_ITEM}`).click();
    await expect(page.getByTestId('bag-slot-0').getByTestId(`loadout-item-${FIRST_ITEM}`)).toBeVisible();
    /* One configured copy — the row is gone until released. */
    await expect(page.getByTestId(`stash-item-${FIRST_ITEM}`)).toHaveCount(0);
  });

  test('clicking a packed item releases it back to the shelf', async ({ page }) => {
    await openDetail(page, POI);
    await page.getByTestId('quest-open-stash').click();
    await page.getByTestId(`stash-item-${FIRST_ITEM}`).click();
    await expect(page.getByTestId(`loadout-item-${FIRST_ITEM}`)).toBeVisible();

    await page.getByTestId(`loadout-item-${FIRST_ITEM}`).click();
    await expect(page.getByTestId(`stash-item-${FIRST_ITEM}`)).toBeVisible();
    await expect(page.getByTestId(`loadout-item-${FIRST_ITEM}`)).toHaveCount(0);
  });

  test('release-all empties only this planner\'s bag (D-2)', async ({ page }) => {
    await openDetail(page, POI);
    await page.getByTestId('quest-open-stash').click();
    await page.getByTestId(`stash-item-${FIRST_ITEM}`).click();
    await page.getByTestId(`stash-item-${SECOND_ITEM}`).click();
    const releaseAll = page.getByTestId('quest-bag-release-all');
    await expect(releaseAll).toBeVisible();
    await releaseAll.click();
    await expect(page.locator('[data-testid^="loadout-item-"]')).toHaveCount(0);
    await expect(page.getByTestId(`stash-item-${FIRST_ITEM}`)).toBeVisible();
    await expect(page.getByTestId(`stash-item-${SECOND_ITEM}`)).toBeVisible();
    /* The affordance itself retires once the bag is empty. */
    await expect(releaseAll).toHaveCount(0);
  });

  test('drag assigns a shelf row onto a free bag slot (dnd-kit route)', async ({ page }) => {
    await openDetail(page, POI);
    await page.getByTestId('quest-open-stash').click();
    await expect(page.getByTestId('stash-shelf')).toHaveAttribute('data-stash-mode', 'interactive');
    /* Let both panels finish their entrance before the pointer gestures —
     *  droppable rects are measured BeforeDragging, so a mid-animation rect
     *  would silently miss the slot. */
    await page.waitForTimeout(400);

    await dragElement(
      page,
      page.getByTestId(`stash-item-${FIRST_ITEM}`),
      page.getByTestId('bag-slot-0'),
    );
    await expect(page.getByTestId('bag-slot-0').getByTestId(`loadout-item-${FIRST_ITEM}`)).toBeVisible();
    await expect(page.getByTestId(`stash-item-${FIRST_ITEM}`)).toHaveCount(0);
  });

  test('drag onto an occupied slot swaps atomically — displaced item returns', async ({ page }) => {
    await openDetail(page, POI);
    await page.getByTestId('quest-open-stash').click();
    await page.getByTestId(`stash-item-${FIRST_ITEM}`).click();
    await expect(page.getByTestId('bag-slot-0').getByTestId(`loadout-item-${FIRST_ITEM}`)).toBeVisible();
    await page.waitForTimeout(400);

    await dragElement(
      page,
      page.getByTestId(`stash-item-${SECOND_ITEM}`),
      page.getByTestId('bag-slot-0'),
    );
    await expect(page.getByTestId('bag-slot-0').getByTestId(`loadout-item-${SECOND_ITEM}`)).toBeVisible();
    /* The displaced first item re-enters the global pool — visible again. */
    await expect(page.getByTestId(`stash-item-${FIRST_ITEM}`)).toBeVisible();
    await expect(page.getByTestId(`stash-item-${SECOND_ITEM}`)).toHaveCount(0);
  });

  test('dragging a packed item onto the shelf releases it', async ({ page }) => {
    await openDetail(page, POI);
    await page.getByTestId('quest-open-stash').click();
    await page.getByTestId(`stash-item-${FIRST_ITEM}`).click();
    await expect(page.getByTestId(`loadout-item-${FIRST_ITEM}`)).toBeVisible();

    await dragElement(
      page,
      page.getByTestId(`loadout-item-${FIRST_ITEM}`),
      page.getByTestId('stash-shelf'),
    );
    await expect(page.getByTestId(`stash-item-${FIRST_ITEM}`)).toBeVisible();
    await expect(page.getByTestId(`loadout-item-${FIRST_ITEM}`)).toHaveCount(0);
  });

  // INV:PLAN-073-bag-ledger-binding
  test('two open planners share ONE pool — A\'s copy is invisible to B', async ({ page }) => {
    /* Open goblin first, bind the shelf and claim the only copy — rovine's
     * detail must not exist yet, or its panel would cover goblin's button. */
    await openDetail(page, POI);
    await page.getByTestId('quest-open-stash').click();
    await page.getByTestId(`stash-item-${FIRST_ITEM}`).click();
    await expect(page.getByTestId(`loadout-item-${FIRST_ITEM}`)).toBeVisible();
    /* Rebind to rovine through ITS button — the shelf switches owner. */
    await openDetail(page, POI_ROVINE);
    await page.locator('[data-testid="quest-expedition-detail"]').last().getByTestId('quest-open-stash').click();
    await expect(page.getByTestId('stash-elsewhere')).toBeVisible();
    /* Reserved elsewhere (qty 1) → the row never reaches rovine's clicks. */
    await expect(page.getByTestId(`stash-item-${FIRST_ITEM}`)).toHaveCount(0);
  });

  test('draft reservations survive a reload (ledger, not local state)', async ({ page }) => {
    await openDetail(page, POI);
    await page.getByTestId('quest-open-stash').click();
    await page.getByTestId(`stash-item-${FIRST_ITEM}`).click();
    await expect(page.getByTestId(`loadout-item-${FIRST_ITEM}`)).toBeVisible();

    await page.reload();
    await page.waitForFunction(
      (goblin) => Boolean((window as TestHooksWindow).__idleVillageTestHooks?.expedition?.[goblin]),
      POI,
      { timeout: 30_000 },
    );
    await openDetail(page, POI);
    /* The draft is still packed — release-all is the only exit. */
    await expect(page.getByTestId(`loadout-item-${FIRST_ITEM}`)).toBeVisible();
  });

  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
  ]) {
    // INV:PLAN-073-loadout-header-no-overlap
    test(`LOADOUT header: «Apri magazzino» never overlaps the bag counter (${viewport.width}×${viewport.height})`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openDetail(page, POI);
      await expect(page.getByTestId('quest-expedition-detail')).toBeVisible();
      /* The audited overlap: the action must sit in its own grid track,
       *  disjoint from the «Sacca — n/max» label — and the coverage row
       *  must stay below them both. */
      await boxesDisjoint(
        page,
        '[data-testid="quest-expedition-bag-count"]',
        '[data-testid="quest-open-stash"]',
      );
    });
  }
});
