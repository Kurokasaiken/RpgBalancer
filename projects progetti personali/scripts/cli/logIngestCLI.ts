#!/usr/bin/env node

/**
 * Punch Club Log Ingest CLI
 * 
 * Command-line interface for ingesting and processing Punch Club telemetry logs.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { performance } from 'perf_hooks';
import { punchClubLogProcessor } from '@/analytics/punchClubLogProcessor';
import type { LogProcessingOptions, ProcessingStats, KPIs } from '@/analytics/punchClubLogProcessor';

/**
 * CLI configuration
 */
interface CLIConfig {
  inputFile?: string;
  outputFile?: string;
  format?: 'json' | 'csv' | 'sessions-csv';
  startDate?: string;
  endDate?: string;
  sessionId?: string;
  eventType?: string;
  source?: string;
  minConfidence?: number;
  maxEntries?: number;
  sortOrder?: 'asc' | 'desc';
  sortField?: 'timestamp' | 'eventType' | 'sessionId';
  verbose?: boolean;
  progress?: boolean;
  evidence?: string;
}

/**
 * Progress bar for large file processing
 */
class ProgressBar {
  private total: number;
  private current: number;
  private width: number;
  private startTime: number;

  constructor(total: number, width: number = 50) {
    this.total = total;
    this.width = width;
    this.current = 0;
    this.startTime = Date.now();
  }

  update(current: number): void {
    this.current = current;
    const percentage = Math.round((current / this.total) * 100);
    const filled = Math.round((percentage / 100) * this.width);
    const empty = this.width - filled;
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const elapsed = Date.now() - this.startTime;
    const eta = elapsed > 0 ? (this.total - current) * (elapsed / current) : 0;
    
    process.stdout.write(`\r[${bar}] ${percentage}% ${current}/${this.total} ETA: ${eta}ms`);
  }

  finish(): void {
    this.update(this.total);
    process.stdout.write('\n');
  }
}

/**
 * Parse date string to timestamp
 */
function parseDate(dateString: string): number {
  const date = new Date(dateString);
  return date.getTime();
}

/**
 * Create evidence log content
 */
function createEvidenceLog(
  config: CLIConfig,
  stats: ProcessingStats,
  kpis: KPIs,
  processingTime: number
): string {
  const timestamp = new Date().toISOString();
  
  return `# Punch Club Session Log Ingest - Evidence Log
Generated: ${timestamp}

## Configuration
- Input File: ${config.inputFile || 'stdin'}
- Output Format: ${config.format || 'json'}
- Date Range: ${config.startDate || 'All'} - ${config.endDate || 'All'}
- Session Filter: ${config.sessionId || 'All'}
- Event Type Filter: ${config.eventType || 'All'}
- Source Filter: ${config.source || 'All'}
- Max Entries: ${config.maxEntries || 'All'}

## Processing Statistics
- Total Entries: ${stats.totalEntries.toLocaleString()}
- Processed Entries: ${stats.processedEntries.toLocaleString()}
- Invalid Entries: ${stats.invalidEntries.toLocaleString()}
- Filtered Entries: ${stats.filteredEntries.toLocaleString()}
- Sessions Found: ${stats.sessionsFound.toLocaleString()}
- Tags Found: ${stats.tagsFound.toLocaleString()}
- Processing Time: ${processingTime}ms
- Processing Rate: ${stats.processingTime > 0 ? Math.round(stats.totalEntries / (stats.processingTime / 1000)).toLocaleString() : 0} entries/sec

## KPIs
- Total Sessions: ${kpis.totalSessions.toLocaleString()}
- Average Session Duration: ${Math.round(kpis.averageSessionDuration / 1000)}s
- Total Combats: ${kpis.totalCombats.toLocaleString()}
- Overall Win Rate: ${(kpis.overallWinRate * 100).toFixed(1)}%
- Total Tags: ${kpis.totalTags.toLocaleString()}
- Average Tags per Session: ${kpis.averageTagsPerSession.toFixed(2)}

## Top Event Types
${kpis.topEventTypes.map(({ type, count }: { type: string; count: number }) => `- ${type}: ${count.toLocaleString()}`).join('\n')}

## Event Type Distribution
${Object.entries(kpis.eventTypes).map(([type, count]) => `- ${type}: ${(count as number).toLocaleString()}`).join('\n')}

## Tag Distribution
${Object.entries(kpis.tagsByType).map(([type, count]) => `- ${type}: ${(count as number).toLocaleString()}`).join('\n')}

## Sessions by Date
${Object.entries(kpis.sessionsByDate).map(([date, count]) => `- ${date}: ${(count as number).toLocaleString()} sessions`).join('\n')}

## Errors
${stats.errors.length > 0 ? stats.errors.map(error => `- ${error}`).join('\n') : 'None'}

---
CLI completed successfully.
`;
}

