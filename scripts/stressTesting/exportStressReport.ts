/**
 * Export functions for stress testing report pipeline
 */

export { exportStressReport, generateRanking };
export type { ExportConfig, SynergyRanking };

import { Command } from 'commander';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { StressTestAnalysis, SynergyResult } from '../../src/balancing/stressTesting/types';
import { addDatasetToCatalog, DEFAULT_CONFIG, type DatasetMetadata } from './updateCatalog';
import { generateChecksum } from './updateCatalog';

/**
 * Configuration for report export
 */
interface ExportConfig {
  /** Input JSON file path */
  input: string;
  /** Output directory */
  output: string;
  /** OP synergy threshold (default: 1.15) */
  opThreshold: number;
  /** Weak synergy threshold (default: 0.95) */
  weakThreshold: number;
  /** Include detailed archetype data */
  includeDetails: boolean;
  /** Generate CSV files */
  generateCsv: boolean;
  /** Generate Markdown report */
  generateMarkdown: boolean;
}

/**
 * Ranking summary for top/bottom synergies
 */
interface SynergyRanking {
  topSynergies: Array<{
    stat1: string;
    stat2: string;
    multiplier: number;
    pairScore: number;
    expectedScore: number;
  }>;
  weakSynergies: Array<{
    stat1: string;
    stat2: string;
    multiplier: number;
    pairScore: number;
    expectedScore: number;
  }>;
  anomalies: Array<{
    stat1: string;
    stat2: string;
    reason: string;
    details: string;
  }>;
}

/**
 * Main export function
 */
