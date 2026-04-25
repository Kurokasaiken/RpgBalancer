/**
 * PWA Install Tracker QA Harness Utilities
 * 
 * Config-first utilities for testing PWA install tracker with Playwright.
 * Simulates install prompt events and verifies telemetry emission.
 * 
 * @since NP-138 – Punch Club PWA Install Tracker QA Harness
 */

import type { Page } from '@playwright/test';
import { z } from 'zod';

/**
 * Install prompt scenario types
 */
export type InstallScenarioType = 'accept' | 'dismiss' | 'timeout' | 'error';

/**
 * Install prompt scenario configuration
 */
export interface InstallScenario {
  /** Scenario identifier */
  id: string;
  /** Scenario type */
  type: InstallScenarioType;
  /** Scenario description */
  description: string;
  /** User action to simulate */
  action: 'accept' | 'dismiss' | 'ignore' | 'error';
  /** Delay before action (ms) */
  actionDelay: number;
  /** Expected telemetry event */
  expectedEvent: string;
  /** Expected outcome */
  expectedOutcome: {
    installed: boolean;
    promptShown: boolean;
    userChoice: string | null;
  };
  /** Timeout for scenario (ms) */
  timeout: number;
}

/**
 * Harness configuration
 */
export interface InstallTrackerHarnessConfig {
  /** Test scenarios */
  scenarios: InstallScenario[];
  /** Screenshot settings */
  screenshots: {
    enabled: boolean;
    captureOnPrompt: boolean;
    captureOnAction: boolean;
    captureOnComplete: boolean;
    outputDir: string;
  };
  /** Logging settings */
  logging: {
    enabled: boolean;
    verbose: boolean;
    outputDir: string;
  };
  /** Telemetry verification */
  telemetry: {
    enabled: boolean;
    expectedEvents: string[];
    verifyPayload: boolean;
  };
  /** Performance tracking */
  performance: {
    enabled: boolean;
    trackPromptDelay: boolean;
    trackActionTime: boolean;
  };
}

/**
 * Zod schema for install scenario
 */
export const InstallScenarioSchema = z.object({
  id: z.string(),
  type: z.enum(['accept', 'dismiss', 'timeout', 'error']),
  description: z.string(),
  action: z.enum(['accept', 'dismiss', 'ignore', 'error']),
  actionDelay: z.number().min(0).max(10000),
  expectedEvent: z.string(),
  expectedOutcome: z.object({
    installed: z.boolean(),
    promptShown: z.boolean(),
    userChoice: z.string().nullable(),
  }),
  timeout: z.number().min(1000).max(30000),
});

/**
 * Zod schema for harness configuration
 */
export const InstallTrackerHarnessConfigSchema = z.object({
  scenarios: z.array(InstallScenarioSchema).min(1),
  screenshots: z.object({
    enabled: z.boolean().default(true),
    captureOnPrompt: z.boolean().default(true),
    captureOnAction: z.boolean().default(true),
    captureOnComplete: z.boolean().default(true),
    outputDir: z.string().default('test-results/pwa-install-tracker'),
  }),
  logging: z.object({
    enabled: z.boolean().default(true),
    verbose: z.boolean().default(false),
    outputDir: z.string().default('test-results/pwa-install-tracker'),
  }),
  telemetry: z.object({
    enabled: z.boolean().default(true),
    expectedEvents: z.array(z.string()).default([
      'pwa_install_prompt_shown',
      'pwa_install_prompt_accepted',
      'pwa_install_prompt_dismissed',
    ]),
    verifyPayload: z.boolean().default(true),
  }),
  performance: z.object({
    enabled: z.boolean().default(true),
    trackPromptDelay: z.boolean().default(true),
    trackActionTime: z.boolean().default(true),
  }),
});

/**
 * Default test scenarios
 */
