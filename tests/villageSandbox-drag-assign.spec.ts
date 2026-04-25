import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { dragResidentCard } from './utils/dragResident';
import { navigateToVillageSandbox, TEST_RESIDENTS, autoEnableTestHooks } from './fixtures/villageSandbox';
import { rosterFeedbackPatterns } from './config/rosterFeedbackPatterns';
import { waitForRosterFeedback } from './utils/waitForRosterFeedback';

const SUMMARY_TEST_IDS = {
  gold: 'summary-gold-value',
  food: 'summary-food-value',
} as const;

const RESOURCE_IDS = Object.keys(SUMMARY_TEST_IDS) as (keyof typeof SUMMARY_TEST_IDS)[];

const SELECTORS = {
  residentCard: '[data-testid="pg-card"]',
  activitySlot: '[data-testid^="activity-slot-"]',
  playableActivitySlot:
    '[data-testid^="activity-slot-"]:not([data-testid="activity-slot-day-night-cycle"]):not([data-testid*="__resident-rack-placeholder__"])',
  rosterFeedback: '[data-testid="roster-feedback"]',
};

const parseNumber = (value: string | null): number => {
  if (!value) return 0;
  const cleaned = value.replace(/[^\d.-]/g, '').trim();
  return cleaned.length ? Number(cleaned) : 0;
};

const pickSummaryResources = (record: Record<string, number>) =>
  RESOURCE_IDS.reduce<Record<string, number>>((acc, resourceId) => {
    acc[resourceId] = record[resourceId] ?? 0;
    return acc;
  }, {});

async function seedBaseline(page: Page): Promise<{ jobActivityId: string; residentId: string }> {
  await page.evaluate((residents) => {
    const hooks = window.__idleVillageTestHooks;
    if (!hooks?.seedResidents) {
      throw new Error('IdleVillage test hooks unavailable (seedResidents)');
    }
    hooks.seedResidents(residents);
  }, TEST_RESIDENTS);

  const jobActivityId = await page
    .waitForFunction(
      () => window.__idleVillageTestHooks?.getManagedActivityHandles?.()?.jobActivityId ?? null,
      undefined,
      { timeout: 20_000 },
    )
    .then(async (handle) => {
      const value = (await handle.jsonValue()) as string | null;
      if (!value) {
        throw new Error('No job activity available after seeding baseline');
      }
      return value;
    });

  const compatibleResidentId =
    (await selectResidentForActivity(page, jobActivityId)) ?? TEST_RESIDENTS[0].id;

  return { jobActivityId, residentId: compatibleResidentId };
}

async function waitForPlayableActivitySlot(page: Page) {
  await page.waitForFunction(
    () =>
      Boolean(
        window.__idleVillageReady === true &&
          document.querySelector('[data-testid="village-sandbox-columns"]') &&
          document.querySelectorAll('[data-testid^="activity-slot-"]').length > 1,
      ),
    undefined,
    { timeout: 20_000 },
  );
}

type ManagedHandlesSnapshot = {
  jobActivityId: string | null;
  questActivityId: string | null;
  residentIds: string[];
  slotAssignments: Record<string, string | null>;
} | null;

type AssignmentSnapshot = {
  roster: Array<{
    id: string;
    status: string;
    statTags?: string[];
    fatigue: number;
  }> | null;
  handles: ManagedHandlesSnapshot;
  assignments: Record<string, string | null>;
  activity: {
    id: string;
    label?: string;
    statRequirement?: {
      allOf?: string[];
      anyOf?: string[];
      noneOf?: string[];
    };
  } | null;
  feedback: string | null;
};

async function logAssignmentSnapshot(
  page: Page,
  activityId: string | undefined,
  residentId: string,
  testInfo?: TestInfo,
): Promise<AssignmentSnapshot | null> {
  if (!activityId) {
    return null;
  }
  const snapshot = await page.evaluate(
    (targetActivityId) => {
      const hooks = window.__idleVillageTestHooks;
      const managedHandles = hooks?.getManagedActivityHandles?.() ?? null;
      const assignments =
        hooks?.getSlotAssignments?.() ?? managedHandles?.slotAssignments ?? {};
      const diagnostics = hooks?.getAssignmentDiagnostics?.();
      return {
        roster: hooks?.getResidentRosterSnapshot?.() ?? null,
        handles: managedHandles,
        assignments,
        activity: hooks?.getActivityDefinition?.(targetActivityId) ?? null,
        feedback: hooks?.getAssignmentFeedback?.() ?? null,
        diagnostics,
      };
    },
    activityId,
  );

  console.log('[drag-assign] snapshot', JSON.stringify({ activityId, residentId, snapshot }, null, 2));

  if (testInfo) {
    await testInfo.attach(`assignment-snapshot-${residentId}`, {
      body: Buffer.from(JSON.stringify({ activityId, residentId, snapshot }, null, 2)),
      contentType: 'application/json',
    });
  }

  return snapshot;
}

