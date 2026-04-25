/**
 * NP-095 – Sample Report Generation
 *
 * Generates comprehensive sample reports for batch stress testing results.
 * Provides human-readable summaries, visualizations, and actionable insights.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import type { BatchExecutionResults, ScenarioExecutionResult } from '../ConfigBalancerBatchRunner';
import type { StressTestResults } from '../StressTestRunner';

/**
 * Generate a comprehensive sample report
 */
export function generateSampleReport(results: BatchExecutionResults): string {
  const { config, scenarioResults, summary, metadata } = results;

  let report = '';

  // Header
  report += '# Config Balancer Stress Test Batch Report\n\n';
  report += `**Batch ID:** ${config.id}\n`;
  report += `**Batch Name:** ${config.name}\n`;
  report += `**Generated:** ${new Date().toISOString()}\n`;
  report += `**Environment:** ${metadata.environment}\n`;
  report += `**Execution Mode:** ${metadata.executionMode}\n\n`;

  // Executive Summary
  report += '## Executive Summary\n\n';
  report += `${summary.totalScenarios} scenarios were executed with a ${formatPercent(summary.successRate)} success rate.\n\n`;

  report += '### Key Metrics\n\n';
  report += `- **Total Scenarios:** ${summary.totalScenarios}\n`;
  report += `- **Successful:** ${summary.successful}\n`;
  report += `- **Failed:** ${summary.failed}\n`;
  report += `- **Timeout:** ${summary.timeout}\n`;
  report += `- **Success Rate:** ${formatPercent(summary.successRate)}\n`;
  report += `- **Total Execution Time:** ${formatDuration(summary.totalExecutionTimeMs)}\n`;
  report += `- **Average Time per Scenario:** ${formatDuration(summary.averageExecutionTimeMs)}\n\n`;

  // Scenario Results
  report += '## Scenario Results\n\n';

  const successfulResults = scenarioResults.filter(r => r.status === 'success');
  const failedResults = scenarioResults.filter(r => r.status === 'failed');
  const timeoutResults = scenarioResults.filter(r => r.status === 'timeout');

  if (successfulResults.length > 0) {
    report += '### ✅ Successful Scenarios\n\n';
    report += '| Scenario | Version | Execution Time | OP Synergies | Weak Synergies |\n';
    report += '|----------|---------|----------------|---------------|----------------|\n';

    successfulResults.forEach(result => {
      if (result.results) {
        const analysis = result.results.analysis;
        report += `| ${result.scenario.name} | ${result.scenario.version} | ${formatDuration(result.durationMs)} | ${analysis.summary.opSynergiesCount} | ${analysis.summary.weakSynergiesCount} |\n`;
      }
    });
    report += '\n';
  }

  if (failedResults.length > 0) {
    report += '### ❌ Failed Scenarios\n\n';
    report += '| Scenario | Version | Error |\n';
    report += '|----------|---------|-------|\n';

    failedResults.forEach(result => {
      report += `| ${result.scenario.name} | ${result.scenario.version} | ${result.error || 'Unknown error'} |\n`;
    });
    report += '\n';
  }

  if (timeoutResults.length > 0) {
    report += '### ⏰ Timeout Scenarios\n\n';
    report += '| Scenario | Version | Timeout After |\n';
    report += '|----------|---------|----------------|\n';

    timeoutResults.forEach(result => {
      report += `| ${result.scenario.name} | ${result.scenario.version} | ${formatDuration(result.durationMs)} |\n`;
    });
    report += '\n';
  }

  // Performance Analysis
  if (successfulResults.length > 0) {
    report += '## Performance Analysis\n\n';

    const performanceData = successfulResults.map(result => ({
      name: result.scenario.name,
      executionTime: result.durationMs,
      simulationsPerSecond: result.results!.analysis.summary.avgSimulationsPerSecond,
      totalSimulations: result.results!.analysis.summary.totalSimulations,
      opSynergies: result.results!.analysis.summary.opSynergiesCount,
      weakSynergies: result.results!.analysis.summary.weakSynergiesCount,
    }));

    // Fastest scenarios
    const fastest = performanceData.sort((a, b) => a.executionTime - b.executionTime).slice(0, 3);
    report += '### 🏃 Fastest Scenarios\n\n';
    fastest.forEach((scenario, index) => {
      report += `${index + 1}. **${scenario.name}** - ${formatDuration(scenario.executionTime)}\n`;
    });
    report += '\n';

    // Most productive scenarios
    const mostProductive = performanceData.sort((a, b) => b.simulationsPerSecond - a.simulationsPerSecond).slice(0, 3);
    report += '### ⚡ Most Productive Scenarios\n\n';
    mostProductive.forEach((scenario, index) => {
      report += `${index + 1}. **${scenario.name}** - ${scenario.simulationsPerSecond.toFixed(0)} sim/sec\n`;
    });
    report += '\n';

    // Highest OP synergy counts
    const highestOp = performanceData.sort((a, b) => b.opSynergies - a.opSynergies).slice(0, 3);
    report += '### 🎯 Highest OP Synergy Detection\n\n';
    highestOp.forEach((scenario, index) => {
      report += `${index + 1}. **${scenario.name}** - ${scenario.opSynergies} OP synergies\n`;
    });
    report += '\n';
  }

  // Recommendations
  report += '## Recommendations\n\n';

  const recommendations = generateRecommendations(results);
  recommendations.forEach((rec, index) => {
    report += `${index + 1}. ${rec}\n`;
  });
  report += '\n';

  // Technical Details
  report += '## Technical Details\n\n';

  report += '### Configuration\n\n';
  report += '```json\n';
  report += JSON.stringify({
    execution: config.execution,
    reporting: config.reporting,
    metadata: config.metadata,
  }, null, 2);
  report += '\n```\n\n';

  report += '### Balancer Config Hash\n\n';
  report += `\`${metadata.balancerConfigHash}\`\n\n`;

  report += '### Run Metadata\n\n';
  report += `- **Run ID:** ${metadata.runId}\n`;
  report += `- **Start Time:** ${new Date(summary.startTime).toISOString()}\n`;
  report += `- **End Time:** ${new Date(summary.endTime).toISOString()}\n`;
  report += `- **Total Duration:** ${formatDuration(summary.totalExecutionTimeMs)}\n\n`;

  return report;
}

