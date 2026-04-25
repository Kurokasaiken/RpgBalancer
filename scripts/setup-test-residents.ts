/**
 * Script per popolare il Character Manager con residenti di test
 * Esegui questo script prima di lanciare i test drag & drop
 */

import { PersistenceService } from '@/persistence/PersistenceService';
import { MINIMAL_GAMEPLAY_RESIDENTS } from '@/balancing/config/idleVillage/minimalGameplayConfig';

async function setupTestResidents() {
  console.log('🔧 Setting up test residents in Character Manager...');
  
  try {
    // Carica i residenti predefiniti nel Character Manager
    const residents = MINIMAL_GAMEPLAY_RESIDENTS.map(resident => ({
      id: resident.id,
      name: resident.name,
      label: resident.label,
      level: resident.level,
      stats: resident.stats,
      fatigue: resident.fatigue,
      traits: resident.traits,
      portraitUrl: resident.portraitUrl || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    // Salva nel Character Manager
    await PersistenceService.saveData('character_manager_residents', residents);
    
    console.log(`✅ Successfully loaded ${residents.length} test residents:`);
    residents.forEach(r => console.log(`   - ${r.name} (HP: ${r.stats.hp || 0}, Level: ${r.level})`));
    
    console.log('\n🎯 Now you can run the drag & drop tests:');
    console.log('   npx playwright test tests/e2e/idleVillage/drag-drop-comprehensive-test.spec.ts');
    
  } catch (error) {
    console.error('❌ Error setting up test residents:', error);
    process.exit(1);
  }
}

// Esegui lo script
if (require.main === module) {
  setupTestResidents();
}

export { setupTestResidents };
