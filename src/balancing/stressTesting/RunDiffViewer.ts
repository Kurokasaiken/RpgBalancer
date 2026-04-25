/**
 * Marginal Utility Run Diff Viewer
 *
 * Tool for comparing marginal utility analysis results between different runs.
 * Shows diffs in stat rankings, synergies, performance metrics, and configurations.
 * Phase 10.5 stress testing utility.
 */

import type { MarginalUtilityAnalysis, MarginalUtilityMetrics, SynergyAnalysis } from './MarginalUtilityTypes';

/**
 * Diff result for a single stat comparison
 */
export interface StatDiff {
  statId: string;
  rankingChange: number; // Positive = moved up, negative = moved down
  winRateChange: number; // Absolute change in win rate
  winRateChangePercent: number; // Percentage change
  confidenceIntervalChange: {
    lowerChange: number;
    upperChange: number;
  };
  matchupCountChange: number;
  oldRanking: number;
  newRanking: number;
  oldWinRate: number;
  newWinRate: number;
}

/**
 * Diff result for a synergy pair comparison
 */
export interface SynergyDiff {
  pairId: string;
  statIds: [string, string];
  synergyMultiplierChange: number; // Absolute change
  synergyMultiplierChangePercent: number; // Percentage change
  observedWinRateChange: number;
  expectedWinRateChange: number;
  significanceChange: 'gained' | 'lost' | 'unchanged';
  classificationChange: 'became_op' | 'became_weak' | 'became_neutral' | 'unchanged';
  oldSynergyMultiplier: number;
  newSynergyMultiplier: number;
  oldIsSignificant: boolean;
  newIsSignificant: boolean;
  oldClassification: 'OP' | 'Weak' | 'Neutral';
  newClassification: 'OP' | 'Weak' | 'Neutral';
}

/**
 * Complete diff analysis between two marginal utility runs
 */
export interface RunDiffAnalysis {
  /** Identifier for this diff analysis */
  id: string;
  /** Comparison metadata */
  comparison: {
    baselineRun: string;
    comparisonRun: string;
    timestamp: number;
  };
  /** Configuration differences */
  configDiffs: {
    simulationCountChanged: boolean;
    seedChanged: boolean;
    thresholdsChanged: boolean;
    oldConfig: MarginalUtilityAnalysis['config'];
    newConfig: MarginalUtilityAnalysis['config'];
  };
  /** Stat ranking and performance diffs */
  statDiffs: StatDiff[];
  /** Synergy analysis diffs */
  synergyDiffs: SynergyDiff[];
  /** Summary statistics */
  summary: {
    statsWithSignificantChange: number; // >5% win rate change
    synergiesWithSignificantChange: number; // >10% synergy multiplier change
    rankingChanges: {
      improved: number; // Stats that moved up in ranking
      declined: number; // Stats that moved down in ranking
      unchanged: number;
    };
    synergyClassificationChanges: {
      becameOp: number;
      becameWeak: number;
      becameNeutral: number;
      lostSignificance: number;
      gainedSignificance: number;
    };
    performanceChanges: {
      totalSimulationsChange: number;
      runtimeChangeMs: number;
      simulationsPerSecondChange: number;
    };
  };
}

/**
 * Tool for comparing marginal utility analysis results between runs
 */
export class MarginalUtilityRunDiffViewer {
  /**
   * Compare two marginal utility analysis runs
   */
  compareRuns(
    baselineRun: MarginalUtilityAnalysis,
    comparisonRun: MarginalUtilityAnalysis
  ): RunDiffAnalysis {
    const statDiffs = this.compareStats(baselineRun.statMetrics, comparisonRun.statMetrics);
    const synergyDiffs = this.compareSynergies(baselineRun.synergyAnalyses, comparisonRun.synergyAnalyses);
    const configDiffs = this.compareConfigs(baselineRun.config, comparisonRun.config);

    const summary = this.generateSummary(statDiffs, synergyDiffs, baselineRun, comparisonRun);

    return {
      id: `diff-${baselineRun.id}-vs-${comparisonRun.id}-${Date.now()}`,
      comparison: {
        baselineRun: baselineRun.id,
        comparisonRun: comparisonRun.id,
        timestamp: Date.now(),
      },
      configDiffs,
      statDiffs,
      synergyDiffs,
      summary,
    };
  }