export const DEFAULT_INSTALL_SCENARIOS: InstallScenario[] = [
  {
    id: 'accept-immediate',
    type: 'accept',
    description: 'User accepts install prompt immediately',
    action: 'accept',
    actionDelay: 100,
    expectedEvent: 'pwa_install_prompt_accepted',
    expectedOutcome: {
      installed: true,
      promptShown: true,
      userChoice: 'accepted',
    },
    timeout: 5000,
  },
  {
    id: 'accept-delayed',
    type: 'accept',
    description: 'User accepts install prompt after delay',
    action: 'accept',
    actionDelay: 2000,
    expectedEvent: 'pwa_install_prompt_accepted',
    expectedOutcome: {
      installed: true,
      promptShown: true,
      userChoice: 'accepted',
    },
    timeout: 5000,
  },
  {
    id: 'dismiss-immediate',
    type: 'dismiss',
    description: 'User dismisses install prompt immediately',
    action: 'dismiss',
    actionDelay: 100,
    expectedEvent: 'pwa_install_prompt_dismissed',
    expectedOutcome: {
      installed: false,
      promptShown: true,
      userChoice: 'dismissed',
    },
    timeout: 5000,
  },
  {
    id: 'dismiss-delayed',
    type: 'dismiss',
    description: 'User dismisses install prompt after delay',
    action: 'dismiss',
    actionDelay: 2000,
    expectedEvent: 'pwa_install_prompt_dismissed',
    expectedOutcome: {
      installed: false,
      promptShown: true,
      userChoice: 'dismissed',
    },
    timeout: 5000,
  },
  {
    id: 'timeout',
    type: 'timeout',
    description: 'User ignores prompt until timeout',
    action: 'ignore',
    actionDelay: 5000,
    expectedEvent: 'pwa_install_prompt_timeout',
    expectedOutcome: {
      installed: false,
      promptShown: true,
      userChoice: null,
    },
    timeout: 6000,
  },
];

/**
 * Default harness configuration
 */
export const DEFAULT_HARNESS_CONFIG: InstallTrackerHarnessConfig = {
  scenarios: DEFAULT_INSTALL_SCENARIOS,
  screenshots: {
    enabled: true,
    captureOnPrompt: true,
    captureOnAction: true,
    captureOnComplete: true,
    outputDir: 'test-results/pwa-install-tracker',
  },
  logging: {
    enabled: true,
    verbose: false,
    outputDir: 'test-results/pwa-install-tracker',
  },
  telemetry: {
    enabled: true,
    expectedEvents: [
      'pwa_install_prompt_shown',
      'pwa_install_prompt_accepted',
      'pwa_install_prompt_dismissed',
      'pwa_install_prompt_timeout',
    ],
    verifyPayload: true,
  },
  performance: {
    enabled: true,
    trackPromptDelay: true,
    trackActionTime: true,
  },
};

/**
 * Test result for a scenario
 */
export interface ScenarioTestResult {
  scenarioId: string;
  success: boolean;
  duration: number;
  telemetryEvents: Array<{
    event: string;
    timestamp: number;
    payload: Record<string, unknown>;
  }>;
  screenshots: string[];
  logs: string[];
  errors: string[];
  performance: {
    promptDelay?: number;
    actionTime?: number;
  };
}

/**
 * Harness run result
 */
export interface HarnessRunResult {
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  acceptanceRate: number;
  averageDuration: number;
  results: ScenarioTestResult[];
  timestamp: string;
}

/**
 * Simulate beforeinstallprompt event
 */
export async function simulateBeforeInstallPrompt(
  page: Page,
  scenario: InstallScenario
): Promise<void> {
  await page.evaluate((scenarioAction) => {
    const event = new Event('beforeinstallprompt') as any;
    event.prompt = async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ outcome: scenarioAction === 'accept' ? 'accepted' : 'dismissed' });
        }, 100);
      });
    };
    event.userChoice = new Promise((resolve) => {
      setTimeout(() => {
        resolve({ outcome: scenarioAction === 'accept' ? 'accepted' : 'dismissed' });
      }, 100);
    });
    window.dispatchEvent(event);
  }, scenario.action);
}

/**
 * Capture telemetry events from page
 */
export async function captureTelemetryEvents(
  page: Page
): Promise<Array<{ event: string; timestamp: number; payload: Record<string, unknown> }>> {
  return page.evaluate(() => {
    return (window as any).__TEST_TELEMETRY_EVENTS__ || [];
  });
}

/**
 * Setup telemetry capture on page
 */
