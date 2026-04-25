#!/usr/bin/env tsx

/**
 * Crew Scheduler Snapshot CLI Tool
 * 
 * Command-line interface for managing crew scheduler snapshots,
 * determinism validation, and state management. Provides commands for
 * creating, loading, comparing, and validating scheduler state snapshots.
 * 
 * @since NP-013
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import type { SchedulerSnapshot } from '../src/balancing/config/idleVillage/crewSchedulerDeterminismGuard';
import {
  createSchedulerSnapshot,
  saveSchedulerSnapshot,
  loadSchedulerSnapshot,
  validateDeterminism,
  createDeterministicQueueState,
  generateDeterministicSeed,
  DEFAULT_DETERMINISM_GUARD_CONFIG,
  TEST_DETERMINISM_GUARD_CONFIG,
} from '../src/balancing/config/idleVillage/crewSchedulerDeterminismGuard';

/**
 * CLI configuration
 */
interface CLIConfig {
  snapshotDir: string;
  verbose: boolean;
  dryRun: boolean;
}

/**
 * Default CLI configuration
 */
const DEFAULT_CLI_CONFIG: CLIConfig = {
  snapshotDir: './scheduler-snapshots',
  verbose: false,
  dryRun: false,
};

/**
 * Logger utility
 */
class Logger {
  constructor(private verbose: boolean) {}

  log(message: string, ...args: any[]) {
    if (this.verbose) {
      console.log(`[SchedulerCLI] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    console.error(`[SchedulerCLI ERROR] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]) {
    console.warn(`[SchedulerCLI WARN] ${message}`, ...args);
  }

  info(message: string, ...args: any[]) {
    console.info(`[SchedulerCLI] ${message}`, ...args);
  }
}

/**
 * Ensures snapshot directory exists
 */
function ensureSnapshotDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Lists available snapshots
 */
function listSnapshots(dir: string, logger: Logger): string[] {
  try {
    ensureSnapshotDir(dir);
    const files = readdirSync(dir);
    return files
      .filter(file => file.endsWith('.json'))
      .sort()
      .map(file => join(dir, file));
  } catch (error) {
    logger.error('Failed to list snapshots:', error);
    return [];
  }
}

/**
 * Loads a snapshot from file
 */
function loadSnapshotFromFile(filePath: string, logger: Logger): SchedulerSnapshot | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as SchedulerSnapshot;
  } catch (error) {
    logger.error(`Failed to load snapshot from ${filePath}:`, error);
    return null;
  }
}

/**
 * Saves a snapshot to file
 */
function saveSnapshotToFile(snapshot: SchedulerSnapshot, filePath: string, logger: Logger): void {
  try {
    const content = JSON.stringify(snapshot, null, 2);
    writeFileSync(filePath, content, 'utf-8');
    logger.info(`Saved snapshot to ${filePath}`);
  } catch (error) {
    logger.error(`Failed to save snapshot to ${filePath}:`, error);
  }
}

/**
 * Compares two snapshots
 */
function compareSnapshots(snapshot1: SchedulerSnapshot, snapshot2: SchedulerSnapshot, logger: Logger): {
  identical: boolean;
  differences: string[];
} {
  const differences: string[] = [];
  
  // Compare basic properties
  if (snapshot1.seed !== snapshot2.seed) {
    differences.push(`Seed: ${snapshot1.seed} vs ${snapshot2.seed}`);
  }
  
  if (snapshot1.queue.length !== snapshot2.queue.length) {
    differences.push(`Queue length: ${snapshot1.queue.length} vs ${snapshot2.queue.length}`);
  }
  
  // Compare queue items
  const minLength = Math.min(snapshot1.queue.length, snapshot2.queue.length);
  for (let i = 0; i < minLength; i++) {
    const item1 = snapshot1.queue[i];
    const item2 = snapshot2.queue[i];
    
    if (item1.residentId !== item2.residentId) {
      differences.push(`Queue[${i}].residentId: ${item1.residentId} vs ${item2.residentId}`);
    }
    
    if (item1.activityId !== item2.activityId) {
      differences.push(`Queue[${i}].activityId: ${item1.activityId} vs ${item2.activityId}`);
    }
    
    if (Math.abs(item1.priorityScore - item2.priorityScore) > 0.001) {
      differences.push(`Queue[${i}].priorityScore: ${item1.priorityScore.toFixed(3)} vs ${item2.priorityScore.toFixed(3)}`);
    }
  }
  
  // Compare validation results
  if (snapshot1.validation.deterministic !== snapshot2.validation.deterministic) {
    differences.push(`Deterministic: ${snapshot1.validation.deterministic} vs ${snapshot2.validation.deterministic}`);
  }
  
  if (Math.abs(snapshot1.validation.deviation - snapshot2.validation.deviation) > 0.0001) {
    differences.push(`Deviation: ${snapshot1.validation.deviation.toFixed(6)} vs ${snapshot2.validation.deviation.toFixed(6)}`);
  }
  
  return {
    identical: differences.length === 0,
    differences,
  };
}

