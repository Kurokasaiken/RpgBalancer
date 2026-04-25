import { chromium } from 'playwright';
import path from 'path';

/**
 * Script per testare automaticamente il drag and offset
 * Usa Playwright per simulare l'interazione utente
 */

async function runDragDebugTest() {
  console.log('🚀 Starting drag debug test with Playwright...');
  
  let browser = null;
  
  try {
    // Avvia il browser
    browser = await chromium.launch({ 
      headless: false, // Mostra il browser per debug
      slowMo: 100 // Rallenta per vedere meglio
    });
    
    const page = await browser.newPage();
    
    // Intercetta la console
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      console.log('📝 Browser:', text);
    });
    
    // Vai alla pagina di test
    const testFilePath = path.resolve(process.cwd(), 'debug-drag-test.html');
    const fileUrl = `file://${testFilePath}`;
    
    console.log('📂 Opening test file:', fileUrl);
    await page.goto(fileUrl);
    
    // Aspetta che la pagina carichi
    await page.waitForSelector('#testCard');
    await page.waitForTimeout(1000);
    
    console.log('🎯 Starting drag operation...');
    
    // Esegui il drag and drop
    const testCard = page.locator('#testCard');
    const dropZone = page.locator('#dropZone');
    
    // Posizione iniziale (centro della card)
    const cardBox = await testCard.boundingBox();
    if (!cardBox) {
      throw new Error('Test card not found');
    }
    
    const startX = cardBox.x + cardBox.width / 2;
    const startY = cardBox.y + cardBox.height / 2;
    
    console.log('📍 Start position:', { startX, startY });
    
    // Posizione finale (centro della drop zone)
    const dropBox = await dropZone.boundingBox();
    if (!dropBox) {
      throw new Error('Drop zone not found');
    }
    
    const endX = dropBox.x + dropBox.width / 2;
    const endY = dropBox.y + dropBox.height / 2;
    
    console.log('📍 End position:', { endX, endY });
    
    // Esegui il drag
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    
    // Aspetta un po' per vedere l'effetto
    await page.waitForTimeout(500);
    
    // Muovi verso la drop zone
    await page.mouse.move(endX, endY, { steps: 10 });
    
    // Rilascia
    await page.mouse.up();
    
    // Aspetta che tutto si stabilizzi
    await page.waitForTimeout(1000);
    
    // Analizza i risultati
    console.log('\n=== ANALYSIS RESULTS ===');
    
    const pointerDownLogs = consoleMessages.filter(msg => 
      msg.includes('POINTER DOWN')
    );
    
    const dragStartLogs = consoleMessages.filter(msg => 
      msg.includes('DRAG START')
    );
    
    const dragImageLogs = consoleMessages.filter(msg => 
      msg.includes('SET DRAG IMAGE')
    );
    
    const dragEndLogs = consoleMessages.filter(msg => 
      msg.includes('DRAG END')
    );
    
    const dropLogs = consoleMessages.filter(msg => 
      msg.includes('DROP')
    );
    
    console.log('📊 Event Counts:');
    console.log(`  Pointer Down: ${pointerDownLogs.length}`);
    console.log(`  Drag Start: ${dragStartLogs.length}`);
    console.log(`  Drag Image: ${dragImageLogs.length}`);
    console.log(`  Drag End: ${dragEndLogs.length}`);
    console.log(`  Drop: ${dropLogs.length}`);
    
    if (pointerDownLogs.length > 0) {
      console.log('✅ Pointer Down events detected');
      console.log('  First:', pointerDownLogs[0]);
    } else {
      console.log('❌ NO Pointer Down events - THIS IS THE PROBLEM!');
    }
    
    if (dragStartLogs.length > 0) {
      console.log('✅ Drag Start events detected');
      console.log('  First:', dragStartLogs[0]);
    } else {
      console.log('❌ NO Drag Start events');
    }
    
    if (dragImageLogs.length > 0) {
      console.log('✅ Drag Image setup detected');
      console.log('  First:', dragImageLogs[0]);
    } else {
      console.log('❌ NO Drag Image setup');
    }
    
    console.log('\n🎯 CONCLUSION:');
    if (pointerDownLogs.length === 0) {
      console.log('The issue is that pointer events are not being captured properly.');
      console.log('This could explain why the drag image offset is not working in React.');
    } else if (dragStartLogs.length === 0) {
      console.log('The drag start event is not being triggered.');
    } else {
      console.log('Events are working, so the issue might be in the offset calculation.');
    }
    
    // Aspetta un po' prima di chiudere per permettere l'osservazione
    console.log('\n⏳ Keeping browser open for 5 seconds for observation...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔚 Browser closed');
    }
  }
}

// Esegui il test
runDragDebugTest().catch(console.error);
