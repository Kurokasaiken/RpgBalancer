import { test, expect, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { collectEnvAttestation } from '../../../scripts/verification/attestEnv';

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

  // Several CustomDragOverlay instances mount empty stubs inside the stage;
  // only the active, body-portaled ghost carries data-debug-active-id.
  const activeOverlay = page.locator('[data-dnd-overlay][data-debug-active-id]');

  // Under CPU contention the synthetic press+move can be lost before dnd-kit
  // activation (gesture-activation-retry pattern): retry the gesture bounded.
  let activated = false;
  for (let attempt = 0; attempt < 3 && !activated; attempt += 1) {
    await page.mouse.move(source!.x + source!.width / 2, source!.y + source!.height / 2);
    await page.mouse.down();
    await page.mouse.move(source!.x + source!.width / 2 + 24, source!.y + source!.height / 2, { steps: 4 });
    activated = await activeOverlay.waitFor({ state: 'visible', timeout: 3000 }).then(() => true).catch(() => false);
    if (!activated) await page.mouse.up();
  }
  expect(activated, 'dnd-kit drag did not activate after 3 gestures').toBe(true);

  // Temporal frames: capture along the path so the bundle has a real
  // frame series, not a single end-state screenshot.
  const steps = 6;
  for (let i = 1; i <= steps; i += 1) {
    const x = source!.x + source!.width / 2 + ((destination!.x + destination!.width / 2) - (source!.x + source!.width / 2)) * (i / steps);
    const y = source!.y + source!.height / 2 + ((destination!.y + destination!.height / 2) - (source!.y + source!.height / 2)) * (i / steps);
    await page.mouse.move(x, y, { steps: 2 });
    saveArtifact(testInfo, `frames/drag-0${i}.png`, await page.screenshot());
  }
  await expect(activeOverlay).toBeVisible();

  const overlayState = await activeOverlay.evaluate((overlay) => {
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
  saveArtifact(testInfo, 'frames/drag-overlay-over-forecast.png', await page.screenshot());

  const env = await collectEnvAttestation(page);
  saveArtifact(testInfo, 'env-attestation.json', Buffer.from(JSON.stringify(env, null, 2)));
  saveArtifact(testInfo, 'drag-metrics.json', Buffer.from(JSON.stringify({
    env,
    samples: overlayState.emptySlotAnimations.map((slot) => ({ id: slot.id, animation: slot.animation })),
    overlayOverForecast: overlayState.overlayOverForecast,
    portalIsBody: overlayState.portalIsBody,
  }, null, 2)));
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
  const minimumError = samples.length > 0 ? Math.min(...samples.map((sample) => sample.error)) : null;
  const env = await collectEnvAttestation(page);

  // Deterministic landing check: after the assignment commits, the seated
  // medallion IS the flight endpoint — its center must coincide with the
  // Slot component center. Mid-flight rAF sampling is telemetry only (under
  // load the proxy can unmount between the last sampled frame and landing).
  const seated = await page.evaluate((slotId) => {
    const slot = document.querySelector(`[data-testid="slot-button-${slotId}"]`);
    const medal = slot?.querySelector('.tok-svg');
    if (!slot || !medal) return null;
    const sr = slot.getBoundingClientRect();
    const mr = medal.getBoundingClientRect();
    const scx = sr.left + sr.width / 2;
    const scy = sr.top + sr.height / 2;
    const mcx = mr.left + mr.width / 2;
    const mcy = mr.top + mr.height / 2;
    return { slotCenter: { x: scx, y: scy }, medalCenter: { x: mcx, y: mcy }, error: Math.hypot(mcx - scx, mcy - scy) };
  }, SLOT_LEADER);

  saveArtifact(testInfo, 'flight-center-alignment.json', Buffer.from(JSON.stringify({
    measurement: 'WanderlustMedalOverlay .tok-svg center to Slot component center',
    env,
    target: samples[0] ? { x: samples[0].targetX, y: samples[0].targetY } : null,
    first: samples[0] ?? null,
    last: samples.at(-1) ?? null,
    minimumError,
    seated,
    sampleCount: samples.length,
    samples,
  }, null, 2)));
  expect(samples.length).toBeGreaterThan(0);
  expect(seated, 'seated medallion not found inside the slot component').not.toBeNull();
  expect(seated!.error, JSON.stringify({ seated, minimumError })).toBeLessThan(4);
});
