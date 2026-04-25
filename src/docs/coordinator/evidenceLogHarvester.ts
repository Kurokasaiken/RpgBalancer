/**
 * Coordinator Evidence Log Harvester
 *
 * Automated system for harvesting evidence logs from various locations,
 * with configurable extraction patterns and sample report generation.
 *
 * @module evidenceLogHarvester
 * @since 2026-01-13
 * @author Cascade
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';
import { glob } from 'glob';

/**
 * Evidence log entry
 */
export interface EvidenceLogEntry {
  /** File path */
  path: string;
  /** File name */
  name: string;
  /** File extension */
  extension: string;
  /** File size in bytes */
  size: number;
  /** Last modified timestamp */
  modifiedAt: number;
  /** Task ID (extracted from filename) */
  taskId?: string;
  /** Date (extracted from filename) */
  date?: string;
  /** Log type */
  type: 'evidence' | 'report' | 'data' | 'unknown';
  /** Content preview (first 500 characters) */
  preview: string;
  /** Parsed metadata */
  metadata: Record<string, unknown>;
}

/**
 * Extraction pattern for log parsing
 */
export interface ExtractionPattern {
  /** Pattern name */
  name: string;
  /** File pattern (glob) */
  filePattern: string;
  /** Content patterns to extract */
  contentPatterns: {
    /** Pattern name */
    name: string;
    /** Regex pattern */
    pattern: RegExp;
    /** Whether this is required */
    required: boolean;
    /** Transform function for extracted data */
    transform?: (match: RegExpMatchArray) => unknown;
  }[];
  /** Metadata extraction function */
  metadataExtractor?: (content: string, filename: string) => Record<string, unknown>;
}

/**
 * Harvest configuration
 */
export interface HarvestConfig {
  /** Base directories to scan */
  baseDirs: string[];
  /** Extraction patterns */
  patterns: ExtractionPattern[];
  /** Maximum files to process */
  maxFiles?: number;
  /** File size limit (bytes) */
  maxFileSize?: number;
  /** Date range filter */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** Task ID filter */
  taskIds?: string[];
  /** Content type filter */
  contentTypes?: ('evidence' | 'report' | 'data')[];
}

/**
 * Harvest results
 */
export interface HarvestResults {
  /** Total files scanned */
  totalScanned: number;
  /** Files processed */
  processed: number;
  /** Files filtered out */
  filtered: number;
  /** Errors encountered */
  errors: string[];
  /** Extracted log entries */
  entries: EvidenceLogEntry[];
  /** Summary statistics */
  summary: {
    byType: Record<string, number>;
    byExtension: Record<string, number>;
    byTask: Record<string, number>;
    dateRange: {
      earliest: number | null;
      latest: number | null;
    };
  };
}

/**
 * Sample report configuration
 */
export interface SampleReportConfig {
  /** Report title */
  title: string;
  /** Report description */
  description: string;
  /** Sections to include */
  sections: ('summary' | 'timeline' | 'task-breakdown' | 'content-analysis' | 'errors')[];
  /** Maximum entries per section */
  maxEntriesPerSection?: number;
  /** Include file previews */
  includePreviews?: boolean;
}

/**
 * Evidence Log Harvester
 */
export class EvidenceLogHarvester {
  private static readonly DEFAULT_CONFIG: Partial<HarvestConfig> = {
    maxFiles: 1000,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  };

