#!/usr/bin/env tsx

/**
 * Guardian Autopush Dry-Run CLI - NP-041
 * 
 * Command-line interface for analyzing guardian_autopush operations
 * in dry-run mode with ASCII dashboard and telemetry.
 * 
 * @since 2026-01-19
 * @author Cascade
 */

import { Command } from 'commander';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { GuardianDryRunAnalyzer, type DryRunConfig, type DryRunSimulation } from '../../src/analytics/guardian/GuardianDryRunAnalyzer';
import { saveData } from '../../src/shared/persistence/PersistenceService';

// CLI Configuration
const program = new Command();
program
  .name('guardian-dryrun')
  .description('Guardian Autopush Dry-Run Analyzer - Analyze guardian operations in dry-run mode')
  .version('1.0.0');

// Global options
program
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--output-dir <dir>', 'Output directory for reports', './test-results/guardian-dryrun')
  .option('--log-dir <dir>', 'Guardian log directory', './test-results/auto-commit-guardian')
  .option('--format <format>', 'Output format: ascii, json, markdown', 'ascii')
  .option('--no-telemetry', 'Disable telemetry emission');

// Analyze command
program
  .command('analyze')
  .description('Analyze guardian autopush operations')
  .option('--time-range <range>', 'Time range for analysis (format: YYYY-MM-DD,YYYY-MM-DD)', 'last-7-days')
  .option('--branch <branch>', 'Filter by branch', 'main')
  .option('--stage <stage>', 'Filter by stage: commit, push, both', 'both')
  .option('--synthetic', 'Include synthetic test scenarios')
  .option('--scenarios <file>', 'Synthetic scenarios file')
  .option('--dry-run', 'Analyze without saving results')
  .option('--output <file>', 'Output file name (auto-generated if not provided)')
  .action(async (options) => {
    try {
      await handleAnalyze(options);
    } catch (error) {
      console.error('Analysis failed:', error);
      process.exit(1);
    }
  });

// List command
program
  .command('list')
  .description('List available guardian logs')
  .option('--type <type>', 'Filter by type: logs, sessions', 'logs')
  .action(async (options) => {
    try {
      await handleList(options);
    } catch (error) {
      console.error('List failed:', error);
      process.exit(1);
    }
  });

