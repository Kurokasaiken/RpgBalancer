/**
 * Script per salvare i residenti dal Character Manager
 * 
 * Uso:
 * 1. Apri http://localhost:5173
 * 2. Carica i residenti nel Character Manager
 * 3. Esegui: npx tsx tests/setup-residents.ts
 */

import { chromium, Browser, Page } from 'playwright';

async function saveResidents() {
  console.log('🔧 Salvando i residenti dal Character Manager...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Vai all'app principale
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);

    // Controlla se ci sono residenti
    const residents = await page.evaluate(() => {
      const data = localStorage.getItem('character_manager_residents');
      return data ? JSON.parse(data) : [];
    });

    if (residents.length === 0) {
      console.log('❌ Nessun residente trovato nel Character Manager');
      console.log('💡 Carica prima i residenti nell\'app principale');
      return;
    }

    console.log(`✅ Trovati ${residents.length} residenti:`);
    residents.forEach((r: any) => console.log(`   - ${r.name || r.label}`));

    // Salva lo storage state
    await context.storageState({ path: 'test-results/residents-state.json' });
    
    console.log('✅ Storage state salvato in: test-results/residents-state.json');
    console.log('🎯 Ora puoi eseguire i test drag & drop!');
    console.log('');
    console.log('📋 Comando per i test:');
    console.log('   npx playwright test tests/e2e/idleVillage/drag-drop-self-contained-test.spec.ts');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await browser.close();
  }
}

saveResidents();
