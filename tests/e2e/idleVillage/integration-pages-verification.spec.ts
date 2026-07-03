import { test, expect } from '@playwright/test';

const PAGES = [
  '/minimal-integration-drag-job',
  '/minimal-job-poi-roster-integration',
  '/minimal-job-poi-roster-time-integration',
  '/poi-detail-verification',
];

test.describe('Integration Pages Verification', () => {
  PAGES.forEach((path) => {
    test(`should load ${path} without errors`, async ({ page }) => {
      // Listen for console errors
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Navigate to page
      await page.goto(`http://localhost:5174${path}`);

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check for error boundaries
      const errorBoundary = page.locator('[data-testid*="error"], .error, .error-message');
      const hasErrorBoundary = await errorBoundary.count();
      
      // Check if page has content
      const body = page.locator('body');
      const bodyText = await body.textContent();
      
      console.log(`Page: ${path}`);
      console.log(`  - Console errors: ${errors.length}`);
      console.log(`  - Error boundaries: ${hasErrorBoundary}`);
      console.log(`  - Body text length: ${bodyText?.length || 0}`);

      // Assertions
      expect(errors).toHaveLength(0);
      expect(hasErrorBoundary).toBe(0);
      expect(bodyText?.length).toBeGreaterThan(0);
    });
  });
});
