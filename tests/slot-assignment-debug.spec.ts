import { test, expect } from '@playwright/test';

test.describe('Token Slot Assignment Debugging', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174/test-roster');
    await page.waitForLoadState('networkidle');
  });

  test('should force slot assignment and capture teleportation during hold', async ({ page }) => {
    // Set up comprehensive console capture
    const allLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      allLogs.push(text);
      
      // Focus on SlottedMedal and behavior logs
      if (text.includes('SLOTTED MEDAL DEBUG') || 
          text.includes('TELEPORTATION DETECTED') ||
          text.includes('Behavior state') ||
          text.includes('triggerDetach') ||
          text.includes('resistStart')) {
        console.log(`[Slot] ${text}`);
      }
    });

    await page.waitForSelector('[data-testid="test-roster-page"]');
    
    // Look for existing slots with medals
    console.log('=== LOOKING FOR EXISTING SLOT MEDALS ===');
    
    // Check if there are any SlottedMedal components already
    const existingMedals = await page.locator('[data-testid="slotted-medal"]').count();
    console.log(`Existing SlottedMedal components: ${existingMedals}`);
    
    if (existingMedals > 0) {
      console.log('Found existing medals, testing interaction...');
      
      const firstMedal = page.locator('[data-testid="slotted-medal"]').first();
      const medalBox = await firstMedal.boundingBox();
      
      if (medalBox) {
        console.log('Testing existing medal interaction...');
        
        // Try to drag the existing medal to trigger behavior
        await page.mouse.move(medalBox.x + medalBox.width / 2, medalBox.y + medalBox.height / 2);
        await page.mouse.down();
        
        // Hold to trigger resist behavior
        console.log('Holding to trigger resist behavior...');
        for (let i = 0; i < 8; i++) {
          await page.waitForTimeout(200);
          console.log(`Resist hold ${i + 1}/8`);
        }
        
        // Move away to trigger detach
        await page.mouse.move(medalBox.x + medalBox.width / 2 - 100, medalBox.y + medalBox.height / 2 - 100);
        await page.waitForTimeout(300);
        
        await page.mouse.up();
        await page.waitForTimeout(1000);
        
        console.log('=== EXTRACTING MEDAL FROM SLOT COMPLETED ===');
      }
    } else {
      console.log('No existing medals found, trying to create slot assignment...');
      
      // Try to find slot drop zones and force assignment
      const slots = await page.locator('.resident-slot-rack-skin').count();
      console.log(`Found ${slots} slot racks`);
      
      if (slots > 0) {
        // Get a resident card and try to assign it to a slot
        const card = page.locator('[data-testid*="card"]').first();
        const slot = page.locator('.resident-slot-rack-skin').first();
        
        const cardBox = await card.boundingBox();
        const slotBox = await slot.boundingBox();
        
        if (cardBox && slotBox) {
          console.log('Attempting to assign resident to slot...');
          
          // Drag card to slot
          await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
          await page.mouse.down();
          
          await page.mouse.move(slotBox.x + slotBox.width / 2, slotBox.y + slotBox.height / 2);
          await page.waitForTimeout(200);
          
          await page.mouse.up();
          
          // Wait for slot assignment to complete
          await page.waitForTimeout(1000);
          
          // Check if medal was created
          const medalsAfter = await page.locator('[data-testid="slotted-medal"]').count();
          console.log(`Medals after assignment: ${medalsAfter}`);
          
          if (medalsAfter > 0) {
            console.log('SUCCESS: Medal created in slot!');
            
            // Now test the medal interaction
            const newMedal = page.locator('[data-testid="slotted-medal"]').first();
            const newMedalBox = await newMedal.boundingBox();
            
            if (newMedalBox) {
              console.log('Testing newly created medal...');
              
              // Try to extract the medal (this should trigger teleportation)
              await page.mouse.move(newMedalBox.x + newMedalBox.width / 2, newMedalBox.y + newMedalBox.height / 2);
              await page.mouse.down();
              
              // Hold to trigger the ghiera animation and potential teleportation
              console.log('Holding newly created medal - watching for teleportation...');
              
              for (let i = 0; i < 12; i++) {
                await page.waitForTimeout(150);
                
                // Check for teleportation logs
                const recentLogs = allLogs.slice(-10);
                const teleportLogs = recentLogs.filter(log => log.includes('TELEPORTATION DETECTED'));
                
                if (teleportLogs.length > 0) {
                  console.log('TELEPORTATION DETECTED DURING HOLD!');
                  teleportLogs.forEach(log => console.log(`  ${log}`));
                }
                
                // Check for behavior state changes
                const behaviorLogs = recentLogs.filter(log => log.includes('Behavior state'));
                if (behaviorLogs.length > 0) {
                  console.log(`Behavior state at hold ${i + 1}: ${behaviorLogs[behaviorLogs.length - 1]}`);
                }
              }
              
              // Try to move away to trigger spring return
              await page.mouse.move(newMedalBox.x + newMedalBox.width / 2 - 80, newMedalBox.y + newMedalBox.height / 2 - 80);
              await page.waitForTimeout(300);
              
              await page.mouse.up();
              await page.waitForTimeout(1000);
              
              console.log('=== MEDAL EXTRACTION TEST COMPLETED ===');
            }
          } else {
            console.log('No medal created after assignment');
          }
        }
      }
    }

    // Analyze all captured logs
    console.log('=== COMPLETE LOG ANALYSIS ===');
    
    const slottedMedalLogs = allLogs.filter(log => log.includes('SLOTTED MEDAL DEBUG'));
    const teleportLogs = allLogs.filter(log => log.includes('TELEPORTATION DETECTED'));
    const behaviorStateLogs = allLogs.filter(log => log.includes('Behavior state'));
    
    console.log(`SlottedMedal debug logs: ${slottedMedalLogs.length}`);
    console.log(`Teleportation detections: ${teleportLogs.length}`);
    console.log(`Behavior state logs: ${behaviorStateLogs.length}`);
    
    if (slottedMedalLogs.length > 0) {
      console.log('\n=== SLOTTED MEDAL LOGS ===');
      slottedMedalLogs.forEach(log => console.log(log));
    }
    
    if (teleportLogs.length > 0) {
      console.log('\n=== TELEPORTATION EVENTS ===');
      teleportLogs.forEach(log => console.log(log));
    }
    
    if (behaviorStateLogs.length > 0) {
      console.log('\n=== BEHAVIOR STATE CHANGES ===');
      behaviorStateLogs.forEach(log => console.log(log));
    }
    
    console.log('=== TEST COMPLETED ===');
  });

  test('should monitor image bouncing during medal hold', async ({ page }) => {
    const imageLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Image element rect') || text.includes('Image relative to token')) {
        imageLogs.push(text);
        console.log(`[Image] ${text}`);
      }
    });

    await page.waitForSelector('[data-testid="test-roster-page"]');
    
    // Look for medals to test image stability
    const medals = await page.locator('[data-testid="slotted-medal"]').count();
    
    if (medals > 0) {
      const medal = page.locator('[data-testid="slotted-medal"]').first();
      const medalBox = await medal.boundingBox();
      
      if (medalBox) {
        console.log('Testing image stability during hold...');
        
        // Start drag on medal
        await page.mouse.move(medalBox.x + medalBox.width / 2, medalBox.y + medalBox.height / 2);
        await page.mouse.down();
        
        // Hold in place and monitor image position
        console.log('Holding medal - monitoring image for bouncing...');
        
        const imagePositions: Array<{x: number, y: number, time: number}> = [];
        
        for (let i = 0; i < 20; i++) {
          await page.waitForTimeout(100);
          
          // Parse recent image logs
          const recentLogs = imageLogs.slice(-5);
          recentLogs.forEach(log => {
            const match = log.match(/x:\s*(\d+),\s*y:\s*(\d+)/);
            if (match) {
              imagePositions.push({
                x: parseInt(match[1]),
                y: parseInt(match[2]),
                time: Date.now()
              });
            }
          });
        }
        
        await page.mouse.up();
        
        // Analyze image position stability
        console.log('=== IMAGE STABILITY ANALYSIS ===');
        
        if (imagePositions.length > 1) {
          let totalMovement = 0;
          let maxMovement = 0;
          
          for (let i = 1; i < imagePositions.length; i++) {
            const prev = imagePositions[i - 1];
            const curr = imagePositions[i];
            const movement = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
            
            totalMovement += movement;
            maxMovement = Math.max(maxMovement, movement);
            
            if (movement > 5) {
              console.log(`Bounce detected: movement ${Math.round(movement)}px at index ${i}`);
            }
          }
          
          const avgMovement = totalMovement / (imagePositions.length - 1);
          
          console.log(`Image stability results:`);
          console.log(`- Total positions tracked: ${imagePositions.length}`);
          console.log(`- Average movement: ${avgMovement.toFixed(2)}px`);
          console.log(`- Max movement: ${maxMovement.toFixed(2)}px`);
          console.log(`- Stability: ${avgMovement < 2 ? 'STABLE' : 'BOUNCING'}`);
        }
        
        console.log('=== IMAGE STABILITY TEST COMPLETED ===');
      }
    } else {
      console.log('No medals found for image stability test');
    }
  });
});
