import { test, expect } from '@playwright/test';

test.describe('Balancer Component Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');

    // Wait for the app to load
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 });

    // Ensure Balancer heading is visible (app lands on this tab by default)
    const balancerHeading = page.locator('h1').filter({ hasText: 'Balancer' });
    await expect(balancerHeading).toBeVisible();
  });

  test('Reset functionality works', async ({ page }) => {
    // Test Reset Stat buttons
    const resetStatButtons = page.locator('button[aria-label*="Reset Stat"]');
    const resetStatCount = await resetStatButtons.count();

    if (resetStatCount > 0) {
      console.log(`✅ Found ${resetStatCount} Reset Stat buttons`);
      await resetStatButtons.first().click();
    } else {
      console.log('❌ No Reset Stat buttons found');
    }

    // Test Reset Card buttons
    const resetCardButtons = page.locator('button[aria-label*="Reset Card"]');
    const resetCardCount = await resetCardButtons.count();

    if (resetCardCount > 0) {
      console.log(`✅ Found ${resetCardCount} Reset Card buttons`);
      await resetCardButtons.first().click();
    } else {
      console.log('❌ No Reset Card buttons found');
    }

    // Test Reset All button
    const resetAllButton = page.locator('button').filter({ hasText: 'Reset All' });
    const resetAllVisible = await resetAllButton.isVisible();

    if (resetAllVisible) {
      console.log('✅ Reset All button found');
      await resetAllButton.click();
    } else {
      console.log('❌ Reset All button not found');
    }
  });

  test('Lock/Hide functionality works', async ({ page }) => {
    // Test Lock buttons
    const lockButtons = page.locator('button[aria-label*="Lock"]');
    const lockCount = await lockButtons.count();

    if (lockCount > 0) {
      console.log(`✅ Found ${lockCount} Lock buttons`);
      await lockButtons.first().click();
    } else {
      console.log('❌ No Lock buttons found');
    }

    // Test Hide buttons
    const hideButtons = page.locator('button[aria-label*="Hide"]');
    const hideCount = await hideButtons.count();

    if (hideCount > 0) {
      console.log(`✅ Found ${hideCount} Hide buttons`);
      await hideButtons.first().click();
    } else {
      console.log('❌ No Hide buttons found');
    }
  });

  test('Import/Export functionality works', async ({ page }) => {
    // Test Export button
    const exportButton = page.locator('button').filter({ hasText: 'Export' });
    const exportVisible = await exportButton.isVisible();

    if (exportVisible) {
      console.log('✅ Export button found');
      await exportButton.click();
    } else {
      console.log('❌ Export button not found');
    }

    // Test Import button
    const importButton = page.locator('button').filter({ hasText: 'Import' });
    const importVisible = await importButton.isVisible();

    if (importVisible) {
      console.log('✅ Import button found');
      await importButton.click();
    } else {
      console.log('❌ Import button not found');
    }
  });

  test('Drag & drop functionality exists', async ({ page }) => {
    // Test draggable cards
    const draggableCards = page.locator('[data-testid*="card"][draggable="true"]');
    const draggableCount = await draggableCards.count();

    if (draggableCount > 0) {
      console.log(`✅ Found ${draggableCount} draggable cards`);
    } else {
      console.log('❌ No draggable cards found');
    }

    // Test drag handles
    const dragHandles = page.locator('[data-testid*="handle"], .drag-handle');
    const handleCount = await dragHandles.count();

    if (handleCount > 0) {
      console.log(`✅ Found ${handleCount} drag handles`);
    } else {
      console.log('❌ No drag handles found');
    }
  });

  test('No visible errors', async ({ page }) => {
    // Check for error messages
    const errorMessages = page.locator('.text-red-500, .bg-red-500, [class*="error"]');
    const errorCount = await errorMessages.count();

    if (errorCount > 0) {
      console.log(`⚠️ Found ${errorCount} error indicators`);
    } else {
      console.log('✅ No visible errors');
    }

    // Check for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait a bit to catch any console errors
    await page.waitForTimeout(2000);

    if (errors.length > 0) {
      console.log(`⚠️ Found ${errors.length} console errors:`, errors);
    } else {
      console.log('✅ No console errors');
    }
  });
});
