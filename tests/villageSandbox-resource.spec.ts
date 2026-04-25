import { expect, test, type Page } from '@playwright/test';
import { navigateToVillageSandbox, TEST_RESIDENTS } from './fixtures/villageSandbox';
import type { IdleVillageResourceSnapshot } from '../src/ui/idleVillage/types/IdleVillageTestHooks';

const SUMMARY_TEST_IDS = {
  gold: 'summary-gold-value',
  food: 'summary-food-value',
} as const;

const RESOURCE_IDS = Object.keys(SUMMARY_TEST_IDS) as (keyof typeof SUMMARY_TEST_IDS)[];
const SUMMARY_PANEL_KEYS = ['gold', 'food'] as const;
type SummaryPanelKey = (typeof SUMMARY_PANEL_KEYS)[number];

const parseNumber = (value: string | null): number => {
  if (!value) return 0;
  const cleaned = value.replace(/[^\d.-]/g, '').trim();
  return cleaned.length ? Number(cleaned) : 0;
};

async function seedResourceBaseline(page: Page) {
  await navigateToVillageSandbox(page);
  await page.evaluate((residents: typeof TEST_RESIDENTS) => {
    window.__idleVillageTestHooks?.seedResidents?.(residents);
  }, TEST_RESIDENTS);
  await page.waitForSelector('[data-testid="resource-panel"]', { timeout: 20_000 });
}

async function readFirstVisibleText(locator: ReturnType<Page['locator']>) {
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    try {
      await candidate.waitFor({ state: 'visible', timeout: 500 });
      return candidate.innerText();
    } catch {
      // Try next candidate
    }
  }
  if (count > 0) {
    return locator.first().innerText();
  }
  throw new Error('No elements found for locator when reading text');
}

async function readSummarySnapshot(page: Page) {
  const snapshot: Record<string, number> = {};
  for (const resourceId of RESOURCE_IDS) {
    const locator = page.getByTestId(SUMMARY_TEST_IDS[resourceId]);
    await locator.first().waitFor({ state: 'attached', timeout: 20_000 });
    snapshot[resourceId] = parseNumber(await readFirstVisibleText(locator));
  }
  return snapshot;
}

function expectSummaryMatchesPanel(
  snapshot: IdleVillageResourceSnapshot,
  keys: readonly SummaryPanelKey[] = SUMMARY_PANEL_KEYS,
) {
  for (const key of keys) {
    const panelValue = snapshot.panel[key];
    if (typeof panelValue === 'number') {
      expect(snapshot.summary[key]).toBe(panelValue);
    }
  }
}

async function waitForHookResourceSnapshot(page: Page) {
  await page.waitForFunction(
    () => typeof window.__idleVillageTestHooks?.getResourceSnapshot === 'function',
    undefined,
    { timeout: 20_000 },
  );
}

async function getHookResourceSnapshot(page: Page): Promise<IdleVillageResourceSnapshot> {
  return page.evaluate(() => {
    const snapshot = window.__idleVillageTestHooks?.getResourceSnapshot?.();
    if (!snapshot) {
      throw new Error('getResourceSnapshot hook unavailable after reload');
    }
    return snapshot;
  });
}

async function readResourcePanelSnapshot(page: Page) {
  const snapshot: Record<string, number> = {};
  for (const resourceId of RESOURCE_IDS) {
    const panelLocator = page.locator(`[data-testid="resource-value-${resourceId}"]`);
    await panelLocator.first().waitFor({ state: 'attached', timeout: 20_000 });
    snapshot[resourceId] = parseNumber(await readFirstVisibleText(panelLocator));
  }
  return snapshot;
}

test.describe('VillageSandbox ResourcePanel parity (SWI 1)', () => {
  test('SummaryStrip values remain in sync with ResourcePanel after assignment', async ({ page }) => {
    await seedResourceBaseline(page);

    const summaryBefore = await readSummarySnapshot(page);
    const panelBefore = await readResourcePanelSnapshot(page);

    for (const resourceId of RESOURCE_IDS) {
      expect(summaryBefore[resourceId]).toBe(panelBefore[resourceId]);
    }

    const handles = await page.evaluate(() => window.__idleVillageTestHooks?.getManagedActivityHandles?.());
    const jobActivityId = handles?.jobActivityId;
    expect(jobActivityId, 'job activity id should be exposed by test hooks').toBeTruthy();

    await page.evaluate(
      ({ activityId, residentId }) => {
        const hooks = window.__idleVillageTestHooks;
        hooks?.assignResidentToActivity?.(activityId, residentId);
      },
      { activityId: jobActivityId!, residentId: TEST_RESIDENTS[0].id },
    );

    await page.evaluate(() => window.__idleVillageTestHooks?.advanceTimeUnits?.(5));

    await expect(async () => {
      const summaryAfter = await readSummarySnapshot(page);
      const panelAfter = await readResourcePanelSnapshot(page);
      expect(summaryAfter).toEqual(panelAfter);
    }).toPass({ timeout: 5_000, intervals: [200, 500, 800] });
  });

  test('getResourceSnapshot remains available after reload', async ({ page }) => {
    await seedResourceBaseline(page);
    await waitForHookResourceSnapshot(page);

    const snapshotBeforeReload = await getHookResourceSnapshot(page);
    expectSummaryMatchesPanel(snapshotBeforeReload);

    await page.reload();
    await waitForHookResourceSnapshot(page);

    const hookSnapshotAfterReload = await getHookResourceSnapshot(page);
    const summaryAfterReload = await readSummarySnapshot(page);
    const panelAfterReload = await readResourcePanelSnapshot(page);

    expectSummaryMatchesPanel(hookSnapshotAfterReload);
    expect(summaryAfterReload).toEqual(panelAfterReload);
    for (const key of SUMMARY_PANEL_KEYS) {
      const panelValue = panelAfterReload[key];
      expect(hookSnapshotAfterReload.summary[key]).toBe(panelValue);
    }
  });
});
