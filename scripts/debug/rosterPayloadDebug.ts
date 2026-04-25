/**
 * Roster Payload Debug Script
 * 
 * This script seeds the canonical persisted roster state for Puppeteer,
 * exposes the final roster payload at the renderer boundary in both `/test` 
 * and `/minimal-gameplay`, and identifies the first real code-level divergence.
 * 
 * Analysis-only: No fixes applied, only payload extraction and comparison.
 */

import puppeteer from 'puppeteer';

// Import data directly to avoid SVG import issues
const TEST_ROSTER_HEROES = [
  {
    id: 'hero-1',
    name: 'Aria',
    status: 'available',
    currentHp: 150,
    maxHp: 150,
    isHero: true,
    isInjured: false,
    statBlock: { hp: 150, stamina: 80, strength: 12, agility: 14, intelligence: 16 },
    statSnapshot: { hp: 150, stamina: 80, strength: 12, agility: 14, intelligence: 16 },
    statTags: ['reason', 'lantern'],
    portraitUrl: '/assets/portraits/aria.png',
    survivalCount: 0,
    survivalScore: 0,
    statProfileId: 'mage',
    visualProfileId: 'aria-portrait',
  },
  {
    id: 'hero-2', 
    name: 'Borin',
    status: 'available',
    currentHp: 200,
    maxHp: 200,
    isHero: true,
    isInjured: false,
    statBlock: { hp: 200, stamina: 120, strength: 18, agility: 10, intelligence: 8 },
    statSnapshot: { hp: 200, stamina: 120, strength: 18, agility: 10, intelligence: 8 },
    statTags: ['strength', 'endurance'],
    portraitUrl: '/assets/portraits/borin.png',
    survivalCount: 0,
    survivalScore: 0,
    statProfileId: 'warrior',
    visualProfileId: 'borin-portrait',
  },
  {
    id: 'hero-3',
    name: 'Cora',
    status: 'available',
    currentHp: 120,
    maxHp: 120,
    isHero: false,
    isInjured: false,
    statBlock: { hp: 120, stamina: 100, strength: 8, agility: 16, intelligence: 12 },
    statSnapshot: { hp: 120, stamina: 100, strength: 8, agility: 16, intelligence: 12 },
    statTags: ['agility', 'perception'],
    portraitUrl: '/assets/portraits/cora.png',
    survivalCount: 0,
    survivalScore: 0,
    statProfileId: 'scout',
    visualProfileId: 'cora-portrait',
  }
];

// Simple conversion function to avoid import issues
function savedCharacterToResident(hero: any, options: { defaultFatigue?: number }) {
  const defaultFatigue = options.defaultFatigue || 0;
  const hpValue = hero.statBlock?.hp ?? 100;
  
  return {
    id: hero.id,
    displayName: hero.name,
    status: hero.status ?? 'available',
    fatigue: defaultFatigue,
    currentHp: hero.currentHp ?? hpValue,
    maxHp: hero.maxHp ?? hpValue,
    isHero: hero.isHero ?? false,
    isInjured: hero.isInjured ?? false,
    statSnapshot: hero.statSnapshot ?? { ...hero.statBlock },
    statTags: hero.statTags ?? [],
    portraitUrl: hero.portraitUrl,
    survivalCount: hero.survivalCount ?? 0,
    survivalScore: hero.survivalScore ?? 0,
    statProfileId: hero.statProfileId,
    visualProfileId: hero.visualProfileId,
  };
}

const STORAGE_KEY = 'minimal-gameplay-state';
const BASE_URL = 'http://localhost:5173';

/**
 * Create canonical resident data matching TestRosterPage exactly
 */
