#!/usr/bin/env node

/**
 * Undo/Redo Integrity Check CLI
 * 
 * Command-line tool for checking Balancer undo/redo persistence integrity.
 * Generates JSON and markdown reports with detailed analysis.
 * 
 * @since 2026-01-19
 * @author Sentinel-Balancer – Persistence Monitor
 */

import { Command } from 'commander';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { UndoRedoPersistenceMonitor } from '../../src/balancing/monitoring/UndoRedoPersistenceMonitor';
import type { UndoRedoIntegrityResult } from '../../src/balancing/monitoring/undoRedoMonitorSchema';

const program = new Command();

/**
 * Generate markdown report from integrity result
 */
function generateMarkdownReport(result: UndoRedoIntegrityResult): string {
  const timestamp = new Date(result.timestamp).toISOString();
  
  let markdown = `# Balancer Undo/Redo Integrity Report

**Generated:** ${timestamp}  
**Duration:** ${result.duration}ms  
**Status:** ${result.passed ? '✅ PASSED' : '❌ FAILED'}  
**Snapshots Analyzed:** ${result.snapshotsAnalyzed}  
**Current Checksum:** \`${result.currentChecksum}\`

## Summary

- **Issues Found:** ${result.issues.length}
- **Critical/High Issues:** ${result.issues.filter(i => i.severity === 'critical' || i.severity === 'high').length}
- **Undo Operations:** ${result.metrics.undoCount}
- **Redo Operations:** ${result.metrics.redoCount}
- **History Depth:** ${result.metrics.historyDepth}/${result.metrics.maxHistoryDepth}
- **Data Size:** ${(result.metrics.totalDataSize / 1024).toFixed(2)} KB

`;

  if (result.issues.length > 0) {
    markdown += `## Issues\n\n`;
    
    const groupedIssues = result.issues.reduce((acc, issue) => {
      if (!acc[issue.severity]) acc[issue.severity] = [];
      acc[issue.severity].push(issue);
      return acc;
    }, {} as Record<string, typeof result.issues>);

    for (const severity of ['critical', 'high', 'medium', 'low']) {
      const issues = groupedIssues[severity];
      if (issues && issues.length > 0) {
        markdown += `### ${severity.toUpperCase()} (${issues.length})\n\n`;
        issues.forEach(issue => {
          markdown += `- **${issue.type}**: ${issue.description}\n`;
          markdown += `  - **ID:** \`${issue.id}\`\n`;
          markdown += `  - **Detected:** ${new Date(issue.detectedAt).toISOString()}\n`;
          if (Object.keys(issue.details).length > 0) {
            markdown += `  - **Details:** \`${JSON.stringify(issue.details)}\`\n`;
          }
          if (issue.resolution) {
            markdown += `  - **Resolution:** ${issue.resolution}\n`;
          }
          markdown += `\n`;
        });
      }
    }
  }

  if (result.recommendations.length > 0) {
    markdown += `## Recommendations\n\n`;
    result.recommendations.forEach(rec => {
      markdown += `- ${rec}\n`;
    });
    markdown += `\n`;
  }

  markdown += `## Metrics\n\n`;
  markdown += `| Metric | Value |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| Undo Count | ${result.metrics.undoCount} |\n`;
  markdown += `| Redo Count | ${result.metrics.redoCount} |\n`;
  markdown += `| Avg Undo Time | ${result.metrics.avgUndoTime.toFixed(2)}ms |\n`;
  markdown += `| Avg Redo Time | ${result.metrics.avgRedoTime.toFixed(2)}ms |\n`;
  markdown += `| Current History Depth | ${result.metrics.historyDepth} |\n`;
  markdown += `| Max History Depth | ${result.metrics.maxHistoryDepth} |\n`;
  markdown += `| Total Data Size | ${(result.metrics.totalDataSize / 1024).toFixed(2)} KB |\n`;
  markdown += `| Integrity Issues | ${result.metrics.integrityIssues} |\n`;

  return markdown;
}

/**
 * Ensure output directory exists
 */
