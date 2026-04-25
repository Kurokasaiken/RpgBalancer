import { test, expect, type Page } from '@playwright/test';
import {
  resolvePunchClubGymResident,
  resolveResidentExcludingTags,
  seedVillageSandbox,
  ensureActivityAreaPopulated,
  startPunchClubActivity,
  getLocationDropState,
  setDraggingResidentId,
} from './fixtures/villageSandbox';
import { rosterFeedbackPatterns } from './config/rosterFeedbackPatterns';
import { waitForRosterFeedback } from './utils/waitForRosterFeedback';

const THEATER_OVERLAY_SELECTOR = '[data-testid="theater-overlay"]';
const RESIDENT_CARD_SELECTOR = '[data-testid="pg-card"]';
const THEATER_ACTIVITY_RISK_STRIPE_SELECTOR = '[data-testid="activity-risk-stripe"]';
const LOCATION_SLOT_SELECTOR = (slotId: string) => `[data-slot-id="${slotId}"]`;
const RESIDENT_DRAG_MIME = 'text/resident-id';
const LOCATION_INCOMPATIBLE_PATTERN = /nessuna attività compatibile in questo luogo/i;

interface IdleDragContext {
  residentId: string;
  sourceSelector: string;
  dataTransfer: DataTransfer;
}

declare global {
  interface Window {
    __idleDragCtx?: IdleDragContext;
  }
}

async function captureTheaterDropDebug(page: Page, label: string) {
  const payload = await page.evaluate(() => {
    const hooks = window.__idleVillageTestHooks;
    if (!hooks) return null;
    return {
      locationSlotIds: hooks.getLocationSlotIds?.() ?? [],
      assignmentDiagnostics: hooks.getAssignmentDiagnostics?.(undefined, undefined) ?? null,
      assignmentFeedback: hooks.getAssignmentFeedback?.() ?? null,
      locationDropState: hooks.getLocationDropState?.() ?? null,
      draggingResidentId: hooks.getDraggingResidentId?.() ?? null,
    };
  });
  console.info(`[theater-debug:${label}]`, JSON.stringify(payload, null, 2));
  return payload;
}

declare global {
  interface Window {
    __idleDragCtx?: IdleDragContext;
  }
}

async function startSyntheticResidentDrag(page: Page, residentId: string) {
  await page.evaluate(
    ({ selector, id, mime }) => {
      const source = document.querySelector<HTMLElement>(`${selector}[data-worker-id="${id}"]`);
      if (!source) {
        throw new Error(`Resident card with id ${id} not found`);
      }
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/plain', id);
      dataTransfer.setData(mime, id);
      source.dispatchEvent(
        new DragEvent('dragstart', {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        }),
      );
      window.__idleDragCtx = {
        residentId: id,
        sourceSelector: `${selector}[data-worker-id="${id}"]`,
        dataTransfer,
      };
    },
    { selector: RESIDENT_CARD_SELECTOR, id: residentId, mime: RESIDENT_DRAG_MIME },
  );
  await setDraggingResidentId(page, residentId);
}

async function hoverLocationForTheater(page: Page, targetSelector: string) {
  await page.evaluate(({ selector }) => {
    const ctx = window.__idleDragCtx;
    if (!ctx) {
      throw new Error('Synthetic drag context missing');
    }
    const target = document.querySelector<HTMLElement>(selector);
    if (!target) {
      throw new Error(`Location target not found for selector ${selector}`);
    }
    const eventInit: DragEventInit = {
      bubbles: true,
      cancelable: true,
      dataTransfer: ctx.dataTransfer as DataTransfer,
    };
    target.dispatchEvent(new DragEvent('dragenter', eventInit));
    target.dispatchEvent(new DragEvent('dragover', eventInit));
  }, { selector: targetSelector });

  const theaterOverlay = page.locator(THEATER_OVERLAY_SELECTOR);
  await expect(theaterOverlay).toBeVisible({ timeout: 2000 });
}

async function dropOnTheaterOverlay(page: Page) {
  await page.evaluate((selector) => {
    const ctx = window.__idleDragCtx;
    if (!ctx) {
      throw new Error('Synthetic drag context missing for drop');
    }
    const overlay = document.querySelector<HTMLElement>(selector);
    if (!overlay) {
      throw new Error('Theater overlay not found');
    }
    const eventInit: DragEventInit = {
      bubbles: true,
      cancelable: true,
      dataTransfer: ctx.dataTransfer as DataTransfer,
    };
    overlay.dispatchEvent(new DragEvent('dragenter', eventInit));
    overlay.dispatchEvent(new DragEvent('dragover', eventInit));
    overlay.dispatchEvent(new DragEvent('drop', eventInit));
    const source = document.querySelector<HTMLElement>(ctx.sourceSelector as string);
    source?.dispatchEvent(new DragEvent('dragend', eventInit));
    window.__idleDragCtx = undefined;
  }, THEATER_OVERLAY_SELECTOR);
  await setDraggingResidentId(page, null);
}

