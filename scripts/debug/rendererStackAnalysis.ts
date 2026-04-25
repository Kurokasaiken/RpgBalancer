/**
 * Renderer Stack Analysis Script
 * 
 * This script extracts renderer stack data from both /test and /minimal-gameplay pages
 * and identifies the first exact divergence point in the renderer stack.
 * 
 * Analysis-only: No fixes applied, only renderer-level data extraction and comparison.
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
 * Extract renderer stack data from page window
 */
async function extractRendererStackData(page: puppeteer.Page): Promise<any> {
  await page.waitForFunction(
    () => {
      return (window as any).__RENDERER_STACK_DATA__ !== undefined;
    },
    { timeout: 10000 }
  );

  return await page.evaluate(() => {
    return (window as any).__RENDERER_STACK_DATA__;
  });
}

/**
 * Compare renderer stack data component by component
 */
function compareRendererStackData(testData: any, minimalData: any): {
  divergencePoint: any;
  componentComparisons: any[];
} {
  console.log(`Comparing renderer stack data: test=${testData.page}, minimal=${minimalData.page}`);

  const componentComparisons: any[] = [];
  let divergencePoint: any = null;

  // Get all unique components from both pages
  const allComponents = new Set([
    ...testData.stackData.map((d: any) => d.component),
    ...minimalData.stackData.map((d: any) => d.component)
  ]);

  // Compare each component
  for (const component of allComponents) {
    const testComponentData = testData.stackData.find((d: any) => d.component === component);
    const minimalComponentData = minimalData.stackData.find((d: any) => d.component === component);

    const comparison = {
      component,
      testExists: !!testComponentData,
      minimalExists: !!minimalComponentData,
      differences: [] as any[],
    };

    if (!testComponentData && !minimalComponentData) {
      continue; // Both missing, skip
    }

    if (!testComponentData) {
      comparison.differences.push({
        type: 'missing_in_test',
        minimalData: minimalComponentData
      });
      if (!divergencePoint) {
        divergencePoint = {
          component,
          issue: 'Missing in test page',
          details: comparison.differences[0]
        };
      }
    } else if (!minimalComponentData) {
      comparison.differences.push({
        type: 'missing_in_minimal',
        testData: testComponentData
      });
      if (!divergencePoint) {
        divergencePoint = {
          component,
          issue: 'Missing in minimal page',
          details: comparison.differences[0]
        };
      }
    } else {
      // Compare component data
      const diff = compareComponentData(component, testComponentData, minimalComponentData);
      comparison.differences = diff.differences;
      if (diff.firstDifference && !divergencePoint) {
        divergencePoint = diff.firstDifference;
      }
    }

    componentComparisons.push(comparison);
  }

  return { divergencePoint, componentComparisons };
}

/**
 * Compare specific component data
 */
function compareComponentData(component: string, testData: any, minimalData: any): {
  differences: any[];
  firstDifference: any;
} {
  const differences: any[] = [];
  let firstDifference: any = null;

  // Component-specific comparison logic
  switch (component) {
    case 'VillageRosterSection':
      const villageDiff = compareVillageRosterSection(testData, minimalData);
      differences.push(...villageDiff.differences);
      firstDifference = villageDiff.firstDifference;
      break;

    case 'ResidentRosterPanel':
      const panelDiff = compareResidentRosterPanel(testData, minimalData);
      differences.push(...panelDiff.differences);
      if (!firstDifference) firstDifference = panelDiff.firstDifference;
      break;

    case 'DragTestContainer':
      const dragDiff = compareDragTestContainer(testData, minimalData);
      differences.push(...dragDiff.differences);
      if (!firstDifference) firstDifference = dragDiff.firstDifference;
      break;

    case 'PgCard':
      const pgCardDiff = comparePgCard(testData, minimalData);
      differences.push(...pgCardDiff.differences);
      if (!firstDifference) firstDifference = pgCardDiff.firstDifference;
      break;

    default:
      differences.push({
        type: 'unknown_component',
        component,
        testData,
        minimalData
      });
      firstDifference = differences[0];
  }

  return { differences, firstDifference };
}

/**
 * Compare VillageRosterSection data
 */