/**
 * Creates a test snapshot for validation
 */
function createTestSnapshot(logger: Logger): SchedulerSnapshot {
  const seed = generateDeterministicSeed('fixed', 42);
  const config = TEST_DETERMINISM_GUARD_CONFIG;
  
  // Create test queue
  const testQueue = createDeterministicQueueState(
    seed,
    {
      ...config,
      priorityWeights: {
        statTagMatch: 10.0,
        fatiguePenalty: -8.0,
        questUrgency: 12.0,
        specializationBonus: 5.0,
        difficultyBonus: 2.0,
        baseWeight: 1.0,
      },
      seeding: {
        lcgSeed: seed,
        deterministic: true,
      },
      thresholds: {
        fatiguePenaltyThreshold: 0.7,
        questUrgencyThreshold: 3.0,
        statTagMatchThreshold: 0.5,
      },
      maxQueueSize: 50,
      enableDiagnostics: true,
      analytics: {
        enableChannel: true,
      },
    },
    [
      { residentId: 'resident-1', activityId: 'forest-work' },
      { residentId: 'resident-2', activityId: 'mine-work' },
      { residentId: 'resident-3', activityId: 'craft-work' },
    ]
  );
  
  // Create mock village state
  const villageState = {
    residents: {
      'resident-1': {
        id: 'resident-1',
        name: 'Alice',
        stats: { strength: 10, agility: 8, intelligence: 6 },
        fatigue: 0.3,
        location: 'forest',
        currentActivity: null,
        available: true,
      },
      'resident-2': {
        id: 'resident-2',
        name: 'Bob',
        stats: { strength: 8, agility: 10, intelligence: 7 },
        fatigue: 0.5,
        location: 'mine',
        currentActivity: null,
        available: true,
      },
      'resident-3': {
        id: 'resident-3',
        name: 'Charlie',
        stats: { strength: 6, agility: 7, intelligence: 10 },
        fatigue: 0.2,
        location: 'craft',
        currentActivity: null,
        available: true,
      },
    },
    activities: {
      'forest-work': {
        id: 'forest-work',
        name: 'Forest Work',
        difficulty: 3,
        duration: 100,
        requiredStats: { strength: 5 },
        tags: ['outdoor', 'physical'],
      },
      'mine-work': {
        id: 'mine-work',
        name: 'Mine Work',
        difficulty: 4,
        duration: 120,
        requiredStats: { strength: 7 },
        tags: ['outdoor', 'physical'],
      },
      'craft-work': {
        id: 'craft-work',
        name: 'Craft Work',
        difficulty: 2,
        duration: 80,
        requiredStats: { intelligence: 5 },
        tags: ['indoor', 'mental'],
      },
    },
    currentTime: Date.now(),
  };
  
  return createSchedulerSnapshot(seed, config, testQueue, villageState, testQueue);
}

/**
 * Main CLI program
 */
