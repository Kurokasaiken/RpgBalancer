import { test as base, type Page, type TestInfo } from '@playwright/test';
import { captureAndSaveTelemetry } from './playwrightTelemetryHelper';
import { autoSetupSessionTag, validateSessionStorage } from './sessionTagHelper';

/**
 * Extended Playwright test fixtures for mobile playtest logger integration.
 * Combines telemetry capture, session tagging, and validation in a single fixture.
 */

// Declare the fixture types
interface MobileLoggerFixtures {
  page: Page;
  mobileLogger: {
    captureTelemetry: () => Promise<string | null>;
    getSessionTag: () => Promise<string | null>;
    validateStorage: () => Promise<boolean>;
    sessionTag: string;
  };
}

const getTestMetadata = (testInfo: TestInfo): { title: string; file: string } => ({
  title: testInfo.title,
  file: testInfo.file ?? 'unknown',
});

// Extend the base test with mobile logger fixtures
export const test = base.extend<MobileLoggerFixtures>({
  // Override page to add session tagging
  page: async ({ page }, providePage, testInfo) => {
    const metadata = getTestMetadata(testInfo);
    
    // Validate sessionStorage availability
    const validation = await validateSessionStorage(page);
    if (!validation.available) {
      console.warn('⚠️  SessionStorage not available - session tagging disabled');
    } else if (!validation.canSetGet) {
      console.warn('⚠️  SessionStorage set/get failed - session tagging disabled');
    }

    // Auto-setup session tag
    const setupResult = await autoSetupSessionTag(page, metadata);
    if (!setupResult.success) {
      console.warn(`⚠️  Session tag setup failed: ${setupResult.error}`);
    }

    // Provide the page
    await providePage(page);
  },

  // Mobile logger fixture with helper methods
  mobileLogger: async ({ page }, provideLogger, testInfo) => {
    const metadata = getTestMetadata(testInfo);
    
    // Setup session tag first
    const setupResult = await autoSetupSessionTag(page, metadata);
    const sessionTag = setupResult.success ? setupResult.tag : '';

    const mobileLogger = {
      // Capture telemetry and save to test-results
      captureTelemetry: async (): Promise<string | null> => {
        return captureAndSaveTelemetry(page, metadata);
      },

      // Get current session tag
      getSessionTag: async (): Promise<string | null> => {
        const { getSessionTag } = await import('./sessionTagHelper');
        const result = await getSessionTag(page);
        return result.tag;
      },

      // Validate sessionStorage functionality
      validateStorage: async (): Promise<boolean> => {
        const validation = await validateSessionStorage(page);
        return validation.available && validation.canSetGet;
      },

      // Expose the session tag
      sessionTag,
    };

    await provideLogger(mobileLogger);

    // Optional: Capture telemetry automatically after test
    // This is handled by the captureTelemetryFixture in the config
  },
});

// Export the extended test and expect
export { expect } from '@playwright/test';

// Export individual fixtures for manual usage
export { captureAndSaveTelemetry } from './playwrightTelemetryHelper';
export { autoSetupSessionTag, getSessionTag, clearSessionTag } from './sessionTagHelper';

/**
 * Example usage:
 * 
 * import { test, expect } from '../tests/helpers/mobileLoggerFixtures';
 * 
 * test('mobile playtest with telemetry', async ({ page, mobileLogger }) => {
 *   // Test logic here
 *   await page.goto('/punch-club');
 *   
 *   // Session tag is automatically set up
 *   console.log('Session tag:', mobileLogger.sessionTag);
 *   
 *   // Validate storage if needed
 *   const storageValid = await mobileLogger.validateStorage();
 *   expect(storageValid).toBe(true);
 *   
 *   // Manual telemetry capture (optional - automatic capture also available)
 *   const telemetryFile = await mobileLogger.captureTelemetry();
 *   if (telemetryFile) {
 *     console.log('Telemetry saved:', telemetryFile);
 *   }
 * });
 */
