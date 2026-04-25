#!/usr/bin/env tsx

/**
 * Guardian Evidence Archive Rotator CLI
 * 
 * Command-line tool for rotating Guardian evidence archives with
 * zip compression, checksum validation, and retention management.
 * 
 * @since NP-060 – Guardian Evidence Archive Rotator
 */

import { readFile, writeFile, mkdir, unlink } from 'fs/promises';
import { join, basename } from 'path';
import { createHash } from 'crypto';
import { program } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import type {
  ArchiveConfig,
  ArchiveMetadata,
  RotationResult,
  ArchiveEntry,
} from '../../src/analytics/guardian/EvidenceArchiveService';
import {
  DEFAULT_ARCHIVE_CONFIG,
  createSafeArchiveConfig,
  scanDirectory,
  getFileInfo,
  createArchiveMetadata,
  saveArchiveMetadata,
  getExistingArchives,
  shouldCleanupArchive,
  deleteArchive,
  saveArchiveIndex,
  generateTelemetryEvent,
} from '../../src/analytics/guardian/EvidenceArchiveService';

/**
 * Simple ZIP implementation using Node.js built-in modules
 * Note: In production, use a proper ZIP library like 'yauzl' or 'jszip'
 */
class SimpleZipArchiver {
  private files: Array<{ path: string; data: Buffer }> = [];

  addFile(path: string, data: Buffer): void {
    this.files.push({ path, data });
  }

  async generate(): Promise<Buffer> {
    // Simple concatenation for demonstration
    // In production, use proper ZIP format
    const header = Buffer.from('SIMPLE_ZIP_ARCHIVE\n');
    const entries = this.files.map(file => {
      const entryHeader = Buffer.from(`FILE:${file.path}\n`);
      const sizeBuffer = Buffer.from(`${file.data.length}\n`);
      return Buffer.concat([entryHeader, sizeBuffer, file.data]);
    });
    
    return Buffer.concat([header, ...entries]);
  }
}

/**
 * CLI options
 */
interface CliOptions {
  input: string;
  output?: string;
  config?: string;
  dryRun: boolean;
  force: boolean;
  verbose: boolean;
  cleanup: boolean;
  index: boolean;
  retention?: string;
  compression?: number;
}

/**
 * Evidence Archive Rotator class
 */
class EvidenceArchiveRotator {
  private config: ArchiveConfig;
  private telemetry: Array<Record<string, unknown>> = [];

  constructor(config: ArchiveConfig) {
    this.config = config;
  }

  /**
   * Create archive from files
   */
  async createArchive(files: string[], archiveName: string): Promise<ArchiveMetadata> {
    console.log(chalk.blue(`📦 Creating archive: ${archiveName}`));
    
    const startTime = Date.now();
    const archivePath = join(this.config.archiveDirectory, `${archiveName}.zip`);
    
    // Get file information
    const entries: ArchiveEntry[] = [];
    for (const filePath of files) {
      try {
        const entry = await getFileInfo(filePath, this.config);
        entries.push(entry);
      } catch (error) {
        console.warn(chalk.yellow(`Warning: Failed to process ${filePath}:`, error));
        if (!this.config.validation.skipCorruptedFiles) {
          throw error;
        }
      }
    }

    // Create metadata
    const metadata = createArchiveMetadata(archiveName, archivePath, entries, this.config);

    // Create ZIP archive
    const archiver = new SimpleZipArchiver();
    
    for (const entry of entries) {
      const fullPath = join(this.config.baseDirectory, entry.path);
      const data = await readFile(fullPath);
      archiver.addFile(entry.path, data);
    }

    // Generate archive
    const archiveData = await archiver.generate();
    
    // Calculate checksum
    const hash = createHash('sha256');
    hash.update(archiveData);
    metadata.checksum = hash.digest('hex');

    // Write archive
    await mkdir(dirname(archivePath), { recursive: true });
    await writeFile(archivePath, archiveData);
    
    // Update metadata
    metadata.archiveSize = archiveData.length;
    metadata.status = 'completed';
    
    // Save metadata
    await saveArchiveMetadata(metadata);

    const duration = Date.now() - startTime;
    console.log(chalk.green(`✅ Archive created in ${duration}ms`));
    console.log(chalk.gray(`   Files: ${metadata.fileCount}`));
    console.log(chalk.gray(`   Size: ${(metadata.archiveSize / 1024 / 1024).toFixed(2)}MB`));
    console.log(chalk.gray(`   Compression: ${(1 - metadata.compressionRatio) * 100}%`));
    console.log(chalk.gray(`   Checksum: ${metadata.checksum.substring(0, 16)}...`));

    // Add telemetry
    this.telemetry.push(generateTelemetryEvent('guardian_evidence_archived', {
      archiveId: metadata.id,
      fileCount: metadata.fileCount,
      archiveSize: metadata.archiveSize,
      compressionRatio: metadata.compressionRatio,
      duration,
    }));

    return metadata;
  }

