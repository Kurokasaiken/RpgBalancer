import { test, expect, type Page } from '@playwright/test';
import { seedVillageSandbox } from './fixtures/villageSandbox';

declare global {
  interface Window {
    __skillCheckSeedOverride?: string | (() => string | undefined);
    __skillCheckForceReseed?: (seed?: string) => void;
  }
}

const selectors = {
  pageRoot: '[data-testid="skill-check-preview-page"]',
  asterism: '[data-testid="alt-visuals-v6"]',
  rerollButton: '[data-testid="reroll-dice-button"]',
  statInputs: '[data-testid^="stat-row-"] input[type="number"]',
  activeStatsLabel: '[data-testid="skill-check-active-stats-label"]',
  statsSummaryLabel: '[data-testid="skill-check-stats-summary"] [data-testid="skill-check-active-stats-label"]',
};

async function ensureNavButtonVisible(page: Page) {
  const navButton = page.locator('[data-testid="nav-btn-skillCheckPreview"]');
  if (await navButton.isVisible().catch(() => false)) {
    return navButton.first();
  }
  const moreButton = page.locator('[data-testid="nav-btn-more"]');
  if (await moreButton.isVisible().catch(() => false)) {
    await moreButton.click();
    await page.waitForTimeout(200);
  }
  return navButton.first();
}

async function openSkillCheckPreview(page: Page, seedOverride?: string) {
  await page.waitForFunction(
    () =>
      Boolean(
        (window as {
          __appNavControls?: { setActiveTab: (tabId: string) => void; getActiveTab: () => string };
        }).__appNavControls,
      ),
    undefined,
    { timeout: 15000 },
  );
  const tabActivated = await page.evaluate(
    (seed) => {
      const win = window as typeof window & {
        __skillCheckSeedOverride?: string | (() => string | undefined);
        __appNavControls?: { setActiveTab: (tabId: string) => void };
      };
      win.__skillCheckSeedOverride = seed;
      if (win.__appNavControls?.setActiveTab) {
        win.__appNavControls.setActiveTab('skillCheckPreview');
        return true;
      }
      return false;
    },
    seedOverride,
  );
  if (!tabActivated) {
    console.warn('[SkillCheckDiagnostics] __appNavControls missing – falling back to DOM nav button');
  }
  try {
    await page.waitForFunction(
      () => window.__appNavControls?.getActiveTab?.() === 'skillCheckPreview',
      undefined,
      { timeout: 15000 },
    );
  } catch (error) {
    console.warn('[SkillCheckDiagnostics] wait for active tab timed out, invoking fallback', error);
    const navButton = await ensureNavButtonVisible(page);
    await navButton.click();
    await page.waitForFunction(
      () => window.__appNavControls?.getActiveTab?.() === 'skillCheckPreview',
      undefined,
      { timeout: 15000 },
    );
  }
  await page.waitForSelector(selectors.pageRoot, { timeout: 20000 });
  await page.waitForSelector(selectors.asterism, { timeout: 20000 });
  await waitForStatsSummary(page);
}

async function captureStatIds(page: Page) {
  return page.$$eval('[data-stat-id]', (nodes) => nodes.map((node) => (node as HTMLElement).dataset.statId ?? ''));
}

async function waitForStatsSummary(page: Page) {
  await page.locator(selectors.statsSummaryLabel).waitFor({ state: 'visible', timeout: 10000 });
}

function statsAreDifferent(first: string[], second: string[]) {
  if (first.length !== second.length) return true;
  return first.some((value, index) => value !== second[index]);
}

async function applySeedAndCapture(page: Page, seed: string, previousSnapshot?: string[]) {
  await page.evaluate((nextSeed) => {
    window.__skillCheckForceReseed?.(nextSeed);
  }, seed);
  await page.click(selectors.rerollButton);
  if (previousSnapshot && previousSnapshot.length > 0) {
    try {
      await page.waitForFunction(
        ({ statSelector, prev }) => {
          const nodes = Array.from(document.querySelectorAll(statSelector));
          if (nodes.length === 0) return false;
          const ids = nodes.map((node) => node.getAttribute('data-stat-id') ?? '');
          if (ids.length !== prev.length) return true;
          return ids.some((value, index) => value !== prev[index]);
        },
        { statSelector: '[data-stat-id]', prev: previousSnapshot },
        { timeout: 5000 },
      );
    } catch {
      // swallow timeout: fallback to capture for soft assert diagnostics
    }
  }
  await waitForStatsSummary(page);
  return captureStatIds(page);
}

