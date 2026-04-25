/**
 * Quest Telemetry Inspector Data Export Script
 * 
 * CLI tool for exporting and analyzing quest telemetry data with comprehensive
 * filtering, aggregation, and visualization capabilities. Supports multiple
 * export formats and advanced analytics for quest performance analysis.
 * 
 * @since IV-QuestTelemetry
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { createHash } from 'crypto';
import { program } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import ora from 'ora';

/**
 * Quest telemetry entry with enhanced metadata
 */
interface QuestTelemetryEntry {
  questId: string;
  result: QuestResult;
  timestamp: number;
  sessionId: string;
  questType?: string;
  duration?: number;
  branchCount?: number;
  choiceTime?: number;
  heroic?: boolean;
}

/**
 * Quest result types from the quest engine
 */
type QuestResult = 'perfect' | 'success' | 'partial' | 'fail' | 'deadly';

/**
 * Branch decision from quest execution
 */
interface BranchDecision {
  questId: string;
  branchId: string;
  choice: string;
  timestamp: number;
  choiceTime?: number;
  outcome?: string;
}

/**
 * Aggregated telemetry data for analysis
 */
interface AggregatedTelemetry {
  totalQuests: number;
  successRate: number;
  averageDuration: number;
  totalBranches: number;
  averageChoiceTime: number;
  heroicMoments: number;
  branchDecisions: BranchDecision[];
  recentQuests: QuestTelemetryEntry[];
  questTypeBreakdown: Record<string, number>;
}

/**
 * Export configuration options
 */
interface ExportConfig {
  /** Output format */
  format: 'json' | 'csv' | 'markdown' | 'html';
  /** Filter by quest type */
  questType?: string;
  /** Filter by result type */
  result?: QuestResult;
  /** Filter by date range */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** Include detailed branch decisions */
  includeBranches: boolean;
  /** Include session analysis */
  includeSessions: boolean;
  /** Include performance metrics */
  includePerformance: boolean;
  /** Sort by field */
  sortBy: 'timestamp' | 'duration' | 'successRate';
  /** Sort order */
  sortOrder: 'asc' | 'desc';
  /** Limit number of results */
  limit?: number;
}

/**
 * Analysis metrics for quest performance
 */
interface QuestAnalysisMetrics {
  /** Overall performance metrics */
  overall: {
    totalQuests: number;
    successRate: number;
    averageDuration: number;
    heroicRate: number;
    failureRate: number;
  };
  /** Quest type breakdown */
  questTypes: Record<string, {
    count: number;
    successRate: number;
    averageDuration: number;
    heroicRate: number;
  }>;
  /** Result distribution */
  resultDistribution: Record<QuestResult, number>;
  /** Session analysis */
  sessions: Record<string, {
    questCount: number;
    successRate: number;
    averageDuration: number;
    startTime: number;
    endTime: number;
  }>;
  /** Performance trends */
  trends: {
    hourlyActivity: Record<number, number>;
    dailyActivity: Record<string, number>;
    performanceOverTime: Array<{
      timestamp: number;
      successRate: number;
      averageDuration: number;
    }>;
  };
}

/**
 * Load telemetry data from file or storage
 */
function loadTelemetryData(filePath: string): AggregatedTelemetry | null {
  try {
    if (!existsSync(filePath)) {
      console.error(chalk.red(`Telemetry file not found: ${filePath}`));
      return null;
    }

    const fileContent = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    // Validate data structure
    if (!data.totalQuests || !Array.isArray(data.recentQuests)) {
      console.error(chalk.red('Invalid telemetry data structure'));
      return null;
    }

    return data as AggregatedTelemetry;
  } catch (error) {
    console.error(chalk.red('Error loading telemetry data:'), error);
    return null;
  }
}

/**
 * Filter telemetry data based on configuration
 */
