/**
 * Guardian Evidence Indexer
 * 
 * Core indexing system for Guardian evidence logs with schema validation,
 * filtering, and catalog generation capabilities.
 * 
 * @since NP-058 – Guardian Evidence Indexer
 */

import { z } from 'zod';
import { readFile, readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';

/**
 * Evidence entry status
 */
export type EvidenceStatus = 'completato' | 'in_corso' | 'non_assegnato' | 'failed';

/**
 * Safeguard result type
 */
export type SafeguardType = 'lint' | 'test' | 'build' | 'kanban' | 'custom';

/**
 * Safeguard result
 */
export interface SafeguardResult {
  type: SafeguardType;
  status: 'pass' | 'fail' | 'warning';
  details?: string;
  duration?: number;
  timestamp: number;
}

/**
 * Evidence entry structure
 */
export interface EvidenceEntry {
  /** Unique identifier */
  id: string;
  /** Prompt identifier (e.g., NP-058) */
  promptId: string;
  /** Prompt title/name */
  promptTitle: string;
  /** Agent assigned */
  agent: string;
  /** Evidence status */
  status: EvidenceStatus;
  /** Creation timestamp */
  createdAt: number;
  /** Completion timestamp (if completed) */
  completedAt?: number;
  /** Evidence log file path */
  logPath: string;
  /** File size in bytes */
  fileSize: number;
  /** Safeguard results */
  safeguards: SafeguardResult[];
  /** Evidence summary */
  summary?: string;
  /** Key metrics/achievements */
  metrics?: Record<string, unknown>;
  /** Tags/categories */
  tags: string[];
  /** Dependencies */
  dependencies: string[];
  /** File format */
  format: 'log' | 'md' | 'json';
}

/**
 * Indexer configuration
 */
export interface EvidenceIndexerConfig {
  /** Base directory for evidence logs */
  baseDirectory: string;
  /** Output directory for indexes */
  outputDirectory: string;
  /** File patterns to include */
  includePatterns: string[];
  /** File patterns to exclude */
  excludePatterns: string[];
  /** Index format preferences */
  outputFormats: ('json' | 'markdown' | 'csv')[];
  /** Enable telemetry */
  enableTelemetry: boolean;
  /** Cache preferences */
  enableCache: boolean;
  /** Cache TTL in milliseconds */
  cacheTtl: number;
  /** Validation preferences */
  strictValidation: boolean;
  /** Maximum file size to process (bytes) */
  maxFileSize: number;
}

/**
 * Index statistics
 */
export interface IndexStatistics {
  /** Total evidence entries indexed */
  totalEntries: number;
  /** Entries by status */
  entriesByStatus: Record<EvidenceStatus, number>;
  /** Entries by agent */
  entriesByAgent: Record<string, number>;
  /** Entries by prompt type */
  entriesByPrompt: Record<string, number>;
  /** Safeguard pass rate */
  safeguardPassRate: number;
  /** Average file size */
  averageFileSize: number;
  /** Index generation time */
  indexGenerationTime: number;
  /** Last updated timestamp */
  lastUpdated: number;
  /** Processing errors */
  errors: string[];
}

/**
 * Filter options for evidence queries
 */
export interface EvidenceFilter {
  /** Filter by prompt ID */
  promptId?: string;
  /** Filter by agent */
  agent?: string;
  /** Filter by status */
  status?: EvidenceStatus;
  /** Filter by date range */
  dateRange?: {
    start: number;
    end: number;
  };
  /** Filter by tags */
  tags?: string[];
  /** Filter by safeguard status */
  safeguardStatus?: 'pass' | 'fail' | 'warning';
  /** Filter by file size range */
  fileSizeRange?: {
    min: number;
    max: number;
  };
  /** Limit results */
  limit?: number;
  /** Sort by field */
  sortBy?: 'createdAt' | 'completedAt' | 'promptId' | 'fileSize';
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Zod schema for EvidenceEntry
 */
const EvidenceEntrySchema = z.object({
  id: z.string(),
  promptId: z.string(),
  promptTitle: z.string(),
  agent: z.string(),
  status: z.enum(['completato', 'in_corso', 'non_assegnato', 'failed']),
  createdAt: z.number(),
  completedAt: z.number().optional(),
  logPath: z.string(),
  fileSize: z.number(),
  safeguards: z.array(z.object({
    type: z.enum(['lint', 'test', 'build', 'kanban', 'custom']),
    status: z.enum(['pass', 'fail', 'warning']),
    details: z.string().optional(),
    duration: z.number().optional(),
    timestamp: z.number(),
  })),
  summary: z.string().optional(),
  metrics: z.record(z.unknown()).optional(),
  tags: z.array(z.string()),
  dependencies: z.array(z.string()),
  format: z.enum(['log', 'md', 'json']),
});

/**
 * Zod schema for EvidenceIndexerConfig
 */
const EvidenceIndexerConfigSchema = z.object({
  baseDirectory: z.string(),
  outputDirectory: z.string(),
  includePatterns: z.array(z.string()),
  excludePatterns: z.array(z.string()),
  outputFormats: z.array(z.enum(['json', 'markdown', 'csv'])),
  enableTelemetry: z.boolean(),
  enableCache: z.boolean(),
  cacheTtl: z.number(),
  strictValidation: z.boolean(),
  maxFileSize: z.number(),
});

/**
 * Default indexer configuration
 */
export const DEFAULT_EVIDENCE_INDEXER_CONFIG: EvidenceIndexerConfig = {
  baseDirectory: 'test-results',
  outputDirectory: 'test-results/indexes',
  includePatterns: ['*.log', '*.md'],
  excludePatterns: ['.*', 'node_modules', '*.tmp'],
  outputFormats: ['json', 'markdown'],
  enableTelemetry: true,
  enableCache: true,
  cacheTtl: 3600000, // 1 hour
  strictValidation: true,
  maxFileSize: 10 * 1024 * 1024, // 10MB
};

/**
 * Create safe evidence indexer configuration
 */
export function createSafeEvidenceIndexerConfig(
  config?: Partial<EvidenceIndexerConfig>
): EvidenceIndexerConfig {
  const merged = { ...DEFAULT_EVIDENCE_INDEXER_CONFIG, ...config };
  
  const result = EvidenceIndexerConfigSchema.safeParse(merged);
  if (!result.success) {
    console.warn('Invalid evidence indexer config:', result.error);
    return DEFAULT_EVIDENCE_INDEXER_CONFIG;
  }
  
  return result.data;
}

/**
 * Validate evidence entry
 */
export function validateEvidenceEntry(entry: unknown): entry is EvidenceEntry {
  return EvidenceEntrySchema.safeParse(entry).success;
}

/**
 * Extract prompt ID from filename
 */
export function extractPromptId(filename: string): string | null {
  // Expected format: np-058-guardian-evidence-index-2026-01-20.log
  const match = filename.match(/^(np-\d+)-/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Extract date from filename
 */
export function extractDateFromFilename(filename: string): number | null {
  // Expected format: ...-2026-01-20.log
  const match = filename.match(/-(\d{4}-\d{2}-\d{2})\./);
  if (!match) return null;
  
  const date = new Date(match[1]);
  return isNaN(date.getTime()) ? null : date.getTime();
}

/**
 * Parse evidence log file
 */
export async function parseEvidenceLog(filePath: string): Promise<Partial<EvidenceEntry> | null> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const filename = basename(filePath);
    
    // Extract basic information from filename
    const promptId = extractPromptId(filename);
    const date = extractDateFromFilename(filename);
    
    if (!promptId || !date) {
      return null;
    }
    
    // Parse log content
    const lines = content.split('\n');
    let status: EvidenceStatus = 'non_assegnato';
    let agent = 'unknown';
    let promptTitle = '';
    let summary = '';
    const safeguards: SafeguardResult[] = [];
    const tags: string[] = [];
    const dependencies: string[] = [];
    const metrics: Record<string, unknown> = {};
    
    let currentSection = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Detect sections
      if (trimmed.startsWith('#')) {
        currentSection = trimmed.replace('#', '').trim().toLowerCase();
        continue;
      }
      
      // Parse status
      if (trimmed.includes('Status:') && currentSection.includes('evidence')) {
        const statusMatch = trimmed.match(/Status:\s*(\w+)/i);
        if (statusMatch) {
          const statusText = statusMatch[1].toLowerCase();
          if (statusText.includes('completato')) status = 'completato';
          else if (statusText.includes('in corso')) status = 'in_corso';
          else if (statusText.includes('non assegnato')) status = 'non_assegnato';
          else if (statusText.includes('failed')) status = 'failed';
        }
      }
      
      // Parse agent
      if (trimmed.includes('AGENT:') && currentSection.includes('evidence')) {
        const agentMatch = trimmed.match(/AGENT:\s*(.+)/);
        if (agentMatch) {
          agent = agentMatch[1].trim();
        }
      }
      
      // Parse prompt title
      if (trimmed.includes('|') && currentSection === '') {
        const titleMatch = trimmed.match(/\|\s*([^|]+)\s*\|/);
        if (titleMatch) {
          promptTitle = titleMatch[1].trim();
        }
      }
      
      // Parse safeguards
      if (trimmed.includes('Safeguard Results:') || trimmed.includes('**Safeguard Results:**')) {
        currentSection = 'safeguards';
        continue;
      }
      
      if (currentSection === 'safeguards' && trimmed.includes('- **')) {
        const safeguardMatch = trimmed.match(/- \*\*(\w+)\*\*:?\s*(.+)/);
        if (safeguardMatch) {
          const [, type, result] = safeguardMatch;
          let status: 'pass' | 'fail' | 'warning' = 'pass';
          const details = result;
          
          if (result.includes('✅') || result.includes('PASS') || result.includes('Success')) {
            status = 'pass';
          } else if (result.includes('❌') || result.includes('FAIL') || result.includes('Error')) {
            status = 'fail';
          } else if (result.includes('⚠️') || result.includes('WARNING') || result.includes('warning')) {
            status = 'warning';
          }
          
          safeguards.push({
            type: type.toLowerCase() as SafeguardType,
            status,
            details: result.trim(),
            timestamp: date,
          });
        }
      }
      
      // Parse summary
      if (trimmed.includes('### Summary') || trimmed.includes('## Summary')) {
        currentSection = 'summary';
        continue;
      }
      
      if (currentSection === 'summary' && trimmed && !trimmed.startsWith('#')) {
        summary += trimmed + ' ';
      }
      
      // Extract tags (common patterns)
      if (trimmed.includes('Tags:') || trimmed.includes('tags:')) {
        const tagMatch = trimmed.match(/tags?:\s*(.+)/i);
        if (tagMatch) {
          tags.push(...tagMatch[1].split(',').map(t => t.trim()));
        }
      }
    }
    
    // Get file stats
    const fileStats = await stat(filePath);
    
    return {
      id: `${promptId}-${date}`,
      promptId,
      promptTitle: promptTitle || `${promptId.toUpperCase()} - Evidence`,
      agent,
      status,
      createdAt: date,
      completedAt: status === 'completato' ? date : undefined,
      logPath: filePath,
      fileSize: fileStats.size,
      safeguards,
      summary: summary.trim() || undefined,
      metrics,
      tags,
      dependencies,
      format: extname(filename).slice(1) as 'log' | 'md' | 'json',
    };
    
  } catch (error) {
    console.warn(`Failed to parse evidence log ${filePath}:`, error);
    return null;
  }
}

/**
 * Filter evidence entries
 */
export function filterEvidenceEntries(
  entries: EvidenceEntry[],
  filter: EvidenceFilter
): EvidenceEntry[] {
  let filtered = [...entries];
  
  // Filter by prompt ID
  if (filter.promptId) {
    filtered = filtered.filter(entry => 
      entry.promptId.toLowerCase().includes(filter.promptId!.toLowerCase())
    );
  }
  
  // Filter by agent
  if (filter.agent) {
    filtered = filtered.filter(entry => 
      entry.agent.toLowerCase().includes(filter.agent!.toLowerCase())
    );
  }
  
  // Filter by status
  if (filter.status) {
    filtered = filtered.filter(entry => entry.status === filter.status);
  }
  
  // Filter by date range
  if (filter.dateRange) {
    filtered = filtered.filter(entry => 
      entry.createdAt >= filter.dateRange!.start && 
      entry.createdAt <= filter.dateRange!.end
    );
  }
  
  // Filter by tags
  if (filter.tags && filter.tags.length > 0) {
    filtered = filtered.filter(entry => 
      filter.tags!.some(tag => entry.tags.includes(tag))
    );
  }
  
  // Filter by safeguard status
  if (filter.safeguardStatus) {
    filtered = filtered.filter(entry => 
      entry.safeguards.some(s => s.status === filter.safeguardStatus)
    );
  }
  
  // Filter by file size range
  if (filter.fileSizeRange) {
    filtered = filtered.filter(entry => 
      entry.fileSize >= filter.fileSizeRange!.min && 
      entry.fileSize <= filter.fileSizeRange!.max
    );
  }
  
  // Sort
  if (filter.sortBy) {
    filtered.sort((a, b) => {
      const aValue = a[filter.sortBy!];
      const bValue = b[filter.sortBy!];
      
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return filter.sortOrder === 'desc' ? -comparison : comparison;
    });
  }
  
  // Limit
  if (filter.limit && filter.limit > 0) {
    filtered = filtered.slice(0, filter.limit);
  }
  
  return filtered;
}

/**
 * Calculate index statistics
 */
export function calculateIndexStatistics(entries: EvidenceEntry[]): IndexStatistics {
  const entriesByStatus: Record<EvidenceStatus, number> = {
    completato: 0,
    in_corso: 0,
    non_assegnato: 0,
    failed: 0,
  };
  
  const entriesByAgent: Record<string, number> = {};
  const entriesByPrompt: Record<string, number> = {};
  
  let totalSafeguards = 0;
  let passedSafeguards = 0;
  let totalFileSize = 0;
  const errors: string[] = [];
  
  for (const entry of entries) {
    // Count by status
    entriesByStatus[entry.status]++;
    
    // Count by agent
    entriesByAgent[entry.agent] = (entriesByAgent[entry.agent] || 0) + 1;
    
    // Count by prompt
    entriesByPrompt[entry.promptId] = (entriesByPrompt[entry.promptId] || 0) + 1;
    
    // Calculate safeguard pass rate
    for (const safeguard of entry.safeguards) {
      totalSafeguards++;
      if (safeguard.status === 'pass') {
        passedSafeguards++;
      }
    }
    
    // Sum file sizes
    totalFileSize += entry.fileSize;
  }
  
  const safeguardPassRate = totalSafeguards > 0 ? (passedSafeguards / totalSafeguards) * 100 : 0;
  const averageFileSize = entries.length > 0 ? totalFileSize / entries.length : 0;
  
  return {
    totalEntries: entries.length,
    entriesByStatus,
    entriesByAgent,
    entriesByPrompt,
    safeguardPassRate,
    averageFileSize,
    indexGenerationTime: Date.now(),
    lastUpdated: Date.now(),
    errors,
  };
}

export type {
  EvidenceEntry,
  EvidenceIndexerConfig,
  IndexStatistics,
  EvidenceFilter,
  SafeguardResult,
};

export {
  EvidenceEntrySchema,
  EvidenceIndexerConfigSchema,
};