/**
 * Generate recommendations based on batch results
 */
function generateRecommendations(results: BatchExecutionResults): string[] {
  const recommendations: string[] = [];
  const { summary, scenarioResults } = results;

  // Success rate recommendations
  if (summary.successRate < 0.8) {
    recommendations.push('**Improve scenario reliability** - Success rate is below 80%. Review failed scenarios and consider adjusting timeouts or resource allocation.');
  }

  // Performance recommendations
  const successfulResults = scenarioResults.filter(r => r.status === 'success');
  if (successfulResults.length > 0) {
    const avgExecutionTime = summary.averageExecutionTimeMs;
    if (avgExecutionTime > 300000) { // 5 minutes
      recommendations.push('**Optimize execution time** - Average scenario execution exceeds 5 minutes. Consider reducing iteration counts or improving parallelization.');
    }
  }

  // Timeout recommendations
  if (summary.timeout > 0) {
    recommendations.push('**Review timeout settings** - Some scenarios timed out. Consider increasing timeout limits or optimizing scenario configurations.');
  }

  // Synergy detection recommendations
  const totalOpSynergies = successfulResults.reduce((sum, r) => sum + (r.results?.analysis.summary.opSynergiesCount || 0), 0);
  const totalWeakSynergies = successfulResults.reduce((sum, r) => sum + (r.results?.analysis.summary.weakSynergiesCount || 0), 0);

  if (totalOpSynergies === 0) {
    recommendations.push('**Review synergy detection thresholds** - No OP synergies detected. Current thresholds may be too restrictive.');
  }

  if (totalWeakSynergies === 0) {
    recommendations.push('**Review synergy detection thresholds** - No weak synergies detected. Current thresholds may be too restrictive.');
  }

  if (totalOpSynergies > totalWeakSynergies * 2) {
    recommendations.push('**Balance detected synergies** - Significantly more OP than weak synergies detected. Review threshold balance.');
  }

  // Parallel execution recommendations
  if (results.config.execution.mode === 'sequential' && summary.totalScenarios > 3) {
    recommendations.push('**Consider parallel execution** - Multiple scenarios detected. Parallel execution could reduce total batch time.');
  }

  // Default recommendations if none generated
  if (recommendations.length === 0) {
    recommendations.push('**Maintain current configuration** - All scenarios executed successfully with good performance metrics.');
  }

  return recommendations;
}

