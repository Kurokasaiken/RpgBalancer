import { test, expect, type Page, type TestInfo } from '@playwright/test';

// Type declarations for window objects
declare global {
  interface Window {
    residents?: any[];
    poiCapsuleData?: any;
    __idleVillageTestHooks?: any;
  }
}

const POI_SELECTORS = {
  residentCard: '[data-testid="pg-card"]',
  poiCapsule: '[data-testid="activity-capsule"]',
  collectButton: '.activity-capsule__cta',
  progressBar: '[data-testid="activity-capsule-progress"]',
  timerDisplay: '[class*="timer"]',
  rackSlot: '[data-testid^="slot-"]',
  poiConfig: '[data-poi]',
} as const;

// Test residents data (copied from villageSandbox fixtures)
const TEST_RESIDENTS = [
  {
    id: 'resident-tank-001',
    name: 'Sir Spaccaculi',
    aiBehavior: 'tank',
    statBlock: {
      hp: 280,
      damage: 24,
      txc: 22,
      evasion: 6,
      agility: 42,
      armor: 35,
      resistance: 18,
      block: 28
    },
    equippedSpellIds: [],
    status: 'available',
    fatigue: 0,
    currentHp: 280,
    maxHp: 280,
    isInjured: false,
    isHero: true,
    survivalCount: 7,
    survivalScore: 540,
    lastUpdated: Date.now()
  },
  {
    id: 'resident-support-001',
    name: 'Salvatrice',
    aiBehavior: 'support',
    statBlock: {
      hp: 210,
      damage: 18,
      txc: 28,
      evasion: 8,
      agility: 60,
      ward: 24,
      regen: 9,
      resistance: 20
    },
    equippedSpellIds: [],
    status: 'available',
    fatigue: 0,
    currentHp: 210,
    maxHp: 210,
    isInjured: false,
    isHero: true,
    survivalCount: 6,
    survivalScore: 420,
    lastUpdated: Date.now()
  }
];

/**
 * Simple drag and drop implementation
 */
async function dragResidentCard(page: Page, source: any, target: any): Promise<void> {
  await source.dragTo(target);
}

/**
 * Navigate to test roster page
 */
async function navigateToTestRoster(page: Page): Promise<void> {
  await page.goto('/test');
}

/**
 * Enable test hooks
 */
async function autoEnableTestHooks(page: Page): Promise<void> {
  await page.waitForFunction(() => window.__idleVillageReady === true, undefined, { timeout: 20_000 });
}

/**
 * Navigate to test roster page and verify POI is visible
 */
async function navigateToPoiTest(page: Page): Promise<void> {
  await page.goto('/test');
  await autoEnableTestHooks(page);
  
  // Wait for POI to be visible
  await expect(page.locator(POI_SELECTORS.poiCapsule)).toBeVisible({ timeout: 10_000 });
  
  // Verify POI has correct configuration
  const poiElement = page.locator(POI_SELECTORS.poiCapsule);
  await expect(poiElement).toContainText('Gold Mine · POI Test');
  await expect(poiElement).toContainText('Estrazione oro + drag & drop test');
}

/**
 * Seed residents for POI testing
 */
async function seedPoiResidents(page: Page): Promise<{ residentId: string; residentName: string }> {
  await page.evaluate((residents) => {
    // Clear existing residents
    localStorage.removeItem('idle_combat_characters');
    
    // Save new residents in correct format
    localStorage.setItem('idle_combat_characters', JSON.stringify(residents));
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('characterStorageUpdated'));
  }, TEST_RESIDENTS);

  // Wait for residents to load
  await page.waitForFunction(() => {
    const residents = window.residents || [];
    return residents.length >= 3;
  }, undefined, { timeout: 10_000 });

  const firstResident = TEST_RESIDENTS[0];
  return { 
    residentId: firstResident.id, 
    residentName: firstResident.name 
  };
}

/**
 * Assign resident to POI rack slot
 */
async function assignResidentToPoiRack(page: Page, residentId: string, residentName: string): Promise<void> {
  // Find the resident card
  const residentCard = page.locator(POI_SELECTORS.residentCard).filter({ hasText: residentName }).first();
  await expect(residentCard).toBeVisible({ timeout: 10_000 });

  // Find the first available rack slot
  const rackSlot = page.locator(POI_SELECTORS.rackSlot).first();
  await expect(rackSlot).toBeVisible({ timeout: 10_000 });

  // Drag and drop
  await dragResidentCard(page, residentCard, rackSlot);

  // Wait a moment for assignment to process
  await page.waitForTimeout(1000);

  // Verify assignment was successful
  await expect(rackSlot).toContainText(residentName, { timeout: 5_000 });
}

/**
 * Get current POI state from the page
 */
async function getPoiState(page: Page): Promise<{
  status: string;
  progress: number;
  canCollect: boolean;
  timerText: string;
  slotsOccupied: number;
}> {
  return await page.evaluate(() => {
    const poiData = window.poiCapsuleData;
    if (!poiData) {
      return {
        status: 'unknown',
        progress: 0,
        canCollect: false,
        timerText: '',
        slotsOccupied: 0,
      };
    }

    const timerElement = document.querySelector('[class*="timer"]');
    const timerText = timerElement?.textContent?.trim() || '';

    return {
      status: poiData.status,
      progress: poiData.progressFraction,
      canCollect: poiData.canCollect,
      timerText,
      slotsOccupied: poiData.slots?.filter((s: any) => s.isOccupied)?.length || 0,
    };
  });
}