  /**
   * Compare individual stat metrics between runs
   */
  private compareStats(
    baselineStats: MarginalUtilityMetrics[],
    comparisonStats: MarginalUtilityMetrics[]
  ): StatDiff[] {
    const diffs: StatDiff[] = [];

    // Create maps for O(1) lookup
    const baselineMap = new Map(baselineStats.map(s => [s.statId, s]));
    const comparisonMap = new Map(comparisonStats.map(s => [s.statId, s]));

    // Get all unique stat IDs
    const allStatIds = new Set([...baselineMap.keys(), ...comparisonMap.keys()]);

    for (const statId of allStatIds) {
      const baseline = baselineMap.get(statId);
      const comparison = comparisonMap.get(statId);

      // Skip if stat missing in either run
      if (!baseline || !comparison) {
        continue;
      }

      const rankingChange = baseline.ranking - comparison.ranking;
      const winRateChange = comparison.avgWinRate - baseline.avgWinRate;
      const winRateChangePercent = baseline.avgWinRate !== 0
        ? (winRateChange / baseline.avgWinRate) * 100
        : 0;

      const confidenceIntervalChange = {
        lowerChange: comparison.confidenceInterval.lower - baseline.confidenceInterval.lower,
        upperChange: comparison.confidenceInterval.upper - baseline.confidenceInterval.upper,
      };

      const matchupCountChange = comparison.matchupCount - baseline.matchupCount;

      diffs.push({
        statId,
        rankingChange,
        winRateChange,
        winRateChangePercent,
        confidenceIntervalChange,
        matchupCountChange,
        oldRanking: baseline.ranking,
        newRanking: comparison.ranking,
        oldWinRate: baseline.avgWinRate,
        newWinRate: comparison.avgWinRate,
      });
    }

    // Sort by absolute ranking change (most significant first)
    return diffs.sort((a: StatDiff, b: StatDiff) => Math.abs(b.rankingChange) - Math.abs(a.rankingChange));
  }

  /**
   * Compare synergy analyses between runs
   */
  private compareSynergies(
    baselineSynergies: SynergyAnalysis[],
    comparisonSynergies: SynergyAnalysis[]
  ): SynergyDiff[] {
    const diffs: SynergyDiff[] = [];

    // Create maps for O(1) lookup by pairId
    const baselineMap = new Map(baselineSynergies.map(s => [s.pairId, s]));
    const comparisonMap = new Map(comparisonSynergies.map(s => [s.pairId, s]));

    // Get all unique pair IDs
    const allPairIds = new Set([...baselineMap.keys(), ...comparisonMap.keys()]);

    for (const pairId of allPairIds) {
      const baseline = baselineMap.get(pairId);
      const comparison = comparisonMap.get(pairId);

      // Skip if pair missing in either run
      if (!baseline || !comparison) {
        continue;
      }

      const synergyMultiplierChange = comparison.synergyMultiplier - baseline.synergyMultiplier;
      const synergyMultiplierChangePercent = baseline.synergyMultiplier !== 0
        ? (synergyMultiplierChange / baseline.synergyMultiplier) * 100
        : 0;

      const observedWinRateChange = comparison.observedWinRate - baseline.observedWinRate;
      const expectedWinRateChange = comparison.expectedWinRate - baseline.expectedWinRate;

      // Determine significance change
      let significanceChange: 'gained' | 'lost' | 'unchanged' = 'unchanged';
      if (!baseline.isSignificant && comparison.isSignificant) {
        significanceChange = 'gained';
      } else if (baseline.isSignificant && !comparison.isSignificant) {
        significanceChange = 'lost';
      }

      // Determine classification change
      const getClassification = (s: SynergyAnalysis): 'OP' | 'Weak' | 'Neutral' => {
        if (s.isOpSynergy) return 'OP';
        if (s.isWeakSynergy) return 'Weak';
        return 'Neutral';
      };

      const oldClassification = getClassification(baseline);
      const newClassification = getClassification(comparison);

      let classificationChange: 'became_op' | 'became_weak' | 'became_neutral' | 'unchanged' = 'unchanged';
      if (oldClassification !== newClassification) {
        if (newClassification === 'OP') classificationChange = 'became_op';
        else if (newClassification === 'Weak') classificationChange = 'became_weak';
        else if (newClassification === 'Neutral') classificationChange = 'became_neutral';
      }

      diffs.push({
        pairId,
        statIds: baseline.statIds,
        synergyMultiplierChange,
        synergyMultiplierChangePercent,
        observedWinRateChange,
        expectedWinRateChange,
        significanceChange,
        classificationChange,
        oldSynergyMultiplier: baseline.synergyMultiplier,
        newSynergyMultiplier: comparison.synergyMultiplier,
        oldIsSignificant: baseline.isSignificant,
        newIsSignificant: comparison.isSignificant,
        oldClassification,
        newClassification,
      });
    }

    // Sort by absolute synergy multiplier change (most significant first)
    return diffs.sort((a: SynergyDiff, b: SynergyDiff) => Math.abs(b.synergyMultiplierChange) - Math.abs(a.synergyMultiplierChange));
  }

