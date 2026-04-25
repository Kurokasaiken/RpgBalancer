/**
 * Slog Animation Playwright Tests
 * 
 * Tests the PG token animation from slot back to roster during "slog" (removal).
 * Verifies that the PG token returns to roster with spring animation.
 */

import { test, expect, type Page } from '@playwright/test';

const EXTRACTION_ISO_ROUTE = '/idle-village/iso/extraction';

test.describe('Slog Animation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(EXTRACTION_ISO_ROUTE);
    await page.waitForLoadState('networkidle');
  });

  test('slog control button is present and functional', async ({ page }) => {
    // Check slog control is present
    await expect(page.getByText('Slog Animation (PG returns to roster)')).toBeVisible();
    await expect(page.getByText('Start Slog Animation')).toBeVisible();
    
    // Initially should be disabled (no assignment)
    const slogButton = page.getByText('Start Slog Animation');
    await expect(slogButton).toBeDisabled();
    await expect(slogButton).toHaveText('No PG Assigned');
  });

  test('slog button becomes enabled when PG is assigned', async ({ page }) => {
    // Assign a PG first
    await page.getByText('Assigned').click();
    
    // Now slog button should be enabled
    const slogButton = page.getByText('Start Slog Animation');
    await expect(slogButton).toBeEnabled();
    await expect(slogButton).toHaveText('Start Slog Animation');
    await expect(slogButton).toHaveClass(/bg-orange-600/);
  });

  test('slog animation triggers state machine transition', async ({ page }) => {
    // Assign a PG first
    await page.getByText('Assigned').click();
    
    // Start slog animation
    await page.getByText('Start Slog Animation').click();
    
    // Check extraction state changes to slogAnimating
    const phaseDisplay = page.locator('text=Phase:').locator('..').locator('.font-mono');
    await expect(phaseDisplay).toContainText('slogAnimating');
  });

  test('slog animation removes assignment after completion', async ({ page }) => {
    // Assign a PG first
    await page.getByText('Assigned').click();
    await expect(page.getByText('Assigned')).toHaveClass(/bg-green-600/);
    
    // Start slog animation
    await page.getByText('Start Slog Animation').click();
    
    // Wait for animation to complete (600ms + buffer)
    await page.waitForTimeout(700);
    
    // Assignment should be removed
    await expect(page.getByText('Assigned')).toHaveClass(/bg-slate-700/);
    await expect(page.getByText('Empty')).toHaveClass(/bg-red-600/);
  });

  test('slog button disabled during animation', async ({ page }) => {
    // Assign a PG first
    await page.getByText('Assigned').click();
    
    // Start slog animation
    await page.getByText('Start Slog Animation').click();
    
    // Button should be disabled during animation
    const slogButton = page.getByText('Start Slog Animation');
    await expect(slogButton).toBeDisabled();
  });

  test('slog animation shows correct state values', async ({ page }) => {
    // Assign a PG first
    await page.getByText('Assigned').click();
    
    // Start slog animation
    await page.getByText('Start Slog Animation').click();
    
    // Check state values during slog
    const phaseDisplay = page.locator('text=Phase:').locator('..').locator('.font-mono');
    const progressDisplay = page.locator('text=Progress:').locator('..').locator('.font-mono');
    const pgTokenDisplay = page.locator('text=PG Token:').locator('..').locator('.font-mono');
    const medalDisplay = page.locator('text=Medal:').locator('..').locator('.font-mono');
    const slogDisplay = page.locator('text=Slogging:').locator('..').locator('.font-mono');
    
    await expect(phaseDisplay).toContainText('slogAnimating');
    await expect(progressDisplay).toContainText('1.2'); // Spring position
    await expect(pgTokenDisplay).toContainText('false'); // Hidden during flight
    await expect(medalDisplay).toContainText('false'); // No medal during slog
    await expect(slogDisplay).toContainText('true'); // Slogging active
  });

  test('slog animation returns to idle after completion', async ({ page }) => {
    // Assign a PG first
    await page.getByText('Assigned').click();
    
    // Start slog animation
    await page.getByText('Start Slog Animation').click();
    
    // Wait for animation to complete
    await page.waitForTimeout(700);
    
    // Should return to idle state
    const phaseDisplay = page.locator('text=Phase:').locator('..').locator('.font-mono');
    await expect(phaseDisplay).toContainText('idle');
    
    // State should be reset
    const progressDisplay = page.locator('text=Progress:').locator('..').locator('.font-mono');
    const pgTokenDisplay = page.locator('text=PG Token:').locator('..').locator('.font-mono');
    const slogDisplay = page.locator('text=Slogging:').locator('..').locator('.font-mono');
    
    await expect(progressDisplay).toContainText('0');
    await expect(pgTokenDisplay).toContainText('true');
    await expect(slogDisplay).toContainText('false');
  });

  test('slog animation can be forced via phase control', async ({ page }) => {
    // Assign a PG first
    await page.getByText('Assigned').click();
    
    // Force slog phase directly
    await page.getByText('Slog').click();
    
    // Should enter slogAnimating state
    const phaseDisplay = page.locator('text=Phase:').locator('..').locator('.font-mono');
    await expect(phaseDisplay).toContainText('slogAnimating');
    
    // Check slog-specific state
    const slogDisplay = page.locator('text=Slogging:').locator('..').locator('.font-mono');
    await expect(slogDisplay).toContainText('true');
  });

  test('slog animation timing matches expected duration', async ({ page }) => {
    // Assign a PG first
    await page.getByText('Assigned').click();
    
    // Start timing
    const startTime = Date.now();
    
    // Start slog animation
    await page.getByText('Start Slog Animation').click();
    
    // Wait for completion (should be ~600ms)
    while (true) {
      const phaseDisplay = page.locator('text=Phase:').locator('..').locator('.font-mono');
      const phase = await phaseDisplay.textContent();
      
      if (phase === 'idle') {
        break;
      }
      
      // Timeout after 1 second (should complete before this)
      if (Date.now() - startTime > 1000) {
        throw new Error('Slog animation did not complete in expected time');
      }
      
      await page.waitForTimeout(50);
    }
    
    const duration = Date.now() - startTime;
    
    // Should complete in approximately 600ms (with some tolerance)
    expect(duration).toBeGreaterThan(500);
    expect(duration).toBeLessThan(800);
  });

  test('slog animation works with debug visualization', async ({ page }) => {
    // Assign a PG first
    await page.getByText('Assigned').click();
    
    // Enable debug visualization
    await page.getByText('Debug OFF').click();
    await expect(page.getByText('Debug ON')).toBeVisible();
    
    // Start slog animation
    await page.getByText('Start Slog Animation').click();
    
    // Should see debug colors during slog
    const phaseDisplay = page.locator('text=Phase:').locator('..').locator('.font-mono');
    await expect(phaseDisplay).toContainText('slogAnimating');
    
    // Debug should show slog state
    await expect(page.locator('text=Slogging:')).toBeVisible();
  });

  test('slog animation integrates with extraction workflow', async ({ page }) => {
    // Assign a PG first
    await page.getByText('Assigned').click();
    
    // Start extraction first
    const slotElement = page.locator('[data-testid="extraction-slot"]');
    await slotElement.dispatchEvent('mousedown');
    await page.waitForTimeout(100); // Start extraction
    
    // Release to complete extraction
    await page.mouse.up();
    await page.waitForTimeout(600); // Wait for extraction to complete
    
    // Now start slog
    await page.getByText('Start Slog Animation').click();
    
    // Should transition to slogAnimating
    const phaseDisplay = page.locator('text=Phase:').locator('..').locator('.font-mono');
    await expect(phaseDisplay).toContainText('slogAnimating');
  });

  test('slog animation handles multiple clicks correctly', async ({ page }) => {
    // Assign a PG first
    await page.getByText('Assigned').click();
    
    // Click multiple times rapidly
    await page.getByText('Start Slog Animation').click();
    await page.getByText('Start Slog Animation').click();
    await page.getByText('Start Slog Animation').click();
    
    // Should still work correctly (only one animation)
    const phaseDisplay = page.locator('text=Phase:').locator('..').locator('.font-mono');
    await expect(phaseDisplay).toContainText('slogAnimating');
    
    // Should complete normally
    await page.waitForTimeout(700);
    await expect(phaseDisplay).toContainText('idle');
  });
});
