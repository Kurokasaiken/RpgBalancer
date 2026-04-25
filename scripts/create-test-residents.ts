/**
 * Script per creare residenti di test direttamente in localStorage
 * 
 * Esegui: npx tsx scripts/create-test-residents.ts
 */

import { chromium, Browser, Page } from 'playwright';
import { TEST_ROSTER_HEROES } from '../src/balancing/config/idleVillage/testRosterResidents';

async function createTestResidents() {
  console.log('🔧 Creando residenti di test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Vai all'app principale
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);

    const testResidents = TEST_ROSTER_HEROES.map((hero) => ({
      ...hero,
      lastUpdated: hero.lastUpdated ?? Date.now(),
    }));

    // Salva in localStorage
    await page.evaluate((residents) => {
      localStorage.setItem('idle_combat_characters', JSON.stringify(residents));
      
      // Trigger event per notificare l'app
      window.dispatchEvent(new CustomEvent('characterStorageUpdated'));
    }, testResidents);

    console.log(`✅ Creati ${testResidents.length} residenti di test:`);
    testResidents.forEach((r) =>
      console.log(`   - ${r.name} (HP: ${r.statBlock.hp}, Fatigue: ${r.fatigue}, Hero: ${r.isHero ? 'yes' : 'no'})`),
    );

    // Salva lo storage state per i test
    await context.storageState({ path: 'test-results/residents-state.json' });
    
    console.log('✅ Storage state salvato in: test-results/residents-state.json');
    console.log('🎯 Ora puoi eseguire i test drag & drop!');
    console.log('');
    console.log('📋 Comando per i test:');
    console.log('   npx playwright test tests/e2e/idleVillage/drag-drop-with-storage.spec.ts');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await browser.close();
  }
}

createTestResidents();
