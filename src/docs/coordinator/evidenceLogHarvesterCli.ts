#!/usr/bin/env node

/**
 * Coordinator Evidence Log Harvester CLI
 *
 * Command-line interface for harvesting evidence logs with configurable extraction
 * and sample report generation.
 *
 * @module evidenceLogHarvesterCli
 * @since 2026-01-13
 * @author Cascade
 */

import { Command } from 'commander';
import { EvidenceLogHarvester, DEFAULT_EXTRACTION_PATTERNS, type HarvestConfig, type SampleReportConfig } from './evidenceLogHarvester';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const program = new Command();

program
  .name('evidence-harvest')
  .description('Harvest evidence logs with configurable extraction and reporting')
  .version('1.0.0');

program
  .command('harvest')
  .description('Harvest evidence logs from specified directories')
  .option('-d, --dirs <dirs>', 'Comma-separated list of directories to scan', (value) => value.split(','))
  .option('-p, --patterns <patterns>', 'Comma-separated list of pattern names to use', (value) => value.split(','))
  .option('-o, --output <file>', 'Output file for results (JSON)')
  .option('-r, --report <file>', 'Generate sample report')
  .option('--report-title <title>', 'Sample report title', 'Evidence Log Harvest Report')
  .option('--report-desc <desc>', 'Sample report description', 'Automated harvest of evidence logs with configurable extraction')
  .option('--max-files <number>', 'Maximum files to process', (value) => parseInt(value))
  .option('--max-size <bytes>', 'Maximum file size in bytes', (value) => parseInt(value))
  .option('--task-ids <ids>', 'Comma-separated list of task IDs to filter', (value) => value.split(','))
  .option('--content-types <types>', 'Comma-separated list of content types to include', (value) => value.split(','))
  .option('--date-start <date>', 'Start date filter (YYYY-MM-DD)', (value) => new Date(value))
  .option('--date-end <date>', 'End date filter (YYYY-MM-DD)', (value) => new Date(value))
  .option('-v, --verbose', 'Verbose output')
  .action(async (options: any) => {
    try {
      // Default directories
      const defaultDirs = [
        './test-results',
        './src/test-results',
        './logs',
        './evidence',
      ];

      const dirs = options.dirs || defaultDirs.filter(dir => existsSync(dir));

      if (dirs.length === 0) {
        console.error('❌ No valid directories found to scan');
        console.log('Default directories checked:', defaultDirs.join(', '));
        process.exit(1);
      }

      console.log(`🔍 Harvesting evidence logs from: ${dirs.join(', ')}`);

      // Build extraction patterns
      let patterns = DEFAULT_EXTRACTION_PATTERNS;
      if (options.patterns) {
        patterns = DEFAULT_EXTRACTION_PATTERNS.filter(p =>
          options.patterns.includes(p.name)
        );
        if (patterns.length === 0) {
          console.error('❌ No matching patterns found');
          console.log('Available patterns:', DEFAULT_EXTRACTION_PATTERNS.map(p => p.name).join(', '));
          process.exit(1);
        }
      }

      // Build configuration
      const config: HarvestConfig = {
        baseDirs: dirs,
        patterns,
        maxFiles: options.maxFiles,
        maxFileSize: options.maxSize,
        taskIds: options.taskIds,
        contentTypes: options.contentTypes,
      };

      if (options.dateStart || options.dateEnd) {
        config.dateRange = {
          start: options.dateStart || new Date('2020-01-01'),
          end: options.dateEnd || new Date(),
        };
      }

      // Perform harvest
      const results = await EvidenceLogHarvester.harvest(config);

      // Display results
      displayHarvestResults(results, options.verbose);

      // Save results if requested
      if (options.output) {
        const outputData = EvidenceLogHarvester.exportResults(results, 'json');
        writeFileSync(options.output, outputData);
        console.log(`💾 Results saved to: ${options.output}`);
      }

      // Generate sample report if requested
      if (options.report) {
        const reportConfig: SampleReportConfig = {
          title: options.reportTitle,
          description: options.reportDesc,
          sections: ['summary', 'timeline', 'task-breakdown', 'content-analysis', 'errors'],
          maxEntriesPerSection: 20,
          includePreviews: options.verbose,
        };

        const report = EvidenceLogHarvester.generateSampleReport(results, reportConfig);
        writeFileSync(options.report, report);
        console.log(`📄 Sample report saved to: ${options.report}`);
      }

      if (results.errors.length > 0) {
        console.log('\n⚠️  Some errors occurred during harvest. Check output for details.');
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Harvest failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('patterns')
  .description('List available extraction patterns')
  .action(() => {
    console.log('📋 Available Extraction Patterns:');
    console.log('');

    DEFAULT_EXTRACTION_PATTERNS.forEach(pattern => {
      console.log(`## ${pattern.name}`);
      console.log(`Pattern: ${pattern.filePattern}`);
      console.log('Content Patterns:');

      pattern.contentPatterns.forEach(cp => {
        const required = cp.required ? '(required)' : '(optional)';
        console.log(`  - ${cp.name}: ${cp.pattern.source} ${required}`);
      });

      console.log('');
    });
  });

program
  .command('report')
  .description('Generate sample report from existing harvest results')
  .option('-i, --input <file>', 'Input harvest results file (JSON)', 'harvest-results.json')
  .option('-o, --output <file>', 'Output report file', 'harvest-report.md')
  .option('--title <title>', 'Report title', 'Evidence Log Analysis Report')
  .option('--desc <desc>', 'Report description', 'Comprehensive analysis of harvested evidence logs')
  .option('--sections <sections>', 'Comma-separated list of sections to include', (value) => value.split(','))
  .option('--max-entries <number>', 'Maximum entries per section', (value) => parseInt(value))
  .option('--include-previews', 'Include file previews in report')
  .action(async (options: any) => {
    try {
      console.log(`📄 Generating sample report from: ${options.input}`);

      // Read harvest results
      if (!existsSync(options.input)) {
        console.error(`❌ Input file not found: ${options.input}`);
        process.exit(1);
      }

      const resultsData = require(join(process.cwd(), options.input));
      const results = resultsData as Awaited<ReturnType<typeof EvidenceLogHarvester.harvest>>;

      // Generate report
      const reportConfig: SampleReportConfig = {
        title: options.title,
        description: options.desc,
        sections: options.sections || ['summary', 'timeline', 'task-breakdown', 'content-analysis'],
        maxEntriesPerSection: options.maxEntries,
        includePreviews: options.includePreviews,
      };

      const report = EvidenceLogHarvester.generateSampleReport(results, reportConfig);
      writeFileSync(options.output, report);

      console.log(`✅ Sample report generated: ${options.output}`);
      console.log(`📊 Report includes ${results.entries.length} evidence log entries`);

    } catch (error) {
      console.error('❌ Report generation failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('analyze')
  .description('Analyze a single evidence log file')
  .argument('<file>', 'File to analyze')
  .option('-p, --pattern <pattern>', 'Extraction pattern to use', 'evidence-logs')
  .option('-v, --verbose', 'Verbose output')
  .action(async (file: string, options: any) => {
    try {
      console.log(`🔍 Analyzing evidence log: ${file}`);

      if (!existsSync(file)) {
        console.error(`❌ File not found: ${file}`);
        process.exit(1);
      }

      // Find matching pattern
      const pattern = DEFAULT_EXTRACTION_PATTERNS.find(p => p.name === options.pattern);
      if (!pattern) {
        console.error(`❌ Pattern not found: ${options.pattern}`);
        console.log('Available patterns:', DEFAULT_EXTRACTION_PATTERNS.map(p => p.name).join(', '));
        process.exit(1);
      }

      // Create single-file harvest config
      const config: HarvestConfig = {
        baseDirs: ['.'],
        patterns: [pattern],
        maxFiles: 1,
      };

      const results = await EvidenceLogHarvester.harvest(config);
      const entry = results.entries.find(e => e.path === file);

      if (!entry) {
        console.error('❌ Failed to analyze file');
        process.exit(1);
      }

      console.log(`📋 Analysis Results for: ${entry.name}`);
      console.log(`📊 Type: ${entry.type} | Size: ${(entry.size / 1024).toFixed(1)}KB`);
      console.log(`📅 Modified: ${new Date(entry.modifiedAt).toISOString()}`);
      console.log(`🎯 Task ID: ${entry.taskId || 'Not detected'}`);
      console.log(`📆 Date: ${entry.date || 'Not detected'}`);
      console.log('');

      if (Object.keys(entry.metadata).length > 0) {
        console.log('📝 Extracted Metadata:');
        Object.entries(entry.metadata).forEach(([key, value]) => {
          console.log(`  ${key}: ${JSON.stringify(value)}`);
        });
        console.log('');
      }

      if (options.verbose && entry.preview) {
        console.log('📖 Content Preview:');
        console.log(entry.preview);
        console.log('');
      }

      console.log('✅ Analysis complete');

    } catch (error) {
      console.error('❌ Analysis failed:', error instanceof Error ? error.message : 'Unknown error');
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
 * Display harvest results in a formatted way
 */
function displayHarvestResults(results: Awaited<ReturnType<typeof EvidenceLogHarvester.harvest>>, verbose: boolean = false): void {
  console.log(`\n📊 Harvest Complete:`);
  console.log(`🔍 Total Scanned: ${results.totalScanned}`);
  console.log(`✅ Processed: ${results.processed}`);
  console.log(`🚫 Filtered: ${results.filtered}`);
  console.log(`❌ Errors: ${results.errors.length}`);

  if (results.summary.dateRange.earliest && results.summary.dateRange.latest) {
    const earliest = new Date(results.summary.dateRange.earliest).toISOString().split('T')[0];
    const latest = new Date(results.summary.dateRange.latest).toISOString().split('T')[0];
    console.log(`📅 Date Range: ${earliest} to ${latest}`);
  }

  console.log(`\n📋 Content Breakdown:`);
  Object.entries(results.summary.byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  if (Object.keys(results.summary.byTask).length > 0) {
    console.log(`\n🎯 Top Tasks:`);
    Object.entries(results.summary.byTask)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .forEach(([taskId, count]) => {
        console.log(`  ${taskId}: ${count} files`);
      });
  }

  if (verbose && results.entries.length > 0) {
    console.log(`\n📁 Recent Files (${Math.min(5, results.entries.length)}):`);
    results.entries.slice(0, 5).forEach(entry => {
      const date = new Date(entry.modifiedAt).toISOString().split('T')[0];
      console.log(`  ${date} - ${entry.name} (${entry.type}, ${(entry.size / 1024).toFixed(1)}KB)`);
    });
  }

  if (results.errors.length > 0) {
    console.log(`\n⚠️  Errors (${results.errors.length}):`);
    results.errors.slice(0, 5).forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });

    if (results.errors.length > 5) {
      console.log(`  ... and ${results.errors.length - 5} more`);
    }
  }
}