/**
 * Main CLI program
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  
  // Parse options
  const config: CLIConfig = {};
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '-i':
      case '--input':
        config.inputFile = args[++i];
        break;
      case '-o':
      case '--output':
        config.outputFile = args[++i];
        break;
      case '-f':
      case '--format':
        config.format = args[++i] as 'json' | 'csv' | 'sessions-csv';
        break;
      case '--start-date':
        config.startDate = args[++i];
        break;
      case '--end-date':
        config.endDate = args[++i];
        break;
      case '--session-id':
        config.sessionId = args[++i];
        break;
      case '--event-type':
        config.eventType = args[++i];
        break;
      case '--source':
        config.source = args[++i];
        break;
      case '--min-confidence':
        config.minConfidence = parseFloat(args[++i]);
        break;
      case '--max-entries':
        config.maxEntries = parseInt(args[++i]);
        break;
      case '--sort':
        config.sortOrder = args[++i] as 'asc' | 'desc';
        break;
      case '--sort-field':
        config.sortField = args[++i] as 'timestamp' | 'eventType' | 'sessionId';
        break;
      case '-v':
      case '--verbose':
        config.verbose = true;
        break;
      case '--progress':
        config.progress = true;
        break;
      case '--evidence':
        config.evidence = args[++i];
        break;
    }
  }

  try {
    switch (command) {
      case 'ingest':
        await handleIngest(config);
        break;
      case 'validate':
        await handleValidate(config);
        break;
      case 'export':
        await handleExport(config);
        break;
      case 'kpi':
        await handleKPI(config);
        break;
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

/**
 * Show help
 */
function showHelp(): void {
  console.log(`
Punch Club Log Ingest CLI

Usage: punch-club-log-ingest <command> [options]

Commands:
  ingest     Ingest and process logs
  validate   Validate log file format
  export     Export processed data
  kpi        Calculate and display KPIs

Options:
  -i, --input <file>           Input log file (JSON line-delimited)
  -o, --output <file>          Output file (default: stdout)
  -f, --format <format>        Output format: json, csv, sessions-csv
  --start-date <date>          Start date filter (YYYY-MM-DD or ISO timestamp)
  --end-date <date>            End date filter (YYYY-MM-DD or ISO timestamp)
  --session-id <id>            Filter by session ID
  --event-type <type>          Filter by event type (supports wildcards)
  --source <source>            Filter by source
  --min-confidence <number>    Minimum confidence level for tags (0-1)
  --max-entries <number>       Maximum entries to process
  --sort <order>               Sort order: asc, desc
  --sort-field <field>         Sort field: timestamp, eventType, sessionId
  -v, --verbose                Verbose output
  --progress                   Show progress bar for large files
  --evidence <file>            Generate evidence log file

Examples:
  punch-club-log-ingest ingest -i logs.json -o output.json
  punch-club-log-ingest validate -i logs.json
  punch-club-log-ingest kpi -i logs.json --start-date 2024-01-01
  punch-club-log-ingest export -i logs.json -f csv -o export.csv
`);
}

/**
 * Handle ingest command
 */
