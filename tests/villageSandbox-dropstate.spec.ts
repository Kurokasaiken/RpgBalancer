import { test, expect, Page } from '@playwright/test';
import {
  navigateToVillageSandbox,
  getLocationDropState,
  setDraggingResidentId,
  seedVillageSandbox,
} from './fixtures/villageSandbox';

// Set a longer timeout for all tests (2 minutes)
test.setTimeout(120000);

// Helper function to wait for test hooks to be available
const waitForTestHooks = async (page: Page, timeout = 30000): Promise<boolean> => {
  try {
    console.log('Waiting for test hooks to be available...');
    await page.waitForFunction(
      () => window.__idleVillageTestHooks !== undefined, 
      { timeout, polling: 1000 }
    );
    console.log('Test hooks are available');
    return true;
  } catch (error) {
    console.error('Test hooks not available:', error);
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/test-hooks-timeout.png' });
    return false;
  }
};

// Helper to wait for the app to be fully loaded
const waitForAppReady = async (page: Page) => {
  console.log('Waiting for app to be ready...');
  
  // Wait for either the app shell or a known element that indicates the app is loaded
  await Promise.race([
    page.waitForSelector('[data-testid="app-loaded"]', { timeout: 30000 }),
    page.waitForSelector('[data-testid="village-sandbox"]', { timeout: 30000 }),
    page.waitForSelector('.app-container', { timeout: 30000 }),
  ]).catch(async (_error) => {
    console.warn('App ready check timed out, continuing anyway...');
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/app-ready-timeout.png' });
  });
  
  // Additional wait for network idle
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
    console.warn('Network idle timeout, continuing...');
  });
  
  console.log('App ready check complete');
};