async function applySkillCheckSeed(page: Page, seed: string, previousSnapshot?: string[]) {
  await page.evaluate((nextSeed) => {
    window.__skillCheckForceReseed?.(nextSeed);
  }, seed);
  return applySeedAndCapture(page, seed, previousSnapshot);
}

async function logSkillCheckPhase(page: Page, phase: string) {
  await page.evaluate((label) => {
    const win = window as {
      __idleVillageReady?: boolean;
      __appNavControls?: { getActiveTab: () => string };
      __skillCheckSeedOverride?: string | (() => string | undefined);
    };
    const activeTab = win.__appNavControls?.getActiveTab?.();
    const override =
      typeof win.__skillCheckSeedOverride === 'function'
        ? win.__skillCheckSeedOverride()
        : win.__skillCheckSeedOverride;
    console.info('[SkillCheckDiagnostics]', label, {
      url: window.location.href,
      ready: win.__idleVillageReady ?? null,
      activeTab,
      skillCheckSeedOverride: override ?? null,
      hasNavControls: Boolean(win.__appNavControls),
    });
  }, phase);
}

test.describe('Skill Check Preview V6 QA Suite', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (message) => {
      console.log(`[page:${message.type()}] ${message.text()}`);
    });
    await page.goto('/');
    await seedVillageSandbox(page, { tabId: 'map' });
    await logSkillCheckPhase(page, 'after-seed');
    await openSkillCheckPreview(page, 'seed-a');
    await logSkillCheckPhase(page, 'after-open');
  });

  test('Stat Randomness: Regenerate button generates different stat values', async ({ page }) => {
    const statsSeedA = await captureStatIds(page);

    const statsSeedB = await applySkillCheckSeed(page, 'seed-b', statsSeedA);
    const statsSeedC = await applySkillCheckSeed(page, 'seed-c', statsSeedB);

    const diffAB = statsAreDifferent(statsSeedA, statsSeedB);
    const diffBC = statsAreDifferent(statsSeedB, statsSeedC);
    const diffAC = statsAreDifferent(statsSeedA, statsSeedC);

    if (!diffAB || !diffBC || !diffAC) {
      const screenshot = await page.screenshot();
      await test.info().attach('skill-check-randomness', { body: screenshot, contentType: 'image/png' });
      await test.info().attach(
        'skill-check-randomness-data',
        {
          body: Buffer.from(
            JSON.stringify(
              { statsSeedA, statsSeedB, statsSeedC, diffAB, diffBC, diffAC },
              null,
              2,
            ),
          ),
          contentType: 'application/json',
        },
      );
    }

    expect.soft(diffAB, 'Seed B should differ from seed A').toBeTruthy();
    expect.soft(diffBC, 'Seed C should differ from seed B').toBeTruthy();
    expect.soft(diffAC, 'Seed C should differ from seed A').toBeTruthy();
  });

  test('Shake Timing: Reroll dice triggers animation without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.click(selectors.rerollButton);
    await page.waitForTimeout(5000);

    expect(errors.length).toBe(0);
    await expect(page.locator(`${selectors.asterism} canvas`)).toBeVisible();
    await expect(page.locator(selectors.rerollButton)).toBeEnabled();
  });

  test('Regression: Page loads without errors and displays expected elements', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Riavvia scena/i })).toBeVisible();
    await expect(page.locator(selectors.asterism)).toBeVisible();
    await expect(page.locator(selectors.rerollButton)).toBeVisible();
    await expect(page.locator(selectors.statInputs).first()).toBeVisible();
    await expect(page.locator(selectors.statsSummaryLabel)).toBeVisible();
  });
});