  /**
   * Perform rotation
   */
  async rotate(): Promise<RotationResult> {
    console.log(chalk.blue('🔄 Starting evidence archive rotation...'));
    
    const startTime = Date.now();
    const result: RotationResult = {
      id: `rotation-${Date.now()}`,
      timestamp: startTime,
      archivesCreated: [],
      archivesCleaned: [],
      filesProcessed: 0,
      totalSizeProcessed: 0,
      compressionRatio: 0,
      errors: [],
      duration: 0,
    };

    try {
      // Scan for files
      const files = await scanDirectory(this.config.baseDirectory, this.config);
      console.log(chalk.blue(`📁 Found ${files.length} files to process`));

      if (files.length === 0) {
        console.log(chalk.yellow('⚠️  No files found to archive'));
        return result;
      }

      // Calculate totals
      result.filesProcessed = files.length;
      result.totalSizeProcessed = files.reduce((sum, file) => {
        try {
          const stats = require('fs').statSync(file);
          return sum + stats.size;
        } catch {
          return sum;
        }
      }, 0);

      // Create archive
      const archiveName = `evidence-archive-${new Date().toISOString().split('T')[0]}`;
      const archive = await this.createArchive(files, archiveName);
      result.archivesCreated.push(archive);

      // Calculate compression ratio
      result.compressionRatio = archive.archiveSize / result.totalSizeProcessed;

      // Cleanup old archives
      if (this.config.retention.maxArchives > 0 || this.config.retention.maxAgeDays > 0) {
        console.log(chalk.blue('🧹 Cleaning up old archives...'));
        await this.cleanupArchives(result);
      }

      // Update archive index
      if (this.config.compression.createIndex) {
        console.log(chalk.blue('📋 Updating archive index...'));
        const allArchives = await getExistingArchives(this.config);
        await saveArchiveIndex(allArchives, this.config);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMessage);
      console.error(chalk.red('❌ Rotation failed:'), errorMessage);
    }

    result.duration = Date.now() - startTime;

    // Log telemetry
    this.telemetry.push(generateTelemetryEvent('guardian_rotation_completed', {
      rotationId: result.id,
      archivesCreated: result.archivesCreated.length,
      archivesCleaned: result.archivesCleaned.length,
      filesProcessed: result.filesProcessed,
      totalSizeProcessed: result.totalSizeProcessed,
      compressionRatio: result.compressionRatio,
      duration: result.duration,
      errors: result.errors.length,
    }));

    return result;
  }