function createCanonicalResidentData() {
  console.log('Creating canonical resident data from TEST_ROSTER_HEROES...');
  
  if (TEST_ROSTER_HEROES.length === 0) {
    throw new Error('TEST_ROSTER_HEROES is empty - cannot create canonical data');
  }

  const residents = TEST_ROSTER_HEROES.map((hero) => {
    try {
      return savedCharacterToResident(hero, { defaultFatigue: 0 });
    } catch (error) {
      console.error(`Failed to convert ${hero.name}, using manual fallback:`, error);
      const hpValue = hero.statBlock?.hp ?? 100;
      return {
        id: hero.id,
        displayName: hero.name,
        status: hero.status ?? 'available',
        fatigue: 0,
        currentHp: hero.currentHp ?? hpValue,
        maxHp: hero.maxHp ?? hpValue,
        isHero: hero.isHero ?? false,
        isInjured: hero.isInjured ?? false,
        statSnapshot: hero.statSnapshot ?? { hp: hpValue, ...hero.statBlock },
        statTags: hero.statTags ?? [],
        portraitUrl: hero.portraitUrl,
        survivalCount: hero.survivalCount ?? 0,
        survivalScore: hero.survivalScore ?? 0,
        statProfileId: hero.statProfileId ?? hero.aiBehavior,
        visualProfileId: hero.visualProfileId,
      };
    }
  });

  console.log(`Created ${residents.length} canonical residents`);
  return residents;
}

/**
 * Create minimal gameplay state payload for seeding
 */
function createMinimalGameplayPayload(residents: any[]) {
  return {
    state: {
      residents: residents.map(r => ({
        id: r.id,
        name: r.displayName || r.name,
        stats: r.statSnapshot || {},
        fatigue: r.fatigue || 0,
        isWorking: false,
        isInjured: r.isInjured || false,
        isHero: r.isHero || false,
        level: 1,
      })),
      resources: {
        food: 100,
        wood: 50,
        gold: 0,
      },
      day: 1,
      cycleProgress: 0,
      isPaused: false,
      speedMultiplier: 1,
      activeQuests: [],
      eventLog: [],
      gameOver: null,
    },
    config: {
      // Minimal config required for store initialization
      ui: {
        actionPanel: {
          buyFood: {
            defaultQuantity: 10,
          },
        },
      },
      locations: [
        {
          activityId: 'quest_forest_hunt_minimal',
        },
      ],
    },
  };
}

/**
 * Extract payload from page window
 */
async function extractPayload(page: puppeteer.Page, payloadKey: string): Promise<any> {
  await page.waitForFunction(
    (key: string) => {
      return (window as any)[key] !== undefined;
    },
    { timeout: 10000 },
    payloadKey
  );

  return await page.evaluate((key: string) => {
    return (window as any)[key];
  }, payloadKey);
}

/**
 * Compare payloads field-by-field
 */
function comparePayloads(testPayload: any[], minimalPayload: any[]): {
  countDiff: number;
  fieldDiffs: any[];
  firstDivergence: any;
} {
  console.log(`Comparing payloads: test=${testPayload.length}, minimal=${minimalPayload.length}`);

  const fieldDiffs: any[] = [];
  let firstDivergence: any = null;

  for (let i = 0; i < Math.max(testPayload.length, minimalPayload.length); i++) {
    const testRes = testPayload[i];
    const minRes = minimalPayload[i];

    if (!testRes && !minRes) continue;
    if (!testRes) {
      const diff = { index: i, field: 'resident', test: null, minimal: minRes };
      fieldDiffs.push(diff);
      if (!firstDivergence) firstDivergence = diff;
      continue;
    }
    if (!minRes) {
      const diff = { index: i, field: 'resident', test: testRes, minimal: null };
      fieldDiffs.push(diff);
      if (!firstDivergence) firstDivergence = diff;
      continue;
    }

    // Compare each field
    const fields = ['id', 'name', 'portraitUrl', 'hp', 'stamina', 'stats', 'isHero', 'fatigue', 'isInjured'];
    for (const field of fields) {
      const testValue = testRes[field];
      const minValue = minRes[field];
      
      if (JSON.stringify(testValue) !== JSON.stringify(minValue)) {
        const diff = {
          index: i,
          field,
          test: testValue,
          minimal: minValue,
        };
        fieldDiffs.push(diff);
        if (!firstDivergence) firstDivergence = diff;
      }
    }
  }

  return {
    countDiff: testPayload.length - minimalPayload.length,
    fieldDiffs,
    firstDivergence,
  };
}

/**
 * Main execution function
 */
