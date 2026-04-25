import { test, expect, type Page } from '@playwright/test';
import { navigateToVillageSandbox, autoEnableTestHooks } from './fixtures/villageSandbox';
import {
  seedTradeRouteScenario,
  clearTradeAndMigrationState,
  executeTradeRoute,
  expectTradeResult,
  expectMigrationQueueState,
  processMigrationTick,
  getTradeRouteCard,
} from './utils/villageSandboxTrade';

test.describe('Village Sandbox Trade & Migration (WS6.1)', () => {
  type TradeScenarioSeed = Awaited<ReturnType<typeof seedTradeRouteScenario>>;
  let seededScenario: TradeScenarioSeed | null = null;

  test.beforeEach(async ({ page }) => {
    await autoEnableTestHooks(page);
    await navigateToVillageSandbox(page);
    seededScenario = await seedTradeRouteScenario(page);
  });

  const requireScenario = (): TradeScenarioSeed => {
    if (!seededScenario) {
      throw new Error('Trade scenario not initialized');
    }
    return seededScenario;
  };

  const getTradePanelHeading = (page: Page) =>
    page.getByTestId('trade-route-panel').getByRole('heading', { name: 'Trade Routes' });

  test('executes deterministic success route without risk warnings', async ({ page }) => {
    await expect(getTradePanelHeading(page)).toBeVisible();

    const { tradeRoutes } = requireScenario();
    const successRoute = tradeRoutes.find(route => route.risk === 0);
    if (!successRoute) {
      throw new Error('Missing deterministic success route in scenario');
    }

    await test.step('execute guaranteed-success route', async () => {
      await executeTradeRoute(page, successRoute.id);
    });

    await expect(getTradeRouteCard(page, successRoute.id)).toContainText(
      `${successRoute.fromVillageId} → ${successRoute.toVillageId}`,
    );

    await expectTradeResult(page, { sent: '20 gold', received: '15 wood' });
  });

  test('surfacing risk event for deterministic failure route', async ({ page }) => {
    await expect(getTradePanelHeading(page)).toBeVisible();

    const { tradeRoutes } = requireScenario();
    const failureRoute = tradeRoutes.find(route => route.risk === 1);
    if (!failureRoute) {
      throw new Error('Missing deterministic failure route in scenario');
    }

    await test.step('execute guaranteed-failure route', async () => {
      await executeTradeRoute(page, failureRoute.id);
    });

    await expect(getTradeRouteCard(page, failureRoute.id)).toContainText(
      `${failureRoute.fromVillageId} → ${failureRoute.toVillageId}`,
    );

    await expectTradeResult(page, {
      sent: '30 wood',
      received: '25 gold',
      warningText: '⚠️ Trade caravan was ambushed',
    });
  });

  const getMigrationPanelHeading = (page: Page) =>
    page.getByTestId('migration-queue-panel').getByRole('heading', { name: 'Migration Queue' });

  test('renders seeded migration queue with progress details', async ({ page }) => {
    await expect(getMigrationPanelHeading(page)).toBeVisible();

    await expectMigrationQueueState(page, [
      { residentId: 'ws11-resident-1', timeRemaining: 3 },
      { residentId: 'ws11-resident-2', timeRemaining: 1 },
    ]);

    const progressBars = page.locator('.w-16.h-2.bg-blue-500');
    await expect(progressBars).toHaveCount(2);
  });

  test('processing migration ticks updates progress + counts', async ({ page }) => {
    await expectMigrationQueueState(page, [
      { residentId: 'ws11-resident-1', timeRemaining: 3 },
      { residentId: 'ws11-resident-2', timeRemaining: 1 },
    ]);

    await test.step('advance one tick', async () => {
      await processMigrationTick(page);
    });
    await expectMigrationQueueState(page, [{ residentId: 'ws11-resident-1', timeRemaining: 2 }]);

    await test.step('complete final migration', async () => {
      await processMigrationTick(page);
    });

    await expectMigrationQueueState(page, []);
  });

  test('reset clears seeded data and allows reseed', async ({ page }) => {
    const resetButton = page.getByRole('button', { name: /^Reset$/i });
    await expect(resetButton).toBeVisible();

    await test.step('trigger reset and validate empty state', async () => {
      await clearTradeAndMigrationState(page);
      await resetButton.click();
      await expect(page.getByText('No trade routes created yet')).toBeVisible();
      await expect(page.getByText('No pending migrations')).toBeVisible();
    });

    await test.step('re-enter sandbox to restore hooks after reset', async () => {
      await navigateToVillageSandbox(page);
    });

    await clearTradeAndMigrationState(page);
    await seedTradeRouteScenario(page);
    await expect(getTradeRouteCard(page, 'ws6-trade-route-success')).toContainText('village-alpha → village-beta');
    await expectMigrationQueueState(page, [
      { residentId: 'ws11-resident-1', timeRemaining: 3 },
      { residentId: 'ws11-resident-2', timeRemaining: 1 },
    ]);
  });
});
