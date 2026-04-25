/**
 * TestRosterPage & Vertical Slice Skin Integration E2E Tests
 * 
 * Visual regression and interaction tests for NP-SM-015 integration
 * Tests all skin components in the TestRosterPage harness
 */

import { test, expect } from '@playwright/test';

test.describe('TestRosterPage Skin Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test');
    await page.waitForLoadState('networkidle');
  });

  test('should load TestRosterPage with skin integration section', async ({ page }) => {
    // Wait for the page to load
    await page.waitForSelector('[data-testid="test-roster-page"]', { timeout: 10000 });
    
    // Check for skin integration section
    const skinSection = page.locator('[data-testid="vertical-slice-test-section"]');
    await expect(skinSection).toBeVisible();
    
    // Verify all skin components are present
    await expect(page.locator('text=VillageRosterSectionSkin')).toBeVisible();
    await expect(page.locator('text=ResidentSlotRackSkin')).toBeVisible();
    await expect(page.locator('text=TimeEngineStrip')).toBeVisible();
    await expect(page.locator('text=ActiveHUD')).toBeVisible();
    await expect(page.locator('text=ActivityCapsule')).toBeVisible();
    await expect(page.locator('text=ActionHalo')).toBeVisible();
  });

  test('should switch between pillars correctly', async ({ page }) => {
    await page.waitForSelector('[data-testid="vertical-slice-test-section"]');
    
    // Find pillar selector
    const pillarSelect = page.locator('label=Pillar: + select');
    await expect(pillarSelect).toBeVisible();
    
    // Test Wilderness pillar
    await pillarSelect.selectOption('wilderness');
    await page.waitForTimeout(500);
    
    // Verify pillar data attribute
    const skinSection = page.locator('[data-testid="vertical-slice-test-section"]');
    await expect(skinSection).toHaveAttribute('data-pillar', 'wilderness');
    
    // Test Empire pillar
    await pillarSelect.selectOption('empire');
    await page.waitForTimeout(500);
    
    await expect(skinSection).toHaveAttribute('data-pillar', 'empire');
    
    // Test Frontier pillar
    await pillarSelect.selectOption('frontier');
    await page.waitForTimeout(500);
    
    await expect(skinSection).toHaveAttribute('data-pillar', 'frontier');
  });

  test('should switch motion levels correctly', async ({ page }) => {
    await page.waitForSelector('[data-testid="vertical-slice-test-section"]');
    
    // Find motion selector
    const motionSelect = page.locator('label=Motion: + select');
    await expect(motionSelect).toBeVisible();
    
    // Test Full Motion
    await motionSelect.selectOption('full');
    await page.waitForTimeout(500);
    
    // Verify motion data attribute
    const skinSection = page.locator('[data-testid="vertical-slice-test-section"]');
    await expect(skinSection).toHaveAttribute('data-motion-level', 'full');
    
    // Test Reduced Motion
    await motionSelect.selectOption('reduced');
    await page.waitForTimeout(500);
    
    await expect(skinSection).toHaveAttribute('data-motion-level', 'reduced');
    
    // Test Minimal Motion
    await motionSelect.selectOption('minimal');
    await page.waitForTimeout(500);
    
    await expect(skinSection).toHaveAttribute('data-motion-level', 'minimal');
  });

  test('should toggle telemetry display', async ({ page }) => {
    await page.waitForSelector('[data-testid="vertical-slice-test-section"]');
    
    // Find telemetry toggle
    const telemetryToggle = page.locator('input[type="checkbox"]');
    await expect(telemetryToggle).toBeVisible();
    
    // Initially telemetry should be hidden
    await expect(page.locator('text=Telemetry Events')).not.toBeVisible();
    
    // Enable telemetry
    await telemetryToggle.check();
    await page.waitForTimeout(500);
    
    // Telemetry section should now be visible
    await expect(page.locator('text=Telemetry Events')).toBeVisible();
    
    // Clear button should be visible
    await expect(page.locator('button:has-text("Clear")')).toBeVisible();
    
    // Disable telemetry
    await telemetryToggle.uncheck();
    await page.waitForTimeout(500);
    
    // Telemetry section should be hidden again
    await expect(page.locator('text=Telemetry Events')).not.toBeVisible();
  });

  test('should display correct status information', async ({ page }) => {
    await page.waitForSelector('[data-testid="vertical-slice-test-section"]');
    
    // Check status bar information
    await expect(page.locator('text=Preset:')).toBeVisible();
    await expect(page.locator('text=Pillar:')).toBeVisible();
    await expect(page.locator('text=Motion:')).toBeVisible();
    await expect(page.locator('text=Components: 6 skin wrappers')).toBeVisible();
  });

  test('should handle compact mode correctly', async ({ page }) => {
    await page.waitForSelector('[data-testid="vertical-slice-test-section"]');
    
    // Get the component grid container
    const componentGrid = page.locator('[data-testid="vertical-slice-test-section"] .style-lab-stack');
    
    // Initially should be horizontal layout (desktop)
    const initialClasses = await componentGrid.getAttribute('class');
    expect(initialClasses).toContain('horizontal');
    
    // Simulate mobile viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    // Should switch to vertical layout in compact mode
    const mobileClasses = await componentGrid.getAttribute('class');
    expect(mobileClasses).toContain('vertical');
  });

  test('should capture telemetry events when enabled', async ({ page }) => {
    await page.waitForSelector('[data-testid="vertical-slice-test-section"]');
    
    // Enable telemetry
    const telemetryToggle = page.locator('input[type="checkbox"]');
    await telemetryToggle.check();
    await page.waitForTimeout(500);
    
    // Interact with controls to generate events
    const pillarSelect = page.locator('label=Pillar: + select');
    await pillarSelect.selectOption('wilderness');
    await page.waitForTimeout(500);
    
    const motionSelect = page.locator('label=Motion: + select');
    await motionSelect.selectOption('reduced');
    await page.waitForTimeout(500);
    
    // Check that telemetry events were captured
    const telemetrySection = page.locator('text=Telemetry Events').locator('..');
    const telemetryContent = telemetrySection.locator('div[style*="monospace"]');
    
    // Should have some telemetry content
    await expect(telemetryContent).toBeVisible();
    const telemetryText = await telemetryContent.textContent();
    expect(telemetryText).toContain('vertical_slice_pillar_changed');
    expect(telemetryText).toContain('vertical_slice_motion_changed');
  });

  test('should maintain visual consistency across pillars', async ({ page }) => {
    await page.waitForSelector('[data-testid="vertical-slice-test-section"]');
    
    // Take baseline screenshot for Frontier pillar
    const pillarSelect = page.locator('label=Pillar: + select');
    await pillarSelect.selectOption('frontier');
    await page.waitForTimeout(1000);
    
    const skinSection = page.locator('[data-testid="vertical-slice-test-section"]');
    await expect(skinSection).toHaveScreenshot('test-roster-skin-frontier.png', {
      animations: 'disabled'
    });
    
    // Test Wilderness pillar
    await pillarSelect.selectOption('wilderness');
    await page.waitForTimeout(1000);
    
    await expect(skinSection).toHaveScreenshot('test-roster-skin-wilderness.png', {
      animations: 'disabled'
    });
    
    // Test Empire pillar
    await pillarSelect.selectOption('empire');
    await page.waitForTimeout(1000);
    
    await expect(skinSection).toHaveScreenshot('test-roster-skin-empire.png', {
      animations: 'disabled'
    });
  });

  test('should handle drag and drop interactions', async ({ page }) => {
    await page.waitForSelector('[data-testid="test-roster-page"]');
    
    // Find a resident card and a slot
    const residentCard = page.locator('[data-testid*="pg-card"]').first();
    const slotId = 'slot-lab-open-slot-0';
    const slot = page.getByTestId(`slot-button-${slotId}`);
    
    // Ensure both are visible
    await expect(residentCard).toBeVisible();
    await expect(slot).toBeVisible();
    
    // Get bounding boxes
    const residentBox = await residentCard.boundingBox();
    const slotBox = await slot.boundingBox();
    
    if (residentBox && slotBox) {
      // Perform drag and drop
      await page.mouse.move(residentBox.x + residentBox.width / 2, residentBox.y + residentBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(slotBox.x + slotBox.width / 2, slotBox.y + slotBox.height / 2, { steps: 10 });
      await page.mouse.up();
      
      // Wait for drop animation
      await page.waitForTimeout(500);
      
      // Verify drop was successful (slot should show as occupied)
      await expect(slot).toHaveAttribute('data-drop-state', 'valid');
    }
  });

  test('should be responsive across different viewports', async ({ page }) => {
    await page.waitForSelector('[data-testid="vertical-slice-test-section"]');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const skinSection = page.locator('[data-testid="vertical-slice-test-section"]');
    await expect(skinSection).toBeVisible();
    
    // Controls should stack vertically on mobile
    const controlPanel = skinSection.locator('.style-lab-stack').first();
    const controlClasses = await controlPanel.getAttribute('class');
    expect(controlClasses).toContain('vertical');
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    await expect(skinSection).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    await expect(skinSection).toBeVisible();
    
    // Controls should be horizontal on desktop
    const desktopControlClasses = await controlPanel.getAttribute('class');
    expect(desktopControlClasses).toContain('horizontal');
  });

  test('should handle accessibility features', async ({ page }) => {
    await page.waitForSelector('[data-testid="vertical-slice-test-section"]');
    
    // Check for proper ARIA labels
    const presetSelect = page.locator('label=Preset: + select');
    await expect(presetSelect).toHaveAttribute('aria-label', 'Preset');
    
    const pillarSelect = page.locator('label=Pillar: + select');
    await expect(pillarSelect).toHaveAttribute('aria-label', 'Pillar');
    
    const motionSelect = page.locator('label=Motion: + select');
    await expect(motionSelect).toHaveAttribute('aria-label', 'Motion');
    
    // Check keyboard navigation
    await presetSelect.focus();
    await expect(presetSelect).toBeFocused();
    
    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Verify selection changed
    const currentValue = await presetSelect.inputValue();
    expect(currentValue).not.toBe('');
  });

  test('should handle error states gracefully', async ({ page }) => {
    await page.waitForSelector('[data-testid="vertical-skin-test-section"]');
    
    // Simulate network error by intercepting requests
    await page.route('**/api/**', route => route.abort());
    
    // The skin section should still load with fallback data
    const skinSection = page.locator('[data-testid="vertical-slice-test-section"]');
    await expect(skinSection).toBeVisible();
    
    // Should show loading state initially
    await expect(page.locator('text=Loading skin preferences...')).not.toBeVisible();
    
    // Should display components even with network issues
    await expect(page.locator('text=VillageRosterSectionSkin')).toBeVisible();
  });
});
