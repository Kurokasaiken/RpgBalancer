/**
 * Script per popolare il roster di test con personaggi - VERSIONE BROWSER
 * Esegui nella console del browser o incolla direttamente in http://localhost:5173
 */

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
    portraitUrl: '/assets/characters/sir-spaccaculi.png',
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
    portraitUrl: '/assets/characters/salvatrice.png',
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
    portraitUrl: '/assets/characters/giggiolillo.png',
    statSnapshot: { hp: 150, damage: 34, txc: 30, evasion: 12, agility: 72, critChance: 12, critMult: 2.1, movementSpeed: 125 }
  }
];

// Salva in localStorage
localStorage.setItem('idle_combat_characters', JSON.stringify(TEST_RESIDENTS));
console.log(`✅ Popolati ${TEST_RESIDENTS.length} residenti nel roster:`);
TEST_RESIDENTS.forEach(r => console.log(`- ${r.name} (HP: ${r.currentHp}, Hero: ${r.isHero}, Portrait: ${r.portraitUrl ? 'Sì' : 'No'})`));

// Trigger evento per aggiornare l'app
window.dispatchEvent(new CustomEvent('characterStorageUpdated'));
console.log('🔄 Evento characterStorageUpdated dispatchato');
console.log('🎯 Roster popolato con i valori corretti!');