  /**
   * Compare configuration differences
   */
  private compareConfigs(
    baselineConfig: MarginalUtilityAnalysis['config'],
    comparisonConfig: MarginalUtilityAnalysis['config']
  ) {
    return {
      simulationCountChanged: baselineConfig.simulationCount !== comparisonConfig.simulationCount,
      seedChanged: baselineConfig.seed !== comparisonConfig.seed,
      thresholdsChanged:
        baselineConfig.thresholds.opThreshold !== comparisonConfig.thresholds.opThreshold ||
        baselineConfig.thresholds.weakThreshold !== comparisonConfig.thresholds.weakThreshold,
      oldConfig: baselineConfig,
      newConfig: comparisonConfig,
    };
  }

  /**
   * Generate summary statistics for the diff
   */
  private generateSummary(
    statDiffs: StatDiff[],
    synergyDiffs: SynergyDiff[],
    baselineRun: MarginalUtilityAnalysis,
    comparisonRun: MarginalUtilityAnalysis
  ) {
    const statsWithSignificantChange = statDiffs.filter(d => Math.abs(d.winRateChangePercent) > 5).length;

    const synergiesWithSignificantChange = synergyDiffs.filter(d => Math.abs(d.synergyMultiplierChangePercent) > 10).length;

    const rankingChanges = {
      improved: statDiffs.filter(d => d.rankingChange > 0).length,
      declined: statDiffs.filter(d => d.rankingChange < 0).length,
      unchanged: statDiffs.filter(d => d.rankingChange === 0).length,
    };

    const synergyClassificationChanges = {
      becameOp: synergyDiffs.filter(d => d.classificationChange === 'became_op').length,
      becameWeak: synergyDiffs.filter(d => d.classificationChange === 'became_weak').length,
      becameNeutral: synergyDiffs.filter(d => d.classificationChange === 'became_neutral').length,
      lostSignificance: synergyDiffs.filter(d => d.significanceChange === 'lost').length,
      gainedSignificance: synergyDiffs.filter(d => d.significanceChange === 'gained').length,
    };

    const performanceChanges = {
      totalSimulationsChange: comparisonRun.summary.totalSimulations - baselineRun.summary.totalSimulations,
      runtimeChangeMs: comparisonRun.summary.totalRuntimeMs - baselineRun.summary.totalRuntimeMs,
      simulationsPerSecondChange: comparisonRun.summary.avgSimulationsPerSecond - baselineRun.summary.avgSimulationsPerSecond,
    };

    return {
      statsWithSignificantChange,
      synergiesWithSignificantChange,
      rankingChanges,
      synergyClassificationChanges,
      performanceChanges,
    };
  }