/**
 * Generate a JSON sample report for programmatic consumption
 */
export function generateJSONSampleReport(results: BatchExecutionResults): any {
  return {
    summary: {
      batchId: results.config.id,
      batchName: results.config.name,
      generatedAt: new Date().toISOString(),
      totalScenarios: results.summary.totalScenarios,
      successful: results.summary.successful,
      failed: results.summary.failed,
      timeout: results.summary.timeout,
      successRate: results.summary.successRate,
      totalExecutionTimeMs: results.summary.totalExecutionTimeMs,
      averageExecutionTimeMs: results.summary.averageExecutionTimeMs,
    },
    scenarios: results.scenarioResults.map(result => ({
      id: result.scenario.id,
      name: result.scenario.name,
      version: result.scenario.version,
      status: result.status,
      executionTimeMs: result.durationMs,
      error: result.error,
      metrics: result.results ? {
        totalSimulations: result.results.analysis.summary.totalSimulations,
        opSynergies: result.results.analysis.summary.opSynergiesCount,
        weakSynergies: result.results.analysis.summary.weakSynergiesCount,
        significantSynergies: result.results.analysis.summary.significantSynergiesCount,
        avgSimulationsPerSecond: result.results.analysis.summary.avgSimulationsPerSecond,
      } : null,
    })),
    performance: {
      fastestScenario: results.scenarioResults
        .filter(r => r.status === 'success')
        .sort((a, b) => a.durationMs - b.durationMs)[0]?.scenario.name,
      slowestScenario: results.scenarioResults
        .filter(r => r.status === 'success')
        .sort((a, b) => b.durationMs - a.durationMs)[0]?.scenario.name,
      mostProductiveScenario: results.scenarioResults
        .filter(r => r.status === 'success')
        .sort((a, b) => (b.results?.analysis.summary.avgSimulationsPerSecond || 0) - (a.results?.analysis.summary.avgSimulationsPerSecond || 0))[0]?.scenario.name,
    },
    recommendations: generateRecommendations(results),
    metadata: results.metadata,
  };
}

/**
 * Generate a CSV sample report for spreadsheet analysis
 */
export function generateCSVSampleReport(results: BatchExecutionResults): string {
  const headers = [
    'scenario_id',
    'scenario_name',
    'scenario_version',
    'status',
    'execution_time_ms',
    'error',
    'total_simulations',
    'op_synergies',
    'weak_synergies',
    'significant_synergies',
    'avg_simulations_per_second',
    'priority',
    'estimated_runtime_minutes',
  ];

  const rows: string[] = [headers.join(',')];

  results.scenarioResults.forEach(result => {
    const row = [
      result.scenario.id,
      `"${result.scenario.name}"`,
      result.scenario.version,
      result.status,
      result.durationMs.toString(),
      result.error ? `"${result.error.replace(/"/g, '""')}"` : '',
      result.results?.analysis.summary.totalSimulations.toString() || '',
      result.results?.analysis.summary.opSynergiesCount.toString() || '',
      result.results?.analysis.summary.weakSynergiesCount.toString() || '',
      result.results?.analysis.summary.significantSynergiesCount.toString() || '',
      result.results?.analysis.summary.avgSimulationsPerSecond.toString() || '',
      result.scenario.priority.toString(),
      result.scenario.estimatedRuntimeMinutes.toString(),
    ];
    rows.push(row.join(','));
  });

  // Add summary row
  const summaryRow = [
    'SUMMARY',
    `"${results.config.name}"`,
    '',
    `${results.summary.successful}/${results.summary.totalScenarios}`,
    results.summary.totalExecutionTimeMs.toString(),
    '',
    results.scenarioResults.reduce((sum, r) => sum + (r.results?.analysis.summary.totalSimulations || 0), 0).toString(),
    results.scenarioResults.reduce((sum, r) => sum + (r.results?.analysis.summary.opSynergiesCount || 0), 0).toString(),
    results.scenarioResults.reduce((sum, r) => sum + (r.results?.analysis.summary.weakSynergiesCount || 0), 0).toString(),
    results.scenarioResults.reduce((sum, r) => sum + (r.results?.analysis.summary.significantSynergiesCount || 0), 0).toString(),
    (results.scenarioResults.reduce((sum, r) => sum + (r.results?.analysis.summary.avgSimulationsPerSecond || 0), 0) / Math.max(1, results.scenarioResults.filter(r => r.results).length)).toString(),
    '',
    '',
  ];
  rows.push(summaryRow.join(','));

  return rows.join('\n');
}

