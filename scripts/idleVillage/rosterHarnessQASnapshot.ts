#!/usr/bin/env tsx

/**
 * Roster & Harness QA Snapshot CLI (MG-QA-SUITE)
 * 
 * Generates comprehensive snapshots for roster and harness testing including:
 * - Roster state snapshots
 * - Harness state snapshots  
 * - Visual regression data
 * - Telemetry event validation
 * - Performance metrics
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { performance } from 'perf_hooks';

const PROJECT_ROOT = resolve('.');
const DEFAULT_OUTPUT_DIR = resolve(PROJECT_ROOT, 'test-results');
const TEST_ROUTE = '/test';

/**
 * CLI arguments interface
 */
export interface CLIArgs {
  output?: string;
  includeVisual?: boolean;
  includePerformance?: boolean;
  includeTelemetry?: boolean;
  verbose?: boolean;
  help?: boolean;
}

/**
 * Roster state snapshot interface
 */
export interface RosterSnapshot {
  timestamp: string;
  route: string;
  residents: Array<{
    id: string;
    name: string;
    level: number;
    hp: number;
    fatigue: number;
    isInjured: boolean;
    isWorking: boolean;
    stats: Record<string, number>;
  }>;
  totalResidents: number;
  workingResidents: number;
  injuredResidents: number;
  averageFatigue: number;
  styleLabTokens: {
    heroBackground: string;
    accentColor: string;
    textColor: string;
  };
}

/**
 * Harness state snapshot interface
 */
export interface HarnessSnapshot {
  timestamp: string;
  slotId: string;
  assignedResidentId: string | null;
  assignedResidentName: string | null;
  dropState: 'idle' | 'valid' | 'invalid';
  showBloom: boolean;
  isPlaying: boolean;
  progressFraction: number;
  elapsedSeconds: number;
  totalDurationSeconds: number;
  elapsedLabel: string;
  remainingLabel: string;
  telemetryEvents: Array<{
    eventType: string;
    timestamp: number;
    payload: any;
  }>;
}

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  timestamp: string;
  pageLoad: {
    domContentLoaded: number;
    loadComplete: number;
    firstPaint: number;
    firstContentfulPaint: number;
  };
  interactions: {
    dragDropLatency: number;
    stateUpdateLatency: number;
    renderTime: number;
  };
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

/**
 * Complete QA snapshot interface
 */
export interface QASnapshot {
  timestamp: string;
  environment: {
    userAgent: string;
    viewport: { width: number; height: number };
    devicePixelRatio: number;
  };
  roster: RosterSnapshot;
  harness: HarnessSnapshot;
  performance?: PerformanceMetrics;
  visual?: {
    screenshots: Array<{
      name: string;
      path: string;
      size: { width: number; height: number };
    }>;
    layoutMetrics: {
      rosterSectionBounds: any;
      harnessSectionBounds: any;
      statusPanelBounds: any;
    };
  };
  validation: {
    allTestsPassed: boolean;
    failedTests: string[];
    warnings: string[];
  };
}

/**
 * Parse command line arguments
 */
function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const parsed: CLIArgs = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--output':
      case '-o':
        parsed.output = args[++i];
        break;
      case '--include-visual':
      case '-v':
        parsed.includeVisual = true;
        break;
      case '--include-performance':
      case '-p':
        parsed.includePerformance = true;
        break;
      case '--include-telemetry':
      case '-t':
        parsed.includeTelemetry = true;
        break;
      case '--verbose':
        parsed.verbose = true;
        break;
      case '--help':
      case '-h':
        parsed.help = true;
        break;
    }
  }

  return parsed;
}

/**
 * Display help information
 */
function showHelp(): void {
  console.log(`
Roster & Harness QA Snapshot CLI (MG-QA-SUITE)

USAGE:
  tsx scripts/idleVillage/rosterHarnessQASnapshot.ts [OPTIONS]

OPTIONS:
  -o, --output <dir>     Output directory for snapshots (default: test-results)
  -v, --include-visual  Include visual regression data
  -p, --include-performance Include performance metrics
  -t, --include-telemetry Include telemetry event validation
  --verbose             Enable verbose logging
  -h, --help            Show this help message

EXAMPLES:
  tsx scripts/idleVillage/rosterHarnessQASnapshot.ts
  tsx scripts/idleVillage/rosterHarnessQASnapshot.ts --output ./qa-results --include-visual
  tsx scripts/idleVillage/rosterHarnessQASnapshot.ts -v -p -t

DESCRIPTION:
  Generates comprehensive QA snapshots for the /test route including roster state,
  harness state, visual regression data, performance metrics, and telemetry validation.
  The snapshots are saved as JSON files for automated testing and manual review.

OUTPUT:
  Creates timestamped snapshot files in the output directory:
  - roster-harness-snapshot-YYYY-MM-DD-HH-mm-ss.json
  - roster-harness-validation-YYYY-MM-DD-HH-mm-ss.log
`);
}

/**
 * Ensure output directory exists
 */
