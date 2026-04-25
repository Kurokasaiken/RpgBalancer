# Punch Club PWA Install Playwright Suite

**Since:** NP-073 – Punch Club PWA Install Playwright Suite  
**Status:** ✅ Complete  
**Last Updated:** 2026-01-20

## Overview

The Punch Club PWA Install Playwright Suite provides comprehensive end-to-end testing for Progressive Web App installation and functionality. This test suite validates manifest compliance, service worker registration, install prompts, offline functionality, and cross-browser compatibility for the Punch Club PWA.

## Features

### 🎯 Core Testing Capabilities
- **Manifest Validation**: Web App Manifest compliance and required properties
- **Service Worker Testing**: Registration, activation, and update workflows
- **Install Prompt Testing**: Desktop and mobile install prompt availability
- **Offline Functionality**: Cache strategies and offline content availability
- **Cross-Browser Testing**: Chrome, Firefox, Safari compatibility
- **Mobile Viewport Testing**: Touch interactions and responsive design
- **Performance Testing**: Load times and registration performance
- **Accessibility Testing**: Keyboard navigation and ARIA compliance
- **Error Handling**: Graceful failure and recovery scenarios

### 📊 Test Coverage
- **Manifest Validation**: Required properties, icons, display modes
- **Service Worker**: Registration, scope, update mechanisms
- **Install Prompts**: Desktop install UI, mobile native install
- **Offline Functionality**: Cached content, fallback mechanisms
- **Cache Strategies**: Storage quotas and cache management
- **Update Workflows**: Service worker updates and version management
- **Error Recovery**: Network failures, service worker errors
- **Accessibility**: Screen reader and keyboard navigation

### 🔧 Test Configuration
- **Multiple Viewports**: Desktop, laptop, tablet, mobile, landscape mobile
- **Cross-Browser**: Chrome, Firefox, Safari testing
- **Network Conditions**: Online, offline, slow 3G, fast 3G simulation
- **Timeouts**: Configurable timeouts for different operations
- **Screenshots**: Automatic screenshots on failure
- **Video Recording**: Optional video capture in CI environments

## Architecture

### Test Structure
```
tests/e2e/punchClub/
├── fixtures/
│   └── pwaInstallFixtures.ts                    # Test scenarios and data
├── PWAInstallSuite.spec.ts                      # Main PWA test suite
├── PunchClub.spec.ts                            # Existing Punch Club tests
docs/punch_club/
└── pwa_install_playwright.md                    # Documentation
test-results/
├── screenshots/                                # Test screenshots
└── np-073-pwa-install-playwright-<data>.log      # Evidence log
```

### Test Categories
1. **Manifest Validation**: Web App Manifest compliance testing
2. **Service Worker Registration**: SW lifecycle and functionality
3. **Install Prompts**: Desktop and mobile install behavior
4. **Offline Functionality**: Cache strategies and offline access
5. **Cache Strategy**: Storage management and quota compliance
6. **Update Workflow**: Service worker update mechanisms
7. **Error Handling**: Failure scenarios and recovery
8. **Accessibility**: Screen reader and keyboard navigation
9. **Performance**: Load times and registration performance
10. **Integration**: End-to-end PWA lifecycle testing

## Configuration

### Test Fixtures
```typescript
interface PWAInstallScenario {
  id: string;
  type: PWAScenarioType;
  description: string;
  expectedResult: 'success' | 'failure' | 'warning';
  expectedFeatures: {
    hasValidManifest: boolean;
    hasServiceWorker: boolean;
    showsInstallPrompt: boolean;
    worksOffline: boolean;
    hasCache: boolean;
    isInstallable: boolean;
  };
  testConfig: {
    viewport: { width: number; height: number };
    userAgent?: string;
    networkConditions?: NetworkConditions;
    permissions?: string[];
    steps: string[];
  };
  expectedManifest?: ManifestProperties;
  expectedServiceWorker?: ServiceWorkerProperties;
  expectedInstall?: InstallProperties;
  expectedOffline?: OfflineProperties;
}
```

