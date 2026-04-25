import { test, expect } from '@playwright/test';
import { navigateToVillageSandbox } from './fixtures/villageSandbox';

const isMobileProject = (useConfig?: Record<string, unknown>) => Boolean(useConfig?.isMobile);

test.describe('VillageSandbox Layout', () => {
  test('displays sticky header, resource pills, and two-column layout on desktop', async ({ page }) => {
    await navigateToVillageSandbox(page);

    const layout = page.getByTestId('village-sandbox-layout');
    await expect(layout).toBeVisible();

    const header = page.getByTestId('village-sandbox-header');
    await expect(header).toBeVisible();
    await expect(header).toHaveCSS('position', 'sticky');
    await expect(header.getByRole('heading', { name: /Village Sandbox/i })).toBeVisible();

    const summaryStrips = header.locator('[data-testid="summary-strip"]');
    await expect(summaryStrips.first()).toBeVisible();
    await expect(summaryStrips.first().getByText('🪙')).toBeVisible();
    await expect(summaryStrips.first().getByText('🍖')).toBeVisible();
    await expect(summaryStrips.first().getByText('👥')).toBeVisible();

    const resetButton = header.getByRole('button', { name: /reset/i });
    await expect(resetButton).toBeVisible();
    await expect(resetButton).toBeEnabled();

    const columns = page.getByTestId('village-sandbox-columns');
    await expect(columns).toBeVisible();
    await expect(columns.locator('> div')).toHaveCount(2);
    await expect(page.getByTestId('village-sandbox-left-column')).toBeVisible();
    await expect(page.getByTestId('village-sandbox-right-column')).toBeVisible();

    const activeHud = page.getByTestId('active-hud');
    await expect(activeHud).toBeVisible();
    await expect(activeHud).toHaveAttribute('data-variant', 'default');

    const resourcePanel = page.getByTestId('resource-panel');
    await expect(resourcePanel).toBeVisible();
  });

  test('shows mobile summary strip when viewport is mobile', async ({ page }, testInfo) => {
    const isMobile = isMobileProject(testInfo.project.use);
    test.skip(!isMobile, 'requires mobile viewport');

    await navigateToVillageSandbox(page);

    const header = page.getByTestId('village-sandbox-header');
    const mobileSummary = header.locator('.md\\:hidden').first();
    await expect(mobileSummary).toBeVisible();

    const mobileStrip = mobileSummary.locator('[data-testid="summary-strip"]');
    await expect(mobileStrip).toBeVisible();
    await expect(mobileStrip.getByText('🪙')).toBeVisible();
    await expect(mobileStrip.getByText('🍖')).toBeVisible();
    await expect(mobileStrip.getByText('👥')).toBeVisible();
  });

  test('reset button is accessible and clickable', async ({ page }) => {
    await navigateToVillageSandbox(page);

    const resetButton = page.getByRole('button', { name: /reset/i });
    await expect(resetButton).toBeVisible();
    await expect(resetButton).toBeEnabled();
    await resetButton.click({ trial: true });
  });

  test('stacked layout on mobile: proper DOM order and spacing', async ({ page }, testInfo) => {
    const isMobile = isMobileProject(testInfo.project.use);
    test.skip(!isMobile, 'requires mobile viewport');

    await navigateToVillageSandbox(page);

    // Verify layout is stacked
    const columns = page.getByTestId('village-sandbox-columns-stacked');
    await expect(columns).toBeVisible();

    // Verify left column comes first
    const leftColumn = page.getByTestId('village-sandbox-left-column');
    const rightColumn = page.getByTestId('village-sandbox-right-column');

    await expect(leftColumn).toBeVisible();
    await expect(rightColumn).toBeVisible();

    // Check DOM order: left before right in flex col
    const leftRect = await leftColumn.boundingBox();
    const rightRect = await rightColumn.boundingBox();
    expect(leftRect!.y).toBeLessThan(rightRect!.y);

    // Check spacing (gap-2 = 8px)
    const gap = rightRect!.y - (leftRect!.y + leftRect!.height);
    expect(gap).toBeGreaterThanOrEqual(6); // Allow some tolerance
    expect(gap).toBeLessThanOrEqual(12);

    // Verify section headings are present
    await expect(page.getByRole('heading', { name: /roster/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /hud/i })).toBeVisible();
  });
});
