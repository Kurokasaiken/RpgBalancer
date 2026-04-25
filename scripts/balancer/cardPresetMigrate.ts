#!/usr/bin/env node

/**
 * Config Balancer Card Preset Migrator CLI
 *
 * Command-line interface for migrating legacy card presets (pre Phase 10)
 * to the current BalancerPreset schema with dry-run, diff, and batch processing.
 *
 * @module cardPresetMigrate
 * @since 2026-01-13
 * @author Cascade
 */

import { Command } from 'commander';
import { PresetMigrator, type PresetMigrationResult } from '../src/balancing/config/presetMigration';
import { writeFileSync } from 'fs';
import { join } from 'path';

const program = new Command();

program
  .name('card-preset-migrate')
  .description('Migrate legacy card presets to current schema')
  .version('1.0.0');

program
  .command('migrate <inputFile>')
  .description('Migrate a single preset file')
  .option('-o, --output <file>', 'Output file path')
  .option('--no-backup', 'Skip automatic backup creation')
  .option('-d, --dry-run', 'Preview migration without saving')
  .option('-f, --force', 'Force migration even if already current version')
  .option('-v, --verbose', 'Verbose output')
  .action(async (inputFile: string, options: any) => {
    try {
      console.log(`🔄 Migrating preset: ${inputFile}`);

      const result = await PresetMigrator.migrate(inputFile, options.output, {
        createBackup: options.backup,
        dryRun: options.dryRun,
        force: options.force,
      });

      displayMigrationResult(result, options.verbose);

      if (!result.success) {
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Migration failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('batch-migrate')
  .description('Migrate multiple preset files')
  .option('-i, --input-dir <dir>', 'Input directory (defaults to legacy presets)', 'data/presets/balancer/legacy')
  .option('-o, --output-dir <dir>', 'Output directory')
  .option('--no-backup', 'Skip automatic backup creation')
  .option('-d, --dry-run', 'Preview migration without saving')
  .option('-p, --parallel', 'Process files in parallel')
  .option('-v, --verbose', 'Verbose output')
  .option('-r, --report <file>', 'Generate migration report')
  .action(async (options: any) => {
    try {
      console.log(`🔄 Starting batch migration from: ${options.inputDir}`);

      // Get list of files to migrate
      const inputFiles = await PresetMigrator.getLegacyPresetFiles();
      if (inputFiles.length === 0) {
        console.log('ℹ️  No legacy preset files found');
        return;
      }

      console.log(`📁 Found ${inputFiles.length} preset files to migrate`);

      const results = await PresetMigrator.batchMigrate(inputFiles, {
        outputDir: options.outputDir,
        createBackup: options.backup,
        dryRun: options.dryRun,
        parallel: options.parallel,
      });

      // Display results
      const successful = results.filter(r => r.success).length;
      const failed = results.length - successful;

      console.log(`\n📊 Batch Migration Complete:`);
      console.log(`✅ Successful: ${successful}`);
      console.log(`❌ Failed: ${failed}`);
      console.log(`📈 Success Rate: ${((successful / results.length) * 100).toFixed(1)}%`);

      if (options.verbose) {
        console.log('\n📋 Detailed Results:');
        results.forEach((result, index) => {
          const status = result.success ? '✅' : '❌';
          console.log(`${index + 1}. ${status} ${result.presetName} (${result.duration}ms)`);

          if (result.errors.length > 0) {
            result.errors.forEach(error => console.log(`   ⚠️  ${error}`));
          }
        });
      }

      // Generate report if requested
      if (options.report) {
        const report = PresetMigrator.generateReport(results);
        writeFileSync(options.report, report);
        console.log(`📄 Report saved to: ${options.report}`);
      }

      if (failed > 0) {
        console.log('\n⚠️  Some migrations failed. Check individual results above.');
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Batch migration failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('diff <inputFile>')
  .description('Show detailed diff of migration changes')
  .option('-v, --verbose', 'Show full diff details')
  .action(async (inputFile: string, options: any) => {
    try {
      console.log(`🔍 Analyzing migration diff for: ${inputFile}`);

      // Perform dry-run migration to get changes
      const result = await PresetMigrator.migrate(inputFile, undefined, {
        createBackup: false,
        dryRun: true,
      });

      if (!result.success) {
        console.error('❌ Failed to analyze file:', result.errors.join(', '));
        process.exit(1);
      }

      console.log(`📋 Migration Analysis for: ${result.presetName}`);
      console.log(`📊 Version: ${result.sourceVersion} → ${result.targetVersion}`);
      console.log(`🔄 Changes: ${result.changes.length}`);

      if (result.changes.length === 0) {
        console.log('✅ No changes needed - preset is already current');
        return;
      }

      console.log('\n📝 Detailed Changes:');
      result.changes.forEach((change, index) => {
        const icon = change.type === 'added' ? '➕' : change.type === 'modified' ? '🔄' : '➖';
        console.log(`${index + 1}. ${icon} ${change.property}`);
        console.log(`   ${change.description}`);

        if (options.verbose && change.oldValue !== undefined) {
          console.log(`   Old: ${JSON.stringify(change.oldValue)}`);
        }
        if (options.verbose && change.newValue !== undefined) {
          console.log(`   New: ${JSON.stringify(change.newValue)}`);
        }
      });

    } catch (error) {
      console.error('❌ Diff analysis failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('rollback <backupFile> <targetFile>')
  .description('Rollback a preset to its backup version')
  .action(async (backupFile: string, targetFile: string) => {
    try {
      console.log(`🔄 Rolling back preset from backup: ${backupFile}`);

      const result = await PresetMigrator.rollback(backupFile, targetFile);

      if (result.success) {
        console.log(`✅ Successfully rolled back to: ${targetFile}`);
      } else {
        console.error('❌ Rollback failed:', result.error);
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Rollback failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('validate <inputFile>')
  .description('Validate a preset file format')
  .action(async (inputFile: string) => {
    try {
      console.log(`🔍 Validating preset: ${inputFile}`);

      const data = await import(join(process.cwd(), inputFile));
      const version = PresetMigrator.detectVersion(data);
      const validation = PresetMigrator.validatePreset(data);

      console.log(`📊 Version detected: ${version}`);
      console.log(`✅ Valid: ${validation.valid}`);

      if (!validation.valid) {
        console.log('❌ Errors:');
        validation.errors.forEach(error => console.log(`   - ${error}`));
        process.exit(1);
      } else {
        console.log('🎉 Preset is valid!');
      }

    } catch (error) {
      console.error('❌ Validation failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('list-legacy')
  .description('List all legacy preset files available for migration')
  .action(async () => {
    try {
      const files = await PresetMigrator.getLegacyPresetFiles();

      if (files.length === 0) {
        console.log('📁 No legacy preset files found');
        return;
      }

      console.log(`📁 Found ${files.length} legacy preset files:`);
      files.forEach((file, index) => {
        console.log(`${index + 1}. ${file}`);
      });

    } catch (error) {
      console.error('❌ Failed to list legacy files:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Error handling
program.on('command:*', (unknownCommand) => {
  console.error(`❌ Unknown command: ${unknownCommand[0]}`);
  console.log('Run with --help to see available commands');
  process.exit(1);
});

// Parse arguments
program.parse();

/**
 * Display migration result in a formatted way
 */
function displayMigrationResult(result: PresetMigrationResult, verbose: boolean = false): void {
  const status = result.success ? '✅ Success' : '❌ Failed';
  console.log(`\n📊 Migration Result: ${status}`);

  if (result.success) {
    console.log(`📋 Preset: ${result.presetName} (${result.presetId})`);
    console.log(`📈 Version: ${result.sourceVersion} → ${result.targetVersion}`);
    console.log(`⏱️  Duration: ${result.duration}ms`);
    console.log(`📁 Output: ${result.outputFile}`);

    if (result.backupFile) {
      console.log(`💾 Backup: ${result.backupFile}`);
    }

    if (verbose && result.changes.length > 0) {
      console.log(`\n📝 Changes (${result.changes.length}):`);
      result.changes.forEach((change, index) => {
        const icon = change.type === 'added' ? '➕' : change.type === 'modified' ? '🔄' : '➖';
        console.log(`  ${index + 1}. ${icon} ${change.property}: ${change.description}`);
      });
    }

    if (result.warnings.length > 0) {
      console.log(`\n⚠️  Warnings:`);
      result.warnings.forEach(warning => console.log(`  • ${warning}`));
    }
  } else {
    console.log('❌ Errors:');
    result.errors.forEach(error => console.log(`  • ${error}`));
  }

  if (result.warnings.length > 0 && !result.success) {
    console.log('⚠️  Warnings:');
    result.warnings.forEach(warning => console.log(`  • ${warning}`));
  }
}