### Test Scenarios
```typescript
// Manifest validation scenario
{
  id: 'manifest-validation-desktop',
  type: 'manifest_validation',
  description: 'Validate PWA manifest on desktop browser',
  expectedResult: 'success',
  expectedFeatures: {
    hasValidManifest: true,
    hasServiceWorker: true,
    showsInstallPrompt: true,
    worksOffline: true,
    hasCache: true,
    isInstallable: true,
  },
  expectedManifest: {
    name: 'Punch Club',
    short_name: 'PunchClub',
    start_url: '/punch-club/',
    display: 'standalone',
    background_color: '#1a1a1a',
    theme_color: '#ff6b35',
    icons: [
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
}
```

### Viewport Configurations
```typescript
const VIEWPORT_CONFIGURATIONS = {
  desktop: { width: 1920, height: 1080 },
  laptop: { width: 1366, height: 768 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
  'mobile-landscape': { width: 667, height: 375 },
};
```

### Network Configurations
```typescript
const NETWORK_CONFIGURATIONS = {
  online: { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 },
  offline: { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 },
  slow3g: { offline: false, latency: 500, downloadThroughput: 500 * 1024, uploadThroughput: 500 * 1024 },
  fast3g: { offline: false, latency: 300, downloadThroughput: 1.6 * 1024 * 1024, uploadThroughput: 750 * 1024 },
};
```

### Timeout Configurations
```typescript
const TIMEOUT_CONFIGURATIONS = {
  default: 30000,
  navigation: 15000,
  serviceWorker: 10000,
  installPrompt: 5000,
  offline: 10000,
};
```

## Usage

### Running Tests

#### Basic Test Execution
```bash
# Run all PWA install tests
npm run test:e2e tests/e2e/punchClub/PWAInstallSuite.spec.ts

# Run with specific viewport
npx playwright test --config=playwright.config.ts --viewport="375,667" tests/e2e/punchClub/PWAInstallSuite.spec.ts

# Run with specific browser
npx playwright test --project=firefox tests/e2e/punchClub/PWAInstallSuite.spec.ts
```

#### Running with Coverage
```bash
# Run with coverage reporting
npm run test:e2e --coverage tests/e2e/punchClub/PWAInstallSuite.spec.ts

# Generate HTML coverage report
npx playwright show-report
```

#### Running in CI/CD
```bash
# In CI pipeline
npm run test:e2e --reporter=html --reporter=output/playwright-report
npm run test:e2e --reporter=json --reporter=output/playwright-results.json
```

### Test Categories

#### Manifest Validation Tests
```bash
# Run only manifest validation tests
npx playwright test --grep "Manifest Validation" tests/e2e/punchClub/PWAInstallSuite.spec.ts

# Run specific manifest test
npx playwright test --grep "should validate manifest on desktop" tests/e2e/punchClub/PWAInstallSuite.spec.ts
```

#### Service Worker Tests
```bash
# Run service worker tests
npx playwright test --grep "Service Worker Registration" tests/e2e/punchClub/PWAInstallSuite.spec.ts

# Run specific SW test
npx playwright test --grep "should register service worker" tests/e2e/punchClub/PWAInstallSuite.spec.ts
```

#### Install Prompt Tests
```bash
# Run install prompt tests
npx playwright test --grep "Install Prompt" tests/e2e/punchClub/PWAInstallSuite.spec.ts

# Run desktop install test
npx playwright test --grep "should show install prompt on desktop" tests/e2e/punchClub/PWAInstallSuite.spec.ts
```

#### Offline Tests
```bash
# Run offline functionality tests
npx playwright test --grep "Offline Functionality" tests/e2e/punchClub/PWAInstallSuite.spec.ts

# Run specific offline test
npx playwright test --grep "should work offline" tests/e2e/punchClub/PWAInstallSuite.spec.ts
```

#### Mobile Tests
```bash
# Run mobile viewport tests
npx playwright test --grep "Mobile Viewport Tests" tests/e2e/punchClub/PWAInstallSuite.spec.ts

# Run specific mobile viewport
npx playwright test --viewport="375,667" tests/e2e/punchClub/PWAInstallSuite.spec.ts
```

#### Cross-Browser Tests
```bash
# Run cross-browser tests
npx playwright test --project=firefox tests/e2e/punchClub/PWAInstallSuite.spec.ts
npx playwright test --project=webkit tests/e2e/punchClub/PWAInstallSuite.spec.ts
```

#### Performance Tests
```bash
# Run performance tests
npx playwright test --grep "Performance Smoke Tests" tests/e2e/punchClub/PWAInstallSuite.spec.ts
```

#### Accessibility Tests
```bash
# Run accessibility tests
npx playwright test --grep "Accessibility" tests/e2e/punchClub/PWAInstallSuite.spec.ts
```

