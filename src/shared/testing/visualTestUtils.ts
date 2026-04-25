/**
 * Visual Testing Utilities
 * 
 * Config-first utilities for visual regression testing including:
 * - Animation disabling for deterministic screenshots
 * - Screenshot capture and comparison
 * - Baseline hash generation
 * - Test environment setup/cleanup
 * 
 * @since NP-091 – Punch Club Surge Tutorial Visual Baseline
 */

import { createHash } from 'crypto';
import type { Page, Locator } from '@playwright/test';

/**
 * Visual test configuration
 */
export interface VisualTestConfig {
  /** Disable animations for consistent screenshots */
  disableAnimations?: boolean;
  /** Viewport size for screenshots */
  viewport?: { width: number; height: number };
  /** Screenshot capture options */
  screenshotOptions?: {
    fullPage?: boolean;
    quality?: number;
    animations?: 'disabled' | 'enabled';
  };
  /** Comparison thresholds */
  comparison?: {
    threshold?: number;
    antialiasing?: number;
  };
}

/**
 * Screenshot comparison result
 */
export interface ScreenshotComparison {
  /** Whether comparison passed */
  passed: boolean;
  /** Number of different pixels */
  diffPixels: number;
  /** Total pixels in image */
  totalPixels: number;
  /** Difference percentage */
  diffPercentage: number;
  /** Diff image buffer (if any differences) */
  diffBuffer?: Buffer;
}

/**
 * Visual baseline validation result
 */
export interface VisualBaselineResult {
  /** Test scenario name */
  scenario: string;
  /** Total steps tested */
  steps: number;
  /** Number of passed steps */
  passed: number;
  /** Number of failed steps */
  failed: number;
  /** Test duration in milliseconds */
  duration: number;
  /** Generated baseline hash */
  baselineHash: string;
  /** Failure details (if any) */
  failures?: Array<{
    step: string;
    error: string;
  }>;
  /** Timestamp of validation */
  timestamp: number;
}

/**
 * Disable animations for consistent screenshots
 * 
 * @param page - Playwright page instance
 * @returns Promise that resolves when animations are disabled
 */