async function exportStressReport(config: ExportConfig): Promise<void> {
  console.log(`[StressReportExport] Starting export from ${config.input} to ${config.output}`);
  
  // Load analysis data
  const analysis = await loadAnalysis(config.input);
  
  // Generate rankings
  const ranking = generateRanking(
    analysis.synergies, 
    config.opThreshold, 
    config.weakThreshold
  );
  
  // Ensure output directory exists
  await mkdir(config.output, { recursive: true });
  
  // Generate base filename from input file
  const baseName = config.input.split('/').pop()?.replace('.json', '') || 'stress-report';
  
  // Export based on configuration
  if (config.generateCsv) {
    await exportCsv(analysis, ranking, config.output, baseName);
  }
  
  if (config.generateMarkdown) {
    await exportMarkdown(analysis, ranking, config.output, baseName, config);
  }
  
  // Always export JSON as canonical format
  await exportJson(analysis, ranking, config.output, baseName, config);
  
  // Add dataset to catalog with metadata
  const datasetMetadata: Omit<DatasetMetadata, 'id' | 'checksum' | 'size' | 'createdAt' | 'updatedAt'> = {
    name: baseName,
    description: `Stress testing analysis with ${analysis.archetypes.length} archetypes and ${analysis.synergies.length} synergies`,
    version: '1.0.0',
    format: 'json',
    tags: ['stress-testing', 'synergies', 'archetypes'],
    config: {
      balancerVersion: '1.0.0', // Default version
      pointsPerStat: analysis.config.pointsPerStat,
      simulationsPerArchetype: analysis.config.simulationCount,
      seed: analysis.config.seed || 42,
      adjustments: []
    },
    metrics: {
      totalSimulationTime: analysis.totalRuntimeMs,
      archetypeCount: analysis.archetypes.length,
      totalSimulations: analysis.config.simulationCount,
      avgSimulationTime: analysis.totalRuntimeMs / analysis.config.simulationCount,
      memoryPeak: 0 // Not tracked in current analysis
    },
    summary: {
      opSynergies: analysis.synergies.filter(s => s.isOpSynergy).length,
      weakSynergies: analysis.synergies.filter(s => s.isWeakSynergy).length,
      topSynergyMultiplier: Math.max(...analysis.synergies.map(s => s.synergyMultiplier)),
      bottomSynergyMultiplier: Math.min(...analysis.synergies.map(s => s.synergyMultiplier)),
      avgSynergyMultiplier: analysis.synergies.reduce((sum, s) => sum + s.synergyMultiplier, 0) / analysis.synergies.length
    }
  };
  
  try {
    // Read dataset file to calculate checksum and size
    const datasetContent = await readFile(config.input, 'utf-8');
    const checksum = generateChecksum(datasetContent);
    const size = Buffer.byteLength(datasetContent, 'utf8');
    
    // Create complete dataset metadata
    const completeDataset: DatasetMetadata = {
      ...datasetMetadata,
      id: baseName,
      checksum,
      size,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const catalogResult = addDatasetToCatalog(completeDataset, DEFAULT_CONFIG);
    console.log(`[StressReportExport] Added to catalog: ${catalogResult.datasetId}`);
  } catch (error) {
    console.warn(`[StressReportExport] Failed to add to catalog: ${error}`);
    // Don't fail the export if catalog update fails
  }
  
  console.log(`[StressReportExport] Export completed successfully`);
}

/**
 * Load and validate stress test analysis from JSON
 */
async function loadAnalysis(inputPath: string): Promise<StressTestAnalysis> {
  try {
    const content = await readFile(inputPath, 'utf-8');
    const data = JSON.parse(content) as StressTestAnalysis;
    
    // Basic validation
    if (!data.archetypes || !data.marginalUtilities || !data.synergies) {
      throw new Error('Invalid analysis file: missing required fields');
    }
    
    console.log(`[StressReportExport] Loaded analysis with ${data.archetypes.length} archetypes, ${data.synergies.length} synergies`);
    return data;
  } catch (error) {
    console.error(`[StressReportExport] Failed to load analysis: ${error}`);
    throw error;
  }
}

/**
 * Generate ranking summaries from synergy results
 */
function generateRanking(
  synergies: SynergyResult[], 
  _opThreshold: number, 
  _weakThreshold: number
): SynergyRanking {
  const topSynergies = synergies
    .filter(s => s.isOpSynergy)
    .sort((a, b) => b.synergyMultiplier - a.synergyMultiplier)
    .slice(0, 10)
    .map(s => ({
      stat1: s.statIds[0],
      stat2: s.statIds[1],
      multiplier: s.synergyMultiplier,
      pairScore: s.pairScore,
      expectedScore: s.expectedScore
    }));
  
  const weakSynergies = synergies
    .filter(s => s.isWeakSynergy)
    .sort((a, b) => a.synergyMultiplier - b.synergyMultiplier)
    .slice(0, 10)
    .map(s => ({
      stat1: s.statIds[0],
      stat2: s.statIds[1],
      multiplier: s.synergyMultiplier,
      pairScore: s.pairScore,
      expectedScore: s.expectedScore
    }));
  
  const anomalies = synergies
    .filter(s => s.synergyMultiplier > 2.0 || s.synergyMultiplier < 0.5)
    .map(s => ({
      stat1: s.statIds[0],
      stat2: s.statIds[1],
      reason: s.synergyMultiplier > 2.0 ? 'Extreme OP' : 'Extreme Weak',
      details: `Multiplier: ${s.synergyMultiplier.toFixed(3)}, Pair: ${s.pairScore.toFixed(3)}/${s.expectedScore.toFixed(3)}`
    }));
  
  return { topSynergies, weakSynergies, anomalies };
}

/**
 * Export data as JSON
 */
async function exportJson(
  analysis: StressTestAnalysis,
  ranking: SynergyRanking,
  outputDir: string,
  baseName: string,
  config: ExportConfig
): Promise<void> {
  const exportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      thresholds: {
        op: config.opThreshold,
        weak: config.weakThreshold
      },
      config: analysis.config
    },
    summary: {
      totalArchetypes: analysis.archetypes.length,
      totalSynergies: analysis.synergies.length,
      opSynergies: analysis.synergies.filter(s => s.isOpSynergy).length,
      weakSynergies: analysis.synergies.filter(s => s.isWeakSynergy).length,
      totalRuntimeMs: analysis.totalRuntimeMs
    },
    ranking,
    details: config.includeDetails ? {
      marginalUtilities: analysis.marginalUtilities,
      synergies: analysis.synergies,
      heatmapData: analysis.heatmapData
    } : undefined
  };
  
  const filePath = join(outputDir, `${baseName}.json`);
  await writeFile(filePath, JSON.stringify(exportData, null, 2));
  console.log(`[StressReportExport] JSON exported to ${filePath}`);
}

/**
 * Export data as CSV files
 */
async function exportCsv(
  analysis: StressTestAnalysis,
  ranking: SynergyRanking,
  outputDir: string,
  baseName: string
): Promise<void> {
  // Synergies CSV
  const synergiesCsv = [
    'Stat1,Stat2,PairScore,ExpectedScore,Multiplier,IsOP,IsWeak',
    ...analysis.synergies.map(s => 
      `${s.statIds[0]},${s.statIds[1]},${s.pairScore},${s.expectedScore},${s.synergyMultiplier},${s.isOpSynergy},${s.isWeakSynergy}`
    )
  ].join('\n');
  
  await writeFile(join(outputDir, `${baseName}-synergies.csv`), synergiesCsv);
  
  // Top synergies CSV
  const topCsv = [
    'Rank,Stat1,Stat2,Multiplier,PairScore,ExpectedScore',
    ...ranking.topSynergies.map((s, i) => 
      `${i+1},${s.stat1},${s.stat2},${s.multiplier},${s.pairScore},${s.expectedScore}`
    )
  ].join('\n');
  
  await writeFile(join(outputDir, `${baseName}-top-synergies.csv`), topCsv);
  
  // Weak synergies CSV
  const weakCsv = [
    'Rank,Stat1,Stat2,Multiplier,PairScore,ExpectedScore',
    ...ranking.weakSynergies.map((s, i) => 
      `${i+1},${s.stat1},${s.stat2},${s.multiplier},${s.pairScore},${s.expectedScore}`
    )
  ].join('\n');
  
  await writeFile(join(outputDir, `${baseName}-weak-synergies.csv`), weakCsv);
  
  console.log(`[StressReportExport] CSV files exported to ${outputDir}/`);
}

