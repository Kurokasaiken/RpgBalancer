/**
 * Config Snapshot Diff CLI Tool
 * Semantic comparison and impact analysis for balancer config snapshots
 * 
 * @see NP-122 – Config Snapshot Diff Tool
 * 
 * Usage:
 *   tsx scripts/balancer/configSnapshotDiff.ts --snapshot1 <timestamp1> --snapshot2 <timestamp2>
 *   tsx scripts/balancer/configSnapshotDiff.ts --latest
 *   tsx scripts/balancer/configSnapshotDiff.ts --export report.md
 */

import { parseArgs } from 'node:util';
import { writeFileSync } from 'node:fs';
import { BalancerConfigStore } from '../../src/balancing/config/BalancerConfigStore';
import type { BalancerConfig, ConfigSnapshot } from '../../src/balancing/config/types';
import {
  DEFAULT_SNAPSHOT_DIFF_CONFIG,
  DEFAULT_SEMANTIC_RULES,
  createEmptySummary,
  createEmptyImpactAnalysis,
  shouldIncludeChange,
  sortChanges,
  groupByCategory,
  getSeverityLevel,
  type SnapshotDiffConfig,
  type DiffReport,
  type DiffEntry,
  type DiffSummary,
  type ImpactAnalysis,
  type DiffChangeType,
  type ChangeCategory,
  type ImpactSeverity,
} from '../../src/balancing/config/snapshotDiffConfig';

// CLI argument parsing
const { values: args } = parseArgs({
  options: {
    snapshot1: { type: 'string', short: 'a' },
    snapshot2: { type: 'string', short: 'b' },
    latest: { type: 'boolean', short: 'l' },
    export: { type: 'string', short: 'e' },
    format: { type: 'string', short: 'f', default: 'markdown' },
    verbose: { type: 'boolean', short: 'v' },
    'min-impact': { type: 'string', default: 'none' },
    'no-analysis': { type: 'boolean' },
  },
  allowPositionals: true,
});

// Logging utilities
function log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
  const prefix = {
    info: '[INFO]',
    warn: '[WARN]',
    error: '[ERROR]',
  }[level];
  console.log(`${prefix} ${message}`);
}

function verbose(message: string): void {
  if (args.verbose) {
    console.log(`[DEBUG] ${message}`);
  }
}

/**
 * Deep diff two objects and generate diff entries
 */
function deepDiff(
  objA: unknown,
  objB: unknown,
  path: string = '',
  config: SnapshotDiffConfig
): DiffEntry[] {
  const entries: DiffEntry[] = [];

  // Handle null/undefined
  if (objA === null || objA === undefined) {
    if (objB === null || objB === undefined) return entries;
    entries.push(createDiffEntry(path, 'added', null, objB, config));
    return entries;
  }
  if (objB === null || objB === undefined) {
    entries.push(createDiffEntry(path, 'removed', objA, null, config));
    return entries;
  }

  // Handle primitives
  if (typeof objA !== 'object' || typeof objB !== 'object') {
    if (!areValuesEqual(objA, objB, path, config)) {
      entries.push(createDiffEntry(path, 'modified', objA, objB, config));
    }
    return entries;
  }

  // Handle arrays
  if (Array.isArray(objA) && Array.isArray(objB)) {
    const maxLen = Math.max(objA.length, objB.length);
    for (let i = 0; i < maxLen; i++) {
      const newPath = `${path}[${i}]`;
      if (i >= objA.length) {
        entries.push(createDiffEntry(newPath, 'added', undefined, objB[i], config));
      } else if (i >= objB.length) {
        entries.push(createDiffEntry(newPath, 'removed', objA[i], undefined, config));
      } else {
        entries.push(...deepDiff(objA[i], objB[i], newPath, config));
      }
    }
    return entries;
  }

  // Handle objects
  const keysA = new Set(Object.keys(objA as Record<string, unknown>));
  const keysB = new Set(Object.keys(objB as Record<string, unknown>));
  const allKeys = new Set([...keysA, ...keysB]);

  for (const key of allKeys) {
    const newPath = path ? `${path}.${key}` : key;
    const valA = (objA as Record<string, unknown>)[key];
    const valB = (objB as Record<string, unknown>)[key];

    if (!keysA.has(key)) {
      entries.push(createDiffEntry(newPath, 'added', undefined, valB, config));
    } else if (!keysB.has(key)) {
      entries.push(createDiffEntry(newPath, 'removed', valA, undefined, config));
    } else {
      entries.push(...deepDiff(valA, valB, newPath, config));
    }
  }

  return entries;
}

