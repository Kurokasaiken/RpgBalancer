import { test, expect } from '@playwright/test';

test.describe('Token Slot Interaction Debugging', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174/test-roster');
    await page.waitForLoadState('networkidle');
  });

  test('should capture token behavior during slot assignment with hold', async ({ page }) => {
    // Set up detailed console capture
    const allLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      allLogs.push(text);
      
      // Focus on coordinate and animation logs
      if (text.includes('TOKEN DEBUG') || 
          text.includes('DRAG OVERLAY DEBUG') || 
          text.includes('FLIGHT PROXY DEBUG') ||
          text.includes('spring') ||
          text.includes('animation') ||
          text.includes('teleport')) {
        console.log(`[Debug] ${text}`);
      }
    });

    // Wait for page to be ready
    await page.waitForSelector('[data-testid="test-roster-page"]');
    await page.waitForSelector('[data-testid*="card"]');
    
    // Get first resident card and a slot
    const card = page.locator('[data-testid*="card"]').first();
    const slot = page.locator('.resident-slot-rack-skin').first();
    
    // Verify elements exist
    await expect(card).toBeVisible();
    const slotExists = await slot.count() > 0;
    
    if (!slotExists) {
      console.log('No slots found, creating test scenario...');
      // For now, just test drag and hold without slot
    }

    // Get initial positions
    const cardBoundingBox = await card.boundingBox();
    expect(cardBoundingBox).toBeTruthy();
    
    console.log('=== INITIAL STATE ===');
    console.log('Card position:', {
      x: cardBoundingBox!.x,
      y: cardBoundingBox!.y,
      width: cardBoundingBox!.width,
      height: cardBoundingBox!.height
    });

    if (slotExists) {
      const slotBoundingBox = await slot.boundingBox();
      console.log('Slot position:', {
        x: slotBoundingBox!.x,
        y: slotBoundingBox!.y,
        width: slotBoundingBox!.width,
        height: slotBoundingBox!.height
      });
    }

    // Perform drag to slot with extended hold
    console.log('=== STARTING DRAG TO SLOT ===');
    
    const startX = cardBoundingBox!.x + cardBoundingBox!.width / 2;
    const startY = cardBoundingBox!.y + cardBoundingBox!.height / 2;
    
    if (slotExists) {
      const slotBoundingBox = await slot.boundingBox();
      const endX = slotBoundingBox!.x + slotBoundingBox!.width / 2;
      const endY = slotBoundingBox!.y + slotBoundingBox!.height / 2;
      
      console.log(`Dragging from (${startX}, ${startY}) to slot (${endX}, ${endY})`);
      
      // Start drag
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.waitForTimeout(100);
      
      // Move to slot
      await page.mouse.move(endX, endY);
      await page.waitForTimeout(200);
      
      // Drop in slot
      await page.mouse.up();
      console.log('=== DROPPED IN SLOT ===');
      
      // Wait for slot assignment animation
      await page.waitForTimeout(300);
      
      // NOW: Try to drag again from the slot (this is where the teleportation happens)
      console.log('=== ATTEMPTING TO DRAG FROM SLOT ===');
      
      // Wait a bit for the ghiera animation to complete
      await page.waitForTimeout(500);
      
      // Try to grab the token from the slot and hold
      await page.mouse.move(endX, endY);
      await page.mouse.down();
      
      console.log('=== HOLDING TOKEN FROM SLOT ===');
      
      // Monitor coordinates during hold - this is where bouncing might occur
      for (let i = 0; i < 10; i++) {
        await page.waitForTimeout(100);
        console.log(`Hold monitoring ${i + 1}/10`);
        
        // Check for any coordinate changes during hold
        const currentLogs = allLogs.slice(-20); // Last 20 logs
        const recentTokenLogs = currentLogs.filter(log => log.includes('TOKEN DEBUG'));
        
        if (recentTokenLogs.length > 0) {
          console.log('Recent token activity during hold:');
          recentTokenLogs.forEach(log => console.log(`  ${log}`));
        }
      }
      
      // Release and check for teleportation
      await page.mouse.up();
      console.log('=== RELEASED FROM SLOT - CHECKING FOR TELEPORTATION ===');
      
      await page.waitForTimeout(500);
      
    } else {
      console.log('Testing drag and hold without slot...');
      
      // Just test drag and hold behavior
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      
      // Hold and monitor for bouncing
      for (let i = 0; i < 8; i++) {
        await page.waitForTimeout(150);
        console.log(`Hold monitoring ${i + 1}/8`);
      }
      
      await page.mouse.up();
    }

    // Analyze all captured logs
    console.log('=== COMPLETE LOG ANALYSIS ===');
    
    const tokenDebugLogs = allLogs.filter(log => log.includes('TOKEN DEBUG'));
    const dragOverlayLogs = allLogs.filter(log => log.includes('DRAG OVERLAY DEBUG'));
    const flightProxyLogs = allLogs.filter(log => log.includes('FLIGHT PROXY DEBUG'));
    
    console.log(`Total logs captured: ${allLogs.length}`);
    console.log(`Token debug logs: ${tokenDebugLogs.length}`);
    console.log(`Drag overlay logs: ${dragOverlayLogs.length}`);
    console.log(`Flight proxy logs: ${flightProxyLogs.length}`);
    
    // Look for position anomalies
    console.log('\n=== POSITION ANOMALY DETECTION ===');
    
    tokenDebugLogs.forEach((log, index) => {
      if (log.includes('x: 0') && log.includes('y: 0')) {
        console.log(`ANOMALY at token log ${index}: ${log}`);
      }
      
      if (log.includes('centerX: 32') && log.includes('centerY: 32')) {
        console.log(`POTENTIAL TELEPORTATION at token log ${index}: ${log}`);
      }
    });
    
    // Look for rapid position changes (bouncing)
    console.log('\n=== BOUNCING DETECTION ===');
    
    const positions: Array<{x: number, y: number, timestamp: number}> = [];
    
    tokenDebugLogs.forEach(log => {
      const match = log.match(/x:\s*(\d+),\s*y:\s*(\d+)/);
      if (match) {
        positions.push({
          x: parseInt(match[1]),
          y: parseInt(match[2]),
          timestamp: Date.now()
        });
      }
    });
    
    // Detect rapid position changes
    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1];
      const curr = positions[i];
      const distance = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
      
      if (distance > 50) { // Significant position change
        console.log(`BOUNCE DETECTED: from (${prev.x}, ${prev.y}) to (${curr.x}, ${curr.y}) - distance: ${Math.round(distance)}`);
      }
    }
    
    console.log('=== TEST COMPLETED ===');
  });

  test('should test token extraction from slot with spring return animation', async ({ page }) => {
    // Set up console capture
    const animationLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('TOKEN DEBUG') || text.includes('spring') || text.includes('animation')) {
        animationLogs.push(text);
        console.log(`[Animation] ${text}`);
      }
    });

    await page.waitForSelector('[data-testid*="card"]');
    
    // This test would require a token already in a slot
    // For now, we'll simulate the scenario
    
    console.log('=== TESTING SPRING RETURN ANIMATION ===');
    
    // First, assign a token to a slot (if possible)
    const card = page.locator('[data-testid*="card"]').first();
    const slot = page.locator('.resident-slot-rack-skin').first();
    
    if (await slot.count() > 0) {
      // Assign to slot
      const cardBox = await card.boundingBox();
      const slotBox = await slot.boundingBox();
      
      if (cardBox && slotBox) {
        // Drag to slot
        await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(slotBox.x + slotBox.width / 2, slotBox.y + slotBox.height / 2);
        await page.mouse.up();
        
        await page.waitForTimeout(500);
        
        // Now try to extract with spring animation
        console.log('=== EXTRACTING FROM SLOT ===');
        
        await page.mouse.move(slotBox.x + slotBox.width / 2, slotBox.y + slotBox.height / 2);
        await page.mouse.down();
        
        // Move away to trigger spring return
        await page.mouse.move(slotBox.x + slotBox.width / 2 - 100, slotBox.y + slotBox.height / 2 - 100);
        await page.waitForTimeout(200);
        
        await page.mouse.up();
        
        await page.waitForTimeout(1000);
        
        console.log('=== SPRING RETURN TEST COMPLETED ===');
      }
    }
  });

  test('should monitor image stability during hold moments', async ({ page }) => {
    const stabilityLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Image element rect') || text.includes('Image relative to token')) {
        stabilityLogs.push(text);
        console.log(`[Stability] ${text}`);
      }
    });

    await page.waitForSelector('[data-testid*="card"]');
    
    const card = page.locator('[data-testid*="card"]').first();
    const cardBox = await card.boundingBox();
    
    if (cardBox) {
      console.log('=== TESTING IMAGE STABILITY DURING HOLD ===');
      
      const centerX = cardBox.x + cardBox.width / 2;
      const centerY = cardBox.y + cardBox.height / 2;
      
      // Start drag
      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      
      // Hold in place and monitor image stability
      console.log('Holding in place - monitoring image stability...');
      
      for (let i = 0; i < 15; i++) {
        await page.waitForTimeout(100);
        
        // Check if image position is stable
        const recentLogs = stabilityLogs.slice(-5);
        if (recentLogs.length > 1) {
          console.log(`Stability check ${i + 1}/15: ${recentLogs.length} recent image logs`);
        }
      }
      
      await page.mouse.up();
      
      console.log('=== IMAGE STABILITY TEST COMPLETED ===');
    }
  });
});
