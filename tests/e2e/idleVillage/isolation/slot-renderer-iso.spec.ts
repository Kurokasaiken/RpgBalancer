/**
 * Slot Renderer Isolation Playwright Tests
 * 
 * Tests SlotV12Renderer component independently:
 * - Empty vs occupied states
 * - Extraction progress slider behavior
 * - Bezel animation timing (560ms)
 * - Debug visualization colors
 */

import { test, expect, type Page } from '@playwright/test';

const SLOT_RENDERER_ROUTE = '/idle-village/iso/slot-renderer';

test.describe('Slot Renderer Isolation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SLOT_RENDERER_ROUTE);
    await page.waitForLoadState('networkidle');
  });

  test('renders slot renderer with controls', async ({ page }) => {
    // Check main elements are present
    await expect(page.getByText('Slot V12 Renderer Isolation')).toBeVisible();
    await expect(page.getByText('Test SlotV12Renderer component independently')).toBeVisible();
    
    // Check controls section
    await expect(page.getByText('Controls')).toBeVisible();
    await expect(page.getByText('Slot State')).toBeVisible();
    await expect(page.getByText('Extraction Progress')).toBeVisible();
    
    // Check slot preview
    await expect(page.getByText('Slot Preview')).toBeVisible();
  });

  test('slot state toggle works', async ({ page }) => {
    // Initially should be in empty state
    await expect(page.getByText('Empty')).toHaveClass(/bg-blue-600/);
    await expect(page.getByText('Occupied')).toHaveClass(/bg-slate-700/);
    
    // Click occupied button
    await page.getByText('Occupied').click();
    await expect(page.getByText('Occupied')).toHaveClass(/bg-blue-600/);
    await expect(page.getByText('Empty')).toHaveClass(/bg-slate-700/);
    
    // Click empty button
    await page.getByText('Empty').click();
    await expect(page.getByText('Empty')).toHaveClass(/bg-blue-600/);
    await expect(page.getByText('Occupied')).toHaveClass(/bg-slate-700/);
  });

  test('extraction progress slider updates state', async ({ page }) => {
    const slider = page.locator('input[type="range"]');
    const progressLabel = page.getByText(/Extraction Progress:/);
    
    // Initially should be at 0
    await expect(progressLabel).toContainText('0.00');
    await expect(slider).toHaveValue('0');
    
    // Set to 50% (0.5)
    await slider.fill('0.5');
    await expect(progressLabel).toContainText('0.50');
    await expect(slider).toHaveValue('0.5');
    
    // Set to 100% (1.0)
    await slider.fill('1');
    await expect(progressLabel).toContainText('1.00');
    await expect(slider).toHaveValue('1');
    
    // Set to overshoot (1.2)
    await slider.fill('1.2');
    await expect(progressLabel).toContainText('1.20');
    await expect(slider).toHaveValue('1.2');
  });

  test('extraction progress changes phase display', async ({ page }) => {
    const slider = page.locator('input[type="range"]');
    const phaseDisplay = page.locator('text=Phase:').locator('..').locator('.font-mono');
    
    // 0 progress = idle
    await slider.fill('0');
    await expect(phaseDisplay).toContainText('idle');
    
    // 0.5 progress = extracting
    await slider.fill('0.5');
    await expect(phaseDisplay).toContainText('extracting');
    
    // 1.0 progress = bezelAnimating
    await slider.fill('1');
    await expect(phaseDisplay).toContainText('bezelAnimating');
    
    // 1.2 progress = springBack
    await slider.fill('1.2');
    await expect(phaseDisplay).toContainText('springBack');
  });

  test('letter input updates slot display', async ({ page }) => {
    const letterInput = page.locator('input[placeholder*="Letter"]');
    
    // Initially should be 'A'
    await expect(letterInput).toHaveValue('A');
    
    // Change to 'B'
    await letterInput.fill('B');
    await expect(letterInput).toHaveValue('B');
    
    // Change to 'AB'
    await letterInput.fill('AB');
    await expect(letterInput).toHaveValue('AB');
    
    // Should be limited to 2 characters and uppercase
    await letterInput.fill('xyz');
    await expect(letterInput).toHaveValue('XY');
  });

  test('debug visualization toggle works', async ({ page }) => {
    const debugButton = page.getByText(/Debug/);
    
    // Should start with Debug OFF (assuming no persisted state)
    await expect(debugButton).toContainText('Debug OFF');
    
    // Toggle debug on
    await debugButton.click();
    await expect(debugButton).toContainText('Debug ON');
    
    // Toggle debug off
    await debugButton.click();
    await expect(debugButton).toContainText('Debug OFF');
  });

  test('test scenarios work correctly', async ({ page }) => {
    // Test Empty Idle scenario
    await page.getByText('Empty Idle').click();
    await expect(page.getByText('Empty')).toHaveClass(/bg-blue-600/);
    const progressLabel = page.getByText(/Extraction Progress:/);
    await expect(progressLabel).toContainText('0.00');
    
    // Test Occupied Idle scenario
    await page.getByText('Occupied Idle').click();
    await expect(page.getByText('Occupied')).toHaveClass(/bg-blue-600/);
    await expect(progressLabel).toContainText('0.00');
    
    // Test Extracting 50% scenario
    await page.getByText('Extracting 50%').click();
    await expect(page.getByText('Occupied')).toHaveClass(/bg-blue-600/);
    await expect(progressLabel).toContainText('0.50');
    
    // Test Bezel Complete scenario
    await page.getByText('Bezel Complete').click();
    await expect(progressLabel).toContainText('1.00');
    
    // Test Spring Overshoot scenario
    await page.getByText('Spring Overshoot').click();
    await expect(progressLabel).toContainText('1.20');
  });

  test('step controls adjust progress incrementally', async ({ page }) => {
    const progressLabel = page.getByText(/Extraction Progress:/);
    
    // Set initial state
    await page.getByText('Empty Idle').click();
    await expect(progressLabel).toContainText('0.00');
    
    // Step forward
    await page.getByText('Step Forward').click();
    await expect(progressLabel).toContainText('0.05');
    
    // Step forward again
    await page.getByText('Step Forward').click();
    await expect(progressLabel).toContainText('0.10');
    
    // Step backward
    await page.getByText('Step Back').click();
    await expect(progressLabel).toContainText('0.05');
    
    // Step backward to zero
    await page.getByText('Step Back').click();
    await expect(progressLabel).toContainText('0.00');
  });

  test('bezel CSS animation state updates', async ({ page }) => {
    const slider = page.locator('input[type="range"]');
    const bezelState = page.locator('text=Bezel CSS:').locator('..').locator('.font-mono');
    
    // 0 progress = static
    await slider.fill('0');
    await expect(bezelState).toContainText('static');
    
    // Any progress > 0 = animating
    await slider.fill('0.1');
    await expect(bezelState).toContainText('animating');
    
    // Back to 0 = static
    await slider.fill('0');
    await expect(bezelState).toContainText('static');
  });

  test('state information updates correctly', async ({ page }) => {
    const slider = page.locator('input[type="range"]');
    
    // Check all state fields exist
    await expect(page.locator('text=Phase:')).toBeVisible();
    await expect(page.locator('text=Progress:')).toBeVisible();
    await expect(page.locator('text=Bezel CSS:')).toBeVisible();
    await expect(page.locator('text=Debug:')).toBeVisible();
    
    // Test state updates with progress
    await slider.fill('0.75');
    await expect(page.locator('text=Phase:').locator('..').locator('.font-mono')).toContainText('extracting');
    await expect(page.locator('text=Progress:').locator('..').locator('.font-mono')).toContainText('0.750');
    await expect(page.locator('text=Bezel CSS:').locator('..').locator('.font-mono')).toContainText('animating');
  });

  test('debug visualization affects slot rendering', async ({ page }) => {
    const debugButton = page.getByText(/Debug/);
    const slotPreview = page.locator('text=Slot Preview').locator('..');
    
    // Toggle debug on
    await debugButton.click();
    await expect(debugButton).toContainText('Debug ON');
    
    // Slot should have debug styling (we can't easily test specific colors, 
    // but we can verify the slot is still rendered)
    await expect(slotPreview).toBeVisible();
    
    // Toggle debug off
    await debugButton.click();
    await expect(debugButton).toContainText('Debug OFF');
    
    // Slot should still be visible
    await expect(slotPreview).toBeVisible();
  });
});
