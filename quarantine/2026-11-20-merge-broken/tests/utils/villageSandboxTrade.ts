import { expect, type Locator, type Page } from '@playwright/test';
import type { MigrationRequest, TradeRoute, TradeResult } from '../../src/ui/idleVillage/state/VillageRegistry';
import { navigateToVillageSandbox } from '../fixtures/villageSandbox';

export interface TradeScenarioConfig {
  /**
   * Custom trade routes to seed. Defaults to the canonical two-route scenario
   * (one guaranteed success, one guaranteed failure for risk messaging).
   */
  tradeRoutes?: TradeRoute[];
  /**
   * Custom migration requests to seed. Defaults to two queued migrations with
   * different progress states to exercise the HUD.
   */
  migrationQueue?: MigrationRequest[];
  /**
   * When true the helper also runs the navigation flow before seeding.
   * Use this for standalone usage outside of a navigateToVillageSandbox call.
   */
  navigateFirst?: boolean;
}

const DEFAULT_TRADE_ROUTES: TradeRoute[] = [
  {
    id: 'ws6-trade-route-success',
    fromVillageId: 'village-alpha',
    toVillageId: 'village-beta',
    sendResources: { gold: 20 },
    receiveResources: { wood: 15 },
    duration: 2,
    risk: 0, // deterministic success
  },
  {
    id: 'ws6-trade-route-failure',
    fromVillageId: 'village-beta',
    toVillageId: 'village-alpha',
    sendResources: { wood: 30 },
    receiveResources: { gold: 25 },
    duration: 3,
    risk: 1, // deterministic failure for risk messaging
  },
];

const DEFAULT_MIGRATION_QUEUE: MigrationRequest[] = [
  {
    id: 'ws6-migration-1',
    residentId: 'ws11-resident-1',
    fromVillageId: 'village-alpha',
    toVillageId: 'village-beta',
    timeRemaining: 3,
    costPaid: { gold: 10 },
  },
  {
    id: 'ws6-migration-2',
    residentId: 'ws11-resident-2',
    fromVillageId: 'village-beta',
    toVillageId: 'village-alpha',
    timeRemaining: 1,
    costPaid: { gold: 10 },
  },
];

/**
 * Returns the stable test id used for a trade route card.
 */
export const getTradeRouteCardTestId = (routeId: string): string => `trade-route-card-${routeId}`;

/**
 * Convenience helper to retrieve a specific trade route card locator.
 */
export const getTradeRouteCard = (page: Page, routeId: string): Locator => page.getByTestId(getTradeRouteCardTestId(routeId));

/**
 * Seeds the Village Sandbox with deterministic trade routes + migration queue.
 * Returns the payload injected so tests can assert against the exact values.
 */
interface TradeRoutesSnapshot {
  tradeRoutes: TradeRoute[];
  migrationQueue: MigrationRequest[];
  lastTradeResult: TradeResult | null;
}

async function getTradeRoutesSnapshot(page: Page): Promise<TradeRoutesSnapshot> {
  return page.evaluate(() => {
    const hooks = window.__idleVillageTestHooks;
    if (!hooks?.getTradeRoutesSnapshot) {
      throw new Error('Trade route snapshot hook not available');
    }
    return hooks.getTradeRoutesSnapshot();
  });
}

/**
 * Waits until the trade seeding hooks are available and the UI buttons needed for
 * trade execution/migration processing are rendered.
 */
export async function waitForTradeSeedReady(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      Boolean(
        window.__idleVillageReady === true &&
          document.querySelector<HTMLElement>('[data-testid="ancillary-panels"]') &&
          window.__idleVillageTestHooks?.seedTradeRoutes &&
          window.__idleVillageTestHooks?.seedMigrationQueue &&
          window.__idleVillageTestHooks?.getTradeRoutesSnapshot,
      ),
    undefined,
    { timeout: 20_000 },
  );
}