  /**
   * Cleanup old archives
   */
  private async cleanupArchives(result: RotationResult): Promise<void> {
    const existingArchives = await getExistingArchives(this.config);
    
    for (const archive of existingArchives) {
      if (shouldCleanupArchive(archive, this.config, existingArchives)) {
        try {
          await deleteArchive(archive);
          result.archivesCleaned.push(archive.id);
          console.log(chalk.gray(`   Deleted: ${archive.id}`));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to delete ${archive.id}: ${errorMessage}`);
          console.warn(chalk.yellow(`Warning: Failed to delete ${archive.id}:`, errorMessage));
        }
      }
    }
  }

  /**
   * List existing archives
   */
  async listArchives(): Promise<void> {
    console.log(chalk.blue('📋 Existing Archives:'));
    
    const archives = await getExistingArchives(this.config);
    
    if (archives.length === 0) {
      console.log(chalk.yellow('No archives found'));
      return;
    }

    const table = new Table({
      head: [
        chalk.cyan('ID'),
        chalk.cyan('Created'),
        chalk.cyan('Size'),
        chalk.cyan('Files'),
        chalk.cyan('Compression'),
        chalk.cyan('Status'),
        chalk.cyan('Expires'),
      ],
      colWidths: [20, 12, 10, 8, 12, 12, 12],
    });

    archives.forEach(archive => {
      const created = new Date(archive.createdAt).toLocaleDateString();
      const size = `${(archive.archiveSize / 1024 / 1024).toFixed(1)}MB`;
      const compression = `${((1 - archive.compressionRatio) * 100).toFixed(1)}%`;
      const expires = new Date(archive.retention.expiresAt).toLocaleDateString();
      
      table.push([
        archive.id,
        created,
        size,
        archive.fileCount.toString(),
        compression,
        archive.status,
        expires,
      ]);
    });

    console.log(table.toString());

    // Summary
    const totalSize = archives.reduce((sum, a) => sum + a.archiveSize, 0);
    const totalFiles = archives.reduce((sum, a) => sum + a.fileCount, 0);
    const avgCompression = archives.length > 0 
      ? archives.reduce((sum, a) => sum + a.compressionRatio, 0) / archives.length 
      : 0;

    console.log(chalk.bold('\n📊 Summary:'));
    console.log(`Total Archives: ${archives.length}`);
    console.log(`Total Size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Total Files: ${totalFiles}`);
    console.log(`Average Compression: ${((1 - avgCompression) * 100).toFixed(1)}%`);
  }

  /**
   * Validate archives
   */
  async validateArchives(): Promise<void> {
    console.log(chalk.blue('🔍 Validating Archives...'));
    
    const archives = await getExistingArchives(this.config);
    let validCount = 0;
    let invalidCount = 0;

    for (const archive of archives) {
      try {
        // Check if archive file exists
        const archiveData = await readFile(archive.archivePath);
        
        // Verify checksum
        if (this.config.validation.verifyChecksums && archive.checksum) {
          const hash = createHash('sha256');
          hash.update(archiveData);
          const calculatedChecksum = hash.digest('hex');
          
          if (calculatedChecksum !== archive.checksum) {
            console.error(chalk.red(`❌ ${archive.id}: Checksum mismatch`));
            invalidCount++;
            continue;
          }
        }

        console.log(chalk.green(`✅ ${archive.id}: Valid`));
        validCount++;
      } catch (error) {
        console.error(chalk.red(`❌ ${archive.id}: Invalid - ${error}`));
        invalidCount++;
      }
    }

    console.log(chalk.bold(`\n📊 Validation Results:`));
    console.log(`Valid: ${validCount}`);
    console.log(`Invalid: ${invalidCount}`);
    console.log(`Total: ${archives.length}`);
  }

  /**
   * Display rotation results
   */
  displayResults(result: RotationResult): void {
    console.log(chalk.bold.blue('\n📊 Rotation Results:'));
    
    const table = new Table({
      head: [chalk.cyan('Metric'), chalk.cyan('Value')],
      colWidths: [25, 15],
    });

    table.push(
      ['Archives Created', result.archivesCreated.length.toString()],
      ['Archives Cleaned', result.archivesCleaned.length.toString()],
      ['Files Processed', result.filesProcessed.toString()],
      ['Total Size', `${(result.totalSizeProcessed / 1024 / 1024).toFixed(2)}MB`],
      ['Compression', `${((1 - result.compressionRatio) * 100).toFixed(1)}%`],
      ['Duration', `${result.duration}ms`],
      ['Errors', result.errors.length.toString()],
    );

    console.log(table.toString());

    if (result.archivesCreated.length > 0) {
      console.log(chalk.bold('\n📦 Created Archives:'));
      result.archivesCreated.forEach(archive => {
        console.log(`  ${archive.id}: ${(archive.archiveSize / 1024 / 1024).toFixed(2)}MB, ${archive.fileCount} files`);
      });
    }

    if (result.archivesCleaned.length > 0) {
      console.log(chalk.bold('\n🧹 Cleaned Archives:'));
      result.archivesCleaned.forEach(id => {
        console.log(`  ${id}`);
      });
    }

    if (result.errors.length > 0) {
      console.log(chalk.bold('\n❌ Errors:'));
      result.errors.forEach(error => {
        console.log(`  ${error}`);
      });
    }

    // Display telemetry
    if (this.telemetry.length > 0) {
      console.log(chalk.bold('\n📡 Telemetry Events:'));
      this.telemetry.forEach(event => {
        console.log(`  ${event.event}: ${JSON.stringify(event, null, 2)}`);
      });
    }
  }

  /**
   * Save telemetry
   */
  async saveTelemetry(): Promise<void> {
    if (this.telemetry.length === 0) return;

    try {
      const telemetryPath = join(this.config.archiveDirectory, 'telemetry.json');
      const existingData = await readFile(telemetryPath, 'utf-8').catch(() => '[]');
      const telemetry = JSON.parse(existingData);
      telemetry.push(...this.telemetry);
      
      // Keep only last 1000 events
      if (telemetry.length > 1000) {
        telemetry.splice(0, telemetry.length - 1000);
      }
      
      await writeFile(telemetryPath, JSON.stringify(telemetry, null, 2), 'utf-8');
    } catch (error) {
      console.warn('Failed to save telemetry:', error);
    }
  }
}

/**
 * Main CLI function
 */
async function main() {
  program
    .name('evidence-archive-rotator')
    .description('Guardian Evidence Archive Rotator - Rotate and manage evidence archives')
    .version('1.0.0');

  program
    .requiredOption('-i, --input <path>', 'Input directory containing evidence files')
    .option('-o, --output <path>', 'Archive output directory')
    .option('-c, --config <path>', 'Custom configuration file')
    .option('--dry-run', 'Show what would be done without executing')
    .option('--force', 'Force rotation even if no files need archiving')
    .option('-v, --verbose', 'Verbose output')
    .option('--cleanup', 'Run cleanup only')
    .option('--index', 'Update archive index only')
    .option('--retention <days>', 'Override retention days')
    .option('--compression <level>', 'Compression level (0-9)', '6');

  program
    .command('rotate')
    .description('Rotate evidence archives')
    .action(async (options) => {
      await handleRotate(options);
    });

  program
    .command('list')
    .description('List existing archives')
    .action(async (options) => {
      await handleList(options);
    });

  program
    .command('validate')
    .description('Validate existing archives')
    .action(async (options) => {
      await handleValidate(options);
    });

  program.parse();

  const opts = program.opts() as CliOptions;

  if (program.args.length === 0) {
    // Default to rotate if no command specified
    await handleRotate(opts);
  }
}

/**
 * Handle rotate command
 */
async function handleRotate(options: CliOptions) {
  try {
    // Load configuration
    let config = DEFAULT_ARCHIVE_CONFIG;
    if (options.config && await require('fs').promises.stat(options.config).catch(() => null)) {
      const configData = JSON.parse(await readFile(options.config, 'utf-8'));
      config = createSafeArchiveConfig(configData);
    }

    // Apply CLI overrides
    if (options.output) {
      config.archiveDirectory = options.output;
    }
    if (options.retention) {
      config.retention.maxAgeDays = parseInt(options.retention);
    }
    if (options.compression) {
      config.compression.level = parseInt(options.compression);
    }

    // Update input directory
    config.baseDirectory = options.input;

    // Create rotator
    const rotator = new EvidenceArchiveRotator(config);

    if (options.dryRun) {
      console.log(chalk.yellow('🔍 DRY RUN MODE - No files will be modified'));
      
      const files = await scanDirectory(config.baseDirectory, config);
      console.log(chalk.blue(`Found ${files.length} files to archive`));
      
      const existingArchives = await getExistingArchives(config);
      console.log(chalk.blue(`Found ${existingArchives.length} existing archives`));
      
      const toCleanup = existingArchives.filter(a => shouldCleanupArchive(a, config, existingArchives));
      console.log(chalk.blue(`Would clean up ${toCleanup.length} archives`));
      
      return;
    }

    // Perform rotation
    const result = await rotator.rotate();
    
    // Display results
    rotator.displayResults(result);
    
    // Save telemetry
    await rotator.saveTelemetry();

    // Exit with error code if there were errors
    if (result.errors.length > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Handle list command
 */
async function handleList(options: CliOptions) {
  try {
    const config = createSafeArchiveConfig({
      baseDirectory: options.input,
      archiveDirectory: options.output || 'test-results/archives',
    });

    const rotator = new EvidenceArchiveRotator(config);
    await rotator.listArchives();

  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Handle validate command
 */
async function handleValidate(options: CliOptions) {
  try {
    const config = createSafeArchiveConfig({
      baseDirectory: options.input,
      archiveDirectory: options.output || 'test-results/archives',
    });

    const rotator = new EvidenceArchiveRotator(config);
    await rotator.validateArchives();

  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run CLI
if (require.main === module) {
  main().catch(console.error);
}

export { EvidenceArchiveRotator };
