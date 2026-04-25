#!/usr/bin/env node
/**
 * Playwright Test Coverage Reporter CLI – NP-123
 * 
 * CLI tool for analyzing Playwright test coverage with gap detection,
 * priority scoring, and multi-format export.
 * 
 * @since NP-123
 */

import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createCoverageReporter } from '../../src/analytics/testing/playwrightCoverageReporter';
import type { CoverageReport, CoverageAnalysisConfig } from '../../src/analytics/testing/coverageReportConfig';

const program = new Command();

program
  .name('playwright-coverage-reporter')
  .description('Analyze Playwright test coverage with gap detection and priority suggestions')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analyze test coverage and generate report')
  .option('-o, --output <path>', 'Output directory', 'test-results')
  .option('-f, --format <formats...>', 'Export formats (json, markdown, html, csv)', ['json', 'markdown'])
  .option('--min-coverage <number>', 'Minimum coverage threshold', '70')
  .option('--verbose', 'Verbose output', false)
  .action(async (options) => {
    try {
      console.log('🔍 Analyzing Playwright test coverage...\n');

      const config: Partial<CoverageAnalysisConfig> = {
        minCoverageThreshold: parseInt(options.minCoverage, 10),
        exportFormats: options.format,
      };

      const reporter = createCoverageReporter(config);
      const report = await reporter.analyze();

      console.log('📊 Coverage Statistics:');
      console.log(`  Total Components: ${report.stats.totalComponents}`);
      console.log(`  Tested Components: ${report.stats.testedComponents}`);
      console.log(`  Untested Components: ${report.stats.untestedComponents}`);
      console.log(`  Coverage: ${report.stats.coveragePercentage.toFixed(2)}%\n`);

      if (report.stats.coveragePercentage < config.minCoverageThreshold!) {
        console.log(`⚠️  Coverage below threshold (${config.minCoverageThreshold}%)\n`);
      } else {
        console.log(`✅ Coverage meets threshold (${config.minCoverageThreshold}%)\n`);
      }

      console.log('📋 Coverage by Category:');
      for (const [category, stats] of Object.entries(report.stats.byCategory)) {
        console.log(`  ${category}: ${stats.tested}/${stats.total} (${stats.coverage.toFixed(2)}%)`);
      }
      console.log();

      console.log('🧪 Coverage by Test Type:');
      for (const [testType, stats] of Object.entries(report.stats.byTestType)) {
        console.log(`  ${testType}: ${stats.testCount} tests, ${stats.componentsCovered} components`);
      }
      console.log();

      console.log(`🔴 Top ${Math.min(10, report.gaps.length)} Coverage Gaps:`);
      for (const gap of report.gaps.slice(0, 10)) {
        console.log(`  [${gap.priority.toUpperCase()}] ${gap.componentPath}`);
        console.log(`    Score: ${gap.priorityScore}, Reason: ${gap.reason}`);
        console.log(`    Suggested: ${gap.suggestedTests.join(', ')}`);
      }
      console.log();

      console.log('💡 Recommendations:');
      for (const rec of report.recommendations) {
        console.log(`  [${rec.priority.toUpperCase()}] ${rec.reason}`);
        console.log(`    Components: ${rec.components.length}`);
        console.log(`    Estimated Effort: ${rec.estimatedEffort}`);
      }
      console.log();

      // Export reports
      const outputDir = path.resolve(options.output);
      await fs.mkdir(outputDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const baseFilename = `playwright-coverage-${timestamp}`;

      for (const format of options.format) {
        const filename = `${baseFilename}.${format === 'markdown' ? 'md' : format}`;
        const filepath = path.join(outputDir, filename);

        switch (format) {
          case 'json':
            await exportJSON(report, filepath);
            break;
          case 'markdown':
            await exportMarkdown(report, filepath);
            break;
          case 'html':
            await exportHTML(report, filepath);
            break;
          case 'csv':
            await exportCSV(report, filepath);
            break;
        }

        console.log(`📄 Exported ${format.toUpperCase()}: ${filepath}`);
      }

      console.log('\n✅ Coverage analysis complete!');

      // Emit telemetry
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('playwright_coverage_analyzed', {
          detail: {
            timestamp: Date.now(),
            coveragePercentage: report.stats.coveragePercentage,
            gapsCount: report.gaps.length,
            recommendationsCount: report.recommendations.length,
          },
        }));
      }

      // Exit with error if coverage below threshold
      if (report.stats.coveragePercentage < config.minCoverageThreshold!) {
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error analyzing coverage:', error);
      process.exit(1);
    }
  });

