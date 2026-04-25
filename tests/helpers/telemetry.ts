import type { Page } from '@playwright/test';
import type { SandboxTelemetryEvent } from './testTypes';

/**
 * Get telemetry events from the page
 */
export async function getTelemetryEvents(page: Page): Promise<SandboxTelemetryEvent[]> {
  return page.evaluate(() => window.__sandboxTelemetry?.events ?? []);
}

/**
 * Clear telemetry events from the page
 */
export async function clearTelemetryEvents(page: Page): Promise<void> {
  await page.evaluate(() => {
    if (window.__sandboxTelemetry) {
      window.__sandboxTelemetry.events = [];
    }
  });
}

/**
 * Enable test hooks for Idle Village
 */
export async function enableIdleVillageTestHooks(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.__ENABLE_IDLE_VILLAGE_TEST_HOOKS = true;
  });
}

/**
 * Get interaction mode from the page
 */
export async function getInteractionMode(page: Page): Promise<string> {
  return page.evaluate(() => {
    // Try to get from hook or fallback to detection
    if (window.__IDLE_VILLAGE_INTERACTION_MODE__) {
      return window.__IDLE_VILLAGE_INTERACTION_MODE__;
    }
    
    // Fallback detection
    const isMobile = window.innerWidth <= 768;
    return isMobile ? 'mobile' : 'desktop';
  });
}

/**
 * Wait for telemetry event with specific type
 */
export async function waitForTelemetryEvent(
  page: Page, 
  eventType: string, 
  timeout = 5000
): Promise<SandboxTelemetryEvent | null> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const events = await getTelemetryEvents(page);
    const event = events.find(e => e.type === eventType);
    if (event) {
      return event;
    }
    await page.waitForTimeout(100);
  }
  
  return null;
}

/**
 * Set test residents data
 */
export async function setTestResidents(page: Page, residents: any[]): Promise<void> {
  await page.evaluate((residentsData) => {
    window.__TEST_RESIDENTS = residentsData;
  }, residents);
}

/**
 * Set invasion type for testing
 */
export async function setInvasionType(page: Page, invasionType: string): Promise<void> {
  await page.evaluate((type) => {
    window.__TEST_INVASION_TYPE = type;
  }, invasionType);
}

/**
 * Get console errors during test
 */
export async function getConsoleErrors(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    return (window as any).__testConsoleErrors || [];
  });
}

/**
 * Set up console error tracking
 */
export async function trackConsoleErrors(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).__testConsoleErrors = [];
    
    const originalError = console.error;
    console.error = (...args: any[]) => {
      (window as any).__testConsoleErrors?.push(args.join(' '));
      originalError.apply(console, args);
    };
  });
}

// Extend Window interface for test hooks
declare global {
  interface Window {
    __sandboxTelemetry?: {
      events: SandboxTelemetryEvent[];
      metrics?: Record<string, unknown>;
      sessionId?: string;
    };
    __ENABLE_IDLE_VILLAGE_TEST_HOOKS?: boolean;
    __TEST_RESIDENTS?: Array<Record<string, unknown>>;
    __TEST_INVASION_TYPE?: string;
    __TEST_SEED?: string;
    __IDLE_VILLAGE_INTERACTION_MODE__?: string;
    __testConsoleErrors?: string[];
  }
}
