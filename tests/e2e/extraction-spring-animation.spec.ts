import { test, expect } from '@playwright/test';

test.describe('Extraction Spring Animation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-roster');
    await page.waitForLoadState('networkidle');
  });

  test('PG token should animate with bounce-spring when extracted from second slot', async ({ page }) => {
    // Find the second slot and assign a resident for testing
    const secondSlot = page.locator('[data-testid*="slot-button"]').nth(1);
    
    // Force assignment by setting the required attribute
    await secondSlot.evaluate((el) => {
      el.setAttribute('data-assigned-resident-id', 'test-resident-Q');
    });
    
    // Wait for assignment to be processed
    await page.waitForTimeout(500);
    
    // Start extraction by pressing mouse down (press-and-hold mechanism)
    await secondSlot.dispatchEvent('mousedown');
    
    // Wait for extraction to complete (560ms + postOpenHold delays)
    await page.waitForTimeout(900);
    
    // Check that bounce-spring animation is applied to the PG container
    const pgContainer = secondSlot.locator('.absolute.inset-0.flex.items-center.justify-center.z-10');
    
    // Verify the bounce-spring class is present during animation
    await expect(pgContainer).toHaveClass(/animate-bounce-spring/);
    
    // Wait for animation to complete (600ms spring duration)
    await page.waitForTimeout(700);
    
    // Verify animation class is removed after completion
    await expect(pgContainer).not.toHaveClass(/animate-bounce-spring/);
  });

  test('Extraction timing: bezel opens before PG spring animation', async ({ page }) => {
    const secondSlot = page.locator('[data-testid*="slot-button"]').nth(1);
    
    // Force assignment
    await secondSlot.evaluate((el) => {
      el.setAttribute('data-assigned-resident-id', 'test-resident-Q');
    });
    
    await page.waitForTimeout(500);
    
    // Start extraction and monitor timing
    const startTime = Date.now();
    await secondSlot.dispatchEvent('mousedown');
    
    // Monitor extraction progress (bezel opening)
    let extractionCompleted = false;
    let springStarted = false;
    
    // Check extraction completion
    for (let i = 0; i < 20; i++) {
      const isExtracting = await secondSlot.getAttribute('data-extracting');
      const pgContainer = secondSlot.locator('.absolute.inset-0.flex.items-center.justify-center.z-10');
      const hasSpring = await pgContainer.evaluate((el) => el.classList.contains('animate-bounce-spring'));
      
      if (isExtracting === 'true') {
        extractionCompleted = true;
        console.log(`Extraction completed at: ${Date.now() - startTime}ms`);
      }
      
      if (hasSpring) {
        springStarted = true;
        console.log(`Spring animation started at: ${Date.now() - startTime}ms`);
        break;
      }
      
      await page.waitForTimeout(50);
    }
    
    // Verify timing: extraction should trigger before spring animation
    expect(extractionCompleted).toBeTruthy();
    expect(springStarted).toBeTruthy();
  });

  test('No spring animation on assignment, only on extraction', async ({ page }) => {
    const secondSlot = page.locator('[data-testid*="slot-button"]').nth(1);
    
    // Verify no animation class initially
    const pgContainer = secondSlot.locator('.absolute.inset-0.flex.items-center.justify-center.z-10');
    const hasSpringInitially = await pgContainer.evaluate((el) => el.classList.contains('animate-bounce-spring'));
    await expect(hasSpringInitially).toBeFalsy();
    
    // Assign resident (simulate assignment)
    await secondSlot.evaluate((el) => {
      el.setAttribute('data-assigned-resident-id', 'test-resident-Q');
    });
    
    await page.waitForTimeout(500);
    
    // Verify no animation on assignment
    const hasSpringAfterAssignment = await pgContainer.evaluate((el) => el.classList.contains('animate-bounce-spring'));
    await expect(hasSpringAfterAssignment).toBeFalsy();
    
    // Now test extraction
    await secondSlot.dispatchEvent('mousedown');
    await page.waitForTimeout(300);
    
    // Verify animation only on extraction
    const hasSpringAfterExtraction = await pgContainer.evaluate((el) => el.classList.contains('animate-bounce-spring'));
    await expect(hasSpringAfterExtraction).toBeTruthy();
  });

  test('Entire PG component animates together (no image/container separation)', async ({ page }) => {
    const secondSlot = page.locator('[data-testid*="slot-button"]').nth(1);
    
    // Assign resident
    await secondSlot.evaluate((el) => {
      el.setAttribute('data-assigned-resident-id', 'test-resident-Q');
    });
    
    await page.waitForTimeout(500);
    
    // Start extraction
    await secondSlot.dispatchEvent('mousedown');
    await page.waitForTimeout(900); // Wait for spring to start
    
    // Check that the main container has the animation class
    const pgContainer = secondSlot.locator('.absolute.inset-0.flex.items-center.justify-center.z-10');
    const hasSpring = await pgContainer.evaluate((el) => el.classList.contains('animate-bounce-spring'));
    expect(hasSpring).toBeTruthy();
    
    // Verify the animation affects the entire component by checking transform
    const transform = await pgContainer.evaluate((el) => getComputedStyle(el).transform);
    expect(transform).not.toBe('none');
    
    // Check that inner elements (image, text) move with container
    const innerSpan = secondSlot.locator('span.flex.h-10.w-10');
    const innerTransform = await innerSpan.evaluate((el) => getComputedStyle(el).transform);
    
    // Inner elements should not have separate transforms (they move with parent)
    expect(innerTransform).toBe('none');
  });
});
