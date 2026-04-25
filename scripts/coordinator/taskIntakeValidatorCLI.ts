#!/usr/bin/env node

/**
 * Task Intake Validator CLI
 * 
 * Command-line tool for validating strategy_tasks.md entries.
 * Detects tasks without proper prompts or KPI definitions.
 * 
 * @since 2026-01-19
 * @author Coordinator-Bot – Task Validator
 */

import { Command } from 'commander';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { TaskIntakeValidator } from './taskIntakeValidator';
import type { TaskValidationResult } from './taskIntakeValidatorSchema';

const program = new Command();

/**
 * Generate markdown report from validation result
 */
function generateMarkdownReport(result: TaskValidationResult): string {
  const timestamp = new Date(result.timestamp).toISOString();
  
  let markdown = `# Task Intake Validation Report

**Generated:** ${timestamp}  
**File:** ${result.filePath}  
**Duration:** ${result.duration}ms  
**Status:** ${result.passed ? '✅ PASSED' : '❌ FAILED'}  

## Summary

- **Total Tasks:** ${result.totalTasks}
- **Tasks with Issues:** ${result.tasksWithIssues}
- **Critical Issues:** ${result.issuesBySeverity.critical?.length || 0}
- **High Issues:** ${result.issuesBySeverity.high?.length || 0}
- **Medium Issues:** ${resultBySeverity.medium?.length || 0}
- **Low Issues:** ${resultBySeverity.low?.length || 0}

### Task Statistics

| Metric | Count |
|--------|-------|
| Tasks with Prompts | ${result.summary.tasksWithPrompts} |
| Tasks with KPI | ${result.summary.tasksWithKpi} |
| Completed Tasks | ${result.summary.completedTasks} |
| Pending Tasks | ${result.summary.pendingTasks} |
| Duplicate IDs | ${result.summary.duplicateIds} |
`;

  if (result.issues.length > 0) {
    markdown += `\n\n## Issues\n\n`;
    
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
          markdown += `  - **Task ID:** \`${issue.taskId}\`\n`;
          markdown += `  - **Line:** ${issue.lineNumber}\n`;
          markdown += `  - **Raw:** \`${issue.rawLine}\`\n`;
          if (issue.suggestion) {
            markdown += `  - **Fix:** ${issue.suggestion}\n`;
          }
          markdown += `\n`;
        });
      }
    }
  }

  if (result.issuesByType && Object.keys(result.issuesByType).length > 0) {
    markdown += `\n## Issues by Type\n\n`;
    
    Object.entries(result.issuesByType).forEach(([type, issues]) => {
      markdown += `### ${type.replace(/_/g, ' ').toUpperCase()} (${issues.length})\n\n`;
      issues.forEach(issue => {
        markdown += `- \`${issue.taskId}\`: ${issue.description}\n`;
      });
      markdown += `\n`;
    });
  }

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
    .name('taskIntakeValidator')
    .description('Validate strategy_tasks.md entries for prompts and KPI')
    .version('1.0.0');

  program
    .command('validate')
    .description('Validate strategy_tasks.md file')
    .option('-f, --file <path>', 'Strategy tasks file path', 'src/docs/docs/coordinator/strategy_tasks.md')
    .option('-o, --output <path>', 'Output directory', 'test-results')
    .option('--format <format>', 'Output format (json|markdown|both)', 'both')
    .option('--require-prompt', 'Require prompt instructions', true)
    .option('--require-kpi', 'Require KPI definitions', true)
    .option('--strict', 'Enable strict validation mode', false)
    .option('--auto-fix', 'Enable auto-fix for simple issues', false)
    .option('-q, --quiet', 'Suppress console output')
    .action(async (options) => {
      try {
        // Create validator with custom config
        const validator = new TaskIntakeValidator({
          requirePrompt: options.requirePrompt,
          requireKpi: options.requireKpi,
          strictMode: options.strict,
          enableAutoFix: options.autoFix,
        });

        if (!options.quiet) {
          console.log('🔍 Validating task intake...');
        }

        const result = await validator.validateFile(options.file);

        // Generate output
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const baseOutput = options.output;

        ensureOutputDir(baseOutput);

        if (options.format === 'json' || options.format === 'both') {
          const jsonOutput = `${baseOutput}/task-intake-validation-${timestamp}.json`;
          const jsonReport = validator.generateJsonReport(result);
          writeFileSync(jsonOutput, jsonReport);
          if (!options.quiet) {
            console.log(`📄 JSON report saved: ${jsonOutput}`);
          }
        }

        if (options.format === 'markdown' || options.format === 'both') {
          const mdOutput = `${baseOutput}/task-intake-validation-${timestamp}.md`;
          const markdown = generateMarkdownReport(result);
          writeFileSync(mdOutput, markdown);
          if (!options.quiet) {
            console.log(`📝 Markdown report saved: ${mdOutput}`);
          }
        }

        // Console summary
        if (!options.quiet) {
          console.log('\n📊 Validation Summary:');
          console.log(`   Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
          console.log(`   Duration: ${result.duration}ms`);
          console.log(`   Total Tasks: ${result.totalTasks}`);
          console.log(`   Issues Found: ${result.issues.length}`);
          
          if (result.issues.length > 0) {
            console.log('\n⚠️  Issues by Severity:');
            const stats = validator.getStatistics(result);
            console.log(`   Critical: ${stats.criticalIssues}`);
            console.log(`   High: ${stats.highIssues}`);
            console.log(`   Medium: ${stats.mediumIssues}`);
            console.log(`   Low: ${stats.lowIssues}`);
            
            console.log('\n⚠️  Issues by Type:');
            console.log(`   Missing Prompts: ${stats.missingPrompt}`);
            console.log(`   Missing KPI: ${stats.missingKpi}`);
            console.log(`   Duplicate IDs: ${stats.duplicateIds}`);
          }

          console.log('\n💡 Recommendations:');
          console.log(`   Tasks with Prompts: ${result.summary.tasksWithPrompts}/${result.totalTasks}`);
          console.log(`   Tasks with KPI: ${result.summary.tasksWithKpi}/${result.totalTasks}`);
          console.log(`   Completed Tasks: ${result.summary.completedTasks}/${result.totalTasks}`);
        }

        // Exit with appropriate code
        process.exit(result.passed ? 0 : 1);

      } catch (error) {
        console.error('❌ Validation failed:', error);
        process.exit(1);
      }
    });

  program
    .command('statistics')
    .description('Show validation statistics for strategy_tasks.md')
    .option('-f, --file <path>', 'Strategy tasks file path', 'src/docs/docs/coordinator/strategy_tasks.md')
    .option('--require-prompt', 'Require prompt instructions', true)
    .option('--require-kpi', 'Require KPI definitions', true)
    .action(async (options) => {
      try {
        const validator = new TaskIntakeValidator({
          requirePrompt: options.requirePrompt,
          requireKpi: options.requireKpi,
        });

        const result = await validator.validateFile(options.file);
        const stats = validator.getStatistics(result);

        console.log('📊 Task Intake Statistics');
        console.log('========================');
        console.log(`File: ${options.file}`);
        console.log(`Total Tasks: ${stats.totalTasks}`);
        console.log(`Tasks with Issues: ${stats.tasksWithIssues}`);
        console.log(`Critical Issues: ${stats.criticalIssues}`);
        console.log(`High Issues: ${stats.highIssues}`);
        console.log(`Medium Issues: ${stats.mediumIssues}`);
        console.log(`Low Issues: ${stats.lowIssues}`);
        console.log('');
        console.log('Prompt & KPI Coverage:');
        console.log(`Tasks with Prompts: ${stats.missingPrompt}/${stats.totalTasks} (${((stats.totalTasks - stats.missingPrompt) / stats.totalTasks * 100).toFixed(1)}%)`);
        console.log(`Tasks with KPI: ${stats.missingKpi}/${stats.totalTasks} (${((stats.totalTasks - stats.missingKpi) / stats.totalTasks * 100).toFixed(1)}%)`);
        console.log('');
        console.log('Task Status Breakdown:');
        console.log(`Completed: ${stats.completedTasks}/${stats.totalTasks} (${(stats.completedTasks / stats.totalTasks * 100).toFixed(1)}%)`);
        console.log(`Pending: ${stats.pendingTasks}/${stats.totalTasks} (${(stats.pendingTasks / stats.totalTasks * 100).toFixed(1)}%)`);
        console.log(`Duplicate IDs: ${stats.duplicateIds}`);

        process.exit(0);

      } catch (error) {
        console.error('❌ Failed to get statistics:', error);
        process.exit(1);
      }
    });

  program
    .command('check-rule')
    .description('Check if task has prompt or KPI (debug utility)')
    .argument('<task-text>', 'Task text to check')
    .option('--prompt', 'Check for prompt instructions', false)
    .option('--kpi', 'Check for KPI definitions', false)
    .action((taskText, options) => {
      const { hasPromptInstructions, hasKpiDefinition } = await import('./taskIntakeValidatorSchema');
      
      const hasPrompt = options.prompt ? hasPromptInstructions(taskText) : true;
      const hasKpi = options.kpi ? hasKpiDefinition(taskText) : true;
      
      console.log(`Task Text: "${taskText}"`);
      console.log(`Has Prompt: ${hasPrompt ? '✅' : '❌'}`);
      console.log(`Has KPI: ${hasKpi ? '✅' : '❌'}`);
      console.log(`Valid: ${hasPrompt && hasKpi ? '✅' : '❌'}`);
      
      process.exit(hasPrompt && hasKpi ? 0 : 1);
    });

  await program.parseAsync();
}

// Run CLI
if (require.main === module) {
  main().catch(console.error);
}