// Info command
program
  .command('info')
  .description('Show information about guardian system')
  .option('--stats', 'Show detailed statistics')
  .option('--recent <count>', 'Number of recent sessions to show', '5')
  .action(async (options) => {
    try {
      await handleInfo(options);
    } catch (error) {
      console.error('Info failed:', error);
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate guardian configuration and logs')
  .option('--log-dir <dir>', 'Guardian log directory to validate', './test-results/auto-commit-guardian')
  .action(async (options) => {
    try {
      await handleValidate(options);
    } catch (error) {
      console.error('Validation failed:', error);
      process.exit(1);
    }
  });

/**
 * Handle analyze command
 */
async function handleAnalyze(options: any) {
  const { 
    timeRange, 
    branch, 
    stage, 
    synthetic, 
    scenarios, 
    dryRun, 
    output, 
    outputDir, 
    logDir, 
    format, 
    verbose 
  } = options;

  if (verbose) {
    console.log('🔍 Starting Guardian Dry-Run Analysis...');
    console.log(`Time Range: ${timeRange || 'last-7-days'}`);
    console.log(`Branch: ${branch || 'all'}`);
    console.log(`Stage: ${stage || 'both'}`);
    console.log(`Synthetic Scenarios: ${synthetic ? 'enabled' : 'disabled'}`);
    console.log(`Output Format: ${format}`);
  }

  // Build configuration
  const config: DryRunConfig = {
    outputFormat: format as 'ascii',
    verbose: verbose,
    outputDir,
    logDir,
  };

  // Add time range if specified
  if (timeRange) {
    const [start, end] = timeRange.split(',');
    config.timeRange = { start, end };
  }

  if (branch) {
    config.branch = branch;
  }

  if (stage && stage !== 'both') {
    config.stage = stage as 'commit' | 'push';
  }

  if (synthetic) {
    config.includeSynthetic = true;
    
    // Load synthetic scenarios if file provided
    if (scenarios) {
      try {
        const scenariosContent = await readFile(scenarios, 'utf-8');
        const scenariosData = JSON.parse(scenariosContent);
        config.syntheticScenarios = scenariosData;
      } catch (error) {
        console.error('Failed to load synthetic scenarios:', error);
        process.exit(1);
      }
    } else {
      // Use default synthetic scenarios
      config.syntheticScenarios = getDefaultSyntheticScenarios();
    }
  }

  // Run analysis
  const simulation = await GuardianDryRunAnalyzer.analyzeDryRun(config);

  if (verbose) {
    console.log(`✅ Analysis completed`);
    console.log(`Session ID: ${simulation.sessionId}`);
    console.log(`Status: ${simulation.result.status}`);
    console.log(`Issues Detected: ${simulation.result.issues.length}`);
  }

  // Generate output
  let outputContent: string;
  let extension: string;

  switch (format) {
    case 'ascii':
      outputContent = GuardianDryRunAnalyzer.generateASCIIDashboard(simulation);
      extension = '.txt';
      break;
    case 'json':
      outputContent = GuardianDryRunAnalyzer.exportToJSON(simulation);
      extension = '.json';
      break;
    case 'markdown':
      outputContent = GuardianDryRunAnalyzer.exportToMarkdown(simulation);
      extension = '.md';
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  // Determine output file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const defaultFilename = `guardian-dryrun-${timestamp}${extension}`;
  const filename = output || defaultFilename;
  const filepath = join(outputDir, filename);

  if (dryRun) {
    console.log(`[DRY RUN] Would write to: ${filepath}`);
    console.log(`[DRY RUN] Content length: ${outputContent.length} characters`);
    return;
  }

  // Ensure output directory exists
  await mkdir(dirname(filepath), { recursive: true });

  // Write output
  await writeFile(filepath, outputContent, 'utf-8');

  console.log(`✅ Analysis complete: ${filepath}`);
  
  // Show summary
  console.log(`📊 Status: ${simulation.result.status}`);
  console.log(`📁 Issues: ${simulation.result.issues.length}`);
  console.log(`⏱️  Duration: ${formatDuration(simulation.result.duration || 0)}`);

  // Emit telemetry
  if (!options.noTelemetry) {
    await emitTelemetry('guardian_dryrun_analyzed', {
      sessionId: simulation.sessionId,
      simulationType: simulation.simulationType,
      status: simulation.result.status,
      stage: simulation.result.stage,
      branch: simulation.result.branch,
      duration: simulation.result.duration,
      issuesCount: simulation.result.issues.length,
      diagnosticsCount: simulation.result.summary.totalDiagnostics,
      successRate: simulation.result.summary.totalDiagnostics > 0 
        ? simulation.result.summary.successfulDiagnostics / simulation.result.summary.totalDiagnostics 
        : 1,
      recommendations: simulation.recommendations.length,
      outputFile: filename,
    });
  }
}

/**
 * Handle list command
 */
async function handleList(options: any) {
  const { type, logDir, verbose } = options;

  if (verbose) {
    console.log('📋 Listing Guardian logs...');
  }

  try {
    const logFiles = await GuardianDryRunAnalyzer['getLogFiles']();
    
    if (logFiles.length === 0) {
      console.log('No guardian logs found');
      return;
    }

    console.log(`\n📁 Found ${logFiles.length} log files:\n`);
    
    for (const logFile of logFiles) {
      const filepath = join(logDir, logFile);
      const stats = await stat(filepath);
      
      console.log(`📄 ${logFile}`);
      console.log(`   Size: ${formatFileSize(stats.size)}`);
      console.log(`   Modified: ${stats.mtime.toLocaleDateString()}`);
      console.log('');
    }
  } catch (error) {
    console.error('Failed to list logs:', error);
  }
}

/**
 * Handle info command
 */
async function handleInfo(options: any) {
  const { stats, recent, logDir, verbose } = options;

  if (verbose) {
    console.log('📊 Gathering Guardian system information...');
  }

  try {
    const logFiles = await GuardianDryRunAnalyzer['getLogFiles']();
    
    console.log('\n📊 Guardian System Information:');
    console.log(`Log Directory: ${logDir}`);
    console.log(`Total Log Files: ${logFiles.length}`);
    console.log(`Log Files Extension: .log, .txt`);
    
    if (stats) {
      console.log('\n📈 Statistics:');
      
      // Load all sessions for statistics
      const sessions = await GuardianDryRunAnalyzer['loadHistoricalSessions']({
        logDir,
      });
      
      if (sessions.length > 0) {
        const totalSessions = sessions.length;
        const successfulSessions = sessions.filter(s => s.status === 'success').length;
        const failedSessions = sessions.filter(s => s.status === 'failed').length;
        const incompleteSessions = sessions.filter(s => s.status === 'incomplete').length;
        
        console.log(`Total Sessions: ${totalSessions}`);
        console.log(`Successful: ${successfulSessions} (${((successfulSessions / totalSessions) * 100).toFixed(1)}%)`);
        console.log(`Failed: ${failedSessions} (${((failedSessions / totalSessions) * 100).toFixed(1)}%)`);
        console.log(`Incomplete: ${incompleteSessions} (${(incompleteSessions / totalSessions * 100).toFixed(1)}%)`);
        
        // Calculate average duration
        const completedSessions = sessions.filter(s => s.duration !== undefined);
        if (completedSessions.length > 0) {
          const avgDuration = completedSessions.reduce((sum, s) => sum + s.duration!, 0) / completedSessions.length;
          console.log(`Average Duration: ${formatDuration(avgDuration)}`);
        }
        
        // Most common issues
        const allIssues = sessions.flatMap(s => s.issues);
        const issueTypes = allIssues.reduce((acc, issue) => {
          acc[issue.type] = (acc[issue.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        if (Object.keys(issueTypes).length > 0) {
          console.log('\n🚨 Most Common Issues:');
          Object.entries(issueTypes)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .forEach(([type, count]) => {
              console.log(`  ${type}: ${count} occurrences`);
            });
        }
      }
    }
    
    if (recent && logFiles.length > 0) {
      console.log('\n📝 Recent Sessions:');
      
      const recentFiles = logFiles.slice(0, parseInt(recent));
      
      for (const logFile of recentFiles) {
        const session = await GuardianDryRunAnalyzer['parseLogFile'](logFile);
        if (session) {
          const statusIcon = session.status === 'success' ? '✅' : 
                           session.status === 'failed' ? '❌' : '⏳️';
          console.log(`${statusIcon} ${session.sessionId} (${session.stage}, ${session.status})`);
          console.log(`   Branch: ${session.branch}`);
          console.log(`   Duration: ${formatDuration(session.duration || 0)}`);
          console.log(`   Issues: ${session.issues.length}`);
          console.log('');
        }
      }
    }
  } catch (error) {
    console.error('Failed to get system information:', error);
  }
}

/**
 * Handle validate command
 */
async function handleValidate(options: any) {
  const { logDir, verbose } = options;

  if (verbose) {
    console.log('🔍 Validating Guardian configuration...');
  }

  console.log(`Log Directory: ${logDir}`);

  try {
    // Check if log directory exists
    const stats = await stat(logDir);
    console.log(`✅ Log directory exists`);
    console.log(`   Size: ${formatFileSize(stats.size)}`);
    console.log(`   Modified: ${stats.mtime.toLocaleDateString()}`);
    
    // Check log files
    const logFiles = await GuardianDryRunAnalyzer['getLogFiles']();
    console.log(`✅ Found ${logFiles.length} log files`);
    
    // Validate log file formats
    let validFiles = 0;
    let invalidFiles = 0;
    
    for (const logFile of logFiles) {
      try {
        const session = await GuardianDryRunAnalyzer['parseLogFile'](logFile);
        if (session) {
          validFiles++;
          console.log(`✅ ${logFile}: Valid format`);
        } else {
          invalidFiles++;
          console.log(`❌ ${logFile}: Invalid format`);
        }
      } catch (error) {
        invalidFiles++;
        console.log(`❌ ${logFile}: Parse error - ${error.message}`);
      }
    }
    
    console.log(`\n📊 Validation Results:`);
    console.log(`Valid Files: ${validFiles}`);
    console.log(`Invalid Files: ${invalidFiles}`);
    console.log(`Validation Rate: ${((validFiles / (validFiles + invalidFiles)) * 100).toFixed(1)}%`);
    
    if (invalidFiles > 0) {
      console.log('\n⚠️  Recommendations:');
      console.log('- Check log file formats and naming conventions');
      console.log('- Ensure logs contain proper timestamp and status markers');
      console.log('- Review guardian_autopush mandate for requirements');
    }
    
    if (validFiles > 0) {
      console.log('\n✅ Guardian system is properly configured');
    } else {
      console.log('\n❌ No valid log files found - check guardian_autopush setup');
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

/**
 * Get default synthetic scenarios
 */
function getDefaultSyntheticScenarios() {
  return [
    {
      name: 'Successful Commit',
      description: 'Normal successful commit operation',
      stage: 'commit',
      branch: 'main',
      diagnostics: [
        {
          label: 'npm run lint',
          command: 'npm',
          args: ['run', 'lint'],
          exitCode: 0,
          stdout: 'All files pass linting',
          stderr: '',
          duration: 2000,
        },
        {
          label: 'npm run test',
          command: 'npm',
          args: ['run', 'test'],
          exitCode: 0,
          stdout: 'Test suites passed',
          stderr: '',
          duration: 5000,
        },
        {
          label: 'npm run build:check',
          command: 'npm',
          args: ['run', 'build:check'],
          exitCode: 0,
          stdout: 'Build completed successfully',
          stderr: '',
          duration: 3000,
        },
      ],
      expectedOutcome: 'success',
    },
    {
      name: 'Lint Failure',
      description: 'Lint operation fails',
      stage: 'commit',
      branch: 'main',
      diagnostics: [
        {
          label: 'npm run lint',
          command: 'npm',
          args: ['run', 'lint'],
          exitCode: 1,
          stdout: '',
          stderr: 'error: Linting failed',
          duration: 1500,
        },
      ],
      expectedOutcome: 'failure',
    },
    {
      name: 'Push Timeout',
      description: 'Push operation times out',
      stage: 'push',
      branch: 'main',
      diagnostics: [
        {
          label: 'git push',
          command: 'git',
          args: ['push'],
          exitCode: 1,
          stdout: '',
          stderr: 'error: push timeout',
          duration: 45000,
        },
      ],
      expectedOutcome: 'failure',
    },
    {
      name: 'Network Error',
      description: 'Network connectivity issues',
      stage: 'push',
      branch: 'main',
      diagnostics: [
        {
          label: 'npm run deploy:vercel:verify',
          command: 'npm',
          args: ['run', 'deploy:vercel:verify'],
          exitCode: 1,
          stdout: '',
          stderr: 'error: Network unreachable',
          duration: 10000,
        },
      ],
      expectedOutcome: 'failure',
    },
  ];
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Format duration for display
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

/**
 * Emit telemetry event
 */
async function emitTelemetry(event: string, data: Record<string, any>) {
  try {
    // Save telemetry data
    await saveData(`telemetry_${event}_${Date.now()}`, {
      event,
      timestamp: new Date().toISOString(),
      data,
    });
  } catch (error) {
    // Silently ignore telemetry errors
    if (program.opts().verbose) {
      console.warn('Failed to emit telemetry:', error);
    }
  }
}

// Parse command line arguments
function parseArgs(args: string[]): any {
  const parsed: any = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        parsed[key] = nextArg;
        i++; // Skip next argument
      } else {
        parsed[key] = true;
      }
    }
  }
  return parsed;
}

// Parse command line arguments
program.parse();

/**
 * Display help if no command provided
 */
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