async function handleIngest(config: CLIConfig): Promise<void> {
  console.log('🔄 Starting log ingestion...');
  
  let logData: string;
  
  // Read input file or use stdin
  if (config.inputFile) {
    if (!existsSync(config.inputFile)) {
      throw new Error(`Input file not found: ${config.inputFile}`);
    }
    logData = readFileSync(config.inputFile, 'utf8');
    console.log(`📖 Reading from: ${config.inputFile}`);
  } else {
    console.log('📖 Reading from stdin (Ctrl+D to finish)...');
    logData = await new Promise((resolve) => {
      let data = '';
      process.stdin.on('data', chunk => {
        data += chunk;
      });
      process.stdin.on('end', () => resolve(data));
    });
  }

  // Parse processing options
  const processingOptions: LogProcessingOptions = {};
  
  if (config.startDate) {
    processingOptions.startDate = parseDate(config.startDate);
  }
  
  if (config.endDate) {
    processingOptions.endDate = parseDate(config.endDate);
  }
  
  if (config.sessionId) {
    processingOptions.sessionId = config.sessionId;
  }
  
  if (config.eventType) {
    processingOptions.eventType = config.eventType;
  }
  
  if (config.source) {
    processingOptions.source = config.source;
  }
  
  if (config.minConfidence) {
    processingOptions.minConfidence = config.minConfidence;
  }
  
  if (config.maxEntries) {
    processingOptions.maxEntries = config.maxEntries;
  }
  
  if (config.sortOrder) {
    processingOptions.sortOrder = config.sortOrder;
  }
  
  if (config.sortField) {
    processingOptions.sortField = config.sortField;
  }

  // Show progress bar for large files
  let progressBar: ProgressBar | undefined;
  if (config.progress && logData.length > 10000) {
    const lineCount = logData.split('\n').length;
    progressBar = new ProgressBar(lineCount);
  }

  // Process logs
  punchClubLogProcessor.processLogs(logData, processingOptions);
  
  if (progressBar) {
    progressBar.finish();
  }

  // Display results
  const stats = punchClubLogProcessor.getStats();
  const kpis = punchClubLogProcessor.calculateKPIs();
  
  console.log(`✅ Processing completed!`);
  console.log(`📊 Processed: ${stats.processedEntries.toLocaleString()} entries`);
  console.log(`📊 Sessions found: ${stats.sessionsFound.toLocaleString()}`);
  console.log(`📊 Tags found: ${stats.tagsFound.toLocaleString()}`);
  console.log(`⏱️  Processing time: ${stats.processingTimeMs}ms`);
  
  if (stats.errors.length > 0) {
    console.log(`⚠️  Errors: ${stats.errors.length}`);
    if (config.verbose) {
      console.log('Errors:');
      stats.errors.forEach(error => console.log(`  - ${error}`));
    }
  }

  // Generate evidence log if requested
  if (config.evidence) {
    const evidenceLog = createEvidenceLog(config, stats, kpis, stats.processingTimeMs);
    writeFileSync(config.evidence, evidenceLog, 'utf8');
    console.log(`📋 Evidence log saved to: ${config.evidence}`);
  }

  // Auto-save if output file specified
  if (config.outputFile) {
    const output = config.format === 'csv' 
      ? punchClubLogProcessor.exportToCSV()
      : config.format === 'sessions-csv'
      ? punchClubLogProcessor.exportSessionsToCSV()
      : punchClubLogProcessor.exportToJSON();
    
    writeFileSync(config.outputFile, output, 'utf8');
    console.log(`💾 Results saved to: ${config.outputFile}`);
  }
}

/**
 * Handle validate command
 */
async function handleValidate(config: CLIConfig): Promise<void> {
  if (!config.inputFile) {
    throw new Error('Input file is required for validation');
  }

  console.log('🔍 Validating log file format...');
  
  if (!existsSync(config.inputFile)) {
    throw new Error(`Input file not found: ${config.inputFile}`);
  }

  const logData = readFileSync(config.inputFile, 'utf8');
  const lines = logData.split('\n').filter(line => line.trim());
  
  console.log(`📊 File lines: ${lines.length.toLocaleString()}`);
  
  let validCount = 0;
  let invalidCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      const entry = JSON.parse(lines[i]);
      
      // Basic validation
      if (!entry.timestamp || !entry.eventType) {
        invalidCount++;
        errors.push(`Line ${i + 1}: Missing required fields (timestamp, eventType)`);
        continue;
      }
      
      // Timestamp validation
      if (typeof entry.timestamp !== 'number' || entry.timestamp < 0) {
        invalidCount++;
        errors.push(`Line ${i + 1}: Invalid timestamp: ${entry.timestamp}`);
        continue;
      }
      
      // Event type validation
      if (typeof entry.eventType !== 'string' || entry.eventType.trim() === '') {
        invalidCount++;
        errors.push(`Line ${i + 1}: Invalid event type: ${entry.eventType}`);
        continue;
      }
      
      validCount++;
    } catch (error) {
      invalidCount++;
      errors.push(`Line ${i + 1}: JSON parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log(`✅ Validation completed!`);
  console.log(`✅ Valid entries: ${validCount.toLocaleString()}`);
  console.log(`❌ Invalid entries: ${invalidCount.toLocaleString()}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Validation Errors:');
    errors.forEach(error => console.log(`  ${error}`));
  }

  if (invalidCount === 0) {
    console.log('🎉 Log file is valid!');
  } else {
    console.log('⚠️  Log file has issues that need to be fixed.');
    process.exit(1);
  }
}

