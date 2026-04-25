#!/usr/bin/env node

/**
 * Aggregate CI Reports
 * 
 * Script to aggregate multiple CI stress testing runs into
 * comprehensive reports with statistical analysis.
 * 
 * @module aggregateCiReports
 * @since 2026-01-11
 * @author Hermes-CI
 */

import { Command } from 'commander';
import { readFile, readdir, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

interface AggregatedReport {
  timestamp: string;
  runs: Array<{
    id: string;
    timestamp: string;
    config: {
      iterations: number;
      seed: number;
      environment: string;
    };
    results: {
      archetypesGenerated: number;
      simulationsRun: number;
      pairsAnalyzed: number;
      topSynergies: number;
      topWeaknesses: number;
      outputPath: string;
      telemetryId?: string;
    };
    duration: number;
    cacheHit: boolean;
  }>;
  statistics: {
    totalRuns: number;
    averageDuration: number;
    totalSimulations: number;
    averageSynergies: number;
    averageWeaknesses: number;
    cacheHitRate: number;
    performanceMetrics: {
      averageSimulationsPerSecond: number;
      averageDurationPerSimulation: number;
    };
  };
  trends: {
    synergyTrend: 'increasing' | 'decreasing' | 'stable';
    weaknessTrend: 'increasing' | 'decreasing' | 'stable';
    performanceTrend: 'improving' | 'degrading' | 'stable';
  };
  insights: {
    consistentSynergies: string[];
    consistentWeaknesses: string[];
    performanceIssues: string[];
    recommendations: string[];
  };
}

/**
 * Load CI metadata from directory
 */
async function loadCIMetadata(inputDir: string): Promise<AggregatedReport['runs']> {
  const runs: AggregatedReport['runs'] = [];
  
  try {
    // Look for ci-metadata.json files
    const entries = await readdir(inputDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile() && entry.name === 'ci-metadata.json') {
        try {
          const metadata = JSON.parse(await readFile(join(inputDir, entry.name), 'utf8'));
          runs.push(metadata);
        } catch (error) {
          console.warn(`Failed to load metadata from ${entry.name}:`, error);
        }
      }
    }
    
    // Sort by timestamp
    runs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
  } catch (error) {
    console.error('Failed to load CI metadata:', error);
  }
  
  return runs;
}

/**
 * Load matrix results from multiple directories
 */
async function loadMatrixResults(inputDir: string): Promise<Record<string, any>> {
  const matrixResults: Record<string, any> = {};
  
  try {
    const entries = await readdir(inputDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('seed-')) {
        const seedDir = join(inputDir, entry.name);
        const metadataFile = join(seedDir, 'ci-metadata.json');
        
        try {
          const metadata = JSON.parse(await readFile(metadataFile, 'utf8'));
          matrixResults[entry.name] = metadata;
        } catch (error) {
          console.warn(`Failed to load matrix results for ${entry.name}:`, error);
        }
      }
    }
  } catch (error) {
    console.warn('Failed to load matrix results:', error);
  }
  
  return matrixResults;
}

/**
 * Calculate statistics from runs
 */
function calculateStatistics(runs: AggregatedReport['runs']): AggregatedReport['statistics'] {
  if (runs.length === 0) {
    return {
      totalRuns: 0,
      averageDuration: 0,
      totalSimulations: 0,
      averageSynergies: 0,
      averageWeaknesses: 0,
      cacheHitRate: 0,
      performanceMetrics: {
        averageSimulationsPerSecond: 0,
        averageDurationPerSimulation: 0,
      },
    };
  }
  
  const totalDuration = runs.reduce((sum, run) => sum + run.duration, 0);
  const totalSimulations = runs.reduce((sum, run) => sum + run.results.simulationsRun, 0);
  const totalSynergies = runs.reduce((sum, run) => sum + run.results.topSynergies, 0);
  const totalWeaknesses = runs.reduce((sum, run) => sum + run.results.topWeaknesses, 0);
  const cacheHits = runs.filter(run => run.cacheHit).length;
  
  const averageSimulationsPerSecond = totalDuration > 0 
    ? (totalSimulations / totalDuration) * 1000 
    : 0;
  
  const averageDurationPerSimulation = totalSimulations > 0
    ? totalDuration / totalSimulations
    : 0;
  
  return {
    totalRuns: runs.length,
    averageDuration: totalDuration / runs.length,
    totalSimulations,
    averageSynergies: totalSynergies / runs.length,
    averageWeaknesses: totalWeaknesses / runs.length,
    cacheHitRate: (cacheHits / runs.length) * 100,
    performanceMetrics: {
      averageSimulationsPerSecond: Math.round(averageSimulationsPerSecond * 100) / 100,
      averageDurationPerSimulation: Math.round(averageDurationPerSimulation * 1000) / 1000,
    },
  };
}