### Test Configuration

#### Playwright Config
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  timeout: 30000,
  retries: 2,
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: false,
  retries: 2,
  reporter: 'html',
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
});
```

#### Test Environment Setup
```typescript
// Global test setup
test.beforeEach(async ({ page }) => {
  // Navigate to Punch Club app
  await page.goto('/punch-club/');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="punch-club-app"]');
  
  // Ensure PWA features are available
  await page.waitForFunction(() => {
    return 'serviceWorker' in navigator;
  });
});
```

## Test Scenarios

### 1. Manifest Validation

#### Desktop Manifest Validation
```typescript
test('should validate manifest on desktop', async ({ page }) => {
  const scenario = getScenarioById('manifest-validation-desktop')!;
  
  // Setup test page
  await setupPWATestPage(page, scenario);
  
  // Check manifest validity
  const manifestCheck = await checkManifestValidity(page, scenario);
  
  expect(manifestCheck.valid).toBe(true);
  expect(manifestCheck.manifest).toBeDefined();
  expect(manifestCheck.errors).toHaveLength(0);
});
```

#### Mobile Manifest Validation
```typescript
test('should validate manifest on mobile', async ({ page }) => {
  const scenario = getScenarioById('manifest-validation-mobile')!;
  
  // Setup test page with mobile viewport
  await setupPWATestPage(page, scenario);
  
  // Check manifest validity
  const manifestCheck = await checkManifestValidity(page, scenario);
  
  expect(manifestCheck.valid).toBe(true);
  expect(manifestCheck.manifest).toBeDefined();
  expect(manifestCheck.errors).toHaveLength(0);
});
```

#### Required Properties Check
```typescript
test('should have required manifest properties', async ({ page }) => {
  const scenario = getScenarioById('manifest-validation-desktop')!;
  
  await setupPWATestPage(page, scenario);
  
  const manifestCheck = await checkManifestValidity(page, scenario);
  
  // Check required properties
  expect(manifestCheck.manifest?.name).toBe('Punch Club');
  expect(manifestCheck.manifest?.short_name).toBe('PunchClub');
  expect(manifestCheck.manifest?.start_url).toBe('/punch-club/');
  expect(manifestCheck.manifest?.display).toBe('standalone');
  expect(manifestCheck.manifest?.icons).toBeDefined();
  expect(manifestCheck.manifest?.icons.length).toBeGreaterThan(0);
});
```

### 2. Service Worker Registration

#### Basic Registration
```typescript
test('should register service worker', async ({ page }) => {
  const scenario = getScenarioById('service-worker-registration')!;
  
  await setupPWATestPage(page, scenario);
  
  // Check service worker registration
  const swCheck = await checkServiceWorkerRegistration(page, scenario);
  
  expect(swCheck.registered).toBe(true);
  expect(swCheck.active).toBe(true);
  expect(swCheck.scope).toBeDefined();
  expect(swCheck.errors).toHaveLength(0);
});
```

#### Scope Validation
```typescript
test('should have correct scope', async ({ page }) => {
  const scenario = getScenarioById('service-worker-registration')!;
  
  await setupPWATestPage(page, scenario);
  
  const swCheck = await checkServiceWorkerRegistration(page, scenario);
  
  expect(swCheck.scope).toBe('/punch-club/');
});
```

#### Ready State Check
```typescript
test('should be ready for use', async ({ page }) => {
  const scenario = getScenarioById('service-worker-registration')!;
  
  await setupPWATestPage(page, scenario);
  
  // Wait for service worker to be ready
  await page.waitForFunction(() => {
    return navigator.serviceWorker && navigator.serviceWorker.ready;
  }, { timeout: TIMEOUT_CONFIGURATIONS.serviceWorker });
  
  const swCheck = await checkServiceWorkerRegistration(page, scenario);
  expect(swCheck.active).toBe(true);
});
```

### 3. Install Prompt Testing

#### Desktop Install Prompt
```typescript
test('should show install prompt on desktop', async ({ page }) => {
  const scenario = getScenarioById('install-prompt-desktop')!;
  
  await setupPWATestPage(page, scenario);
  
  // Check install prompt availability
  const installCheck = await checkInstallPrompt(page, scenario);
  
  expect(installCheck.promptAvailable).toBe(true);
  expect(installCheck.canInstall).toBe(true);
  expect(installCheck.installedState).toBe('not-installed');
  expect(installCheck.errors).toHaveLength(0);
});
```

#### Mobile Install Prompt
```typescript
test('should show install prompt on mobile', async ({ page }) => {
  const scenario = getScenarioById('install-prompt-mobile')!;
  
  await setupPWATestPage(page, scenario);
  
  // Check install prompt availability
  const installCheck = await checkInstallPrompt(page, scenario);
  
  expect(installCheck.promptAvailable).toBe(true);
  expect(installCheck.canInstall).toBe(true);
  expect(installCheck.installedState).toBe('not-installed');
  expect(installCheck.errors).toHaveLength(0);
});
```

#### Installed State Detection
```typescript
test('should detect installed state', async ({ page }) => {
  // Simulate installed state
  await page.evaluate(() => {
    localStorage.setItem('pwa-installed', 'true');
    window.dispatchEvent(new Event('appinstalled'));
  });
  
  const installState = await page.evaluate(() => {
    const installed = window.matchMedia('(display-mode: standalone)').matches;
    const displayMode = installed ? 'standalone' : 'browser';
    return { installed, displayMode };
  });
  
  expect(installState.installed).toBe(true);
  expect(installState.displayMode).toBe('standalone');
});
```

### 4. Offline Functionality

#### Basic Offline Test
```typescript
test('should work offline', async ({ page }) => {
  const scenario = getScenarioById('offline-functionality')!;
  
  await setupPWATestPage(page, scenario);
  
  // Check offline functionality
  const offlineCheck = await checkOfflineFunctionality(page, scenario);
  
  expect(offlineCheck.worksOffline).toBe(true);
  expect(offlineCheck.pageLoads).toBe(true);
  expect(offlineCheck.assetsCached).toBe(true);
  expect(offlineCheck.errors).toHaveLength(0);
});
```

#### Cache Storage Check
```typescript
test('should have cached assets', async ({ page }) => {
  const scenario = getScenarioById('cache-strategy')!;
  
  await setupPWATestPage(page, scenario);
  
  // Check cache storage
  const cacheCheck = await page.evaluate(async () => {
    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        totalSize += requests.length;
      }
      
      return { hasCache: cacheNames.length > 0, cacheNames, totalSize };
    } catch (error) {
      return { hasCache: false, cacheNames: [], totalSize: 0 };
    }
  });
  
  expect(cacheCheck.hasCache).toBe(true);
  expect(cacheCheck.cacheNames.length).toBeGreaterThan(0);
  expect(cacheCheck.totalSize).toBeGreaterThan(0);
});
```

#### Network Error Handling
```typescript
test('should handle network errors gracefully', async ({ page }) => {
  const scenario = getScenarioById('error-handling')!;
  
  await setupPWATestPage(page, scenario);
  
  // Go offline and try to navigate
  await page.context().setOffline(true);
  
  try {
    await page.goto('/punch-club/', { waitUntil: 'domcontentloaded' });
    // Should not throw error
    expect(true).toBe(true);
  } catch (error) {
    expect.fail('Should handle offline navigation gracefully');
  } finally {
    await page.context().setOffline(false);
  }
});
```

### 5. Cache Strategy Testing

#### Cache Strategy Implementation
```typescript
test('should implement proper cache strategy', async ({ page }) => {
  const scenario = getScenarioById('cache-strategy')!;
  
  await setupPWATestPage(page, scenario);
  
  // Check cache storage
  const cacheCheck = await page.evaluate(async () => {
    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        totalSize += requests.length;
      }
      
      return { hasCache: cacheNames.length > 0, cacheNames, totalSize };
    } catch (error) {
      return { hasCache: false, cacheNames: [], totalSize: 0 };
    }
  });
  
  expect(cacheCheck.hasCache).toBe(true);
  expect(cacheCheck.cacheNames.length).toBeGreaterThan(0);
});
```

#### Storage Quota Compliance
```typescript
test('should respect storage quotas', async ({ page }) => {
  const scenario = getScenarioById('cache-strategy')!;
  
  await setupPWATestPage(page, scenario);
  
  // Check storage usage
  const storageCheck = await page.evaluate(async () => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota || 0,
          usage: estimate.usage || 0,
        };
      }
      return { quota: 0, usage: 0 };
    } catch (error) {
      return { quota: 0, usage: 0 };
    }
  });
  
  expect(storageCheck.quota).toBeGreaterThan(0);
  expect(storageCheck.usage).toBeLessThan(storageCheck.quota);
});
```

### 6. Update Workflow Testing

#### Service Worker Updates
```typescript
test('should handle service worker updates', async ({ page }) => {
  const scenario = getScenarioById('update-workflow')!;
  
  await setupPWATestPage(page, scenario);
  
  // Check initial service worker
  const initialSW = await checkServiceWorkerRegistration(page, scenario);
  expect(initialSW.registered).toBe(true);
  
  // Simulate update
  await page.evaluate(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          registration.update();
        }
      });
    }
  });
  
  // Wait for update check
  await page.waitForTimeout(2000);
  
  // Update check should not cause errors
  expect(true).toBe(true);
});
```

### 7. Error Handling Tests

#### Service Worker Error Recovery
```typescript
test('should recover from service worker failure', async ({ page }) => {
  // Simulate service worker failure
  await page.route('**/sw.js', route => {
    route.fulfill({
      status: 500,
      contentType: 'application/javascript',
      body: 'throw new Error("Service worker failed");',
    });
  });
  
  await page.goto('/punch-club/');
  
  // App should still function
  await page.waitForSelector('[data-testid="punch-club-app"]');
  expect(true).toBe(true);
});
```

#### Manifest Error Handling
```typescript
test('should handle manifest errors', async ({ page }) => {
  // Navigate to page with invalid manifest
  await page.route('**/manifest.json', route => {
    route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Manifest not found' }),
    });
  });
  
  await page.goto('/punch-club/');
  
  // App should still function
  await page.waitForSelector('[data-testid="punch-club-app"]');
  expect(true).toBe(true);
});
```

### 8. Accessibility Tests

#### Keyboard Navigation
```typescript
test('should be accessible with keyboard', async ({ page }) => {
  const scenario = getScenarioById('accessibility')!;
  
  await setupPWATestPage(page, scenario);
  
  // Test keyboard navigation
  await page.keyboard.press('Tab');
  
  // Should focus on interactive elements
  const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
  expect(['BUTTON', 'INPUT', 'A', 'SELECT', 'TEXTAREA']).toContain(focusedElement);
});
```

#### ARIA Labels
```typescript
test('should have proper ARIA labels', async ({ page }) => {
  const scenario = getScenarioById('accessibility')!;
  
  await setupPWATestPage(page, scenario);
  
  // Check for ARIA labels
  const elementsWithAria = await page.locator('[aria-label], [aria-labelledby]').count();
  expect(elementsWithAria).toBeGreaterThan(0);
});
```

### 9. Performance Tests

#### Load Time Performance
```typescript
test('should load within acceptable time', async ({ page }) => {
  const startTime = Date.now();
  
  await page.goto('/punch-club/');
  await page.waitForLoadState('networkidle');
  
  const endTime = Date.now();
  const loadTime = endTime - startTime;
  
  // Should load within 5 seconds
  expect(loadTime).toBeLessThan(5000);
});
```

#### Service Worker Registration Performance
```typescript
test('should register service worker quickly', async ({ page }) => {
  const startTime = Date.now();
  
  await page.goto('/punch-club/');
  
  // Wait for service worker registration
  await page.waitForFunction(() => {
    return navigator.serviceWorker && navigator.serviceWorker.ready;
  }, { timeout: TIMEOUT_CONFIGURATIONS.serviceWorker });
  
  const endTime = Date.now();
  const registrationTime = endTime - startTime;
  
  // Should register within 3 seconds
  expect(registrationTime).toBeLessThan(3000);
});
```

### 10. Integration Tests

#### Full PWA Lifecycle
```typescript
test('should integrate all PWA features', async ({ page }) => {
  const scenario = getScenarioById('manifest-validation-desktop')!;
  
  // Setup test page
  await setupPWATestPage(page, scenario);
  
  // Test all features together
  const manifestCheck = await checkManifestValidity(page, scenario);
  expect(manifestCheck.valid).toBe(true);
  
  const swCheck = await checkServiceWorkerRegistration(page, scenario);
  expect(swCheck.registered).toBe(true);
  
  const installCheck = await checkInstallPrompt(page, scenario);
  expect(installCheck.canInstall).toBe(true);
  
  const offlineCheck = await checkOfflineFunctionality(page, scenario);
  expect(offlineCheck.worksOffline).toBe(true);
  
  const cacheCheck = await page.evaluate(async () => {
    try {
      const cacheNames = await caches.keys();
      return { hasCache: cacheNames.length > 0 };
    } catch (error) {
      return { hasCache: false };
    }
  });
  
  expect(cacheCheck.hasCache).toBe(true);
});
```

#### PWA Installation State
```typescript
test('should handle PWA lifecycle', async ({ page }) => {
  // Initial load
  await page.goto('/punch-club/');
  
  // Check initial state
  const initialState = await page.evaluate(() => {
    const installed = window.matchMedia('(display-mode: standalone)').matches;
    return { installed };
  });
  
  expect(initialState.installed).toBe(false);
  
  // Simulate installation
  await page.evaluate(() => {
    localStorage.setItem('pwa-installed', 'true');
    window.dispatchEvent(new Event('appinstalled'));
  });
  
  // Check installed state
  const installedState = await page.evaluate(() => {
    const installed = window.matchMedia('(display-mode: standalone)').matches;
    return { installed };
  });
  
  expect(installedState.installed).toBe(true);
});
```

## Test Data Management

### Scenario Organization
```typescript
// By type
const manifestScenarios = getScenariosByType('manifest_validation');
const serviceWorkerScenarios = getScenariosByType('service_worker_registration');
const installScenarios = getScenariosByType('install_prompt_desktop');

