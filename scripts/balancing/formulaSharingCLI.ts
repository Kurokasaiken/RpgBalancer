#!/usr/bin/env tsx

/**
 * Balancer Formula Sharing CLI - NP-037
 * 
 * Command-line interface for exporting and importing balancer formulas,
 * cards, and presets with validation and documentation generation.
 * 
 * @since 2026-01-19
 * @author Cascade
 */

import { Command } from 'commander';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname, extname, basename } from 'path';
import { z } from 'zod';
import { FormulaSharingService, type ExportFormat, type ExportScope, type ImportOptions } from '../src/balancing/config/FormulaSharingService';
import { BalancerConfigStore } from '../src/balancing/config/BalancerConfigStore';
import { saveData, loadData } from '../src/shared/persistence/PersistenceService';

// CLI Configuration
const program = new Command();
program
  .name('formula-sharing')
  .description('Balancer Formula Sharing CLI - Export and import balancer configurations')
  .version('1.0.0');

// Global options
program
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-d, --dry-run', 'Perform operations without making changes')
  .option('--output-dir <dir>', 'Output directory for exports', './data/exports/balancer/formulas')
  .option('--backup-dir <dir>', 'Backup directory for imports', './data/exports/balancer/backups');

// Export command
program
  .command('export')
  .description('Export balancer configuration')
  .option('-s, --scope <scope>', 'Export scope: formulas, cards, presets, full', 'full')
  .option('-f, --format <format>', 'Export format: json, markdown, yaml', 'json')
  .option('-o, --output <file>', 'Output file name (auto-generated if not provided)')
  .option('--no-metadata', 'Exclude metadata from export')
  .option('--author <name>', 'Author name for export metadata', process.env.USER || 'Unknown')
  .action(async (options) => {
    try {
      await handleExport(options);
    } catch (error) {
      console.error('Export failed:', error);
      process.exit(1);
    }
  });

