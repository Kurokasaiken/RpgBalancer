import { test, expect } from '@playwright/test';
import { captureAndSaveTelemetry } from './helpers/playwrightTelemetryHelper';
import { setSessionTag } from './helpers/sessionTagHelper';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

test.describe('Mobile Logger E2E Integration', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // Mobile viewport
    isMobile: true,
    hasTouch: true,
  });

  test('should capture telemetry and session tag during mobile test', async ({ page }, testInfo) => {
    // Navigate to a page first to establish origin/context for storage
    // Use mobile=true to bypass landing page and reach the app shell
    await page.goto('/?mobile=true');
    await page.waitForLoadState('networkidle');

    // Setup session tag
    const sessionTag = 'mobile-e2e-test-session';
    await setSessionTag(page, sessionTag);
    
    // Simulate some user interactions that would generate telemetry
    await page.getByTestId('nav-btn-spellCreationNew').click();
    await page.waitForTimeout(1000);
    
    // Verify session tag is set
    const retrievedTag = await page.evaluate(() => {
      return sessionStorage.getItem('punch-club-session-tag');
    });
    expect(retrievedTag).toBe(sessionTag);
    
    // Capture telemetry manually for this test
    const telemetryFile = await captureAndSaveTelemetry(page, {
      ...testInfo,
      title: 'Mobile E2E Integration Test',
    });
    
    if (telemetryFile) {
      console.log(`📊 Telemetry captured: ${telemetryFile}`);
      
      // Verify telemetry file exists and has expected structure
      const telemetryData = JSON.parse(readFileSync(telemetryFile, 'utf8'));
      
      expect(telemetryData).toHaveProperty('sessionTag', sessionTag);
      expect(telemetryData).toHaveProperty('testInfo');
      expect(telemetryData.testInfo.title).toBe('Mobile E2E Integration Test');
      expect(telemetryData).toHaveProperty('extractedAt');
    } else {
      console.log('⚠️  No telemetry captured (expected if no telemetry hooks are present)');
    }
  });

  test('should validate mobile logger setup and teardown', async ({ page }) => {
    // This test validates that the global setup and teardown work correctly
    await page.goto('/?mobile=true');
    
    // Check that telemetry directory exists (created by global setup)
    const telemetryDir = join(process.cwd(), 'test-results/telemetry');
    
    expect(existsSync(telemetryDir)).toBe(true);
    
    // Session tagging should work
    const testTag = 'validation-test-tag';
    await setSessionTag(page, testTag);
    
    const storedTag = await page.evaluate(() => {
      return sessionStorage.getItem('punch-club-session-tag');
    });
    
    expect(storedTag).toBe(testTag);
  });

  test('should generate telemetry data compatible with mobilePlaytestLogger', async ({ page }, testInfo) => {
    // Test that telemetry data is in the correct format for post-processing
    await page.goto('/?mobile=true');
    
    const sessionTag = 'playwright-compatibility-test';
    await setSessionTag(page, sessionTag);
    
    // Simulate mobile interactions
    await page.getByTestId('nav-btn-spellCreationNew').click();
    await page.waitForTimeout(500);
    
    // Capture telemetry
    const telemetryFile = await captureAndSaveTelemetry(page, {
      ...testInfo,
      title: 'Playwright Compatibility Test',
    });
    
    if (telemetryFile) {
      const telemetryData = JSON.parse(readFileSync(telemetryFile, 'utf8'));
      
      // Verify structure matches what mobilePlaytestLogger expects
      expect(telemetryData).toHaveProperty('sessionTag', sessionTag);
      expect(telemetryData).toHaveProperty('testInfo');
      expect(telemetryData.testInfo).toHaveProperty('title', 'Playwright Compatibility Test');
      expect(telemetryData.testInfo).toHaveProperty('file', 'tests/mobile-logger-e2e.spec.ts');
      expect(telemetryData).toHaveProperty('extractedAt');
      
      // Verify events array exists (required for mobilePlaytestLogger processing)
      expect(Array.isArray(telemetryData.events)).toBe(true);
      
      // Verify session ID exists or can be generated
      expect(telemetryData.sessionId || typeof telemetryData.events?.[0]?.timestamp === 'number').toBe(true);
      
      console.log(`✅ Telemetry data structure validated for mobilePlaytestLogger compatibility`);
    }
  });

  test('should handle session tagging edge cases', async ({ page }) => {
    // Test edge cases for session tagging
    await page.goto('/?mobile=true');
    
    // Test with special characters in session tag
    const specialTag = 'test-with-special-chars-123-abc';
    await setSessionTag(page, specialTag);
    
    const retrievedTag = await page.evaluate(() => {
      return sessionStorage.getItem('punch-club-session-tag');
    });
    expect(retrievedTag).toBe(specialTag);
    
    // Test with empty session tag
    await setSessionTag(page, '');
    const emptyTag = await page.evaluate(() => {
      return sessionStorage.getItem('punch-club-session-tag');
    });
    expect(emptyTag).toBe('');
    
    // Test clearing session tag
    await page.evaluate(() => {
      sessionStorage.removeItem('punch-club-session-tag');
    });
    const clearedTag = await page.evaluate(() => {
      return sessionStorage.getItem('punch-club-session-tag');
    });
    expect(clearedTag).toBe(null);
  });
});
