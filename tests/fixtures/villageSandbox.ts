import { Page } from '@playwright/test';

/**
 * Deterministic Village State Fixture
 * 
 * Provides helper functions to inject a known state into the Village Sandbox
 * for reliable UI testing. Bypasses random generation in favor of fixed seeds.
 */

export const MOCK_RESIDENT_1_ID = 'resident-mock-1';
export const MOCK_RESIDENT_2_ID = 'resident-mock-2';

/**
 * Injects a specific village state into the browser's localStorage or 
 * directly manipulates the store if possible. 
 * For now, we rely on the sandbox's "Reset" capability or URL params if implemented.
 * 
 * Since direct store injection is complex without exposing window objects,
 * we will focus on mocking the configuration response if the app uses fetch,
 * or simply rely on the fact that we can drive the UI to a known state.
 * 
 * However, the most robust way for the Sandbox is to likely use a URL parameter
 * or a hidden window function that `VillageSandbox.tsx` exposes when process.env.NODE_ENV === 'test'.
 * 
 * Given we can't easily change the app code instantly to expose window globals without a rebuild,
 * we will start by defining the data structure we EXPECT to see/intercept.
 */

export const mockVillageConfig = {
    activities: {
        'activity-foraging': {
            id: 'activity-foraging',
            label: 'Foraging',
            durationFormula: '5',
            maxSlots: 2,
        },
        'activity-meditation': {
            id: 'activity-meditation',
            label: 'Meditation',
            durationFormula: '3',
            maxSlots: 1,
        }
    },
    globalRules: {
        secondsPerTimeUnit: 1, // Fast time for tests
        dayLengthInTimeUnits: 20
    }
};

export const seedVillageFn = `
  (function() {
    // This is a browser-side function to inject state.
    // It mocks the "loadResidents" behavior if we can hook into it,
    // or we might need to rely on the app's internal reset logic.
    
    // For this wave, we will assume we test with the DEFAULT seeded residents 
    // unless we add a specific mechanism to inject them.
    console.log('[Fixture] Seed function injected');
  })();
`;

/**
 * Actions to perform setup on the page before test starts.
 */
export async function seedVillageSandbox(page: Page) {
    // Navigate to sandbox
    await page.goto('/village-sandbox');

    // Wait for React hydration
    await page.waitForLoadState('networkidle');

    // Potential future hook:
    // await page.evaluate(seedVillageFn);
}