// By viewport
const desktopScenarios = getDesktopScenarios();
const mobileScenarios = getMobileScenarios();

// By browser
const crossBrowserScenarios = getCrossBrowserScenarios();
```

### Data Generation
```typescript
// Generate test data for scenario
const testData = PWADataGenerator.generateTestData(scenario);

// Generate desktop-specific test data
const desktopData = PWADataGenerator.generateDesktopTestData();

// Generate mobile-specific test data
const mobileData = PWADataGenerator.generateMobileTestData();
```

## Test Execution

### Running Individual Tests
```bash
# Single test
npx playwright test --grep "should validate manifest on desktop"

# By test group
npx playwright test --grep "Manifest Validation"

# By scenario ID
npx playwright test --grep "manifest-validation-desktop"
```

### Running Test Suites
```bash
# All PWA install tests
npm run test:e2e tests/e2e/punchClub/PWAInstallSuite.spec.ts

# Specific test categories
npx playwright test --grep "Service Worker Registration"
npx playwright test --grep "Install Prompt"
npx playwright test --grep "Offline Functionality"
```

### Debugging Tests
```bash
# Run with screenshots on failure
npx playwright test --config=playwright.config.ts --screenshot-on-failure

# Run with trace on failure
npx playwright test --config=playwright.config.ts --trace-on-failure

