#!/usr/bin/env tsx

/**
 * Guardian Evidence Indexer CLI
 * 
 * Command-line tool for indexing Guardian evidence logs and generating
 * searchable catalogs with filtering and validation capabilities.
 * 
 * @since NP-058 – Guardian Evidence Indexer
 */

import { readFile, writeFile, readdir, stat, mkdir } from 'fs/promises';
import { join, extname, basename, dirname } from 'path';
import { program } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import type {
  EvidenceEntry,
  EvidenceIndexerConfig,
  IndexStatistics,
  EvidenceFilter,
} from '../../src/analytics/guardian/EvidenceIndexer';
import {
  DEFAULT_EVIDENCE_INDEXER_CONFIG,
  createSafeEvidenceIndexerConfig,
  parseEvidenceLog,
  filterEvidenceEntries,
  calculateIndexStatistics,
  validateEvidenceEntry,
} from '../../src/analytics/guardian/EvidenceIndexer';

/**
 * CLI options
 */
interface CliOptions {
  input: string;
  output?: string;
  format: 'json' | 'markdown' | 'csv';
  config?: string;
  prompt?: string;
  agent?: string;
  status?: string;
  date?: string;
  tags?: string;
  safeguard?: string;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  verbose: boolean;
  stats: boolean;
  validate: boolean;
  refresh: boolean;
}

/**
 * Evidence Indexer class
 */
class EvidenceIndexer {
  private config: EvidenceIndexerConfig;
  private entries: EvidenceEntry[] = [];
  private statistics: IndexStatistics | null = null;

  constructor(config: EvidenceIndexerConfig) {
    this.config = config;
  }