/**
 * Handle export command
 */
async function handleExport(config: CLIConfig): Promise<void> {
  const stats = punchClubLogProcessor.getStats();
  
  if (stats.processedEntries === 0) {
    console.log('⚠️ No data to export. Run ingest command first.');
    return;
  }

  console.log(`📤 Exporting data in ${config.format} format...`);
  
  let output: string;
  
  switch (config.format) {
    case 'csv':
      output = punchClubLogProcessor.exportToCSV();
      break;
    case 'sessions-csv':
      output = punchClubLogProcessor.exportSessionsToCSV();
      break;
    case 'json':
    default:
      output = punchClubLogProcessor.exportToJSON();
      break;
  }

  if (config.outputFile) {
    writeFileSync(config.outputFile, output, 'utf8');
    console.log(`💾 Export saved to: ${config.outputFile}`);
  } else {
    console.log(output);
  }
}

/**
 * Handle KPI command
 */
async function handleKPI(config: CLIConfig): Promise<void> {
  const stats = punchClubLogProcessor.getStats();
  
  if (stats.processedEntries === 0) {
    console.log('⚠️ No data available. Run ingest command first.');
    return;
  }

  const kpis = punchClubLogProcessor.calculateKPIs();
  
  console.log('📊 Punch Club Session KPI Report');
  console.log('='.repeat(50));
  
  console.log('\n📈 Session Overview');
  console.log(`Total Sessions: ${kpis.totalSessions.toLocaleString()}`);
  console.log(`Average Duration: ${Math.round(kpis.averageSessionDuration / 1000)}s`);
  console.log(`Total Combats: ${kpis.totalCombats.toLocaleString()}`);
  console.log(`Overall Win Rate: ${(kpis.overallWinRate * 100).toFixed(1)}%`);
  
  console.log('\n🏷️ Tag Analysis');
  console.log(`Total Tags: ${kpis.totalTags.toLocaleString()}`);
  console.log(`Average Tags/Session: ${kpis.averageTagsPerSession.toFixed(2)}`);
  
  if (Object.keys(kpis.tagsByType).length > 0) {
    console.log('\n📊 Tag Distribution:');
    Object.entries(kpis.tagsByType)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${(count as number).toLocaleString()} (${(((count as number) / kpis.totalTags * 100).toFixed(1)}%)`);
      });
  }
  
  if (Object.keys(kpis.eventTypes).length > 0) {
    console.log('\n📊 Event Types:');
    Object.entries(kpis.eventTypes)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${(count as number).toLocaleString()} (${(((count as number) / stats.processedEntries * 100).toFixed(1)}%)`);
      });
  }
  
  if (Object.keys(kpis.sessionsByDate).length > 0) {
    console.log('\n📅 Sessions by Date:');
    Object.entries(kpis.sessionsByDate)
      .sort(([, a], [, b]) => new Date(a as string).getTime() - new Date(b as string).getTime())
      .forEach(([date, count]) => {
        console.log(`  ${date}: ${(count as number).toLocaleString()} sessions`);
      });
  }
  
  console.log('\n🎯 Top 10 Event Types:');
  kpis.topEventTypes.forEach(({ type, count }: { type: string; count: number }) => {
    console.log(`  ${type}: ${count.toLocaleString()} (${((count / stats.processedEntries * 100).toFixed(1)}%)`);
  });
  
  console.log('\n📈 Performance Metrics');
  console.log(`Processing Rate: ${Math.round(stats.processedEntries / (stats.processingTimeMs / 1000)).toLocaleString()} entries/sec`);
}

// Run the CLI
if (require.main === module) {
  main().catch(console.error);
}