/**
 * Analyze trends from runs
 */
function analyzeTrends(runs: AggregatedReport['runs']): AggregatedReport['trends'] {
  if (runs.length < 3) {
    return {
      synergyTrend: 'stable',
      weaknessTrend: 'stable',
      performanceTrend: 'stable',
    };
  }
  
  // Get last 3 runs for trend analysis
  const recentRuns = runs.slice(-3);
  
  // Analyze synergy trend
  const synergyValues = recentRuns.map(run => run.results.topSynergies);
  const synergyTrend = analyzeTrendDirection(synergyValues);
  
  // Analyze weakness trend
  const weaknessValues = recentRuns.map(run => run.results.topWeaknesses);
  const weaknessTrend = analyzeTrendDirection(weaknessValues);
  
  // Analyze performance trend
  const performanceValues = recentRuns.map(run => run.duration);
  const performanceTrend = analyzeTrendDirection(performanceValues);
  
  return {
    synergyTrend,
    weaknessTrend,
    performanceTrend,
  };
}

/**
 * Analyze trend direction
 */
function analyzeTrendDirection(values: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (values.length < 2) return 'stable';
  
  const first = values[0];
  const last = values[values.length - 1];
  const middle = values[Math.floor(values.length / 2)];
  
  const firstToMiddle = middle - first;
  const middleToLast = last - middle;
  
  if (Math.abs(firstToMiddle) < 1 && Math.abs(middleToLast) < 1) {
    return 'stable';
  }
  
  if (firstToMiddle > 0 && middleToLast > 0) {
    return 'increasing';
  }
  
  if (firstToMiddle < 0 && middleToLast < 0) {
    return 'decreasing';
  }
  
  return 'stable';
}

/**
 * Generate insights from aggregated data
 */
function generateInsights(
  runs: AggregatedReport['runs'],
  statistics: AggregatedReport['statistics']
): AggregatedReport['insights'] {
  const insights: AggregatedReport['insights'] = {
    consistentSynergies: [],
    consistentWeaknesses: [],
    performanceIssues: [],
    recommendations: [],
  };
  
  // Find consistently high/low performing stat pairs
  const synergyCounts = new Map<string, number>();
  const weaknessCounts = new Map<string, number>();
  
  runs.forEach(run => {
    // This would need to be enhanced with actual stat pair data
    // For now, we'll use the counts as indicators
    const synergyKey = `synergies-${run.results.topSynergies}`;
    const weaknessKey = `weaknesses-${run.results.topWeaknesses}`;
    
    synergyCounts.set(synergyKey, (synergyCounts.get(synergyKey) || 0) + 1);
    weaknessCounts.set(weaknessKey, (weaknessCounts.get(weaknessKey) || 0) + 1);
  });
  
  // Find consistent patterns
  synergyCounts.forEach((count, key) => {
    if (count >= runs.length * 0.7) {
      insights.consistentSynergies.push(`${key} appears in ${count}/${runs.length} runs`);
    }
  });
  
  weaknessCounts.forEach((count, key) => {
    if (count >= runs.length * 0.7) {
      insights.consistentWeaknesses.push(`${key} appears in ${count}/${runs.length} runs`);
    }
  });
  
  // Performance insights
  if (statistics.averageDuration > 300000) { // 5 minutes
    insights.performanceIssues.push('Average duration exceeds 5 minutes');
  }
  
  if (statistics.performanceMetrics.averageSimulationsPerSecond < 100) {
    insights.performanceIssues.push('Low simulation throughput (<100/sec)');
  }
  
  if (statistics.cacheHitRate < 50) {
    insights.recommendations.push('Consider enabling caching to improve performance');
  }
  
  if (statistics.averageSynergies > 15) {
    insights.recommendations.push('High number of synergies detected - review stat balance');
  }
  
  if (statistics.averageWeaknesses > 10) {
    insights.recommendations.push('High number of weaknesses detected - review stat interactions');
  }
  
  return insights;
}

/**
 * Generate aggregated report
 */
async function generateAggregatedReport(
  inputDir: string,
  outputDir: string,
  formats: string[]
): Promise<void> {
  console.log('📊 Aggregating CI Reports...');
  
  // Load all CI runs
  const runs = await loadCIMetadata(inputDir);
  console.log(`📋 Loaded ${runs.length} CI runs`);
  
  // Load matrix results
  const matrixResults = await loadMatrixResults(inputDir);
  console.log(`🔄 Loaded ${Object.keys(matrixResults).length} matrix results`);
  
  // Generate statistics
  const statistics = calculateStatistics(runs);
  
  // Analyze trends
  const trends = analyzeTrends(runs);
  
  // Generate insights
  const insights = generateInsights(runs, statistics);
  
  // Create aggregated report
  const report: AggregatedReport = {
    timestamp: new Date().toISOString(),
    runs,
    statistics,
    trends,
    insights,
  };
  
  // Create output directory
  await mkdir(outputDir, { recursive: true });
  
  // Generate reports in requested formats
  for (const format of formats) {
    switch (format) {
      case 'json':
        await writeFile(
          join(outputDir, 'aggregated.json'),
          JSON.stringify(report, null, 2)
        );
        console.log('✅ JSON aggregated report generated');
        break;
        
      case 'markdown':
        const markdown = generateMarkdownReport(report);
        await writeFile(
          join(outputDir, 'aggregated.md'),
          markdown
        );
        console.log('✅ Markdown aggregated report generated');
        break;
        
      default:
        console.warn(`Unknown format: ${format}`);
    }
  }
  
  console.log(`📊 Aggregated report saved to: ${outputDir}`);
}

