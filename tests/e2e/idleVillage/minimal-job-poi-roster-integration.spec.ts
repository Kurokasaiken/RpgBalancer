import { test, expect } from '@playwright/test';

test.describe('Minimal Job POI Roster Integration Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/minimal-job-poi-roster-integration');
  });

  test('should render the integration page', async ({ page }) => {
    await expect(page.getByText('Fase 5: Job POI + Roster Integration')).toBeVisible();
    await expect(page.getByText('Integrazione Job POI (Chop Wood) con roster drag & drop')).toBeVisible();
    await expect(page.getByText('📋 Integration Spec')).toBeVisible();
  });

  test('should render Job POI section', async ({ page }) => {
    await expect(page.getByText('🪓 Job: Chop Wood')).toBeVisible();
    await expect(page.getByText('ID: job_chop_wood')).toBeVisible();
    await expect(page.getByText('Level: 1')).toBeVisible();
    await expect(page.getByText('Danger Rating: 0 (Safe)')).toBeVisible();
  });

  test('should render roster section', async ({ page }) => {
    await expect(page.getByText('👥 Available Residents')).toBeVisible();
    await expect(page.getByText('Total:')).toBeVisible();
    await expect(page.getByText('Available:')).toBeVisible();
    await expect(page.getByText('Assigned:')).toBeVisible();
  });

  test('should render instructions', async ({ page }) => {
    await expect(page.getByText('📋 Instructions')).toBeVisible();
    await expect(page.getByText('Trascina un PgToken dal roster sul job POI')).toBeVisible();
    await expect(page.getByText('Il bloom effect verde appare quando trascini sopra il POI')).toBeVisible();
  });

  test('should show detail toggle button', async ({ page }) => {
    const showButton = page.getByRole('button', { name: 'Show Detail' });
    await expect(showButton).toBeVisible();
  });

  test('should toggle detail view', async ({ page }) => {
    const showButton = page.getByRole('button', { name: 'Show Detail' });
    await showButton.click();
    
    const hideButton = page.getByRole('button', { name: 'Hide Detail' });
    await expect(hideButton).toBeVisible();
    
    await hideButton.click();
    await expect(showButton).toBeVisible();
  });

  test('should show drop zone when no resident assigned', async ({ page }) => {
    await expect(page.getByText('Drag a resident here to assign')).toBeVisible();
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
    await expect(page.getByText('Job Config:')).toBeVisible();
  });

  test('should render test coverage section', async ({ page }) => {
    await expect(page.getByText('✅ Test Coverage')).toBeVisible();
    await expect(page.getByText('Manual Verification:')).toBeVisible();
  });

  test('should show footer with phase info', async ({ page }) => {
    await expect(page.getByText('Fase 5 di 6 — Job POI + Roster Integration')).toBeVisible();
  });
});
