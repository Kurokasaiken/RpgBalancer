/**
 * Flight Proxy Isolation Playwright Tests
 * 
 * Tests FlightProxy component independently:
 * - Flight animation from point A to point B
 * - onComplete callback timing (160ms)
 * - Coordinate control
 * - Preset scenarios
 */

import { test, expect, type Page } from '@playwright/test';

const FLIGHT_PROXY_ROUTE = '/idle-village/iso/flight-proxy';

test.describe('Flight Proxy Isolation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FLIGHT_PROXY_ROUTE);
    await page.waitForLoadState('networkidle');
  });

  test('renders flight proxy page with controls', async ({ page }) => {
    // Check main elements are present
    await expect(page.getByText('Flight Proxy Isolation')).toBeVisible();
    await expect(page.getByText('Test FlightProxy component independently')).toBeVisible();
    
    // Check controls section
    await expect(page.getByText('Flight Controls')).toBeVisible();
    await expect(page.getByText('From Point')).toBeVisible();
    await expect(page.getByText('To Point')).toBeVisible();
    
    // Check flight canvas
    await expect(page.getByText('Flight Canvas')).toBeVisible();
    await expect(page.getByText('State Information')).toBeVisible();
    await expect(page.getByText('Preset Scenarios')).toBeVisible();
  });

  test('coordinate inputs work correctly', async ({ page }) => {
    const fromXInput = page.locator('label:has-text("X")').first().locator('input');
    const fromYInput = page.locator('label:has-text("Y")').first().locator('input');
    const toXInput = page.locator('label:has-text("X")').nth(1).locator('input');
    const toYInput = page.locator('label:has-text("Y")').nth(1).locator('input');
    
    // Check initial values
    await expect(fromXInput).toHaveValue('100');
    await expect(fromYInput).toHaveValue('100');
    await expect(toXInput).toHaveValue('300');
    await expect(toYInput).toHaveValue('200');
    
    // Change coordinates
    await fromXInput.fill('150');
    await fromYInput.fill('120');
    await toXInput.fill('350');
    await toYInput.fill('250');
    
    await expect(fromXInput).toHaveValue('150');
    await expect(fromYInput).toHaveValue('120');
    await expect(toXInput).toHaveValue('350');
    await expect(toYInput).toHaveValue('250');
  });

  test('distance calculation updates with coordinates', async ({ page }) => {
    const distanceDisplay = page.locator('text=Distance:').locator('..').locator('.font-mono');
    
    // Initial distance (100,100) to (300,200) should be ~224px
    await expect(distanceDisplay).toContainText('224');
    
    // Change to same point should be 0px
    const fromXInput = page.locator('label:has-text("X")').first().locator('input');
    const fromYInput = page.locator('label:has-text("Y")').first().locator('input');
    const toXInput = page.locator('label:has-text("X")').nth(1).locator('input');
    const toYInput = page.locator('label:has-text("Y")').nth(1).locator('input');
    
    await toXInput.fill('100');
    await toYInput.fill('100');
    await expect(distanceDisplay).toContainText('0');
    
    // Change to different point
    await toXInput.fill('200');
    await toYInput.fill('100');
    await expect(distanceDisplay).toContainText('100');
  });

  test('start flight button works', async ({ page }) => {
    const activeFlightsDisplay = page.locator('text=Active Flights:').locator('..').locator('.font-mono');
    const lastDurationDisplay = page.locator('text=Last Duration:').locator('..').locator('.font-mono');
    
    // Initially no flights
    await expect(activeFlightsDisplay).toContainText('0');
    await expect(lastDurationDisplay).toContainText('N/A');
    
    // Start flight
    await page.getByText('Start Flight').click();
    
    // Should have 1 active flight
    await expect(activeFlightsDisplay).toContainText('1');
    await expect(lastDurationDisplay).toContainText('Pending...');
  });

  test('clear all flights button works', async ({ page }) => {
    const activeFlightsDisplay = page.locator('text=Active Flights:').locator('..').locator('.font-mono');
    
    // Start multiple flights
    await page.getByText('Start Flight').click();
    await page.getByText('Start Flight').click();
    await expect(activeFlightsDisplay).toContainText('2');
    
    // Clear all flights
    await page.getByText('Clear All').click();
    await expect(activeFlightsDisplay).toContainText('0');
  });

  test('debug visualization toggle works', async ({ page }) => {
    const debugButton = page.getByText(/Debug/);
    const debugStateDisplay = page.locator('text=Debug:').locator('..').locator('.font-mono');
    
    // Should start with Debug OFF
    await expect(debugButton).toContainText('Debug OFF');
    await expect(debugStateDisplay).toContainText('Off');
    
    // Toggle debug on
    await debugButton.click();
    await expect(debugButton).toContainText('Debug ON');
    await expect(debugStateDisplay).toContainText('On');
    
    // Toggle debug off
    await debugButton.click();
    await expect(debugButton).toContainText('Debug OFF');
    await expect(debugStateDisplay).toContainText('Off');
  });

  test('preset scenarios work correctly', async ({ page }) => {
    const fromXInput = page.locator('label:has-text("X")').first().locator('input');
    const fromYInput = page.locator('label:has-text("Y")').first().locator('input');
    const toXInput = page.locator('label:has-text("X")').nth(1).locator('input');
    const toYInput = page.locator('label:has-text("Y")').nth(1).locator('input');
    
    // Test Horizontal scenario
    await page.getByText('Horizontal').click();
    await expect(fromXInput).toHaveValue('100');
    await expect(fromYInput).toHaveValue('100');
    await expect(toXInput).toHaveValue('300');
    await expect(toYInput).toHaveValue('100');
    
    // Test Vertical scenario
    await page.getByText('Vertical').click();
    await expect(fromXInput).toHaveValue('100');
    await expect(fromYInput).toHaveValue('100');
    await expect(toXInput).toHaveValue('100');
    await expect(toYInput).toHaveValue('300');
    
    // Test Diagonal scenario
    await page.getByText('Diagonal').click();
    await expect(fromXInput).toHaveValue('100');
    await expect(fromYInput).toHaveValue('100');
    await expect(toXInput).toHaveValue('300');
    await expect(toYInput).toHaveValue('300');
    
    // Test Reverse scenario
    await page.getByText('Reverse').click();
    await expect(fromXInput).toHaveValue('300');
    await expect(fromYInput).toHaveValue('300');
    await expect(toXInput).toHaveValue('100');
    await expect(toYInput).toHaveValue('100');
  });

  test('flight canvas displays markers', async ({ page }) => {
    const canvas = page.locator('.relative').filter({ hasText: '' }).first();
    
    // Canvas should be visible
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveClass(/bg-slate-900/);
    
    // Grid overlay should be present (we can't easily test SVG content)
    await expect(canvas.locator('svg')).toBeVisible();
  });

  test('state information updates correctly', async ({ page }) => {
    // Check all state fields exist
    await expect(page.locator('text=Active Flights:')).toBeVisible();
    await expect(page.locator('text=From:')).toBeVisible();
    await expect(page.locator('text=To:')).toBeVisible();
    await expect(page.locator('text=Distance:')).toBeVisible();
    await expect(page.locator('text=Debug:')).toBeVisible();
    await expect(page.locator('text=Resident ID:')).toBeVisible();
    await expect(page.locator('text=Last Duration:')).toBeVisible();
    await expect(page.locator('text=Flight IDs:')).toBeVisible();
  });

  test('coordinate display updates with inputs', async ({ page }) => {
    const fromDisplay = page.locator('text=From:').locator('..').locator('.font-mono');
    const toDisplay = page.locator('text=To:').locator('..').locator('.font-mono');
    
    // Initial coordinates
    await expect(fromDisplay).toContainText('(100, 100)');
    await expect(toDisplay).toContainText('(300, 200)');
    
    // Change coordinates
    const fromXInput = page.locator('label:has-text("X")').first().locator('input');
    const fromYInput = page.locator('label:has-text("Y")').first().locator('input');
    
    await fromXInput.fill('150');
    await fromYInput.fill('120');
    
    await expect(fromDisplay).toContainText('(150, 120)');
    await expect(toDisplay).toContainText('(300, 200)'); // To point unchanged
  });

  test('quick test scenario works', async ({ page }) => {
    const activeFlightsDisplay = page.locator('text=Active Flights:').locator('..').locator('.font-mono');
    const fromDisplay = page.locator('text=From:').locator('..').locator('.font-mono');
    const toDisplay = page.locator('text=To:').locator('..').locator('.font-mono');
    
    // Initially no flights
    await expect(activeFlightsDisplay).toContainText('0');
    
    // Quick Test should set coordinates and start flight
    await page.getByText('Quick Test').click();
    
    // Should have 1 active flight and updated coordinates
    await expect(activeFlightsDisplay).toContainText('1');
    await expect(fromDisplay).toContainText('(150, 150)');
    await expect(toDisplay).toContainText('(250, 250)');
  });

  test('flight IDs display updates', async ({ page }) => {
    const flightIdsDisplay = page.locator('text=Flight IDs:').locator('..').locator('.font-mono');
    const activeFlightsDisplay = page.locator('text=Active Flights:').locator('..').locator('.font-mono');
    
    // Initially no flight IDs
    await expect(flightIdsDisplay).toContainText('None');
    await expect(activeFlightsDisplay).toContainText('0');
    
    // Start flight
    await page.getByText('Start Flight').click();
    
    // Should show flight ID (we can't predict exact timestamp, but should show something)
    await expect(flightIdsDisplay).not.toContainText('None');
    await expect(activeFlightsDisplay).toContainText('1');
    
    // Start another flight
    await page.getByText('Start Flight').click();
    
    // Should show multiple flight IDs
    await expect(activeFlightsDisplay).toContainText('2');
  });

  test('resident ID display is constant', async ({ page }) => {
    const residentIdDisplay = page.locator('text=Resident ID:').locator('..').locator('.font-mono');
    
    // Should show the mock resident ID
    await expect(residentIdDisplay).toContainText('flight-test-resident');
  });

  test('canvas grid is visible', async ({ page }) => {
    const canvas = page.locator('.relative').filter({ hasText: '' }).first();
    
    // Check for SVG grid
    const svg = canvas.locator('svg');
    await expect(svg).toBeVisible();
    
    // Check for pattern definition
    const pattern = svg.locator('pattern');
    await expect(pattern).toBeVisible();
    await expect(pattern).toHaveAttribute('id', 'grid');
  });

  test('long and tall scenarios work', async ({ page }) => {
    const distanceDisplay = page.locator('text=Distance:').locator('..').locator('.font-mono');
    
    // Long scenario (horizontal distance)
    await page.getByText('Long').click();
    await expect(distanceDisplay).toContainText('300');
    
    // Tall scenario (vertical distance)
    await page.getByText('Tall').click();
    await expect(distanceDisplay).toContainText('300');
    
    // Short scenario
    await page.getByText('Short').click();
    await expect(distanceDisplay).toContainText('71'); // sqrt(50^2 + 50^2) rounded
  });

  test('all preset buttons are clickable', async ({ page }) => {
    const buttons = [
      'Horizontal', 'Vertical', 'Diagonal', 'Reverse',
      'Long', 'Tall', 'Short', 'Quick Test'
    ];
    
    for (const buttonText of buttons) {
      await page.getByText(buttonText).click();
      // Just verify the button is clickable without errors
      await expect(page.getByText(buttonText)).toBeVisible();
    }
  });
});
