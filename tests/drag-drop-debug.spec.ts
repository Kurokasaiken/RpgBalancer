import { test, expect } from '@playwright/test';

test.describe('Drag and Drop Token Debugging', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174/test-roster');
    await page.waitForLoadState('networkidle');
  });

  test('should load test roster page with resident cards', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('[data-testid="test-roster-page"]');
    
    // Check for resident cards
    const cards = await page.locator('[data-testid*="card"]').count();
    expect(cards).toBeGreaterThan(0);
    
    console.log(`Found ${cards} resident cards`);
    
    // Check for Run Drag Test button
    const testButton = page.locator('button:has-text("Run Drag Test")');
    await expect(testButton).toBeVisible();
    
    console.log('Run Drag Test button is visible');
  });

  test('should execute automated drag test and capture console logs', async ({ page }) => {
    // Set up console log capture
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
      console.log(`[Console] ${msg.text()}`);
    });

    // Find and click the Run Drag Test button
    const testButton = page.locator('button:has-text("Run Drag Test")');
    await testButton.click();
    
    // Wait for the test to complete
    await page.waitForTimeout(3000);
    
    // Analyze console logs
    const dragTestLogs = consoleLogs.filter(log => 
      log.includes('SIMPLE WORKING DRAG TEST') ||
      log.includes('Found') && log.includes('resident cards') ||
      log.includes('Tokens:') ||
      log.includes('Overlay:') ||
      log.includes('SUCCESS')
    );
    
    console.log('=== DRAG TEST CONSOLE LOGS ===');
    dragTestLogs.forEach(log => console.log(log));
    console.log('=== END CONSOLE LOGS ===');
    
    // Check if drag test found cards
    const foundCardsLog = dragTestLogs.find(log => log.includes('Found') && log.includes('resident cards'));
    expect(foundCardsLog).toBeTruthy();
    
    if (foundCardsLog) {
      const cardCount = parseInt(foundCardsLog.match(/\d+/)?.[0] || '0');
      expect(cardCount).toBeGreaterThan(0);
      console.log(`Successfully found ${cardCount} resident cards`);
    }
  });

  test('should perform manual drag and drop with coordinate tracking', async ({ page }) => {
    // Set up console log capture for coordinate debugging
    const coordinateLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('TOKEN DEBUG') || 
          text.includes('DRAG OVERLAY DEBUG') || 
          text.includes('FLIGHT PROXY DEBUG') ||
          text.includes('rect:') ||
          text.includes('position:')) {
        coordinateLogs.push(text);
        console.log(`[Coord] ${text}`);
      }
    });

    // Wait for resident cards to be visible
    await page.waitForSelector('[data-testid*="card"]');
    
    // Get the first resident card
    const firstCard = page.locator('[data-testid*="card"]').first();
    await expect(firstCard).toBeVisible();
    
    // Get card position for debugging
    const cardBoundingBox = await firstCard.boundingBox();
    expect(cardBoundingBox).toBeTruthy();
    
    console.log('Card position:', {
      x: cardBoundingBox!.x,
      y: cardBoundingBox!.y,
      width: cardBoundingBox!.width,
      height: cardBoundingBox!.height
    });
    
    // Find a drop target (slot)
    const dropTarget = page.locator('.resident-slot-rack-skin').first();
    const dropTargetExists = await dropTarget.count() > 0;
    
    if (dropTargetExists) {
      await expect(dropTarget).toBeVisible();
      
      // Perform drag and drop
      console.log('Starting drag and drop operation...');
      
      // Start drag from center of card
      const startX = cardBoundingBox!.x + cardBoundingBox!.width / 2;
      const startY = cardBoundingBox!.y + cardBoundingBox!.height / 2;
      
      // Get drop target position
      const dropBoundingBox = await dropTarget.boundingBox();
      const endX = dropBoundingBox!.x + dropBoundingBox!.width / 2;
      const endY = dropBoundingBox!.y + dropBoundingBox!.height / 2;
      
      console.log(`Dragging from (${startX}, ${startY}) to (${endX}, ${endY})`);
      
      // Perform the drag operation
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      
      // Move in steps to simulate realistic drag
      await page.mouse.move(startX + 50, startY + 30);
      await page.waitForTimeout(100);
      
      await page.mouse.move(startX + 100, startY + 60);
      await page.waitForTimeout(100);
      
      await page.mouse.move(endX, endY);
      await page.waitForTimeout(100);
      
      await page.mouse.up();
      
      // Wait for any animations to complete
      await page.waitForTimeout(1000);
      
      console.log('Drag and drop completed');
    } else {
      console.log('No drop target found, performing drag test without drop');
      
      // Just perform a drag without dropping
      const startX = cardBoundingBox!.x + cardBoundingBox!.width / 2;
      const startY = cardBoundingBox!.y + cardBoundingBox!.height / 2;
      
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + 100, startY + 100);
      await page.waitForTimeout(500);
      await page.mouse.up();
    }
    
    // Analyze coordinate logs
    console.log('=== COORDINATE DEBUGGING LOGS ===');
    coordinateLogs.forEach(log => console.log(log));
    console.log('=== END COORDINATE LOGS ===');
    
    // Check if we captured any coordinate debugging information
    const tokenDebugLogs = coordinateLogs.filter(log => log.includes('TOKEN DEBUG'));
    const dragOverlayLogs = coordinateLogs.filter(log => log.includes('DRAG OVERLAY DEBUG'));
    const flightProxyLogs = coordinateLogs.filter(log => log.includes('FLIGHT PROXY DEBUG'));
    
    console.log('Coordinate debugging summary:');
    console.log(`- TOKEN DEBUG logs: ${tokenDebugLogs.length}`);
    console.log(`- DRAG OVERLAY DEBUG logs: ${dragOverlayLogs.length}`);
    console.log(`- FLIGHT PROXY DEBUG logs: ${flightProxyLogs.length}`);
    
    // Look for token creation during drag
    const tokens = await page.locator('.tok-svg').count();
    console.log(`Tokens found during test: ${tokens}`);
    
    // Look for drag overlay
    const dragOverlay = await page.locator('[data-drag-overlay]').count();
    console.log(`Drag overlays found: ${dragOverlay}`);
    
    // Look for motion elements
    const motionElements = await page.locator('[class*="motion"]').count();
    console.log(`Motion elements found: ${motionElements}`);
  });

  test('should capture detailed token position information', async ({ page }) => {
    // Set up detailed console capture
    const allLogs: string[] = [];
    page.on('console', msg => {
      allLogs.push(msg.text());
    });

    // Wait for page to be ready
    await page.waitForSelector('[data-testid*="card"]');
    
    // Get first card and perform drag
    const card = page.locator('[data-testid*="card"]').first();
    const boundingBox = await card.boundingBox();
    
    if (boundingBox) {
      const startX = boundingBox.x + boundingBox.width / 2;
      const startY = boundingBox.y + boundingBox.height / 2;
      
      console.log('Performing detailed drag test...');
      
      // Perform drag with detailed logging
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      
      // Check for immediate token creation
      await page.waitForTimeout(200);
      
      await page.mouse.move(startX + 80, startY + 80);
      await page.waitForTimeout(300);
      
      await page.mouse.up();
      await page.waitForTimeout(500);
      
      // Extract and analyze token position information
      const tokenLogs = allLogs.filter(log => 
        log.includes('Token') && 
        (log.includes('x:') || log.includes('y:') || log.includes('width:') || log.includes('height:'))
      );
      
      console.log('=== TOKEN POSITION ANALYSIS ===');
      tokenLogs.forEach(log => console.log(log));
      console.log('=== END TOKEN ANALYSIS ===');
      
      // Look for image positioning within tokens
      const imageLogs = allLogs.filter(log => 
        log.includes('Image') && 
        (log.includes('relative to token') || log.includes('centered'))
      );
      
      console.log('=== IMAGE POSITION ANALYSIS ===');
      imageLogs.forEach(log => console.log(log));
      console.log('=== END IMAGE ANALYSIS ===');
    }
  });
});