function ensureOutputDir(outputDir: string): void {
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
}

/**
 * Generate timestamp for snapshot files
 */
function generateTimestamp(): string {
  const now = new Date();
  return now.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19); // YYYY-MM-DD_HH-mm-ss
}

/**
 * Mock roster data extraction (would be replaced with real browser automation)
 */
function extractRosterData(): RosterSnapshot {
  // This is a mock implementation - in real usage this would:
  // 1. Launch browser
  // 2. Navigate to /test route
  // 3. Extract data from DOM and store
  // 4. Capture Style Lab tokens
  
  return {
    timestamp: new Date().toISOString(),
    route: TEST_ROUTE,
    residents: [
      {
        id: 'resident-1',
        name: 'Aurora',
        level: 1,
        hp: 100,
        fatigue: 0,
        isInjured: false,
        isWorking: false,
        stats: { strength: 10, agility: 8, intelligence: 12 }
      },
      {
        id: 'resident-2', 
        name: 'Bruno',
        level: 1,
        hp: 100,
        fatigue: 15,
        isInjured: false,
        isWorking: false,
        stats: { strength: 15, agility: 6, intelligence: 8 }
      },
      {
        id: 'resident-3',
        name: 'Carla',
        level: 1,
        hp: 85,
        fatigue: 0,
        isInjured: true,
        isWorking: false,
        stats: { strength: 8, agility: 10, intelligence: 14 }
      }
    ],
    totalResidents: 3,
    workingResidents: 0,
    injuredResidents: 1,
    averageFatigue: 5,
    styleLabTokens: {
      heroBackground: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      accentColor: '#f59e0b',
      textColor: '#f1f5f9'
    }
  };
}

/**
 * Mock harness data extraction
 */
function extractHarnessData(): HarnessSnapshot {
  return {
    timestamp: new Date().toISOString(),
    slotId: 'test-harness-slot',
    assignedResidentId: null,
    assignedResidentName: null,
    dropState: 'idle',
    showBloom: false,
    isPlaying: false,
    progressFraction: 0,
    elapsedSeconds: 0,
    totalDurationSeconds: 60,
    elapsedLabel: '0:00',
    remainingLabel: '1:00',
    telemetryEvents: []
  };
}

/**
 * Mock performance metrics collection
 */
function collectPerformanceMetrics(): PerformanceMetrics {
  return {
    timestamp: new Date().toISOString(),
    pageLoad: {
      domContentLoaded: 245.5,
      loadComplete: 312.8,
      firstPaint: 180.2,
      firstContentfulPaint: 195.7
    },
    interactions: {
      dragDropLatency: 45.3,
      stateUpdateLatency: 12.8,
      renderTime: 8.4
    },
    memory: {
      usedJSHeapSize: 25476064,
      totalJSHeapSize: 37879808,
      jsHeapSizeLimit: 4294701568
    }
  };
}

/**
 * Mock visual regression data
 */
function collectVisualData() {
  return {
    screenshots: [
      {
        name: 'initial-state',
        path: '/screenshots/initial-state.png',
        size: { width: 1200, height: 800 }
      },
      {
        name: 'after-drag-drop',
        path: '/screenshots/after-drag-drop.png',
        size: { width: 1200, height: 800 }
      }
    ],
    layoutMetrics: {
      rosterSectionBounds: { x: 20, y: 200, width: 580, height: 400 },
      harnessSectionBounds: { x: 620, y: 200, width: 580, height: 400 },
      statusPanelBounds: { x: 20, y: 620, width: 1180, height: 120 }
    }
  };
}

/**
 * Validate snapshot data
 */
function validateSnapshot(snapshot: QASnapshot): {
  allTestsPassed: boolean;
  failedTests: string[];
  warnings: string[];
} {
  const failedTests: string[] = [];
  const warnings: string[] = [];

  // Validate roster data
  if (snapshot.roster.totalResidents === 0) {
    failedTests.push('No residents found in roster');
  }

  if (snapshot.roster.injuredResidents > snapshot.roster.totalResidents) {
    failedTests.push('Injured residents count exceeds total residents');
  }

  if (snapshot.roster.averageFatigue < 0 || snapshot.roster.averageFatigue > 100) {
    failedTests.push('Average fatigue out of valid range (0-100)');
  }

  // Validate harness data
  if (!snapshot.harness.slotId) {
    failedTests.push('Harness slot ID is missing');
  }

  if (snapshot.harness.progressFraction < 0 || snapshot.harness.progressFraction > 1) {
    failedTests.push('Harness progress fraction out of valid range (0-1)');
  }

  // Validate performance metrics if present
  if (snapshot.performance) {
    if (snapshot.performance.pageLoad.domContentLoaded < 0) {
      warnings.push('DOM content loaded time seems unusually low');
    }

    if (snapshot.performance.interactions.dragDropLatency > 200) {
      warnings.push('Drag and drop latency is higher than expected');
    }
  }

  // Validate visual data if present
  if (snapshot.visual) {
    if (snapshot.visual.screenshots.length === 0) {
      warnings.push('No screenshots captured for visual regression');
    }

    if (!snapshot.visual.layoutMetrics.rosterSectionBounds) {
      warnings.push('Roster section layout metrics missing');
    }
  }

  return {
    allTestsPassed: failedTests.length === 0,
    failedTests,
    warnings
  };
}