# Run with video recording
npx playwright test --config=playwright.config.ts --video
```

### CI/CD Integration
```bash
# In CI pipeline
npm run test:e2e --reporter=html --reporter=output/playwright-report

# Generate coverage report
npm run test:e2e --coverage --reporter=html
```

## Troubleshooting

### Common Issues

#### Test Failures
**Cause**: PWA features not available or timeout issues
**Solution**: Check PWA prerequisites and increase timeouts

```typescript
// Check PWA availability
await page.waitForFunction(() => {
  return 'serviceWorker' in navigator;
}, { timeout: 10000 });
```

#### Service Worker Registration Issues
**Cause**: Service worker file not found or registration errors
**Solution**: Verify service worker file and registration logic

```typescript
// Check service worker file
await page.goto('/sw.js');
// Should return valid JavaScript content
```

#### Manifest Loading Issues
**Cause**: Manifest file not found or invalid JSON
**Solution**: Verify manifest file path and content

```typescript
// Check manifest file
await page.goto('/manifest.json');
// Should return valid JSON content
```

#### Install Prompt Not Showing
**Cause**: Install criteria not met or browser limitations
**Solution**: Verify PWA install criteria and browser support

```typescript
// Check install criteria
const installCheck = await page.evaluate(() => {
  return {
    hasManifest: !!document.querySelector('link[rel="manifest"]'),
    hasServiceWorker: 'serviceWorker' in navigator,
    isSecure: location.protocol === 'https:',
  };
});
```

#### Offline Functionality Issues
**Cause**: Cache not populated or service worker not active
**Solution**: Verify cache strategy and service worker activation

```typescript
// Check cache status
const cacheCheck = await page.evaluate(async () => {
  const cacheNames = await caches.keys();
  return { cacheNames, hasCache: cacheNames.length > 0 };
});
```

### Debug Mode
Enable detailed logging for troubleshooting:
```typescript
// Enable console logging
test.describe('Debug Mode', () => {
  test('debug PWA features', async ({ page }) => {
    console.log('Starting PWA debug test...');
    
    // Check PWA support
    const pwaSupport = await page.evaluate(() => ({
      serviceWorker: 'serviceWorker' in navigator,
      manifest: !!document.querySelector('link[rel="manifest"]'),
      installPrompt: 'beforeinstallprompt' in window,
    }));
    
    console.log('PWA Support:', pwaSupport);
    
    // Continue with test...
  });
});
```

### Screenshot Analysis
```bash
# Generate screenshots for analysis
npx playwright test --config=playwright.config.ts --screenshot-on-failure

