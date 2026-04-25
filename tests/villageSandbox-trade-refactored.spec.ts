import { test, expect } from '@playwright/test';
import { navigateToVillageSandbox } from './fixtures/villageSandbox';
import { seedTradeRouteScenario, clearTradeAndMigrationState } from './utils/villageSandboxTrade';

test.describe('Village Sandbox Trade & Migration (WS6.1)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate and seed with deterministic data
    await navigateToVillageSandbox(page);
    await seedTradeRouteScenario(page);
  });

  test('executes deterministic success route without risk warnings', async ({ page }) => {
    // Verify initial state
    await expect(page.getByRole('heading', { name: /Trade Routes/i })).toBeVisible();
    await expect(page.getByText('village-alpha → village-beta')).toBeVisible();

    // Execute the guaranteed-success route
    await test.step('execute guaranteed-success route', async () => {
      await page.getByRole('button', { name: /^Execute$/ }).first().click();
    });

    // Verify results
    const lastResultCard = page.getByText('Last Trade Result');
    await expect(lastResultCard).toBeVisible();
    await expect(page.getByText('Sent: 20 gold')).toBeVisible();
    await expect(page.getByText('Received: 15 wood')).toBeVisible();
    
    // Verify no risk warnings are shown
    await expect(page.getByText('⚠️')).toHaveCount(0);
  });

  test('surfaces risk event for deterministic failure route', async ({ page }) => {
    // Verify initial state
    await expect(page.getByRole('heading', { name: /Trade Routes/i })).toBeVisible();

    // Execute the guaranteed-failure route
    await test.step('execute guaranteed-failure route', async () => {
      await page.getByRole('button', { name: /^Execute$/ }).nth(1).click();
    });

    // Verify results and risk warning
    await expect(page.getByText('Sent: 30 wood')).toBeVisible();
    await expect(page.getByText('Received: 25 gold')).toBeVisible();
    await expect(page.getByText('⚠️ Trade caravan was ambushed')).toBeVisible();
  });

  test('renders seeded migration queue with progress details', async ({ page }) => {
    // Verify migration queue is visible and contains expected content
    const migrationHeading = page.getByRole('heading', { name: /Migration Queue/i });
    await expect(migrationHeading).toBeVisible();

    // Verify resident details
    await expect(page.getByText('Resident: ws11-resident-1')).toBeVisible();
    await expect(page.getByText('Time remaining: 3 TU')).toBeVisible();
    await expect(page.getByText('Resident: ws11-resident-2')).toBeVisible();
    await expect(page.getByText('Time remaining: 1 TU')).toBeVisible();
    await expect(page.getByText('2 migrations in queue')).toBeVisible();

    // Verify progress bars
    const progressBars = page.locator('.w-16.h-2.bg-blue-500');
    await expect(progressBars).toHaveCount(2);
  });

  test('processing migration ticks updates progress + counts', async ({ page }) => {
    const processButton = page.getByRole('button', { name: /Process Tick/i });
    await expect(processButton).toBeEnabled();

    // Verify initial state
    await expect(page.getByText('Time remaining: 3 TU')).toBeVisible();
    await expect(page.getByText('Time remaining: 1 TU')).toBeVisible();

    // First tick
    await test.step('advance one tick', async () => {
      await processButton.click();
      // Wait for UI to update
      await expect(page.getByText('Time remaining: 2 TU')).toBeVisible();
      await expect(page.getByText('1 migration in queue')).toBeVisible();
    });

    // Second tick to complete the first migration
    await test.step('complete final migration', async () => {
      await processButton.click();
      // Wait for UI to update
      await expect(page.getByText('No pending migrations')).toBeVisible();
      await expect(page.getByText('0 migrations in queue')).toBeVisible();
    });
  });

  test('reset clears seeded data and allows reseed', async ({ page }) => {
    const resetButton = page.getByRole('button', { name: /^Reset$/i });
    await expect(resetButton).toBeVisible();

    // Test reset functionality
    await test.step('trigger reset and validate empty state', async () => {
      await resetButton.click();
      await expect(page.getByText('No trade routes created yet')).toBeVisible();
      await expect(page.getByText('No pending migrations')).toBeVisible();
    });

    // Test re-seeding
    await test.step('reseed and verify data is restored', async () => {
      await clearTradeAndMigrationState(page);
      await seedTradeRouteScenario(page);
      await expect(page.getByText('village-alpha → village-beta')).toBeVisible();
      await expect(page.getByText('Time remaining: 3 TU')).toBeVisible();
    });
  });
});
