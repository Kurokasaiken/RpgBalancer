#!/usr/bin/env tsx

/**
 * Stress Testing Data Quality CLI
 * 
 * CLI tool for analyzing MU (Marginal Utility) output data quality
 * Detects anomalies, validates ranges, and generates QA reports.
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { program } from 'commander';
import chalk from 'chalk';
import { DataQualityValidator, DataQualityRules, DEFAULT_DATA_QUALITY_RULES, type DataQualityReport } from '../../src/balancing/stressTesting/DataQualityRules.js';
import type { ExportData } from '../../src/balancing/stressTesting/MarginalUtilityTypes.js';
import type { QualityIssue } from '../../src/balancing/stressTesting/DataQualityRules.js';

/**
 * CLI configuration
 */
interface CliOptions {
  input: string;
  format: 'markdown' | 'json' | 'console';
  rules?: string;
  output?: string;
  verbose?: boolean;
  'fail-threshold'?: number;
}

/**
 * Load and parse input data
 */
function loadInputData(inputPath: string): ExportData {
  const fullPath = join(process.cwd(), inputPath);
  
  if (!existsSync(fullPath)) {
    console.error(chalk.red(`❌ Input file not found: ${fullPath}`));
    process.exit(1);
  }

  try {
    const fileContent = readFileSync(fullPath, 'utf-8');
    const data = JSON.parse(fileContent) as ExportData;
    
    if (!data.analysis) {
      console.error(chalk.red('❌ Invalid input file: missing analysis data'));
      process.exit(1);
    }
    
    return data;
  } catch (error) {
    console.error(chalk.red(`❌ Failed to parse input file: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}

/**
 * Load custom rules configuration
 */
function loadRules(rulesPath?: string): DataQualityRules {
  if (!rulesPath) {
    return DEFAULT_DATA_QUALITY_RULES;
  }

  try {
    const fullPath = join(process.cwd(), rulesPath);
    if (!existsSync(fullPath)) {
      console.warn(chalk.yellow(`⚠️  Rules file not found: ${fullPath}, using defaults`));
      return DEFAULT_DATA_QUALITY_RULES;
    }

    const fileContent = readFileSync(fullPath, 'utf-8');
    return JSON.parse(fileContent) as DataQualityRules;
  } catch (error) {
    console.warn(chalk.yellow(`⚠️  Failed to load rules file: ${error instanceof Error ? error.message : 'Unknown error'}, using defaults`));
    return DEFAULT_DATA_QUALITY_RULES;
  }
}

/**
 * Generate console output
 */
function generateConsoleOutput(report: DataQualityReport, options: CliOptions): void {
  console.log(chalk.bold.blue('\n🔍 Stress Testing Data Quality Report'));
  console.log(chalk.gray('='.repeat(50)));
  
  // Metadata
  console.log(chalk.cyan('\n📋 Metadata:'));
  console.log(`  Input File: ${report.metadata.inputFile}`);
  console.log(`  Analysis ID: ${report.metadata.analysisId || 'N/A'}`);
  console.log(`  Timestamp: ${new Date(report.metadata.timestamp).toLocaleString()}`);
  
  // Summary
  console.log(chalk.cyan('\n📊 Summary:'));
  console.log(`  Total Issues: ${report.summary.totalIssues}`);
  console.log(`  Quality Score: ${report.summary.qualityScore}/100`);
  
  const statusColor = report.summary.status === 'pass' ? chalk.green : 
                     report.summary.status === 'warning' ? chalk.yellow : chalk.red;
  console.log(`  Status: ${statusColor(report.summary.status.toUpperCase())}`);
  
  // Issues by severity
  console.log(chalk.cyan('\n⚠️  Issues by Severity:'));
  console.log(`  Errors: ${chalk.red(report.summary.issuesBySeverity.error)}`);
  console.log(`  Warnings: ${chalk.yellow(report.summary.issuesBySeverity.warning)}`);
  console.log(`  Info: ${chalk.blue(report.summary.issuesBySeverity.info)}`);
  
  // Data statistics
  console.log(chalk.cyan('\n📈 Data Statistics:'));
  console.log(`  Stats Analyzed: ${report.dataStats.statCount}`);
  console.log(`  Synergy Pairs: ${report.dataStats.synergyCount}`);
  console.log(`  Total Simulations: ${report.dataStats.totalSimulations.toLocaleString()}`);
  console.log(`  Runtime: ${(report.dataStats.runtimeMs / 1000).toFixed(2)}s`);
  console.log(`  Completeness: ${report.dataStats.completenessPercentage.toFixed(1)}%`);
  
  // Issues by type
  if (options.verbose && report.summary.totalIssues > 0) {
    console.log(chalk.cyan('\n🔍 Issues by Type:'));
    Object.entries(report.summary.issuesByType).forEach(([type, count]) => {
      if (Number(count) > 0) {
        console.log(`  ${type}: ${count}`);
      }
    });
    
    // Detailed issues
    console.log(chalk.cyan('\n📝 Detailed Issues:'));
    report.issues.forEach((issue: QualityIssue, index: number) => {
      const severityColor = issue.severity === 'error' ? chalk.red : 
                         issue.severity === 'warning' ? chalk.yellow : chalk.blue;
      console.log(`\n${index + 1}. ${severityColor(issue.severity.toUpperCase())} - ${issue.type}`);
      console.log(`   Description: ${issue.description}`);
      console.log(`   Location: ${issue.location.path}`);
      if (issue.location.context) {
        console.log(`   Context: ${issue.location.context}`);
      }
      console.log(`   Actual: ${issue.actualValue}`);
      console.log(`   Expected: ${issue.expectedValue}`);
      console.log(`   Rule: ${issue.rule}`);
    });
  }
}

/**
 * Generate markdown output
 */
function generateMarkdownOutput(report: DataQualityReport): string {
  const lines = [
    '# Stress Testing Data Quality Report',
    '',
    '## 📋 Metadata',
    '',
    `- **Input File:** ${report.metadata.inputFile}`,
    `- **Analysis ID:** ${report.metadata.analysisId || 'N/A'}`,
    `- **Timestamp:** ${new Date(report.metadata.timestamp).toLocaleString()}`,
    '',
    '## 📊 Summary',
    '',
    `- **Total Issues:** ${report.summary.totalIssues}`,
    `- **Quality Score:** ${report.summary.qualityScore}/100`,
    `- **Status:** ${report.summary.status.toUpperCase()}`,
    '',
    '## ⚠️ Issues by Severity',
    '',
    '| Severity | Count |',
    '|----------|-------|',
    `| Errors | ${report.summary.issuesBySeverity.error} |`,
    `| Warnings | ${report.summary.issuesBySeverity.warning} |`,
    `| Info | ${report.summary.issuesBySeverity.info} |`,
    '',
    '## 📈 Data Statistics',
    '',
    `- **Stats Analyzed:** ${report.dataStats.statCount}`,
    `- **Synergy Pairs:** ${report.dataStats.synergyCount}`,
    `- **Total Simulations:** ${report.dataStats.totalSimulations.toLocaleString()}`,
    `- **Runtime:** ${(report.dataStats.runtimeMs / 1000).toFixed(2)}s`,
    `- **Completeness:** ${report.dataStats.completenessPercentage.toFixed(1)}%`,
    '',
    '## 🔍 Issues by Type',
    '',
    '| Type | Count |',
    '|------|-------|',
  ];

  Object.entries(report.summary.issuesByType).forEach(([type, count]) => {
      if (Number(count) > 0) {
        lines.push(`| ${type} | ${count} |`);
      }
    });

  if (report.issues.length > 0) {
    lines.push(
      '',
      '## 📝 Detailed Issues',
      ''
    );

    report.issues.forEach((issue: QualityIssue, index: number) => {
      lines.push(
        `### ${index + 1}. ${issue.severity.toUpperCase()} - ${issue.type}`,
        '',
        `- **Description:** ${issue.description}`,
        `- **Location:** ${issue.location.path}`,
        issue.location.context ? `- **Context:** ${issue.location.context}` : '',
        `- **Actual Value:** ${issue.actualValue}`,
        `- **Expected Value:** ${issue.expectedValue}`,
        `- **Rule:** ${issue.rule}`,
        ''
      );
    });
  }

  return lines.join('\n');
}