test.describe('VillageSandbox DropState Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Add error handling for page errors
    page.on('pageerror', (error) => {
      console.error('Page error:', error);
    });
    
    // Add console logs
    page.on('console', msg => {
      console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
    });
    
    // Add request/response logging
    page.on('requestfailed', request => {
      console.error(`Request failed: ${request.url()} - ${request.failure()?.errorText}`);
    });
  });

  test('location card shows locked state during night phase', async ({ page }) => {
    // Navigate to the sandbox with retry logic
    let navigationSuccess = false;
    let attempt = 0;
    const maxAttempts = 3;
    
    while (!navigationSuccess && attempt < maxAttempts) {
      try {
        console.log(`Navigation attempt ${attempt + 1}...`);
        await navigateToVillageSandbox(page);
        navigationSuccess = true;
        console.log('Navigation successful');
      } catch (error) {
        attempt++;
        console.error(`Navigation attempt ${attempt} failed:`, error);
        if (attempt >= maxAttempts) throw error;
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Wait for the app to be fully loaded
    await waitForAppReady(page);
    
    // Wait for test hooks with retry logic
    console.log('Waiting for test hooks...');
    const hooksAvailable = await waitForTestHooks(page);
    expect(hooksAvailable, 'Test hooks should be available').toBe(true);
    
    // Set selected slot with retry logic
    console.log('Setting selected slot...');
    await page.evaluate(async () => {
      const setSlotWithRetry = async (attempt = 0, maxAttempts = 3) => {
        try {
          if (window.__idleVillageTestHooks?.setSelectedSlot) {
            window.__idleVillageTestHooks.setSelectedSlot('location-1');
            return true;
          }
          throw new Error('Test hooks not available');
        } catch (error) {
          if (attempt >= maxAttempts) throw error;
          console.log(`Retry ${attempt + 1} for setSelectedSlot...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return setSlotWithRetry(attempt + 1, maxAttempts);
        }
      };
      
      return setSlotWithRetry();
    });

    // Wait for location card to be visible with retry logic
    console.log('Waiting for location card...');
    const locationCard = page.getByTestId('location-card').first();
    
    await expect(locationCard, 'Location card should be visible')
      .toBeVisible({ timeout: 20000 });
    
    // Check attributes with better error messages and retries
    console.log('Checking location card state...');
    await expect(locationCard, 'Location card should have locked state')
      .toHaveAttribute('data-drop-state', 'locked', { timeout: 10000 });
    
    await expect(locationCard, 'Location card should have opacity class')
      .toHaveClass(/opacity-60/, { timeout: 10000 });

    // Verify drop state is locked
    console.log('Verifying drop state...');
    const dropState = await getLocationDropState(page);
    expect(dropState, 'Drop state should be locked').toBe('locked');
    
    console.log('Test completed successfully');
  });

  test('location card shows valid drop state with compatible resident', async ({ page }) => {
    // Use seedVillageSandbox with retry logic
    let seedSuccess = false;
    let attempt = 0;
    const maxAttempts = 3;
    
    while (!seedSuccess && attempt < maxAttempts) {
      try {
        console.log(`Seeding sandbox attempt ${attempt + 1}...`);
        await seedVillageSandbox(page, { tabId: 'map' });
        seedSuccess = true;
        console.log('Sandbox seeded successfully');
      } catch (error) {
        attempt++;
        console.error(`Seeding attempt ${attempt} failed:`, error);
        if (attempt >= maxAttempts) throw error;
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Start dragging a resident with retry logic
    console.log('Setting dragging resident...');
    await setDraggingResidentId(page, 'resident-1');

    // Check location card bloom effect with better error handling
    console.log('Checking location card...');
    const locationCard = page.locator('[data-testid="location-card"]').first();
    await expect(locationCard).toHaveClass(/ring-amber-200\/50/);
    await expect(locationCard).toHaveAttribute('data-drop-state', 'valid');

    // Verify drop state is valid
    const dropState = await getLocationDropState(page);
    expect(dropState).toBe('valid');
  });

  test('drop state becomes invalid when resident lacks stat tags', async ({ page }) => {
    console.log('Starting test: drop state becomes invalid when resident lacks stat tags');
    
    // Use seedVillageSandbox with retry logic
    let seedSuccess = false;
    let attempt = 0;
    const maxAttempts = 3;
    
    while (!seedSuccess && attempt < maxAttempts) {
      try {
        console.log(`Seeding sandbox attempt ${attempt + 1}...`);
        await seedVillageSandbox(page, { tabId: 'map' });
        seedSuccess = true;
        console.log('Sandbox seeded successfully');
      } catch (error) {
        attempt++;
        console.error(`Seeding attempt ${attempt} failed:`, error);
        if (attempt >= maxAttempts) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Start dragging a resident that lacks required stat tags
    console.log('Setting dragging resident (lacks stat tags)...');
    await setDraggingResidentId(page, 'resident-2');

    // Check location card shows invalid state with retry logic
    console.log('Checking for invalid state...');
    const locationCard = page.locator('[data-testid="location-card"]').first();
    
    await expect(locationCard, 'Location card should show invalid state')
      .toHaveClass(/ring-red-200\/50/, { timeout: 10000 });
      
    await expect(locationCard, 'Location card should have invalid drop state')
      .toHaveAttribute('data-drop-state', 'invalid', { timeout: 10000 });

    // Verify drop state is invalid
    const dropState = await getLocationDropState(page);
    expect(dropState, 'Drop state should be invalid').toBe('invalid');
    
    console.log('Test completed successfully');
  });

  test('drop state locked during night phase prevents interaction', async ({ page }) => {
    console.log('Starting test: drop state locked during night phase');
    
    // Navigate to the sandbox with retry logic
    let navigationSuccess = false;
    let navigationAttempts = 0;
    const maxNavigationAttempts = 3;
    
    while (!navigationSuccess && navigationAttempts < maxNavigationAttempts) {
      try {
        console.log(`Navigation attempt ${navigationAttempts + 1}...`);
        await navigateToVillageSandbox(page);
        navigationSuccess = true;
        console.log('Navigation successful');
      } catch (error) {
        navigationAttempts++;
        console.error(`Navigation attempt ${navigationAttempts} failed:`, error);
        if (navigationAttempts >= maxNavigationAttempts) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Wait for the app to be fully loaded
    await waitForAppReady(page);
    
    // Wait for test hooks
    console.log('Waiting for test hooks...');
    const hooksAvailable = await waitForTestHooks(page);
    expect(hooksAvailable, 'Test hooks should be available').toBe(true);
    
    // Set to night phase by advancing time
    console.log('Setting night phase...');
    await page.evaluate(() => {
      const hooks = window.__idleVillageTestHooks;
      if (!hooks?.advanceTime) {
        throw new Error('advanceTime not available on test hooks');
      }
      // Advance time by 12 hours to ensure night phase
      hooks.advanceTime(12 * 60 * 60);
      
      // Also try toggling rest mode if available
      if (hooks.toggleRestMode) {
        hooks.toggleRestMode(true);
      }
    });

    // Try to start dragging a resident
    console.log('Setting dragging resident...');
    await setDraggingResidentId(page, 'resident-1');

    // Check location card shows locked state with retry logic
    console.log('Checking for locked state...');
    const locationCard = page.locator('[data-testid="location-card"]').first();
    
    await expect(locationCard, 'Location card should have opacity class')
      .toHaveClass(/opacity-60/, { timeout: 10000 });
      
    await expect(locationCard, 'Location card should have locked drop state')
      .toHaveAttribute('data-drop-state', 'locked', { timeout: 10000 });

    // Verify drop state is locked
    const dropState = await getLocationDropState(page);
    expect(dropState, 'Drop state should be locked').toBe('locked');
    
    console.log('Test completed successfully');
  });

  test('activity slots show valid drop state with compatible resident', async ({ page }) => {
    console.log('Starting test: activity slots show valid drop state');
    
    // Navigate to the sandbox with retry logic
    let navigationSuccess = false;
    let attempt = 0;
    const maxAttempts = 3;
    
    while (!navigationSuccess && attempt < maxAttempts) {
      try {
        console.log(`Navigation attempt ${attempt + 1}...`);
        await navigateToVillageSandbox(page);
        navigationSuccess = true;
        console.log('Navigation successful');
      } catch (error) {
        attempt++;
        console.error(`Navigation attempt ${attempt} failed:`, error);
        if (attempt >= maxAttempts) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Wait for the app to be fully loaded
    await waitForAppReady(page);
    
    // Wait for test hooks
    console.log('Waiting for test hooks...');
    const hooksAvailable = await waitForTestHooks(page);
    expect(hooksAvailable, 'Test hooks should be available').toBe(true);

    // Start dragging a resident with retry logic
    console.log('Setting dragging resident...');
    await setDraggingResidentId(page, 'resident-1');

    // Check activity slot shows valid state with retry logic
    console.log('Checking activity slot state...');
    const activitySlot = page.locator('[data-testid="activity-slot"]').first();
    
    // Hover over the slot to trigger any hover effects
    await activitySlot.hover();
    
    // Check visual state
    await expect(activitySlot, 'Activity slot should have valid state class')
      .toHaveClass(/ring-amber-200\/50/, { timeout: 10000 });
      
    await expect(activitySlot, 'Activity slot should have valid drop state')
      .toHaveAttribute('data-drop-state', 'valid', { timeout: 10000 });
      
    // Check for ring effect which indicates hover/active state
    await expect(activitySlot, 'Activity slot should have ring effect on hover')
      .toHaveClass(/ring-2/);
  });
});
