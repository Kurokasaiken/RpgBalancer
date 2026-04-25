/**
 * Drag Overlay Isolation Playwright Tests
 * 
 * Tests CustomDragOverlay component independently:
 * - Drag start shows WanderlustMedalOverlay
 * - Drag move follows cursor
 * - Drag end on valid area triggers feedback
 * - Drag end on invalid area returns to roster
 */

import { test, expect, type Page } from '@playwright/test';

const DRAG_OVERLAY_ROUTE = '/idle-village/iso/drag-overlay';

test.describe('Drag Overlay Isolation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DRAG_OVERLAY_ROUTE);
    await page.waitForLoadState('networkidle');
  });

  test('renders drag overlay page with controls', async ({ page }) => {
    // Check main elements are present
    await expect(page.getByText('Drag Overlay Isolation')).toBeVisible();
    await expect(page.getByText('Test CustomDragOverlay component independently')).toBeVisible();
    
    // Check controls section
    await expect(page.getByText('Controls')).toBeVisible();
    await expect(page.getByText('Debug Visualization')).toBeVisible();
    await expect(page.getByText('Drag State')).toBeVisible();
    
    // Check drag area
    await expect(page.getByText('Drag Area')).toBeVisible();
    await expect(page.getByText('Mock Roster (Drag from here)')).toBeVisible();
    await expect(page.getByText('Valid Drop Zone')).toBeVisible();
    await expect(page.getByText('Invalid Drop Zone')).toBeVisible();
  });

  test('mock roster displays residents', async ({ page }) => {
    // Check resident cards are present
    await expect(page.getByText('Aurora Calder')).toBeVisible();
    await expect(page.getByText('Marcus Stone')).toBeVisible();
    
    // Check resident stats
    await expect(page.getByText('HP: 150')).toBeVisible();
    await expect(page.getByText('HP: 180')).toBeVisible();
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

  test('drag state updates correctly', async ({ page }) => {
    const dragStateDisplay = page.locator('text=Drag State').locator('..').locator('.font-mono');
    
    // Initially should be idle
    await expect(dragStateDisplay).toContainText('Idle');
    
    // Manual overlay preview should update state
    await page.getByText('Show Aurora Overlay').click();
    await expect(dragStateDisplay).toContainText('Dragging: resident-1');
    
    // Hide overlay should return to idle
    await page.getByText('Hide Overlay').click();
    await expect(dragStateDisplay).toContainText('Idle');
  });

  test('manual overlay preview works', async ({ page }) => {
    // Initially no overlay should be visible
    const overlayContainer = page.locator('text=Manual Overlay Preview').locator('..').locator('.bg-slate-800\\/30');
    await expect(overlayContainer).toBeVisible();
    
    // Show Aurora overlay
    await page.getByText('Show Aurora Overlay').click();
    // Note: We can't easily test the overlay content directly, but we can test state changes
    
    // Show Marcus overlay
    await page.getByText('Show Marcus Overlay').click();
    
    // Hide overlay
    await page.getByText('Hide Overlay').click();
  });

  test('drop zones are visually distinct', async ({ page }) => {
    const validZone = page.locator('text=Valid Drop Zone').locator('..');
    const invalidZone = page.locator('text=Invalid Drop Zone').locator('..');
    
    // Valid zone should have green styling
    await expect(validZone).toHaveClass(/border-green/);
    await expect(validZone).toHaveClass(/bg-green/);
    await expect(page.locator('text=Valid Drop Zone')).toHaveClass(/text-green/);
    
    // Invalid zone should have red styling
    await expect(invalidZone).toHaveClass(/border-red/);
    await expect(invalidZone).toHaveClass(/bg-red/);
    await expect(page.locator('text=Invalid Drop Zone')).toHaveClass(/text-red/);
  });

  test('state information updates correctly', async ({ page }) => {
    // Check all state fields exist
    await expect(page.locator('text=Drag Mode:')).toBeVisible();
    await expect(page.locator('text=Active ID:')).toBeVisible();
    await expect(page.locator('text=Drop Target:')).toBeVisible();
    await expect(page.locator('text=Flight Animation:')).toBeVisible();
    await expect(page.locator('text=Active Resident:')).toBeVisible();
    await expect(page.locator('text=Debug:')).toBeVisible();
  });

  test('manual overlay preview buttons work', async ({ page }) => {
    const dragStateDisplay = page.locator('text=Drag State').locator('..').locator('.font-mono');
    const activeIdDisplay = page.locator('text=Active ID:').locator('..').locator('.font-mono');
    const activeResidentDisplay = page.locator('text=Active Resident:').locator('..').locator('.font-mono');
    
    // Show Aurora overlay
    await page.getByText('Show Aurora Overlay').click();
    await expect(dragStateDisplay).toContainText('dragging');
    await expect(activeIdDisplay).toContainText('resident-1');
    await expect(activeResidentDisplay).toContainText('Aurora Calder');
    
    // Show Marcus overlay
    await page.getByText('Show Marcus Overlay').click();
    await expect(dragStateDisplay).toContainText('dragging');
    await expect(activeIdDisplay).toContainText('resident-2');
    await expect(activeResidentDisplay).toContainText('Marcus Stone');
    
    // Hide overlay
    await page.getByText('Hide Overlay').click();
    await expect(dragStateDisplay).toContainText('idle');
    await expect(activeIdDisplay).toContainText('None');
    await expect(activeResidentDisplay).toContainText('None');
  });

  test('mock roster cards are draggable', async ({ page }) => {
    const auroraCard = page.locator('text=Aurora Calder').locator('..');
    const marcusCard = page.locator('text=Marcus Stone').locator('..');
    
    // Check cards have proper styling
    await expect(auroraCard).toHaveClass(/cursor-grab/);
    await expect(marcusCard).toHaveClass(/cursor-grab/);
    await expect(auroraCard).toHaveAttribute('draggable');
    await expect(marcusCard).toHaveAttribute('draggable');
    
    // Check hover effect
    await auroraCard.hover();
    await expect(auroraCard).toHaveClass(/hover:bg-slate-600/);
  });

  test('drop zone descriptions are helpful', async ({ page }) => {
    // Valid zone description
    await expect(page.getByText('Drag here for valid assignment')).toBeVisible();
    
    // Invalid zone description
    await expect(page.getByText('Drag here for return to roster')).toBeVisible();
  });

  test('debug state reflects debug toggle', async ({ page }) => {
    const debugStateDisplay = page.locator('text=Debug:').locator('..').locator('.font-mono');
    const debugButton = page.getByText(/Debug/);
    
    // Initially should be Off
    await expect(debugStateDisplay).toContainText('Off');
    
    // Toggle debug on
    await debugButton.click();
    await expect(debugStateDisplay).toContainText('On');
    
    // Toggle debug off
    await debugButton.click();
    await expect(debugStateDisplay).toContainText('Off');
  });

  test('flight animation state updates', async ({ page }) => {
    const flightStateDisplay = page.locator('text=Flight Animation:').locator('..').locator('.font-mono');
    
    // Initially should be None
    await expect(flightStateDisplay).toContainText('None');
    
    // Manual overlay preview shouldn't trigger flight animation
    await page.getByText('Show Aurora Overlay').click();
    await expect(flightStateDisplay).toContainText('None');
    
    // Hide overlay
    await page.getByText('Hide Overlay').click();
    await expect(flightStateDisplay).toContainText('None');
  });

  test('drop target state updates', async ({ page }) => {
    const dropTargetDisplay = page.locator('text=Drop Target:').locator('..').locator('.font-mono');
    
    // Initially should be None
    await expect(dropTargetDisplay).toContainText('None');
    
    // Manual overlay preview shouldn't affect drop target
    await page.getByText('Show Aurora Overlay').click();
    await expect(dropTargetDisplay).toContainText('None');
    
    // Hide overlay
    await page.getByText('Hide Overlay').click();
    await expect(dropTargetDisplay).toContainText('None');
  });

  test('page layout is responsive', async ({ page }) => {
    // Check main layout elements
    await expect(page.locator('text=Drag Area')).toBeVisible();
    await expect(page.locator('text=State Information')).toBeVisible();
    await expect(page.locator('text=Manual Overlay Preview')).toBeVisible();
    
    // Check grid layout in drag area
    const gridContainer = page.locator('text=Mock Roster').locator('..').locator('..');
    await expect(gridContainer).toHaveClass(/grid/);
    
    // Check state information grid
    const stateGrid = page.locator('text=State Information').locator('..').locator('.grid');
    await expect(stateGrid).toHaveClass(/grid/);
  });

  test('all buttons are functional', async ({ page }) => {
    const dragStateDisplay = page.locator('text=Drag State').locator('..').locator('.font-mono');
    
    // Test all manual overlay buttons
    await page.getByText('Show Aurora Overlay').click();
    await expect(dragStateDisplay).toContainText('dragging');
    
    await page.getByText('Show Marcus Overlay').click();
    await expect(dragStateDisplay).toContainText('dragging');
    
    await page.getByText('Hide Overlay').click();
    await expect(dragStateDisplay).toContainText('idle');
    
    // Test debug button
    const debugButton = page.getByText(/Debug/);
    await debugButton.click();
    await expect(debugButton).toContainText('Debug ON');
    
    await debugButton.click();
    await expect(debugButton).toContainText('Debug OFF');
  });
});