program
  .command('gaps')
  .description('Show coverage gaps only')
  .option('--priority <level>', 'Filter by priority (critical, high, medium, low)')
  .option('--category <category>', 'Filter by category')
  .option('--limit <number>', 'Limit results', '20')
  .action(async (options) => {
    try {
      const reporter = createCoverageReporter();
      const report = await reporter.analyze();

      let gaps = report.gaps;

      if (options.priority) {
        gaps = gaps.filter(g => g.priority === options.priority);
      }

      if (options.category) {
        gaps = gaps.filter(g => g.category === options.category);
      }

      const limit = parseInt(options.limit, 10);
      gaps = gaps.slice(0, limit);

      console.log(`\n🔴 Coverage Gaps (${gaps.length}):\n`);

      for (const gap of gaps) {
        console.log(`[${gap.priority.toUpperCase()}] ${gap.componentPath}`);
        console.log(`  Category: ${gap.category}`);
        console.log(`  Score: ${gap.priorityScore}`);
        console.log(`  Reason: ${gap.reason}`);
        console.log(`  Suggested Tests: ${gap.suggestedTests.join(', ')}`);
        if (gap.relatedComponents.length > 0) {
          console.log(`  Related: ${gap.relatedComponents.slice(0, 3).join(', ')}`);
        }
        console.log();
      }
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

program
  .command('stats')
  .description('Show coverage statistics only')
  .action(async () => {
    try {
      const reporter = createCoverageReporter();
      const report = await reporter.analyze();

      console.log('\n📊 Coverage Statistics:\n');
      console.log(`Total Components: ${report.stats.totalComponents}`);
      console.log(`Tested: ${report.stats.testedComponents}`);
      console.log(`Untested: ${report.stats.untestedComponents}`);
      console.log(`Coverage: ${report.stats.coveragePercentage.toFixed(2)}%\n`);

      console.log('By Category:');
      for (const [category, stats] of Object.entries(report.stats.byCategory)) {
        console.log(`  ${category.padEnd(15)} ${stats.tested.toString().padStart(3)}/${stats.total.toString().padEnd(3)} (${stats.coverage.toFixed(2)}%)`);
      }

      console.log('\nBy Test Type:');
      for (const [testType, stats] of Object.entries(report.stats.byTestType)) {
        console.log(`  ${testType.padEnd(15)} ${stats.testCount} tests, ${stats.componentsCovered} components`);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

/**
 * Exports report as JSON.
 */
async function exportJSON(report: CoverageReport, filepath: string): Promise<void> {
  await fs.writeFile(filepath, JSON.stringify(report, null, 2), 'utf-8');
}

/**
 * Exports report as Markdown.
 */
async function exportMarkdown(report: CoverageReport, filepath: string): Promise<void> {
  const lines: string[] = [];

  lines.push('# Playwright Test Coverage Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date(report.timestamp).toISOString()}`);
  lines.push('');

  lines.push('## Coverage Statistics');
  lines.push('');
  lines.push(`- **Total Components:** ${report.stats.totalComponents}`);
  lines.push(`- **Tested Components:** ${report.stats.testedComponents}`);
  lines.push(`- **Untested Components:** ${report.stats.untestedComponents}`);
  lines.push(`- **Coverage:** ${report.stats.coveragePercentage.toFixed(2)}%`);
  lines.push('');

  lines.push('### Coverage by Category');
  lines.push('');
  lines.push('| Category | Tested | Total | Coverage |');
  lines.push('|----------|--------|-------|----------|');
  for (const [category, stats] of Object.entries(report.stats.byCategory)) {
    lines.push(`| ${category} | ${stats.tested} | ${stats.total} | ${stats.coverage.toFixed(2)}% |`);
  }
  lines.push('');

  lines.push('### Coverage by Test Type');
  lines.push('');
  lines.push('| Test Type | Tests | Components Covered |');
  lines.push('|-----------|-------|-------------------|');
  for (const [testType, stats] of Object.entries(report.stats.byTestType)) {
    lines.push(`| ${testType} | ${stats.testCount} | ${stats.componentsCovered} |`);
  }
  lines.push('');

  lines.push('## Coverage Gaps');
  lines.push('');
  lines.push('| Priority | Component | Score | Reason | Suggested Tests |');
  lines.push('|----------|-----------|-------|--------|-----------------|');
  for (const gap of report.gaps.slice(0, 50)) {
    const suggested = gap.suggestedTests.join(', ');
    lines.push(`| ${gap.priority} | \`${gap.componentPath}\` | ${gap.priorityScore} | ${gap.reason} | ${suggested} |`);
  }
  lines.push('');

  lines.push('## Recommendations');
  lines.push('');
  for (const rec of report.recommendations) {
    lines.push(`### ${rec.priority.toUpperCase()}: ${rec.reason}`);
    lines.push('');
    lines.push(`**Estimated Effort:** ${rec.estimatedEffort}`);
    lines.push('');
    lines.push('**Components:**');
    for (const component of rec.components) {
      lines.push(`- \`${component}\``);
    }
    lines.push('');
  }

  await fs.writeFile(filepath, lines.join('\n'), 'utf-8');
}

/**
 * Exports report as HTML.
 */
async function exportHTML(report: CoverageReport, filepath: string): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Playwright Coverage Report</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
    h1 { color: #333; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
    .stat-card { background: #f9f9f9; padding: 15px; border-radius: 4px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: bold; color: #2563eb; }
    .stat-label { color: #666; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f9f9f9; font-weight: 600; }
    .priority-critical { color: #dc2626; font-weight: bold; }
    .priority-high { color: #ea580c; font-weight: bold; }
    .priority-medium { color: #ca8a04; }
    .priority-low { color: #65a30d; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Playwright Test Coverage Report</h1>
    <p><strong>Generated:</strong> ${new Date(report.timestamp).toISOString()}</p>
    
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${report.stats.totalComponents}</div>
        <div class="stat-label">Total Components</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${report.stats.testedComponents}</div>
        <div class="stat-label">Tested</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${report.stats.untestedComponents}</div>
        <div class="stat-label">Untested</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${report.stats.coveragePercentage.toFixed(1)}%</div>
        <div class="stat-label">Coverage</div>
      </div>
    </div>

    <h2>Coverage Gaps</h2>
    <table>
      <thead>
        <tr>
          <th>Priority</th>
          <th>Component</th>
          <th>Score</th>
          <th>Reason</th>
          <th>Suggested Tests</th>
        </tr>
      </thead>
      <tbody>
        ${report.gaps.slice(0, 50).map(gap => `
          <tr>
            <td class="priority-${gap.priority}">${gap.priority.toUpperCase()}</td>
            <td><code>${gap.componentPath}</code></td>
            <td>${gap.priorityScore}</td>
            <td>${gap.reason}</td>
            <td>${gap.suggestedTests.join(', ')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>Recommendations</h2>
    ${report.recommendations.map(rec => `
      <div style="margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 4px;">
        <h3 class="priority-${rec.priority}">${rec.priority.toUpperCase()}: ${rec.reason}</h3>
        <p><strong>Estimated Effort:</strong> ${rec.estimatedEffort}</p>
        <p><strong>Components (${rec.components.length}):</strong></p>
        <ul>
          ${rec.components.slice(0, 10).map(c => `<li><code>${c}</code></li>`).join('')}
        </ul>
      </div>
    `).join('')}
  </div>
</body>
</html>
  `.trim();

  await fs.writeFile(filepath, html, 'utf-8');
}

/**
 * Exports report as CSV.
 */
async function exportCSV(report: CoverageReport, filepath: string): Promise<void> {
  const lines: string[] = [];

  lines.push('Priority,Component,Category,Score,Reason,Suggested Tests');
  for (const gap of report.gaps) {
    const suggested = gap.suggestedTests.join(';');
    lines.push(`${gap.priority},"${gap.componentPath}",${gap.category},${gap.priorityScore},"${gap.reason}","${suggested}"`);
  }

  await fs.writeFile(filepath, lines.join('\n'), 'utf-8');
}

program.parse();