/**
 * Generate Markdown aggregated report
 */
function generateMarkdownReport(report: AggregatedReport): string {
  const { statistics, trends, insights } = report;
  
  let markdown = `# 🧪 Stress Testing CI Aggregated Report

**Generated:** ${new Date(report.timestamp).toLocaleString()}
**Total Runs:** ${report.runs.length}
**Time Period:** ${report.runs.length > 0 ? `${new Date(report.runs[0].timestamp).toLocaleDateString()} - ${new Date(report.runs[report.runs.length - 1].timestamp).toLocaleDateString()}` : 'N/A'}

## 📊 Statistics

| Metric | Value |
|--------|-------|
| Total Runs | ${statistics.totalRuns.toLocaleString()} |
| Average Duration | ${(statistics.averageDuration / 1000).toFixed(1)}s |
| Total Simulations | ${statistics.totalSimulations.toLocaleString()} |
| Average Synergies | ${statistics.averageSynergies.toFixed(1)} |
| Average Weaknesses | ${statistics.averageWeaknesses.toFixed(1)} |
| Cache Hit Rate | ${statistics.cacheHitRate.toFixed(1)}% |

## ⚡ Performance Metrics

| Metric | Value |
|--------|-------|
| Avg Simulations/Second | ${statistics.performanceMetrics.averageSimulationsPerSecond} |
| Avg Duration/Simulation | ${statistics.performanceMetrics.averageDurationPerSimulation}ms |

## 📈 Trends

- **Synergy Trend:** ${trends.synergyTrend}
- **Weakness Trend:** ${trends.weaknessTrend}
- **Performance Trend:** ${trends.performanceTrend}

## 🔍 Insights

### Consistent Patterns
${insights.consistentSynergies.length > 0 ? insights.consistentSynergies.map(insight => `- ${insight}`).join('\n') : '- No consistent synergy patterns detected'}

${insights.consistentWeaknesses.length > 0 ? insights.consistentWeaknesses.map(insight => `- ${insight}`).join('\n') : ''}

### Performance Issues
${insights.performanceIssues.length > 0 ? insights.performanceIssues.map(insight => `- ${insight}`).join('\n') : '- No performance issues detected'}

### Recommendations
${insights.recommendations.length > 0 ? insights.recommendations.map(insight => `- ${insight}`).join('\n') : '- No specific recommendations'}

## 📋 Recent Runs

| Run ID | Date | Duration | Synergies | Weaknesses | Cache |
|--------|------|----------|-----------|----------|-------|
`;

  // Show last 10 runs
  const recentRuns = report.runs.slice(-10);
  for (const run of recentRuns) {
    const date = new Date(run.timestamp).toLocaleDateString();
    markdown += `| ${run.id} | ${date} | ${(run.duration / 1000).toFixed(1)}s | ${run.results.topSynergies} | ${run.results.topWeaknesses} | ${run.cacheHit ? '✅' : '❌'} |\n`;
  }

  markdown += `
## 📁 Data Files

- \`aggregated.json\` - Complete aggregated data
- \`aggregated.md\` - This markdown report

---

*Aggregated report generated by CI Stress Testing Suite*
`;
  
  return markdown;
}

/**
 * Main CLI command
 */
async function main(): Promise<void> {
  const program = new Command();
  
  program
    .name('aggregate-ci-reports')
    .description('Aggregate CI stress testing reports')
    .option('-i, --input <path>', 'Input directory with CI results', './data/stressTesting')
    .option('-o, --output <path>', 'Output directory for aggregated reports', './data/stressTesting/aggregated')
    .option('-f, --format <formats...>', 'Output formats (json, markdown)', ['json', 'markdown'])
    .action(async (options) => {
      try {
        await generateAggregatedReport(
          options.input,
          options.output,
          options.format
        );
        console.log('✅ CI Reports aggregation completed successfully!');
        process.exit(0);
      } catch (error) {
        console.error('❌ Failed to aggregate CI reports:', error);
        process.exit(1);
      }
    });
  
  await program.parseAsync();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