async function debugRosterPayloads() {
  console.log('🚀 Starting roster payload debugging...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  try {
    // Create canonical data
    const canonicalResidents = createCanonicalResidentData();
    const seedPayload = createMinimalGameplayPayload(canonicalResidents);
    
    console.log('📊 Canonical storage key:', STORAGE_KEY);
    console.log('📊 Seed payload shape:', Object.keys(seedPayload));
    console.log('📊 Residents in seed payload:', seedPayload.state.residents.length);

    // Extract /test payload (reference)
    console.log('\n🔍 Extracting /test payload...');
    const testPage = await browser.newPage();
    
    await testPage.goto(`${BASE_URL}/test`, { waitUntil: 'networkidle0' });
    const testPayload = await extractPayload(testPage, '__IV_TEST_ROSTER_PAYLOAD__');
    
    console.log('✅ /test payload extracted:', testPayload?.length, 'residents');
    await testPage.close();

    // Extract /minimal-gameplay payload (with seeded store)
    console.log('\n🔍 Extracting /minimal-gameplay payload...');
    const minimalPage = await browser.newPage();
    
    // Seed localStorage before page boot
    await minimalPage.evaluateOnNewDocument(
      ({ key, payload }) => {
        window.localStorage.setItem(key, JSON.stringify(payload));
      },
      { key: STORAGE_KEY, payload: seedPayload }
    );
    
    await minimalPage.goto(`${BASE_URL}/minimal-gameplay`, { waitUntil: 'networkidle0' });
    const minimalPayload = await extractPayload(minimalPage, '__IV_MINIMAL_ROSTER_PAYLOAD__');
    
    console.log('✅ /minimal-gameplay payload extracted:', minimalPayload?.length, 'residents');
    await minimalPage.close();

    // Compare payloads
    console.log('\n📊 Comparing payloads...');
    const comparison = comparePayloads(testPayload, minimalPayload);
    
    console.log('\n=== COMPARISON RESULTS ===');
    console.log('A. Canonical storage key used:', STORAGE_KEY);
    console.log('B. Exact persisted payload shape:', Object.keys(seedPayload));
    console.log('C. Exported /test payload (JSON):', JSON.stringify(testPayload, null, 2));
    console.log('D. Exported /minimal-gameplay payload (JSON):', JSON.stringify(minimalPayload, null, 2));
    console.log('E. Field-by-field comparison:');
    
    if (comparison.fieldDiffs.length === 0) {
      console.log('   ✅ NO DIFFERENCES FOUND - Payloads are identical!');
    } else {
      console.log(`   ❌ Found ${comparison.fieldDiffs.length} differences:`);
      comparison.fieldDiffs.slice(0, 10).forEach(diff => {
        console.log(`   - Index ${diff.index}, Field ${diff.field}:`);
        console.log(`     Test: ${JSON.stringify(diff.test)}`);
        console.log(`     Minimal: ${JSON.stringify(diff.minimal)}`);
      });
      
      if (comparison.fieldDiffs.length > 10) {
        console.log(`   ... and ${comparison.fieldDiffs.length - 10} more differences`);
      }
    }

    console.log('\nF. First exact code-level divergence point:');
    if (comparison.firstDivergence) {
      console.log(`   Index: ${comparison.firstDivergence.index}`);
      console.log(`   Field: ${comparison.firstDivergence.field}`);
      console.log(`   Test value: ${JSON.stringify(comparison.firstDivergence.test)}`);
      console.log(`   Minimal value: ${JSON.stringify(comparison.firstDivergence.minimal)}`);
      
      // Analysis: this is where the divergence occurs
      console.log('\n🎯 ANALYSIS COMPLETE - First divergence identified.');
      console.log('   This is the exact point where the two pages differ.');
      console.log('   No fixes applied - analysis only as requested.');
    } else {
      console.log('   ✅ No divergence found - payloads are identical');
    }

    return comparison;

  } catch (error) {
    console.error('❌ Error during debugging:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Execute if run directly
if (require.main === module) {
  debugRosterPayloads()
    .then(() => {
      console.log('\n✅ Debugging completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Debugging failed:', error);
      process.exit(1);
    });
}

export { debugRosterPayloads, createCanonicalResidentData, createMinimalGameplayPayload };
