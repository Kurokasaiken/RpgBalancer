#!/usr/bin/env tsx

/**
 * Stress Testing Configuration Migration Tool
 * 
 * Migrates legacy stress testing JSON files to the new Zod schema format
 * with validation, diff reporting, and backup functionality.
 */

import { Command } from 'commander';
import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { dirname, join, basename, extname } from 'path';
import { z } from 'zod';
import { StressTestingConfigSchema, type StressTestingConfig } from '../../src/balancing/config/stressTesting/schema';

/**
 * Legacy configuration schemas for detection and migration
 */
const LegacyConfigV1Schema = z.object({
  simulationCount: z.number().optional(),
  seed: z.number().optional(),
  opThreshold: z.number().optional(),
  weakThreshold: z.number().optional(),
  pointsPerWeight: z.number().optional(),
  includePairs: z.boolean().optional(),
  excludeDerived: z.boolean().optional(),
  minWeight: z.number().optional(),
  maxPairs: z.number().optional(),
  incompatiblePairs: z.array(z.tuple([z.string(), z.string()])).optional(),
});

const LegacyConfigV0Schema = z.object({
  iterations: z.number().optional(),
  randomSeed: z.number().optional(),
  synergyThreshold: z.number().optional(),
  statPairs: z.array(z.any()).optional(),
});

type LegacyConfigV1 = z.infer<typeof LegacyConfigV1Schema>;
type LegacyConfigV0 = z.infer<typeof LegacyConfigV0Schema>;

/**
 * Migration result interface
 */
interface MigrationResult {
  success: boolean;
  inputFile: string;
  outputFile: string;
  backupFile?: string;
  version: string;
  changes: string[];
  errors: string[];
  warnings: string[];
}

/**
 * Detect legacy configuration version
 */
function detectLegacyVersion(data: unknown): 'v1' | 'v0' | 'unknown' {
  try {
    const parsed = LegacyConfigV1Schema.safeParse(data);
    if (parsed.success) {
      // Check for v1 specific fields
      if ('simulationCount' in parsed.data || 'opThreshold' in parsed.data) {
        return 'v1';
      }
    }
  } catch {
    // Continue to v0 detection
  }

  try {
    const parsed = LegacyConfigV0Schema.safeParse(data);
    if (parsed.success) {
      return 'v0';
    }
  } catch {
    // Unknown format
  }

  return 'unknown';
}

/**
 * Migrate v1 legacy configuration to new schema
 */
function migrateV1ToCurrent(legacy: LegacyConfigV1): StressTestingConfig {
  return {
    version: '1.0.0',
    thresholds: {
      opThreshold: legacy.opThreshold ?? 1.15,
      weakThreshold: legacy.weakThreshold ?? 0.95,
    },
    simulation: {
      simulationCount: legacy.simulationCount ?? 1000,
      concurrencyLimit: 10, // Default for v1 migrations
      seed: legacy.seed ?? 12345,
    },
    export: {
      enableJson: true,
      enableCsv: true,
      enableMarkdown: false,
      exportPath: './stress-test-results',
    },
    archetype: {
      pointsPerWeight: legacy.pointsPerWeight ?? 25,
      defaultSeed: legacy.seed ?? 12345,
      includePairs: legacy.includePairs ?? true,
      excludeDerived: legacy.excludeDerived ?? true,
      minWeight: legacy.minWeight ?? 0.5,
      maxPairs: legacy.maxPairs,
    },
    incompatiblePairs: legacy.incompatiblePairs ?? [],
    enablePersistence: true,
    enableTelemetry: true,
  };
}

/**
 * Migrate v0 legacy configuration to new schema
 */
function migrateV0ToCurrent(legacy: LegacyConfigV0): StressTestingConfig {
  return {
    version: '1.0.0',
    thresholds: {
      opThreshold: 1.15, // Default for v0 migrations
      weakThreshold: 0.95,
    },
    simulation: {
      simulationCount: legacy.iterations ?? 1000,
      concurrencyLimit: 10, // Default for v0 migrations
      seed: legacy.randomSeed ?? 12345,
    },
    export: {
      enableJson: true,
      enableCsv: true,
      enableMarkdown: false,
      exportPath: './stress-test-results',
    },
    archetype: {
      pointsPerWeight: 25, // Default for v0 migrations
      defaultSeed: legacy.randomSeed ?? 12345,
      includePairs: true,
      excludeDerived: true,
      minWeight: 0.5,
      maxPairs: undefined,
    },
    incompatiblePairs: [], // v0 didn't have incompatible pairs
    enablePersistence: true,
    enableTelemetry: true,
  };
}

