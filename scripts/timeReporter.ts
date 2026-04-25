#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { loadTimeTrackingData, type TimeEntry, type TimeTrackingData } from './timeTracker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');
const TIME_TRACKING_DIR = resolve(PROJECT_ROOT, 'test-results/time-tracking');

/**
 * Time reporting system for generating metrics and analysis reports.
 * Produces various report formats and statistical analysis of task execution.
 */

interface TimeMetrics {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  totalMinutes: number;
  averageTaskDuration: number;
  longestTask: TimeEntry | null;
  shortestTask: TimeEntry | null;
  completionRate: number;
}

interface CategoryMetrics {
  [category: string]: {
    count: number;
    totalMinutes: number;
    averageMinutes: number;
    completionRate: number;
  };
}

interface AgentMetrics {
  [agent: string]: {
    tasksCompleted: number;
    totalMinutes: number;
    averageMinutes: number;
    categories: { [category: string]: number };
  };
}

interface TrendData {
  date: string;
  tasksCompleted: number;
  totalMinutes: number;
  averageMinutes: number;
}

/**
 * Generate comprehensive time tracking report.
 */
function generateReport(format: 'json' | 'markdown' | 'csv' = 'markdown'): void {
  const data = loadTimeTrackingData();
  
  if (data.entries.length === 0) {
    console.log('📊 No time tracking data available');
    return;
  }
  
  const metrics = calculateMetrics(data);
  const categoryMetrics = calculateCategoryMetrics(data);
  const agentMetrics = calculateAgentMetrics(data);
  const trends = calculateTrends(data);
  
  switch (format) {
    case 'json':
      generateJsonReport(metrics, categoryMetrics, agentMetrics, trends);
      break;
    case 'markdown':
      generateMarkdownReport(metrics, categoryMetrics, agentMetrics, trends);
      break;
    case 'csv':
      generateCsvReport(data);
      break;
    default:
      console.error('❌ Unsupported format. Use: json, markdown, or csv');
      return;
  }
}

/**
 * Calculate overall metrics.
 */
function calculateMetrics(data: TimeTrackingData): TimeMetrics {
  const completedTasks = data.entries.filter(e => e.status === 'completed');
  const totalMinutes = completedTasks.reduce((sum, e) => sum + (e.duration || 0), 0);
  
  const longestTask = completedTasks.length > 0 
    ? completedTasks.reduce((max, e) => (e.duration || 0) > (max.duration || 0) ? e : max)
    : null;
    
  const shortestTask = completedTasks.length > 0
    ? completedTasks.reduce((min, e) => (e.duration || 0) < (min.duration || 0) ? e : min)
    : null;
  
  return {
    totalTasks: data.entries.length,
    completedTasks: completedTasks.length,
    activeTasks: data.entries.filter(e => e.status === 'in_progress').length,
    totalMinutes,
    averageTaskDuration: completedTasks.length > 0 ? totalMinutes / completedTasks.length : 0,
    longestTask,
    shortestTask,
    completionRate: data.entries.length > 0 ? (completedTasks.length / data.entries.length) * 100 : 0,
  };
}

/**
 * Calculate metrics by category.
 */
function calculateCategoryMetrics(data: TimeTrackingData): CategoryMetrics {
  const metrics: CategoryMetrics = {};
  
  data.entries.forEach(entry => {
    if (!metrics[entry.category]) {
      metrics[entry.category] = {
        count: 0,
        totalMinutes: 0,
        averageMinutes: 0,
        completionRate: 0,
      };
    }
    
    metrics[entry.category].count++;
    if (entry.duration) {
      metrics[entry.category].totalMinutes += entry.duration;
    }
  });
  
  // Calculate averages and completion rates
  Object.keys(metrics).forEach(category => {
    const categoryData = data.entries.filter(e => e.category === category);
    const completedInCategory = categoryData.filter(e => e.status === 'completed').length;
    
    metrics[category].averageMinutes = metrics[category].count > 0 
      ? metrics[category].totalMinutes / metrics[category].count 
      : 0;
    metrics[category].completionRate = metrics[category].count > 0 
      ? (completedInCategory / metrics[category].count) * 100 
      : 0;
  });
  
  return metrics;
}

/**
 * Calculate metrics by agent.
 */
function calculateAgentMetrics(data: TimeTrackingData): AgentMetrics {
  const metrics: AgentMetrics = {};
  
  data.entries.forEach(entry => {
    if (!metrics[entry.agent]) {
      metrics[entry.agent] = {
        tasksCompleted: 0,
        totalMinutes: 0,
        averageMinutes: 0,
        categories: {},
      };
    }
    
    if (entry.status === 'completed') {
      metrics[entry.agent].tasksCompleted++;
      if (entry.duration) {
        metrics[entry.agent].totalMinutes += entry.duration;
      }
    }
    
    if (!metrics[entry.agent].categories[entry.category]) {
      metrics[entry.agent].categories[entry.category] = 0;
    }
    metrics[entry.agent].categories[entry.category]++;
  });
  
  // Calculate averages
  Object.keys(metrics).forEach(agent => {
    const agentData = metrics[agent];
    agentData.averageMinutes = agentData.tasksCompleted > 0 
      ? agentData.totalMinutes / agentData.tasksCompleted 
      : 0;
  });
  
  return metrics;
}