function compareVillageRosterSection(testData: any, minimalData: any): {
  differences: any[];
  firstDifference: any;
} {
  const differences: any[] = [];
  let firstDifference: any = null;

  // Compare input counts
  if (testData.inputCount !== minimalData.inputCount) {
    const diff = {
      field: 'inputCount',
      test: testData.inputCount,
      minimal: minimalData.inputCount
    };
    differences.push(diff);
    if (!firstDifference) firstDifference = { component: 'VillageRosterSection', ...diff };
  }

  // Compare raw residents
  const testResidents = testData.rawResidents || [];
  const minimalResidents = minimalData.rawResidents || [];

  for (let i = 0; i < Math.max(testResidents.length, minimalResidents.length); i++) {
    const testRes = testResidents[i];
    const minRes = minimalResidents[i];

    if (!testRes && !minRes) continue;
    if (!testRes || !minRes) {
      const diff = {
        field: `rawResidents[${i}]`,
        test: testRes,
        minimal: minRes
      };
      differences.push(diff);
      if (!firstDifference) firstDifference = { component: 'VillageRosterSection', ...diff };
      continue;
    }

    // Compare resident fields
    ['id', 'name', 'hp', 'maxHp', 'fatigue'].forEach(field => {
      if (JSON.stringify(testRes[field]) !== JSON.stringify(minRes[field])) {
        const diff = {
          field: `rawResidents[${i}].${field}`,
          test: testRes[field],
          minimal: minRes[field]
        };
        differences.push(diff);
        if (!firstDifference) firstDifference = { component: 'VillageRosterSection', ...diff };
      }
    });
  }

  return { differences, firstDifference };
}

/**
 * Compare ResidentRosterPanel data
 */
function compareResidentRosterPanel(testData: any, minimalData: any): {
  differences: any[];
  firstDifference: any;
} {
  const differences: any[] = [];
  let firstDifference: any = null;

  // Compare passed data
  const testPassed = testData.passedToDragTestContainer || {};
  const minimalPassed = minimalData.passedToDragTestContainer || {};

  if (testPassed.count !== minimalPassed.count) {
    const diff = {
      field: 'passedToDragTestContainer.count',
      test: testPassed.count,
      minimal: minimalPassed.count
    };
    differences.push(diff);
    if (!firstDifference) firstDifference = { component: 'ResidentRosterPanel', ...diff };
  }

  return { differences, firstDifference };
}

/**
 * Compare DragTestContainer data
 */
function compareDragTestContainer(testData: any, minimalData: any): {
  differences: any[];
  firstDifference: any;
} {
  const differences: any[] = [];
  let firstDifference: any = null;

  // Compare processed residents
  const testProcessed = testData.processedResidents || [];
  const minimalProcessed = minimalData.processedResidents || [];

  for (let i = 0; i < Math.max(testProcessed.length, minimalProcessed.length); i++) {
    const testRes = testProcessed[i];
    const minRes = minimalProcessed[i];

    if (!testRes && !minRes) continue;
    if (!testRes || !minRes) {
      const diff = {
        field: `processedResidents[${i}]`,
        test: testRes,
        minimal: minRes
      };
      differences.push(diff);
      if (!firstDifference) firstDifference = { component: 'DragTestContainer', ...diff };
      continue;
    }

    // Compare processed resident fields
    ['id', 'name', 'hp', 'maxHp', 'fatigue', 'index'].forEach(field => {
      if (JSON.stringify(testRes[field]) !== JSON.stringify(minRes[field])) {
        const diff = {
          field: `processedResidents[${i}].${field}`,
          test: testRes[field],
          minimal: minRes[field]
        };
        differences.push(diff);
        if (!firstDifference) firstDifference = { component: 'DragTestContainer', ...diff };
      }
    });
  }

  // Compare PgCard props
  const testProps = testData.pgCardProps || [];
  const minimalProps = minimalData.pgCardProps || [];

  for (let i = 0; i < Math.max(testProps.length, minimalProps.length); i++) {
    const testProp = testProps[i];
    const minProp = minimalProps[i];

    if (!testProp && !minProp) continue;
    if (!testProp || !minProp) {
      const diff = {
        field: `pgCardProps[${i}]`,
        test: testProp,
        minimal: minProp
      };
      differences.push(diff);
      if (!firstDifference) firstDifference = { component: 'DragTestContainer', ...diff };
      continue;
    }

    // Compare PgCard prop fields
    ['workerId', 'label', 'hp', 'fatigue', 'maxHp', 'portraitUrl', 'index'].forEach(field => {
      if (JSON.stringify(testProp[field]) !== JSON.stringify(minProp[field])) {
        const diff = {
          field: `pgCardProps[${i}].${field}`,
          test: testProp[field],
          minimal: minProp[field]
        };
        differences.push(diff);
        if (!firstDifference) firstDifference = { component: 'DragTestContainer', ...diff };
      }
    });
  }

  return { differences, firstDifference };
}

/**
 * Compare PgCard data
 */
