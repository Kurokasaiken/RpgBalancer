import { defineConfig } from '@playwright/test';
import { captureTelemetryFixture } from './playwrightTelemetryHelper';

/**
 * Playwright configuration extension for mobile playtest logger integration.
 * Extends base config with telemetry capture and post-test workflow hooks.
 */

// Extend the base Playwright config with mobile logger integration
export const mobileLoggerConfig = defineConfig({
  // Global setup for mobile logger integration
  globalSetup: async (): Promise<void> => {
    console.log('🔧 Setting up mobile playtest logger integration...');
    
    // Ensure test-results/telemetry directory exists
    const { mkdirSync } = await import('fs');
    const { join, resolve } = await import('path');
    
    const testResultsDir = resolve(process.cwd(), 'test-results');
    const telemetryDir = join(testResultsDir, 'telemetry');
    
    try {
      mkdirSync(telemetryDir, { recursive: true });
      console.log(`📁 Telemetry directory ready: ${telemetryDir}`);
    } catch (error) {
      console.warn('⚠️  Failed to create telemetry directory:', error);
    }
  },

  // Global teardown to run post-test workflow
  globalTeardown: async (): Promise<void> => {
    console.log('🔄 Running mobile playtest logger post-test workflow...');
    
    // Only run if telemetry files exist
    const { existsSync } = await import('fs');
    const { resolve } = await import('path');
    
    const telemetryDir = resolve(process.cwd(), 'test-results/telemetry');
    
    if (!existsSync(telemetryDir)) {
      console.log('📂 No telemetry directory found, skipping post-test workflow');
      return;
    }
    
    // Check if telemetry directory has files
    const { readdirSync } = await import('fs');
    const files = readdirSync(telemetryDir);
    
    if (files.length === 0) {
      console.log('📂 No telemetry files found, skipping post-test workflow');
      return;
    }
    
    // Run the post-test workflow
    const { spawn } = await import('child_process');
    
    return new Promise<void>((resolve, reject) => {
      const child = spawn('npx', ['tsx', 'scripts/postTestMobileLogger.ts'], {
        cwd: process.cwd(),
        stdio: 'inherit',
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Mobile playtest logger post-test workflow completed');
          resolve();
        } else {
          console.error(`❌ Post-test workflow failed with code ${code}`);
          reject(new Error(`Post-test workflow failed with code ${code}`));
        }
      });

      child.on('error', (error) => {
        console.error('❌ Failed to run post-test workflow:', error);
        reject(error);
      });
    });
  },

  // Reporter configuration for mobile logger integration
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    // Custom reporter for mobile logger integration
    [
      './tests/helpers/mobileLoggerReporter.ts',
      {
        outputFile: 'test-results/mobile-logger-report.json',
        enabled: true,
      },
    ],
  ],

  // Test timeout configuration for mobile tests
  timeout: 60000, // 60s default for mobile tests
  expect: {
    timeout: 10000, // 10s for assertions
  },
});

// Export fixture for use in individual test files
export { captureTelemetryFixture };

// Export helper functions for manual usage
export * from './playwrightTelemetryHelper';
