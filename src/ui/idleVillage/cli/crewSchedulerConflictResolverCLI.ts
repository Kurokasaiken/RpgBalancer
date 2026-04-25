/**
 * NP-023 – Idle Village Crew Scheduler Conflict Resolver CLI
 * 
 * Command-line interface for analyzing and resolving crew scheduling conflicts.
 * Provides comprehensive tools for conflict detection, resolution, and reporting.
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { QueuedAssignment } from '@/ui/idleVillage/hooks/useCrewScheduler';
import type { CrewSchedulerConfig } from '@/balancing/config/idleVillage/crewScheduler';
import { CrewSchedulerConflictResolver, DEFAULT_CONFLICT_RESOLVER_CONFIG } from '@/balancing/utils/idleVillage/crewSchedulerConflictResolver';
import { DetectionAlgorithmRegistry } from '@/balancing/utils/idleVillage/crewSchedulerConflictDetection';
import { ResolutionStrategyRegistry } from '@/balancing/utils/idleVillage/crewSchedulerResolutionStrategies';
import { SuggestionEngine, type SuggestionContext } from '@/balancing/utils/idleVillage/crewSchedulerSuggestionSystem';

// ============================================================================
// CLI Interfaces
// ============================================================================

export interface CLIOptions {
  config?: string;
  queue?: string;
  output?: string;
  format: 'json' | 'table' | 'summary';
  verbose: boolean;
  autoResolve: boolean;
  maxSuggestions: number;
  exportFormat: 'json' | 'csv' | 'html';
}

export interface CLIData {
  queue: QueuedAssignment[];
  config: CrewSchedulerConfig;
  context: SuggestionContext;
}

export interface CLIResult {
  conflicts: any[];
  suggestions: any[];
  analysis: any;
  appliedResolutions: any[];
  summary: CLISummary;
}

export interface CLISummary {
  totalConflicts: number;
  conflictsByType: Record<string, number>;
  conflictsBySeverity: Record<string, number>;
  suggestionsGenerated: number;
  suggestionsApplied: number;
  resolutionSuccess: number;
  processingTime: number;
}

// ============================================================================
// Main CLI Class
// ============================================================================

export class CrewSchedulerConflictResolverCLI {
  private program: Command;
  private resolver: CrewSchedulerConflictResolver;
  private detectionRegistry: DetectionAlgorithmRegistry;
  private strategyRegistry: ResolutionStrategyRegistry;
  private suggestionEngine: SuggestionEngine;

  constructor() {
    this.program = new Command();
    this.setupProgram();
    this.initializeComponents();
  }

  private setupProgram(): void {
    this.program
      .name('crew-conflict-resolver')
      .description('CLI tool for resolving crew scheduler conflicts')
      .version('1.0.0');

    // Analyze command
    this.program
      .command('analyze')
      .description('Analyze queue for conflicts and generate suggestions')
      .option('-c, --config <path>', 'Path to crew scheduler config file')
      .option('-q, --queue <path>', 'Path to queue data file')
      .option('-o, --output <path>', 'Output file path')
      .option('-f, --format <format>', 'Output format (json|table|summary)', 'table')
      .option('-v, --verbose', 'Verbose output', false)
      .option('-s, --max-suggestions <number>', 'Maximum suggestions per conflict', '3')
      .action(async (options) => {
        await this.handleAnalyze(options);
      });

    // Resolve command
    this.program
      .command('resolve')
      .description('Apply conflict resolutions')
      .option('-c, --config <path>', 'Path to crew scheduler config file')
      .option('-q, --queue <path>', 'Path to queue data file')
      .option('-o, --output <path>', 'Output file path')
      .option('-a, --auto-resolve', 'Automatically apply suggested resolutions', false)
      .option('-v, --verbose', 'Verbose output', false)
      .action(async (options) => {
        await this.handleResolve(options);
      });

    // Export command
    this.program
      .command('export')
      .description('Export conflict analysis and resolution data')
      .option('-c, --config <path>', 'Path to crew scheduler config file')
      .option('-q, --queue <path>', 'Path to queue data file')
      .option('-o, --output <path>', 'Output file path')
      .option('-f, --format <format>', 'Export format (json|csv|html)', 'json')
      .action(async (options) => {
        await this.handleExport(options);
      });

    // Report command
    this.program
      .command('report')
      .description('Generate comprehensive conflict resolution report')
      .option('-c, --config <path>', 'Path to crew scheduler config file')
      .option('-q, --queue <path>', 'Path to queue data file')
      .option('-o, --output <path>', 'Output file path')
      .option('-f, --format <format>', 'Report format (json|html)', 'html')
      .action(async (options) => {
        await this.handleReport(options);
      });

    // Config command
    this.program
      .command('config')
      .description('Manage conflict resolver configuration')
      .option('--show-defaults', 'Show default configuration', false)
      .option('--validate <path>', 'Validate configuration file')
      .action(async (options) => {
        await this.handleConfig(options);
      });
  }

  private initializeComponents(): void {
    // Initialize with default configuration
    const defaultConfig = this.loadDefaultSchedulerConfig();
    const resolverConfig = { ...DEFAULT_CONFLICT_RESOLVER_CONFIG };
    
    this.resolver = new CrewSchedulerConflictResolver(defaultConfig, resolverConfig);
    this.detectionRegistry = new DetectionAlgorithmRegistry();
    this.strategyRegistry = new ResolutionStrategyRegistry();
    this.suggestionEngine = new SuggestionEngine();
  }

  private loadDefaultSchedulerConfig(): CrewSchedulerConfig {
    // Load default configuration - in practice this would load from actual config file
    return {
      priorityWeights: {
        statTagMatch: 0.3,
        fatiguePenalty: -0.2,
        questUrgency: 0.25,
        specializationBonus: 0.15,
        difficultyBonus: 0.1,
        baseWeight: 1.0
      },
      seeding: {
        enabled: true,
        seed: Date.now(),
        algorithm: 'lcg'
      },
      thresholds: {
        statTagMatchThreshold: 0.5,
        fatiguePenaltyThreshold: 0.6,
        questUrgencyThreshold: 100,
        specializationThreshold: 0.3,
        difficultyThreshold: 0.7
      },
      maxQueueSize: 50,
      enableDiagnostics: true,
      analytics: {
        enabled: true,
        channel: 'default'
      }
    };
  }

  async run(argv: string[]): Promise<void> {
    try {
      await this.program.parseAsync(argv);
    } catch (error) {
      console.error('CLI Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  // ============================================================================
  // Command Handlers
  // ============================================================================

  private async handleAnalyze(options: any): Promise<void> {
    const startTime = Date.now();
    
    try {
      if (options.verbose) {
        console.log('Loading configuration and queue data...');
      }

      const data = await this.loadData(options);
      const result = await this.analyzeConflicts(data, options);
      
      const processingTime = Date.now() - startTime;
      result.summary.processingTime = processingTime;

      if (options.verbose) {
        console.log(`Analysis completed in ${processingTime}ms`);
      }

      await this.outputResult(result, options);

    } catch (error) {
      console.error('Analysis failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private async handleResolve(options: any): Promise<void> {
    const startTime = Date.now();
    
    try {
      if (options.verbose) {
        console.log('Loading configuration and queue data...');
      }

      const data = await this.loadData(options);
      const result = await this.resolveConflicts(data, options);
      
      const processingTime = Date.now() - startTime;
      result.summary.processingTime = processingTime;

      if (options.verbose) {
        console.log(`Resolution completed in ${processingTime}ms`);
      }

      await this.outputResult(result, options);

    } catch (error) {
      console.error('Resolution failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private async handleExport(options: any): Promise<void> {
    try {
      const data = await this.loadData(options);
      const result = await this.analyzeConflicts(data, options);
      
      await this.exportData(result, options);

    } catch (error) {
      console.error('Export failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private async handleReport(options: any): Promise<void> {
    try {
      const data = await this.loadData(options);
      const result = await this.analyzeConflicts(data, options);
      
      await this.generateReport(result, options);

    } catch (error) {
      console.error('Report generation failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private async handleConfig(options: any): Promise<void> {
    try {
      if (options.showDefaults) {
        console.log('Default Conflict Resolver Configuration:');
        console.log(JSON.stringify(DEFAULT_CONFLICT_RESOLVER_CONFIG, null, 2));
        return;
      }

      if (options.validate) {
        await this.validateConfig(options.validate);
        return;
      }

      console.log('Use --show-defaults or --validate <path> options');
    } catch (error) {
      console.error('Config command failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  // ============================================================================
  // Data Loading and Processing
  // ============================================================================

  private async loadData(options: any): Promise<CLIData> {
    const configPath = options.config || this.getDefaultConfigPath();
    const queuePath = options.queue || this.getDefaultQueuePath();

    const config = this.loadConfig(configPath);
    const queue = this.loadQueue(queuePath);
    const context = this.createContext(queue, config);

    return { queue, config, context };
  }

  private loadConfig(path: string): CrewSchedulerConfig {
    try {
      const fileContent = readFileSync(path, 'utf-8');
      return JSON.parse(fileContent) as CrewSchedulerConfig;
    } catch (error) {
      console.warn(`Failed to load config from ${path}, using defaults`);
      return this.loadDefaultSchedulerConfig();
    }
  }

  private loadQueue(path: string): QueuedAssignment[] {
    try {
      const fileContent = readFileSync(path, 'utf-8');
      return JSON.parse(fileContent) as QueuedAssignment[];
    } catch (error) {
      console.warn(`Failed to load queue from ${path}, using empty queue`);
      return [];
    }
  }

  private createContext(queue: QueuedAssignment[], config: CrewSchedulerConfig): SuggestionContext {
    return {
      timestamp: Date.now(),
      queue,
      availableResidents: this.generateMockResidents(),
      activityRequirements: this.generateMockActivityRequirements(),
      globalLimits: {
        maxQueueSize: config.maxQueueSize,
        maxConcurrentResolutions: 3,
        priorityInversionThreshold: config.thresholds.questUrgencyThreshold
      },
      historicalData: {
        resolutionSuccess: {},
        averageResolutionTime: {},
        conflictFrequency: {},
        strategyEffectiveness: {}
      }
    };
  }

  private generateMockResidents(): any[] {
    return [
      { id: 'resident_1', name: 'Alice', fatigue: 0.3, skillLevel: 0.8, currentAssignments: 2, maxAssignments: 3, specialization: {}, availability: [] },
      { id: 'resident_2', name: 'Bob', fatigue: 0.1, skillLevel: 0.7, currentAssignments: 1, maxAssignments: 3, specialization: {}, availability: [] },
      { id: 'resident_3', name: 'Charlie', fatigue: 0.5, skillLevel: 0.9, currentAssignments: 3, maxAssignments: 3, specialization: {}, availability: [] }
    ];
  }

  private generateMockActivityRequirements(): Record<string, any> {
    return {
      'activity_1': { minSkillLevel: 0.5, requiredStats: ['strength'], maxConcurrentAssignments: 2, estimatedDuration: 3000, priority: 1 },
      'activity_2': { minSkillLevel: 0.6, requiredStats: ['agility'], maxConcurrentAssignments: 1, estimatedDuration: 5000, priority: 2 },
      'activity_3': { minSkillLevel: 0.4, requiredStats: ['intelligence'], maxConcurrentAssignments: 3, estimatedDuration: 2000, priority: 1 }
    };
  }

  // ============================================================================
  // Analysis and Resolution
  // ============================================================================

  private async analyzeConflicts(data: CLIData, options: any): Promise<CLIResult> {
    const { conflicts, suggestions, analysis } = this.resolver.analyzeQueue(data.queue);
    
    const maxSuggestions = parseInt(options.maxSuggestions) || 3;
    const limitedSuggestions = suggestions.slice(0, maxSuggestions);

    return {
      conflicts,
      suggestions: limitedSuggestions,
      analysis,
      appliedResolutions: [],
      summary: this.generateSummary(conflicts, limitedSuggestions, analysis)
    };
  }

  private async resolveConflicts(data: CLIData, options: any): Promise<CLIResult> {
    const analysisResult = await this.analyzeConflicts(data, options);
    const appliedResolutions: any[] = [];

    if (options.autoResolve) {
      for (const suggestion of analysisResult.suggestions) {
        try {
          const result = await this.resolver.applySuggestion(suggestion, data.queue);
          if (result.success) {
            appliedResolutions.push({
              suggestionId: suggestion.id,
              success: true,
              appliedSteps: result.appliedSteps,
              errors: result.errors
            });
          } else {
            appliedResolutions.push({
              suggestionId: suggestion.id,
              success: false,
              errors: result.errors
            });
          }
        } catch (error) {
          appliedResolutions.push({
            suggestionId: suggestion.id,
            success: false,
            errors: [error instanceof Error ? error.message : 'Unknown error']
          });
        }
      }
    }

    return {
      ...analysisResult,
      appliedResolutions,
      summary: {
        ...analysisResult.summary,
        suggestionsApplied: appliedResolutions.filter(r => r.success).length,
        resolutionSuccess: appliedResolutions.length > 0 ? appliedResolutions.filter(r => r.success).length / appliedResolutions.length : 0
      }
    };
  }

  private generateSummary(conflicts: any[], suggestions: any[], analysis: any): CLISummary {
    const conflictsByType: Record<string, number> = {};
    const conflictsBySeverity: Record<string, number> = {};

    conflicts.forEach(conflict => {
      conflictsByType[conflict.type] = (conflictsByType[conflict.type] || 0) + 1;
      conflictsBySeverity[conflict.severity] = (conflictsBySeverity[conflict.severity] || 0) + 1;
    });

    return {
      totalConflicts: conflicts.length,
      conflictsByType,
      conflictsBySeverity,
      suggestionsGenerated: suggestions.length,
      suggestionsApplied: 0,
      resolutionSuccess: 0,
      processingTime: 0
    };
  }

  // ============================================================================
  // Output and Export
  // ============================================================================

  private async outputResult(result: CLIResult, options: any): Promise<void> {
    const format = options.format || 'table';

    switch (format) {
      case 'json':
        console.log(JSON.stringify(result, null, 2));
        break;
      case 'table':
        this.outputTable(result);
        break;
      case 'summary':
        this.outputSummary(result);
        break;
      default:
        console.error(`Unknown format: ${format}`);
        process.exit(1);
    }

    if (options.output) {
      await this.writeOutput(result, options.output, format);
    }
  }

  private outputTable(result: CLIResult): void {
    console.log('\n=== Conflict Analysis Results ===\n');

    // Conflicts table
    if (result.conflicts.length > 0) {
      console.log('Conflicts:');
      console.table(result.conflicts.map(c => ({
        ID: c.id,
        Type: c.type,
        Severity: c.severity,
        Description: c.description.substring(0, 50) + '...',
        Affected: c.affectedAssignments.length
      })));
    } else {
      console.log('✅ No conflicts detected');
    }

    // Suggestions table
    if (result.suggestions.length > 0) {
      console.log('\nSuggestions:');
      console.table(result.suggestions.map(s => ({
        ID: s.id,
        Strategy: s.strategyId,
        Priority: s.priority,
        Confidence: (s.confidence * 100).toFixed(1) + '%',
        Impact: s.impact.overallScore.toFixed(2)
      })));
    }

    // Summary
    console.log('\nSummary:');
    console.log(`Total Conflicts: ${result.summary.totalConflicts}`);
    console.log(`Suggestions Generated: ${result.summary.suggestionsGenerated}`);
    console.log(`Processing Time: ${result.summary.processingTime}ms`);
  }

  private outputSummary(result: CLIResult): void {
    console.log('\n=== Conflict Resolution Summary ===\n');
    console.log(`Total Conflicts: ${result.summary.totalConflicts}`);
    console.log(`Suggestions Generated: ${result.summary.suggestionsGenerated}`);
    console.log(`Processing Time: ${result.summary.processingTime}ms`);

    if (result.summary.totalConflicts > 0) {
      console.log('\nConflicts by Type:');
      Object.entries(result.summary.conflictsByType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });

      console.log('\nConflicts by Severity:');
      Object.entries(result.summary.conflictsBySeverity).forEach(([severity, count]) => {
        console.log(`  ${severity}: ${count}`);
      });
    }
  }

  private async exportData(result: CLIResult, options: any): Promise<void> {
    const format = options.format || 'json';
    const outputPath = options.output || `conflict_analysis.${format}`;

    let exportData: string;

    switch (format) {
      case 'json':
        exportData = JSON.stringify(result, null, 2);
        break;
      case 'csv':
        exportData = this.convertToCSV(result);
        break;
      case 'html':
        exportData = this.convertToHTML(result);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    writeFileSync(outputPath, exportData, 'utf-8');
    console.log(`Data exported to ${outputPath}`);
  }

  private convertToCSV(result: CLIResult): string {
    const headers = ['ID', 'Type', 'Severity', 'Description', 'AffectedAssignments', 'DetectedAt'];
    const rows = result.conflicts.map(c => [
      c.id,
      c.type,
      c.severity,
      `"${c.description}"`,
      c.affectedAssignments.length,
      new Date(c.detectedAt).toISOString()
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private convertToHTML(result: CLIResult): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Conflict Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Crew Scheduler Conflict Analysis Report</h1>
    
    <div class="summary">
        <h2>Summary</h2>
        <p>Total Conflicts: ${result.summary.totalConflicts}</p>
        <p>Suggestions Generated: ${result.summary.suggestionsGenerated}</p>
        <p>Processing Time: ${result.summary.processingTime}ms</p>
    </div>

    <h2>Conflicts</h2>
    <table>
        <tr><th>ID</th><th>Type</th><th>Severity</th><th>Description</th><th>Affected Assignments</th></tr>
        ${result.conflicts.map(c => `
            <tr>
                <td>${c.id}</td>
                <td>${c.type}</td>
                <td>${c.severity}</td>
                <td>${c.description}</td>
                <td>${c.affectedAssignments.length}</td>
            </tr>
        `).join('')}
    </table>

    <h2>Suggestions</h2>
    <table>
        <tr><th>ID</th><th>Strategy</th><th>Priority</th><th>Confidence</th><th>Impact Score</th></tr>
        ${result.suggestions.map(s => `
            <tr>
                <td>${s.id}</td>
                <td>${s.strategyId}</td>
                <td>${s.priority}</td>
                <td>${(s.confidence * 100).toFixed(1)}%</td>
                <td>${s.impact.overallScore.toFixed(2)}</td>
            </tr>
        `).join('')}
    </table>
</body>
</html>`;
  }

  private async generateReport(result: CLIResult, options: any): Promise<void> {
    const format = options.format || 'html';
    const outputPath = options.output || `conflict_report.${format}`;

    const reportData = this.generateDetailedReport(result);
    
    let reportContent: string;
    switch (format) {
      case 'json':
        reportContent = JSON.stringify(reportData, null, 2);
        break;
      case 'html':
        reportContent = this.generateDetailedHTMLReport(reportData);
        break;
      default:
        throw new Error(`Unsupported report format: ${format}`);
    }

    writeFileSync(outputPath, reportContent, 'utf-8');
    console.log(`Report generated at ${outputPath}`);
  }

  private generateDetailedReport(result: CLIResult): any {
    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        processingTime: result.summary.processingTime
      },
      summary: result.summary,
      conflicts: result.conflicts,
      suggestions: result.suggestions,
      appliedResolutions: result.appliedResolutions,
      analysis: result.analysis
    };
  }

  private generateDetailedHTMLReport(reportData: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Crew Scheduler Conflict Resolution Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background-color: #2c3e50; color: white; padding: 20px; border-radius: 5px; }
        .section { margin: 30px 0; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background-color: #ecf0f1; border-radius: 5px; min-width: 150px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2c3e50; }
        .metric-label { font-size: 12px; color: #7f8c8d; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #34495e; color: white; }
        .severity-critical { color: #e74c3c; font-weight: bold; }
        .severity-high { color: #f39c12; font-weight: bold; }
        .severity-medium { color: #f1c40f; }
        .severity-low { color: #27ae60; }
        .priority-critical { background-color: #e74c3c; color: white; }
        .priority-high { background-color: #f39c12; color: white; }
        .priority-medium { background-color: #f1c40f; color: black; }
        .priority-low { background-color: #27ae60; color: white; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Crew Scheduler Conflict Resolution Report</h1>
        <p>Generated: ${reportData.metadata.generatedAt}</p>
        <p>Processing Time: ${reportData.metadata.processingTime}ms</p>
    </div>

    <div class="section">
        <h2>Summary Metrics</h2>
        <div class="metric">
            <div class="metric-value">${reportData.summary.totalConflicts}</div>
            <div class="metric-label">Total Conflicts</div>
        </div>
        <div class="metric">
            <div class="metric-value">${reportData.summary.suggestionsGenerated}</div>
            <div class="metric-label">Suggestions Generated</div>
        </div>
        <div class="metric">
            <div class="metric-value">${reportData.summary.suggestionsApplied}</div>
            <div class="metric-label">Suggestions Applied</div>
        </div>
        <div class="metric">
            <div class="metric-value">${(reportData.summary.resolutionSuccess * 100).toFixed(1)}%</div>
            <div class="metric-label">Resolution Success</div>
        </div>
    </div>

    <div class="section">
        <h2>Conflicts by Type</h2>
        <table>
            <tr><th>Type</th><th>Count</th><th>Percentage</th></tr>
            ${Object.entries(reportData.summary.conflictsByType).map(([type, count]) => `
                <tr>
                    <td>${type}</td>
                    <td>${count}</td>
                    <td>${((count / reportData.summary.totalConflicts) * 100).toFixed(1)}%</td>
                </tr>
            `).join('')}
        </table>
    </div>

    <div class="section">
        <h2>Conflicts by Severity</h2>
        <table>
            <tr><th>Severity</th><th>Count</th><th>Percentage</th></tr>
            ${Object.entries(reportData.summary.conflictsBySeverity).map(([severity, count]) => `
                <tr>
                    <td class="severity-${severity}">${severity}</td>
                    <td>${count}</td>
                    <td>${((count / reportData.summary.totalConflicts) * 100).toFixed(1)}%</td>
                </tr>
            `).join('')}
        </table>
    </div>

    <div class="section">
        <h2>Conflict Details</h2>
        <table>
            <tr><th>ID</th><th>Type</th><th>Severity</th><th>Description</th><th>Affected Assignments</th><th>Detected At</th></tr>
            ${reportData.conflicts.map(c => `
                <tr>
                    <td>${c.id}</td>
                    <td>${c.type}</td>
                    <td class="severity-${c.severity}">${c.severity}</td>
                    <td>${c.description}</td>
                    <td>${c.affectedAssignments.length}</td>
                    <td>${new Date(c.detectedAt).toLocaleString()}</td>
                </tr>
            `).join('')}
        </table>
    </div>

    <div class="section">
        <h2>Resolution Suggestions</h2>
        <table>
            <tr><th>ID</th><th>Strategy</th><th>Priority</th><th>Confidence</th><th>Impact Score</th><th>Steps</th></tr>
            ${reportData.suggestions.map(s => `
                <tr>
                    <td>${s.id}</td>
                    <td>${s.strategyId}</td>
                    <td class="priority-${s.priority}">${s.priority}</td>
                    <td>${(s.confidence * 100).toFixed(1)}%</td>
                    <td>${s.impact.overallScore.toFixed(2)}</td>
                    <td>${s.steps.length}</td>
                </tr>
            `).join('')}
        </table>
    </div>

    ${reportData.appliedResolutions.length > 0 ? `
    <div class="section">
        <h2>Applied Resolutions</h2>
        <table>
            <tr><th>Suggestion ID</th><th>Success</th><th>Steps Applied</th><th>Errors</th></tr>
            ${reportData.appliedResolutions.map(r => `
                <tr>
                    <td>${r.suggestionId}</td>
                    <td>${r.success ? '✅' : '❌'}</td>
                    <td>${r.appliedSteps ? r.appliedSteps.length : 0}</td>
                    <td>${r.errors ? r.errors.join(', ') : ''}</td>
                </tr>
            `).join('')}
        </table>
    </div>
    ` : ''}

</body>
</html>`;
  }

  private async validateConfig(path: string): Promise<void> {
    try {
      const config = this.loadConfig(path);
      // Basic validation
      if (!config.priorityWeights || !config.thresholds) {
        throw new Error('Invalid configuration structure');
      }
      console.log('✅ Configuration is valid');
    } catch (error) {
      console.error('❌ Configuration validation failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private async writeOutput(result: CLIResult, outputPath: string, format: string): Promise<void> {
    let content: string;
    
    switch (format) {
      case 'json':
        content = JSON.stringify(result, null, 2);
        break;
      case 'table':
        content = this.tableToString(result);
        break;
      case 'summary':
        content = this.summaryToString(result);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    writeFileSync(outputPath, content, 'utf-8');
    console.log(`Output written to ${outputPath}`);
  }

  private tableToString(result: CLIResult): string {
    // Convert table output to string format
    let output = '=== Conflict Analysis Results ===\n\n';
    
    if (result.conflicts.length > 0) {
      output += 'Conflicts:\n';
      output += 'ID\tType\tSeverity\tDescription\tAffected\n';
      result.conflicts.forEach(c => {
        output += `${c.id}\t${c.type}\t${c.severity}\t${c.description.substring(0, 30)}...\t${c.affectedAssignments.length}\n`;
      });
    } else {
      output += '✅ No conflicts detected\n';
    }

    return output;
  }

  private summaryToString(result: CLIResult): string {
    let output = '=== Conflict Resolution Summary ===\n\n';
    output += `Total Conflicts: ${result.summary.totalConflicts}\n`;
    output += `Suggestions Generated: ${result.summary.suggestionsGenerated}\n`;
    output += `Processing Time: ${result.summary.processingTime}ms\n`;
    
    return output;
  }

  private getDefaultConfigPath(): string {
    return join(process.cwd(), 'crew-scheduler-config.json');
  }

  private getDefaultQueuePath(): string {
    return join(process.cwd(), 'crew-queue-data.json');
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

export async function runCrewSchedulerConflictResolverCLI(argv: string[]): Promise<void> {
  const cli = new CrewSchedulerConflictResolverCLI();
  await cli.run(argv);
}

// Run CLI if this file is executed directly
if (require.main === module) {
  runCrewSchedulerConflictResolverCLI(process.argv).catch(error => {
    console.error('CLI execution failed:', error);
    process.exit(1);
  });
}