export async function setupTelemetryCapture(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).__TEST_TELEMETRY_EVENTS__ = [];
    const originalConsoleLog = console.log;
    console.log = function(...args: any[]) {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('[Telemetry]')) {
        (window as any).__TEST_TELEMETRY_EVENTS__.push({
          event: args[0].replace('[Telemetry] ', ''),
          timestamp: Date.now(),
          payload: args[1] || {},
        });
      }
      originalConsoleLog.apply(console, args);
    };
  });
}

/**
 * Take screenshot with naming convention
 */
export async function takeScreenshot(
  page: Page,
  scenarioId: string,
  stage: string,
  outputDir: string
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${scenarioId}-${stage}-${timestamp}.png`;
  const path = `${outputDir}/${filename}`;
  await page.screenshot({ path, fullPage: true });
  return path;
}

/**
 * Write log entry
 */
export function writeLog(
  scenarioId: string,
  message: string,
  level: 'info' | 'warn' | 'error' = 'info'
): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] [${scenarioId}] ${message}`;
}

/**
 * Verify telemetry event payload
 */
export function verifyTelemetryPayload(
  event: { event: string; payload: Record<string, unknown> },
  expectedEvent: string,
  scenario: InstallScenario
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (event.event !== expectedEvent) {
    errors.push(`Expected event "${expectedEvent}", got "${event.event}"`);
  }

  if (!event.payload.timestamp) {
    errors.push('Missing timestamp in payload');
  }

  if (scenario.type === 'accept' && event.payload.userChoice !== 'accepted') {
    errors.push(`Expected userChoice "accepted", got "${event.payload.userChoice}"`);
  }

  if (scenario.type === 'dismiss' && event.payload.userChoice !== 'dismissed') {
    errors.push(`Expected userChoice "dismissed", got "${event.payload.userChoice}"`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate acceptance rate from results
 */
export function calculateAcceptanceRate(results: ScenarioTestResult[]): number {
  const acceptScenarios = results.filter(r => 
    r.scenarioId.includes('accept') && r.success
  );
  const totalAcceptScenarios = results.filter(r => 
    r.scenarioId.includes('accept')
  );
  
  if (totalAcceptScenarios.length === 0) return 0;
  
  return (acceptScenarios.length / totalAcceptScenarios.length) * 100;
}

/**
 * Generate harness run summary
 */
export function generateHarnessRunSummary(result: HarnessRunResult): string {
  const lines: string[] = [
    '='.repeat(80),
    'PWA Install Tracker QA Harness - Run Summary',
    '='.repeat(80),
    '',
    `Timestamp: ${result.timestamp}`,
    `Total Scenarios: ${result.totalScenarios}`,
    `Passed: ${result.passedScenarios}`,
    `Failed: ${result.failedScenarios}`,
    `Success Rate: ${((result.passedScenarios / result.totalScenarios) * 100).toFixed(1)}%`,
    `Acceptance Rate: ${result.acceptanceRate.toFixed(1)}%`,
    `Average Duration: ${result.averageDuration.toFixed(0)}ms`,
    '',
    'Scenario Results:',
    '-'.repeat(80),
  ];

  for (const scenarioResult of result.results) {
    lines.push(
      `  ${scenarioResult.success ? '✓' : '✗'} ${scenarioResult.scenarioId}`,
      `    Duration: ${scenarioResult.duration}ms`,
      `    Telemetry Events: ${scenarioResult.telemetryEvents.length}`,
      `    Screenshots: ${scenarioResult.screenshots.length}`,
      `    Errors: ${scenarioResult.errors.length}`
    );
    if (scenarioResult.errors.length > 0) {
      scenarioResult.errors.forEach(error => {
        lines.push(`      - ${error}`);
      });
    }
    lines.push('');
  }

  lines.push('='.repeat(80));

  return lines.join('\n');
}

/**
 * Validate harness configuration
 */
export function validateHarnessConfig(config: unknown): InstallTrackerHarnessConfig {
  const result = InstallTrackerHarnessConfigSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Invalid harness configuration: ${result.error.message}`);
  }
  return result.data;
}

/**
 * Create safe harness configuration
 */
export function createSafeHarnessConfig(
  config: Partial<InstallTrackerHarnessConfig> = {}
): InstallTrackerHarnessConfig {
  return validateHarnessConfig({
    ...DEFAULT_HARNESS_CONFIG,
    ...config,
  });
}