function filterTelemetryData(
  data: AggregatedTelemetry,
  config: ExportConfig
): AggregatedTelemetry {
  let filteredQuests = [...data.recentQuests];

  // Filter by quest type
  if (config.questType) {
    filteredQuests = filteredQuests.filter(quest => 
      quest.questType === config.questType
    );
  }

  // Filter by result
  if (config.result) {
    filteredQuests = filteredQuests.filter(quest => 
      quest.result === config.result
    );
  }

  // Filter by date range
  if (config.dateRange) {
    filteredQuests = filteredQuests.filter(quest => {
      const questDate = new Date(quest.timestamp);
      return questDate >= config.dateRange!.start && questDate <= config.dateRange!.end;
    });
  }

  // Sort results
  filteredQuests.sort((a, b) => {
    let comparison = 0;
    
    switch (config.sortBy) {
      case 'timestamp':
        comparison = a.timestamp - b.timestamp;
        break;
      case 'duration':
        comparison = (a.duration || 0) - (b.duration || 0);
        break;
      case 'successRate':
        comparison = (a.result === 'perfect' ? 1 : a.result === 'success' ? 0.8 : a.result === 'partial' ? 0.5 : 0) -
                     (b.result === 'perfect' ? 1 : b.result === 'success' ? 0.8 : b.result === 'partial' ? 0.5 : 0);
        break;
    }
    
    return config.sortOrder === 'desc' ? -comparison : comparison;
  });

  // Apply limit
  if (config.limit) {
    filteredQuests = filteredQuests.slice(0, config.limit);
  }

  // Recalculate aggregated metrics
  const totalQuests = filteredQuests.length;
  const successCount = filteredQuests.filter(q => q.result === 'perfect' || q.result === 'success').length;
  const successRate = totalQuests > 0 ? (successCount / totalQuests) * 100 : 0;
  const averageDuration = totalQuests > 0 
    ? filteredQuests.reduce((sum, q) => sum + (q.duration || 0), 0) / totalQuests 
    : 0;
  const heroicCount = filteredQuests.filter(q => q.heroic).length;
  const totalBranches = filteredQuests.reduce((sum, q) => sum + (q.branchCount || 0), 0);
  const averageChoiceTime = totalBranches > 0
    ? data.branchDecisions.reduce((sum, bd) => sum + (bd.choiceTime || 0), 0) / totalBranches
    : 0;

  // Recalculate quest type breakdown
  const questTypeBreakdown: Record<string, number> = {};
  filteredQuests.forEach(quest => {
    if (quest.questType) {
      questTypeBreakdown[quest.questType] = (questTypeBreakdown[quest.questType] || 0) + 1;
    }
  });

  // Filter branch decisions if needed
  let branchDecisions = data.branchDecisions;
  if (!config.includeBranches) {
    branchDecisions = [];
  } else {
    // Only include branches for filtered quests
    const questIds = new Set(filteredQuests.map(q => q.questId));
    branchDecisions = data.branchDecisions.filter(bd => questIds.has(bd.questId));
  }

  return {
    totalQuests,
    successRate,
    averageDuration,
    totalBranches,
    averageChoiceTime,
    heroicMoments: heroicCount,
    branchDecisions,
    recentQuests: filteredQuests,
    questTypeBreakdown,
  };
}

/**
 * Generate comprehensive analysis metrics
 */