  /**
   * Scan directory for evidence files
   */
  async scanDirectory(directory: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await readdir(directory, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(directory, entry.name);
        
        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          const subFiles = await this.scanDirectory(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          // Check if file matches include patterns
          const matches = this.config.includePatterns.some(pattern => 
            this.matchesPattern(entry.name, pattern)
          );
          
          // Check if file is not excluded
          const notExcluded = !this.config.excludePatterns.some(pattern => 
            this.matchesPattern(entry.name, pattern)
          );
          
          if (matches && notExcluded) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Failed to scan directory ${directory}:`, error));
    }
    
    return files;
  }

  /**
   * Check if filename matches pattern
   */
  private matchesPattern(filename: string, pattern: string): boolean {
    // Simple glob pattern matching
    const regex = new RegExp(
      pattern.replace(/\*/g, '.*').replace(/\?/g, '.')
    );
    return regex.test(filename);
  }

  /**
   * Parse all evidence files
   */
  async parseFiles(filePaths: string[]): Promise<EvidenceEntry[]> {
    const entries: EvidenceEntry[] = [];
    const errors: string[] = [];
    
    console.log(chalk.blue(`🔍 Parsing ${filePaths.length} evidence files...`));
    
    for (const filePath of filePaths) {
      try {
        // Check file size
        const fileStats = await stat(filePath);
        if (fileStats.size > this.config.maxFileSize) {
          console.warn(chalk.yellow(`Skipping large file: ${filePath} (${fileStats.size} bytes)`));
          continue;
        }
        
        // Parse evidence log
        const partialEntry = await parseEvidenceLog(filePath);
        if (partialEntry) {
          // Validate entry
          if (this.config.strictValidation && !validateEvidenceEntry(partialEntry)) {
            errors.push(`Invalid entry format: ${filePath}`);
            continue;
          }
          
          entries.push(partialEntry as EvidenceEntry);
        } else {
          errors.push(`Failed to parse: ${filePath}`);
        }
      } catch (error) {
        errors.push(`Error processing ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    if (errors.length > 0) {
      console.log(chalk.yellow(`⚠️  ${errors.length} errors encountered:`));
      errors.slice(0, 10).forEach(error => console.log(chalk.red(`  - ${error}`)));
      if (errors.length > 10) {
        console.log(chalk.red(`  ... and ${errors.length - 10} more errors`));
      }
    }
    
    console.log(chalk.green(`✅ Successfully parsed ${entries.length} evidence entries`));
    return entries;
  }

  /**
   * Generate index
   */
  async generateIndex(directory: string): Promise<void> {
    console.log(chalk.blue('🚀 Starting evidence index generation...'));
    
    const startTime = Date.now();
    
    // Scan for files
    const files = await this.scanDirectory(directory);
    
    // Parse files
    this.entries = await this.parseFiles(files);
    
    // Calculate statistics
    this.statistics = calculateIndexStatistics(this.entries);
    this.statistics.indexGenerationTime = Date.now() - startTime;
    this.statistics.errors = this.statistics.errors || [];
    
    console.log(chalk.green(`📊 Index generation completed in ${this.statistics.indexGenerationTime}ms`));
  }

  /**
   * Filter entries based on CLI options
   */
  filterEntries(options: CliOptions): EvidenceEntry[] {
    const filter: EvidenceFilter = {};
    
    if (options.prompt) {
      filter.promptId = options.prompt;
    }
    
    if (options.agent) {
      filter.agent = options.agent;
    }
    
    if (options.status) {
      filter.status = options.status as any;
    }
    
    if (options.date) {
      // Parse date range (e.g., "2026-01-01,2026-01-31")
      const [start, end] = options.date.split(',');
      if (start && end) {
        filter.dateRange = {
          start: new Date(start).getTime(),
          end: new Date(end).getTime(),
        };
      } else {
        // Single date - filter for that day
        const date = new Date(options.date);
        filter.dateRange = {
          start: date.setHours(0, 0, 0, 0),
          end: date.setHours(23, 59, 59, 999),
        };
      }
    }
    
    if (options.tags) {
      filter.tags = options.tags.split(',').map(t => t.trim());
    }
    
    if (options.safeguard) {
      filter.safeguardStatus = options.safeguard as any;
    }
    
    if (options.limit) {
      filter.limit = options.limit;
    }
    
    if (options.sort) {
      filter.sortBy = options.sort as any;
    }
    
    if (options.order) {
      filter.sortOrder = options.order;
    }
    
    return filterEvidenceEntries(this.entries, filter);
  }

  /**
   * Export index to JSON
   */
  exportToJson(filteredEntries: EvidenceEntry[] = this.entries): string {
    const exportData = {
      config: this.config,
      entries: filteredEntries,
      statistics: this.statistics,
      exportedAt: new Date().toISOString(),
      totalEntries: filteredEntries.length,
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export index to Markdown
   */
  exportToMarkdown(filteredEntries: EvidenceEntry[] = this.entries): string {
    if (!this.statistics) {
      return '# No data available';
    }

    const markdown = `# Guardian Evidence Index

**Generated:** ${new Date().toLocaleString()}  
**Total Entries:** ${filteredEntries.length}  
**Index Generation Time:** ${this.statistics.indexGenerationTime}ms

## Statistics

### Overview
| Metric | Value |
|---|---|
| Total Entries | ${this.statistics.totalEntries} |
| Completed | ${this.statistics.entriesByStatus.completato} |
| In Progress | ${this.statistics.entriesByStatus.in_corso} |
| Not Assigned | ${this.statistics.entriesByStatus.non_assegnato} |
| Failed | ${this.statistics.entriesByStatus.failed} |
| Safeguard Pass Rate | ${this.statistics.safeguardPassRate.toFixed(1)}% |
| Average File Size | ${(this.statistics.averageFileSize / 1024).toFixed(1)}KB |

### By Agent
${Object.entries(this.statistics.entriesByAgent)
  .sort(([,a], [,b]) => b - a)
  .map(([agent, count]) => `- **${agent}**: ${count} entries`)
  .join('\n')}

### By Prompt Type
${Object.entries(this.statistics.entriesByPrompt)
  .sort(([,a], [,b]) => b - a)
  .map(([prompt, count]) => `- **${prompt}**: ${count} entries`)
  .join('\n')}

## Evidence Entries

| ID | Prompt | Agent | Status | Created | File Size | Safeguards |
|---|---|---|---|---|---|---|
${filteredEntries.map(entry => {
  const created = new Date(entry.createdAt).toLocaleDateString();
  const fileSize = `${(entry.fileSize / 1024).toFixed(1)}KB`;
  const safeguardStatus = entry.safeguards.filter(s => s.status === 'pass').length + '/' + entry.safeguards.length;
  
  return `| ${entry.promptId} | ${entry.promptTitle} | ${entry.agent} | ${entry.status} | ${created} | ${fileSize} | ${safeguardStatus} |`;
}).join('\n')}

## Recent Activity

${filteredEntries
  .sort((a, b) => b.createdAt - a.createdAt)
  .slice(0, 10)
  .map(entry => {
    const date = new Date(entry.createdAt).toLocaleString();
    const status = entry.status === 'completato' ? '✅' : 
                   entry.status === 'in_corso' ? '🔄' : 
                   entry.status === 'failed' ? '❌' : '⏳';
    
    return `${status} **${entry.promptId}** - ${entry.promptTitle} (${entry.agent}) - ${date}`;
  }).join('\n')}

---
*Generated by Guardian Evidence Indexer*
`;
    return markdown;
  }

  /**
   * Export index to CSV
   */
  exportToCsv(filteredEntries: EvidenceEntry[] = this.entries): string {
    const headers = [
      'ID',
      'Prompt ID',
      'Prompt Title',
      'Agent',
      'Status',
      'Created At',
      'Completed At',
      'File Path',
      'File Size',
      'Safeguard Count',
      'Pass Rate',
      'Tags',
    ];
    
    const rows = filteredEntries.map(entry => {
      const passRate = entry.safeguards.length > 0 
        ? (entry.safeguards.filter(s => s.status === 'pass').length / entry.safeguards.length * 100).toFixed(1)
        : '0';
      
      return [
        entry.id,
        entry.promptId,
        entry.promptTitle,
        entry.agent,
        entry.status,
        new Date(entry.createdAt).toISOString(),
        entry.completedAt ? new Date(entry.completedAt).toISOString() : '',
        entry.logPath,
        entry.fileSize.toString(),
        entry.safeguards.length.toString(),
        `${passRate}%`,
        entry.tags.join(';'),
      ];
    });
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Display statistics table
   */
  displayStatistics(): void {
    if (!this.statistics) {
      console.log(chalk.yellow('No statistics available'));
      return;
    }

    console.log(chalk.bold.blue('\n📊 Evidence Index Statistics'));
    
    // Overview table
    const overviewTable = new Table({
      head: [chalk.cyan('Metric'), chalk.cyan('Value')],
      colWidths: [25, 15],
    });

    overviewTable.push(
      ['Total Entries', this.statistics.totalEntries.toString()],
      ['Completed', this.statistics.entriesByStatus.completato.toString()],
      ['In Progress', this.statistics.entriesByStatus.in_corso.toString()],
      ['Not Assigned', this.statistics.entriesByStatus.non_assegnato.toString()],
      ['Failed', this.statistics.entriesByStatus.failed.toString()],
      ['Pass Rate', `${this.statistics.safeguardPassRate.toFixed(1)}%`],
      ['Avg File Size', `${(this.statistics.averageFileSize / 1024).toFixed(1)}KB`],
      ['Generation Time', `${this.statistics.indexGenerationTime}ms`],
    );

    console.log(overviewTable.toString());

    // Agent breakdown
    if (Object.keys(this.statistics.entriesByAgent).length > 0) {
      console.log(chalk.bold('\n👥 Agent Breakdown'));
      const agentTable = new Table({
        head: [chalk.cyan('Agent'), chalk.cyan('Entries')],
        colWidths: [20, 10],
      });

      Object.entries(this.statistics.entriesByAgent)
        .sort(([,a], [,b]) => b - a)
        .forEach(([agent, count]) => {
          agentTable.push([agent, count.toString()]);
        });

      console.log(agentTable.toString());
    }

    // Prompt breakdown
    if (Object.keys(this.statistics.entriesByPrompt).length > 0) {
      console.log(chalk.bold('\n📋 Prompt Breakdown'));
      const promptTable = new Table({
        head: [chalk.cyan('Prompt'), chalk.cyan('Entries')],
        colWidths: [15, 10],
      });

      Object.entries(this.statistics.entriesByPrompt)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10) // Top 10
        .forEach(([prompt, count]) => {
          promptTable.push([prompt, count.toString()]);
        });

      console.log(promptTable.toString());
    }
  }

  /**
   * Display filtered entries
   */
  displayEntries(entries: EvidenceEntry[], verbose: boolean = false): void {
    if (entries.length === 0) {
      console.log(chalk.yellow('No entries found matching the criteria'));
      return;
    }

    console.log(chalk.bold.blue(`\n📝 Found ${entries.length} evidence entries`));

    const table = new Table({
      head: [
        chalk.cyan('ID'),
        chalk.cyan('Prompt'),
        chalk.cyan('Agent'),
        chalk.cyan('Status'),
        chalk.cyan('Created'),
        chalk.cyan('Size'),
        verbose ? chalk.cyan('Safeguards') : null,
      ].filter(Boolean),
      colWidths: verbose ? [12, 20, 15, 12, 12, 8, 12] : [12, 20, 15, 12, 12, 8],
    });

    entries.forEach(entry => {
      const row = [
        entry.promptId,
        entry.promptTitle.length > 18 ? entry.promptTitle.substring(0, 18) + '...' : entry.promptTitle,
        entry.agent,
        entry.status,
        new Date(entry.createdAt).toLocaleDateString(),
        `${(entry.fileSize / 1024).toFixed(1)}KB`,
      ];

      if (verbose) {
        const passCount = entry.safeguards.filter(s => s.status === 'pass').length;
        const totalCount = entry.safeguards.length;
        row.push(`${passCount}/${totalCount}`);
      }

      table.push(row);
    });

    console.log(table.toString());
  }

  /**
   * Save index to file
   */
  async saveToFile(content: string, filePath: string): Promise<void> {
    try {
      // Create directory if it doesn't exist
      await mkdir(dirname(filePath), { recursive: true });
      
      await writeFile(filePath, content, 'utf-8');
      console.log(chalk.green(`✅ Index saved to: ${filePath}`));
    } catch (error) {
      console.error(chalk.red(`Failed to save index: ${error}`));
      throw error;
    }
  }
}

/**
 * Main CLI function
 */
async function main() {
  program
    .name('evidence-indexer')
    .description('Guardian Evidence Indexer - Index and search Guardian evidence logs')
    .version('1.0.0');

  program
    .requiredOption('-i, --input <path>', 'Input directory containing evidence logs')
    .option('-o, --output <path>', 'Output file path (default: stdout)')
    .option('-f, --format <format>', 'Output format', 'table')
    .option('-c, --config <path>', 'Custom configuration file')
    .option('-p, --prompt <prompt>', 'Filter by prompt ID (e.g., NP-058)')
    .option('-a, --agent <agent>', 'Filter by agent name')
    .option('-s, --status <status>', 'Filter by status (completato|in_corso|non_assegnato|failed)')
    .option('-d, --date <date>', 'Filter by date or date range (YYYY-MM-DD or YYYY-MM-DD,YYYY-MM-DD)')
    .option('-t, --tags <tags>', 'Filter by tags (comma-separated)')
    .option('--safeguard <status>', 'Filter by safeguard status (pass|fail|warning)')
    .option('-l, --limit <number>', 'Limit number of results')
    .option('--sort <field>', 'Sort by field (createdAt|completedAt|promptId|fileSize)')
    .option('--order <order>', 'Sort order (asc|desc)', 'desc')
    .option('-v, --verbose', 'Verbose output')
    .option('--stats', 'Show statistics only')
    .option('--validate', 'Validate entries strictly')
    .option('--refresh', 'Force refresh of cached data');

  program.parse();

  const options = program.opts() as CliOptions;

  try {
    // Load configuration
    let config = DEFAULT_EVIDENCE_INDEXER_CONFIG;
    if (options.config && await stat(options.config).catch(() => null)) {
      const configData = JSON.parse(await readFile(options.config, 'utf-8'));
      config = createSafeEvidenceIndexerConfig(configData);
    }

    // Apply CLI overrides
    if (options.validate) {
      config.strictValidation = true;
    }

    // Create indexer
    const indexer = new EvidenceIndexer(config);

    // Generate index
    await indexer.generateIndex(options.input);

    // Filter entries if filters are provided
    let filteredEntries = indexer.entries;
    if (options.prompt || options.agent || options.status || options.date || options.tags || options.safeguard) {
      filteredEntries = indexer.filterEntries(options);
    }

    // Apply limit and sorting
    if (options.sort || options.order || options.limit) {
      filteredEntries = indexer.filterEntries(options);
    }

    // Output based on format
    switch (options.format) {
      case 'json':
        const jsonOutput = indexer.exportToJson(filteredEntries);
        if (options.output) {
          await indexer.saveToFile(jsonOutput, options.output);
        } else {
          console.log(jsonOutput);
        }
        break;

      case 'markdown':
        const mdOutput = indexer.exportToMarkdown(filteredEntries);
        if (options.output) {
          await indexer.saveToFile(mdOutput, options.output);
        } else {
          console.log(mdOutput);
        }
        break;

      case 'csv':
        const csvOutput = indexer.exportToCsv(filteredEntries);
        if (options.output) {
          await indexer.saveToFile(csvOutput, options.output);
        } else {
          console.log(csvOutput);
        }
        break;

      case 'table':
      default:
        if (options.stats) {
          indexer.displayStatistics();
        } else {
          indexer.displayEntries(filteredEntries, options.verbose);
          if (options.verbose) {
            indexer.displayStatistics();
          }
        }
        break;
    }

  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run CLI
if (require.main === module) {
  main().catch(console.error);
}

export { EvidenceIndexer };