/**
 * Calculate trend data (daily aggregation).
 */
function calculateTrends(data: TimeTrackingData): TrendData[] {
  const trends: { [date: string]: TrendData } = {};
  
  data.entries
    .filter(entry => entry.status === 'completed' && entry.endTime)
    .forEach(entry => {
      const date = new Date(entry.endTime!).toISOString().split('T')[0];
      
      if (!trends[date]) {
        trends[date] = {
          date,
          tasksCompleted: 0,
          totalMinutes: 0,
          averageMinutes: 0,
        };
      }
      
      trends[date].tasksCompleted++;
      if (entry.duration) {
        trends[date].totalMinutes += entry.duration;
      }
    });
  
  // Calculate averages
  Object.values(trends).forEach(trend => {
    trend.averageMinutes = trend.tasksCompleted > 0 
      ? trend.totalMinutes / trend.tasksCompleted 
      : 0;
  });
  
  return Object.values(trends).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Generate JSON report.
 */
function generateJsonReport(metrics: TimeMetrics, categoryMetrics: CategoryMetrics, agentMetrics: AgentMetrics, trends: TrendData[]): void {
  const report = {
    generatedAt: new Date().toISOString(),
    metrics,
    categoryMetrics,
    agentMetrics,
    trends,
  };
  
  const reportFile = join(TIME_TRACKING_DIR, 'time-report.json');
  writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf8');
  console.log(`📊 JSON report generated: ${reportFile}`);
}

/**
 * Generate Markdown report.
 */
function generateMarkdownReport(metrics: TimeMetrics, categoryMetrics: CategoryMetrics, agentMetrics: AgentMetrics, trends: TrendData[]): void {
  let report = `# Time Tracking Report\n\n`;
  report += `Generated: ${new Date().toLocaleString()}\n\n`;
  
  // Overview
  report += `## 📊 Overview\n\n`;
  report += `- **Total Tasks**: ${metrics.totalTasks}\n`;
  report += `- **Completed**: ${metrics.completedTasks} (${metrics.completionRate.toFixed(1)}%)\n`;
  report += `- **Active**: ${metrics.activeTasks}\n`;
  report += `- **Total Time**: ${formatMinutes(metrics.totalMinutes)}\n`;
  report += `- **Average Duration**: ${formatMinutes(metrics.averageTaskDuration)}\n\n`;
  
  // Category breakdown
  report += `## 📂 Category Breakdown\n\n`;
  report += `| Category | Tasks | Time | Avg | Completion |\n`;
  report += `|----------|-------|------|-----|------------|\n`;
  
  Object.entries(categoryMetrics)
    .sort(([, a], [, b]) => b.totalMinutes - a.totalMinutes)
    .forEach(([category, data]) => {
      report += `| ${category} | ${data.count} | ${formatMinutes(data.totalMinutes)} | ${formatMinutes(data.averageMinutes)} | ${data.completionRate.toFixed(1)}% |\n`;
    });
  
  report += `\n`;
  
  // Agent performance
  report += `## 👥 Agent Performance\n\n`;
  Object.entries(agentMetrics).forEach(([agent, data]) => {
    report += `### ${agent}\n\n`;
    report += `- **Tasks Completed**: ${data.tasksCompleted}\n`;
    report += `- **Total Time**: ${formatMinutes(data.totalMinutes)}\n`;
    report += `- **Average Duration**: ${formatMinutes(data.averageMinutes)}\n`;
    report += `- **Categories**: ${Object.entries(data.categories).map(([cat, count]) => `${cat} (${count})`).join(', ')}\n\n`;
  });
  
  // Trends
  if (trends.length > 0) {
    report += `## 📈 Recent Trends (Last 7 Days)\n\n`;
    report += `| Date | Tasks | Time | Avg |\n`;
    report += `|------|-------|------|-----|\n`;
    
    trends.slice(-7).forEach(trend => {
      report += `| ${trend.date} | ${trend.tasksCompleted} | ${formatMinutes(trend.totalMinutes)} | ${formatMinutes(trend.averageMinutes)} |\n`;
    });
    
    report += `\n`;
  }
  
  // Notable tasks
  report += `## 🎯 Notable Tasks\n\n`;
  
  if (metrics.longestTask) {
    report += `### Longest Task\n`;
    report += `**${metrics.longestTask.taskId}**: ${metrics.longestTask.taskDescription}\n`;
    report += `Duration: ${formatMinutes(metrics.longestTask.duration || 0)}\n`;
    report += `Agent: ${metrics.longestTask.agent}\n\n`;
  }
  
  if (metrics.shortestTask && metrics.shortestTask !== metrics.longestTask) {
    report += `### Shortest Task\n`;
    report += `**${metrics.shortestTask.taskId}**: ${metrics.shortestTask.taskDescription}\n`;
    report += `Duration: ${formatMinutes(metrics.shortestTask.duration || 0)}\n`;
    report += `Agent: ${metrics.shortestTask.agent}\n\n`;
  }
  
  const reportFile = join(TIME_TRACKING_DIR, 'time-report.md');
  writeFileSync(reportFile, report, 'utf8');
  console.log(`📊 Markdown report generated: ${reportFile}`);
}

/**
 * Generate CSV report.
 */
function generateCsvReport(data: TimeTrackingData): void {
  let csv = 'Task ID,Description,Agent,Category,Status,Start Time,End Time,Duration (min),Estimated (min),Notes,Created At\n';
  
  data.entries.forEach(entry => {
    const row = [
      entry.taskId,
      `"${entry.taskDescription}"`,
      entry.agent,
      entry.category,
      entry.status,
      entry.startTime || '',
      entry.endTime || '',
      entry.duration || '',
      entry.estimatedDuration || '',
      `"${entry.notes || ''}"`,
      entry.createdAt,
    ].join(',');
    
    csv += row + '\n';
  });
  
  const reportFile = join(TIME_TRACKING_DIR, 'time-report.csv');
  writeFileSync(reportFile, csv, 'utf8');
  console.log(`📊 CSV report generated: ${reportFile}`);
}

/**
 * Format minutes for human readable display.
 */
function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  } else {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = Math.round(minutes % 60);
    return `${days}d ${hours}h ${mins}m`;
  }
}