export async function seedTradeRouteScenario(
  page: Page,
  config: TradeScenarioConfig = {},
): Promise<{ tradeRoutes: TradeRoute[]; migrationQueue: MigrationRequest[] }> {
  const {
    tradeRoutes = DEFAULT_TRADE_ROUTES,
    migrationQueue = DEFAULT_MIGRATION_QUEUE,
    navigateFirst = false,
  } = config;

  if (navigateFirst) {
    await navigateToVillageSandbox(page);
  }

  await expect(page.getByTestId('village-sandbox-header')).toBeVisible({ timeout: 20_000 });
  await page.waitForFunction(
    () =>
      Boolean(
        window.__idleVillageReady === true &&
          document.querySelector<HTMLElement>('[data-testid="trade-route-panel"]'),
      ),
    undefined,
    { timeout: 20_000 },
  );

  await page.waitForFunction(
    () =>
      Boolean(
        window.__idleVillageTestHooks?.seedTradeRoutes &&
          window.__idleVillageTestHooks?.seedMigrationQueue &&
          window.__idleVillageTestHooks?.getTradeRoutesSnapshot,
      ),
    undefined,
    { timeout: 20_000 },
  );

  await page.evaluate(
    ({ routes, migrations }) => {
      const hooks = window.__idleVillageTestHooks;
      if (!hooks?.seedTradeRoutes || !hooks?.seedMigrationQueue) {
        throw new Error('IdleVillage test hooks unavailable (seedTradeRouteScenario)');
      }
      hooks.seedTradeRoutes(routes);
      console.log('[seedTradeRouteScenario] seeded trade routes', routes.map((route) => route.id));
      hooks.seedMigrationQueue(migrations);
    },
    { routes: tradeRoutes, migrations: migrationQueue },
  );

  await page.waitForFunction(
    ({ routesCount, migrationsCount }) => {
      const hooks = window.__idleVillageTestHooks;
      if (!hooks?.getTradeRoutesSnapshot) {
        return false;
      }
      const snapshot = hooks.getTradeRoutesSnapshot();
      return snapshot.tradeRoutes.length >= routesCount && snapshot.migrationQueue.length >= migrationsCount;
    },
    { routesCount: tradeRoutes.length, migrationsCount: migrationQueue.length },
    { timeout: 20_000 },
  );

  await page.waitForFunction(
    ({ expectedCount }) => document.querySelectorAll('[data-testid^="trade-route-card-"]').length === expectedCount,
    { expectedCount: tradeRoutes.length },
    { timeout: 20_000 },
  );
  await page.waitForSelector('[data-testid="trade-route-panel"] button[aria-label^="Execute trade route"]', {
    state: 'visible',
    timeout: 20_000,
  });

  const snapshot = await getTradeRoutesSnapshot(page);
  expect(snapshot.tradeRoutes.length).toBeGreaterThanOrEqual(tradeRoutes.length);
  expect(snapshot.migrationQueue.length).toBeGreaterThanOrEqual(migrationQueue.length);

  for (const route of tradeRoutes) {
    await page.waitForFunction(
      (routeId) => {
        const card = document.querySelector<HTMLElement>(`[data-testid="trade-route-card-${routeId}"]`);
        return Boolean(card && card.offsetParent);
      },
      route.id,
      { timeout: 20_000 },
    );
  }

  return { tradeRoutes, migrationQueue };
}

/**
 * Clears every seeded trade route / migration entry. Handy for reset assertions.
 */
export async function clearTradeAndMigrationState(page: Page): Promise<void> {
  await page.waitForFunction(
    () => Boolean(window.__idleVillageTestHooks?.seedTradeRoutes && window.__idleVillageTestHooks?.seedMigrationQueue),
    undefined,
    { timeout: 20_000 },
  );

  await page.evaluate(() => {
    const hooks = window.__idleVillageTestHooks;
    hooks?.seedTradeRoutes?.([]);
    hooks?.seedMigrationQueue?.([]);
  });
}

/**
 * Executes the trade route with the provided identifier and waits for the trade result HUD.
 */
export async function executeTradeRoute(page: Page, routeId: string): Promise<void> {
  const routeCard = getTradeRouteCard(page, routeId);
  await expect(routeCard).toBeVisible({ timeout: 20_000 });

  const executeButton = routeCard.getByRole('button', { name: /^Execute$/i });
  await expect(executeButton).toBeVisible();
  await executeButton.click();
  await expect(page.getByText('Last Trade Result')).toBeVisible();
}

/**
 * Small helper to assert the trade result payload rendered in the HUD.
 */
export async function expectTradeResult(
  page: Page,
  expectation: { sent: string; received: string; warningText?: string },
): Promise<void> {
  await expect(page.getByText(`Sent: ${expectation.sent}`)).toBeVisible();
  await expect(page.getByText(`Received: ${expectation.received}`)).toBeVisible();
  if (expectation.warningText) {
    await expect(page.getByText(expectation.warningText)).toBeVisible();
  } else {
    await expect(page.getByText('⚠️')).toHaveCount(0);
  }
}

/**
 * Clicks the Process Tick button once and waits until the HUD reflects the change.
 */
export async function processMigrationTick(page: Page): Promise<void> {
  const processButton = page.getByTestId('migration-process-tick');
  await expect(processButton).toBeEnabled({ timeout: 20_000 });
  await processButton.click();
}

interface MigrationExpectation {
  residentId: string;
  timeRemaining: number;
}

/**
 * Ensures the migration HUD lists the expected residents and summary count.
 */
export async function expectMigrationQueueState(
  page: Page,
  expectations: MigrationExpectation[],
): Promise<void> {
  const panel = page.getByTestId('migration-queue-panel');
  await expect(panel).toBeVisible({ timeout: 20_000 });

  const summaryText =
    expectations.length === 0
      ? 'No pending migrations'
      : `${expectations.length} migration${expectations.length === 1 ? '' : 's'} in queue`;

  const summary = panel.getByTestId('migration-queue-summary');

  if (expectations.length === 0) {
    const emptyState = panel.getByTestId('migration-empty-state');
    await expect(emptyState).toBeVisible({ timeout: 20_000 });
    await expect(emptyState).toContainText(summaryText, { timeout: 20_000 });
    await expect(summary).toHaveCount(0);
  } else {
    await expect(summary).toBeVisible({ timeout: 20_000 });
    await expect(summary).toContainText(summaryText, { timeout: 20_000 });
  }

  for (const { residentId, timeRemaining } of expectations) {
    const residentLocator = panel.getByText(`Resident: ${residentId}`, { exact: false });
    await expect(residentLocator).toBeVisible({ timeout: 20_000 });

    const timeRemainingLocator = panel.getByText(`Time remaining: ${timeRemaining} TU`, { exact: false });
    await expect(timeRemainingLocator).toBeVisible({ timeout: 20_000 });
  }
}