/**
 * Check if two values are equal considering semantic rules
 */
function areValuesEqual(
  a: unknown,
  b: unknown,
  path: string,
  config: SnapshotDiffConfig
): boolean {
  if (!config.comparison.semanticComparison) {
    return a === b;
  }

  // Apply semantic rules
  for (const rule of DEFAULT_SEMANTIC_RULES) {
    if (pathMatches(path, rule.path)) {
      return rule.comparator(a, b);
    }
  }

  // Default comparison
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) < config.comparison.floatPrecision;
  }

  return a === b;
}

/**
 * Check if path matches pattern (supports wildcards)
 */
function pathMatches(path: string, pattern: string): boolean {
  const pathParts = path.split('.');
  const patternParts = pattern.split('.');

  if (pathParts.length !== patternParts.length) return false;

  for (let i = 0; i < pathParts.length; i++) {
    if (patternParts[i] !== '*' && pathParts[i] !== patternParts[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Create a diff entry with categorization and impact analysis
 */
function createDiffEntry(
  path: string,
  changeType: DiffChangeType,
  oldValue: unknown,
  newValue: unknown,
  config: SnapshotDiffConfig
): DiffEntry {
  const category = categorizeChange(path);
  const impact = calculateImpact(path, oldValue, newValue, config);
  const description = generateDescription(path, changeType, oldValue, newValue);
  const affectedItems = findAffectedItems(path, changeType);

  return {
    path,
    category,
    changeType,
    oldValue,
    newValue,
    impact,
    description,
    affectedItems,
  };
}

/**
 * Categorize change based on path
 */
function categorizeChange(path: string): ChangeCategory {
  if (path.startsWith('stats.') && path.includes('.formula')) return 'formula';
  if (path.startsWith('stats.') && path.includes('.weight')) return 'weight';
  if (path.startsWith('stats.')) return 'stat';
  if (path.startsWith('cards.')) return 'card';
  if (path.startsWith('presets.')) return 'preset';
  return 'metadata';
}

/**
 * Calculate impact severity
 */
function calculateImpact(
  path: string,
  oldValue: unknown,
  newValue: unknown,
  config: SnapshotDiffConfig
): ImpactSeverity {
  if (!config.impact.enableAnalysis) return 'none';

  // Apply semantic rules
  for (const rule of DEFAULT_SEMANTIC_RULES) {
    if (pathMatches(path, rule.path)) {
      return rule.impactCalculator(oldValue, newValue);
    }
  }

  // Default impact based on category
  const category = categorizeChange(path);
  if (category === 'formula') return 'high';
  if (category === 'weight') return 'medium';
  if (category === 'stat') return 'medium';
  if (category === 'card') return 'low';
  return 'low';
}

/**
 * Generate human-readable description
 */
function generateDescription(
  path: string,
  changeType: DiffChangeType,
  oldValue: unknown,
  newValue: unknown
): string {
  const parts = path.split('.');
  const lastPart = parts[parts.length - 1];

  switch (changeType) {
    case 'added':
      return `Added ${lastPart}: ${formatValue(newValue)}`;
    case 'removed':
      return `Removed ${lastPart}: ${formatValue(oldValue)}`;
    case 'modified':
      return `Changed ${lastPart}: ${formatValue(oldValue)} → ${formatValue(newValue)}`;
    default:
      return `Unchanged ${lastPart}`;
  }
}

/**
 * Format value for display
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number') return value.toFixed(4);
  if (typeof value === 'boolean') return value.toString();
  if (typeof value === 'object') return JSON.stringify(value).substring(0, 50) + '...';
  return String(value);
}

/**
 * Find items affected by this change
 */
function findAffectedItems(path: string, changeType: DiffChangeType): string[] {
  const affected: string[] = [];
  const parts = path.split('.');

  if (parts[0] === 'stats' && parts.length >= 2) {
    affected.push(parts[1]); // stat ID
  }

  return affected;
}

/**
 * Generate diff summary
 */
function generateSummary(changes: DiffEntry[]): DiffSummary {
  const summary = createEmptySummary();

  for (const change of changes) {
    summary.totalChanges++;
    
    switch (change.changeType) {
      case 'added': summary.added++; break;
      case 'removed': summary.removed++; break;
      case 'modified': summary.modified++; break;
      case 'unchanged': summary.unchanged++; break;
    }

    switch (change.impact) {
      case 'critical': summary.criticalImpact++; break;
      case 'high': summary.highImpact++; break;
      case 'medium': summary.mediumImpact++; break;
      case 'low': summary.lowImpact++; break;
    }

    summary.categoryCounts[change.category]++;
  }

  return summary;
}

/**
 * Perform impact analysis
 */
function performImpactAnalysis(
  changes: DiffEntry[],
  configA: BalancerConfig,
  configB: BalancerConfig,
  config: SnapshotDiffConfig
): ImpactAnalysis {
  const analysis = createEmptyImpactAnalysis();

  if (!config.impact.enableAnalysis) return analysis;

  // Collect affected items
  const affectedStatsSet = new Set<string>();
  const affectedCardsSet = new Set<string>();
  const affectedPresetsSet = new Set<string>();

  for (const change of changes) {
    if (change.category === 'stat' || change.category === 'formula' || change.category === 'weight') {
      change.affectedItems.forEach(item => affectedStatsSet.add(item));
    }
    if (change.category === 'card') {
      change.affectedItems.forEach(item => affectedCardsSet.add(item));
    }
    if (change.category === 'preset') {
      change.affectedItems.forEach(item => affectedPresetsSet.add(item));
    }
  }

  analysis.affectedStats = Array.from(affectedStatsSet);
  analysis.affectedCards = Array.from(affectedCardsSet);
  analysis.affectedPresets = Array.from(affectedPresetsSet);

  // Analyze formula changes
  if (config.impact.analyzeFormulas) {
    for (const change of changes) {
      if (change.category === 'formula' && change.changeType === 'modified') {
        const statId = change.path.split('.')[1];
        analysis.formulaChanges.push({
          statId,
          oldFormula: String(change.oldValue || ''),
          newFormula: String(change.newValue || ''),
          dependentStats: [], // Would need dependency analysis
          complexity: 'moderate',
          risk: change.impact,
        });
      }
    }
  }

  // Analyze weight changes
  if (config.impact.analyzeWeights) {
    for (const change of changes) {
      if (change.category === 'weight' && change.changeType === 'modified') {
        const statId = change.path.split('.')[1];
        const oldWeight = Number(change.oldValue || 0);
        const newWeight = Number(change.newValue || 0);
        const percentageChange = ((newWeight - oldWeight) / oldWeight) * 100;

        if (Math.abs(percentageChange) >= config.impact.weightChangeThreshold) {
          analysis.weightChanges.push({
            statId,
            oldWeight,
            newWeight,
            percentageChange,
            affectedArchetypes: [], // Would need archetype analysis
          });
        }
      }
    }
  }

  // Detect breaking changes
  if (config.impact.detectBreakingChanges) {
    for (const change of changes) {
      if (change.impact === 'critical' || change.impact === 'high') {
        if (change.changeType === 'removed') {
          analysis.breakingChanges.push({
            path: change.path,
            reason: `Removed ${change.category}: ${change.path}`,
            severity: change.impact,
            migration: `Restore or replace ${change.path}`,
          });
        }
        if (change.category === 'formula' && change.changeType === 'modified') {
          analysis.breakingChanges.push({
            path: change.path,
            reason: `Formula changed significantly`,
            severity: change.impact,
            migration: `Review and test formula: ${change.path}`,
          });
        }
      }
    }
  }

  // Generate recommendations
  if (analysis.breakingChanges.length > 0) {
    analysis.recommendations.push('⚠️  Breaking changes detected - review carefully before deployment');
  }
  if (analysis.formulaChanges.length > 0) {
    analysis.recommendations.push('🔍 Formula changes detected - run validation tests');
  }
  if (analysis.weightChanges.length > 0) {
    analysis.recommendations.push('⚖️  Weight changes detected - re-run archetype simulations');
  }
  if (analysis.affectedStats.length > 10) {
    analysis.recommendations.push('📊 Large number of stats affected - consider incremental rollout');
  }

  return analysis;
}

/**
 * Generate diff report
 */
function generateDiffReport(
  snapshotA: ConfigSnapshot,
  snapshotB: ConfigSnapshot,
  config: SnapshotDiffConfig
): DiffReport {
  verbose('Starting deep diff comparison...');
  const allChanges = deepDiff(snapshotA.config, snapshotB.config, '', config);
  
  verbose(`Found ${allChanges.length} total changes`);
  const filteredChanges = allChanges.filter(change => shouldIncludeChange(change, config));
  
  verbose(`Filtered to ${filteredChanges.length} changes`);
  const sortedChanges = sortChanges(filteredChanges, config.output.sortBy);
  
  const summary = generateSummary(sortedChanges);
  const impactAnalysis = performImpactAnalysis(
    sortedChanges,
    snapshotA.config,
    snapshotB.config,
    config
  );

  return {
    timestamp: Date.now(),
    snapshotA: {
      timestamp: snapshotA.timestamp,
      description: snapshotA.description,
      checksum: snapshotA.checksum,
    },
    snapshotB: {
      timestamp: snapshotB.timestamp,
      description: snapshotB.description,
      checksum: snapshotB.checksum,
    },
    summary,
    changes: sortedChanges,
    impactAnalysis,
  };
}

/**
 * Format report as Markdown
 */
function formatMarkdown(report: DiffReport, config: SnapshotDiffConfig): string {
  const lines: string[] = [];

  lines.push('# Config Snapshot Diff Report');
  lines.push('');
  lines.push(`**Generated**: ${new Date(report.timestamp).toISOString()}`);
  lines.push('');

  // Snapshots info
  lines.push('## Snapshots');
  lines.push('');
  lines.push('### Snapshot A (Before)');
  lines.push(`- **Timestamp**: ${new Date(report.snapshotA.timestamp).toISOString()}`);
  lines.push(`- **Description**: ${report.snapshotA.description}`);
  if (report.snapshotA.checksum) {
    lines.push(`- **Checksum**: ${report.snapshotA.checksum}`);
  }
  lines.push('');
  lines.push('### Snapshot B (After)');
  lines.push(`- **Timestamp**: ${new Date(report.snapshotB.timestamp).toISOString()}`);
  lines.push(`- **Description**: ${report.snapshotB.description}`);
  if (report.snapshotB.checksum) {
    lines.push(`- **Checksum**: ${report.snapshotB.checksum}`);
  }
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Total Changes**: ${report.summary.totalChanges}`);
  lines.push(`- **Added**: ${report.summary.added}`);
  lines.push(`- **Removed**: ${report.summary.removed}`);
  lines.push(`- **Modified**: ${report.summary.modified}`);
  lines.push('');
  lines.push('### Impact Distribution');
  lines.push(`- 🔴 **Critical**: ${report.summary.criticalImpact}`);
  lines.push(`- 🟠 **High**: ${report.summary.highImpact}`);
  lines.push(`- 🟡 **Medium**: ${report.summary.mediumImpact}`);
  lines.push(`- 🟢 **Low**: ${report.summary.lowImpact}`);
  lines.push('');

  // Impact Analysis
  if (report.impactAnalysis.breakingChanges.length > 0) {
    lines.push('## ⚠️  Breaking Changes');
    lines.push('');
    for (const breaking of report.impactAnalysis.breakingChanges) {
      lines.push(`### ${breaking.path}`);
      lines.push(`- **Severity**: ${breaking.severity}`);
      lines.push(`- **Reason**: ${breaking.reason}`);
      lines.push(`- **Migration**: ${breaking.migration}`);
      lines.push('');
    }
  }

  // Recommendations
  if (report.impactAnalysis.recommendations.length > 0) {
    lines.push('## Recommendations');
    lines.push('');
    for (const rec of report.impactAnalysis.recommendations) {
      lines.push(`- ${rec}`);
    }
    lines.push('');
  }

  // Changes by category
  if (config.output.groupByCategory) {
    const grouped = groupByCategory(report.changes);
    
    for (const [category, changes] of Object.entries(grouped)) {
      if (changes.length === 0) continue;
      
      lines.push(`## ${category.charAt(0).toUpperCase() + category.slice(1)} Changes (${changes.length})`);
      lines.push('');
      
      for (const change of changes) {
        const icon = {
          added: '➕',
          removed: '➖',
          modified: '✏️',
          unchanged: '⚪',
        }[change.changeType];
        
        const impactIcon = {
          critical: '🔴',
          high: '🟠',
          medium: '🟡',
          low: '🟢',
          none: '⚪',
        }[change.impact];
        
        lines.push(`### ${icon} ${change.path} ${impactIcon}`);
        lines.push(`- **Change**: ${change.description}`);
        lines.push(`- **Impact**: ${change.impact}`);
        if (change.affectedItems.length > 0) {
          lines.push(`- **Affected**: ${change.affectedItems.join(', ')}`);
        }
        lines.push('');
      }
    }
  } else {
    lines.push('## All Changes');
    lines.push('');
    
    for (const change of report.changes) {
      lines.push(`- **${change.path}**: ${change.description} (${change.impact})`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format report as JSON
 */
function formatJSON(report: DiffReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Main CLI execution
 */
async function main(): Promise<void> {
  log('Config Snapshot Diff Tool');
  log('=========================');
  log('');

  // Load config
  const config: SnapshotDiffConfig = {
    ...DEFAULT_SNAPSHOT_DIFF_CONFIG,
    output: {
      ...DEFAULT_SNAPSHOT_DIFF_CONFIG.output,
      format: (args.format as 'json' | 'markdown' | 'html') || 'markdown',
    },
    filters: {
      ...DEFAULT_SNAPSHOT_DIFF_CONFIG.filters,
      minImpact: (args['min-impact'] as ImpactSeverity) || 'none',
    },
    impact: {
      ...DEFAULT_SNAPSHOT_DIFF_CONFIG.impact,
      enableAnalysis: !args['no-analysis'],
    },
  };

  // Load snapshots
  verbose('Loading config history...');
  await BalancerConfigStore.load();
  const history = BalancerConfigStore.getHistory();

  if (history.length < 2) {
    log('Not enough snapshots in history (need at least 2)', 'error');
    process.exit(1);
  }

  log(`Found ${history.length} snapshots in history`);

  let snapshotA: ConfigSnapshot;
  let snapshotB: ConfigSnapshot;

  if (args.latest) {
    // Compare latest two snapshots
    snapshotA = history[1];
    snapshotB = history[0];
    log(`Comparing latest two snapshots`);
  } else if (args.snapshot1 && args.snapshot2) {
    // Compare specific snapshots
    const ts1 = parseInt(args.snapshot1);
    const ts2 = parseInt(args.snapshot2);
    
    const snap1 = history.find(s => s.timestamp === ts1);
    const snap2 = history.find(s => s.timestamp === ts2);
    
    if (!snap1 || !snap2) {
      log('Snapshot(s) not found', 'error');
      process.exit(1);
    }
    
    snapshotA = snap1;
    snapshotB = snap2;
    log(`Comparing snapshots ${ts1} and ${ts2}`);
  } else {
    // Default: compare latest two
    snapshotA = history[1];
    snapshotB = history[0];
    log(`Comparing latest two snapshots (use --help for options)`);
  }

  log('');
  log(`Snapshot A: ${new Date(snapshotA.timestamp).toISOString()} - ${snapshotA.description}`);
  log(`Snapshot B: ${new Date(snapshotB.timestamp).toISOString()} - ${snapshotB.description}`);
  log('');

  // Generate diff report
  verbose('Generating diff report...');
  const report = generateDiffReport(snapshotA, snapshotB, config);

  // Format output
  let output: string;
  if (config.output.format === 'json') {
    output = formatJSON(report);
  } else {
    output = formatMarkdown(report, config);
  }

  // Export or print
  if (args.export) {
    writeFileSync(args.export, output, 'utf-8');
    log(`Report exported to: ${args.export}`);
  } else {
    console.log('');
    console.log(output);
  }

  // Summary
  log('');
  log('=========================');
  log(`Total changes: ${report.summary.totalChanges}`);
  log(`Critical impact: ${report.summary.criticalImpact}`);
  log(`High impact: ${report.summary.highImpact}`);
  log(`Breaking changes: ${report.impactAnalysis.breakingChanges.length}`);
  
  if (report.summary.criticalImpact > 0 || report.impactAnalysis.breakingChanges.length > 0) {
    log('⚠️  WARNING: Critical changes or breaking changes detected!', 'warn');
  }
}

// Run CLI
main().catch((error) => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
