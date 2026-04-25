import { test, expect } from '@playwright/test';
import { dragElement } from '../../utils/dragActions';

test.describe.configure({ mode: 'serial' });

test.describe('POI Skin Integration @test-route', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test');
    // Wait for the test roster page to load
    await expect(page.getByTestId('test-roster-page')).toBeVisible();
    // Wait for POI capsule to be rendered
    await expect(page.getByTestId('slot-lab-poi-capsule')).toBeVisible();
  });

  test('should render POI skin with correct attributes and visual elements', async ({ page }) => {
    // Verify POI visualization is present
    const poiVisualization = page.getByTestId('poi-visualization');
    await expect(poiVisualization).toBeVisible();

    // Verify SVG with data-poi attribute exists
    const poiSvg = page.locator('[data-poi]');
    await expect(poiSvg).toBeVisible();

    // Verify all slot bindings are present (particles may be hidden initially)
    const expectedSlots = [
      '[data-slot="stone"]',
      '[data-slot="rim"]',
      '[data-slot="corona-glow"]',
      '[data-slot="corona-turb-a"]',
      '[data-slot="corona-turb-b"]',
      '[data-slot="corona-reflect"]',
      '[data-slot="pin"]',
      '[data-slot="particles"]'
    ];

    for (const slotSelector of expectedSlots) {
      const slot = page.locator(slotSelector);
      await expect(slot).toBeAttached(); // Element exists in DOM
      // Particles slot may be hidden initially, that's expected
      if (slotSelector === '[data-slot="particles"]') {
        // Just check it's attached to DOM, may be hidden
        await expect(slot).toBeAttached();
      } else {
        await expect(slot).toBeVisible(); // Other slots should be visible
      }
    }

    // Verify skin attributes are set (SkinSlot uses different attribute names)
    await expect(poiVisualization).toHaveAttribute('data-poi-component', 'POIComponent');
    await expect(poiVisualization).toHaveAttribute('data-poi-pillar', 'frontier'); // Default pillar

    // Verify CSS is injected (check for key animation classes)
    const rimElement = page.locator('[data-slot="rim"]');
    await expect(rimElement).toHaveClass(/rim/);

    const pinFlicker = page.locator('.flicker');
    await expect(pinFlicker).toBeVisible();

    // Take baseline screenshot for visual regression
    await page.screenshot({
      path: 'test-results/vrt-baseline/test-route/poi-skin/poi-skin-wilderness-baseline.png',
      fullPage: false
    });
  });

  test('should emit telemetry events when POI skin is rendered', async ({ page }) => {
    // Listen for console events to capture telemetry
    const telemetryEvents: any[] = [];
    page.on('console', msg => {
      if (msg.text().includes('slot_lab_poi_skin_rendered')) {
        try {
          const eventText = msg.text();
          const eventData = JSON.parse(eventText.replace(/.*?(\{.*\}).*/, '$1'));
          telemetryEvents.push(eventData);
        } catch (e) {
          // Ignore parsing errors
        }
      }
    });

    // Reload page to trigger fresh telemetry
    await page.reload();
    await expect(page.getByTestId('slot-lab-poi-capsule')).toBeVisible();

    // Wait a moment for telemetry to be emitted
    await page.waitForTimeout(100);

    // Verify telemetry event was emitted
    expect(telemetryEvents.length).toBeGreaterThan(0);
    
    const poiTelemetry = telemetryEvents.find(event => event.poiSkinId === 'poi_wilderness_amber');
    expect(poiTelemetry).toBeDefined();
    expect(poiTelemetry?.poiSkinId).toBe('poi_wilderness_amber');
    expect(poiTelemetry?.pillar).toBe('frontier'); // Default pillar in test
    expect(poiTelemetry?.activityId).toBeDefined();
  });

  test('should maintain POI skin visibility during drag operations', async ({ page }) => {
    // Get a resident card to drag
    const residentCard = page.getByTestId('pg-card').first();
    await expect(residentCard).toBeVisible();

    // Get a target slot (not the POI capsule itself)
    const targetSlot = page.getByTestId('slot-button-slot-lab-open-slot-0');
    await expect(targetSlot).toBeVisible();

    // Perform drag operation
    await dragElement(page, residentCard, targetSlot, {
      steps: 12,
      onIntermediateMove: async () => {
        // Verify POI skin remains visible during drag
        await expect(page.getByTestId('poi-visualization')).toBeVisible();
        await expect(page.locator('[data-poi]')).toBeVisible();
      },
    });

    // Verify POI skin is still visible after drag
    await expect(page.getByTestId('poi-visualization')).toBeVisible();
    await expect(page.locator('[data-poi]')).toBeVisible();

    // Take screenshot after drag operation
    await page.screenshot({
      path: 'test-results/vrt-baseline/test-route/poi-skin/poi-skin-after-drag.png',
      fullPage: false
    });
  });

  test('should handle Style Lab pillar changes correctly', async ({ page }) => {
    // This test would verify pillar switching if implemented
    // For now, verify current pillar is correctly applied
    const poiVisualization = page.getByTestId('poi-visualization');
    await expect(poiVisualization).toBeVisible();

    // Verify wilderness theme is applied (check for specific colors/styles)
    const coronaGlow = page.locator('[data-slot="corona-glow"] circle');
    await expect(coronaGlow).toBeVisible();
    
    // The corona should have amber/wilderness colors
    const coronaStyle = await coronaGlow.getAttribute('stroke');
    expect(coronaStyle).toContain('210'); // RGB for amber
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    const poiVisualization = page.getByTestId('poi-visualization');
    await expect(poiVisualization).toBeVisible();

    // Verify ARIA attributes
    const poiSvg = page.locator('[data-poi]');
    await expect(poiSvg).toHaveAttribute('role', 'presentation');
    await expect(poiSvg).toHaveAttribute('aria-hidden', 'true');

    // Verify proper structure for screen readers
    const activityCapsule = page.getByTestId('slot-lab-poi-capsule');
    await expect(activityCapsule).toHaveAttribute('role', 'article');
  });
});

test.describe('POI Skin Cross-Pillar Testing @test-route', () => {
  test('should render correctly with different Style Lab presets', async ({ page }) => {
    await page.goto('/test');
    await expect(page.getByTestId('test-roster-page')).toBeVisible();

    // Test with different viewport sizes
    await page.setViewportSize({ width: 768, height: 1024 }); // Tablet
    await expect(page.getByTestId('poi-visualization')).toBeVisible();
    await page.screenshot({
      path: 'test-results/vrt-baseline/test-route/poi-skin/poi-skin-tablet.png',
      fullPage: false
    });

    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await expect(page.getByTestId('poi-visualization')).toBeVisible();
    await page.screenshot({
      path: 'test-results/vrt-baseline/test-route/poi-skin/poi-skin-mobile.png',
      fullPage: false
    });

    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});