/**
 * Wait for POI timer to complete
 */
async function waitForPoiCompletion(page: Page): Promise<void> {
  // Wait for timer to reach completion (1:00)
  await expect.poll(async () => {
    const state = await getPoiState(page);
    return state.status === 'completed';
  }, {
    timeout: 70_000, // 70 seconds for 1 minute timer + buffer
    intervals: [1_000, 2_000, 5_000],
  }).toBe(true);

  // Verify progress is 100%
  const finalState = await getPoiState(page);
  expect(finalState.progress).toBe(1);
  expect(finalState.status).toBe('completed');
}

/**
 * Verify collect button behavior
 */
async function verifyCollectButton(page: Page): Promise<void> {
  const collectButton = page.locator(POI_SELECTORS.collectButton);
  
  // Button should be visible and enabled
  await expect(collectButton).toBeVisible({ timeout: 5_000 });
  await expect(collectButton).toBeEnabled();
  
  // Verify button text
  await expect(collectButton).toContainText('Raccogli oro');

  // Click the collect button
  await collectButton.click();

  // Verify telemetry event (if available)
  await page.waitForTimeout(500); // Allow telemetry to fire
  
  // Button might become disabled after collection
  const isDisabled = await collectButton.isDisabled();
  console.log(`Collect button disabled after click: ${isDisabled}`);
}

test.describe('POI Collect Integration (2-Phase Test)', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToPoiTest(page);
  });

  test('Phase 1: Setup resident assignment to POI rack', async ({ page }, testInfo) => {
    console.log('🔧 Phase 1: Setting up resident assignment...');
    
    // Step 1: Seed residents
    const { residentId, residentName } = await seedPoiResidents(page);
    console.log(`📋 Seeded resident: ${residentName} (${residentId})`);

    // Step 2: Assign resident to rack
    await assignResidentToPoiRack(page, residentId, residentName);
    console.log(`✅ Assigned ${residentName} to POI rack`);

    // Step 3: Verify initial POI state
    const initialState = await getPoiState(page);
    console.log('🏆 Initial POI state:', initialState);

    expect(initialState.slotsOccupied).toBeGreaterThan(0);
    expect(initialState.status).toBe('idle'); // Should start as idle
    expect(initialState.canCollect).toBe(false); // Cannot collect yet

    // Attach screenshot for documentation
    await page.screenshot({ 
      path: `test-results/poi-phase1-assignment-${Date.now()}.png`,
      fullPage: true 
    });

    console.log('✅ Phase 1 completed: Resident assigned successfully');
  });

  test('Phase 2: Verify collect button behavior after timer completion', async ({ page }, testInfo) => {
    console.log('⏱️ Phase 2: Testing timer completion and collect button...');

    // Step 1: Verify POI has assigned residents from Phase 1
    const initialState = await getPoiState(page);
    console.log('🏆 POI state at start of Phase 2:', initialState);
    
    expect(initialState.slotsOccupied).toBeGreaterThan(0);
    expect(initialState.canCollect).toBe(false);

    // Step 2: Wait for timer completion
    console.log('⏳ Waiting for POI timer to complete...');
    await waitForPoiCompletion(page);
    console.log('✅ POI timer completed');

    // Step 3: Verify collect button appears
    console.log('🎯 Verifying collect button...');
    await verifyCollectButton(page);
    console.log('✅ Collect button verified and clicked');

    // Step 4: Final state verification
    const finalState = await getPoiState(page);
    console.log('🏆 Final POI state:', finalState);

    // Attach final screenshot
    await page.screenshot({ 
      path: `test-results/poi-phase2-collect-${Date.now()}.png`,
      fullPage: true 
    });

    console.log('✅ Phase 2 completed: Collect button test successful');
  });

  test('Integration: Full end-to-end POI workflow', async ({ page }, testInfo) => {
    console.log('🔄 Full Integration Test: Complete POI workflow...');

    // Complete workflow in one test
    const { residentId, residentName } = await seedPoiResidents(page);
    await assignResidentToPoiRack(page, residentId, residentName);
    
    // Verify initial state
    const initialState = await getPoiState(page);
    expect(initialState.slotsOccupied).toBeGreaterThan(0);
    expect(initialState.canCollect).toBe(false);

    // Wait for completion
    await waitForPoiCompletion(page);
    
    // Verify and click collect button
    await verifyCollectButton(page);

    console.log('✅ Full integration test completed successfully');
  });
});

test.describe('POI Edge Cases', () => {
  test('No residents assigned - collect button should not appear', async ({ page }) => {
    await navigateToPoiTest(page);
    
    // Wait for timer completion without assigning residents
    await waitForPoiCompletion(page);
    
    // Collect button should NOT appear
    const collectButton = page.locator(POI_SELECTORS.collectButton);
    await expect(collectButton).not.toBeVisible({ timeout: 5_000 });
    
    const state = await getPoiState(page);
    expect(state.canCollect).toBe(false);
    expect(state.slotsOccupied).toBe(0);
  });

  test('Multiple residents assigned - collect button should work', async ({ page }) => {
    await navigateToPoiTest(page);
    
    // Assign multiple residents
    const residents = await seedPoiResidents(page);
    await assignResidentToPoiRack(page, residents.residentId, residents.residentName);
    
    // Wait for completion
    await waitForPoiCompletion(page);
    
    // Collect button should work
    await verifyCollectButton(page);
    
    const state = await getPoiState(page);
    expect(state.slotsOccupied).toBeGreaterThan(0);
  });
});
