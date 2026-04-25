import { test, expect } from '@playwright/test';

test.describe('Drag Offset Debug', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test');
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('debug drag start events', async ({ page }) => {
    // Listen for console events
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
      console.log('Browser console:', msg.text());
    });

    // Get the first resident card
    const residentCard = page.locator('[data-testid*="resident-card"]').first();
    await expect(residentCard).toBeVisible();

    // Get the first slot
    const slot = page.locator('[data-testid*="slot"]').first();
    await expect(slot).toBeVisible();

    console.log('Starting drag operation...');

    // Perform drag and drop
    await residentCard.dragTo(slot);

    // Wait a bit for any async operations
    await page.waitForTimeout(1000);

    // Check console messages for our debug logs
    const pointerDownLogs = consoleMessages.filter(msg => 
      msg.includes('🔍 [PgCard] onPointerDown called')
    );
    
    const dragEndLogs = consoleMessages.filter(msg => 
      msg.includes('🔍 [TestRosterPage] handleDragEnd called')
    );

    console.log('=== DEBUG RESULTS ===');
    console.log('Pointer down logs found:', pointerDownLogs.length);
    console.log('Drag end logs found:', dragEndLogs.length);
    console.log('All console messages:', consoleMessages);

    // Assertions
    expect(dragEndLogs.length).toBeGreaterThan(0, 'Drag end should be called');
    
    if (pointerDownLogs.length === 0) {
      console.log('❌ PROBLEM: onPointerDown is NOT being called!');
      console.log('This explains why the drag image offset is not working');
    } else {
      console.log('✅ onPointerDown is being called');
    }
  });

  test('check dnd-kit listeners', async ({ page }) => {
    // Listen for console events
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
      if (msg.text().includes('🔍 [PgCard] Listeners:')) {
        console.log('DND-KIT Listeners:', msg.text());
      }
    });

    // Reload page to trigger the listeners log
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check if listeners log appeared
    const listenersLogs = consoleMessages.filter(msg => 
      msg.includes('🔍 [PgCard] Listeners:')
    );

    console.log('=== LISTENERS DEBUG ===');
    console.log('Listeners logs found:', listenersLogs.length);
    
    if (listenersLogs.length > 0) {
      console.log('Listeners output:', listenersLogs[0]);
    }
  });
});
