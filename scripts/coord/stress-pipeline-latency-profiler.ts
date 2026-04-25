/**
 * Stress Pipeline Latency Profiler
 * 
 * CLI tool for comprehensive latency profiling of stress testing pipeline.
 * Tracks performance metrics, bottlenecks, and trends across all pipeline stages.
 */

import { Command } from 'commander';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { ProfilerConfig } from '../../src/balancing/stressTesting/LatencyProfilerTypes';
import { DEFAULT_PROFILER_CONFIG } from '../../src/balancing/stressTesting/LatencyProfilerTypes';

/**
 * CLI configuration for latency profiler
 */
interface CLIConfig {
  format?: 'json' | 'csv' | 'markdown' | 'html';
  status?: string;
  agent?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'lastUpdate' | 'id' | 'status' | 'duration';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  includeArchived?: boolean;
  outputPath?: string;
}

/**
 * Main CLI program for stress pipeline latency profiling
 */
class StressPipelineLatencyProfiler {
  private config: ProfilerConfig;

  constructor(config?: Partial<ProfilerConfig>) {
    this.config = { ...DEFAULT_PROFILER_CONFIG, ...config };
  }

  /**
   * Parse CLI arguments and execute appropriate command
   */
  async run(): Promise<void> {
    const program = new Command();
    
    program
      .name('stress-pipeline-latency-profiler')
      .description('CLI tool for stress pipeline latency profiling')
      .version('1.0.0')
      .option('-f, --format <format>', 'Export format (json, csv, markdown, html)', 'json')
      .option('-o, --output <path>', 'Output file path', 'kanban-latency-profile.json')
      .option('-s, --status <status>', 'Filter by status')
      .option('-a, --agent <agent>', 'Filter by agent')
      .option('--start-date <date>', 'Filter by start date (YYYY-MM-DD)')
      .option('--end-date <date>', 'Filter by end date (YYYY-MM-DD)')
      .option('--sort-by <field>', 'Sort by field (lastUpdate, id, status, duration)', 'lastUpdate')
      .option('--sort-order <order>', 'Sort order (asc, desc)', 'desc')
      .option('--limit <number>', 'Limit number of entries')
      .option('--include-archived', 'Include archived entries')
      .option('--config', 'Show configuration')
      .option('--reset', 'Reset profiler state')
      .option('--dry-run', 'Show what would be exported without creating files')
      .argument('<command>', 'Command to run (export, analyze, archive)', 'export');

    try {
      await program.parseAsync(process.argv);
      const command = program.args[0];
      
      switch (command) {
        case 'export':
          await this.handleExport(program.opts() as CLIConfig);
          break;
        case 'analyze':
          await this.handleAnalyze();
          break;
        case 'archive':
          await this.handleArchive(program.opts() as CLIConfig);
          break;
        case 'config':
          this.displayConfig();
          break;
        default:
          program.help();
          break;
      }
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  }

  /**
   * Handle export command
   */
  private async handleExport(config: CLIConfig): Promise<void> {
    console.log('📊 Loading kanban data...');
    
    try {
      // Load kanban data
      const kanbanData = await this.loadKanbanData();
      
      // Filter and sort data
      const filteredData = this.filterAndSortData(kanbanData, config);
      
      // Generate basic statistics
      const stats = this.generateBasicStats(filteredData);
      
      // Export in specified format
      const outputPath = config.outputPath || 'kanban-latency-profile.json';
      await this.exportData(stats, config.format || 'json', outputPath);
      
      console.log('✅ Export completed successfully');
      
      // Display summary
      this.displaySummary(stats);
      
    } catch (error) {
      console.error('❌ Export failed');
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  }

  /**
   * Handle analyze command
   */
  private async handleAnalyze(): Promise<void> {
    console.log('📊 Analyzing kanban performance...');
    
    try {
      // Load kanban data
      const kanbanData = await this.loadKanbanData();
      
      // Generate statistics
      const stats = this.generateBasicStats(kanbanData);
      
      console.log('✅ Analysis completed');
      
      // Display analytics
      this.displayAnalytics(stats);
      
    } catch (error) {
      console.error('❌ Analysis failed');
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  }

  /**
   * Handle archive command
   */
  private async handleArchive(config: CLIConfig): Promise<void> {
    console.log('📁 Creating archive...');
    
    try {
      // Load kanban data
      const kanbanData = await this.loadKanbanData();
      
      // Generate statistics
      const stats = this.generateBasicStats(kanbanData);
      
      // Create archive directory
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const archiveDir = `test-results/kanban-archives/${timestamp}`;
      
      // Create archive directory
      await fs.mkdir(archiveDir, { recursive: true });
      
      // Export all formats
      await this.exportData(stats, 'json', `${archiveDir}/kanban-history-${timestamp}.json`);
      await this.exportData(stats, 'csv', `${archiveDir}/kanban-history-${timestamp}.csv`);
      await this.exportData(stats, 'markdown', `${archiveDir}/kanban-report-${timestamp}.md`);
      
      console.log('✅ Archive created successfully');
      
      // Display archive summary
      console.log(`📁 Archive created: ${archiveDir}`);
      console.log(`- JSON: kanban-history-${timestamp}.json`);
      console.log(`- CSV: kanban-history-${timestamp}.csv`);
      console.log(`- Markdown: kanban-report-${timestamp}.md`);
      
    } catch (error) {
      console.error('❌ Archive failed');
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  }

  /**
   * Load kanban data from markdown file
   */
  private async loadKanbanData(): Promise<any[]> {
    const filePath = 'src/docs/docs/coordinator/agent_assignments.md';
    
    try {
      await fs.access(filePath);
    } catch {
      throw new Error(`Kanban file not found: ${filePath}`);
    }
    
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const data: any[] = [];
    
    for (const line of lines) {
      if (!line.trim().startsWith('|')) continue;
      if (line.includes('---')) continue;
      
      const columns = line
        .split('|')
        .slice(1, -1)
        .map((col: string) => col.trim());
      
      if (columns.length < 10) continue;
      if (columns[0] === 'Prompt ID/Descrizione') continue;
      
      const [id, status, dependencies, agent, startTime, endTime, duration, estimated, lastUpdate, notes] = columns;
      
      data.push({
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
        lineNumber: data.length + 1,
      });
    }
    
    return data;
  }

  /**
   * Filter and sort kanban data based on configuration
   */
  private filterAndSortData(data: any[], config: CLIConfig): any[] {
    let filtered = [...data];
    
    // Filter by status
    if (config.status) {
      filtered = filtered.filter(item => item.status === config.status);
    }
    
    // Filter by agent
    if (config.agent) {
      filtered = filtered.filter(item => item.agent === config.agent);
    }
    
    // Filter by date range
    if (config.startDate || config.endDate) {
      filtered = filtered.filter(item => {
        const itemDate = item.lastUpdate ? new Date(item.lastUpdate) : new Date(0);
        const start = config.startDate ? new Date(config.startDate) : new Date(0);
        const end = config.endDate ? new Date(config.endDate) : new Date();
        return itemDate >= start && itemDate <= end;
      });
    }
    
    // Exclude archived entries unless specified
    if (!config.includeArchived) {
      filtered = filtered.filter(item => item.status !== 'Archiviato');
    }
    
    // Sort data
    const sortField = config.sortBy || 'lastUpdate';
    const sortOrder = config.sortOrder || 'desc';
    
    filtered.sort((a: any, b: any) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const comparison = sortOrder === 'desc' ? 
        (bValue > aValue ? 1 : bValue < aValue ? -1 : 0) :
        (aValue > bValue ? 1 : aValue < bValue ? -1 : 0);
      return comparison;
    });
    
    // Apply limit
    if (config.limit) {
      filtered = filtered.slice(0, config.limit);
    }
    
    return filtered;
  }

  /**
   * Generate basic statistics from kanban data
   */
  private generateBasicStats(data: any[]): any {
    const total = data.length;
    const statusCounts: Record<string, number> = {};
    const agentCounts: Record<string, number> = {};
    const completed = data.filter(item => item.status === 'Completato').length;
    const inProgress = data.filter(item => item.status === 'In corso').length;
    const notAssigned = data.filter(item => item.status === 'Non assegnato').length;
    
    // Count by status
    data.forEach(item => {
      statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
      if (item.agent) {
        agentCounts[item.agent] = (agentCounts[item.agent] || 0) + 1;
      }
    });
    
    return {
      total,
      statusCounts,
      agentCounts,
      completed,
      inProgress,
      notAssigned,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      data
    };
  }

  /**
   * Export data in specified format
   */
  private async exportData(stats: any, format: string, outputPath: string): Promise<void> {
    let content: string;
    
    switch (format) {
      case 'json':
        content = JSON.stringify(stats, null, 2);
        break;
      case 'csv':
        content = this.generateCSV(stats);
        break;
      case 'markdown':
        content = this.generateMarkdown(stats);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    await fs.writeFile(outputPath, content, 'utf8');
  }

  /**
   * Generate CSV format
   */
  private generateCSV(stats: any): string {
    const headers = ['ID', 'Status', 'Agent', 'Start Time', 'End Time', 'Duration', 'Last Update', 'Notes'];
    const rows = stats.data.map((item: any) => [
      item.id,
      item.status,
      item.agent,
      item.startTime,
      item.endTime,
      item.duration,
      item.lastUpdate,
      item.notes
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    return csvContent;
  }

  /**
   * Generate Markdown format
   */
  private generateMarkdown(stats: any): string {
    let markdown = '# Kanban Performance Report\n\n';
    
    markdown += '## Summary\n\n';
    markdown += `- Total Items: ${stats.total}\n`;
    markdown += `- Completed: ${stats.completed}\n`;
    markdown += `- In Progress: ${stats.inProgress}\n`;
    markdown += `- Not Assigned: ${stats.notAssigned}\n`;
    markdown += `- Completion Rate: ${stats.completionRate.toFixed(1)}%\n\n`;
    
    markdown += '## Status Breakdown\n\n';
    Object.entries(stats.statusCounts).forEach(([status, count]) => {
      markdown += `- ${status}: ${count}\n`;
    });
    
    markdown += '\n## Agent Performance\n\n';
    Object.entries(stats.agentCounts).forEach(([agent, count]) => {
      markdown += `- ${agent}: ${count} items\n`;
    });
    
    return markdown;
  }

  /**
   * Display summary statistics
   */
  private displaySummary(stats: any): void {
    console.log('\n📊 Summary Statistics:');
    console.log(`Total Items: ${stats.total}`);
    console.log(`Completed: ${stats.completed}`);
    console.log(`In Progress: ${stats.inProgress}`);
    console.log(`Not Assigned: ${stats.notAssigned}`);
    console.log(`Completion Rate: ${stats.completionRate.toFixed(1)}%`);
  }

  /**
   * Display analytics summary
   */
  private displayAnalytics(stats: any): void {
    console.log('\n📊 Analytics Summary:');
    console.log(`Total Items: ${stats.total}`);
    console.log(`Completed: ${stats.completed}`);
    console.log(`In Progress: ${stats.inProgress}`);
    console.log(`Not Assigned: ${stats.notAssigned}`);
    console.log(`Completion Rate: ${stats.completionRate.toFixed(1)}%`);
    
    console.log('\n📈 Status Breakdown:');
    Object.entries(stats.statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    console.log('\n👥 Agent Performance:');
    Object.entries(stats.agentCounts).forEach(([agent, count]) => {
      console.log(`  ${agent}: ${count} items`);
    });
  }

  /**
   * Display configuration
   */
  private displayConfig(): void {
    console.log('\n⚙️ Configuration:');
    console.log(`Enable Detailed Tracing: ${this.config.enableDetailedTracing}`);
    console.log(`Max Measurements: ${this.config.maxMeasurements}`);
    console.log(`Sampling Rate: ${(this.config.samplingRate * 100)}%`);
    console.log(`Bottleneck Threshold: ${this.config.bottleneckThreshold}%`);
    console.log(`Trend Window: ${this.config.trendWindow} measurements`);
    console.log(`Export Path: ${this.config.exportPath}`);
    console.log(`Real-time Monitoring: ${this.config.enableRealtimeMonitoring}`);
    console.log(`Alert Thresholds:`);
    console.log(`  Operation Latency: ${this.config.alertThresholds.operationLatency}ms`);
    console.log(`  Stage Latency: ${this.config.alertThresholds.stageLatency}ms`);
    console.log(`  Throughput Drop: ${this.config.alertThresholds.throughputDrop}%`);
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const profiler = new StressPipelineLatencyProfiler();
  await profiler.run();
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}
