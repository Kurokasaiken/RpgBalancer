import { test, expect, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const POI = 'poi-goblin';
const SLOT_LEADER = `${POI}:goblin-slot-leader`;
const RESIDENT = 'hero-giggiolillo';

interface QuestHookWindow extends Window {
  __idleVillageTestHooks?: {
    expedition?: Record<string, {
      openDetail?: () => void;
      getAssignments?: () => Record<string, string | null>;
    }>;
    revealQuestPois?: () => void;
  };
  __questFlightSamples?: Array<{ x: number; y: number; targetX: number; targetY: number; error: number }>;
}

const expedition = async (page: Page, action: 'openDetail' | 'getAssignments') =>
  page.evaluate(
    ({ poiId, method }) => {
      const hook = (window as QuestHookWindow).__idleVillageTestHooks?.expedition?.[poiId]?.[method];
      if (!hook) throw new Error(`Missing expedition hook ${method} for ${poiId}`);
      return hook();
    },
    { poiId: POI, method: action },
  );

const saveArtifact = (testInfo: TestInfo, filename: string, bytes: Buffer) => {
  const runDir = process.env.RUN_DIR;
  const output = runDir
    ? path.join(runDir, filename)
    : testInfo.outputPath(filename);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, bytes);
};

test.use({ viewport: { width: 1280, height: 800 } });

test.beforeEach(async ({ page }) => {
  await page.goto('/game');
  await page.waitForSelector('[data-testid="game-boot-screen"]', { state: 'detached', timeout: 60_000 });
  await page.waitForFunction(
    (poiId) => Boolean((window as QuestHookWindow).__idleVillageTestHooks?.expedition?.[poiId]),
    POI,
    { timeout: 30_000 },
  );
  await page.keyboard.press('r');
  await expect(page.locator('[data-testid="drag-test-container"], [data-testid="resident-roster-panel"]').first()).toBeVisible({
    timeout: 15_000,
  });
  await expedition(page, 'openDetail');
  await expect(page.getByTestId('quest-expedition-detail')).toBeVisible();
});

test('empty slots stay static and the dragged medallion remains above Forecast', async ({ page }, testInfo) => {
  const resident = page.locator(`[data-resident-id="${RESIDENT}"]`).first();
  const forecast = page.getByTestId('quest-expedition-forecast-column');
  const source = await resident.boundingBox();
  const destination = await forecast.boundingBox();
  expect(source).not.toBeNull();
  expect(destination).not.toBeNull();

  await page.mouse.move(source!.x + source!.width / 2, source!.y + source!.height / 2);
  await page.mouse.down();
  await page.mouse.move(source!.x + source!.width / 2 + 24, source!.y + source!.height / 2, { steps: 3 });
  await expect(page.locator('[data-dnd-overlay]')).toBeVisible();
  await page.mouse.move(destination!.x + destination!.width / 2, destination!.y + destination!.height / 2, { steps: 10 });
  await expect(page.locator('[data-dnd-overlay]')).toBeVisible();

  const overlayState = await page.locator('[data-dnd-overlay]').evaluate((overlay) => {
    let ancestor: HTMLElement | null = overlay as HTMLElement;
    while (ancestor && ancestor !== document.body) ancestor = ancestor.parentElement;
    const box = overlay.getBoundingClientRect();
    const forecast = document.querySelector('[data-testid="quest-expedition-forecast-column"]')!.getBoundingClientRect();
    const slots = Array.from(document.querySelectorAll('[data-testid^="slot-button-"]'))
      .filter((slot) => slot.closest('[data-slot-id]')?.getAttribute('data-drop-state') !== 'locked')
      .map((slot) => ({
        id: slot.getAttribute('data-testid'),
        animation: getComputedStyle(slot).animationName,
      }));
    return {
      portalIsBody: ancestor === document.body,
      overlayOverForecast: box.left < forecast.right && box.right > forecast.left && box.top < forecast.bottom && box.bottom > forecast.top,
      emptySlotAnimations: slots,
    };
  });

  expect(overlayState.portalIsBody).toBe(true);
  expect(overlayState.overlayOverForecast).toBe(true);
  expect(overlayState.emptySlotAnimations.every((slot) => slot.animation === 'none')).toBe(true);
  saveArtifact(testInfo, 'drag-overlay-over-forecast.png', await page.screenshot());
  await page.mouse.up();
});

test('click-to-assign flight converges on the actual Slot center', async ({ page }, testInfo) => {
  await page.evaluate((slotId) => {
    const target = document.querySelector(`[data-testid="slot-button-${slotId}"]`);
    if (!target) throw new Error(`Slot component not mounted: ${slotId}`);
    const rect = target.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;
    const samples: NonNullable<QuestHookWindow['__questFlightSamples']> = [];
    (window as QuestHookWindow).__questFlightSamples = samples;

    const sample = () => {
      const flight = document.querySelector('[data-testid="flight-proxy"]');
      if (flight) {
        const medal = flight.querySelector('.tok-svg') ?? flight;
        const flightRect = medal.getBoundingClientRect();
        const x = flightRect.left + flightRect.width / 2;
        const y = flightRect.top + flightRect.height / 2;
        samples.push({ x, y, targetX, targetY, error: Math.hypot(x - targetX, y - targetY) });
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }, SLOT_LEADER);

  await page.locator(`[data-resident-id="${RESIDENT}"]`).first().click();
  await page.waitForFunction(
    ({ poiId, slotId, residentId }) =>
      (window as QuestHookWindow).__idleVillageTestHooks?.expedition?.[poiId]?.getAssignments?.()[slotId] === residentId,
    { poiId: POI, slotId: SLOT_LEADER, residentId: RESIDENT },
    { timeout: 10_000 },
  );
  const samples = await page.evaluate(() => (window as QuestHookWindow).__questFlightSamples ?? []);
  const minimumError = Math.min(...samples.map((sample) => sample.error));

  saveArtifact(testInfo, 'flight-center-alignment.json', Buffer.from(JSON.stringify({
    measurement: 'WanderlustMedalOverlay .tok-svg center to Slot component center',
    target: samples[0] ? { x: samples[0].targetX, y: samples[0].targetY } : null,
    first: samples[0] ?? null,
    last: samples.at(-1) ?? null,
    minimumError,
    sampleCount: samples.length,
  }, null, 2)));
  expect(samples.length).toBeGreaterThan(0);
  expect(minimumError, JSON.stringify({ first: samples[0], last: samples.at(-1), minimumError })).toBeLessThan(4);
});