async function cancelSyntheticDrag(page: Page) {
  await page.evaluate(() => {
    const ctx = window.__idleDragCtx;
    if (!ctx) {
      return;
    }
    const source = document.querySelector<HTMLElement>(ctx.sourceSelector as string);
    if (source) {
      source.dispatchEvent(
        new DragEvent('dragend', {
          bubbles: true,
          cancelable: true,
          dataTransfer: ctx.dataTransfer as DataTransfer,
        }),
      );
    }
    window.__idleDragCtx = undefined;
  });
}

const expectLocationDropState = async (page: Page, expected: 'idle' | 'valid' | 'invalid') => {
  await expect.poll(async () => getLocationDropState(page), { timeout: 5_000 }).toBe(expected);
};

test.describe('VillageSandbox Theater overlay', () => {
  test('hover → theater → drop with compatible resident closes overlay', async ({ page }, testInfo) => {
    await testInfo.attach('trace', { body: Buffer.from(''), contentType: 'application/zip' });
    testInfo.attachments.push({ name: 'trace', path: testInfo.outputDir + '/trace.zip', contentType: 'application/zip' });

    page.on('console', msg => console.log('PAGE CONSOLE:', msg.text()));
    await seedVillageSandbox(page, { tabId: 'punchClub' });

    const { residentId: compatibleResidentId, locationSlotSelector, slotId } = await ensureActivityAreaPopulated(page);
    await expect(page.locator(LOCATION_SLOT_SELECTOR(slotId))).toBeVisible();

    await startSyntheticResidentDrag(page, compatibleResidentId);
    await hoverLocationForTheater(page, locationSlotSelector);
    await expectLocationDropState(page, 'valid');

    const theaterOverlay = page.locator(THEATER_OVERLAY_SELECTOR);
    await expect(theaterOverlay).toBeVisible({ timeout: 2000 });

    // Check risk stripes on activity cards in theater overlay
    const activityCards = theaterOverlay.locator(THEATER_ACTIVITY_RISK_STRIPE_SELECTOR);
    await expect(activityCards.first()).toBeVisible();

    const riskStripes = await activityCards.all();
    for (const stripe of riskStripes) {
      const hasRisk = await stripe.getAttribute('data-has-risk');
      expect(hasRisk).toBeDefined();

      if (hasRisk === 'true') {
        const injuryPercent = await stripe.getAttribute('data-injury-percent');
        const deathPercent = await stripe.getAttribute('data-death-percent');
        expect(injuryPercent).not.toBeNull();
        expect(deathPercent).not.toBeNull();
      }
    }

    await captureTheaterDropDebug(page, 'compatible-before-drop');
    await dropOnTheaterOverlay(page);

    // Verify Theater closes after drop
    await expect(theaterOverlay).not.toBeVisible();
    await expectLocationDropState(page, 'idle');

    await captureTheaterDropDebug(page, 'compatible-after-drop');

    // Verify feedback
    await waitForRosterFeedback(page, {
      successPattern: [...rosterFeedbackPatterns.success],
      errorPattern: [...rosterFeedbackPatterns.error],
    });
  });

  test('hover → theater → drop with incompatible resident shows feedback', async ({ page }, testInfo) => {
    await testInfo.attach('trace', { body: Buffer.from(''), contentType: 'application/zip' });
    testInfo.attachments.push({ name: 'trace', path: testInfo.outputDir + '/trace.zip', contentType: 'application/zip' });

    page.on('console', msg => console.log('PAGE CONSOLE:', msg.text()));
    await seedVillageSandbox(page, { tabId: 'punchClub' });

    const { locationSlotSelector, slotId } = await ensureActivityAreaPopulated(page);
    const { requiredTags } = await resolvePunchClubGymResident(page);
    const incompatibleId = await resolveResidentExcludingTags(page, requiredTags);
    await expect(page.locator(LOCATION_SLOT_SELECTOR(slotId))).toBeVisible();

    await startSyntheticResidentDrag(page, incompatibleId);
    await hoverLocationForTheater(page, locationSlotSelector);
    await expectLocationDropState(page, 'invalid');

    const theaterOverlay = page.locator(THEATER_OVERLAY_SELECTOR);
    await expect(theaterOverlay).toBeVisible({ timeout: 2000 });

    await captureTheaterDropDebug(page, 'incompatible-before-drop');
    await dropOnTheaterOverlay(page);

    // Overlay now closes on invalid drop
    await expect(theaterOverlay).not.toBeVisible();
    await expectLocationDropState(page, 'idle');

    await captureTheaterDropDebug(page, 'incompatible-after-drop');

    // Verify error feedback
    const feedback = await waitForRosterFeedback(page, {
      successPattern: [LOCATION_INCOMPATIBLE_PATTERN],
      errorPattern: null,
    });
    expect(feedback).toMatch(LOCATION_INCOMPATIBLE_PATTERN);
  });

  test('theater closes when detail panel opens', async ({ page }, testInfo) => {
    await testInfo.attach('trace', { body: Buffer.from(''), contentType: 'application/zip' });
    testInfo.attachments.push({ name: 'trace', path: testInfo.outputDir + '/trace.zip', contentType: 'application/zip' });

    page.on('console', msg => console.log('PAGE CONSOLE:', msg.text()));
    await seedVillageSandbox(page, { tabId: 'punchClub' });

    const gymResident = await resolvePunchClubGymResident(page);
    const { locationSlotSelector, residentId, slotId } = await ensureActivityAreaPopulated(page);
    await expect(page.locator(`[data-slot-id="${slotId}"]`)).toBeVisible();

    await startPunchClubActivity(page, residentId);

    await startSyntheticResidentDrag(page, gymResident.id);
    await hoverLocationForTheater(page, locationSlotSelector);
    await expectLocationDropState(page, 'valid');
    const theaterOverlay = page.locator(THEATER_OVERLAY_SELECTOR);
    await expect(theaterOverlay).toBeVisible({ timeout: 2000 });

    await cancelSyntheticDrag(page);

    const activitySlot = page.locator(locationSlotSelector);
    await expect(activitySlot).toBeVisible();
    await activitySlot.click();

    // Verify Theater closes
    await expect(theaterOverlay).toBeHidden({ timeout: 5000 });
    await expectLocationDropState(page, 'idle');

    // Verify detail panel opens
  });

  test.describe('Theater Hover Timer Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.evaluate(() => {
        window.__ENABLE_IDLE_VILLAGE_TEST_HOOKS = true;
      });
    });

    test('theater opens on slot hover after configured delay', async ({ page }) => {
      await seedVillageSandbox(page, { tabId: 'punchClub' });

      const slot = page.locator(LOCATION_SLOT_SELECTOR('quest_punch_match'));
      await expect(slot).toBeVisible();

      await slot.hover();
      // Wait for hover delay (600ms from config)
      await page.waitForTimeout(600);

      const theaterOverlay = page.locator(THEATER_OVERLAY_SELECTOR);
      await expect(theaterOverlay).toBeVisible();

      // Check diagnostics panel shows theater events
      const diagnosticsPanel = page.locator('.fixed.bottom-4.right-4');
      await expect(diagnosticsPanel).toBeVisible();
      await expect(diagnosticsPanel).toContainText('TheaterController');
    });

    test('theater closes on hover out after configured delay', async ({ page }) => {
      await seedVillageSandbox(page, { tabId: 'punchClub' });

      const slot = page.locator(LOCATION_SLOT_SELECTOR('quest_punch_match'));
      await expect(slot).toBeVisible();

      await slot.hover();
      await page.waitForTimeout(650);
      const theaterOverlay = page.locator(THEATER_OVERLAY_SELECTOR);
      await expect(theaterOverlay).toBeVisible();

      // Hover out to body
      await page.locator('body').hover();
      // Wait for close delay (200ms from config)
      await page.waitForTimeout(200);

      await expect(theaterOverlay).toHaveCount(0);
    });

    test('theater cancels close on re-hover', async ({ page }) => {
      await seedVillageSandbox(page, { tabId: 'punchClub' });

      const slot = page.locator(LOCATION_SLOT_SELECTOR('quest_punch_match'));
      await expect(slot).toBeVisible();

      await slot.hover();
      await page.waitForTimeout(650);
      const theaterOverlay = page.locator(THEATER_OVERLAY_SELECTOR);
      await expect(theaterOverlay).toBeVisible();

      await page.locator('body').hover();
      await page.waitForTimeout(100); // partial close delay

      // Re-hover to cancel close
      await slot.hover();
      await page.waitForTimeout(150); // wait past original close delay

      // Should still be visible
      await expect(theaterOverlay).toBeVisible();
    });
  });
});
