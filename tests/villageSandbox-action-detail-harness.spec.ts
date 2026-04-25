import { test, expect } from '@playwright/test';
import {
  navigateToPunchClub,
  seedPunchClubResidents,
  assignResidentToGymSlot,
  testSetDraggingResidentIdDropState,
} from './fixtures/villageSandbox';

test.describe('ActionDetailHarness Magic Card States', () => {
  test('captures idle, valid, invalid drop states', async ({ page }) => {
    // Setup Punch Club with seeded residents
    await navigateToPunchClub(page);
    await seedPunchClubResidents(page);

    // Assign compatible resident to job slot
    await assignResidentToGymSlot(page, 'pc-trainee-1'); // Lucia "Lantern" Bassi with punch_gym tag

    // Capture idle state (no dragging)
    const idleState = await page.evaluate(() => window.__idleVillageTestHooks?.getActionDetailHarnessState?.() ?? null);
    expect(idleState).toBeTruthy();
    expect(idleState?.dropState).toBe('idle');

    await page.screenshot({ path: 'docs/ui_regressions/magic-card-idle.png', fullPage: true });
    // Save JSON
    await page.evaluate((state) => {
      // In real implementation, save to file or log
      console.log('Idle state JSON:', JSON.stringify(state, null, 2));
    }, idleState);

    // Capture valid state (dragging compatible resident)
    await testSetDraggingResidentIdDropState(page, 'pc-trainee-1', 'valid', 'compatible-drag');
    const validState = await page.evaluate(() => window.__idleVillageTestHooks?.getActionDetailHarnessState?.() ?? null);
    expect(validState?.dropState).toBe('valid');

    await page.screenshot({ path: 'docs/ui_regressions/magic-card-valid.png', fullPage: true });
    await page.evaluate((state) => {
      console.log('Valid state JSON:', JSON.stringify(state, null, 2));
    }, validState);

    // Capture invalid state (dragging incompatible resident)
    await testSetDraggingResidentIdDropState(page, 'ws11_archivist', 'invalid', 'incompatible-drag');
    const invalidState = await page.evaluate(() => window.__idleVillageTestHooks?.getActionDetailHarnessState?.() ?? null);
    expect(invalidState?.dropState).toBe('invalid');

    await page.screenshot({ path: 'docs/ui_regressions/magic-card-invalid.png', fullPage: true });
    await page.evaluate((state) => {
      console.log('Invalid state JSON:', JSON.stringify(state, null, 2));
    }, invalidState);
  });
});
