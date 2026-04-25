#!/usr/bin/env node

import { Command } from 'commander';
import { StressReportGenerator, type StressReport } from '../../src/balancing/analytics/StressReportGenerator';
import { StressTestArchetypeGenerator } from '../../src/balancing/stressTesting/StressTestArchetypeGenerator';
import { BalancerConfigStore } from '../../src/balancing/config/BalancerConfigStore';
// import { PersistenceService } from '../../src/shared/persistence/PersistenceService';
import fs from 'fs/promises';
import path from 'path';

/**
 * CLI tool for generating comprehensive stress test reports
 */
const program = new Command();

program
  .name('stress-report-generator')
  .description('Generate comprehensive stress test reports from Monte Carlo simulations')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate stress test report')
  .option('-f, --format <format>', 'Output format (json|csv|markdown)', 'json')
  .option('-o, --output <path>', 'Output directory', 'test-results')
  .option('-s, --seed <number>', 'Random seed for reproducible results', '42')
  .option('-t, --template <name>', 'Report template name', 'default')
  .option('--filter <type>', 'Filter archetype types (single|pair|baseline)', '')
  .option('--verbose', 'Verbose output')
  .action(async (options) => {
    try {
      console.log('🚀 Generating stress test report...');
      
      // Load configuration
      const config = await BalancerConfigStore.load();
      const generator = await StressTestArchetypeGenerator.create(parseInt(options.seed));
      
      // Generate archetypes
      console.log('📊 Generating stress test archetypes...');
      const archetypes = generator.generateAllArchetypes();
      
      // Create mock scenario for report generation
      const scenario = {
        id: 'stress-test-scenario',
        name: 'Stress Test Scenario',
        description: 'Comprehensive stress testing scenario',
        config,
        archetypes,
        adjustments: [],
        seed: parseInt(options.seed),
      };
      
      // Generate report
      console.log('📈 Generating report...');
      const reportGenerator = new StressReportGenerator(config);
      const report = await reportGenerator.generateReport([scenario]);
      
      // Apply filters if specified
      let filteredReport = report;
      if (options.filter) {
        filteredReport = {
          ...report,
          archetypePerformance: report.archetypePerformance.filter(
            a => a.type === options.filter
          ),
        };
      }
      
      // Export report
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `stress-report-${timestamp}`;
      const outputPath = path.join(options.output, `${filename}.${options.format}`);
      
      console.log(`💾 Saving report to ${outputPath}...`);
      
      switch (options.format) {
        case 'json':
          await exportJSON(filteredReport, outputPath);
          break;
        case 'csv':
          await exportCSV(filteredReport, outputPath);
          break;
        case 'markdown':
          await exportMarkdown(filteredReport, outputPath);
          break;
        default:
          throw new Error(`Unsupported format: ${options.format}`);
      }
      
      // Emit telemetry
      await emitTelemetry('balancer_stress_report_generated', {
        reportId: report.metadata.reportId,
        format: options.format,
        archetypeCount: filteredReport.archetypePerformance.length,
        outputPath,
        timestamp: new Date().toISOString(),
      });
      
      console.log('✅ Report generation completed!');
      console.log(`📄 Report saved to: ${outputPath}`);
      console.log(`📊 Summary: ${filteredReport.summary.totalArchetypes} archetypes processed`);
      
    } catch (error) {
      console.error('❌ Error generating report:', error);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate stress test data integrity')
  .option('-i, --input <path>', 'Input JSON file to validate')
  .action(async (options) => {
    try {
      if (!options.input) {
        throw new Error('Input file path is required');
      }
      
      console.log(`🔍 Validating ${options.input}...`);
      const data = await fs.readFile(options.input, 'utf-8');
      const report = JSON.parse(data) as StressReport;
      
      // Basic validation
      if (!report.metadata || !report.summary || !report.archetypePerformance) {
        throw new Error('Invalid report structure');
      }
      
      console.log('✅ Validation passed!');
      console.log(`📊 Report contains ${report.archetypePerformance.length} archetypes`);
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    }
  });

/**
 * Export report as JSON
 */
async function exportJSON(report: StressReport, outputPath: string): Promise<void> {
  const json = JSON.stringify(report, null, 2);
  await fs.writeFile(outputPath, json, 'utf-8');
}

/**
 * Export report as CSV
 */
async function exportCSV(report: StressReport, outputPath: string): Promise<void> {
  const headers = [
    'Archetype ID',
    'Name',
    'Type',
    'Win Rate',
    'Total Simulations',
    'Wins',
    'Losses',
    'Average Turns',
    'Tested Stats',
    'KPI Score',
  ];
  
  const rows = report.archetypePerformance.map(a => [
    a.archetypeId,
    a.archetypeName,
    a.type,
    a.winRate.toFixed(3),
    a.totalSimulations.toString(),
    a.wins.toString(),
    a.losses.toString(),
    a.averageTurns.toString(),
    a.testedStats.join(';'),
    a.kpiScore.toFixed(2),
  ]);
  
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  await fs.writeFile(outputPath, csv, 'utf-8');
}

/**
 * Export report as Markdown
 */
async function exportMarkdown(report: StressReport, outputPath: string): Promise<void> {
  const markdown = `# Stress Test Report

## Metadata
- **Report ID**: ${report.metadata.reportId}
- **Generated**: ${report.metadata.generatedAt}
- **Total Simulations**: ${report.metadata.totalSimulations}
- **Config Version**: ${report.metadata.configVersion}
- **Seed**: ${report.metadata.seed}

## Summary
- **Total Archetypes**: ${report.summary.totalArchetypes}
- **Single Stat Archetypes**: ${report.summary.singleStatArchetypes}
- **Pair Stat Archetypes**: ${report.summary.pairStatArchetypes}
- **Average Win Rate**: ${(report.summary.averageWinRate * 100).toFixed(2)}%
- **Top Performing**: ${report.summary.topPerformingArchetype}
- **Worst Performing**: ${report.summary.worstPerformingArchetype}

## Archetype Performance

| Name | Type | Win Rate | KPI Score | Tested Stats |
|------|------|----------|-----------|--------------|
${report.archetypePerformance.map(a => 
  `| ${a.archetypeName} | ${a.type} | ${(a.winRate * 100).toFixed(2)}% | ${a.kpiScore.toFixed(2)} | ${a.testedStats.join(', ')} |`
).join('\n')}

## KPI Analysis
- **Highest Value Stat**: ${report.kpiAnalysis.highestValueStat}
- **Lowest Value Stat**: ${report.kpiAnalysis.lowestValueStat}
- **Most Synergistic Pair**: ${report.kpiAnalysis.mostSynergisticPair.join(' + ')}
- **Least Synergistic Pair**: ${report.kpiAnalysis.leastSynergisticPair.join(' + ')}
- **Overall Balance Score**: ${report.kpiAnalysis.overallBalanceScore.toFixed(2)}

---
*Generated by Balancer Stress Report Generator*
`;
  
  await fs.writeFile(outputPath, markdown, 'utf-8');
}

/**
 * Emit telemetry event
 */
async function emitTelemetry(event: string, data: Record<string, unknown>): Promise<void> {
  try {
    const telemetry = {
      eventType: event,
      timestamp: new Date().toISOString(),
      data,
    };
    
    // Save telemetry to test-results
    const telemetryPath = path.join('test-results', `telemetry-${Date.now()}.json`);
    await fs.writeFile(telemetryPath, JSON.stringify(telemetry, null, 2));
    
  } catch (error) {
    console.warn('⚠️ Failed to emit telemetry:', error);
  }
}

// Parse command line arguments
program.parse();
