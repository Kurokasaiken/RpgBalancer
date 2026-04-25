/**
 * Config Snapshot Diff Configuration
 * Config-first semantic comparison and impact analysis for balancer snapshots
 * 
 * @see NP-122 – Config Snapshot Diff Tool
 */

import { z } from 'zod';

// Diff change types
export const DiffChangeType = {
  ADDED: 'added',
  REMOVED: 'removed',
  MODIFIED: 'modified',
  UNCHANGED: 'unchanged',
} as const;

export type DiffChangeType = typeof DiffChangeType[keyof typeof DiffChangeType];

// Impact severity levels
export const ImpactSeverity = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  NONE: 'none',
} as const;

export type ImpactSeverity = typeof ImpactSeverity[keyof typeof ImpactSeverity];

// Change categories
export const ChangeCategory = {
  STAT: 'stat',
  CARD: 'card',
  PRESET: 'preset',
  FORMULA: 'formula',
  WEIGHT: 'weight',
  METADATA: 'metadata',
} as const;

export type ChangeCategory = typeof ChangeCategory[keyof typeof ChangeCategory];

// Diff entry for a single change
export interface DiffEntry {
  path: string;
  category: ChangeCategory;
  changeType: DiffChangeType;
  oldValue: unknown;
  newValue: unknown;
  impact: ImpactSeverity;
  description: string;
  affectedItems: string[];
}

// Diff summary statistics
export interface DiffSummary {
  totalChanges: number;
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
  criticalImpact: number;
  highImpact: number;
  mediumImpact: number;
  lowImpact: number;
  categoryCounts: Record<ChangeCategory, number>;
}

// Complete diff report
export interface DiffReport {
  timestamp: number;
  snapshotA: {
    timestamp: number;
    description: string;
    checksum?: string;
  };
  snapshotB: {
    timestamp: number;
    description: string;
    checksum?: string;
  };
  summary: DiffSummary;
  changes: DiffEntry[];
  impactAnalysis: ImpactAnalysis;
}

// Impact analysis results
export interface ImpactAnalysis {
  affectedStats: string[];
  affectedCards: string[];
  affectedPresets: string[];
  formulaChanges: FormulaImpact[];
  weightChanges: WeightImpact[];
  breakingChanges: BreakingChange[];
  recommendations: string[];
}

// Formula change impact
export interface FormulaImpact {
  statId: string;
  oldFormula: string;
  newFormula: string;
  dependentStats: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  risk: ImpactSeverity;
}

// Weight change impact
export interface WeightImpact {
  statId: string;
  oldWeight: number;
  newWeight: number;
  percentageChange: number;
  affectedArchetypes: string[];
}

// Breaking change detection
export interface BreakingChange {
  path: string;
  reason: string;
  severity: ImpactSeverity;
  migration: string;
}

// Diff configuration
export interface SnapshotDiffConfig {
  comparison: {
    ignoreMetadata: boolean;
    ignoreTimestamps: boolean;
    ignoreDescriptions: boolean;
    floatPrecision: number;
    semanticComparison: boolean;
  };
  impact: {
    enableAnalysis: boolean;
    detectBreakingChanges: boolean;
    analyzeFormulas: boolean;
    analyzeWeights: boolean;
    weightChangeThreshold: number; // percentage
  };
  output: {
    format: 'json' | 'markdown' | 'html';
    includeUnchanged: boolean;
    groupByCategory: boolean;
    sortBy: 'path' | 'impact' | 'category';
    colorize: boolean;
  };
  filters: {
    minImpact: ImpactSeverity;
    categories: ChangeCategory[];
    changeTypes: DiffChangeType[];
  };
}

// Zod schemas
export const DiffEntrySchema = z.object({
  path: z.string(),
  category: z.enum(['stat', 'card', 'preset', 'formula', 'weight', 'metadata']),
  changeType: z.enum(['added', 'removed', 'modified', 'unchanged']),
  oldValue: z.unknown(),
  newValue: z.unknown(),
  impact: z.enum(['critical', 'high', 'medium', 'low', 'none']),
  description: z.string(),
  affectedItems: z.array(z.string()),
});

export const DiffSummarySchema = z.object({
  totalChanges: z.number(),
  added: z.number(),
  removed: z.number(),
  modified: z.number(),
  unchanged: z.number(),
  criticalImpact: z.number(),
  highImpact: z.number(),
  mediumImpact: z.number(),
  lowImpact: z.number(),
  categoryCounts: z.record(z.string(), z.number()),
});

export const SnapshotDiffConfigSchema = z.object({
  comparison: z.object({
    ignoreMetadata: z.boolean(),
    ignoreTimestamps: z.boolean(),
    ignoreDescriptions: z.boolean(),
    floatPrecision: z.number(),
    semanticComparison: z.boolean(),
  }),
  impact: z.object({
    enableAnalysis: z.boolean(),
    detectBreakingChanges: z.boolean(),
    analyzeFormulas: z.boolean(),
    analyzeWeights: z.boolean(),
    weightChangeThreshold: z.number(),
  }),
  output: z.object({
    format: z.enum(['json', 'markdown', 'html']),
    includeUnchanged: z.boolean(),
    groupByCategory: z.boolean(),
    sortBy: z.enum(['path', 'impact', 'category']),
    colorize: z.boolean(),
  }),
  filters: z.object({
    minImpact: z.enum(['critical', 'high', 'medium', 'low', 'none']),
    categories: z.array(z.enum(['stat', 'card', 'preset', 'formula', 'weight', 'metadata'])),
    changeTypes: z.array(z.enum(['added', 'removed', 'modified', 'unchanged'])),
  }),
});