function ensureOutputDir(outputPath: string): void {
  const dir = outputPath.split('/').slice(0, -1).join('/');
  if (dir) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  program
    .name('undoRedoIntegrityCheck')
    .description('Check Balancer undo/redo persistence integrity')
    .version('1.0.0');

  program
    .command('check')
    .description('Perform integrity check')
    .option('-o, --output <path>', 'Output file path', 'test-results/undo-redo-integrity.json')
    .option('-f, --format <format>', 'Output format (json|markdown|both)', 'both')
    .option('-q, --quiet', 'Suppress console output')
    .option('--max-depth <number>', 'Maximum history depth', '10')
    .option('--checksum <algorithm>', 'Checksum algorithm (simple|sha256|md5)', 'simple')
    .action(async (options) => {
      try {
        // Create monitor with custom config
        const monitor = new UndoRedoPersistenceMonitor({
          maxHistoryDepth: parseInt(options.maxDepth),
          checksumAlgorithm: options.checksum,
        });

        // Start monitoring
        monitor.startMonitoring();

        // Perform integrity check
        if (!options.quiet) {
          console.log('🔍 Performing undo/redo integrity check...');
        }

        const result = await monitor.performIntegrityCheck();

        // Stop monitoring
        monitor.stopMonitoring();

        // Generate output
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const baseOutput = options.output.replace(/\.(json|md)$/, '');
        
        ensureOutputDir(options.output);

        if (options.format === 'json' || options.format === 'both') {
          const jsonOutput = `${baseOutput}-${timestamp}.json`;
          writeFileSync(jsonOutput, JSON.stringify(result, null, 2));
          if (!options.quiet) {
            console.log(`📄 JSON report saved: ${jsonOutput}`);
          }
        }

        if (options.format === 'markdown' || options.format === 'both') {
          const mdOutput = `${baseOutput}-${timestamp}.md`;
          const markdown = generateMarkdownReport(result);
          writeFileSync(mdOutput, markdown);
          if (!options.quiet) {
            console.log(`📝 Markdown report saved: ${mdOutput}`);
          }
        }

        // Console summary
        if (!options.quiet) {
          console.log('\n📊 Integrity Check Summary:');
          console.log(`   Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
          console.log(`   Duration: ${result.duration}ms`);
          console.log(`   Issues: ${result.issues.length}`);
          console.log(`   Snapshots: ${result.snapshotsAnalyzed}`);
          
          if (result.issues.length > 0) {
            console.log('\n⚠️  Issues found:');
            result.issues.forEach(issue => {
              const icon = issue.severity === 'critical' ? '🚨' : 
                          issue.severity === 'high' ? '⚠️' : 
                          issue.severity === 'medium' ? 'ℹ️' : '💡';
              console.log(`   ${icon} [${issue.severity.toUpperCase()}] ${issue.type}: ${issue.description}`);
            });
          }

          if (result.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            result.recommendations.forEach(rec => {
              console.log(`   • ${rec}`);
            });
          }
        }

        // Exit with appropriate code
        process.exit(result.passed ? 0 : 1);

      } catch (error) {
        console.error('❌ Integrity check failed:', error);
        process.exit(1);
      }
    });

  program
    .command('monitor')
    .description('Start continuous monitoring')
    .option('-i, --interval <seconds>', 'Check interval in seconds', '60')
    .option('-o, --output <path>', 'Output directory', 'test-results/undo-redo-monitor')
    .option('--max-depth <number>', 'Maximum history depth', '10')
    .action(async (options) => {
      try {
        const monitor = new UndoRedoPersistenceMonitor({
          maxHistoryDepth: parseInt(options.maxDepth),
          integrityCheckInterval: parseInt(options.interval) * 1000,
        });

        console.log(`🔍 Starting continuous monitoring (interval: ${options.interval}s)`);
        console.log('   Press Ctrl+C to stop');

        monitor.startMonitoring();

        // Handle graceful shutdown
        process.on('SIGINT', () => {
          console.log('\n🛑 Stopping monitoring...');
          monitor.stopMonitoring();
          
          // Export final state
          const state = monitor.exportState();
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const stateFile = join(options.output, `monitor-state-${timestamp}.json`);
          
          ensureOutputDir(stateFile);
          writeFileSync(stateFile, state);
          
          console.log(`📄 Final state saved: ${stateFile}`);
          process.exit(0);
        });

        // Keep process alive
        await new Promise(() => {});

      } catch (error) {
        console.error('❌ Monitoring failed:', error);
        process.exit(1);
      }
    });

  program
    .command('export')
    .description('Export current monitor state')
    .option('-o, --output <path>', 'Output file path', 'test-results/undo-redo-state.json')
    .action(async (options) => {
      try {
        const monitor = new UndoRedoPersistenceMonitor();
        monitor.startMonitoring();
        
        const state = monitor.exportState();
        
        ensureOutputDir(options.output);
        writeFileSync(options.output, state);
        
        console.log(`📄 Monitor state exported: ${options.output}`);
        
      } catch (error) {
        console.error('❌ Export failed:', error);
        process.exit(1);
      }
    });

  await program.parseAsync();
}

// Run CLI
if (require.main === module) {
  main().catch(console.error);
}
