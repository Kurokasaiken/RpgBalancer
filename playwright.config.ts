import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: 'test-results/.artifacts',
  fullyParallel: false, // Run tests in sequence to avoid conflicts
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
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
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Run tests one at a time for stability
  timeout: 120000, // Increase global test timeout to 2 minutes
  expect: {
    timeout: 10000, // Increase expect timeout to 10 seconds
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.001,
      threshold: 0.2,
      animations: 'disabled',
    },
  },
  use: {
    baseURL: 'http://127.0.0.1:5179',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    navigationTimeout: 30000, // 30 seconds navigation timeout
    actionTimeout: 10000, // 10 seconds for actions like click, fill, etc.
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    // Enable mobile tests for E2E integration with mobile logger
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 14 Pro'],
        // Mobile-specific configuration for logger integration
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
      },
      testMatch: ['**/*mobile*.spec.ts'],
      testIgnore: ['**/*touch-mode*.spec.ts'], // Exclude touch-mode tests from Safari
    },
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 7'],
        // Mobile-specific configuration for logger integration
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
      },
      testMatch: ['**/*mobile*.spec.ts', '**/*touch-mode*.spec.ts'],
    },
    // Visual Regression Testing project (Docker only)
    {
      name: 'Visual Regression',
      testMatch: '**/*.visual.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        launchOptions: {
          args: ['--force-prefers-reduced-motion'],
        },
      },
      grep: /@visual/,
    },
    // Mobile Visual Regression
    {
      name: 'Visual Regression Mobile',
      testMatch: '**/*.visual.spec.ts',
      use: {
        ...devices['iPhone 14 Pro'],
        launchOptions: {
          args: ['--force-prefers-reduced-motion'],
        },
      },
      grep: /@visual.*@mobile/,
    },
  ],
  webServer: {
    command: 'npm run preview:playwright',
    url: 'http://127.0.0.1:5179',
    reuseExistingServer: false,
    timeout: 240 * 1000, // allow extra time for build + preview startup
    stderr: 'pipe',
    stdout: 'pipe',
    env: {
      ...process.env,
      VITE_DISABLE_DEV_OVERLAY: 'true',
      NODE_ENV: 'test',
    },
  },
  // Global setup for mobile logger integration
  globalSetup: './tests/helpers/mobileLoggerSetup.ts',
  
  // Global teardown to run post-test workflow
  globalTeardown: './tests/helpers/mobileLoggerTeardown.ts',
});