export async function disableAnimations(page: Page): Promise<void> {
  try {
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          animation-timing-function: step-end !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          transition-timing-function: step-end !important;
          scroll-behavior: auto !important;
        }
        
        /* Disable CSS transforms that might cause rendering differences */
        .transform-animation {
          transform: none !important;
        }
        
        /* Force consistent font rendering */
        * {
          text-rendering: geometricPrecision !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
        }
      `
    });
  } catch (error) {
    throw new Error(`Failed to disable animations: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Capture screenshot with consistent naming and options
 * 
 * @param element - Element or page to capture
 * @param name - Screenshot name
 * @param options - Screenshot options
 * @returns Promise resolving to screenshot buffer
 */
export async function captureScreenshot(
  element: Page | Locator,
  name: string,
  options: VisualTestConfig['screenshotOptions'] = {}
): Promise<Buffer> {
  try {
    const screenshotOptions = {
      path: `test-results/visual/baselines/${name}.png`,
      fullPage: false,
      quality: 90,
      animations: 'disabled' as const,
      ...options,
    };

    let buffer: Buffer;

    if ('screenshot' in element) {
      // It's a Locator
      buffer = await (element as Locator).screenshot(screenshotOptions);
    } else {
      // It's a Page
      buffer = await (element as Page).screenshot(screenshotOptions);
    }

    return buffer;
  } catch (error) {
    throw new Error(`Failed to capture screenshot '${name}': ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Compare two screenshots and return diff metrics
 * 
 * @param baseline - Baseline screenshot buffer
 * @param current - Current screenshot buffer
 * @param threshold - Difference threshold (0-1)
 * @returns Promise resolving to comparison result
 */
export async function compareScreenshots(
  baseline: Buffer,
  current: Buffer,
  threshold: number = 0.01
): Promise<ScreenshotComparison> {
  try {
    // Simple pixel comparison implementation
    // In a real implementation, you'd use a proper image comparison library
    const baselineSize = baseline.length;
    const currentSize = current.length;
    
    // For now, simulate comparison based on buffer size difference
    const sizeDifference = Math.abs(baselineSize - currentSize);
    const maxBufferSize = Math.max(baselineSize, currentSize);
    const diffPercentage = maxBufferSize > 0 ? (sizeDifference / maxBufferSize) : 0;
    
    const passed = diffPercentage <= threshold;
    
    return {
      passed,
      diffPixels: Math.floor(sizeDifference / 4), // Rough estimate
      totalPixels: maxBufferSize / 4, // Rough estimate
      diffPercentage,
      diffBuffer: passed ? undefined : Buffer.from('diff-image-placeholder'),
    };
  } catch (error) {
    throw new Error(`Failed to compare screenshots: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate consistent hash for visual baseline
 * 
 * @param screenshot - Screenshot buffer
 * @returns Promise resolving to hash string
 */
export async function generateBaselineHash(screenshot: Buffer): Promise<string> {
  try {
    const hash = createHash('sha256');
    hash.update(screenshot);
    return hash.digest('hex').substring(0, 12); // First 12 characters
  } catch (error) {
    throw new Error(`Failed to generate baseline hash: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Setup deterministic test environment
 * 
 * @param page - Playwright page instance
 * @param config - Test configuration
 * @returns Promise that resolves when environment is setup
 */
export async function setupDeterministicEnvironment(
  page: Page,
  config: VisualTestConfig = {}
): Promise<void> {
  try {
    // Set viewport size
    if (config.viewport) {
      await page.setViewportSize(config.viewport);
    }

    // Disable animations if requested
    if (config.disableAnimations !== false) {
      await disableAnimations(page);
    }

    // Set consistent timezone and locale
    await page.evaluate(() => {
      // Force consistent timezone
      (Intl as any).DateTimeFormat = undefined;
      
      // Force consistent locale
      Object.defineProperty(navigator, 'language', {
        get: () => 'en-US',
        configurable: true,
      });
    });

    // Disable hardware acceleration variations
    await page.addStyleTag({
      content: `
        /* Force consistent rendering */
        canvas {
          image-rendering: pixelated !important;
          image-rendering: -moz-crisp-edges !important;
          image-rendering: crisp-edges !important;
        }
        
        /* Disable video animations */
        video {
          animation: none !important;
          transition: none !important;
        }
      `
    });
  } catch (error) {
    throw new Error(`Failed to setup deterministic environment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Cleanup visual test environment
 * 
 * @param page - Playwright page instance
 * @returns Promise that resolves when cleanup is complete
 */
export async function cleanupVisualTestEnvironment(page?: Page): Promise<void> {
  try {
    if (page) {
      // Clear any added styles
      await page.evaluate(() => {
        // Remove any dynamically added style tags
        const dynamicStyles = document.querySelectorAll('style[data-dynamic="true"]');
        dynamicStyles.forEach(style => style.remove());
      });
    }
  } catch (error) {
    // Log cleanup error but don't throw
    console.warn(`Warning during cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create visual test scenario configuration
 * 
 * @param name - Scenario name
 * @param config - Scenario configuration
 * @returns Visual test scenario object
 */
export function createVisualTestScenario(
  name: string,
  config: Partial<VisualTestConfig> = {}
): VisualTestConfig & { name: string } {
  return {
    name,
    disableAnimations: true,
    viewport: { width: 1920, height: 1080 },
    screenshotOptions: {
      fullPage: false,
      quality: 90,
      animations: 'disabled',
    },
    comparison: {
      threshold: 0.01,
      antialiasing: 0.1,
    },
    ...config,
  };
}

/**
 * Validate visual baseline with telemetry
 * 
 * @param result - Validation result
 * @returns Promise that resolves when telemetry is sent
 */
export async function validateVisualBaseline(result: VisualBaselineResult): Promise<VisualBaselineResult> {
  try {
    // Import telemetry dynamically to avoid circular dependencies
    const { dispatchTelemetry } = await import('@/analytics/telemetry/telemetryProvider');
    
    // Send telemetry event
    await dispatchTelemetry('pc_surge_visual_baseline_checked', {
      scenario: result.scenario,
      steps: result.steps,
      passed: result.passed,
      failed: result.failed,
      duration: result.duration,
      baselineHash: result.baselineHash,
      failures: result.failures,
      timestamp: result.timestamp,
    });

    return result;
  } catch (error) {
    // Log telemetry error but don't fail the validation
    console.warn(`Failed to send telemetry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}

/**
 * Batch capture screenshots for multiple elements
 * 
 * @param elements - Array of element-name pairs
 * @param options - Screenshot options
 * @returns Promise resolving to array of screenshot buffers
 */
export async function batchCaptureScreenshots(
  elements: Array<{ element: Page | Locator; name: string }>,
  options: VisualTestConfig['screenshotOptions'] = {}
): Promise<Buffer[]> {
  const screenshots: Buffer[] = [];
  
  for (const { element, name } of elements) {
    try {
      const screenshot = await captureScreenshot(element, name, options);
      screenshots.push(screenshot);
    } catch (error) {
      console.error(`Failed to capture screenshot for ${name}:`, error);
      screenshots.push(Buffer.alloc(0)); // Empty buffer as placeholder
    }
  }
  
  return screenshots;
}

/**
 * Generate visual test report
 * 
 * @param results - Array of validation results
 * @returns Markdown report string
 */
export function generateVisualTestReport(results: VisualBaselineResult[]): string {
  const totalSteps = results.reduce((sum, result) => sum + result.steps, 0);
  const totalPassed = results.reduce((sum, result) => sum + result.passed, 0);
  const totalFailed = results.reduce((sum, result) => sum + result.failed, 0);
  const avgDuration = results.reduce((sum, result) => sum + result.duration, 0) / results.length;

  let report = `# Visual Baseline Test Report\n\n`;
  report += `## Summary\n`;
  report += `- **Total Scenarios**: ${results.length}\n`;
  report += `- **Total Steps**: ${totalSteps}\n`;
  report += `- **Passed**: ${totalPassed}\n`;
  report += `- **Failed**: ${totalFailed}\n`;
  report += `- **Success Rate**: ${totalSteps > 0 ? ((totalPassed / totalSteps) * 100).toFixed(1) : 0}%\n`;
  report += `- **Average Duration**: ${avgDuration.toFixed(0)}ms\n\n`;

  report += `## Scenario Results\n\n`;
  
  for (const result of results) {
    report += `### ${result.scenario}\n`;
    report += `- **Steps**: ${result.steps}\n`;
    report += `- **Passed**: ${result.passed}\n`;
    report += `- **Failed**: ${result.failed}\n`;
    report += `- **Duration**: ${result.duration}ms\n`;
    report += `- **Baseline Hash**: \`${result.baselineHash}\`\n`;
    
    if (result.failures && result.failures.length > 0) {
      report += `- **Failures**:\n`;
      for (const failure of result.failures) {
        report += `  - ${failure.step}: ${failure.error}\n`;
      }
    }
    
    report += `\n`;
  }

  return report;
}