/**
 * Generate migration diff report
 */
function generateDiff(legacy: unknown, current: StressTestingConfig, version: string): string[] {
  const changes: string[] = [];
  
  changes.push(`=== Migration Report: Legacy ${version} → Current 1.0.0 ===`);
  changes.push(`Timestamp: ${new Date().toISOString()}`);
  changes.push('');

  // Add structure changes
  if (version === 'v0') {
    changes.push('Structure Changes:');
    changes.push('- Added nested configuration structure (thresholds, simulation, export, archetype)');
    changes.push('- Added version field for migration tracking');
    changes.push('- Added enablePersistence and enableTelemetry flags');
    changes.push('- Renamed iterations → simulationCount');
    changes.push('- Renamed randomSeed → seed');
  } else if (version === 'v1') {
    changes.push('Structure Changes:');
    changes.push('- Added nested export configuration');
    changes.push('- Added version field for migration tracking');
    changes.push('- Added enablePersistence and enableTelemetry flags');
  }

  changes.push('');
  changes.push('Default Values Applied:');
  changes.push('- concurrencyLimit: 10 (default for migrations)');
  changes.push('- enableJson: true');
  changes.push('- enableCsv: true');
  changes.push('- enableMarkdown: false');
  changes.push('- exportPath: "./stress-test-results"');
  changes.push('- enablePersistence: true');
  changes.push('- enableTelemetry: true');

  if (version === 'v0') {
    changes.push('- opThreshold: 1.15 (default for v0)');
    changes.push('- weakThreshold: 0.95 (default for v0)');
    changes.push('- pointsPerWeight: 25 (default for v0)');
    changes.push('- includePairs: true (default for v0)');
    changes.push('- excludeDerived: true (default for v0)');
    changes.push('- minWeight: 0.5 (default for v0)');
  }

  return changes;
}

/**
 * Create backup of original file
 */
async function createBackup(filePath: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = join(dirname(filePath), 'backups');
  const backupFile = join(backupDir, `${basename(filePath, extname(filePath))}.${timestamp}${extname(filePath)}`);

  // Create backup directory if it doesn't exist
  await mkdir(backupDir, { recursive: true });

  // Copy original file to backup location
  const originalContent = await readFile(filePath, 'utf-8');
  await writeFile(backupFile, originalContent, 'utf-8');

  return backupFile;
}

/**
 * Migrate a single configuration file
 */
async function migrateFile(
  inputPath: string,
  outputPath?: string,
  options: { backup?: boolean; dryRun?: boolean } = {}
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    inputFile: inputPath,
    outputFile: outputPath || inputPath,
    changes: [],
    errors: [],
    warnings: [],
    version: 'unknown',
  };

  try {
    // Read input file
    const content = await readFile(inputPath, 'utf-8');
    const data = JSON.parse(content);

    // Detect legacy version
    result.version = detectLegacyVersion(data);
    
    if (result.version === 'unknown') {
      result.errors.push('Unable to detect legacy configuration version');
      return result;
    }

    // Create backup if requested
    if (options.backup && !options.dryRun) {
      result.backupFile = await createBackup(inputPath);
      result.changes.push(`Backup created: ${result.backupFile}`);
    }

    // Migrate to current schema
    let migratedConfig: StressTestingConfig;
    if (result.version === 'v1') {
      const legacy = LegacyConfigV1Schema.parse(data);
      migratedConfig = migrateV1ToCurrent(legacy);
    } else if (result.version === 'v0') {
      const legacy = LegacyConfigV0Schema.parse(data);
      migratedConfig = migrateV0ToCurrent(legacy);
    } else {
      result.errors.push(`Unsupported legacy version: ${result.version}`);
      return result;
    }

    // Validate migrated configuration
    const validation = StressTestingConfigSchema.safeParse(migratedConfig);
    if (!validation.success) {
      result.errors.push(`Validation failed: ${validation.error.message}`);
      return result;
    }

    // Generate diff report
    result.changes.push(...generateDiff(data, validation.data, result.version));

    // Write migrated configuration
    if (!options.dryRun) {
      await mkdir(dirname(result.outputFile), { recursive: true });
      await writeFile(result.outputFile, JSON.stringify(validation.data, null, 2), 'utf-8');
      result.changes.push(`Migrated configuration written to: ${result.outputFile}`);
    } else {
      result.changes.push(`[DRY RUN] Would write migrated configuration to: ${result.outputFile}`);
    }

    result.success = true;
    result.changes.push('Migration completed successfully');

  } catch (error) {
    result.errors.push(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
}

/**
 * Find all legacy configuration files in directory
 */
async function findLegacyConfigs(dir: string): Promise<string[]> {
  const legacyFiles: string[] = [];
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        const filePath = join(dir, entry.name);
        const content = await readFile(filePath, 'utf-8');
        
        try {
          const data = JSON.parse(content);
          const version = detectLegacyVersion(data);
          
          if (version !== 'unknown') {
            legacyFiles.push(filePath);
          }
        } catch {
          // Skip invalid JSON files
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error);
  }
  
  return legacyFiles;
}

