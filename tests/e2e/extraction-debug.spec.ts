import { test, expect } from '@playwright/test';

test.describe('Extraction Spring Animation - Debug', () => {
  test('Debug DOM structure', async ({ page }) => {
    await page.goto('/test-roster');
    await page.waitForLoadState('networkidle');
    
    // Find the second slot
    const secondSlot = page.locator('[data-testid*="slot-button"]').nth(1);
    
    // Force assignment with multiple attributes
    await secondSlot.evaluate((el) => {
      el.setAttribute('data-assigned-resident-id', 'test-resident-Q');
      el.setAttribute('data-assigned-resident', 'test-resident-Q');
      el.setAttribute('data-assigned-worker-name', 'TEST');
    });
    
    await page.waitForTimeout(500);
    
    // Debug: print the DOM structure
    const domStructure = await secondSlot.evaluate((el) => {
      return el.innerHTML.substring(0, 1000);
    });
    console.log('DOM Structure:', domStructure);
    
    // Check if PG container is rendered
    const pgContainerExists = await secondSlot.locator('.absolute.inset-0.flex.items-center.justify-center.z-10').count();
    console.log('PG container exists:', pgContainerExists);
    
    // Start extraction
    await secondSlot.dispatchEvent('mousedown');
    await page.waitForTimeout(900);
    
    // Check for any element with bounce-spring class
    const bounceElements = await page.locator('.animate-bounce-spring').count();
    console.log('Elements with bounce-spring class:', bounceElements);
    
    // If found, print their details
    if (bounceElements > 0) {
      for (let i = 0; i < bounceElements; i++) {
        const element = page.locator('.animate-bounce-spring').nth(i);
        const tagName = await element.evaluate(el => el.tagName);
        const className = await element.evaluate(el => el.className);
        console.log(`Element ${i}: ${tagName} with class: ${className}`);
      }
    }
  });

  test('Simple extraction test', async ({ page }) => {
    await page.goto('/test-roster');
    await page.waitForLoadState('networkidle');
    
    const secondSlot = page.locator('[data-testid*="slot-button"]').nth(1);
    
    // Force assignment
    await secondSlot.evaluate((el) => {
      el.setAttribute('data-assigned-resident-id', 'test-resident-Q');
    });
    
    await page.waitForTimeout(500);
    
    // Start extraction
    await secondSlot.dispatchEvent('mousedown');
    await page.waitForTimeout(900);
    
    // Check if any element has the bounce-spring class
    const hasBounceSpring = await page.evaluate(() => {
      const elements = document.querySelectorAll('.animate-bounce-spring');
      return elements.length > 0;
    });
    
    console.log('Has bounce-spring elements:', hasBounceSpring);
    expect(hasBounceSpring).toBeTruthy();
  });
});
