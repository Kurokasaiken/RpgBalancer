import { test, expect } from '@playwright/test';

test.describe('Minimal Job POI Roster Time Integration Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/minimal-job-poi-roster-time-integration');
  });

  test('should render the integration page', async ({ page }) => {
    await expect(page.getByText('Fase 6: Job POI + Roster + Time Engine + Rewards')).toBeVisible();
    await expect(page.getByText('Integrazione completa con time engine e visualizzazione reward automatici')).toBeVisible();
    await expect(page.getByText('📋 Integration Spec')).toBeVisible();
  });

  test('should render Job POI section', async ({ page }) => {
    await expect(page.getByText('🪓 Job: Chop Wood')).toBeVisible();
    await expect(page.getByText('ID: job_chop_wood')).toBeVisible();
    await expect(page.getByText('Level: 1')).toBeVisible();
    await expect(page.getByText('Danger Rating: 0 (Safe)')).toBeVisible();
  });

  test('should render Time Engine Controls section', async ({ page }) => {
    await expect(page.getByText('⏱️ Time Engine Controls')).toBeVisible();
    await expect(page.getByText('Speed:')).toBeVisible();
    await expect(page.getByText('Current Tick:')).toBeVisible();
    await expect(page.getByText('Paused:')).toBeVisible();
  });

  test('should render roster section', async ({ page }) => {
    await expect(page.getByText('👥 Available Residents')).toBeVisible();
    await expect(page.getByText('Total:')).toBeVisible();
    await expect(page.getByText('Available:')).toBeVisible();
    await expect(page.getByText('Assigned:')).toBeVisible();
  });

  test('should render Rewards section', async ({ page }) => {
    await expect(page.getByText('💰 Automatic Rewards')).toBeVisible();
    await expect(page.getByText('Total Rewards:')).toBeVisible();
    await expect(page.getByText('Total Wood:')).toBeVisible();
  });

  test('should render instructions', async ({ page }) => {
    await expect(page.getByText('📋 Instructions')).toBeVisible();
    await expect(page.getByText('Trascina un PgToken dal roster sul job POI')).toBeVisible();
    await expect(page.getByText('Usa i controlli Time Engine per avanzare il tempo')).toBeVisible();
    await expect(page.getByText('I reward automatici appaiono nel pannello Rewards')).toBeVisible();
  });

  test('should show speed control buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: '1x' })).toBeVisible();
    await expect(page.getByRole('button', { name: '2x' })).toBeVisible();
    await expect(page.getByRole('button', { name: '5x' })).toBeVisible();
    await expect(page.getByRole('button', { name: '10x' })).toBeVisible();
  });

  test('should show pause and advance buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Advance 1s' })).toBeVisible();
  });

  test('should show detail toggle button', async ({ page }) => {
    const showButton = page.getByRole('button', { name: 'Show Detail' });
    await expect(showButton).toBeVisible();
  });

  test('should show clear rewards button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Clear Rewards' })).toBeVisible();
  });

  test('should have draggable PgToken elements', async ({ page }) => {
    const tokens = page.locator('[data-testid^="pgtoken-"]');
    const count = await tokens.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show roster medals with names', async ({ page }) => {
    const medals = page.locator('[data-testid^="roster-medal-"]');
    const count = await medals.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should render documentation links', async ({ page }) => {
    await expect(page.getByText('📚 Documentation')).toBeVisible();
    await expect(page.getByText('Roster Trusted Components:')).toBeVisible();
    await expect(page.getByText('Time Engine Trusted:')).toBeVisible();
  });

  test('should render test coverage section', async ({ page }) => {
    await expect(page.getByText('✅ Test Coverage')).toBeVisible();
    await expect(page.getByText('Manual Verification:')).toBeVisible();
  });

  test('should show footer with phase info', async ({ page }) => {
    await expect(page.getByText('Fase 6 di 6 — Job POI + Roster + Time Engine + Rewards')).toBeVisible();
  });
});
