#!/usr/bin/env tsx

/**
 * IV-DIAG-03 – Roster Transformation Diff Viewer
 * 
 * CLI tool for visualizing and analyzing roster state transformations.
 * Compares before/after snapshots to identify character changes, stat modifications,
 * assignment updates, and provides detailed diff analysis with impact metrics.
 * 
 * Usage: node --import tsx/esm scripts/idleVillage/rosterTransformationDiffViewer.ts [options]
 */

import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

interface RosterCharacter {
  id: string;
  name: string;
  aiBehavior: string;
  statBlock: {
    hp: number;
    damage: number;
    txc: number;
    evasion: number;
    armor: number;
    critChance: number;
    // Additional stats from actual data
    agility?: number;
    hitChance?: number;
    effectiveDamage?: number;
    attacksPerKo?: number;
    htk?: number;
    edpt?: number;
    ttk?: number;
    earlyImpact?: number;
    critMult?: number;
  };
  equippedSpellIds: string[];
  visualProfileId?: string;
  portraitUrl?: string;
  fullFigureUrl?: string;
  portraitCrop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  // ResidentState properties
  status: 'available' | 'assigned' | 'injured' | 'returning';
  fatigue: number;
  currentHp: number;
  maxHp: number;
  isInjured: boolean;
  isHero: boolean;
  survivalCount: number;
  survivalScore: number;
  lastUpdated: number;
}

interface DiffViewerConfig {
  verbose: boolean;
  compareStats: boolean;
  compareAssignments: boolean;
  compareMetadata: boolean;
  showUnchanged: boolean;
  outputPath?: string;
  beforePath?: string;
  afterPath?: string;
}

interface CharacterDiff {
  characterId: string;
  characterName: string;
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
  severity: 'low' | 'medium' | 'high' | 'critical';
  changes: {
    stats?: StatChange[];
    status?: StatusChange;
    assignments?: AssignmentChange;
    metadata?: MetadataChange[];
  };
  before?: RosterCharacter;
  after?: RosterCharacter;
}

interface StatChange {
  statName: string;
  oldValue: number;
  newValue: number;
  percentChange: number;
  impact: 'positive' | 'negative' | 'neutral';
}

interface StatusChange {
  oldStatus: string;
  newStatus: string;
  impact: 'positive' | 'negative' | 'neutral';
}

interface AssignmentChange {
  oldAssignment?: string;
  newAssignment?: string;
  impact: 'positive' | 'negative' | 'neutral';
}

interface MetadataChange {
  field: string;
  oldValue: any;
  newValue: any;
  impact: 'positive' | 'negative' | 'neutral';
}

interface DiffResult {
  timestamp: string;
  beforePath: string;
  afterPath: string;
  summary: {
    totalCharacters: number;
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
  };
  changes: CharacterDiff[];
  impact: {
    highImpactChanges: number;
    criticalChanges: number;
    overallSeverity: 'low' | 'medium' | 'high' | 'critical';
  };
  performance: {
    loadTimeMs: number;
    comparisonTimeMs: number;
    totalTimeMs: number;
  };
}

class RosterTransformationDiffViewer {
  private config: DiffViewerConfig;
  private startTime: number = performance.now();

  constructor(config: DiffViewerConfig) {
    this.config = config;
  }