/**
 * Generate a performance dashboard HTML report
 */
export function generateHTMLSampleReport(results: BatchExecutionResults): string {
  const successfulResults = results.scenarioResults.filter(r => r.status === 'success');

  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Config Balancer Stress Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; border-left: 4px solid #007bff; }
        .metric h3 { margin: 0 0 10px 0; color: #495057; font-size: 0.9em; text-transform: uppercase; }
        .metric .value { font-size: 2em; font-weight: bold; color: #007bff; }
        .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .chart { background: white; border: 1px solid #dee2e6; border-radius: 6px; padding: 15px; }
        .scenarios { margin-bottom: 30px; }
        .scenario { background: #f8f9fa; margin-bottom: 10px; padding: 15px; border-radius: 6px; border-left: 4px solid #28a745; }
        .scenario.success { border-left-color: #28a745; }
        .scenario.failed { border-left-color: #dc3545; }
        .scenario.timeout { border-left-color: #ffc107; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; }
        .recommendations ul { margin: 0; padding-left: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Config Balancer Stress Test Report</h1>
            <p><strong>${results.config.name}</strong> - Generated on ${new Date().toLocaleString()}</p>
        </div>

        <div class="metrics">
            <div class="metric">
                <h3>Total Scenarios</h3>
                <div class="value">${results.summary.totalScenarios}</div>
            </div>
            <div class="metric">
                <h3>Success Rate</h3>
                <div class="value">${formatPercent(results.summary.successRate)}</div>
            </div>
            <div class="metric">
                <h3>Total Time</h3>
                <div class="value">${formatDuration(results.summary.totalExecutionTimeMs)}</div>
            </div>
            <div class="metric">
                <h3>Avg Time/Scenario</h3>
                <div class="value">${formatDuration(results.summary.averageExecutionTimeMs)}</div>
            </div>
        </div>

        <div class="scenarios">
            <h2>Scenario Results</h2>
`;

  results.scenarioResults.forEach(result => {
    const statusClass = result.status === 'success' ? 'success' : result.status === 'failed' ? 'failed' : 'timeout';
    const statusIcon = result.status === 'success' ? '✅' : result.status === 'failed' ? '❌' : '⏰';

    html += `
            <div class="scenario ${statusClass}">
                <h3>${statusIcon} ${result.scenario.name} (v${result.scenario.version})</h3>
                <p><strong>Status:</strong> ${result.status} | <strong>Execution Time:</strong> ${formatDuration(result.durationMs)}</p>
`;

    if (result.results) {
      html += `
                <p><strong>Simulations:</strong> ${result.results.analysis.summary.totalSimulations.toLocaleString()} |
                   <strong>OP Synergies:</strong> ${result.results.analysis.summary.opSynergiesCount} |
                   <strong>Weak Synergies:</strong> ${result.results.analysis.summary.weakSynergiesCount} |
                   <strong>Performance:</strong> ${result.results.analysis.summary.avgSimulationsPerSecond.toFixed(0)} sim/sec</p>
`;
    }

    if (result.error) {
      html += `<p><strong>Error:</strong> ${result.error}</p>`;
    }

    html += `
            </div>
`;
  });

  html += `
        </div>

        <div class="recommendations">
            <h2>Recommendations</h2>
            <ul>
`;

  const recommendations = generateRecommendations(results);
  recommendations.forEach(rec => {
    html += `                <li>${rec}</li>\n`;
  });

  html += `
            </ul>
        </div>
    </div>
</body>
</html>
`;

  return html;
}

/**
 * Format percentage
 */
function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}