async function dragResidentToFirstSlot(
  page: Page,
  activityId?: string,
  residentId: string = TEST_RESIDENTS[0].id,
  testInfo?: TestInfo,
): Promise<ManagedHandlesSnapshot> {
  const residentCardSelector = `${SELECTORS.residentCard}[data-worker-id="${residentId}"]`;
  const resident = (await page.locator(residentCardSelector).count())
    ? page.locator(residentCardSelector).first()
    : page.locator(SELECTORS.residentCard).first();
  await expect(resident).toBeVisible();

  await waitForPlayableActivitySlot(page);

  const slot = activityId
    ? page.locator(
        `[data-testid="activity-slot-${activityId}"], [data-testid^="activity-slot-${activityId}-slot-"]:not([data-testid*="__resident-rack-placeholder__"])`,
      ).first()
    : page.locator(SELECTORS.playableActivitySlot).first();
  await expect(slot).toBeVisible();

  await dragResidentCard(page, resident, slot);

  await logAssignmentSnapshot(page, activityId, residentId, testInfo);

  let handles: ManagedHandlesSnapshot = null;

  if (activityId) {
    await waitForManagedActivityAssignment(page, activityId, residentId);
  } else {
    await expect(slot).toHaveAttribute('aria-label', /assigned|remaining/i, { timeout: 10_000 });
  }

  handles = await captureManagedHandlesState(page);
  if (testInfo && handles) {
    await testInfo.attach('post-drop-handles', {
      body: Buffer.from(JSON.stringify(handles, null, 2)),
      contentType: 'application/json',
    });
  }

  return handles;
}

async function waitForManagedActivityAssignment(page: Page, activityId: string, residentId: string) {
  await expect
    .poll(
      async () =>
        page.evaluate(({ activityId: targetActivityId, residentId: targetResidentId }) => {
          const hooks = window.__idleVillageTestHooks;
          const assignments =
    hooks?.getSlotAssignments?.() ?? hooks?.getManagedActivityHandles?.()?.slotAssignments ?? null;
          const feedback = hooks?.getAssignmentFeedback?.() ?? null;
          const diagnostics = hooks?.getAssignmentDiagnostics?.();
          if (assignments?.[targetActivityId] === targetResidentId) {
            return `assigned:${targetResidentId}`;
          }
          if (diagnostics && diagnostics.reason) {
            return `diagnostics:${diagnostics.reason}`;
          }
          if (feedback && feedback.includes(targetResidentId)) {
            return `feedback:${feedback}`;
          }
          return null;
        }, { activityId, residentId }),
      {
        timeout: 10_000,
        intervals: [250, 500, 1_000],
        message: `Waiting for resident ${residentId} to be assigned to ${activityId}`,
      },
    )
    .toMatch(/^(assigned|feedback):/);
}

async function captureManagedHandlesState(page: Page): Promise<ManagedHandlesSnapshot> {
  return page.evaluate(() => window.__idleVillageTestHooks?.getManagedActivityHandles?.() ?? null);
}

async function selectResidentForActivity(page: Page, activityId: string): Promise<string | null> {
  return page.evaluate((targetActivityId) => {
    const hooks = window.__idleVillageTestHooks;
    const activity = hooks?.getActivityDefinition?.(targetActivityId);
    const roster = hooks?.getResidentRosterSnapshot?.() ?? [];
    if (!activity) {
      return roster.find((resident) => resident.status === 'available')?.id ?? roster[0]?.id ?? null;
    }
    const requirement = activity.statRequirement;
    const matchesRequirement = (statTags: string[] = []) => {
      if (!requirement) return true;
      const tags = statTags ?? [];
      const mustHaveAll = (requirement.allOf ?? []).every((tag) => tags.includes(tag));
      if (!mustHaveAll) return false;
      const anyOf = requirement.anyOf ?? [];
      if (anyOf.length > 0 && !anyOf.some((tag) => tags.includes(tag))) {
        return false;
      }
      const noneOf = requirement.noneOf ?? [];
      if (noneOf.some((tag) => tags.includes(tag))) {
        return false;
      }
      return true;
    };

    const availableResidents = roster.filter((resident) => resident.status === 'available');
    const compatible = availableResidents.find((resident) => matchesRequirement(resident.statTags ?? []));
    return (compatible ?? availableResidents[0] ?? roster[0] ?? null)?.id ?? null;
  }, activityId);
}

async function readSummarySnapshot(page: Page) {
  const snapshot: Record<string, number> = {};
  for (const resourceId of RESOURCE_IDS) {
    const locator = page.getByTestId(SUMMARY_TEST_IDS[resourceId]);
    await locator.first().waitFor({ state: 'attached', timeout: 20_000 });
    snapshot[resourceId] = parseNumber(await locator.first().innerText());
  }
  return snapshot;
}

async function readResourcePanelSnapshot(page: Page) {
  const snapshot: Record<string, number> = {};
  for (const resourceId of RESOURCE_IDS) {
    const locator = page.locator(`[data-testid="resource-value-${resourceId}"]`).first();
    await locator.waitFor({ state: 'attached', timeout: 20_000 });
    snapshot[resourceId] = parseNumber(await locator.innerText());
  }
  return snapshot;
}