function comparePgCard(testData: any, minimalData: any): {
  differences: any[];
  firstDifference: any;
} {
  const differences: any[] = [];
  let firstDifference: any = null;

  // Compare final props
  ['workerId', 'label', 'hp', 'fatigue', 'maxHp', 'portraitUrl'].forEach(field => {
    const testValue = testData.finalProps?.[field];
    const minValue = minimalData.finalProps?.[field];
    
    if (JSON.stringify(testValue) !== JSON.stringify(minValue)) {
      const diff = {
        field: `finalProps.${field}`,
        test: testValue,
        minimal: minValue
      };
      differences.push(diff);
      if (!firstDifference) firstDifference = { component: 'PgCard', ...diff };
    }
  });

  // Compare display values
  ['displayName', 'displayedHp', 'displayedFatigue', 'portraitResolvedSource', 'finalRenderOrder'].forEach(field => {
    const testValue = testData.displayValues?.[field];
    const minValue = minimalData.displayValues?.[field];
    
    if (JSON.stringify(testValue) !== JSON.stringify(minValue)) {
      const diff = {
        field: `displayValues.${field}`,
        test: testValue,
        minimal: minValue
      };
      differences.push(diff);
      if (!firstDifference) firstDifference = { component: 'PgCard', ...diff };
    }
  });

  return { differences, firstDifference };
}

/**
 * Main execution function
 */
async function analyzeRendererStack() {
  console.log('🚀 Starting renderer stack analysis...');
  
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

    // Extract /test renderer stack data (reference)
    console.log('\n🔍 Extracting /test renderer stack data...');
    const testPage = await browser.newPage();
    
    await testPage.goto(`${BASE_URL}/test`, { waitUntil: 'networkidle0' });
    const testData = await extractRendererStackData(testPage);
    
    console.log('✅ /test renderer stack data extracted:', testData?.stackData?.length, 'components');
    await testPage.close();

    // Extract /minimal-gameplay renderer stack data (with seeded store)
    console.log('\n🔍 Extracting /minimal-gameplay renderer stack data...');
    const minimalPage = await browser.newPage();
    
    // Seed localStorage before page boot
    await minimalPage.evaluateOnNewDocument(
      ({ key, payload }) => {
        window.localStorage.setItem(key, JSON.stringify(payload));
      },
      { key: STORAGE_KEY, payload: seedPayload }
    );
    
    await minimalPage.goto(`${BASE_URL}/minimal-gameplay`, { waitUntil: 'networkidle0' });
    const minimalData = await extractRendererStackData(minimalPage);
    
    console.log('✅ /minimal-gameplay renderer stack data extracted:', minimalData?.stackData?.length, 'components');
    await minimalPage.close();

    // Compare renderer stack data
    console.log('\n📊 Comparing renderer stack data...');
    const comparison = compareRendererStackData(testData, minimalData);
    
    console.log('\n=== RENDERER STACK ANALYSIS RESULTS ===');
    console.log('A. Test page components:', testData.stackData?.map((d: any) => d.component).join(', '));
    console.log('B. Minimal page components:', minimalData.stackData?.map((d: any) => d.component).join(', '));
    console.log('C. Component-by-component comparison:');
    
    comparison.componentComparisons.forEach(comp => {
      console.log(`   ${comp.component}:`);
      console.log(`     Test exists: ${comp.testExists}, Minimal exists: ${comp.minimalExists}`);
      console.log(`     Differences: ${comp.differences.length}`);
      
      if (comp.differences.length > 0) {
        comp.differences.slice(0, 3).forEach(diff => {
          console.log(`       - ${diff.field}: test=${JSON.stringify(diff.test || 'N/A')}, minimal=${JSON.stringify(diff.minimal || 'N/A')}`);
        });
        
        if (comp.differences.length > 3) {
          console.log(`       ... and ${comp.differences.length - 3} more differences`);
        }
      }
    });

    console.log('\nD. FIRST EXACT DIVERGENCE POINT:');
    if (comparison.divergencePoint) {
      console.log(`   Component: ${comparison.divergencePoint.component}`);
      console.log(`   Issue: ${comparison.divergencePoint.issue}`);
      console.log(`   Field: ${comparison.divergencePoint.field}`);
      console.log(`   Test value: ${JSON.stringify(comparison.divergencePoint.test)}`);
      console.log(`   Minimal value: ${JSON.stringify(comparison.divergencePoint.minimal)}`);
      
      console.log('\n🎯 ANALYSIS COMPLETE - First renderer-level divergence identified.');
      console.log('   This is the exact point where the two renderer stacks differ.');
      console.log('   No fixes applied - analysis only as requested.');
    } else {
      console.log('   ✅ No divergence found - renderer stacks are identical');
    }

    // Export full data for manual inspection
    console.log('\nE. Full data export:');
    console.log('   Test data available at: window.__RENDERER_STACK_DATA__ on /test page');
    console.log('   Minimal data available at: window.__RENDERER_STACK_DATA__ on /minimal-gameplay page');

    return comparison;

  } catch (error) {
    console.error('❌ Error during renderer stack analysis:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Execute if run directly
if (require.main === module) {
  analyzeRendererStack()
    .then(() => {
      console.log('\n✅ Renderer stack analysis completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Renderer stack analysis failed:', error);
      process.exit(1);
    });
}

export { analyzeRendererStack, createCanonicalResidentData, createMinimalGameplayPayload };
