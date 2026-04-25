import { type Page } from '@playwright/test';

/**
 * Session tagging utilities for automatic mobile playtest logger integration.
 * Handles sessionStorage operations with KPI tracking and fallback mechanisms.
 */

interface SessionTagConfig {
  key: string;
  defaultValue?: string;
  kpiTimeoutMs: number;
}

const DEFAULT_CONFIG: SessionTagConfig = {
  key: 'punch-club-session-tag',
  kpiTimeoutMs: 5000, // 5s KPI target
};

/**
 * Generates a session tag based on test context and timestamp.
 */
function generateSessionTag(testInfo: { title: string; file?: string }): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  const testSlug = testInfo.title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30);
  
  return `playwright-${testSlug}-${timestamp}`;
}

/**
 * Sets session tag in sessionStorage with KPI tracking.
 * Returns success status and timing information.
 */
export async function setSessionTag(
  page: Page,
  tag: string,
  config: Partial<SessionTagConfig> = {}
): Promise<{ success: boolean; durationMs: number; error?: string }> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();
  
  try {
    const result = await page.evaluate(
      ({ key, value, timeoutMs }) => {
        const startTime = performance.now();
        
        try {
          // Attempt to use sessionStorage with fallback to localStorage
          let storage: Storage | undefined;
          try {
            storage = globalThis.sessionStorage;
            if (storage) {
              storage.setItem(key, value);
            }
          } catch {
            console.warn('sessionStorage access denied, falling back to localStorage');
          }

          if (!storage) {
            try {
              storage = typeof localStorage !== 'undefined' ? localStorage : undefined;
              if (storage) {
                storage.setItem(key, value);
              }
            } catch {
              throw new Error('All storage access denied');
            }
          }
          
          if (!storage) {
            throw new Error('No storage available');
          }
          
          // Verify it was set correctly
          const stored = storage.getItem(key);
          if (stored !== value) {
            throw new Error('Failed to verify stored session tag');
          }
          
          const duration = performance.now() - startTime;
          const withinKPI = duration < timeoutMs;
          
          return {
            success: true,
            duration: Math.round(duration),
            withinKPI,
            storedValue: stored,
          };
        } catch (error) {
          return {
            success: false,
            duration: Math.round(performance.now() - startTime),
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
      {
        key: finalConfig.key,
        value: tag,
        timeoutMs: finalConfig.kpiTimeoutMs,
      }
    );
    
    const totalDuration = Date.now() - startTime;
    
    if (result.success) {
      console.log(`🏷️  Session tag set: "${tag}" (${result.duration}ms, KPI: ${result.withinKPI ? '✅' : '⚠️'})`);
      
      if (!result.withinKPI) {
        console.warn(`⚠️  Session tag KPI violation: ${result.duration}ms (target: <${finalConfig.kpiTimeoutMs}ms)`);
      }
      
      return { success: true, durationMs: totalDuration };
    } else {
      console.error(`❌ Failed to set session tag: ${result.error}`);
      return { success: false, durationMs: totalDuration, error: result.error };
    }
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Session tag setup failed: ${errorMessage}`);
    return { success: false, durationMs: totalDuration, error: errorMessage };
  }
}

/**
 * Gets session tag from sessionStorage with KPI tracking.
 * Returns the tag or null if not found/available.
 */
export async function getSessionTag(
  page: Page,
  config: Partial<SessionTagConfig> = {}
): Promise<{ tag: string | null; durationMs: number; withinKPI: boolean; error?: string }> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();
  
  try {
    const result = await page.evaluate(
      ({ key, timeoutMs }) => {
        const startTime = performance.now();
        
        try {
          // Attempt to use sessionStorage with fallback to localStorage
          let storage: Storage | undefined;
          try {
            storage = typeof sessionStorage !== 'undefined' ? sessionStorage : undefined;
          } catch {
            // ignore
          }

          if (!storage) {
            try {
              storage = typeof localStorage !== 'undefined' ? localStorage : undefined;
            } catch {
              // ignore
            }
          }

          if (!storage) {
            throw new Error('No storage available');
          }
          
          // Get the session tag
          const tag = storage.getItem(key);
          
          const duration = performance.now() - startTime;
          const withinKPI = duration < timeoutMs;
          
          return {
            tag,
            duration: Math.round(duration),
            withinKPI,
          };
        } catch (error) {
          return {
            tag: null,
            duration: Math.round(performance.now() - startTime),
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
      {
        key: finalConfig.key,
        timeoutMs: finalConfig.kpiTimeoutMs,
      }
    );
    
    const totalDuration = Date.now() - startTime;
    
    if (result.error) {
      console.warn(`⚠️  Session tag retrieval warning: ${result.error}`);
    }
    
    if (!result.withinKPI) {
      console.warn(`⚠️  Session tag KPI violation: ${result.duration}ms (target: <${finalConfig.kpiTimeoutMs}ms)`);
    }
    
    return {
      tag: result.tag,
      durationMs: totalDuration,
      withinKPI: result.withinKPI ?? false,
      error: result.error,
    };
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Session tag retrieval failed: ${errorMessage}`);
    return {
      tag: null,
      durationMs: totalDuration,
      withinKPI: false,
      error: errorMessage,
    };
  }
}

/**
 * Automatically sets up session tagging for a test.
 * Generates a tag based on test info and stores it in sessionStorage.
 */
export async function autoSetupSessionTag(
  page: Page,
  testInfo: { title: string; file?: string },
  config: Partial<SessionTagConfig> = {}
): Promise<{ success: boolean; tag: string; durationMs: number; error?: string }> {
  const tag = generateSessionTag(testInfo);
  console.log(`🔧 Auto-setting session tag for "${testInfo.title}": ${tag}`);
  
  const result = await setSessionTag(page, tag, config);
  
  if (result.success) {
    console.log(`✅ Session tag auto-setup complete`);
    return { success: true, tag, durationMs: result.durationMs };
  } else {
    console.error(`❌ Session tag auto-setup failed: ${result.error}`);
    return { success: false, tag, durationMs: result.durationMs, error: result.error };
  }
}

/**
 * Clears session tag from sessionStorage.
 * Useful for test cleanup or isolation.
 */
export async function clearSessionTag(
  page: Page,
  config: Partial<SessionTagConfig> = {}
): Promise<{ success: boolean; durationMs: number; error?: string }> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();
  
  try {
    const result = await page.evaluate(
      ({ key }) => {
        try {
          // Attempt to use sessionStorage with fallback to localStorage
          let storage: Storage | undefined;
          try {
            storage = typeof sessionStorage !== 'undefined' ? sessionStorage : undefined;
            if (storage) {
              storage.removeItem(key);
            }
          } catch {
            // ignore
          }

          if (!storage) {
            try {
              storage = typeof localStorage !== 'undefined' ? localStorage : undefined;
              if (storage) {
                storage.removeItem(key);
              }
            } catch {
              throw new Error('All storage access denied');
            }
          }

          if (!storage) {
            throw new Error('No storage available');
          }
          
          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
      { key: finalConfig.key }
    );
    
    const totalDuration = Date.now() - startTime;
    
    if (result.success) {
      console.log(`🧹 Session tag cleared`);
      return { success: true, durationMs: totalDuration };
    } else {
      console.error(`❌ Failed to clear session tag: ${result.error}`);
      return { success: false, durationMs: totalDuration, error: result.error };
    }
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Session tag clear failed: ${errorMessage}`);
    return { success: false, durationMs: totalDuration, error: errorMessage };
  }
}

/**
 * Playwright test fixture that automatically manages session tags.
 * Usage: test.use({ sessionTag: sessionTagFixture });
 */
export const sessionTagFixture = async ({ page }: { page: Page }, provideFixture: (tag: string) => Promise<void>) => {
  // Get test info from the test context
  const testInfo = (global as unknown as { __currentTestInfo?: { title: string; file: string } }).__currentTestInfo || { title: 'unknown', file: 'unknown' };
  
  // Auto-setup session tag before test
  const setupResult = await autoSetupSessionTag(page, testInfo);
  
  if (!setupResult.success) {
    console.warn(`⚠️  Session tag setup failed, test will continue without tagging: ${setupResult.error}`);
  }
  
  // Provide the tag to the test
  const tag = setupResult.tag;
  await provideFixture(tag);
  
  // Cleanup after test (optional - uncomment if needed)
  // await clearSessionTag(page);
};

/**
 * Validates sessionStorage availability and basic functionality.
 * Useful for test environment verification.
 */
export async function validateSessionStorage(page: Page): Promise<{
  available: boolean;
  canSetGet: boolean;
  durationMs: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const result = await page.evaluate(() => {
      try {
        // Check availability
        if (typeof sessionStorage === 'undefined') {
          return { available: false, canSetGet: false };
        }
        
        // Test set/get functionality
        const testKey = 'session-storage-test';
        const testValue = 'test-value-' + Date.now();
        
        sessionStorage.setItem(testKey, testValue);
        const retrieved = sessionStorage.getItem(testKey);
        sessionStorage.removeItem(testKey);
        
        return {
          available: true,
          canSetGet: retrieved === testValue,
        };
      } catch (error) {
        return {
          available: false,
          canSetGet: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });
    
    const totalDuration = Date.now() - startTime;
    
    if (result.available && result.canSetGet) {
      console.log(`✅ Session storage validated (${totalDuration}ms)`);
    } else {
      console.warn(`⚠️  Session storage validation failed: ${result.error || 'Unknown error'}`);
    }
    
    return {
      available: result.available,
      canSetGet: result.canSetGet,
      durationMs: totalDuration,
      error: result.error,
    };
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Session storage validation crashed: ${errorMessage}`);
    return {
      available: false,
      canSetGet: false,
      durationMs: totalDuration,
      error: errorMessage,
    };
  }
}