  /**
   * Harvest evidence logs from specified locations
   */
  static async harvest(config: HarvestConfig): Promise<HarvestResults> {
    const fullConfig = { ...this.DEFAULT_CONFIG, ...config };
    const results: HarvestResults = {
      totalScanned: 0,
      processed: 0,
      filtered: 0,
      errors: [],
      entries: [],
      summary: {
        byType: {},
        byExtension: {},
        byTask: {},
        dateRange: { earliest: null, latest: null },
      },
    };

    try {
      // Collect all files matching patterns
      const allFiles: string[] = [];

      for (const baseDir of fullConfig.baseDirs) {
        for (const pattern of fullConfig.patterns) {
          try {
            const files = await glob(pattern.filePattern, {
              cwd: baseDir,
              absolute: true,
              followSymbolicLinks: false,
            });
            allFiles.push(...files);
          } catch (error) {
            results.errors.push(`Glob error for ${baseDir}/${pattern.filePattern}: ${error}`);
          }
        }
      }

      results.totalScanned = allFiles.length;

      // Process files
      for (const filePath of allFiles) {
        try {
          // Check file size limit
          const stats = statSync(filePath);
          if (fullConfig.maxFileSize && stats.size > fullConfig.maxFileSize) {
            results.filtered++;
            continue;
          }

          // Check date range
          if (fullConfig.dateRange) {
            const fileDate = stats.mtime;
            if (fileDate < fullConfig.dateRange.start || fileDate > fullConfig.dateRange.end) {
              results.filtered++;
              continue;
            }
          }

          // Process file
          const entry = await this.processFile(filePath, fullConfig.patterns);
          if (entry) {
            // Apply filters
            if (fullConfig.taskIds && entry.taskId && !fullConfig.taskIds.includes(entry.taskId)) {
              results.filtered++;
              continue;
            }

            if (fullConfig.contentTypes && !fullConfig.contentTypes.includes(entry.type)) {
              results.filtered++;
              continue;
            }

            results.entries.push(entry);
            results.processed++;

            // Update summary
            results.summary.byType[entry.type] = (results.summary.byType[entry.type] || 0) + 1;
            results.summary.byExtension[entry.extension] = (results.summary.byExtension[entry.extension] || 0) + 1;
            if (entry.taskId) {
              results.summary.byTask[entry.taskId] = (results.summary.byTask[entry.taskId] || 0) + 1;
            }

            // Update date range
            if (results.summary.dateRange.earliest === null || entry.modifiedAt < results.summary.dateRange.earliest) {
              results.summary.dateRange.earliest = entry.modifiedAt;
            }
            if (results.summary.dateRange.latest === null || entry.modifiedAt > results.summary.dateRange.latest) {
              results.summary.dateRange.latest = entry.modifiedAt;
            }

            // Check max files limit
            if (fullConfig.maxFiles && results.processed >= fullConfig.maxFiles) {
              break;
            }
          }
        } catch (error) {
          results.errors.push(`Error processing ${filePath}: ${error}`);
          results.filtered++;
        }
      }

      // Sort entries by date
      results.entries.sort((a, b) => b.modifiedAt - a.modifiedAt);

    } catch (error) {
      results.errors.push(`Harvest failed: ${error}`);
    }

    return results;
  }

  /**
   * Process a single file
   */
  private static async processFile(filePath: string, patterns: ExtractionPattern[]): Promise<EvidenceLogEntry | null> {
    try {
      const stats = statSync(filePath);
      const content = readFileSync(filePath, 'utf-8');
      const filename = basename(filePath);
      const extension = extname(filePath).toLowerCase();

      // Determine log type
      let type: EvidenceLogEntry['type'] = 'unknown';
      if (filename.includes('evidence') || filename.includes('log')) {
        type = 'evidence';
      } else if (filename.endsWith('.md')) {
        type = 'report';
      } else if (filename.endsWith('.json')) {
        type = 'data';
      }

      // Extract task ID and date from filename
      const taskId = this.extractTaskId(filename);
      const date = this.extractDate(filename);

      // Generate preview
      const preview = content.substring(0, 500).replace(/\n/g, ' ').trim();

      // Extract metadata using patterns
      const metadata: Record<string, unknown> = {};
      for (const pattern of patterns) {
        try {
          for (const contentPattern of pattern.contentPatterns) {
            const matches = content.match(contentPattern.pattern);
            if (matches) {
              const value = contentPattern.transform
                ? contentPattern.transform(matches)
                : matches[1] || matches[0];
              metadata[contentPattern.name] = value;
            } else if (contentPattern.required) {
              // Skip this file if required pattern not found
              return null;
            }
          }

          // Apply metadata extractor
          if (pattern.metadataExtractor) {
            const extracted = pattern.metadataExtractor(content, filename);
            Object.assign(metadata, extracted);
          }
        } catch (error) {
          // Continue with other patterns
        }
      }

      return {
        path: filePath,
        name: filename,
        extension,
        size: stats.size,
        modifiedAt: stats.mtime.getTime(),
        taskId,
        date,
        type,
        preview,
        metadata,
      };
    } catch (error) {
      // Skip unreadable files
      return null;
    }
  }