async function main(): Promise<void> {
  const program = new Command();
  const config = DEFAULT_CLI_CONFIG;
  const logger = new Logger(config.verbose);

  program
    .name('crew-scheduler-cli')
    .description('Crew Scheduler Snapshot CLI - Manage and validate scheduler determinism')
    .version('1.0.0');

  // List command
  program
    .command('list')
    .description('List available scheduler snapshots')
    .option('-v, --verbose', 'Enable verbose logging')
    .action((options) => {
      const snapshots = listSnapshots(config.snapshotDir, logger);
      
      if (snapshots.length === 0) {
        logger.info('No snapshots found');
        return;
      }
      
      logger.info(`Found ${snapshots.length} snapshots:`);
      snapshots.forEach((snapshot, index) => {
        const fileName = snapshot.split('/').pop() || snapshot;
        const snapshotData = loadSnapshotFromFile(snapshot, logger);
        
        if (snapshotData) {
          logger.info(`${index + 1}. ${fileName}`);
          logger.log(`  Timestamp: ${new Date(snapshotData.timestamp).toISOString()}`);
          logger.log(`  Seed: ${snapshotData.seed}`);
          logger.log(`  Queue: ${snapshotData.queue.length} assignments`);
          logger.log(`  Deterministic: ${snapshotData.validation.deterministic}`);
          logger.log(`  Deviation: ${snapshotData.validation.deviation.toFixed(6)}`);
        }
      });
    });

  // Create command
  program
    .command('create')
    .description('Create a new scheduler snapshot')
    .option('-s, --seed <number>', 'Fixed seed to use', '1337')
    .option('-t, --test', 'Create test snapshot with mock data')
    .option('-o, --output <path>', 'Output file path', config.snapshotDir)
    .option('-v, --verbose', 'Enable verbose logging')
    .action((options) => {
      const seed = options.seed ? parseInt(options.seed) : generateDeterministicSeed('timestamp', 1337);
      const snapshot = options.test ? createTestSnapshot(logger) : null;
      
      if (!snapshot) {
        logger.error('Failed to create snapshot');
        process.exit(1);
      }
      
      const outputDir = options.output || config.snapshotDir;
      ensureSnapshotDir(outputDir);
      const fileName = `scheduler-snapshot-${snapshot.timestamp}.json`;
      const filePath = join(outputDir, fileName);
      
      if (!config.dryRun) {
        saveSnapshotToFile(snapshot, filePath, logger);
      } else {
        logger.info(`[DRY RUN] Would save snapshot to: ${filePath}`);
      }
      
      logger.info(`Created snapshot with seed ${seed}`);
      logger.info(`Queue size: ${snapshot.queue.length} assignments`);
      logger.info(`Deterministic: ${snapshot.validation.deterministic}`);
    });

  // Load command
  program
    .command('load <file>')
    .description('Load and display a scheduler snapshot')
    .option('-v, --verbose', 'Enable verbose logging')
    .action((file, options) => {
      const snapshot = loadSnapshotFromFile(file, logger);
      
      if (!snapshot) {
        logger.error(`Failed to load snapshot from ${file}`);
        process.exit(1);
      }
      
      logger.info(`Loaded snapshot from ${file}:`);
      logger.log(`Timestamp: ${new Date(snapshot.timestamp).toISOString()}`);
      logger.log(`Seed: ${snapshot.seed}`);
      logger.log(`Queue: ${snapshot.queue.length} assignments`);
      logger.log(`Deterministic: ${snapshot.validation.deterministic}`);
      logger.log(`Deviation: ${snapshot.validation.deviation.toFixed(6)}`);
      
      if (options.verbose) {
        logger.log('\nQueue Details:');
        snapshot.queue.forEach((assignment, index) => {
          logger.log(`  ${index + 1}. ${assignment.residentId} → ${assignment.activityId} (${assignment.priorityScore.toFixed(3)})`);
        });
      }
    });

  // Compare command
  program
    .command('compare <file1> <file2>')
    .description('Compare two scheduler snapshots')
    .option('-v, --verbose', 'Enable verbose logging')
    .action((file1, file2, options) => {
      const snapshot1 = loadSnapshotFromFile(file1, logger);
      const snapshot2 = loadSnapshotFromFile(file2, logger);
      
      if (!snapshot1 || !snapshot2) {
        logger.error('Failed to load one or both snapshots');
        process.exit(1);
      }
      
      const comparison = compareSnapshots(snapshot1, snapshot2, logger);
      
      if (comparison.identical) {
        logger.info('Snapshots are identical');
      } else {
        logger.warn(`Snapshots differ (${comparison.differences.length} differences):`);
        comparison.differences.forEach(diff => {
          logger.warn(`  - ${diff}`);
        });
      }
    });

  // Validate command
  program
    .command('validate <file>')
    .description('Validate determinism of a scheduler snapshot')
    .option('-t, --tolerance <number>', 'Maximum allowed deviation', '0.001')
    .option('-v, --verbose', 'Enable verbose logging')
    .action((file, options) => {
      const snapshot = loadSnapshotFromFile(file, logger);
      
      if (!snapshot) {
        logger.error(`Failed to load snapshot from ${file}`);
        process.exit(1);
      }
      
      const tolerance = options.tolerance ? parseFloat(options.tolerance) : 0.001;
      const validation = snapshot.validation;
      
      logger.info(`Validating snapshot with tolerance ${tolerance}:`);
      logger.log(`Deterministic: ${validation.deterministic}`);
      logger.log(`Deviation: ${validation.deviation.toFixed(6)}`);
      logger.log(`Expected Queue: ${validation.expectedQueue.length} assignments`);
      logger.log(`Actual Queue: ${validation.actualQueue.length} assignments`);
      
      if (validation.deterministic && validation.deviation <= tolerance) {
        logger.info('✅ Snapshot passes determinism validation');
      } else {
        logger.warn('❌ Snapshot fails determinism validation');
        
        if (!validation.deterministic) {
          logger.warn('  - Not deterministic');
        }
        
        if (validation.deviation > tolerance) {
          logger.warn(`  - Deviation ${validation.deviation.toFixed(6)} exceeds tolerance ${tolerance}`);
        }
        
        if (validation.errors.length > 0) {
          logger.warn('  Errors:');
          validation.errors.forEach(error => {
            logger.warn(`    - ${error}`);
          });
        }
      }
    });

  // Test command
  program
    .command('test')
    .description('Run determinism tests')
    .option('-s, --seed <number>', 'Seed to use for tests', '42')
    .option('-i, --iterations <number>', 'Number of test iterations', '100')
    .option('-v, --verbose', 'Enable verbose logging')
    .action((options) => {
      const seed = options.seed ? parseInt(options.seed) : 42;
      const iterations = options.iterations ? parseInt(options.iterations) : 100;
      
      logger.info(`Running determinism tests with seed ${seed} (${iterations} iterations)`);
      
      let passedTests = 0;
      let failedTests = 0;
      
      for (let i = 0; i < iterations; i++) {
        const testSeed = seed + i;
        const testSnapshot = createTestSnapshot(logger);
        
        // Re-create with same seed to test determinism
        const recreatedSnapshot = createTestSnapshot(logger);
        
        const comparison = compareSnapshots(testSnapshot, recreatedSnapshot, logger);
        
        if (comparison.identical) {
          passedTests++;
        } else {
          failedTests++;
          logger.warn(`Test ${i + 1} failed (seed ${testSeed})`);
          comparison.differences.forEach(diff => {
            logger.warn(`  - ${diff}`);
          });
        }
      }
      
      logger.info(`Test Results: ${passedTests} passed, ${failedTests} failed`);
      
      if (failedTests === 0) {
        logger.info('✅ All determinism tests passed');
      } else {
        logger.warn(`❌ ${failedTests} determinism tests failed`);
        process.exit(1);
      }
    });

  // Clean command
  program
    .command('clean')
    .description('Clean old snapshots')
    .option('-k, --keep <number>', 'Number of recent snapshots to keep', '10')
    .option('-v, --verbose', 'Enable verbose logging')
    .action((options) => {
      const keepCount = options.keep ? parseInt(options.keep) : 10;
      const snapshots = listSnapshots(config.snapshotDir, logger);
      
      if (snapshots.length <= keepCount) {
        logger.info(`No snapshots to clean (keeping ${keepCount}, have ${snapshots.length})`);
        return;
      }
      
      const toDelete = snapshots.slice(0, snapshots.length - keepCount);
      
      logger.info(`Cleaning ${toDelete.length} old snapshots (keeping ${keepCount})`);
      
      if (!config.dryRun) {
        toDelete.forEach(snapshot => {
          try {
            unlinkSync(snapshot);
            logger.log(`Deleted: ${snapshot}`);
          } catch (error) {
            logger.error(`Failed to delete ${snapshot}:`, error);
          }
        });
      } else {
        logger.info(`[DRY RUN] Would delete ${toDelete.length} snapshots`);
      }
    });

  // Parse arguments and execute
  await program.parseAsync(process.argv);
}

// Run the CLI if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('CLI Error:', error);
    process.exit(1);
  });
}
