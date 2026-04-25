#!/usr/bin/env tsx

/**
 * CLI Tool for Legacy Config Migration
 * 
 * Command-line interface for migrating legacy balancer configurations
 * to the new config-driven format with comprehensive options and reporting.
 */

import { Command } from 'commander';
import { readFile, writeFile, access, mkdir } from 'fs/promises';
import { join, dirname, extname, basename } from 'path';
import { glob } from 'glob';
import chalk from 'chalk';
import Table from 'cli-table3';
import { ConfigMigrator, type MigrationResult } from '@/balancing/config/migrations/configMigrator';

const program = new Command();

program
  .name('migrate-config')
  .description('CLI tool for migrating legacy balancer configurations')
  .version('1.0.0');

/**
 * Utility functions
 */
function logSuccess(message: string) {
  console.log(chalk.green('✅'), message);
}

function logError(message: string) {
  console.log(chalk.red('❌'), message);
}

function logWarning(message: string) {
  console.log(chalk.yellow('⚠️'), message);
}

function logInfo(message: string) {
  console.log(chalk.blue('ℹ️'), message);
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatChanges(changes: any[]): string {
  const byType = changes.reduce((acc, change) => {
    acc[change.type] = (acc[change.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(byType)
    .map(([type, count]) => `${type}: ${count}`)
    .join(', ');
}

/**
 * Display migration results in a formatted table
 */
function displayResults(results: MigrationResult[]) {
  if (results.length === 0) {
    logInfo('No files processed');
    return;
  }

  // Summary table
  const summaryTable = new Table({
    head: ['Metric', 'Count', 'Percentage'],
    colWidths: [20, 10, 15],
  });

  const total = results.length;
  const successful = results.filter(r => r.success).length;
  const failed = total - successful;

  summaryTable.push(
    ['Total Files', total.toString(), '100%'],
    [chalk.green('Successful'), successful.toString(), `${((successful / total) * 100).toFixed(1)}%`],
    [chalk.red('Failed'), failed.toString(), `${((failed / total) * 100).toFixed(1)}%`]
  );

  console.log('\n📊 Migration Summary:');
  console.log(summaryTable.toString());

  // Detailed results table
  if (results.length > 0) {
    const detailsTable = new Table({
      head: ['File', 'Status', 'Version', 'Changes', 'Duration'],
      colWidths: [30, 10, 15, 15, 10],
    });

    results.forEach((result, index) => {
      const status = result.success ? chalk.green('✅') : chalk.red('❌');
      const version = `${result.sourceVersion} → ${result.targetVersion}`;
      const changes = result.changes.length.toString();
      const duration = formatDuration(result.duration);

      detailsTable.push([
        basename(result.inputFile),
        status,
        version,
        changes,
        duration,
      ]);

      // Show errors/warnings for failed migrations
      if (!result.success && result.errors.length > 0) {
        detailsTable.push([
          '',
          chalk.red('Errors:'),
          '',
          '',
          '',
        ]);
        result.errors.forEach(error => {
          detailsTable.push([
            '',
            chalk.red(error),
            '',
            '',
            '',
          ]);
        });
      }
    });

    console.log('\n📋 Detailed Results:');
    console.log(detailsTable.toString());
  }
}

/**
 * Validate command
 */
program
  .command('validate')
  .description('Validate a configuration file against the current schema')
  .argument('<file>', 'Configuration file to validate')
  .option('-v, --verbose', 'Show detailed validation errors')
  .action(async (file, options) => {
    try {
      logInfo(`Validating configuration: ${file}`);
      
      // Check if file exists
      await access(file);
      
      // Read and validate
      const data = await readFile(file, 'utf-8');
      const config = JSON.parse(data);
      
      const validation = ConfigMigrator.validateConfig(config);
      
      if (validation.valid) {
        logSuccess('Configuration is valid!');
      } else {
        logError('Configuration validation failed:');
        if (options.verbose) {
          validation.errors.forEach(error => {
            console.log(chalk.red(`  - ${error}`));
          });
        } else {
          console.log(chalk.red(`  Found ${validation.errors.length} validation errors`));
          console.log(chalk.gray('  Use --verbose for detailed errors'));
        }
      }
    } catch (error) {
      logError(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

/**
 * Detect version command
 */
program
  .command('detect')
  .description('Detect the version of a legacy configuration')
  .argument('<file>', 'Configuration file to analyze')
  .action(async (file) => {
    try {
      logInfo(`Detecting version for: ${file}`);
      
      // Check if file exists
      await access(file);
      
      // Read and detect
      const data = await readFile(file, 'utf-8');
      const config = JSON.parse(data);
      
      const version = ConfigMigrator.detectVersion(config);
      
      if (version === 'unknown') {
        logWarning('Unable to detect configuration version');
        console.log(chalk.gray('The file may be corrupted or in an unsupported format'));
      } else {
        logSuccess(`Detected version: ${version}`);
        
        // Show migration path
        const migrationPaths = {
          'pre-phase10': 'Full migration with new stats, cards, and metadata',
          'phase10-v0': 'Property completion and schema alignment',
          'phase10-v1': 'Minor validation and metadata updates',
        };
        
        console.log(chalk.blue('\nMigration path:'));
        console.log(chalk.gray(migrationPaths[version as keyof typeof migrationPaths] || 'Unknown'));
      }
    } catch (error) {
      logError(`Detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

/**
 * Migrate command
 */
program
  .command('migrate')
  .description('Migrate a legacy configuration file')
  .argument('<input>', 'Input configuration file')
  .option('-o, --output <file>', 'Output file (default: <input>.migrated)')
  .option('--no-backup', 'Skip creating backup file')
  .option('--dry-run', 'Show what would be migrated without making changes')
  .option('--force', 'Force migration even if already current format')
  .option('-v, --verbose', 'Show detailed migration information')
  .action(async (input, options) => {
    try {
      logInfo(`Migrating configuration: ${input}`);
      
      // Check if input file exists
      await access(input);
      
      // Set output file
      const outputFile = options.output || `${input}.migrated`;
      
      // Perform migration
      const result = await ConfigMigrator.migrate(input, outputFile, {
        createBackup: options.backup !== false,
        dryRun: options.dryRun,
        force: options.force,
      });
      
      if (result.success) {
        logSuccess('Migration completed successfully!');
        
        console.log(chalk.blue('\nMigration Details:'));
        console.log(`  Source Version: ${result.sourceVersion}`);
        console.log(`  Target Version: ${result.targetVersion}`);
        console.log(`  Output File: ${result.outputFile}`);
        console.log(`  Changes: ${result.changes.length}`);
        console.log(`  Duration: ${formatDuration(result.duration)}`);
        
        if (result.backupFile) {
          console.log(`  Backup: ${result.backupFile}`);
        }
        
        if (options.verbose && result.changes.length > 0) {
          console.log(chalk.blue('\nChanges Applied:'));
          result.changes.forEach((change, index) => {
            const icon = change.type === 'added' ? chalk.green('+') :
                       change.type === 'removed' ? chalk.red('-') :
                       change.type === 'modified' ? chalk.yellow('~') : '•';
            console.log(`  ${icon} ${change.category}.${change.id}: ${change.description}`);
          });
        }
        
        if (result.warnings.length > 0) {
          console.log(chalk.yellow('\nWarnings:'));
          result.warnings.forEach(warning => {
            console.log(`  ⚠️ ${warning}`);
          });
        }
      } else {
        logError('Migration failed:');
        result.errors.forEach(error => {
          console.log(chalk.red(`  - ${error}`));
        });
        process.exit(1);
      }
    } catch (error) {
      logError(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

/**
 * Batch migrate command
 */
program
  .command('batch')
  .description('Migrate multiple configuration files')
  .argument('<pattern>', 'Glob pattern for files to migrate')
  .option('-o, --output-dir <dir>', 'Output directory for migrated files')
  .option('--no-backup', 'Skip creating backup files')
  .option('--dry-run', 'Show what would be migrated without making changes')
  .option('--parallel', 'Process files in parallel')
  .option('-v, --verbose', 'Show detailed migration information')
  .action(async (pattern, options) => {
    try {
      logInfo(`Batch migrating files matching: ${pattern}`);
      
      // Find files
      const files = await glob(pattern);
      
      if (files.length === 0) {
        logWarning('No files found matching pattern');
        return;
      }
      
      logInfo(`Found ${files.length} files to migrate`);
      
      // Create output directory if specified
      if (options.outputDir) {
        await mkdir(options.outputDir, { recursive: true });
      }
      
      // Perform batch migration
      const results = await ConfigMigrator.batchMigrate(files, {
        outputDir: options.outputDir,
        createBackup: options.backup !== false,
        dryRun: options.dryRun,
        parallel: options.parallel,
      });
      
      // Display results
      displayResults(results);
      
      // Generate report
      if (!options.dryRun) {
        const report = ConfigMigrator.generateReport(results);
        const reportFile = 'migration-report.md';
        await writeFile(reportFile, report);
        logInfo(`Migration report saved to: ${reportFile}`);
      }
      
      // Exit with error code if any migrations failed
      const failed = results.filter(r => !r.success).length;
      if (failed > 0) {
        logError(`${failed} migrations failed`);
        process.exit(1);
      }
    } catch (error) {
      logError(`Batch migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

/**
 * Rollback command
 */
program
  .command('rollback')
  .description('Rollback a migration using backup file')
  .argument('<backup>', 'Backup file to restore from')
  .argument('<target>', 'Target file to restore')
  .action(async (backup, target) => {
    try {
      logInfo(`Rolling back from: ${backup}`);
      logInfo(`Target file: ${target}`);
      
      // Check if backup file exists
      await access(backup);
      
      // Perform rollback
      const result = await ConfigMigrator.rollback(backup, target);
      
      if (result.success) {
        logSuccess('Rollback completed successfully!');
        logInfo(`Restored ${target} from ${backup}`);
      } else {
        logError('Rollback failed:');
        console.log(chalk.red(`  ${result.error}`));
        process.exit(1);
      }
    } catch (error) {
      logError(`Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

/**
 * Report command
 */
program
  .command('report')
  .description('Generate migration report from previous results')
  .argument('<files...>', 'Migration result files to analyze')
  .option('-o, --output <file>', 'Output report file (default: migration-report.md)')
  .action(async (files, options) => {
    try {
      logInfo('Generating migration report...');
      
      // Load result files
      const results: MigrationResult[] = [];
      
      for (const file of files) {
        try {
          const data = await readFile(file, 'utf-8');
          const result = JSON.parse(data);
          results.push(result);
        } catch (error) {
          logWarning(`Failed to load result file: ${file}`);
        }
      }
      
      if (results.length === 0) {
        logError('No valid result files found');
        return;
      }
      
      // Generate report
      const report = ConfigMigrator.generateReport(results);
      const outputFile = options.output || 'migration-report.md';
      
      await writeFile(outputFile, report);
      logSuccess(`Report generated: ${outputFile}`);
      
      // Display summary
      displayResults(results);
    } catch (error) {
      logError(`Report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

/**
 * Status command
 */
program
  .command('status')
  .description('Show current configuration status')
  .argument('[file]', 'Configuration file to check (default: rpg_balancer_config in storage)')
  .action(async (file) => {
    try {
      if (file) {
        // Check specific file
        logInfo(`Checking status of: ${file}`);
        await access(file);
        
        const data = await readFile(file, 'utf-8');
        const config = JSON.parse(data);
        
        const version = ConfigMigrator.detectVersion(config);
        const validation = ConfigMigrator.validateConfig(config);
        
        console.log(chalk.blue('\nFile Status:'));
        console.log(`  File: ${file}`);
        console.log(`  Version: ${version}`);
        console.log(`  Valid: ${validation.valid ? chalk.green('Yes') : chalk.red('No')}`);
        
        if (!validation.valid) {
          console.log(chalk.red('\nValidation Errors:'));
          validation.errors.forEach(error => {
            console.log(`  - ${error}`);
          });
        }
      } else {
        // Check current stored configuration
        logInfo('Checking current stored configuration...');
        
        // This would need to be implemented based on your storage system
        console.log(chalk.blue('\nStored Configuration:'));
        console.log('  Status: Not implemented - specify file path');
      }
    } catch (error) {
      logError(`Status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

/**
 * Examples command
 */
program
  .command('examples')
  .description('Show usage examples')
  .action(() => {
    console.log(chalk.blue('Config Migration Examples:'));
    console.log('');
    
    console.log(chalk.yellow('1. Validate a configuration:'));
    console.log(chalk.gray('   migrate-config validate config.json'));
    console.log('');
    
    console.log(chalk.yellow('2. Detect version:'));
    console.log(chalk.gray('   migrate-config detect legacy-config.json'));
    console.log('');
    
    console.log(chalk.yellow('3. Migrate a single file:'));
    console.log(chalk.gray('   migrate-config migrate old-config.json --output new-config.json'));
    console.log('');
    
    console.log(chalk.yellow('4. Batch migrate multiple files:'));
    console.log(chalk.gray('   migrate-config batch "configs/*.json" --output-dir migrated'));
    console.log('');
    
    console.log(chalk.yellow('5. Dry run migration:'));
    console.log(chalk.gray('   migrate-config migrate config.json --dry-run'));
    console.log('');
    
    console.log(chalk.yellow('6. Rollback migration:'));
    console.log(chalk.gray('   migrate-config rollback config.json.backup.123456789 config.json'));
    console.log('');
    
    console.log(chalk.yellow('7. Generate report:'));
    console.log(chalk.gray('   migrate-config report result1.json result2.json'));
    console.log('');
  });

// Parse and execute
program.parse();
