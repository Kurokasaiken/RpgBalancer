/**
 * Script per popolare il roster di test con personaggi - Versione Node.js
 * Esegui con: node scripts/populate-test-roster-node.js
 */

const fs = require('fs');
const path = require('path');

const TEST_RESIDENTS = [
  {
    id: 'hero-sir-spaccaculi',
    name: 'Sir Spaccaculi',
    displayName: 'Sir Spaccaculi',
    status: 'available',
    currentHp: 200,
    maxHp: 200,
    fatigue: 0,
    isHero: true,
    isInjured: false,
    statTags: ['fortitude', 'warden'],
    survivalCount: 7,
    survivalScore: 540,
    visualProfileId: 'hero-tank',
    statSnapshot: { hp: 200, damage: 24, txc: 22, evasion: 6, agility: 42, armor: 35, resistance: 18, block: 28 }
  },
  {
    id: 'hero-salvatrice',
    name: 'Salvatrice',
    displayName: 'Salvatrice',
    status: 'available',
    currentHp: 150,
    maxHp: 150,
    fatigue: 0,
    isHero: true,
    isInjured: false,
    statTags: ['ward', 'clarity'],
    survivalCount: 6,
    survivalScore: 420,
    visualProfileId: 'hero-support',
    statSnapshot: { hp: 150, damage: 18, txc: 28, evasion: 8, agility: 60, ward: 24, regen: 9, resistance: 20 }
  },
  {
    id: 'hero-giggiolillo',
    name: 'Giggiolillo',
    displayName: 'Giggiolillo',
    status: 'available',
    currentHp: 150,
    maxHp: 150,
    fatigue: 0,
    isHero: true,
    isInjured: false,
    statTags: ['edge', 'precision'],
    survivalCount: 5,
    survivalScore: 360,
    visualProfileId: 'hero-assassin',
    statSnapshot: { hp: 150, damage: 34, txc: 30, evasion: 12, agility: 72, critChance: 12, critMult: 2.1, movementSpeed: 125 }
  }
];

// Salva in un file JSON
const outputPath = path.join(process.cwd(), 'data', 'characters.json');
const outputDir = path.dirname(outputPath);

// Crea la directory se non esiste
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(TEST_RESIDENTS, null, 2));
console.log(`✅ Popolati ${TEST_RESIDENTS.length} residenti nel roster:`);
TEST_RESIDENTS.forEach(r => console.log(`- ${r.name} (HP: ${r.currentHp}, Hero: ${r.isHero})`));

console.log(`\n📁 Salvato in: ${outputPath}`);
console.log('\n📋 Per usare nel browser:');
console.log('1. Apri l\'applicazione su http://localhost:5173');
console.log('2. Apri Dev Tools (F12)');
console.log('3. Nella console, incolla questo codice:');
console.log(`
localStorage.setItem('idle_combat_characters', JSON.stringify(${JSON.stringify(TEST_RESIDENTS)}));
window.dispatchEvent(new CustomEvent('characterStorageUpdated'));
console.log('🔄 Roster popolato con ${TEST_RESIDENTS.length} personaggi');
`);
