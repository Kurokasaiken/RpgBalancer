/**
 * Extraction Isolation Playwright Tests
 * 
 * Tests extraction animation sequence with useExtractionStateMachine:
 * - Press and hold extraction timing
 * - PG token visibility during phases
 * - Medal fade-out during bezel
 * - Spring-back animation
 * - Cancel extraction
 */

import { test, expect, type Page } from '@playwright/test';

const EXTRACTION_ROUTE = '/idle-village/iso/extraction';

test.describe('Extraction Isolation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(EXTRACTION_ROUTE);
    await page.waitForLoadState('networkidle');
  });

  test('renders extraction page with controls', async ({ page }) => {
    // Check main elements are present
    await expect(page.getByText('Extraction Isolation')).toBeVisible();
    await expect(page.getByText('Test extraction animation sequence with useExtractionStateMachine')).toBeVisible();
    
    // Check controls section
    await expect(page.getByText('Controls')).toBeVisible();
    await expect(page.getByText('Resident Assignment')).toBeVisible();
    await expect(page.getByText('Debug Visualization')).toBeVisible();
    
    // Check slot preview
    await expect(page.getByText('Slot Preview')).toBeVisible();
    await expect(page.getByText('Press and Hold to Extract')).toBeVisible();
  });

  test('resident assignment toggle works', async ({ page }) => {
    // Initially should be assigned
    await expect(page.getByText('Assigned')).toHaveClass(/bg-green-600/);
    await expect(page.getByText('Empty')).toHaveClass(/bg-slate-700/);
    
    // Click empty button
    await page.getByText('Empty').click();
    await expect(page.getByText('Empty')).toHaveClass(/bg-red-600/);
    await expect(page.getByText('Assigned')).toHaveClass(/bg-slate-700/);
    
    // Click assigned button
    await page.getByText('Assigned').click();
    await expect(page.getByText('Assigned')).toHaveClass(/bg-green-600/);
    await expect(page.getByText('Empty')).toHaveClass(/bg-slate-700/);
  });

  test('extraction state phases work correctly', async ({ page }) => {
    const phaseDisplay = page.locator('text=Phase:').locator('..').locator('.font-mono');
    
    // Initially should be idle
    await expect(phaseDisplay).toContainText('idle');
    
    // Test each phase button
    await page.getByText('Extracting').click();
    await expect(phaseDisplay).toContainText('extracting');
    
    await page.getByText('Bezel').click();
    await expect(phaseDisplay).toContainText('bezelAnimating');
    
    await page.getByText('Spring').click();
    await expect(phaseDisplay).toContainText('springBack');
    
    await page.getByText('Clearing').click();
    await expect(phaseDisplay).toContainText('clearing');
    
    // Reset button should return to idle
    await page.getByText('Reset').click();
    await expect(phaseDisplay).toContainText('idle');
  });

  test('PG token visibility changes with phase', async ({ page }) => {
    const pgTokenState = page.locator('text=PG Token:').locator('..').locator('.font-mono');
    
    // Idle phase = visible
    await page.getByText('Idle').click();
    await expect(pgTokenState).toContainText('Visible');
    await expect(pgTokenState).toHaveClass(/text-green-400/);
    
    // Extracting phase = visible
    await page.getByText('Extracting').click();
    await expect(pgTokenState).toContainText('Visible');
    await expect(pgTokenState).toHaveClass(/text-green-400/);
    
    // Bezel phase = visible
    await page.getByText('Bezel').click();
    await expect(pgTokenState).toContainText('Visible');
    await expect(pgTokenState).toHaveClass(/text-green-400/);
    
    // Spring phase = hidden
    await page.getByText('Spring').click();
    await expect(pgTokenState).toContainText('Hidden');
    await expect(pgTokenState).toHaveClass(/text-red-400/);
    
    // Clearing phase = hidden
    await page.getByText('Clearing').click();
    await expect(pgTokenState).toContainText('Hidden');
    await expect(pgTokenState).toHaveClass(/text-red-400/);
  });

  test('medal fade state changes with phase', async ({ page }) => {
    const medalState = page.locator('text=Medal Fade:').locator('..').locator('.font-mono');
    
    // Idle phase = normal
    await page.getByText('Idle').click();
    await expect(medalState).toContainText('Normal');
    await expect(medalState).toHaveClass(/text-slate-100/);
    
    // Bezel phase = fading
    await page.getByText('Bezel').click();
    await expect(medalState).toContainText('Fading');
    await expect(medalState).toHaveClass(/text-orange-400/);
    
    // Other phases = normal
    await page.getByText('Extracting').click();
    await expect(medalState).toContainText('Normal');
    await expect(medalState).toHaveClass(/text-slate-100/);
  });

  test('extraction progress updates with phase', async ({ page }) => {
    const progressDisplay = page.locator('text=Progress:').locator('..').locator('.font-mono');
    
    // Idle phase = 0
    await page.getByText('Idle').click();
    await expect(progressDisplay).toContainText('0.000');
    
    // Extracting phase = 0.5
    await page.getByText('Extracting').click();
    await expect(progressDisplay).toContainText('0.500');
    
    // Bezel phase = 1.0
    await page.getByText('Bezel').click();
    await expect(progressDisplay).toContainText('1.000');
    
    // Spring phase = 1.2
    await page.getByText('Spring').click();
    await expect(progressDisplay).toContainText('1.200');
    
    // Clearing phase = 1.0
    await page.getByText('Clearing').click();
    await expect(progressDisplay).toContainText('1.000');
  });

  test('bezel animation done state updates', async ({ page }) => {
    const bezelState = page.locator('text=Bezel Done:').locator('..').locator('.font-mono');
    
    // Before bezel completion = No
    await page.getByText('Idle').click();
    await expect(bezelState).toContainText('No');
    
    await page.getByText('Extracting').click();
    await expect(bezelState).toContainText('No');
    
    // After bezel completion = Yes
    await page.getByText('Bezel').click();
    await expect(bezelState).toContainText('Yes');
    
    await page.getByText('Spring').click();
    await expect(bezelState).toContainText('Yes');
    
    await page.getByText('Clearing').click();
    await expect(bezelState).toContainText('Yes');
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

  test('letter input updates slot display', async ({ page }) => {
    const letterInput = page.locator('input[placeholder*="Letter"]');
    
    // Initially should be 'A'
    await expect(letterInput).toHaveValue('A');
    
    // Change to 'B'
    await letterInput.fill('B');
    await expect(letterInput).toHaveValue('B');
    
    // Should be limited to 2 characters and uppercase
    await letterInput.fill('xyz');
    await expect(letterInput).toHaveValue('XY');
  });

  test('reset button restores assigned state', async ({ page }) => {
    const assignmentState = page.locator('text=Assigned:').locator('..').locator('.font-mono');
    
    // Set to empty
    await page.getByText('Empty').click();
    await expect(assignmentState).toContainText('No');
    await expect(assignmentState).toHaveClass(/text-red-400/);
    
    // Set to spring phase
    await page.getByText('Spring').click();
    await expect(page.locator('text=Phase:').locator('..').locator('.font-mono')).toContainText('springBack');
    
    // Reset should restore assigned and idle
    await page.getByText('Reset').click();
    await expect(assignmentState).toContainText('Yes');
    await expect(assignmentState).toHaveClass(/text-green-400/);
    await expect(page.locator('text=Phase:').locator('..').locator('.font-mono')).toContainText('idle');
  });

  test('state information updates correctly', async ({ page }) => {
    // Check all state fields exist
    await expect(page.locator('text=Phase:')).toBeVisible();
    await expect(page.locator('text=Progress:')).toBeVisible();
    await expect(page.locator('text=Bezel Done:')).toBeVisible();
    await expect(page.locator('text=PG Token:')).toBeVisible();
    await expect(page.locator('text=Medal Fade:')).toBeVisible();
    await expect(page.locator('text=Assigned:')).toBeVisible();
    await expect(page.locator('text=Debug:')).toBeVisible();
  });

  test('empty assignment prevents extraction', async ({ page }) => {
    // Set to empty
    await page.getByText('Empty').click();
    
    const phaseDisplay = page.locator('text=Phase:').locator('..').locator('.font-mono');
    const assignmentState = page.locator('text=Assigned:').locator('..').locator('.font-mono');
    
    // Should be empty
    await expect(assignmentState).toContainText('No');
    await expect(assignmentState).toHaveClass(/text-red-400/);
    
    // Phase controls should still work but represent empty slot
    await page.getByText('Extracting').click();
    await expect(phaseDisplay).toContainText('extracting');
    
    // PG token should be hidden (no resident)
    const pgTokenState = page.locator('text=PG Token:').locator('..').locator('.font-mono');
    await expect(pgTokenState).toContainText('Hidden');
    await expect(pgTokenState).toHaveClass(/text-red-400/);
  });

  test('all phase transitions work in sequence', async ({ page }) => {
    const phaseDisplay = page.locator('text=Phase:').locator('..').locator('.font-mono');
    const progressDisplay = page.locator('text=Progress:').locator('..').locator('.font-mono');
    const pgTokenState = page.locator('text=PG Token:').locator('..').locator('.font-mono');
    const medalState = page.locator('text=Medal Fade:').locator('..').locator('.font-mono');
    
    // Test full sequence
    await page.getByText('Idle').click();
    await expect(phaseDisplay).toContainText('idle');
    await expect(progressDisplay).toContainText('0.000');
    await expect(pgTokenState).toContainText('Visible');
    await expect(medalState).toContainText('Normal');
    
    await page.getByText('Extracting').click();
    await expect(phaseDisplay).toContainText('extracting');
    await expect(progressDisplay).toContainText('0.500');
    await expect(pgTokenState).toContainText('Visible');
    await expect(medalState).toContainText('Normal');
    
    await page.getByText('Bezel').click();
    await expect(phaseDisplay).toContainText('bezelAnimating');
    await expect(progressDisplay).toContainText('1.000');
    await expect(pgTokenState).toContainText('Visible');
    await expect(medalState).toContainText('Fading');
    
    await page.getByText('Spring').click();
    await expect(phaseDisplay).toContainText('springBack');
    await expect(progressDisplay).toContainText('1.200');
    await expect(pgTokenState).toContainText('Hidden');
    await expect(medalState).toContainText('Normal');
    
    await page.getByText('Clearing').click();
    await expect(phaseDisplay).toContainText('clearing');
    await expect(progressDisplay).toContainText('1.000');
    await expect(pgTokenState).toContainText('Hidden');
    await expect(medalState).toContainText('Normal');
  });
});