/**
 * Export data as Markdown report
 */
async function exportMarkdown(
  analysis: StressTestAnalysis,
  ranking: SynergyRanking,
  outputDir: string,
  baseName: string,
  config: ExportConfig
): Promise<void> {
  const report = `# Stress Testing Report

Generated: ${new Date().toISOString().replace('T', ' ').substring(0, 19)}

## Summary

- **Total Archetypes**: ${analysis.archetypes.length}
- **Total Synergies**: ${analysis.synergies.length}
- **OP Synergies**: ${analysis.synergies.filter(s => s.isOpSynergy).length} (threshold: ${config.opThreshold})
- **Weak Synergies**: ${analysis.synergies.filter(s => s.isWeakSynergy).length} (threshold: ${config.weakThreshold})
- **Total Runtime**: ${(analysis.totalRuntimeMs / 1000).toFixed(2)}s

## Top 10 OP Synergies

| Rank | Stat 1 | Stat 2 | Multiplier | Pair Score | Expected |
|------|--------|--------|------------|------------|-----------|
${ranking.topSynergies.map((s, i) => 
  `| ${i+1} | ${s.stat1} | ${s.stat2} | ${s.multiplier.toFixed(3)} | ${s.pairScore.toFixed(3)} | ${s.expectedScore.toFixed(3)} |`
).join('\n')}

## Top 10 Weak Synergies

| Rank | Stat 1 | Stat 2 | Multiplier | Pair Score | Expected |
|------|--------|--------|------------|------------|-----------|
${ranking.weakSynergies.map((s, i) => 
  `| ${i+1} | ${s.stat1} | ${s.stat2} | ${s.multiplier.toFixed(3)} | ${s.pairScore.toFixed(3)} | ${s.expectedScore.toFixed(3)} |`
).join('\n')}

${ranking.anomalies.length > 0 ? `
## Anomalies

${ranking.anomalies.map(a => 
  `- **${a.stat1} + ${a.stat2}**: ${a.reason} - ${a.details}`
).join('\n')}
` : ''}

## Configuration

- **Points per Stat**: ${analysis.config.pointsPerStat}
- **Simulations per Archetype**: ${analysis.config.simulationCount}
- **Seed**: ${analysis.config.seed}
- **OP Threshold**: ${config.opThreshold}
- **Weak Threshold**: ${config.weakThreshold}

---

*Generated by Stress Testing Report Pipeline*
`;
  
  const filePath = join(outputDir, `${baseName}.md`);
  await writeFile(filePath, report);
  console.log(`[StressReportExport] Markdown report exported to ${filePath}`);
}

/**
 * CLI setup and execution
 */
async function main(): Promise<void> {
  const program = new Command();
  
  program
    .name('stress-export')
    .description('Export stress testing analysis results in multiple formats')
    .version('1.0.0');
  
  program
    .requiredOption('-i, --input <path>', 'Input JSON file path')
    .requiredOption('-o, --output <dir>', 'Output directory')
    .option('--op-threshold <number>', 'OP synergy threshold', '1.15')
    .option('--weak-threshold <number>', 'Weak synergy threshold', '0.95')
    .option('--no-details', 'Exclude detailed archetype data')
    .option('--no-csv', 'Skip CSV generation')
    .option('--no-markdown', 'Skip Markdown generation')
    .action(async (options) => {
      const config: ExportConfig = {
        input: options.input,
        output: options.output,
        opThreshold: parseFloat(options.opThreshold),
        weakThreshold: parseFloat(options.weakThreshold),
        includeDetails: options.details !== false,
        generateCsv: options.csv !== false,
        generateMarkdown: options.markdown !== false
      };
      
      try {
        await exportStressReport(config);
        process.exit(0);
      } catch (error) {
        console.error('Export failed:', error);
        process.exit(1);
      }
    });
  
  await program.parseAsync();
}

if (require.main === module) {
  main().catch(console.error);
}