function generateAnalysisMetrics(data: AggregatedTelemetry): QuestAnalysisMetrics {
  const { recentQuests, branchDecisions } = data;

  // Overall metrics
  const overall = {
    totalQuests: data.totalQuests,
    successRate: data.successRate,
    averageDuration: data.averageDuration,
    heroicRate: data.totalQuests > 0 ? (data.heroicMoments / data.totalQuests) * 100 : 0,
    failureRate: data.totalQuests > 0 ? ((data.totalQuests - recentQuests.filter(q => 
      q.result === 'perfect' || q.result === 'success' || q.result === 'partial'
    ).length) / data.totalQuests) * 100 : 0,
  };

  // Quest type breakdown
  const questTypes: Record<string, any> = {};
  Object.entries(data.questTypeBreakdown).forEach(([type, count]) => {
    const typeQuests = recentQuests.filter(q => q.questType === type);
    const typeSuccess = typeQuests.filter(q => q.result === 'perfect' || q.result === 'success').length;
    const typeHeroic = typeQuests.filter(q => q.heroic).length;
    const typeDuration = typeQuests.reduce((sum, q) => sum + (q.duration || 0), 0) / typeQuests.length;

    questTypes[type] = {
      count,
      successRate: count > 0 ? (typeSuccess / count) * 100 : 0,
      averageDuration: typeDuration || 0,
      heroicRate: count > 0 ? (typeHeroic / count) * 100 : 0,
    };
  });

  // Result distribution
  const resultDistribution: Record<QuestResult, number> = {
    perfect: 0,
    success: 0,
    partial: 0,
    fail: 0,
    deadly: 0,
  };
  
  recentQuests.forEach(quest => {
    resultDistribution[quest.result]++;
  });

  // Session analysis
  const sessions: Record<string, any> = {};
  recentQuests.forEach(quest => {
    if (!sessions[quest.sessionId]) {
      sessions[quest.sessionId] = {
        questCount: 0,
        successCount: 0,
        totalDuration: 0,
        startTime: quest.timestamp,
        endTime: quest.timestamp,
      };
    }
    
    const session = sessions[quest.sessionId];
    session.questCount++;
    if (quest.result === 'perfect' || quest.result === 'success') {
      session.successCount++;
    }
    session.totalDuration += quest.duration || 0;
    session.endTime = Math.max(session.endTime, quest.timestamp);
  });

  // Calculate session metrics
  Object.keys(sessions).forEach(sessionId => {
    const session = sessions[sessionId];
    sessions[sessionId] = {
      questCount: session.questCount,
      successRate: (session.successCount / session.questCount) * 100,
      averageDuration: session.totalDuration / session.questCount,
      startTime: session.startTime,
      endTime: session.endTime,
    };
  });

  // Performance trends
  const hourlyActivity: Record<number, number> = {};
  const dailyActivity: Record<string, number> = {};
  const performanceOverTime: Array<{ timestamp: number; successRate: number; averageDuration: number }> = [];

  recentQuests.forEach(quest => {
    const hour = new Date(quest.timestamp).getHours();
    const day = new Date(quest.timestamp).toISOString().split('T')[0];
    
    hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
    dailyActivity[day] = (dailyActivity[day] || 0) + 1;
  });

  // Calculate rolling performance metrics
  const windowSize = 10;
  for (let i = windowSize; i < recentQuests.length; i++) {
    const window = recentQuests.slice(i - windowSize, i);
    const successCount = window.filter(q => q.result === 'perfect' || q.result === 'success').length;
    const avgDuration = window.reduce((sum, q) => sum + (q.duration || 0), 0) / window.length;
    
    performanceOverTime.push({
      timestamp: window[window.length - 1].timestamp,
      successRate: (successCount / window.length) * 100,
      averageDuration: avgDuration,
    });
  }

  return {
    overall,
    questTypes,
    resultDistribution,
    sessions,
    trends: {
      hourlyActivity,
      dailyActivity,
      performanceOverTime,
    },
  };
}

/**
 * Export data as JSON
 */
function exportAsJSON(data: AggregatedTelemetry, metrics: QuestAnalysisMetrics, outputPath: string): void {
  const exportData = {
    exportTimestamp: new Date().toISOString(),
    telemetry: data,
    analysis: metrics,
    summary: {
      totalQuests: data.totalQuests,
      successRate: data.successRate,
      averageDuration: data.averageDuration,
      heroicMoments: data.heroicMoments,
      questTypes: Object.keys(data.questTypeBreakdown).length,
      totalSessions: Object.keys(metrics.sessions).length,
    },
  };

  writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
  console.log(chalk.green(`✓ JSON export saved to: ${outputPath}`));
}

/**
 * Export data as CSV
 */