async function getHookSnapshot(page: Page) {
  return page.evaluate(() => {
    const snapshot = window.__idleVillageTestHooks?.getResourceSnapshot?.();
    if (!snapshot) {
      throw new Error('getResourceSnapshot hook unavailable');
    }
    return snapshot;
  });
}

async function attachElementScreenshot(testInfo: TestInfo, name: string, locator: ReturnType<Page['locator']>) {
  await locator.scrollIntoViewIfNeeded();
  const buffer = await locator.screenshot();
  await testInfo.attach(name, { body: buffer, contentType: 'image/png' });
}

test.beforeEach(async ({ page }) => {
  await autoEnableTestHooks(page);
});

test.describe('VillageSandbox drag → assign (SWI 1)', () => {
  test('assigns resident via drag and verifies resource snapshots', async ({ page }, testInfo) => {
    await navigateToVillageSandbox(page);
    const { jobActivityId, residentId } = await seedBaseline(page);
    await waitForPlayableActivitySlot(page);

    const initialSnapshot = await getHookSnapshot(page);
    expect(initialSnapshot.summary.gold).toBeGreaterThanOrEqual(0);

    await dragResidentToFirstSlot(page, jobActivityId, residentId, testInfo);

    await waitForRosterFeedback(page, {
      successPattern: [...rosterFeedbackPatterns.success],
      errorPattern: [...rosterFeedbackPatterns.error],
    });

    const hud = page.getByTestId('active-hud');
    await expect(hud).toBeVisible();

    await page.evaluate(() => window.__idleVillageTestHooks?.advanceTimeUnits?.(3));

    const hookSnapshot = await getHookSnapshot(page);
    expect(pickSummaryResources(hookSnapshot.summary)).toEqual(pickSummaryResources(hookSnapshot.panel));

    await expect(async () => {
      const summarySnapshot = await readSummarySnapshot(page);
      const panelSnapshot = await readResourcePanelSnapshot(page);
      expect(summarySnapshot).toEqual(panelSnapshot);
    }).toPass({ timeout: 5_000, intervals: [200, 400, 800] });

    await attachElementScreenshot(testInfo, 'village-sandbox-header', page.getByTestId('village-sandbox-header'));
    await attachElementScreenshot(testInfo, 'village-sandbox-columns', page.getByTestId('village-sandbox-columns'));
    await attachElementScreenshot(testInfo, 'village-sandbox-theater-toggle', page.getByRole('button', { name: /open theater/i }));
  });

  test('verifies theater overlay hover-open/close and risk stripe data attributes', async ({ page }, testInfo) => {
    page.on('console', msg => console.log('PAGE CONSOLE:', msg.text()));
    await seedBaseline(page);
    await waitForPlayableActivitySlot(page);

    // Find the first location slot (not the day-night-cycle)
    const locationSlot = page.locator('[data-testid="activity-slot-foresta"], [data-testid="activity-slot-foresta-slot-0"]').first();
    await expect(locationSlot).toBeVisible();

    // Hover over location slot to trigger theater open
    await locationSlot.hover();
    await page.waitForTimeout(650); // Wait for hover open delay (600ms default)

    // Verify theater overlay is open
    const theaterOverlay = page.locator('[data-testid="theater-overlay"]');
    await expect(theaterOverlay).toBeVisible();

    // Check that risk stripes have correct data attributes
    const riskStripes = theaterOverlay.locator('[data-testid="activity-risk-stripe"]');
    await expect(riskStripes.first()).toBeVisible();
    
    // Verify at least one risk stripe has non-zero injury/death values
    const hasRiskStripes = await riskStripes.locator('[data-has-risk="true"]').count();
    expect(hasRiskStripes).toBeGreaterThan(0);

    // Verify data attributes are present and valid
    const firstRiskStripe = riskStripes.first();
    const injuryPercent = await firstRiskStripe.getAttribute('data-injury-percent');
    const deathPercent = await firstRiskStripe.getAttribute('data-death-percent');
    const hasRisk = await firstRiskStripe.getAttribute('data-has-risk');
    
    expect(injuryPercent).not.toBeNull();
    expect(deathPercent).not.toBeNull();
    expect(hasRisk).toBe('true');
    expect(parseFloat(injuryPercent!)).toBeGreaterThanOrEqual(0);
    expect(parseFloat(deathPercent!)).toBeGreaterThanOrEqual(0);

    // Move mouse away to trigger delayed close
    await page.mouse.move(0, 0);
    await page.waitForTimeout(250); // Wait for hover close delay (200ms default)

    // Verify theater overlay is closed
    await expect(theaterOverlay).not.toBeVisible();

    // Attach screenshots for verification
    await attachElementScreenshot(testInfo, 'theater-overlay-open', theaterOverlay);
    await attachElementScreenshot(testInfo, 'risk-stripe-detail', firstRiskStripe);
  });
});
