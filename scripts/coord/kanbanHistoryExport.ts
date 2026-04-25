#!/usr/bin/env tsx

/**
 * Kanban History Export & Archive CLI Tool
 * 
 * Exports kanban history data in multiple formats with filtering,
 * aggregation, and archiving capabilities.
 * 
 * Usage:
 *   npx ts-node scripts/coord/kanbanHistoryExport.ts export [options]
 *   npx ts-node scripts/coord/kanbanHistoryExport.ts analyze [options]
 *   npx ts-node scripts/coord/kanbanHistoryExport.ts archive [options]
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';

// Types
interface KanbanRow {
  id: string;
  status: string;
  dependencies: string;
  agent: string;
  startTime: string;
  endTime: string;
  duration: string;
  estimated: string;
  lastUpdate: string;
  notes: string;
  lineNumber: number;
}

interface ExportConfig {
  format: 'json' | 'csv' | 'markdown' | 'html';
  status?: string;
  agent?: string;
  dateRange?: { start: Date; end: Date };
  includeArchived: boolean;
  sortBy: 'lastUpdate' | 'id' | 'status' | 'duration';
  sortOrder: 'asc' | 'desc';
  limit?: number;
}

interface KanbanAnalytics {
  total: number;
  byStatus: Record<string, number>;
  byAgent: Record<string, number>;
  completedTasks: number;
  averageDuration: number;
  completionRate: number;
  activeTasks: number;
  archivedTasks: number;
  monthlyActivity: Record<string, number>;
  agentPerformance: Record<string, {
    completed: number;
    averageDuration: number;
    completionRate: number;
  }>;
}

// Configuration
const KANBAN_PATH = path.resolve(
  'src',
  'docs',
  'docs',
  'coordinator',
  'agent_assignments.md'
);

const ARCHIVE_PATH = path.resolve('test-results', 'kanban-archives');

// Main functions
async function loadKanbanData(): Promise<KanbanRow[]> {
  const spinner = ora('Loading kanban data...').start();
  
  try {
    if (!existsSync(KANBAN_PATH)) {
      throw new Error(`Kanban file not found: ${KANBAN_PATH}`);
    }

    const raw = await readFile(KANBAN_PATH, 'utf8');
    const lines = raw.split(/\r?\n/);
    const rows: KanbanRow[] = [];

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex];
      if (!line.trim().startsWith('|')) continue;
      if (line.includes('---')) continue;

      const columns = line
        .split('|')
        .slice(1, -1)
        .map((col) => col.trim());

      if (columns.length < 10) continue;
      if (columns[0] === 'Prompt ID/Descrizione') continue;

      const [id, status, dependencies, agent, startTime, endTime, duration, estimated, lastUpdate, notes] = columns;
      
      rows.push({
        id,
        status,
        dependencies,
        agent,
        startTime,
        endTime,
        duration,
        estimated,
        lastUpdate,
        notes,
        lineNumber: lineIndex + 1,
      });
    }

    spinner.succeed(`Loaded ${rows.length} kanban entries`);
    return rows;
  } catch (error) {
    spinner.fail('Failed to load kanban data');
    throw error;
  }
}

function filterData(data: KanbanRow[], config: ExportConfig): KanbanRow[] {
  let filtered = [...data];

  // Status filter
  if (config.status) {
    filtered = filtered.filter(row => row.status === config.status);
  }

  // Agent filter
  if (config.agent) {
    filtered = filtered.filter(row => row.agent === config.agent);
  }

  // Date range filter
  if (config.dateRange) {
    filtered = filtered.filter(row => {
      if (!row.lastUpdate || row.lastUpdate === '-') return false;
      const updateDate = parseDate(row.lastUpdate);
      return updateDate >= config.dateRange!.start && updateDate <= config.dateRange!.end;
    });
  }

  // Sorting
  filtered.sort((a, b) => {
    let comparison = 0;
    
    switch (config.sortBy) {
      case 'lastUpdate':
        comparison = compareDates(a.lastUpdate, b.lastUpdate);
        break;
      case 'id':
        comparison = a.id.localeCompare(b.id);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'duration':
        comparison = compareDurations(a.duration, b.duration);
        break;
    }

    return config.sortOrder === 'desc' ? -comparison : comparison;
  });

  // Limit
  if (config.limit) {
    filtered = filtered.slice(0, config.limit);
  }

  return filtered;
}

function generateAnalytics(data: KanbanRow[]): KanbanAnalytics {
  const total = data.length;
  const byStatus: Record<string, number> = {};
  const byAgent: Record<string, number> = {};
  const monthlyActivity: Record<string, number> = {};
  const agentPerformance: Record<string, { completed: number; averageDuration: number; completionRate: number }> = {};

  let completedTasks = 0;
  let totalDuration = 0;
  let durationCount = 0;

  data.forEach(row => {
    // Status aggregation
    byStatus[row.status] = (byStatus[row.status] || 0) + 1;

    // Agent aggregation
    if (row.agent && row.agent !== '-') {
      byAgent[row.agent] = (byAgent[row.agent] || 0) + 1;
    }

    // Monthly activity
    if (row.lastUpdate && row.lastUpdate !== '-') {
      const date = parseDate(row.lastUpdate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyActivity[monthKey] = (monthlyActivity[monthKey] || 0) + 1;
    }

    // Completion metrics
    if (row.status === 'Completato') {
      completedTasks++;
      
      if (row.duration && row.duration !== '-') {
        const duration = parseDuration(row.duration);
        if (duration > 0) {
          totalDuration += duration;
          durationCount++;
        }
      }
    }

    // Agent performance
    if (row.agent && row.agent !== '-') {
      if (!agentPerformance[row.agent]) {
        agentPerformance[row.agent] = { completed: 0, averageDuration: 0, completionRate: 0 };
      }
      
      if (row.status === 'Completato') {
        agentPerformance[row.agent].completed++;
        
        if (row.duration && row.duration !== '-') {
          const duration = parseDuration(row.duration);
          if (duration > 0) {
            agentPerformance[row.agent].averageDuration += duration;
          }
        }
      }
    }
  });

  // Calculate derived metrics
  const averageDuration = durationCount > 0 ? totalDuration / durationCount : 0;
  const completionRate = total > 0 ? (completedTasks / total) * 100 : 0;
  const activeTasks = (byStatus['In corso'] || 0) + (byStatus['Assegnato'] || 0);
  const archivedTasks = byStatus['Archived'] || 0;

  // Finalize agent performance
  Object.keys(agentPerformance).forEach(agent => {
    const perf = agentPerformance[agent];
    const totalAgentTasks = byAgent[agent] || 0;
    perf.completionRate = totalAgentTasks > 0 ? (perf.completed / totalAgentTasks) * 100 : 0;
    if (perf.completed > 0) {
      perf.averageDuration = perf.averageDuration / perf.completed;
    }
  });

  return {
    total,
    byStatus,
    byAgent,
    completedTasks,
    averageDuration,
    completionRate,
    activeTasks,
    archivedTasks,
    monthlyActivity,
    agentPerformance,
  };
}

// Export functions
async function exportJSON(data: KanbanRow[], analytics: KanbanAnalytics, outputPath: string): Promise<void> {
  const exportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      totalEntries: data.length,
      source: KANBAN_PATH,
    },
    analytics,
    data,
  };

  await writeFile(outputPath, JSON.stringify(exportData, null, 2));
}

async function exportCSV(data: KanbanRow[], outputPath: string): Promise<void> {
  const headers = ['ID', 'Status', 'Dependencies', 'Agent', 'Start Time', 'End Time', 'Duration', 'Estimated', 'Last Update', 'Notes'];
  const csvRows = [headers.join(',')];

  data.forEach(row => {
    const values = [
      escapeCSV(row.id),
      escapeCSV(row.status),
      escapeCSV(row.dependencies),
      escapeCSV(row.agent),
      escapeCSV(row.startTime),
      escapeCSV(row.endTime),
      escapeCSV(row.duration),
      escapeCSV(row.estimated),
      escapeCSV(row.lastUpdate),
      escapeCSV(row.notes),
    ];
    csvRows.push(values.join(','));
  });

  await writeFile(outputPath, csvRows.join('\n'));
}

async function exportMarkdown(data: KanbanRow[], analytics: KanbanAnalytics, outputPath: string): Promise<void> {
  let markdown = '# Kanban History Export\n\n';
  markdown += `*Generated on ${new Date().toLocaleDateString()}*\n\n`;

  // Analytics summary
  markdown += '## Analytics Summary\n\n';
  markdown += `- **Total Tasks**: ${analytics.total}\n`;
  markdown += `- **Completed**: ${analytics.completedTasks} (${analytics.completionRate.toFixed(1)}%)\n`;
  markdown += `- **Active**: ${analytics.activeTasks}\n`;
  markdown += `- **Average Duration**: ${analytics.averageDuration.toFixed(1)} minutes\n\n`;

  // Status breakdown
  markdown += '### Status Breakdown\n\n';
  markdown += '| Status | Count |\n';
  markdown += '|--------|-------|\n';
  Object.entries(analytics.byStatus).forEach(([status, count]) => {
    markdown += `| ${status} | ${count} |\n`;
  });
  markdown += '\n';

  // Agent performance
  markdown += '### Agent Performance\n\n';
  markdown += '| Agent | Completed | Avg Duration | Completion Rate |\n';
  markdown += '|-------|-----------|--------------|-----------------|\n';
  Object.entries(analytics.agentPerformance).forEach(([agent, perf]) => {
    markdown += `| ${agent} | ${perf.completed} | ${perf.averageDuration.toFixed(1)} min | ${perf.completionRate.toFixed(1)}% |\n`;
  });
  markdown += '\n';

  // Detailed data
  markdown += '## Detailed Data\n\n';
  markdown += '| ID | Status | Agent | Duration | Last Update |\n';
  markdown += '|----|--------|-------|----------|-------------|\n';
  
  data.forEach(row => {
    markdown += `| ${row.id} | ${row.status} | ${row.agent} | ${row.duration} | ${row.lastUpdate} |\n`;
  });

  await writeFile(outputPath, markdown);
}

async function exportHTML(data: KanbanRow[], analytics: KanbanAnalytics, outputPath: string): Promise<void> {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kanban History Export</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007acc; }
        .metric-label { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #007acc; color: white; }
        tr:hover { background: #f5f5f5; }
        .status-completato { color: #28a745; font-weight: bold; }
        .status-in-corso { color: #ffc107; font-weight: bold; }
        .status-non-assegnato { color: #6c757d; }
        .timestamp { font-size: 12px; color: #999; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Kanban History Export</h1>
        <p class="timestamp">Generated on ${new Date().toLocaleString()}</p>
        
        <div class="summary">
            <div class="metric">
                <div class="metric-value">${analytics.total}</div>
                <div class="metric-label">Total Tasks</div>
            </div>
            <div class="metric">
                <div class="metric-value">${analytics.completedTasks}</div>
                <div class="metric-label">Completed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${analytics.completionRate.toFixed(1)}%</div>
                <div class="metric-label">Completion Rate</div>
            </div>
            <div class="metric">
                <div class="metric-value">${analytics.averageDuration.toFixed(1)}m</div>
                <div class="metric-label">Avg Duration</div>
            </div>
        </div>

        <h2>Agent Performance</h2>
        <table>
            <thead>
                <tr>
                    <th>Agent</th>
                    <th>Completed</th>
                    <th>Avg Duration</th>
                    <th>Completion Rate</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(analytics.agentPerformance).map(([agent, perf]) => `
                    <tr>
                        <td>${agent}</td>
                        <td>${perf.completed}</td>
                        <td>${perf.averageDuration.toFixed(1)} min</td>
                        <td>${perf.completionRate.toFixed(1)}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <h2>Detailed Task History</h2>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Status</th>
                    <th>Agent</th>
                    <th>Duration</th>
                    <th>Last Update</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(row => `
                    <tr>
                        <td><code>${row.id}</code></td>
                        <td class="status-${row.status.toLowerCase().replace(/\s+/g, '-')}">${row.status}</td>
                        <td>${row.agent}</td>
                        <td>${row.duration}</td>
                        <td>${row.lastUpdate}</td>
                        <td>${row.notes.substring(0, 100)}${row.notes.length > 100 ? '...' : ''}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>`;

  await writeFile(outputPath, html);
}

// Utility functions
function parseDate(dateStr: string): Date {
  if (!dateStr || dateStr === '-') return new Date(0);
  
  // Handle various date formats
  const formats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
    /^\d{1,2}-\d{1,2}-\d{4}$/, // D-M-YYYY
  ];

  for (const format of formats) {
    if (format.test(dateStr)) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) return date;
    }
  }

  // Try parsing as is
  return new Date(dateStr);
}

function compareDates(dateA: string, dateB: string): number {
  const dA = parseDate(dateA);
  const dB = parseDate(dateB);
  return dA.getTime() - dB.getTime();
}

function parseDuration(durationStr: string): number {
  if (!durationStr || durationStr === '-') return 0;
  
  const match = durationStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function compareDurations(durationA: string, durationB: string): number {
  const dA = parseDuration(durationA);
  const dB = parseDuration(durationB);
  return dA - dB;
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// CLI commands
async function handleExport(options: any) {
  const spinner = ora('Exporting kanban data...').start();
  
  try {
    const data = await loadKanbanData();
    const config: ExportConfig = {
      format: options.format,
      status: options.status,
      agent: options.agent,
      includeArchived: options.includeArchived,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      limit: options.limit,
    };

    // Parse date range
    if (options.startDate || options.endDate) {
      config.dateRange = {
        start: options.startDate ? new Date(options.startDate) : new Date(0),
        end: options.endDate ? new Date(options.endDate) : new Date(),
      };
    }

    const filteredData = filterData(data, config);
    const analytics = generateAnalytics(filteredData);

    // Ensure output directory exists
    const outputDir = path.dirname(options.output);
    await mkdir(outputDir, { recursive: true });

    // Export based on format
    switch (config.format) {
      case 'json':
        await exportJSON(filteredData, analytics, options.output);
        break;
      case 'csv':
        await exportCSV(filteredData, options.output);
        break;
      case 'markdown':
        await exportMarkdown(filteredData, analytics, options.output);
        break;
      case 'html':
        await exportHTML(filteredData, analytics, options.output);
        break;
    }

    spinner.succeed(`Exported ${filteredData.length} entries to ${options.output}`);
    
    // Display summary
    console.log(chalk.green(`\n✅ Export completed successfully!`));
    console.log(chalk.blue(`📊 Total entries: ${filteredData.length}`));
    console.log(chalk.blue(`📈 Completion rate: ${analytics.completionRate.toFixed(1)}%`));
    console.log(chalk.blue(`⏱️  Average duration: ${analytics.averageDuration.toFixed(1)} minutes`));

  } catch (error) {
    spinner.fail('Export failed');
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

async function handleAnalyze(options: any) {
  const spinner = ora('Analyzing kanban data...').start();
  
  try {
    const data = await loadKanbanData();
    const analytics = generateAnalytics(data);

    spinner.succeed('Analysis completed');

    // Display analytics table
    console.log(chalk.bold.blue('\n📊 Kanban Analytics Summary\n'));

    // Overall metrics
    const summaryTable = new Table({
      head: ['Metric', 'Value'],
      colWidths: [25, 15],
    });

    summaryTable.push(
      ['Total Tasks', analytics.total.toString()],
      ['Completed', analytics.completedTasks.toString()],
      ['Active', analytics.activeTasks.toString()],
      ['Completion Rate', `${analytics.completionRate.toFixed(1)}%`],
      ['Avg Duration', `${analytics.averageDuration.toFixed(1)} min`],
    );

    console.log(summaryTable.toString());

    // Status breakdown
    console.log(chalk.bold.blue('\n📋 Status Breakdown\n'));
    const statusTable = new Table({
      head: ['Status', 'Count', 'Percentage'],
      colWidths: [15, 10, 12],
    });

    Object.entries(analytics.byStatus).forEach(([status, count]) => {
      const percentage = ((count / analytics.total) * 100).toFixed(1);
      statusTable.push([status, count.toString(), `${percentage}%`]);
    });

    console.log(statusTable.toString());

    // Agent performance
    if (Object.keys(analytics.agentPerformance).length > 0) {
      console.log(chalk.bold.blue('\n👥 Agent Performance\n'));
      const agentTable = new Table({
        head: ['Agent', 'Completed', 'Avg Duration', 'Completion Rate'],
        colWidths: [15, 10, 12, 15],
      });

      Object.entries(analytics.agentPerformance).forEach(([agent, perf]) => {
        agentTable.push([
          agent,
          perf.completed.toString(),
          `${perf.averageDuration.toFixed(1)} min`,
          `${perf.completionRate.toFixed(1)}%`,
        ]);
      });

      console.log(agentTable.toString());
    }

    // Monthly activity
    if (Object.keys(analytics.monthlyActivity).length > 0) {
      console.log(chalk.bold.blue('\n📅 Monthly Activity\n'));
      const monthlyTable = new Table({
        head: ['Month', 'Tasks'],
        colWidths: [10, 8],
      });

      Object.entries(analytics.monthlyActivity)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([month, count]) => {
          monthlyTable.push([month, count.toString()]);
        });

      console.log(monthlyTable.toString());
    }

  } catch (error) {
    spinner.fail('Analysis failed');
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

async function handleArchive(options: any) {
  const spinner = ora('Archiving kanban data...').start();
  
  try {
    const data = await loadKanbanData();
    const archiveDate = new Date().toISOString().split('T')[0];
    const archiveDir = path.join(ARCHIVE_PATH, archiveDate);
    
    await mkdir(archiveDir, { recursive: true });

    // Archive in multiple formats
    const analytics = generateAnalytics(data);
    
    await Promise.all([
      exportJSON(data, analytics, path.join(archiveDir, 'kanban-history.json')),
      exportCSV(data, path.join(archiveDir, 'kanban-history.csv')),
      exportMarkdown(data, analytics, path.join(archiveDir, 'kanban-history.md')),
      exportHTML(data, analytics, path.join(archiveDir, 'kanban-history.html')),
    ]);

    // Create archive metadata
    const metadata = {
      archivedAt: new Date().toISOString(),
      totalEntries: data.length,
      analytics,
      source: KANBAN_PATH,
      archivePath: archiveDir,
    };

    await writeFile(
      path.join(archiveDir, 'archive-metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    spinner.succeed(`Archived ${data.length} entries to ${archiveDir}`);
    
    console.log(chalk.green(`\n✅ Archive created successfully!`));
    console.log(chalk.blue(`📁 Archive location: ${archiveDir}`));
    console.log(chalk.blue(`📊 Total entries: ${data.length}`));
    console.log(chalk.blue(`📈 Completion rate: ${analytics.completionRate.toFixed(1)}%`));

  } catch (error) {
    spinner.fail('Archive failed');
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

// CLI setup
program
  .name('kanban-history-export')
  .description('CLI tool for exporting and archiving kanban history data')
  .version('1.0.0');

program
  .command('export')
  .description('Export kanban data to various formats')
  .option('-f, --format <format>', 'Export format (json, csv, markdown, html)', 'json')
  .option('-o, --output <path>', 'Output file path', 'kanban-export.json')
  .option('-s, --status <status>', 'Filter by status')
  .option('-a, --agent <agent>', 'Filter by agent')
  .option('--start-date <date>', 'Filter by start date (YYYY-MM-DD)')
  .option('--end-date <date>', 'Filter by end date (YYYY-MM-DD)')
  .option('--sort-by <field>', 'Sort by field (lastUpdate, id, status, duration)', 'lastUpdate')
  .option('--sort-order <order>', 'Sort order (asc, desc)', 'desc')
  .option('--limit <number>', 'Limit number of entries')
  .option('--include-archived', 'Include archived entries')
  .action(handleExport);

program
  .command('analyze')
  .description('Display kanban analytics and summary')
  .action(handleAnalyze);

program
  .command('archive')
  .description('Archive kanban data in all formats')
  .option('--dry-run', 'Show what would be archived without creating files')
  .action(handleArchive);

program.parse();