  /**
   * Loads roster snapshot from file
   */
  private async loadRoster(path: string): Promise<RosterCharacter[]> {
    const startTime = performance.now();
    
    if (!existsSync(path)) {
      throw new Error(`Roster file not found: ${path}`);
    }
    
    try {
      const rawContent = readFileSync(path, 'utf8');
      const parsed = JSON.parse(rawContent);
      
      if (!Array.isArray(parsed)) {
        throw new Error('Invalid roster format: expected array of characters');
      }
      
      const loadTime = performance.now() - startTime;
      
      if (this.config.verbose) {
        console.log(`📁 Loaded roster from: ${path}`);
        console.log(`👥 Characters: ${parsed.length}`);
        console.log(`⏱️  Load time: ${loadTime.toFixed(2)}ms`);
      }
      
      return parsed;
    } catch (error) {
      throw new Error(`Failed to load roster from ${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Calculates stat change impact
   */
  private calculateStatImpact(oldValue: number, newValue: number, statName: string): 'positive' | 'negative' | 'neutral' {
    if (oldValue === newValue) return 'neutral';
    
    const change = newValue - oldValue;
    const percentChange = Math.abs(change / oldValue) * 100;
    
    // For combat stats, higher is generally better
    const positiveStats = ['hp', 'damage', 'txc', 'evasion', 'armor', 'critChance', 'agility'];
    const isPositiveStat = positiveStats.includes(statName);
    
    if (isPositiveStat) {
      return change > 0 ? 'positive' : 'negative';
    } else {
      return change < 0 ? 'positive' : 'negative';
    }
  }

  /**
   * Calculates change severity
   */
  private calculateSeverity(diff: CharacterDiff): 'low' | 'medium' | 'high' | 'critical' {
    let severityScore = 0;
    
    // Check stat changes
    if (diff.changes.stats) {
      for (const statChange of diff.changes.stats) {
        const percentChange = Math.abs(statChange.percentChange);
        if (percentChange > 50) severityScore += 3;
        else if (percentChange > 20) severityScore += 2;
        else if (percentChange > 5) severityScore += 1;
      }
    }
    
    // Check status changes
    if (diff.changes.status) {
      if (diff.changes.status.oldStatus === 'injured' && diff.changes.status.newStatus === 'available') {
        severityScore += 2; // Positive change
      } else if (diff.changes.status.oldStatus === 'available' && diff.changes.status.newStatus === 'injured') {
        severityScore += 3; // Negative change
      } else {
        severityScore += 1;
      }
    }
    
    // Check for new/removed characters
    if (diff.changeType === 'added' || diff.changeType === 'removed') {
      severityScore += 2;
    }
    
    if (severityScore >= 6) return 'critical';
    if (severityScore >= 4) return 'high';
    if (severityScore >= 2) return 'medium';
    return 'low';
  }

  /**
   * Compares two characters and generates diff
   */
  private compareCharacters(before?: RosterCharacter, after?: RosterCharacter): CharacterDiff {
    if (!before && after) {
      // Added character
      return {
        characterId: after.id,
        characterName: after.name,
        changeType: 'added',
        severity: 'medium',
        changes: {},
        after,
      };
    }
    
    if (before && !after) {
      // Removed character
      return {
        characterId: before.id,
        characterName: before.name,
        changeType: 'removed',
        severity: 'medium',
        changes: {},
        before,
      };
    }
    
    if (!before || !after) {
      throw new Error('Invalid character comparison state');
    }
    
    // Modified character
    const changes: CharacterDiff['changes'] = {};
    
    // Compare stats
    if (this.config.compareStats) {
      const statChanges: StatChange[] = [];
      const allStats = new Set([...Object.keys(before.statBlock), ...Object.keys(after.statBlock)]);
      
      for (const statName of allStats) {
        const oldValue = (before.statBlock as any)[statName] || 0;
        const newValue = (after.statBlock as any)[statName] || 0;
        
        if (oldValue !== newValue) {
          const percentChange = oldValue !== 0 ? ((newValue - oldValue) / oldValue) * 100 : 0;
          statChanges.push({
            statName,
            oldValue,
            newValue,
            percentChange,
            impact: this.calculateStatImpact(oldValue, newValue, statName),
          });
        }
      }
      
      if (statChanges.length > 0) {
        changes.stats = statChanges;
      }
    }
    
    // Compare status
    if (this.config.compareAssignments && before.status !== after.status) {
      changes.status = {
        oldStatus: before.status,
        newStatus: after.status,
        impact: 'neutral', // Could be made smarter
      };
    }
    
    // Compare metadata
    if (this.config.compareMetadata) {
      const metadataChanges: MetadataChange[] = [];
      
      // Check various metadata fields
      const metadataFields = ['aiBehavior', 'visualProfileId', 'isHero', 'survivalCount', 'survivalScore'];
      
      for (const field of metadataFields) {
        const oldValue = (before as any)[field];
        const newValue = (after as any)[field];
        
        if (oldValue !== newValue) {
          metadataChanges.push({
            field,
            oldValue,
            newValue,
            impact: 'neutral',
          });
        }
      }
      
      if (metadataChanges.length > 0) {
        changes.metadata = metadataChanges;
      }
    }
    
    const hasChanges = Object.keys(changes).length > 0;
    
    return {
      characterId: before.id,
      characterName: before.name,
      changeType: hasChanges ? 'modified' : 'unchanged',
      severity: hasChanges ? 'low' : 'low', // Will be calculated later
      changes,
      before,
      after,
    };
  }

  /**
   * Generates complete diff between two rosters
   */
  async generateDiff(beforePath: string, afterPath: string): Promise<DiffResult> {
    const startTime = performance.now();
    const loadStartTime = performance.now();
    
    console.log('🔍 IV-DIAG-03 – Roster Transformation Diff Viewer');
    console.log('📋 Generating roster transformation diff...\n');
    
    // Load rosters
    const beforeRoster = await this.loadRoster(beforePath);
    const afterRoster = await this.loadRoster(afterPath);
    
    const loadTime = performance.now() - loadStartTime;
    const comparisonStartTime = performance.now();
    
    // Create character maps for efficient lookup
    const beforeMap = new Map(beforeRoster.map(char => [char.id, char]));
    const afterMap = new Map(afterRoster.map(char => [char.id, char]));
    
    // Find all character IDs
    const allCharacterIds = new Set([...beforeMap.keys(), ...afterMap.keys()]);
    
    // Generate diffs for each character
    const changes: CharacterDiff[] = [];
    
    for (const characterId of allCharacterIds) {
      const beforeChar = beforeMap.get(characterId);
      const afterChar = afterMap.get(characterId);
      
      const diff = this.compareCharacters(beforeChar, afterChar);
      
      // Calculate severity for modified characters
      if (diff.changeType === 'modified') {
        diff.severity = this.calculateSeverity(diff);
      }
      
      // Skip unchanged if not requested
      if (diff.changeType === 'unchanged' && !this.config.showUnchanged) {
        continue;
      }
      
      changes.push(diff);
    }
    
    // Calculate summary
    const summary = {
      totalCharacters: allCharacterIds.size,
      added: changes.filter(c => c.changeType === 'added').length,
      removed: changes.filter(c => c.changeType === 'removed').length,
      modified: changes.filter(c => c.changeType === 'modified').length,
      unchanged: changes.filter(c => c.changeType === 'unchanged').length,
    };
    
    // Calculate impact
    const highImpactChanges = changes.filter(c => c.severity === 'high').length;
    const criticalChanges = changes.filter(c => c.severity === 'critical').length;
    
    const overallSeverity = criticalChanges > 0 ? 'critical' :
                          highImpactChanges > 0 ? 'high' :
                          summary.modified > 5 ? 'medium' : 'low';
    
    const comparisonTime = performance.now() - comparisonStartTime;
    const totalTime = performance.now() - startTime;
    
    const result: DiffResult = {
      timestamp: new Date().toISOString(),
      beforePath,
      afterPath,
      summary,
      changes,
      impact: {
        highImpactChanges,
        criticalChanges,
        overallSeverity,
      },
      performance: {
        loadTimeMs: loadTime,
        comparisonTimeMs: comparisonTime,
        totalTimeMs: totalTime,
      },
    };
    
    // Print results
    this.printResults(result);
    
    // Save results if output path specified
    if (this.config.outputPath) {
      await this.saveResults(result);
    }
    
    return result;
  }

  /**
   * Prints diff results to console
   */
  private printResults(result: DiffResult): void {
    console.log('\n📊 ROSTER TRANSFORMATION DIFF');
    console.log('============================');
    console.log(`📅 Timestamp: ${result.timestamp}`);
    console.log(`📁 Before: ${result.beforePath}`);
    console.log(`📁 After: ${result.afterPath}`);
    console.log(`👥 Total characters: ${result.summary.totalCharacters}`);
    console.log(`➕ Added: ${result.summary.added}`);
    console.log(`➖ Removed: ${result.summary.removed}`);
    console.log(`✏️  Modified: ${result.summary.modified}`);
    console.log(`🔄 Unchanged: ${result.summary.unchanged}`);
    
    console.log('\n🎯 IMPACT ANALYSIS');
    console.log('==================');
    console.log(`🔥 High impact changes: ${result.impact.highImpactChanges}`);
    console.log(`⚠️  Critical changes: ${result.impact.criticalChanges}`);
    console.log(`📈 Overall severity: ${result.impact.overallSeverity.toUpperCase()}`);
    
    console.log('\n⏱️  PERFORMANCE');
    console.log('===============');
    console.log(`📖 Load time: ${result.performance.loadTimeMs.toFixed(2)}ms`);
    console.log(`🔧 Comparison time: ${result.performance.comparisonTimeMs.toFixed(2)}ms`);
    console.log(`⏳ Total time: ${result.performance.totalTimeMs.toFixed(2)}ms`);
    
    // Show detailed changes
    if (this.config.verbose && result.changes.length > 0) {
      console.log('\n📋 DETAILED CHANGES');
      console.log('===================');
      
      for (const change of result.changes) {
        const icon = change.changeType === 'added' ? '➕' :
                    change.changeType === 'removed' ? '➖' :
                    change.changeType === 'modified' ? '✏️' : '🔄';
        
        const severity = change.severity.toUpperCase();
        console.log(`\n${icon} ${change.characterName} (${change.characterId}) - ${severity}`);
        
        if (change.changes.stats && change.changes.stats.length > 0) {
          console.log('  📊 Stat Changes:');
          for (const statChange of change.changes.stats) {
            const arrow = statChange.impact === 'positive' ? '📈' :
                         statChange.impact === 'negative' ? '📉' : '➡️';
            console.log(`    ${arrow} ${statChange.statName}: ${statChange.oldValue} → ${statChange.newValue} (${statChange.percentChange.toFixed(1)}%)`);
          }
        }
        
        if (change.changes.status) {
          console.log(`  🔄 Status: ${change.changes.status.oldStatus} → ${change.changes.status.newStatus}`);
        }
        
        if (change.changes.metadata && change.changes.metadata.length > 0) {
          console.log('  📝 Metadata Changes:');
          for (const metaChange of change.changes.metadata) {
            console.log(`    • ${metaChange.field}: ${JSON.stringify(metaChange.oldValue)} → ${JSON.stringify(metaChange.newValue)}`);
          }
        }
      }
    }
  }

  /**
   * Saves results to file
   */
  private async saveResults(result: DiffResult): Promise<void> {
    try {
      const outputPath = resolve(this.config.outputPath!);
      const reportData = {
        ...result,
        viewerVersion: 'IV-DIAG-03-v1.0.0',
        generatedBy: 'RosterTransformationDiffViewer',
      };
      
      // Ensure output directory exists
      const outputDir = outputPath.substring(0, outputPath.lastIndexOf('/'));
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }
      
      // Write JSON report
      const jsonPath = outputPath.replace(/\.[^.]+$/, '') + '.json';
      const fs = await import('node:fs');
      fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2));
      
      // Write markdown report
      const markdownPath = outputPath.replace(/\.[^.]+$/, '') + '.md';
      const markdown = this.generateMarkdownReport(reportData);
      fs.writeFileSync(markdownPath, markdown);
      
      console.log(`\n📄 Reports saved:`);
      console.log(`  📄 JSON: ${jsonPath}`);
      console.log(`  📝 Markdown: ${markdownPath}`);
    } catch (error) {
      console.error(`❌ Failed to save results: ${error}`);
    }
  }

  /**
   * Generates markdown report
   */
  private generateMarkdownReport(result: DiffResult & { viewerVersion: string; generatedBy: string }): string {
    const addedChanges = result.changes.filter(c => c.changeType === 'added');
    const removedChanges = result.changes.filter(c => c.changeType === 'removed');
    const modifiedChanges = result.changes.filter(c => c.changeType === 'modified');
    
    return `# IV-DIAG-03 Roster Transformation Diff Report

**Generated:** ${result.timestamp}  
**Viewer Version:** ${result.viewerVersion}  
**Generated By:** ${result.generatedBy}

## Summary

| Metric | Value |
|--------|-------|
| Total Characters | ${result.summary.totalCharacters} |
| Added | ${result.summary.added} |
| Removed | ${result.summary.removed} |
| Modified | ${result.summary.modified} |
| Unchanged | ${result.summary.unchanged} |
| Overall Severity | ${result.impact.overallSeverity.toUpperCase()} |

## Impact Analysis

- **High Impact Changes:** ${result.impact.highImpactChanges}
- **Critical Changes:** ${result.impact.criticalChanges}
- **Overall Severity:** ${result.impact.overallSeverity.toUpperCase()}

## Performance

- **Load Time:** ${result.performance.loadTimeMs.toFixed(2)}ms
- **Comparison Time:** ${result.performance.comparisonTimeMs.toFixed(2)}ms
- **Total Time:** ${result.performance.totalTimeMs.toFixed(2)}ms

## Changes by Type

### Added Characters (${addedChanges.length})

${addedChanges.length > 0 
  ? addedChanges.map(char => `- **${char.characterName}** (${char.characterId})`).join('\n')
  : 'No characters added.'
}

### Removed Characters (${removedChanges.length})

${removedChanges.length > 0
  ? removedChanges.map(char => `- **${char.characterName}** (${char.characterId})`).join('\n')
  : 'No characters removed.'
}

### Modified Characters (${modifiedChanges.length})

${modifiedChanges.length > 0
  ? modifiedChanges.map(char => {
      const details = [];
      if (char.changes.stats && char.changes.stats.length > 0) {
        details.push(`${char.changes.stats.length} stat changes`);
      }
      if (char.changes.status) {
        details.push('status change');
      }
      if (char.changes.metadata && char.changes.metadata.length > 0) {
        details.push(`${char.changes.metadata.length} metadata changes`);
      }
      return `- **${char.characterName}** (${char.characterId}) - ${char.severity.toUpperCase()} - ${details.join(', ')}`;
    }).join('\n')
  : 'No characters modified.'
}

## Detailed Data

\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\`
`;
  }
}

// CLI interface
async function main() {
  console.log('🔍 IV-DIAG-03 – Roster Transformation Diff Viewer');
  console.log('📋 Starting roster transformation analysis...\n');
  
  const args = process.argv.slice(2);
  const config: DiffViewerConfig = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    compareStats: !args.includes('--no-stats'),
    compareAssignments: !args.includes('--no-assignments'),
    compareMetadata: !args.includes('--no-metadata'),
    showUnchanged: args.includes('--show-unchanged'),
    outputPath: args.find(arg => arg.startsWith('--output='))?.split('=')[1],
    beforePath: args.find(arg => arg.startsWith('--before='))?.split('=')[1],
    afterPath: args.find(arg => arg.startsWith('--after='))?.split('=')[1],
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
IV-DIAG-03 – Roster Transformation Diff Viewer

USAGE:
  node --import tsx/esm scripts/idleVillage/rosterTransformationDiffViewer.ts [options]

OPTIONS:
  -v, --verbose          Enable verbose output with detailed changes
  --no-stats             Skip stat comparisons
  --no-assignments       Skip assignment comparisons
  --no-metadata          Skip metadata comparisons
  --show-unchanged       Include unchanged characters in output
  --output=<path>        Save report to specified path
  --before=<path>        Path to before roster snapshot
  --after=<path>         Path to after roster snapshot
  -h, --help             Show this help message

EXAMPLES:
  node --import tsx/esm scripts/idleVillage/rosterTransformationDiffViewer.ts --before=data/characters-before.json --after=data/characters.json
  node --import tsx/esm scripts/idleVillage/rosterTransformationDiffViewer.ts --before=data/characters-before.json --after=data/characters.json --verbose --output=report
  node --import tsx/esm scripts/idleVillage/rosterTransformationDiffViewer.ts --before=data/characters-before.json --after=data/characters.json --no-metadata --show-unchanged
    `);
    return;
  }

  // Validate required arguments
  if (!config.beforePath || !config.afterPath) {
    console.error('❌ Error: Both --before and --after paths are required');
    console.log('Use --help for usage information');
    process.exit(1);
  }

  try {
    const viewer = new RosterTransformationDiffViewer(config);
    const result = await viewer.generateDiff(config.beforePath, config.afterPath);
    
    // Exit with error code based on severity
    const exitCode = result.impact.overallSeverity === 'critical' ? 1 : 0;
    process.exit(exitCode);
  } catch (error) {
    console.error('❌ Diff generation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

export { RosterTransformationDiffViewer, type DiffViewerConfig, type DiffResult, type CharacterDiff };