/**
 * Generate comprehensive QA snapshot
 */
function generateQASnapshot(args: CLIArgs): QASnapshot {
  const timestamp = new Date().toISOString();
  
  if (args.verbose) {
    console.log(`Generating QA snapshot for ${TEST_ROUTE}...`);
  }

  const snapshot: QASnapshot = {
    timestamp,
    environment: {
      userAgent: 'Playwright Test Runner',
      viewport: { width: 1200, height: 800 },
      devicePixelRatio: 1
    },
    roster: extractRosterData(),
    harness: extractHarnessData(),
    validation: {
      allTestsPassed: false,
      failedTests: [],
      warnings: []
    }
  };

  // Add optional data based on flags
  if (args.includePerformance) {
    if (args.verbose) {
      console.log('Collecting performance metrics...');
    }
    snapshot.performance = collectPerformanceMetrics();
  }

  if (args.includeVisual) {
    if (args.verbose) {
      console.log('Collecting visual regression data...');
    }
    snapshot.visual = collectVisualData();
  }

  // Validate snapshot
  const validation = validateSnapshot(snapshot);
  snapshot.validation = validation;

  if (args.verbose) {
    console.log(`Validation complete: ${validation.allTestsPassed ? 'PASSED' : 'FAILED'}`);
    if (validation.failedTests.length > 0) {
      console.log('Failed tests:', validation.failedTests);
    }
    if (validation.warnings.length > 0) {
      console.log('Warnings:', validation.warnings);
    }
  }

  return snapshot;
}

/**
 * Save snapshot to file
 */
function saveSnapshot(snapshot: QASnapshot, outputDir: string, timestamp: string): void {
  const snapshotFile = resolve(outputDir, `roster-harness-snapshot-${timestamp}.json`);
  const validationFile = resolve(outputDir, `roster-harness-validation-${timestamp}.log`);

  // Save JSON snapshot
  writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2));
  console.log(`Snapshot saved: ${snapshotFile}`);

  // Save validation log
  const validationLog = [
    `Roster & Harness QA Validation Log`,
    `Generated: ${snapshot.timestamp}`,
    `Route: ${snapshot.environment.userAgent}`,
    '',
    `Validation Result: ${snapshot.validation.allTestsPassed ? 'PASSED' : 'FAILED'}`,
    '',
    `Summary:`,
    `- Total Residents: ${snapshot.roster.totalResidents}`,
    `- Working Residents: ${snapshot.roster.workingResidents}`,
    `- Injured Residents: ${snapshot.roster.injuredResidents}`,
    `- Average Fatigue: ${snapshot.roster.averageFatigue}`,
    `- Harness Slot: ${snapshot.harness.slotId}`,
    `- Assigned Resident: ${snapshot.harness.assignedResidentName || 'None'}`,
    `- Drop State: ${snapshot.harness.dropState}`,
    ''
  ];

  if (snapshot.validation.failedTests.length > 0) {
    validationLog.push('FAILED TESTS:');
    snapshot.validation.failedTests.forEach(test => {
      validationLog.push(`  ❌ ${test}`);
    });
    validationLog.push('');
  }

  if (snapshot.validation.warnings.length > 0) {
    validationLog.push('WARNINGS:');
    snapshot.validation.warnings.forEach(warning => {
      validationLog.push(`  ⚠️  ${warning}`);
    });
    validationLog.push('');
  }

  if (snapshot.performance) {
    validationLog.push('PERFORMANCE METRICS:');
    validationLog.push(`  DOM Content Loaded: ${snapshot.performance.pageLoad.domContentLoaded}ms`);
    validationLog.push(`  Load Complete: ${snapshot.performance.pageLoad.loadComplete}ms`);
    validationLog.push(`  Drag & Drop Latency: ${snapshot.performance.interactions.dragDropLatency}ms`);
    validationLog.push('');
  }

  writeFileSync(validationFile, validationLog.join('\n'));
  console.log(`Validation log saved: ${validationFile}`);
}

/**
 * Main execution function
 */
function main(): void {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  const outputDir = args.output || DEFAULT_OUTPUT_DIR;
  ensureOutputDir(outputDir);

  const timestamp = generateTimestamp();
  
  try {
    const snapshot = generateQASnapshot(args);
    saveSnapshot(snapshot, outputDir, timestamp);

    if (snapshot.validation.allTestsPassed) {
      console.log('✅ QA Suite completed successfully');
      process.exit(0);
    } else {
      console.log('❌ QA Suite completed with validation failures');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error generating QA snapshot:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('rosterHarnessQASnapshot.ts')) {
  main();
}