// Import command
program
  .command('import')
  .description('Import balancer configuration')
  .argument('<file>', 'Import file path')
  .option('--overwrite', 'Overwrite existing configurations')
  .option('--skip-built-in', 'Skip built-in presets')
  .option('--no-validate', 'Skip formula validation')
  .option('--no-backup', 'Skip creating backup')
  .option('--dry-run', 'Validate import without applying changes')
  .action(async (file, options) => {
    try {
      await handleImport(file, options);
    } catch (error) {
      console.error('Import failed:', error);
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate export file without importing')
  .argument('<file>', 'File to validate')
  .action(async (file) => {
    try {
      await handleValidate(file);
    } catch (error) {
      console.error('Validation failed:', error);
      process.exit(1);
    }
  });

// List command
program
  .command('list')
  .description('List available exports and imports')
  .option('--type <type>', 'Filter by type: exports, imports', 'exports')
  .action(async (options) => {
    try {
      await handleList(options);
    } catch (error) {
      console.error('List failed:', error);
      process.exit(1);
    }
  });

// Info command
program
  .command('info')
  .description('Show information about export file')
  .argument('<file>', 'File to inspect')
  .action(async (file) => {
    try {
      await handleInfo(file);
    } catch (error) {
      console.error('Info failed:', error);
      process.exit(1);
    }
  });

/**
 * Handle export command
 */
async function handleExport(options: any) {
  const { scope, format, output, outputDir, metadata, author, verbose, dryRun } = options;

  // Validate options
  if (!['formulas', 'cards', 'presets', 'full'].includes(scope)) {
    throw new Error(`Invalid scope: ${scope}`);
  }

  if (!['json', 'markdown', 'yaml'].includes(format)) {
    throw new Error(`Invalid format: ${format}`);
  }

  if (verbose) {
    console.log(`Exporting balancer configuration...`);
    console.log(`Scope: ${scope}`);
    console.log(`Format: ${format}`);
    console.log(`Author: ${author}`);
  }

  // Load current configuration
  const config = BalancerConfigStore.getConfig();
  if (!config) {
    throw new Error('Failed to load balancer configuration');
  }

  if (verbose) {
    console.log(`Loaded configuration with ${Object.keys(config.stats).length} stats, ${Object.keys(config.cards).length} cards, ${Object.keys(config.presets).length} presets`);
  }

  // Export configuration
  const exportPackage = await FormulaSharingService.exportConfig(config, {
    scope: scope as ExportScope,
    format: format as ExportFormat,
    exportedBy: author,
    includeMetadata: metadata,
  });

  if (verbose) {
    console.log(`Export package created:`);
    console.log(`- Formulas: ${exportPackage.metadata.totalFormulas}`);
    console.log(`- Cards: ${exportPackage.metadata.totalCards}`);
    console.log(`- Presets: ${exportPackage.metadata.totalPresets}`);
    console.log(`- Checksum: ${exportPackage.checksum}`);
  }

  // Serialize package
  const serialized = FormulaSharingService.serializePackage(exportPackage, format as ExportFormat);

  // Determine output file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const defaultFilename = `balancer-export-${scope}-${timestamp}.${format}`;
  const filename = output || defaultFilename;
  const filepath = join(outputDir, filename);

  if (dryRun) {
    console.log(`[DRY RUN] Would write to: ${filepath}`);
    console.log(`[DRY RUN] Content length: ${serialized.length} characters`);
    return;
  }

  // Ensure output directory exists
  await mkdir(dirname(filepath), { recursive: true });

  // Write file
  await writeFile(filepath, serialized, 'utf-8');

  console.log(`✅ Exported to: ${filepath}`);
  
  // Emit telemetry
  await emitTelemetry('balancer_formula_exported', {
    scope,
    format,
    filename,
    totalFormulas: exportPackage.metadata.totalFormulas,
    totalCards: exportPackage.metadata.totalCards,
    totalPresets: exportPackage.metadata.totalPresets,
  });
}

/**
 * Handle import command
 */
async function handleImport(file: string, options: any) {
  const { overwrite, skipBuiltIn, validate, backup, dryRun, verbose } = options;

  if (verbose) {
    console.log(`Importing from: ${file}`);
    console.log(`Overwrite: ${overwrite}`);
    console.log(`Skip built-in: ${skipBuiltIn}`);
    console.log(`Validate formulas: ${validate}`);
    console.log(`Create backup: ${backup}`);
    console.log(`Dry run: ${dryRun}`);
  }

  // Read and parse file
  const content = await readFile(file, 'utf-8');
  const format = getFormatFromFilename(file);
  
  const exportPackage = FormulaSharingService.parsePackage(content, format);

  if (verbose) {
    console.log(`Parsed export package:`);
    console.log(`- Version: ${exportPackage.version}`);
    console.log(`- Exported: ${exportPackage.exportedAt}`);
    console.log(`- By: ${exportPackage.exportedBy}`);
    console.log(`- Scope: ${exportPackage.scope}`);
    console.log(`- Formulas: ${exportPackage.metadata.totalFormulas}`);
    console.log(`- Cards: ${exportPackage.metadata.totalCards}`);
    console.log(`- Presets: ${exportPackage.metadata.totalPresets}`);
  }

  // Load current configuration
  const currentConfig = BalancerConfigStore.getConfig();
  if (!currentConfig) {
    throw new Error('Failed to load current balancer configuration');
  }

  // Import options
  const importOptions: ImportOptions = {
    overwriteExisting: overwrite,
    skipBuiltIn: skipBuiltIn,
    validateFormulas: validate,
    createBackup: backup && !dryRun,
    dryRun: dryRun,
  };

  // Perform import
  const result = await FormulaSharingService.importConfig(
    exportPackage,
    currentConfig,
    importOptions
  );

  // Display validation results
  console.log('\n📊 Import Validation Results:');
  console.log(`Valid: ${result.validation.valid ? '✅' : '❌'}`);
  
  if (result.validation.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.validation.errors.forEach(error => console.log(`  - ${error}`));
  }

  if (result.validation.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.validation.warnings.forEach(warning => console.log(`  - ${warning}`));
  }

  console.log('\n📈 Summary:');
  console.log(`  Formulas to import: ${result.validation.summary.formulasToImport}`);
  console.log(`  Cards to import: ${result.validation.summary.cardsToImport}`);
  console.log(`  Presets to import: ${result.validation.summary.presetsToImport}`);
  console.log(`  Conflicts: ${result.validation.summary.conflicts}`);

  // Handle backup
  if (result.backup) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = join(program.opts().backupDir, `backup-${timestamp}.json`);
    await mkdir(dirname(backupFile), { recursive: true });
    await writeFile(backupFile, JSON.stringify(result.backup, null, 2), 'utf-8');
    console.log(`💾 Backup created: ${backupFile}`);
  }

  // Apply changes if valid and not dry run
  if (result.validation.valid && !dryRun && result.updatedConfig) {
    BalancerConfigStore.setConfig(result.updatedConfig);
    console.log('✅ Import applied successfully');
    
    // Emit telemetry
    await emitTelemetry('balancer_formula_imported', {
      sourceFile: basename(file),
      formulasImported: result.validation.summary.formulasToImport,
      cardsImported: result.validation.summary.cardsToImport,
      presetsImported: result.validation.summary.presetsToImport,
      conflicts: result.validation.summary.conflicts,
    });
  } else if (dryRun) {
    console.log('🔍 Dry run completed - no changes applied');
  } else if (!result.validation.valid) {
    console.log('❌ Import failed due to validation errors');
    process.exit(1);
  }
}

/**
 * Handle validate command
 */
async function handleValidate(file: string) {
  console.log(`Validating: ${file}`);

  // Read and parse file
  const content = await readFile(file, 'utf-8');
  const format = getFormatFromFilename(file);
  
  const exportPackage = FormulaSharingService.parsePackage(content, format);

  console.log(`✅ Valid export package`);
  console.log(`Version: ${exportPackage.version}`);
  console.log(`Scope: ${exportPackage.scope}`);
  console.log(`Format: ${exportPackage.format}`);
  console.log(`Checksum: ${exportPackage.checksum}`);
  console.log(`Exported: ${exportPackage.exportedAt}`);
  console.log(`By: ${exportPackage.exportedBy}`);

  console.log('\n📊 Contents:');
  console.log(`Formulas: ${exportPackage.metadata.totalFormulas}`);
  console.log(`Cards: ${exportPackage.metadata.totalCards}`);
  console.log(`Presets: ${exportPackage.metadata.totalPresets}`);

  // Validate formulas if present
  if (exportPackage.formulas) {
    console.log('\n🔍 Formula Validation:');
    
    for (const formula of exportPackage.formulas) {
      const status = formula.validation.valid ? '✅' : '❌';
      console.log(`  ${status} ${formula.statName} (${formula.statId})`);
      
      if (formula.validation.error) {
        console.log(`    Error: ${formula.validation.error}`);
      }
      
      if (formula.validation.warnings && formula.validation.warnings.length > 0) {
        formula.validation.warnings.forEach(warning => {
          console.log(`    Warning: ${warning.message}`);
        });
      }
    }
  }
}

/**
 * Handle list command
 */
async function handleList(options: any) {
  const { type, outputDir } = options;

  console.log(`Listing ${type}...`);

  try {
    const files = await listFiles(outputDir);
    
    if (files.length === 0) {
      console.log(`No ${type} found`);
      return;
    }

    console.log(`\n📁 ${type.charAt(0).toUpperCase() + type.slice(1)}:`);
    
    for (const file of files) {
      const stat = await readFile(join(outputDir, file), 'utf-8');
      const format = getFormatFromFilename(file);
      
      try {
        const packageData = FormulaSharingService.parsePackage(stat, format);
        console.log(`  📄 ${file}`);
        console.log(`     Scope: ${packageData.scope}`);
        console.log(`     Exported: ${new Date(packageData.exportedAt).toLocaleDateString()}`);
        console.log(`     By: ${packageData.exportedBy}`);
        console.log(`     Size: ${stat.length} characters`);
        console.log('');
      } catch (error) {
        console.log(`  📄 ${file} (invalid format)`);
        console.log('');
      }
    }
  } catch (error) {
    console.log(`Failed to list ${type}: ${error}`);
  }
}

/**
 * Handle info command
 */
async function handleInfo(file: string) {
  console.log(`Information for: ${file}`);

  // Read and parse file
  const content = await readFile(file, 'utf-8');
  const format = getFormatFromFilename(file);
  
  const exportPackage = FormulaSharingService.parsePackage(content, format);

  console.log('\n📋 Package Information:');
  console.log(`File: ${basename(file)}`);
  console.log(`Format: ${format}`);
  console.log(`Size: ${content.length} characters`);
  console.log(`Version: ${exportPackage.version}`);
  console.log(`Exported: ${new Date(exportPackage.exportedAt).toLocaleString()}`);
  console.log(`By: ${exportPackage.exportedBy}`);
  console.log(`Scope: ${exportPackage.scope}`);
  console.log(`Checksum: ${exportPackage.checksum}`);

  console.log('\n📊 Content Summary:');
  console.log(`Formulas: ${exportPackage.metadata.totalFormulas}`);
  console.log(`Cards: ${exportPackage.metadata.totalCards}`);
  console.log(`Presets: ${exportPackage.metadata.totalPresets}`);
  console.log(`Balancer Version: ${exportPackage.metadata.balancerVersion}`);

  // Show formula details
  if (exportPackage.formulas && exportPackage.formulas.length > 0) {
    console.log('\n🧮 Formulas:');
    exportPackage.formulas.forEach(formula => {
      const status = formula.validation.valid ? '✅' : '❌';
      console.log(`  ${status} ${formula.statName}`);
      console.log(`     ID: ${formula.statId}`);
      console.log(`     Formula: ${formula.formula}`);
      console.log(`     Derived: ${formula.metadata.isDerived ? 'Yes' : 'No'}`);
      console.log(`     Weight: ${formula.metadata.weight}`);
      console.log('');
    });
  }

  // Show card details
  if (exportPackage.cards && exportPackage.cards.length > 0) {
    console.log('🃏 Cards:');
    exportPackage.cards.forEach(card => {
      console.log(`  📇 ${card.title}`);
      console.log(`     ID: ${card.cardId}`);
      console.log(`     Color: ${card.color}`);
      console.log(`     Stats: ${card.statIds.join(', ')}`);
      console.log(`     Core: ${card.isCore ? 'Yes' : 'No'}`);
      console.log('');
    });
  }

  // Show preset details
  if (exportPackage.presets && exportPackage.presets.length > 0) {
    console.log('⚙️  Presets:');
    exportPackage.presets.forEach(preset => {
      console.log(`  🔧 ${preset.name}`);
      console.log(`     ID: ${preset.presetId}`);
      console.log(`     Built-in: ${preset.isBuiltIn ? 'Yes' : 'No'}`);
      console.log(`     Weights: ${Object.keys(preset.weights).length} stats`);
      console.log('');
    });
  }
}

/**
 * Get format from filename
 */
function getFormatFromFilename(filename: string): ExportFormat {
  const ext = extname(filename).toLowerCase();
  
  switch (ext) {
    case '.json':
      return 'json';
    case '.md':
    case '.markdown':
      return 'markdown';
    case '.yaml':
    case '.yml':
      return 'yaml';
    default:
      throw new Error(`Unsupported file extension: ${ext}`);
  }
}

/**
 * List files in directory
 */
async function listFiles(dir: string): Promise<string[]> {
  try {
    const fs = await import('fs/promises');
    const files = await fs.readdir(dir);
    return files.filter(file => 
      ['.json', '.md', '.yaml', '.yml'].includes(extname(file))
    );
  } catch (error) {
    return [];
  }
}

/**
 * Emit telemetry event
 */
async function emitTelemetry(event: string, data: Record<string, any>) {
  try {
    // Save telemetry data
    await saveData(`telemetry_${event}_${Date.now()}`, {
      event,
      timestamp: new Date().toISOString(),
      data,
    });
  } catch (error) {
    // Silently ignore telemetry errors
    if (program.opts().verbose) {
      console.warn('Failed to emit telemetry:', error);
    }
  }
}

// Parse command line arguments
program.parse();

/**
 * Display help if no command provided
 */
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