// Default configuration
export const DEFAULT_SNAPSHOT_DIFF_CONFIG: SnapshotDiffConfig = {
  comparison: {
    ignoreMetadata: false,
    ignoreTimestamps: true,
    ignoreDescriptions: true,
    floatPrecision: 0.0001,
    semanticComparison: true,
  },
  impact: {
    enableAnalysis: true,
    detectBreakingChanges: true,
    analyzeFormulas: true,
    analyzeWeights: true,
    weightChangeThreshold: 10, // 10% change threshold
  },
  output: {
    format: 'markdown',
    includeUnchanged: false,
    groupByCategory: true,
    sortBy: 'impact',
    colorize: true,
  },
  filters: {
    minImpact: 'none',
    categories: ['stat', 'card', 'preset', 'formula', 'weight', 'metadata'],
    changeTypes: ['added', 'removed', 'modified'],
  },
};

// Semantic comparison rules
export interface SemanticRule {
  path: string;
  comparator: (a: unknown, b: unknown) => boolean;
  impactCalculator: (a: unknown, b: unknown) => ImpactSeverity;
}

// Default semantic rules
export const DEFAULT_SEMANTIC_RULES: SemanticRule[] = [
  {
    path: 'stats.*.weight',
    comparator: (a, b) => {
      if (typeof a !== 'number' || typeof b !== 'number') return a === b;
      return Math.abs(a - b) < DEFAULT_SNAPSHOT_DIFF_CONFIG.comparison.floatPrecision;
    },
    impactCalculator: (a, b) => {
      if (typeof a !== 'number' || typeof b !== 'number') return 'medium';
      const change = Math.abs((b - a) / a) * 100;
      if (change > 50) return 'critical';
      if (change > 25) return 'high';
      if (change > 10) return 'medium';
      return 'low';
    },
  },
  {
    path: 'stats.*.formula',
    comparator: (a, b) => a === b,
    impactCalculator: (a, b) => {
      if (!a && !b) return 'none';
      if (!a || !b) return 'high';
      const aStr = String(a);
      const bStr = String(b);
      const similarity = calculateStringSimilarity(aStr, bStr);
      if (similarity < 0.3) return 'critical';
      if (similarity < 0.6) return 'high';
      if (similarity < 0.9) return 'medium';
      return 'low';
    },
  },
  {
    path: 'stats.*.baseStat',
    comparator: (a, b) => a === b,
    impactCalculator: () => 'high', // Changing baseStat flag is always high impact
  },
  {
    path: 'stats.*.isDerived',
    comparator: (a, b) => a === b,
    impactCalculator: () => 'high', // Changing derived flag is always high impact
  },
];

// Utility functions
export function calculateStringSimilarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

export function validateConfig(config: unknown): SnapshotDiffConfig | null {
  const result = SnapshotDiffConfigSchema.safeParse(config);
  return result.success ? result.data : null;
}

export function createEmptySummary(): DiffSummary {
  return {
    totalChanges: 0,
    added: 0,
    removed: 0,
    modified: 0,
    unchanged: 0,
    criticalImpact: 0,
    highImpact: 0,
    mediumImpact: 0,
    lowImpact: 0,
    categoryCounts: {
      stat: 0,
      card: 0,
      preset: 0,
      formula: 0,
      weight: 0,
      metadata: 0,
    },
  };
}

export function createEmptyImpactAnalysis(): ImpactAnalysis {
  return {
    affectedStats: [],
    affectedCards: [],
    affectedPresets: [],
    formulaChanges: [],
    weightChanges: [],
    breakingChanges: [],
    recommendations: [],
  };
}

export function getSeverityLevel(severity: ImpactSeverity): number {
  const levels = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
    none: 0,
  };
  return levels[severity];
}

export function shouldIncludeChange(
  entry: DiffEntry,
  config: SnapshotDiffConfig
): boolean {
  // Check impact filter
  if (getSeverityLevel(entry.impact) < getSeverityLevel(config.filters.minImpact)) {
    return false;
  }
  
  // Check category filter
  if (!config.filters.categories.includes(entry.category)) {
    return false;
  }
  
  // Check change type filter
  if (!config.filters.changeTypes.includes(entry.changeType)) {
    return false;
  }
  
  // Check unchanged filter
  if (entry.changeType === 'unchanged' && !config.output.includeUnchanged) {
    return false;
  }
  
  return true;
}

export function sortChanges(
  changes: DiffEntry[],
  sortBy: SnapshotDiffConfig['output']['sortBy']
): DiffEntry[] {
  const sorted = [...changes];
  
  switch (sortBy) {
    case 'impact':
      sorted.sort((a, b) => getSeverityLevel(b.impact) - getSeverityLevel(a.impact));
      break;
    case 'category':
      sorted.sort((a, b) => a.category.localeCompare(b.category));
      break;
    case 'path':
      sorted.sort((a, b) => a.path.localeCompare(b.path));
      break;
  }
  
  return sorted;
}

export function groupByCategory(changes: DiffEntry[]): Record<ChangeCategory, DiffEntry[]> {
  const grouped: Record<string, DiffEntry[]> = {
    stat: [],
    card: [],
    preset: [],
    formula: [],
    weight: [],
    metadata: [],
  };
  
  for (const change of changes) {
    grouped[change.category].push(change);
  }
  
  return grouped as Record<ChangeCategory, DiffEntry[]>;
}