  /**
   * Extract task ID from filename
   */
  private static extractTaskId(filename: string): string | undefined {
    // Patterns: NP-099, KS-081, IV-WS3, etc.
    const patterns = [
      /(NP-\d+)/i,
      /(KS-\d+)/i,
      /(IV-[A-Z]+\d*)/i,
      /(WS\d+)/i,
      /(CF-[A-Z0-9-]+)/i,
      /(ST-[A-Z0-9-]+)/i,
    ];

    for (const pattern of patterns) {
      const match = filename.match(pattern);
      if (match) {
        return match[1].toUpperCase();
      }
    }

    return undefined;
  }

  /**
   * Extract date from filename
   */
  private static extractDate(filename: string): string | undefined {
    // Patterns: 2026-01-13, 20260113, etc.
    const patterns = [
      /(\d{4}-\d{2}-\d{2})/,
      /(\d{4}\d{2}\d{2})/,
    ];

    for (const pattern of patterns) {
      const match = filename.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  /**
   * Generate sample report from harvest results
   */
  static generateSampleReport(results: HarvestResults, config: SampleReportConfig): string {
    const lines: string[] = [];

    // Header
    lines.push(`# ${config.title}`);
    lines.push('');
    lines.push(config.description);
    lines.push('');
    lines.push(`**Generated:** ${new Date().toISOString()}`);
    lines.push(`**Total Files Processed:** ${results.processed}`);
    lines.push('');

    // Summary section
    if (config.sections.includes('summary')) {
      lines.push('## 📊 Summary');
      lines.push('');
      lines.push(`- **Total Scanned:** ${results.totalScanned}`);
      lines.push(`- **Processed:** ${results.processed}`);
      lines.push(`- **Filtered:** ${results.filtered}`);
      lines.push(`- **Errors:** ${results.errors.length}`);
      lines.push('');

      // Type breakdown
      lines.push('### Content Types');
      Object.entries(results.summary.byType).forEach(([type, count]) => {
        lines.push(`- ${type}: ${count}`);
      });
      lines.push('');

      // Date range
      if (results.summary.dateRange.earliest && results.summary.dateRange.latest) {
        lines.push('### Date Range');
        lines.push(`- **Earliest:** ${new Date(results.summary.dateRange.earliest).toISOString().split('T')[0]}`);
        lines.push(`- **Latest:** ${new Date(results.summary.dateRange.latest).toISOString().split('T')[0]}`);
        lines.push('');
      }
    }

    // Timeline section
    if (config.sections.includes('timeline')) {
      lines.push('## 📅 Timeline');
      lines.push('');
      const maxEntries = config.maxEntriesPerSection || 20;
      const timelineEntries = results.entries.slice(0, maxEntries);

      timelineEntries.forEach(entry => {
        const date = new Date(entry.modifiedAt).toISOString().split('T')[0];
        const time = new Date(entry.modifiedAt).toLocaleTimeString();
        lines.push(`### ${date} ${time} - ${entry.taskId || 'Unknown'}`);
        lines.push(`**File:** ${entry.name}`);
        lines.push(`**Type:** ${entry.type} | **Size:** ${(entry.size / 1024).toFixed(1)}KB`);

        if (config.includePreviews && entry.preview) {
          lines.push(`**Preview:** ${entry.preview.substring(0, 100)}...`);
        }
        lines.push('');
      });
    }

    // Task breakdown
    if (config.sections.includes('task-breakdown')) {
      lines.push('## 🎯 Task Breakdown');
      lines.push('');
      Object.entries(results.summary.byTask)
        .sort(([, a], [, b]) => b - a)
        .forEach(([taskId, count]) => {
          lines.push(`- **${taskId}:** ${count} files`);
        });
      lines.push('');
    }

    // Content analysis
    if (config.sections.includes('content-analysis')) {
      lines.push('## 📝 Content Analysis');
      lines.push('');
      lines.push('### File Extensions');
      Object.entries(results.summary.byExtension)
        .sort(([, a], [, b]) => b - a)
        .forEach(([ext, count]) => {
          lines.push(`- **${ext}:** ${count} files`);
        });
      lines.push('');

      lines.push('### Recent Files');
      const maxEntries = config.maxEntriesPerSection || 10;
      results.entries.slice(0, maxEntries).forEach(entry => {
        lines.push(`- **${entry.name}** (${entry.type}) - ${(entry.size / 1024).toFixed(1)}KB`);
        if (config.includePreviews) {
          lines.push(`  - Preview: ${entry.preview.substring(0, 50)}...`);
        }
      });
      lines.push('');
    }

    // Errors section
    if (config.sections.includes('errors') && results.errors.length > 0) {
      lines.push('## ⚠️ Errors');
      lines.push('');
      results.errors.forEach((error, index) => {
        lines.push(`${index + 1}. ${error}`);
      });
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Export harvest results
   */
  static exportResults(results: HarvestResults, format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['path', 'name', 'extension', 'size', 'modifiedAt', 'taskId', 'date', 'type', 'preview'];
      const rows = results.entries.map(entry => [
        entry.path,
        entry.name,
        entry.extension,
        entry.size.toString(),
        entry.modifiedAt.toString(),
        entry.taskId || '',
        entry.date || '',
        entry.type,
        `"${entry.preview.replace(/"/g, '""')}"`,
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify(results, null, 2);
  }
}

/**
 * Default extraction patterns for common log types
 */
export const DEFAULT_EXTRACTION_PATTERNS: ExtractionPattern[] = [
  {
    name: 'evidence-logs',
    filePattern: '**/*evidence*.log',
    contentPatterns: [
      {
        name: 'taskId',
        pattern: /(NP-\d+|KS-\d+|IV-[A-Z]+\d*)/i,
        required: false,
      },
      {
        name: 'status',
        pattern: /\b(SUCCESS|FAILED|COMPLETED|ERROR)\b/i,
        required: false,
      },
      {
        name: 'duration',
        pattern: /(\d+(?:\.\d+)?)\s*ms|\b(\d+(?:\.\d+)?)\s*seconds?/i,
        required: false,
        transform: (matches) => parseFloat(matches[1] || matches[2]),
      },
    ],
    metadataExtractor: (content, filename) => {
      const metadata: Record<string, unknown> = {};

      // Extract task ID from filename if not in content
      const taskMatch = filename.match(/(NP-\d+|KS-\d+|IV-[A-Z]+\d*)/i);
      if (taskMatch) {
        metadata.taskId = taskMatch[1].toUpperCase();
      }

      // Extract date from filename
      const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2}|\d{8})/);
      if (dateMatch) {
        metadata.date = dateMatch[1];
      }

      // Check for completion indicators
      if (content.includes('SUCCESS') || content.includes('COMPLETED')) {
        metadata.status = 'completed';
      } else if (content.includes('FAILED') || content.includes('ERROR')) {
        metadata.status = 'failed';
      }

      return metadata;
    },
  },
  {
    name: 'markdown-reports',
    filePattern: '**/*.md',
    contentPatterns: [
      {
        name: 'title',
        pattern: /^#\s+(.+)$/m,
        required: false,
      },
      {
        name: 'status',
        pattern: /\*\*Status:\*\*\s*(.+)/i,
        required: false,
      },
      {
        name: 'taskId',
        pattern: /(NP-\d+|KS-\d+|IV-[A-Z]+\d*)/i,
        required: false,
      },
    ],
    metadataExtractor: (content, filename) => {
      const metadata: Record<string, unknown> = {};

      // Extract title
      const titleMatch = content.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        metadata.title = titleMatch[1].trim();
      }

      // Extract status
      const statusMatch = content.match(/\*\*Status:\*\*\s*(.+)/i);
      if (statusMatch) {
        metadata.status = statusMatch[1].trim().toLowerCase();
      }

      // Extract task ID
      const taskMatch = filename.match(/(NP-\d+|KS-\d+|IV-[A-Z]+\d*)/i);
      if (taskMatch) {
        metadata.taskId = taskMatch[1].toUpperCase();
      }

      return metadata;
    },
  },
  {
    name: 'json-data',
    filePattern: '**/*.json',
    contentPatterns: [],
    metadataExtractor: (content, filename) => {
      try {
        const data = JSON.parse(content);
        const metadata: Record<string, unknown> = {
          isValidJson: true,
          rootKeys: Object.keys(data),
        };

        // Extract task ID
        const taskMatch = filename.match(/(NP-\d+|KS-\d+|IV-[A-Z]+\d*)/i);
        if (taskMatch) {
          metadata.taskId = taskMatch[1].toUpperCase();
        }

        return metadata;
      } catch {
        return { isValidJson: false };
      }
    },
  },
];