/**
 * Save output to file
 */
function saveOutput(content: string, outputPath: string): void {
  try {
    const fullPath = join(process.cwd(), outputPath);
    writeFileSync(fullPath, content, 'utf-8');
    console.log(chalk.green(`✅ Report saved to: ${fullPath}`));
  } catch (error) {
    console.error(chalk.red(`❌ Failed to save output: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  program
    .name('stressTesting:checkData')
    .description('Analyze stress testing data quality and generate QA reports')
    .version('1.0.0');

  program
    .requiredOption('-i, --input <path>', 'Input data file (JSON)')
    .option('-f, --format <format>', 'Output format (console|markdown|json)', 'console')
    .option('-r, --rules <path>', 'Custom rules configuration file (JSON)')
    .option('-o, --output <path>', 'Output file path (optional)')
    .option('-v, --verbose', 'Show detailed issues', false)
    .option('--fail-threshold <number>', 'Quality score threshold for failure (0-100)', '70');

  program.parse();
  const options = program.opts() as CliOptions;

  // Validate options
  if (!['console', 'markdown', 'json'].includes(options.format)) {
    console.error(chalk.red('❌ Invalid format. Use: console, markdown, or json'));
    process.exit(1);
  }

  const failThreshold = Number(options['fail-threshold']);
  if (isNaN(failThreshold) || failThreshold < 0 || failThreshold > 100) {
    console.error(chalk.red('❌ Invalid fail-threshold. Use a number between 0 and 100'));
    process.exit(1);
  }

  try {
    // Load data and rules
    console.log(chalk.blue('🔍 Loading data...'));
    const inputData = loadInputData(options.input);
    const rules = loadRules(options.rules);

    if (options.verbose) {
      console.log(chalk.gray(`  Using rules: ${options.rules || 'defaults'}`));
      console.log(chalk.gray(`  Input file: ${options.input}`));
    }

    // Run validation
    console.log(chalk.blue('🔍 Analyzing data quality...'));
    const validator = new DataQualityValidator(rules);
    const report = validator.validateExportData(inputData);

    // Generate output
    let output: string;
    switch (options.format) {
      case 'console':
        generateConsoleOutput(report, options);
        output = '';
        break;
      case 'markdown':
        output = generateMarkdownOutput(report);
        break;
      case 'json':
        output = JSON.stringify(report, null, 2);
        break;
      default:
        output = '';
    }

    // Save output if needed
    if (options.output && output) {
      saveOutput(output, options.output);
    } else if (options.format !== 'console') {
      console.log(output);
    }

    // Check failure threshold
    if (report.summary.qualityScore < failThreshold) {
      console.log(chalk.red(`\n❌ Quality score (${report.summary.qualityScore}) below threshold (${failThreshold})`));
      process.exit(1);
    }

    if (report.summary.status === 'fail') {
      console.log(chalk.red('\n❌ Data quality check failed due to errors'));
      process.exit(1);
    }

    console.log(chalk.green(`\n✅ Data quality check passed (Score: ${report.summary.qualityScore}/100)`));

  } catch (error) {
    console.error(chalk.red(`❌ Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(chalk.red('❌ CLI failed:'), error);
    process.exit(1);
  });
}