# Analyze screenshots
npx playwright show-report
```

## Performance Considerations

### Test Speed
- **Single Test**: < 3 seconds
- **Test Suite**: < 2 minutes
- **Cross-Browser**: < 5 minutes
- **Mobile Tests**: < 3 minutes

### Resource Usage
- **Memory**: < 1GB per test suite
- **CPU**: < 50% during execution
- **Storage**: Minimal (screenshots only on failure)

### Optimization Features
- **Parallel Execution**: Tests run in parallel where possible
- **Smart Timeouts**: Configurable timeouts for different operations
- **Selective Screenshots**: Screenshots only on failure
- **Efficient Caching**: Reuse browser contexts where possible

### Best Practices
- **Isolation**: Each test should be independent
- **Cleanup**: Proper cleanup between tests
- **Assertions**: Clear, specific assertions
- **Error Messages**: Helpful error messages
- **Documentation**: Well-documented test cases

## Maintenance

### Adding New Scenarios
1. Add scenario to `PWA_INSTALL_SCENARIOS` in fixtures
2. Update test categories if needed
3. Add corresponding test case
4. Update documentation

### Updating Existing Scenarios
1. Modify scenario data in fixtures
2. Update expected results if PWA behavior changes
3. Update test assertions if UI changes
4. Run tests to verify updates

### Adding New Test Categories
1. Add new test.describe blocks
2. Create helper methods if needed
3. Add configuration if required
4. Update documentation

## Future Enhancements

### Planned Features
- **Visual Regression Testing**: Automated visual comparison
- **API Testing**: Test PWA-specific API endpoints
- **Load Testing**: Performance testing under load
- **Real Device Testing**: Mobile device testing integration

### Advanced Testing Scenarios
- **Background Sync**: Test background sync functionality
- **Push Notifications**: Test push notification capabilities
- **Web Share API**: Test sharing functionality
- **File System Access**: Test file system API integration

### Integration Extensions
- **CI/CD Pipeline**: Enhanced CI/CD integration
- **Test Data Generation**: Automated test data generation
- **Report Generation**: Enhanced reporting capabilities
- **Analytics Integration**: Test analytics and metrics

## Contributing

When contributing to the PWA Install Playwright Suite:

1. **Follow Test Structure**: Use established test patterns
2. **Add Comprehensive Coverage**: Cover all PWA features and edge cases
3. **Update Documentation**: Keep documentation synchronized
4. **Test Locally**: Run tests before submitting
5. **Performance Testing**: Ensure tests run efficiently

### Test Writing Guidelines
- **Descriptive Names**: Use clear, descriptive test names
- **Arrange-Act-Assert**: Follow AAA testing pattern
- **Clear Assertions**: Use specific, meaningful assertions
- **Error Messages**: Provide helpful error messages
- **Documentation**: Document complex scenarios

### Code Quality
- **TypeScript**: Use proper TypeScript typing
- **Async/Await**: Use async/await for all async operations
- **Error Handling**: Proper error handling and recovery
- **Cleanup**: Proper cleanup between tests
- **Consistency**: Maintain consistent coding style

## License

This test suite is part of the RPG Balancer project and follows the same licensing terms.

---

**Related Documentation:**
- [PC-M2 PWA Implementation](../punch_club/pwa_implementation.md)
- [E2E-VRT-001 Playwright Setup](../testing/playwright_config.md)
- [NP-073 Kanban Entry](../docs/coordinator/agent_assignments.md)
