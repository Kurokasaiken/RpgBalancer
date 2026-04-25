import { type Page, type TestInfo } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import type { MobilePlaytestLog } from '../../scripts/mobilePlaytestLogger';
import type { SandboxTelemetryEvent } from './testTypes';

/**
 * Playwright helper for extracting and saving telemetry data after test execution.
 * Integrates with the mobilePlaytestLogger CLI workflow for automatic session tagging.
 */

interface TelemetrySnapshot {
  sessionId?: string;
  sessionTag?: string;
  events: SandboxTelemetryEvent[];
  metrics?: Record<string, unknown>;
  testInfo: {
    title: string;
    file: string;
    line: number;
    column: number;
  };
  extractedAt: string;
}

/**
 * Extracts telemetry data from the page's window.__sandboxTelemetry object.
 * Returns a structured snapshot with session information and events.
 */
export async function extractTelemetry(page: Page, testInfo: TestInfo): Promise<TelemetrySnapshot | null> {
  try {
    const telemetry = await page.evaluate(() => {
      const sandboxTelemetry = window.__sandboxTelemetry;
      const sessionStorage = window.sessionStorage;

      let sessionTag: string | undefined;
      if (sessionStorage) {
        try {
          sessionTag = sessionStorage.getItem('punch-club-session-tag') || undefined;
        } catch (error) {
          console.warn('Failed to read session tag from sessionStorage:', error);
        }
      }

      const events: SandboxTelemetryEvent[] = sandboxTelemetry?.events ?? [];
      const metrics = sandboxTelemetry?.metrics;
      const sessionId =
        sandboxTelemetry?.sessionId ??
        (events.length > 0 && typeof events[0].timestamp === 'number'
          ? `session-${events[0].timestamp}`
          : undefined);

      return {
        sessionId,
        sessionTag,
        events,
        metrics,
      };
    });

    if (!telemetry) {
      return null;
    }

    if (telemetry.events.length === 0 && !telemetry.metrics) {
      console.log('No telemetry data found in window.__sandboxTelemetry');
      return null;
    }

    return {
      ...telemetry,
      testInfo: {
        title: testInfo.title,
        file: testInfo.file,
        line: testInfo.line,
        column: testInfo.column,
      },
      extractedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('Failed to extract telemetry:', error);
    return null;
  }
}

/**
 * Saves telemetry snapshot to test-results directory with proper naming.
 * Creates directory if needed and returns the file path for evidence tracking.
 */
export function saveTelemetrySnapshot(
  snapshot: TelemetrySnapshot,
  testInfo: TestInfo,
  outputDir: string = 'test-results/telemetry'
): string {
  try {
    // Ensure output directory exists
    mkdirSync(dirname(outputDir), { recursive: true });
    mkdirSync(outputDir, { recursive: true });

    // Generate filename with test info and timestamp
    const testSlug = testInfo.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 50);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `telemetry-${testSlug}-${timestamp}.json`;
    const filePath = join(outputDir, filename);

    // Save the snapshot
    writeFileSync(filePath, JSON.stringify(snapshot, null, 2));
    console.log(`Telemetry snapshot saved to: ${filePath}`);

    return filePath;
  } catch (error) {
    console.error('Failed to save telemetry snapshot:', error);
    throw error;
  }
}

/**
 * Extracts and saves telemetry in one step. Returns the file path or null if no data.
 */
export async function captureAndSaveTelemetry(
  page: Page,
  testInfo: TestInfo,
  outputDir: string = 'test-results/telemetry'
): Promise<string | null> {
  const snapshot = await extractTelemetry(page, testInfo);
  if (!snapshot) {
    return null;
  }

  return saveTelemetrySnapshot(snapshot, testInfo, outputDir);
}

/**
 * Converts telemetry snapshot to mobilePlaytestLogger format for CLI integration.
 * Maps Playwright telemetry to the expected MobilePlaytestLog structure.
 */
export function convertToMobileLoggerFormat(
  snapshot: TelemetrySnapshot,
  additionalData: {
    tester: string;
    device: string;
    qualitativeNotes: string;
  }
): Partial<MobilePlaytestLog> {
  // Extract metrics from telemetry events
  const cycleDurations: number[] = [];
  const tapCounts: number[] = [];
  const assignmentLatencies: number[] = [];
  let pickerCloseRate = 0;
  const resourceDelta: { gold: number; food: number } = { gold: 0, food: 0 };

  snapshot.events.forEach(event => {
    const payload = event.payload ?? {};
    switch (event.type) {
      case 'cycle_complete':
        if (typeof payload.durationMs === 'number') {
          cycleDurations.push(payload.durationMs);
        }
        break;
      case 'assign_success':
        if (typeof payload.tapCount === 'number') {
          tapCounts.push(payload.tapCount);
        }
        if (typeof payload.latencyMs === 'number') {
          assignmentLatencies.push(payload.latencyMs);
        }
        break;
      case 'picker_close':
        if (typeof payload.closedWithinThreshold === 'boolean') {
          pickerCloseRate = payload.closedWithinThreshold ? 100 : 0;
        }
        break;
      case 'resource_change':
        if (payload.delta) {
          if (typeof payload.delta.gold === 'number') {
            resourceDelta.gold += payload.delta.gold;
          }
          if (typeof payload.delta.food === 'number') {
            resourceDelta.food += payload.delta.food;
          }
        }
        break;
    }
  });

  return {
    sessionId: snapshot.sessionId || `auto-${Date.now()}`,
    sessionTag: snapshot.sessionTag,
    tester: additionalData.tester,
    device: additionalData.device,
    cycleDurationMs: cycleDurations.length > 0 ? cycleDurations : [90000], // Default 90s
    tapsPerAssignment: tapCounts.length > 0 ? tapCounts : [3], // Default 3 taps
    assignmentLatencyMs: assignmentLatencies.length > 0 ? assignmentLatencies : [450], // Default 450ms
    pickerCloseRate,
    resourceDelta,
    qualitativeNotes: additionalData.qualitativeNotes,
    telemetrySource: `playwright-${snapshot.testInfo.title}`,
    createdAt: snapshot.extractedAt,
  };
}

export const captureTelemetryFixture = async (
  { page }: { page: Page },
  provideFixture: () => Promise<void>,
  testInfo: TestInfo
) => {
  // Don't do anything before the test
  await provideFixture();

  // Capture telemetry after test completion
  try {
    const filePath = await captureAndSaveTelemetry(page, testInfo);
    if (filePath) {
      console.log(`📊 Telemetry captured: ${filePath}`);
      
      // Attach to test results for reporting
      testInfo.attachments.push({
        name: 'telemetry',
        path: filePath,
        contentType: 'application/json',
      });
    }
  } catch (error) {
    console.warn('Failed to capture telemetry after test:', error);
  }
};