function exportAsCSV(data: AggregatedTelemetry, outputPath: string): void {
  const headers = [
    'Quest ID',
    'Result',
    'Timestamp',
    'Session ID',
    'Quest Type',
    'Duration (ms)',
    'Branch Count',
    'Choice Time (ms)',
    'Heroic',
  ];

  const rows = data.recentQuests.map(quest => [
    quest.questId,
    quest.result,
    new Date(quest.timestamp).toISOString(),
    quest.sessionId,
    quest.questType || '',
    quest.duration || 0,
    quest.branchCount || 0,
    quest.choiceTime || 0,
    quest.heroic ? 'Yes' : 'No',
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  writeFileSync(outputPath, csvContent);
  console.log(chalk.green(`✓ CSV export saved to: ${outputPath}`));
}

/**
 * Export data as Markdown
 */
function exportAsMarkdown(data: AggregatedTelemetry, metrics: QuestAnalysisMetrics, outputPath: string): void {
  let markdown = '# Quest Telemetry Report\n\n';
  markdown += `Generated: ${new Date().toISOString()}\n\n`;

  // Summary section
  markdown += '## Summary\n\n';
  markdown += '| Metric | Value |\n';
  markdown += '|--------|-------|\n';
  markdown += `| Total Quests | ${data.totalQuests} |\n`;
  markdown += `| Success Rate | ${data.successRate.toFixed(1)}% |\n`;
  markdown += `| Average Duration | ${data.averageDuration.toFixed(0)}ms |\n`;
  markdown += `| Heroic Moments | ${data.heroicMoments} |\n`;
  markdown += `| Quest Types | ${Object.keys(data.questTypeBreakdown).length} |\n\n';

  // Quest type breakdown
  markdown += '## Quest Type Breakdown\n\n';
  markdown += '| Quest Type | Count | Success Rate | Avg Duration | Heroic Rate |\n';
  markdown += '|------------|-------|-------------|-------------|-------------|\n';
  
  Object.entries(metrics.questTypes).forEach(([type, stats]) => {
    markdown += `| ${type} | ${stats.count} | ${stats.successRate.toFixed(1)}% | ${stats.averageDuration.toFixed(0)}ms | ${stats.heroicRate.toFixed(1)}% |\n`;
  });
  markdown += '\n';

  // Result distribution
  markdown += '## Result Distribution\n\n';
  markdown += '| Result | Count | Percentage |\n';
  markdown += '|--------|-------|------------|\n';
  
  Object.entries(metrics.resultDistribution).forEach(([result, count]) => {
    const percentage = data.totalQuests > 0 ? (count / data.totalQuests * 100).toFixed(1) : '0.0';
    markdown += `| ${result} | ${count} | ${percentage}% |\n`;
  });
  markdown += '\n';

  // Recent quests
  markdown += '## Recent Quests\n\n';
  markdown += '| Quest ID | Result | Type | Duration | Heroic |\n';
  markdown += '|----------|--------|------|----------|--------|\n';
  
  data.recentQuests.slice(0, 20).forEach(quest => {
    markdown += `| ${quest.questId} | ${quest.result} | ${quest.questType || 'N/A'} | ${quest.duration || 0}ms | ${quest.heroic ? 'Yes' : 'No'} |\n`;
  });

  writeFileSync(outputPath, markdown);
  console.log(chalk.green(`✓ Markdown export saved to: ${outputPath}`));
}

/**
 * Export data as HTML
 */
function exportAsHTML(data: AggregatedTelemetry, metrics: QuestAnalysisMetrics, outputPath: string): void {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quest Telemetry Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1, h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; padding: 15px; background: #e9ecef; border-radius: 5px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .danger { color: #dc3545; }
        .heroic { background: linear-gradient(45deg, #ffd700, #ffed4e); padding: 2px 6px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Quest Telemetry Report</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        
        <h2>Summary</h2>
        <div class="metric">
            <div class="metric-value">${data.totalQuests}</div>
            <div class="metric-label">Total Quests</div>
        </div>
        <div class="metric">
            <div class="metric-value ${data.successRate >= 70 ? 'success' : data.successRate >= 50 ? 'warning' : 'danger'}">${data.successRate.toFixed(1)}%</div>
            <div class="metric-label">Success Rate</div>
        </div>
        <div class="metric">
            <div class="metric-value">${data.averageDuration.toFixed(0)}ms</div>
            <div class="metric-label">Avg Duration</div>
        </div>
        <div class="metric">
            <div class="metric-value">${data.heroicMoments}</div>
            <div class="metric-label">Heroic Moments</div>
        </div>
        
        <h2>Quest Type Breakdown</h2>
        <table>
            <thead>
                <tr><th>Quest Type</th><th>Count</th><th>Success Rate</th><th>Avg Duration</th><th>Heroic Rate</th></tr>
            </thead>
            <tbody>
                ${Object.entries(metrics.questTypes).map(([type, stats]) => `
                    <tr>
                        <td>${type}</td>
                        <td>${stats.count}</td>
                        <td class="${stats.successRate >= 70 ? 'success' : stats.successRate >= 50 ? 'warning' : 'danger'}">${stats.successRate.toFixed(1)}%</td>
                        <td>${stats.averageDuration.toFixed(0)}ms</td>
                        <td>${stats.heroicRate.toFixed(1)}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <h2>Recent Quests</h2>
        <table>
            <thead>
                <tr><th>Quest ID</th><th>Result</th><th>Type</th><th>Duration</th><th>Heroic</th></tr>
            </thead>
            <tbody>
                ${data.recentQuests.slice(0, 50).map(quest => `
                    <tr>
                        <td>${quest.questId}</td>
                        <td class="${quest.result === 'perfect' || quest.result === 'success' ? 'success' : quest.result === 'partial' ? 'warning' : 'danger'}">${quest.result}</td>
                        <td>${quest.questType || 'N/A'}</td>
                        <td>${quest.duration || 0}ms</td>
                        <td>${quest.heroic ? '<span class="heroic">HEROIC</span>' : 'No'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>`;

  writeFileSync(outputPath, html);
  console.log(chalk.green(`✓ HTML export saved to: ${outputPath}`));
}

/**
 * Display analysis results in terminal
 */
function displayAnalysisResults(metrics: QuestAnalysisMetrics): void {
  console.log(chalk.bold.blue('\n📊 Quest Telemetry Analysis Results\n'));

  // Overall metrics table
  const overallTable = new Table({
    head: ['Metric', 'Value'],
    colWidths: [20, 15],
    style: {
      head: ['cyan'],
      border: ['gray'],
    },
  });

  overallTable.push(
    ['Total Quests', metrics.overall.totalQuests.toString()],
    ['Success Rate', `${metrics.overall.successRate.toFixed(1)}%`],
    ['Avg Duration', `${metrics.overall.averageDuration.toFixed(0)}ms`],
    ['Heroic Rate', `${metrics.overall.heroicRate.toFixed(1)}%`],
    ['Failure Rate', `${metrics.overall.failureRate.toFixed(1)}%`],
  );

  console.log(overallTable.toString());

  // Quest type breakdown
  if (Object.keys(metrics.questTypes).length > 0) {
    console.log(chalk.bold.blue('\n📋 Quest Type Breakdown\n'));
    
    const typeTable = new Table({
      head: ['Quest Type', 'Count', 'Success Rate', 'Avg Duration', 'Heroic Rate'],
      colWidths: [15, 8, 12, 12, 12],
      style: {
        head: ['cyan'],
        border: ['gray'],
      },
    });

    Object.entries(metrics.questTypes).forEach(([type, stats]) => {
      typeTable.push([
        type,
        stats.count.toString(),
        `${stats.successRate.toFixed(1)}%`,
        `${stats.averageDuration.toFixed(0)}ms`,
        `${stats.heroicRate.toFixed(1)}%`,
      ]);
    });

    console.log(typeTable.toString());
  }

  // Result distribution
  console.log(chalk.bold.blue('\n📈 Result Distribution\n'));
  
  const resultTable = new Table({
    head: ['Result', 'Count', 'Percentage'],
    colWidths: [12, 8, 12],
    style: {
      head: ['cyan'],
      border: ['gray'],
    },
  });

  Object.entries(metrics.resultDistribution).forEach(([result, count]) => {
    const percentage = metrics.overall.totalQuests > 0 ? (count / metrics.overall.totalQuests * 100).toFixed(1) : '0.0';
    const color = result === 'perfect' || result === 'success' ? 'green' : 
                 result === 'partial' ? 'yellow' : 'red';
    
    resultTable.push([
      result,
      count.toString(),
      `${percentage}%`,
    ]);
  });

  console.log(resultTable.toString());

  // Session analysis
  if (Object.keys(metrics.sessions).length > 0) {
    console.log(chalk.bold.blue('\n🎮 Session Analysis\n'));
    
    const sessionTable = new Table({
      head: ['Session ID', 'Quests', 'Success Rate', 'Avg Duration', 'Duration'],
      colWidths: [20, 8, 12, 12, 15],
      style: {
        head: ['cyan'],
        border: ['gray'],
      },
    });

    Object.entries(metrics.sessions).slice(0, 10).forEach(([sessionId, session]) => {
      const sessionDuration = session.endTime - session.startTime;
      const durationMinutes = Math.floor(sessionDuration / 60000);
      const durationSeconds = Math.floor((sessionDuration % 60000) / 1000);
      
      sessionTable.push([
        sessionId.substring(0, 8) + '...',
        session.questCount.toString(),
        `${session.successRate.toFixed(1)}%`,
        `${session.averageDuration.toFixed(0)}ms`,
        `${durationMinutes}m ${durationSeconds}s`,
      ]);
    });

    console.log(sessionTable.toString());
  }

  // Performance trends
  if (metrics.trends.performanceOverTime.length > 0) {
    console.log(chalk.bold.blue('\n📊 Performance Trends (Last 10 windows)\n'));
    
    const trendTable = new Table({
      head: ['Time', 'Success Rate', 'Avg Duration'],
      colWidths: [20, 12, 12],
      style: {
        head: ['cyan'],
        border: ['gray'],
      },
    });

    metrics.trends.performanceOverTime.slice(-10).forEach(trend => {
      const time = new Date(trend.timestamp).toLocaleTimeString();
      trendTable.push([
        time,
        `${trend.successRate.toFixed(1)}%`,
        `${trend.averageDuration.toFixed(0)}ms`,
      ]);
    });

    console.log(trendTable.toString());
  }
}

/**
 * Main export function
 */
function exportTelemetryData(
  inputPath: string,
  outputPath: string,
  config: ExportConfig
): void {
  const spinner = ora('Loading telemetry data...').start();

  try {
    // Load telemetry data
    const data = loadTelemetryData(inputPath);
    if (!data) {
      spinner.fail('Failed to load telemetry data');
      return;
    }

    spinner.succeed('Telemetry data loaded');

    // Filter data
    const filteredData = filterTelemetryData(data, config);
    
    // Generate analysis metrics
    const analysisSpinner = ora('Generating analysis metrics...').start();
    const metrics = generateAnalysisMetrics(filteredData);
    analysisSpinner.succeed('Analysis metrics generated');

    // Create output directory if needed
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Export based on format
    const exportSpinner = ora(`Exporting as ${config.format.toUpperCase()}...`).start();
    
    switch (config.format) {
      case 'json':
        exportAsJSON(filteredData, metrics, outputPath);
        break;
      case 'csv':
        exportAsCSV(filteredData, outputPath);
        break;
      case 'markdown':
        exportAsMarkdown(filteredData, metrics, outputPath);
        break;
      case 'html':
        exportAsHTML(filteredData, metrics, outputPath);
        break;
    }

    exportSpinner.succeed(`Export completed: ${outputPath}`);

    // Display analysis results
    displayAnalysisResults(metrics);

    console.log(chalk.green(`\n✨ Quest telemetry inspection completed successfully!`));

  } catch (error) {
    spinner.fail('Export failed');
    console.error(chalk.red('Export error:'), error);
    process.exit(1);
  }
}

/**
 * CLI setup
 */
function setupCLI(): void {
  program
    .name('quest-telemetry-inspector')
    .description('Quest Telemetry Inspector Tool - Export and analyze quest telemetry data')
    .version('1.0.0');

  program
    .command('export')
    .description('Export telemetry data with analysis')
    .argument('<input>', 'Input telemetry file path')
    .argument('<output>', 'Output file path')
    .option('-f, --format <format>', 'Export format (json, csv, markdown, html)', 'json')
    .option('-t, --quest-type <type>', 'Filter by quest type')
    .option('-r, --result <result>', 'Filter by result (perfect, success, partial, fail, deadly)')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--no-branches', 'Exclude branch decisions')
    .option('--no-sessions', 'Exclude session analysis')
    .option('--no-performance', 'Exclude performance metrics')
    .option('-s, --sort <field>', 'Sort by field (timestamp, duration, successRate)', 'timestamp')
    .option('--sort-order <order>', 'Sort order (asc, desc)', 'desc')
    .option('-l, --limit <number>', 'Limit number of results')
    .action((inputPath, outputPath, options) => {
      const config: ExportConfig = {
        format: options.format as 'json' | 'csv' | 'markdown' | 'html',
        questType: options.questType,
        result: options.result as QuestResult | undefined,
        includeBranches: options.branches !== false,
        includeSessions: options.sessions !== false,
        includePerformance: options.performance !== false,
        sortBy: options.sort as 'timestamp' | 'duration' | 'successRate',
        sortOrder: options.sortOrder as 'asc' | 'desc',
        limit: options.limit ? parseInt(options.limit) : undefined,
      };

      // Parse date range
      if (options.startDate || options.endDate) {
        config.dateRange = {
          start: options.startDate ? new Date(options.startDate) : new Date(0),
          end: options.endDate ? new Date(options.endDate) : new Date(),
        };
      }

      exportTelemetryData(inputPath, outputPath, config);
    });

  program
    .command('analyze')
    .description('Analyze telemetry data and display results')
    .argument('<input>', 'Input telemetry file path')
    .option('-t, --quest-type <type>', 'Filter by quest type')
    .option('-r, --result <result>', 'Filter by result (perfect, success, partial, fail, deadly)')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('-l, --limit <number>', 'Limit number of results')
    .action((inputPath, options) => {
      const config: ExportConfig = {
        format: 'json',
        questType: options.questType,
        result: options.result as QuestResult | undefined,
        includeBranches: true,
        includeSessions: true,
        includePerformance: true,
        sortBy: 'timestamp',
        sortOrder: 'desc',
        limit: options.limit ? parseInt(options.limit) : undefined,
      };

      // Parse date range
      if (options.startDate || options.endDate) {
        config.dateRange = {
          start: options.startDate ? new Date(options.startDate) : new Date(0),
          end: options.endDate ? new Date(options.endDate) : new Date(),
        };
      }

      const spinner = ora('Loading telemetry data...').start();
      
      try {
        const data = loadTelemetryData(inputPath);
        if (!data) {
          spinner.fail('Failed to load telemetry data');
          return;
        }

        spinner.succeed('Telemetry data loaded');
        
        const filteredData = filterTelemetryData(data, config);
        const metrics = generateAnalysisMetrics(filteredData);
        
        displayAnalysisResults(metrics);
        console.log(chalk.green(`\n✨ Analysis completed for ${filteredData.totalQuests} quests!`));
        
      } catch (error) {
        spinner.fail('Analysis failed');
        console.error(chalk.red('Analysis error:'), error);
        process.exit(1);
      }
    });
}

// Run CLI if called directly
if (require.main === module) {
  setupCLI();
  program.parse();
}

export { exportTelemetryData, generateAnalysisMetrics, type ExportConfig, type QuestAnalysisMetrics };