  /**
   * Export diff analysis to various formats
   */
  exportDiff(analysis: RunDiffAnalysis, format: 'json' | 'markdown' | 'csv' = 'markdown'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(analysis, null, 2);
      case 'markdown':
        return this.exportToMarkdown(analysis);
      case 'csv':
        return this.exportToCsv(analysis);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export diff analysis to Markdown format
   */
  private exportToMarkdown(analysis: RunDiffAnalysis): string {
    let markdown = `# Marginal Utility Run Diff Analysis\n\n`;
    markdown += `**Analysis ID:** ${analysis.id}\n`;
    markdown += `**Baseline Run:** ${analysis.comparison.baselineRun}\n`;
    markdown += `**Comparison Run:** ${analysis.comparison.comparisonRun}\n`;
    markdown += `**Generated:** ${new Date(analysis.comparison.timestamp).toISOString()}\n\n`;

    // Configuration Changes
    markdown += `## Configuration Changes\n\n`;
    const config = analysis.configDiffs;
    markdown += `- Simulation Count Changed: ${config.simulationCountChanged ? '✅' : '❌'}\n`;
    markdown += `- Seed Changed: ${config.seedChanged ? '✅' : '❌'}\n`;
    markdown += `- Thresholds Changed: ${config.thresholdsChanged ? '✅' : '❌'}\n\n`;

    if (config.simulationCountChanged) {
      markdown += `**Simulation Count:** ${config.oldConfig.simulationCount} → ${config.newConfig.simulationCount}\n\n`;
    }
    if (config.seedChanged) {
      markdown += `**Seed:** ${config.oldConfig.seed} → ${config.newConfig.seed}\n\n`;
    }
    if (config.thresholdsChanged) {
      markdown += `**OP Threshold:** ${config.oldConfig.thresholds.opThreshold} → ${config.newConfig.thresholds.opThreshold}\n`;
      markdown += `**Weak Threshold:** ${config.oldConfig.thresholds.weakThreshold} → ${config.newConfig.thresholds.weakThreshold}\n\n`;
    }

    // Summary Statistics
    markdown += `## Summary Statistics\n\n`;
    const summary = analysis.summary;
    markdown += `- Stats with significant change (>5% win rate): ${summary.statsWithSignificantChange}\n`;
    markdown += `- Synergies with significant change (>10% multiplier): ${summary.synergiesWithSignificantChange}\n`;
    markdown += `- Ranking changes: +${summary.rankingChanges.improved} improved, -${summary.rankingChanges.declined} declined, ${summary.rankingChanges.unchanged} unchanged\n`;
    markdown += `- Synergy classifications: +${summary.synergyClassificationChanges.becameOp} became OP, +${summary.synergyClassificationChanges.becameWeak} became weak, +${summary.synergyClassificationChanges.becameNeutral} became neutral\n`;
    markdown += `- Significance changes: +${summary.synergyClassificationChanges.gainedSignificance} gained, -${summary.synergyClassificationChanges.lostSignificance} lost\n`;
    markdown += `- Performance: ${summary.performanceChanges.totalSimulationsChange > 0 ? '+' : ''}${summary.performanceChanges.totalSimulationsChange} simulations, ${summary.performanceChanges.runtimeChangeMs > 0 ? '+' : ''}${summary.performanceChanges.runtimeChangeMs}ms runtime, ${summary.performanceChanges.simulationsPerSecondChange > 0 ? '+' : ''}${summary.performanceChanges.simulationsPerSecondChange.toFixed(1)} sim/s\n\n`;

    // Stat Diffs
    if (analysis.statDiffs.length > 0) {
      markdown += `## Stat Performance Diffs\n\n`;
      markdown += `| Stat | Ranking Change | Win Rate Change | Win Rate % Change | Old Rank | New Rank |\n`;
      markdown += `|------|----------------|-----------------|------------------|----------|----------|\n`;

      analysis.statDiffs.forEach(diff => {
        const rankingIcon = diff.rankingChange > 0 ? '⬆️' : diff.rankingChange < 0 ? '⬇️' : '➡️';
        const rankingText = diff.rankingChange === 0 ? '–' : `${rankingIcon} ${Math.abs(diff.rankingChange)}`;
        const winRateText = `${diff.winRateChange > 0 ? '+' : ''}${diff.winRateChange.toFixed(4)}`;
        const winRatePercentText = `${diff.winRateChangePercent > 0 ? '+' : ''}${diff.winRateChangePercent.toFixed(1)}%`;

        markdown += `| ${diff.statId} | ${rankingText} | ${winRateText} | ${winRatePercentText} | ${diff.oldRanking} | ${diff.newRanking} |\n`;
      });
      markdown += `\n`;
    }

    // Synergy Diffs
    if (analysis.synergyDiffs.length > 0) {
      markdown += `## Synergy Analysis Diffs\n\n`;
      markdown += `| Pair | Synergy Change | Multiplier % Change | Significance | Classification | Old → New |\n`;
      markdown += `|------|----------------|---------------------|--------------|----------------|------------|\n`;

      analysis.synergyDiffs.forEach(diff => {
        const synergyText = `${diff.synergyMultiplierChange > 0 ? '+' : ''}${diff.synergyMultiplierChange.toFixed(4)}`;
        const synergyPercentText = `${diff.synergyMultiplierChangePercent > 0 ? '+' : ''}${diff.synergyMultiplierChangePercent.toFixed(1)}%`;

        const significanceIcon = diff.significanceChange === 'gained' ? '🟢' :
                                diff.significanceChange === 'lost' ? '🔴' : '⚪';
        const significanceText = `${significanceIcon} ${diff.significanceChange}`;

        const classificationText = diff.classificationChange === 'unchanged' ?
          `${diff.oldClassification}` :
          `${diff.oldClassification} → ${diff.newClassification}`;

        markdown += `| ${diff.statIds.join(' + ')} | ${synergyText} | ${synergyPercentText} | ${significanceText} | ${classificationText} | ${diff.oldSynergyMultiplier.toFixed(3)} → ${diff.newSynergyMultiplier.toFixed(3)} |\n`;
      });
      markdown += `\n`;
    }

    return markdown;
  }

  /**
   * Export diff analysis to CSV format
   */
  private exportToCsv(analysis: RunDiffAnalysis): string {
    let csv = 'Section,Metric,Value\n';

    // Summary
    csv += `Summary,Stats with significant change,${analysis.summary.statsWithSignificantChange}\n`;
    csv += `Summary,Synergies with significant change,${analysis.summary.synergiesWithSignificantChange}\n`;
    csv += `Summary,Ranking improved,${analysis.summary.rankingChanges.improved}\n`;
    csv += `Summary,Ranking declined,${analysis.summary.rankingChanges.declined}\n`;
    csv += `Summary,Ranking unchanged,${analysis.summary.rankingChanges.unchanged}\n`;

    // Stat diffs
    analysis.statDiffs.forEach(diff => {
      csv += `Stats,${diff.statId} ranking change,${diff.rankingChange}\n`;
      csv += `Stats,${diff.statId} win rate change,${diff.winRateChange}\n`;
      csv += `Stats,${diff.statId} win rate % change,${diff.winRateChangePercent}\n`;
    });

    // Synergy diffs
    analysis.synergyDiffs.forEach(diff => {
      csv += `Synergies,${diff.statIds.join('+')} multiplier change,${diff.synergyMultiplierChange}\n`;
      csv += `Synergies,${diff.statIds.join('+')} significance,${diff.significanceChange}\n`;
      csv += `Synergies,${diff.statIds.join('+')} classification,${diff.classificationChange}\n`;
    });

    return csv;
  }
}

/**
 * Convenience function to create and run a diff analysis
 */
export async function compareMarginalUtilityRuns(
  baselineRun: MarginalUtilityAnalysis,
  comparisonRun: MarginalUtilityAnalysis
): Promise<RunDiffAnalysis> {
  const viewer = new MarginalUtilityRunDiffViewer();
  return viewer.compareRuns(baselineRun, comparisonRun);
}

/**
 * Convenience function to export a diff analysis
 */
export function exportRunDiff(
  analysis: RunDiffAnalysis,
  format: 'json' | 'markdown' | 'csv' = 'markdown'
): string {
  const viewer = new MarginalUtilityRunDiffViewer();
  return viewer.exportDiff(analysis, format);
}