/**
 * Generate dashboard HTML file.
 */
function generateDashboard(): void {
  const data = loadTimeTrackingData();
  const metrics = calculateMetrics(data);
  const categoryMetrics = calculateCategoryMetrics(data);
  
  const dashboard = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Time Tracking Dashboard</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #2563eb; }
        .metric-label { color: #6b7280; margin-top: 5px; }
        .chart-container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .category-bar { display: flex; align-items: center; margin-bottom: 10px; }
        .category-name { width: 150px; font-weight: 500; }
        .category-bar-bg { flex: 1; height: 20px; background: #e5e7eb; border-radius: 10px; overflow: hidden; }
        .category-bar-fill { height: 100%; background: #2563eb; transition: width 0.3s ease; }
        .category-time { margin-left: 10px; font-weight: 500; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🕐 Time Tracking Dashboard</h1>
            <p>Last updated: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value">${metrics.totalTasks}</div>
                <div class="metric-label">Total Tasks</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${metrics.completedTasks}</div>
                <div class="metric-label">Completed</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${formatMinutes(metrics.totalMinutes)}</div>
                <div class="metric-label">Total Time</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${metrics.completionRate.toFixed(1)}%</div>
                <div class="metric-label">Completion Rate</div>
            </div>
        </div>
        
        <div class="chart-container">
            <h2>📂 Time by Category</h2>
            ${Object.entries(categoryMetrics)
              .sort(([, a], [, b]) => b.totalMinutes - a.totalMinutes)
              .map(([category, data]) => {
                const maxMinutes = Math.max(...Object.values(categoryMetrics).map(d => d.totalMinutes));
                const percentage = (data.totalMinutes / maxMinutes) * 100;
                return `
                    <div class="category-bar">
                        <div class="category-name">${category}</div>
                        <div class="category-bar-bg">
                            <div class="category-bar-fill" style="width: ${percentage}%"></div>
                        </div>
                        <div class="category-time">${formatMinutes(data.totalMinutes)}</div>
                    </div>
                `;
              }).join('')}
        </div>
        
        <div class="chart-container">
            <h2>📊 Recent Activity</h2>
            <p>Dashboard refreshes automatically. For detailed reports, check the generated files.</p>
        </div>
    </div>
    
    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>`;
  
  const dashboardFile = join(TIME_TRACKING_DIR, 'dashboard.html');
  writeFileSync(dashboardFile, dashboard, 'utf8');
  console.log(`📊 Dashboard generated: ${dashboardFile}`);
}

/**
 * Parse command line arguments.
 */
function parseArgs(argv: string[]): { command: string; format?: string } {
  return {
    command: argv[2],
    format: argv[3],
  };
}

/**
 * Main CLI handler.
 */
function main(): void {
  const args = parseArgs(process.argv);
  
  switch (args.command) {
    case 'report': {
      const format = args.format as 'json' | 'markdown' | 'csv' || 'markdown';
      generateReport(format);
      break;
    }
      
    case 'dashboard':
      generateDashboard();
      break;
      
    default:
      console.log('📊 Time Reporting System');
      console.log('');
      console.log('Commands:');
      console.log('  report     - Generate time tracking report');
      console.log('  dashboard  - Generate HTML dashboard');
      console.log('');
      console.log('Formats for report command:');
      console.log('  json      - JSON format');
      console.log('  markdown  - Markdown format (default)');
      console.log('  csv       - CSV format');
      console.log('');
      console.log('Examples:');
      console.log('  npm run time-reporter report markdown');
      console.log('  npm run time-reporter dashboard');
      break;
  }
}

// Run main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateReport, generateDashboard, calculateMetrics, calculateCategoryMetrics, calculateAgentMetrics };
export type { TimeMetrics, CategoryMetrics, AgentMetrics, TrendData };