/**
 * Migrate all legacy configurations in directory
 */
async function migrateDirectory(
  inputDir: string,
  outputDir?: string,
  options: { backup?: boolean; dryRun?: boolean } = {}
): Promise<MigrationResult[]> {
  const legacyFiles = await findLegacyConfigs(inputDir);
  const results: MigrationResult[] = [];

  console.log(`Found ${legacyFiles.length} legacy configuration files in ${inputDir}`);

  for (const filePath of legacyFiles) {
    const outputPath = outputDir 
      ? join(outputDir, basename(filePath))
      : filePath;

    const result = await migrateFile(filePath, outputPath, options);
    results.push(result);

    // Print result summary
    if (result.success) {
      console.log(`✅ ${basename(filePath)} (${result.version})`);
      if (result.backupFile) {
        console.log(`   Backup: ${result.backupFile}`);
      }
    } else {
      console.log(`❌ ${basename(filePath)}: ${result.errors.join(', ')}`);
    }
  }

  return results;
}

/**
 * Main CLI program
 */
async function main() {
  const program = new Command();

  program
    .name('migrate-config')
    .description('Migrate legacy stress testing configurations to new schema')
    .version('1.0.0');

  program
    .command('file')
    .description('Migrate a single configuration file')
    .argument('<input>', 'Input configuration file path')
    .argument('[output]', 'Output configuration file path (default: overwrite input)')
    .option('-b, --backup', 'Create backup of original file', false)
    .option('-d, --dry-run', 'Show what would be migrated without making changes', false)
    .action(async (input, output, options) => {
      const result = await migrateFile(input, output, options);
      
      console.log('\n=== Migration Result ===');
      console.log(`File: ${result.inputFile}`);
      console.log(`Version: ${result.version}`);
      console.log(`Success: ${result.success}`);
      
      if (result.backupFile) {
        console.log(`Backup: ${result.backupFile}`);
      }

      if (result.changes.length > 0) {
        console.log('\nChanges:');
        result.changes.forEach(change => console.log(`  ${change}`));
      }

      if (result.warnings.length > 0) {
        console.log('\nWarnings:');
        result.warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
      }

      if (result.errors.length > 0) {
        console.log('\nErrors:');
        result.errors.forEach(error => console.log(`  ❌ ${error}`));
        process.exit(1);
      }
    });

  program
    .command('directory')
    .description('Migrate all legacy configurations in a directory')
    .argument('<input-dir>', 'Directory containing legacy configuration files')
    .argument('[output-dir]', 'Output directory for migrated files (default: overwrite input)')
    .option('-b, --backup', 'Create backup of original files', false)
    .option('-d, --dry-run', 'Show what would be migrated without making changes', false)
    .action(async (inputDir, outputDir, options) => {
      const results = await migrateDirectory(inputDir, outputDir, options);
      
      console.log('\n=== Migration Summary ===');
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      console.log(`Total files: ${results.length}`);
      console.log(`Successful: ${successful}`);
      console.log(`Failed: ${failed}`);

      if (failed > 0) {
        console.log('\nFailed migrations:');
        results.filter(r => !r.success).forEach(result => {
          console.log(`  ❌ ${basename(result.inputFile)}: ${result.errors.join(', ')}`);
        });
        process.exit(1);
      }
    });

  program
    .command('scan')
    .description('Scan directory for legacy configuration files')
    .argument('<dir>', 'Directory to scan')
    .action(async (dir) => {
      const legacyFiles = await findLegacyConfigs(dir);
      
      console.log(`\n=== Legacy Configuration Files ===`);
      console.log(`Directory: ${dir}`);
      console.log(`Found: ${legacyFiles.length} files`);
      
      if (legacyFiles.length > 0) {
        console.log('\nFiles:');
        for (const filePath of legacyFiles) {
          const content = await readFile(filePath, 'utf-8');
          const data = JSON.parse(content);
          const version = detectLegacyVersion(data);
          console.log(`  ${basename(filePath)} (${version})`);
        }
      }
    });

  await program.parseAsync();
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}
