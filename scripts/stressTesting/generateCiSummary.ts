#!/usr/bin/env node

/**
 * Generate CI Summary Report
 * 
 * Script to generate summary reports from CI stress testing results
 * in JSON and Markdown formats for easy consumption.
 * 
 * @module generateCiSummary
 * @since 2026-01-11
 * @author Hermes-CI
 */

import { Command } from 'commander';
import { readFile, readdir, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

interface CIResults {
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
  cacheHit?: boolean;
  timestamp: string;
}

interface SummaryReport {
  timestamp: string;
  config: CIResults['config'];
  results: CIResults['results'];
  duration: number;
  cacheHit: boolean;
  matrix?: {
    seeds: number[];
    results: Record<string, CIResults['results']>;
  };
  performance: {
    durationPerSimulation: number;
    simulationsPerSecond: number;
    cacheEfficiency: number;
  };
  insights: {
    topSynergies: number;
    topWeaknesses: number;
    analysisCoverage: number;
  };
}

/**
 * Load CI results from directory
 */
async function loadCIResults(inputDir: string): Promise<CIResults | null> {
  try {
    const metadataFile = join(inputDir, 'ci-metadata.json');
    const metadata = JSON.parse(await readFile(metadataFile, 'utf8')) as CIResults;
    return metadata;
  } catch (error) {
    console.error('Failed to load CI results:', error);
    return null;
  }
}

/**
 * Load matrix results from multiple directories
 */
async function loadMatrixResults(inputDir: string): Promise<Record<string, CIResults['results']>> {
  const matrixResults: Record<string, CIResults['results']> = {};
  
  try {
    const entries = await readdir(inputDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('seed-')) {
        const seedDir = join(inputDir, entry.name);
        const metadataFile = join(seedDir, 'ci-metadata.json');
        
        try {
          const metadata = JSON.parse(await readFile(metadataFile, 'utf8')) as CIResults;
          if (metadata.results) {
            matrixResults[entry.name] = metadata.results;
          }
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
 * Calculate performance metrics
 */
function calculatePerformanceMetrics(results: CIResults): SummaryReport['performance'] {
  const durationPerSimulation = results.duration / results.simulationsRun;
  const simulationsPerSecond = results.simulationsRun / (results.duration / 1000);
  const cacheEfficiency = results.cacheHit ? 100 : 0;
  
  return {
    durationPerSimulation: Math.round(durationPerSimulation * 1000) / 1000,
    simulationsPerSecond: Math.round(simulationsPerSecond * 100) / 100,
    cacheEfficiency,
  };
}

/**
 * Generate insights from results
 */
function generateInsights(results: CIResults): SummaryReport['insights'] {
  const totalPairs = results.pairsAnalyzed;
  const synergyRate = results.topSynergies / totalPairs;
  const weaknessRate = results.topWeaknesses / totalPairs;
  
  return {
    topSynergies: results.topSynergies,
    topWeaknesses: results.topWeaknesses,
    analysisCoverage: Math.round(((results.topSynergies + results.topWeaknesses) / totalPairs) * 100),
  };
}

/**
 * Generate summary report
 */
async function generateSummaryReport(
  inputDir: string,
  outputDir: string,
  formats: string[]
): Promise<void> {
  console.log('📊 Generating CI Summary Report...');
  
  // Load main CI results
  const mainResults = await loadCIResults(inputDir);
  if (!mainResults) {
    throw new Error('No CI results found in input directory');
  }
  
  // Load matrix results if available
  const matrixResults = await loadMatrixResults(inputDir);
  const matrixSeeds = Object.keys(matrixResults).map(key => parseInt(key.replace('seed-', '')));
  
  // Generate report
  const report: SummaryReport = {
    timestamp: mainResults.timestamp,
    config: mainResults.config,
    results: mainResults.results,
    duration: mainResults.duration,
    cacheHit: mainResults.cacheHit || false,
    matrix: matrixSeeds.length > 0 ? {
      seeds: matrixSeeds,
      results: matrixResults,
    } : undefined,
    performance: calculatePerformanceMetrics(mainResults),
    insights: generateInsights(mainResults),
  };
  
  // Create output directory
  await mkdir(outputDir, { recursive: true });
  
  // Generate reports in requested formats
  for (const format of formats) {
    switch (format) {
      case 'json':
        await writeFile(
          join(outputDir, 'summary.json'),
          JSON.stringify(report, null, 2)
        );
        console.log('✅ JSON report generated');
        break;
        
      case 'markdown':
        const markdown = generateMarkdownReport(report);
        await writeFile(
          join(outputDir, 'summary.md'),
          markdown
        );
        console.log('✅ Markdown report generated');
        break;
        
      default:
        console.warn(`Unknown format: ${format}`);
    }
  }
  
  console.log(`📊 Summary report saved to: ${outputDir}`);
}

/**
 * Generate Markdown report
 */
function generateMarkdownReport(report: SummaryReport): string {
  const { config, results, performance, insights, matrix } = report;
  
  let markdown = `# 🧪 Stress Testing CI Summary Report

**Generated:** ${new Date(report.timestamp).toLocaleString()}
**Environment:** ${config.environment}
**Duration:** ${(report.duration / 1000).toFixed(1)}s
**Cache Hit:** ${report.cacheHit ? '✅ Yes' : '❌ No'}

## 📊 Configuration

| Setting | Value |
|---------|-------|
| Iterations | ${config.iterations.toLocaleString()} |
| Seed | ${config.seed} |
| Environment | ${config.environment} |

## 🎯 Results

| Metric | Value |
|--------|-------|
| Archetypes Generated | ${results.archetypesGenerated.toLocaleString()} |
| Simulations Run | ${results.simulationsRun.toLocaleString()} |
| Pairs Analyzed | ${results.pairsAnalyzed.toLocaleString()} |
| Top Synergies | ${results.topSynergies} |
| Top Weaknesses | ${results.topWeaknesses} |
| Output Path | \`${results.outputPath}\` |

## ⚡ Performance

| Metric | Value |
|--------|-------|
| Duration per Simulation | ${performance.durationPerSimulation}ms |
| Simulations per Second | ${performance.simulationsPerSecond} |
| Cache Efficiency | ${performance.cacheEfficiency}% |

## 🔍 Insights

- **Top Synergies:** ${insights.topSynergies} stat pairs show strong synergy (>1.15x multiplier)
- **Top Weaknesses:** ${insights.topWeaknesses} stat pairs show weak synergy (<0.95x multiplier)
- **Analysis Coverage:** ${insights.analysisCoverage}% of pairs show significant deviation from expected values

`;

  if (matrix && matrix.seeds.length > 0) {
    markdown += `

## 🔄 Matrix Testing Results

**Seeds Tested:** ${matrix.seeds.join(', ')}

### Seed Comparison

| Seed | Archetypes | Simulations | Top Synergies | Top Weaknesses |
|------|------------|-------------|---------------|---------------|
`;

    for (const [seedName, seedResults] of Object.entries(matrix.results)) {
      const seed = seedName.replace('seed-', '');
      markdown += `| ${seed} | ${seedResults.archetypesGenerated.toLocaleString()} | ${seedResults.simulationsRun.toLocaleString()} | ${seedResults.topSynergies} | ${seedResults.topWeaknesses} |\n`;
    }

    // Calculate matrix statistics
    const avgSynergies = Object.values(matrix.results)
      .reduce((sum, r) => sum + r.topSynergies, 0) / Object.keys(matrix.results).length;
    const avgWeaknesses = Object.values(matrix.results)
      .reduce((sum, r) => sum + r.topWeaknesses, 0) / Object.keys(matrix.results).length;
    
    markdown += `
### Matrix Statistics
- **Average Top Synergies:** ${avgSynergies.toFixed(1)}
- **Average Top Weaknesses:** ${avgWeaknesses.toFixed(1)}
- **Variation:** Synergies vary by ${Math.max(...Object.values(matrix.results).map(r => r.topSynergies)) - Math.min(...Object.values(matrix.results).map(r => r.topSynergies))} pairs
`;
  }

  markdown += `

## 📁 Files Generated

- \`analysis.json\` - Complete marginal utility analysis
- \`archetypes.json\` - Generated archetypes data
- \`metadata.json\` - Run configuration and metadata
- \`ci-metadata.json\` - CI run metadata

## 🚀 Next Steps

1. **Review Results:** Check for unexpected synergies or weaknesses
2. **Update Config:** Consider adjusting stat weights based on findings
3. **Investigate Outliers:** Look into pairs with extreme multipliers
4. **Schedule Follow-up:** Plan next stress testing run with different parameters

---

*Report generated by CI Stress Testing Suite*
`;
  
  return markdown;
}

/**
 * Main CLI command
 */
async function main(): Promise<void> {
  const program = new Command();
  
  program
    .name('generate-ci-summary')
    .description('Generate CI Summary Report from stress testing results')
    .option('-i, --input <path>', 'Input directory with CI results', './data/stressTesting/ci')
    .option('-o, --output <path>', 'Output directory for reports', './data/stressTesting/reports')
    .option('-f, --format <formats...>', 'Output formats (json, markdown)', ['json', 'markdown'])
    .action(async (options) => {
      try {
        await generateSummaryReport(
          options.input,
          options.output,
          options.format
        );
        console.log('✅ CI Summary Report generation completed successfully!');
        process.exit(0);
      } catch (error) {
        console.error('❌ Failed to generate CI Summary Report:', error);
        process.exit(1);
      }
    });
  
  await program.parseAsync();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
