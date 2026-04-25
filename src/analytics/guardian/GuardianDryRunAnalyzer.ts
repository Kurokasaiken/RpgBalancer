/**
 * Guardian Dry Run Analyzer - NP-041
 * 
 * Analyzes guardian_autopush logs and provides dry-run simulation
 * with ASCII dashboard and telemetry. Monitors commit/push operations,
 * detects failures, and provides insights for guardian operations.
 * 
 * @since 2026-01-19
 * @author Cascade
 */

import { readFile, readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { z } from 'zod';

/**
 * Guardian log entry structure
 */
export interface GuardianLogEntry {
  timestamp: string;
  stage: 'commit' | 'push';
  status: 'started' | 'completed' | 'failed';
  message: string;
  diagnostics?: GuardianDiagnostic[];
  branch?: string;
  duration?: number;
  error?: string;
}

/**
 * Diagnostic result from guardian operations
 */
export interface GuardianDiagnostic {
  label: string;
  command: string;
  args: string[];
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  success: boolean;
}

/**
 * Guardian session analysis
 */
export interface GuardianSessionAnalysis {
  sessionId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  stage: 'commit' | 'push';
  status: 'success' | 'failed' | 'incomplete';
  entries: GuardianLogEntry[];
  diagnostics: GuardianDiagnostic[];
  branch: string;
  summary: {
    totalDiagnostics: number;
    successfulDiagnostics: number;
    failedDiagnostics: number;
    totalDuration: number;
    averageDiagnosticDuration: number;
  };
  issues: GuardianIssue[];
}

/**
 * Guardian issue detection
 */
export interface GuardianIssue {
  type: 'diagnostic_failure' | 'timeout' | 'network_error' | 'permission_error' | 'script_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  stage: 'commit' | 'push';
  message: string;
  diagnostic?: string;
  suggestion: string;
  timestamp: string;
}

/**
 * Dry run simulation result
 */
export interface DryRunSimulation {
  sessionId: string;
  timestamp: string;
  simulationType: 'historical' | 'synthetic';
  config: DryRunConfig;
  result: GuardianSessionAnalysis;
  recommendations: string[];
}

/**
 * Dry run configuration
 */
export interface DryRunConfig {
  timeRange?: {
    start: string;
    end: string;
  };
  branch?: string;
  stage?: 'commit' | 'push' | 'both';
  includeSynthetic?: boolean;
  syntheticScenarios: SyntheticScenario[];
  outputFormat: 'ascii' | 'json' | 'markdown';
  verbose?: boolean;
}

/**
 * Synthetic scenario for testing
 */
export interface SyntheticScenario {
  name: string;
  description: string;
  stage: 'commit' | 'push';
  branch: string;
  diagnostics: SyntheticDiagnostic[];
  expectedOutcome: 'success' | 'failure';
}

/**
 * Synthetic diagnostic for testing
 */
export interface SyntheticDiagnostic {
  label: string;
  command: string;
  args: string[];
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}

/**
 * Zod schema for guardian log entry
 */
export const GuardianLogEntrySchema = z.object({
  timestamp: z.string(),
  stage: z.enum(['commit', 'push']),
  status: z.enum(['started', 'completed', 'failed']),
  message: z.string(),
  diagnostics: z.array(z.object({
    label: z.string(),
    command: z.string(),
    args: z.array(z.string()),
    exitCode: z.number(),
    stdout: z.string(),
    stderr: z.string(),
    duration: z.number(),
    success: z.boolean(),
  })).optional(),
  branch: z.string().optional(),
  duration: z.number().optional(),
  error: z.string().optional(),
});

/**
 * Zod schema for dry run configuration
 */
export const DryRunConfigSchema = z.object({
  timeRange: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
  branch: z.string().optional(),
  stage: z.enum(['commit', 'push', 'both']).optional(),
  includeSynthetic: z.boolean().default(false),
  syntheticScenarios: z.array(z.object({
    name: z.string(),
    description: z.string(),
    stage: z.enum(['commit', 'push']),
    branch: z.string(),
    diagnostics: z.array(z.object({
      label: z.string(),
      command: z.string(),
      args: z.array(z.string()),
      exitCode: z.number(),
      stdout: z.string(),
      stderr: z.string(),
      duration: z.number(),
    })),
    expectedOutcome: z.enum(['success', 'failure']),
  })).default([]),
  outputFormat: z.enum(['ascii', 'json', 'markdown']).default('ascii'),
  verbose: z.boolean().default(false),
});

export type GuardianLogEntryType = z.infer<typeof GuardianLogEntrySchema>;
export type DryRunConfigType = z.infer<typeof DryRunConfigSchema>;

/**
 * Guardian Dry Run Analyzer
 */
export class GuardianDryRunAnalyzer {
  private static readonly LOG_DIR = 'test-results/auto-commit-guardian';
  private static readonly SUPPORTED_EXTENSIONS = ['.log', '.txt'];
  private static readonly DEFAULT_BRANCH = 'main';

  /**
   * Analyze guardian logs and generate dry run simulation
   */
  static async analyzeDryRun(config: DryRunConfigType): Promise<DryRunSimulation> {
    const sessionId = this.generateSessionId();
    const timestamp = new Date().toISOString();

    // Load historical data
    const historicalSessions = await this.loadHistoricalSessions(config);
    
    // Add synthetic scenarios if requested
    const syntheticSessions = config.includeSynthetic 
      ? await this.generateSyntheticSessions(config.syntheticScenarios)
      : [];

    // Combine sessions
    const allSessions = [...historicalSessions, ...syntheticSessions];
    
    // Filter by configuration
    const filteredSessions = this.filterSessions(allSessions, config);
    
    // Select session for analysis
    const targetSession = this.selectTargetSession(filteredSessions, config);
    
    // Analyze the selected session
    const analysis = await this.analyzeSession(targetSession);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(analysis, config);

    return {
      sessionId,
      timestamp,
      simulationType: config.timeRange ? 'historical' : 'synthetic',
      config,
      result: analysis,
      recommendations,
    };
  }

  /**
   * Load historical guardian sessions from log files
   */
  private static async loadHistoricalSessions(config: DryRunConfigType): Promise<GuardianSessionAnalysis[]> {
    const sessions: GuardianSessionAnalysis[] = [];
    
    try {
      const logFiles = await this.getLogFiles();
      
      for (const logFile of logFiles) {
        const session = await this.parseLogFile(logFile);
        if (session) {
          sessions.push(session);
        }
      }
    } catch (error) {
      console.warn('Failed to load historical sessions:', error);
    }
    
    return sessions;
  }

  /**
   * Get list of guardian log files
   */
  private static async getLogFiles(): Promise<string[]> {
    try {
      const files = await readdir(this.LOG_DIR);
      return files
        .filter(file => this.SUPPORTED_EXTENSIONS.includes(extname(file)))
        .filter(file => file.includes('-commit-') || file.includes('-push-'))
        .sort()
        .reverse(); // Most recent first
    } catch (error) {
      console.warn('Failed to read log directory:', error);
      return [];
    }
  }

  /**
   * Parse a guardian log file
   */
  private static async parseLogFile(logFile: string): Promise<GuardianSessionAnalysis | null> {
    try {
      const content = await readFile(join(this.LOG_DIR, logFile), 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      const entries: GuardianLogEntry[] = [];
      let startTime: string | null = null;
      let endTime: string | null = null;
      let stage: 'commit' | 'push' | null = null;
      let branch: string | null = null;
      
      for (const line of lines) {
        try {
          // Parse timestamp and message
          const timestampMatch = line.match(/\[(\d{2}:\d{2}:\d{2})\]/);
          if (!timestampMatch) continue;
          
          const timestamp = this.extractTimestampFromFilename(logFile);
          const message = line.substring(line.indexOf(']') + 1).trim();
          
          // Determine status
          let status: 'started' | 'completed' | 'failed' = 'started';
          if (message.includes('completato')) status = 'completed';
          if (message.includes('❌') || message.includes('failed') || message.includes('terminato')) status = 'failed';
          
          // Extract branch and stage from filename
          if (!branch) {
            const branchMatch = logFile.match(/branch-(\w+)/);
            if (branchMatch) branch = branchMatch[1];
          }
          
          if (!stage) {
            if (logFile.includes('-commit-')) stage = 'commit';
            if (logFile.includes('-push-')) stage = 'push';
          }
          
          // Set start/end times
          if (!startTime) startTime = timestamp;
          endTime = timestamp;
          
          // Parse diagnostics if present
          const diagnostics = this.parseDiagnostics(content);
          
          entries.push({
            timestamp,
            stage: stage!,
            status,
            message,
            diagnostics,
            branch: branch || undefined,
          });
        } catch (error) {
          console.warn(`Failed to parse log line: ${line}`, error);
        }
      }
      
      if (entries.length === 0) return null;
      
      // Calculate duration
      const duration = entries.reduce((total, entry) => {
        if (entry.diagnostics) {
          return total + entry.diagnostics.reduce((sum, diag) => sum + diag.duration, 0);
        }
        return total;
      }, 0);
      
      // Determine overall status
      const finalStatus = entries[entries.length - 1].status;
      const sessionStatus = finalStatus === 'completed' ? 'success' : 
                           finalStatus === 'failed' ? 'failed' : 'incomplete';
      
      // Detect issues
      const issues = this.detectIssues(entries);
      
      // Calculate summary
      const allDiagnostics = entries.flatMap(entry => entry.diagnostics || []);
      const summary = {
        totalDiagnostics: allDiagnostics.length,
        successfulDiagnostics: allDiagnostics.filter(d => d.success).length,
        failedDiagnostics: allDiagnostics.filter(d => !d.success).length,
        totalDuration: duration,
        averageDiagnosticDuration: allDiagnostics.length > 0 ? duration / allDiagnostics.length : 0,
      };
      
      return {
        sessionId: logFile.replace(/\.(log|txt)$/, ''),
        startTime: startTime!,
        endTime: endTime!,
        duration,
        stage: stage!,
        status: sessionStatus,
        entries,
        diagnostics: allDiagnostics,
        branch: branch || this.DEFAULT_BRANCH,
        summary,
        issues,
      };
    } catch (error) {
      console.warn(`Failed to parse log file ${logFile}:`, error);
      return null;
    }
  }

  /**
   * Extract timestamp from filename
   */
  private static extractTimestampFromFilename(filename: string): string {
    const timestampMatch = filename.match(/(\d{8}-\d{6})/);
    if (!timestampMatch) return new Date().toISOString();
    
    const [date, time] = timestampMatch[1].split('-');
    return `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}T${time.substring(0, 2)}:${time.substring(2, 4)}:${time.substring(4, 6)}.000Z`;
  }

  /**
   * Parse diagnostics from log content
   */
  private static parseDiagnostics(content: string): GuardianDiagnostic[] {
    const diagnostics: GuardianDiagnostic[] = [];
    
    // Look for diagnostic patterns
    const lines = content.split('\n');
    
    for (const line of lines) {
      // Parse npm run command output
      const npmMatch = line.match(/npm run (\w+).*?(\d+ms|\d+s)/);
      if (npmMatch) {
        const command = npmMatch[1];
        const durationStr = npmMatch[2];
        const duration = durationStr.includes('ms') 
          ? parseInt(durationStr.replace('ms', ''))
          : parseInt(durationStr.replace('s', '')) * 1000;
        
        // Look for success/failure indicators
        const success = !line.includes('❌') && !line.includes('failed') && !line.includes('error');
        const exitCode = success ? 0 : 1;
        
        diagnostics.push({
          label: `npm run ${command}`,
          command: 'npm',
          args: ['run', command],
          exitCode,
          stdout: line,
          stderr: '',
          duration,
          success,
        });
      }
    }
    
    return diagnostics;
  }

  /**
   * Detect issues in guardian operations
   */
  private static detectIssues(entries: GuardianLogEntry[]): GuardianIssue[] {
    const issues: GuardianIssue[] = [];
    
    for (const entry of entries) {
      // Check for diagnostic failures
      if (entry.diagnostics) {
        for (const diagnostic of entry.diagnostics) {
          if (!diagnostic.success) {
            issues.push({
              type: 'diagnostic_failure',
              severity: this.getDiagnosticSeverity(diagnostic.label),
              stage: entry.stage,
              message: `Diagnostic failed: ${diagnostic.label}`,
              diagnostic: diagnostic.label,
              suggestion: this.getDiagnosticSuggestion(diagnostic.label),
              timestamp: entry.timestamp,
            });
          }
        }
      }
      
      // Check for timeouts
      if (entry.duration && entry.duration > 30000) { // 30 seconds
        issues.push({
          type: 'timeout',
          severity: 'medium',
          stage: entry.stage,
          message: `Operation timeout: ${entry.duration}ms`,
          suggestion: 'Check for network issues or slow operations',
          timestamp: entry.timestamp,
        });
      }
      
      // Check for errors
      if (entry.error) {
        issues.push({
          type: 'script_error',
          severity: 'high',
          stage: entry.stage,
          message: `Script error: ${entry.error}`,
          suggestion: 'Check script permissions and dependencies',
          timestamp: entry.timestamp,
        });
      }
    }
    
    return issues;
  }

  /**
   * Get severity level for diagnostic
   */
  private static getDiagnosticSeverity(label: string): 'low' | 'medium' | 'high' | 'critical' {
    if (label.includes('lint')) return 'medium';
    if (label.includes('test')) return 'high';
    if (label.includes('build')) return 'high';
    if (label.includes('deploy')) return 'critical';
    return 'low';
  }

  /**
   * Get suggestion for diagnostic
   */
  private static getDiagnosticSuggestion(label: string): string {
    if (label.includes('lint')) return 'Fix linting errors and retry';
    if (label.includes('test')) return 'Fix failing tests and retry';
    if (label.includes('build')) return 'Fix build errors and retry';
    if (label.includes('deploy')) return 'Check deployment configuration and retry';
    return 'Review diagnostic output and fix issues';
  }

  /**
   * Generate synthetic sessions for testing
   */
  private static async generateSyntheticSessions(scenarios: SyntheticScenario[]): Promise<GuardianSessionAnalysis[]> {
    const sessions: GuardianSessionAnalysis[] = [];
    
    for (const scenario of scenarios) {
      const sessionId = `synthetic-${scenario.name.toLowerCase().replace(/\s+/g, '-')}`;
      const timestamp = new Date().toISOString();
      
      // Calculate synthetic duration
      const totalDuration = scenario.diagnostics.reduce((sum, diag) => sum + diag.duration, 0);
      
      // Create entries
      const entries: GuardianLogEntry[] = [
        {
          timestamp,
          stage: scenario.stage,
          status: 'started',
          message: `Synthetic test started: ${scenario.description}`,
          diagnostics: [],
          branch: scenario.branch,
        },
        {
          timestamp: new Date(Date.now() + 1000).toISOString(),
          stage: scenario.stage,
          status: scenario.expectedOutcome === 'failure' ? 'failed' : 'completed',
          message: `Synthetic test ${scenario.expectedOutcome}: ${scenario.description}`,
          diagnostics: scenario.diagnostics.map(diag => ({
            ...diag,
            success: diag.exitCode === 0,
          })),
          branch: scenario.branch,
          duration: totalDuration,
        },
      ];
      
      // Detect issues
      const issues = scenario.expectedOutcome === 'failure' 
        ? [{
            type: 'diagnostic_failure' as const,
            severity: 'medium' as const,
            stage: scenario.stage,
            message: `Synthetic diagnostic failure: ${scenario.diagnostics.find(d => d.exitCode !== 0)?.label || 'unknown'}`,
            diagnostic: scenario.diagnostics.find(d => d.exitCode !== 0)?.label || 'unknown',
            suggestion: 'Fix synthetic diagnostic and retry',
            timestamp: entries[1].timestamp,
          }]
          : [];
      
      // Calculate summary
      const summary = {
        totalDiagnostics: scenario.diagnostics.length,
        successfulDiagnostics: scenario.diagnostics.filter(d => d.exitCode === 0).length,
        failedDiagnostics: scenario.diagnostics.filter(d => d.exitCode !== 0).length,
        totalDuration,
        averageDiagnosticDuration: totalDuration / scenario.diagnostics.length,
      };
      
      sessions.push({
        sessionId,
        startTime: entries[0].timestamp,
        endTime: entries[1].timestamp,
        duration: totalDuration,
        stage: scenario.stage,
        status: scenario.expectedOutcome === 'failure' ? 'failed' : 'success',
        entries,
        diagnostics: scenario.diagnostics.map(diag => ({
          ...diag,
          success: diag.exitCode === 0,
        })),
        branch: scenario.branch,
        summary,
        issues,
      });
    }
    
    return sessions;
  }

  /**
   * Filter sessions by configuration
   */
  private static filterSessions(sessions: GuardianSessionAnalysis[], config: DryRunConfigType): GuardianSessionAnalysis[] {
    return sessions.filter(session => {
      // Filter by time range
      if (config.timeRange) {
        const sessionTime = new Date(session.startTime);
        const startTime = new Date(config.timeRange.start);
        const endTime = new Date(config.timeRange.end);
        if (sessionTime < startTime || sessionTime > endTime) {
          return false;
        }
      }
      
      // Filter by branch
      if (config.branch && session.branch !== config.branch) {
        return false;
      }
      
      // Filter by stage
      if (config.stage && config.stage !== 'both' && session.stage !== config.stage) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Select target session for analysis
   */
  private static selectTargetSession(sessions: GuardianSessionAnalysis[], config: DryRunConfigType): GuardianSessionAnalysis {
    if (sessions.length === 0) {
      throw new Error('No sessions found matching criteria');
    }
    
    // Prefer failed sessions for analysis
    const failedSessions = sessions.filter(s => s.status === 'failed');
    if (failedSessions.length > 0) {
      return failedSessions[0];
    }
    
    // Prefer sessions with issues
    const sessionsWithIssues = sessions.filter(s => s.issues.length > 0);
    if (sessionsWithIssues.length > 0) {
      return sessionsWithIssues[0];
    }
    
    // Return most recent session
    return sessions[0];
  }

  /**
   * Analyze a specific session
   */
  private static async analyzeSession(session: GuardianSessionAnalysis): Promise<GuardianSessionAnalysis> {
    // Add additional analysis logic here if needed
    return session;
  }

  /**
   * Generate recommendations based on analysis
   */
  private static generateRecommendations(analysis: GuardianSessionAnalysis, config: DryRunConfigType): string[] {
    const recommendations: string[] = [];
    
    if (analysis.status === 'failed') {
      recommendations.push('🔍 Fix failing diagnostics before retrying');
      recommendations.push(`📋 Review ${analysis.stage} stage configuration`);
      
      if (analysis.issues.length > 0) {
        recommendations.push(`⚠️ Address ${analysis.issues.length} detected issues`);
      }
    }
    
    if (analysis.summary.failedDiagnostics > 0) {
      recommendations.push(`🛠️ Fix ${analysis.summary.failedDiagnostics} failing diagnostics`);
    }
    
    if (analysis.summary.totalDuration > 60000) { // 1 minute
      recommendations.push('⏱️ Optimize slow operations to reduce duration');
    }
    
    if (analysis.summary.averageDiagnosticDuration > 10000) { // 10 seconds
      recommendations.push('⚡ Investigate slow diagnostic operations');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ No issues detected - system operating normally');
    }
    
    return recommendations;
  }

  /**
   * Generate session ID
   */
  private static generateSessionId(): string {
    return `guardian-dryrun-${Date.now().toString(36)}`;
  }

  /**
   * Generate ASCII dashboard
   */
  static generateASCIIDashboard(simulation: DryRunSimulation): string {
    const { result, config } = simulation;
    
    const lines: string[] = [];
    
    // Header
    lines.push('┌─────────────────────────────────────────────────────────────────────────────────────────┐');
    lines.push('│                    GUARDIAN AUTOPUSH DRY-RUN ANALYZER                      │');
    lines.push('├─────────────────────────────────────────────────────────────────────────────────┤');
    lines.push('');
    
    // Session Info
    lines.push('📊 SESSION INFORMATION');
    lines.push('├─────────────────────────────────────────────────────────────────────────────────┤');
    lines.push(`Session ID: ${result.sessionId}`);
    lines.push(`Timestamp: ${simulation.timestamp}`);
    lines.push(`Simulation: ${simulation.simulationType}`);
    lines.push(`Stage: ${result.stage.toUpperCase()}`);
    lines.push(`Status: ${result.status.toUpperCase()}`);
    lines.push(`Branch: ${result.branch}`);
    lines.push(`Duration: ${this.formatDuration(result.duration || 0)}`);
    lines.push('');
    
    // Summary
    lines.push('📈 SUMMARY METRICS');
    lines.push('├─────────────────────────────────────────────────────────────────────────────────┤');
    lines.push(`Diagnostics: ${result.summary.successfulDiagnostics}/${result.summary.totalDiagnostics} successful`);
    lines.push(`Duration: ${this.formatDuration(result.summary.totalDuration)}`);
    lines.push(`Avg Duration: ${this.formatDuration(result.summary.averageDiagnosticDuration)}`);
    lines.push(`Issues: ${result.issues.length} detected`);
    lines.push('');
    
    // Issues
    if (result.issues.length > 0) {
      lines.push('⚠️  DETECTED ISSUES');
      lines.push('├─────────────────────────────────────────────────────────────────────────────────┤');
      
      for (const issue of result.issues) {
        const icon = this.getSeverityIcon(issue.severity);
        lines.push(`${icon} ${issue.type.toUpperCase()}: ${issue.message}`);
        if (config.verbose) {
          lines.push(`   Suggestion: ${issue.suggestion}`);
          lines.push(`   Timestamp: ${issue.timestamp}`);
        }
      }
      lines.push('');
    }
    
    // Recent Entries
    lines.push('📝 RECENT ENTRIES');
    lines.push('├─────────────────────────────────────────────────────────────────────────────────┤');
    
    const recentEntries = result.entries.slice(-5);
    for (const entry of recentEntries) {
      const statusIcon = entry.status === 'completed' ? '✅' : entry.status === 'failed' ? '❌' : '⏳️';
      lines.push(`${statusIcon} [${entry.timestamp}] ${entry.message}`);
      
      if (entry.diagnostics && entry.diagnostics.length > 0) {
        const successCount = entry.diagnostics.filter(d => d.success).length;
        const totalCount = entry.diagnostics.length;
        lines.push(`   Diagnostics: ${successCount}/${totalCount} successful`);
      }
    }
    lines.push('');
    
    // Recommendations
    lines.push('💡 RECOMMENDATIONS');
    lines.push('├─────────────────────────────────────────────────────────────────────────────────┤');
    
    for (const recommendation of simulation.recommendations) {
      lines.push(recommendation);
    }
    lines.push('');
    
    // Footer
    lines.push('└─────────────────────────────────────────────────────────────────────────────────┘');
    lines.push(`Generated: ${new Date().toLocaleString()} | Guardian Dry-Run Analyzer`);
    
    return lines.join('\n');
  }

  /**
   * Format duration for display
   */
  private static formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m ${seconds % 60}s`;
    }
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }

  /**
   * Get severity icon for display
   */
  private static getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'low': return '🟡';
      case 'medium': return '🟠';
      case 'high': return '🔴';
      case 'critical': return '🚨';
      default: return '⚪';
    }
  }

  /**
   * Export analysis to JSON
   */
  static exportToJSON(simulation: DryRunSimulation): string {
    return JSON.stringify(simulation, null, 2);
  }

  /**
   * Export analysis to Markdown
   */
  static exportToMarkdown(simulation: DryRunSimulation): string {
    const lines: string[] = [];
    
    lines.push('# Guardian Autopush Dry-Run Analysis');
    lines.push('');
    lines.push(`**Session ID:** ${simulation.sessionId}`);
    lines.push(`**Timestamp:** ${simulation.timestamp}`);
    lines.push(`**Simulation Type:** ${simulation.simulationType}`);
    lines.push(`**Status:** ${simulation.result.status}`);
    lines.push('');
    
    lines.push('## Session Information');
    lines.push('');
    lines.push('- **Stage:** ' + simulation.result.stage);
    lines.push('- **Branch:** ' + simulation.result.branch);
    lines.push('- **Duration:** ' + this.formatDuration(simulation.result.duration || 0));
    lines.push('- **Entries:** ' + simulation.result.entries.length);
    lines.push('');
    
    lines.push('## Summary Metrics');
    lines.push('');
    lines.push(`- **Diagnostics:** ${simulation.result.summary.successfulDiagnostics}/${simulation.result.summary.totalDiagnostics} successful`);
    lines.push(`- **Total Duration:** ' + this.formatDuration(simulation.result.summary.totalDuration));
    lines.push(`- **Average Duration:** ' + this.formatDuration(simulation.result.summary.averageDiagnosticDuration));
    lines.push(`- **Issues Detected:** ' + simulation.result.issues.length);
    lines.push('');
    
    if (simulation.result.issues.length > 0) {
      lines.push('## Issues');
      lines.push('');
      
      for (const issue of simulation.result.issues) {
        lines.push(`### ${issue.type.toUpperCase()}`);
        lines.push(`- **Severity:** ${issue.severity}`);
        lines.push(`- **Stage:** ${issue.stage}`);
        lines.push(`- **Message:** ${issue.message}`);
        lines.push(`- **Suggestion:** ${issue.suggestion}`);
        lines.push(`- **Timestamp:** ${issue.timestamp}`);
        lines.push('');
      }
    }
    
    lines.push('## Recommendations');
    lines.push('');
    
    for (const recommendation of simulation.recommendations) {
      lines.push(`- ${recommendation}`);
    }
    
    return lines.join('\n');
  }
}
