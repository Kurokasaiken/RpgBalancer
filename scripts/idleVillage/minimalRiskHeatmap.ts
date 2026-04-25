#!/usr/bin/env tsx

/**
 * Minimal Risk Heatmap Export CLI
 *
 * Generates risk heatmap analysis from QA checklist data.
 * Outputs comprehensive risk analysis in JSON and Markdown formats.
 *
 * Usage:
 *   tsx scripts/idleVillage/minimalRiskHeatmap.ts --input-checklist qa-checklist.json --output-heatmap heatmap.json --output-markdown heatmap.md
 *   tsx scripts/idleVillage/minimalRiskHeatmap.ts --generate-checklist --output-heatmap heatmap.json --verbose
 *   tsx scripts/idleVillage/minimalRiskHeatmap.ts --help
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { generateRiskHeatmap } from '@/balancing/config/idleVillage/riskHeatmapExport';
import { generateQAChecklist, type QAChecklistReport } from '@/balancing/config/idleVillage/qaChecklistGenerator';
import { MINIMAL_GAMEPLAY_CONFIG } from '@/balancing/config/idleVillage/minimalGameplayConfig';

/**
 * Command line arguments interface
 */
interface CLIArgs {
  inputChecklist?: string;
  generateChecklist?: boolean;
  outputHeatmap?: string;
  outputMarkdown?: string;
  help?: boolean;
  verbose?: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const result: CLIArgs = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--input-checklist':
      case '-i':
        result.inputChecklist = args[++i];
        break;
      case '--generate-checklist':
      case '-g':
        result.generateChecklist = true;
        break;
      case '--output-heatmap':
      case '-j':
        result.outputHeatmap = args[++i];
        break;
      case '--output-markdown':
      case '-m':
        result.outputMarkdown = args[++i];
        break;
      case '--help':
      case '-h':
        result.help = true;
        break;
      case '--verbose':
      case '-v':
        result.verbose = true;
        break;
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  return result;
}

/**
 * Display help information
 */
function showHelp(): void {
  console.log(`
Minimal Risk Heatmap Export

Generates comprehensive risk heatmap analysis from QA checklist data.

USAGE:
  tsx scripts/idleVillage/minimalRiskHeatmap.ts [OPTIONS]

OPTIONS:
  -i, --input-checklist <file>   Input QA checklist JSON file
  -g, --generate-checklist      Generate QA checklist from current config
  -j, --output-heatmap <file>   Output risk heatmap in JSON format
  -m, --output-markdown <file>  Output risk heatmap in Markdown format
  -v, --verbose                 Enable verbose logging
  -h, --help                    Show help message

EXAMPLES:
  # Generate from existing checklist
  tsx scripts/idleVillage/minimalRiskHeatmap.ts \\
    --input-checklist qa-checklist.json \\
    --output-heatmap risk-heatmap.json \\
    --output-markdown risk-heatmap.md

  # Generate checklist and heatmap together
  tsx scripts/idleVillage/minimalRiskHeatmap.ts \\
    --generate-checklist \\
    --output-heatmap risk-heatmap.json \\
    --output-markdown risk-heatmap.md

  # Generate with verbose output
  tsx scripts/idleVillage/minimalRiskHeatmap.ts \\
    --generate-checklist \\
    --output-heatmap risk-heatmap.json \\
    --verbose

INPUT FORMATS:
  Checklist JSON: Valid QAChecklistReport object from QA checklist generator

OUTPUT FORMATS:
  Heatmap JSON: Structured risk analysis data for automation and integration
  Heatmap Markdown: Human-readable risk report with recommendations

EXIT CODES:
  0: Success
  1: Error (invalid arguments, file operations, data processing)
`);
}

/**
 * Load QA checklist from file
 */
function loadChecklist(filePath: string, verbose: boolean): QAChecklistReport {
  try {
    if (verbose) {
      console.log(`📖 Loading QA checklist from: ${filePath}`);
    }

    if (!existsSync(filePath)) {
      throw new Error(`Checklist file not found: ${filePath}`);
    }

    const data = readFileSync(filePath, 'utf-8');
    const checklist = JSON.parse(data) as QAChecklistReport;

    // Basic validation
    if (!checklist.sections || !Array.isArray(checklist.sections)) {
      throw new Error('Invalid checklist format: missing or invalid sections');
    }

    if (verbose) {
      console.log(`✅ Loaded checklist: ${checklist.totalTasks} tasks, ${checklist.sections.length} sections`);
    }

    return checklist;
  } catch (error) {
    console.error(`❌ Failed to load checklist from ${filePath}:`, error);
    process.exit(1);
  }
}

/**
 * Generate QA checklist from current config
 */
function generateChecklist(verbose: boolean): QAChecklistReport {
  if (verbose) {
    console.log('🔧 Generating QA checklist from current config...');
  }

  const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);

  if (verbose) {
    console.log(`✅ Generated checklist: ${checklist.totalTasks} tasks, ${checklist.sections.length} sections`);
  }

  return checklist;
}

/**
 * Ensure output directory exists
 */
function ensureDirectoryExists(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    try {
      require('fs').mkdirSync(dir, { recursive: true });
    } catch (error) {
      console.error(`❌ Failed to create directory ${dir}:`, error);
      process.exit(1);
    }
  }
}

/**
 * Generate and write JSON heatmap output
 */
function writeJsonHeatmap(heatmap: any, filePath: string, verbose: boolean): void {
  try {
    ensureDirectoryExists(filePath);
    writeFileSync(filePath, JSON.stringify(heatmap, null, 2), 'utf-8');
    if (verbose) {
      console.log(`✅ Risk heatmap JSON written to: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Failed to write JSON heatmap to ${filePath}:`, error);
    process.exit(1);
  }
}

/**
 * Generate Markdown heatmap output from risk data
 */
function generateMarkdownHeatmap(heatmap: any): string {
  let markdown = `# Minimal Gameplay Risk Heatmap

**Generated:** ${new Date(heatmap.generatedAt).toLocaleString()}
**Checklist Version:** ${heatmap.checklistVersion}
**Overall Risk Score:** ${heatmap.overallRiskScore.toFixed(1)}/100
**Overall Coverage:** ${heatmap.overallCoverage.toFixed(1)}%

## Executive Summary

- **Total Tasks:** ${heatmap.summary.totalTasks}
- **Automated Tasks:** ${heatmap.summary.automatedTasks} (${((heatmap.summary.automatedTasks / heatmap.summary.totalTasks) * 100).toFixed(1)}%)
- **Critical Tasks:** ${heatmap.summary.criticalTasks}
- **Coverage:** ${heatmap.summary.coveragePercentage.toFixed(1)}%
- **Estimated Testing Time:** ${Math.round(heatmap.summary.estimatedTotalTime / 60 * 10) / 10} hours

## Risk Overview

### Risk Level Distribution

| Risk Level | Categories | Description |
|------------|------------|-------------|
| 🔴 Critical | ${heatmap.riskMetrics.filter((m: any) => m.riskLevel === 'critical').length} | Immediate attention required |
| 🟠 High | ${heatmap.riskMetrics.filter((m: any) => m.riskLevel === 'high').length} | Address in next sprint |
| 🟡 Medium | ${heatmap.riskMetrics.filter((m: any) => m.riskLevel === 'medium').length} | Monitor and plan improvements |
| 🟢 Low | ${heatmap.riskMetrics.filter((m: any) => m.riskLevel === 'low').length} | Acceptable risk level |

## Risk Metrics by Category

`;

  // Risk metrics table
  markdown += '| Category | Risk Level | Coverage | Tasks | Automated | Risk Score | Recommendations |\n';
  markdown += '|----------|------------|----------|-------|-----------|------------|----------------|\n';

  heatmap.riskMetrics.forEach((metric: any) => {
    const riskEmoji = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
    }[metric.riskLevel] || '⚪';

    const recommendations = metric.recommendations.slice(0, 2).join('; ');
    const truncatedRecs = recommendations.length > 80 ? recommendations.substring(0, 77) + '...' : recommendations;

    markdown += `| ${metric.category} | ${riskEmoji} ${metric.riskLevel} | ${metric.coverage.toFixed(1)}% | ${metric.taskCount} | ${metric.automatedCount} | ${metric.riskScore.toFixed(1)} | ${truncatedRecs} |\n`;
  });

  markdown += '\n## Detailed Risk Analysis\n\n';

  // Detailed analysis for each category
  heatmap.riskMetrics.forEach((metric: any) => {
    const riskEmoji = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
    }[metric.riskLevel] || '⚪';

    markdown += `### ${riskEmoji} ${metric.category.charAt(0).toUpperCase() + metric.category.slice(1)}

**Risk Score:** ${metric.riskScore.toFixed(1)}/100 | **Coverage:** ${metric.coverage.toFixed(1)}% | **Tasks:** ${metric.taskCount}

**Priority Breakdown:**
- Critical: ${metric.priorityBreakdown.critical}
- High: ${metric.priorityBreakdown.high}
- Medium: ${metric.priorityBreakdown.medium}
- Low: ${metric.priorityBreakdown.low}

**Average Time:** ${metric.averageTimeMinutes.toFixed(1)} minutes per task

**Recommendations:**
${metric.recommendations.map((rec: string) => `- ${rec}`).join('\n')}

`;
  });

  // Coverage Gaps section
  if (heatmap.coverageGaps.length > 0) {
    markdown += '## Coverage Gaps\n\n';

    heatmap.coverageGaps.forEach((gap: any) => {
      const severityEmoji = {
        critical: '🚨',
        major: '⚠️',
        moderate: '⚡',
        minor: 'ℹ️',
      }[gap.severity] || '❓';

      markdown += `### ${severityEmoji} ${gap.description}

**Category:** ${gap.category} | **Severity:** ${gap.severity} | **Affected Tasks:** ${gap.affectedTasks}

**Estimated Impact:** ${gap.estimatedImpact}

**Mitigation Suggestions:**
${gap.mitigationSuggestions.map((suggestion: string) => `- ${suggestion}`).join('\n')}

`;
    });
  }

  // Recommendations section
  markdown += '## Action Recommendations\n\n';

  if (heatmap.recommendations.immediate.length > 0) {
    markdown += '### Immediate Actions (This Week)\n\n';
    heatmap.recommendations.immediate.forEach((rec: string) => {
      markdown += `- ${rec}\n`;
    });
    markdown += '\n';
  }

  if (heatmap.recommendations.shortTerm.length > 0) {
    markdown += '### Short-term Actions (1-2 Weeks)\n\n';
    heatmap.recommendations.shortTerm.forEach((rec: string) => {
      markdown += `- ${rec}\n`;
    });
    markdown += '\n';
  }

  if (heatmap.recommendations.longTerm.length > 0) {
    markdown += '### Long-term Actions (1-3 Months)\n\n';
    heatmap.recommendations.longTerm.forEach((rec: string) => {
      markdown += `- ${rec}\n`;
    });
    markdown += '\n';
  }

  // Risk Score Interpretation
  markdown += '## Risk Score Interpretation\n\n';
  markdown += '| Risk Score | Level | Description | Action Required |\n';
  markdown += '|------------|-------|-------------|----------------|\n';
  markdown += '| 75-100 | Critical | Severe risk requiring immediate attention | Stop release, address all critical issues |\n';
  markdown += '| 50-74 | High | Significant risk that should be addressed | Address before release, plan fixes |\n';
  markdown += '| 25-49 | Medium | Moderate risk, monitor closely | Review and mitigate where possible |\n';
  markdown += '| 0-24 | Low | Acceptable risk level | Continue with standard QA process |\n';
  markdown += '\n';

  // Coverage Guidelines
  markdown += '## Coverage Guidelines\n\n';
  markdown += '| Coverage % | Status | Description |\n';
  markdown += '|------------|--------|-------------|\n';
  markdown += '| 80%+ | Excellent | Comprehensive test coverage |\n';
  markdown += '| 60-79% | Good | Adequate coverage with some gaps |\n';
  markdown += '| 40-59% | Needs Improvement | Significant coverage gaps |\n';
  markdown += '| <40% | Critical | Insufficient test coverage |\n';
  markdown += '\n';

  markdown += '## Generation Notes\n\n';
  markdown += 'This risk heatmap was automatically generated from QA checklist analysis. Risk scores are calculated based on:\n\n';
  markdown += '- **Coverage:** Percentage of automated vs manual tests\n';
  markdown += '- **Priority:** Critical and high-priority task distribution\n';
  markdown += '- **Complexity:** Task duration and estimated effort\n';
  markdown += '- **Category:** Domain-specific risk multipliers\n\n';
  markdown += 'For the latest risk analysis, re-run this generator after QA checklist updates.\n';

  return markdown;
}

/**
 * Generate and write Markdown heatmap output
 */
function writeMarkdownHeatmap(heatmap: any, filePath: string, verbose: boolean): void {
  try {
    const markdown = generateMarkdownHeatmap(heatmap);
    ensureDirectoryExists(filePath);
    writeFileSync(filePath, markdown, 'utf-8');
    if (verbose) {
      console.log(`✅ Risk heatmap Markdown written to: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Failed to write Markdown heatmap to ${filePath}:`, error);
    process.exit(1);
  }
}

/**
 * Validate command line arguments
 */
function validateArgs(args: CLIArgs): void {
  if (args.help) return;

  // Must have either input checklist or generate flag
  if (!args.inputChecklist && !args.generateChecklist) {
    console.error('❌ Error: Must specify either --input-checklist or --generate-checklist');
    console.error('Run with --help for usage information');
    process.exit(1);
  }

  // Cannot specify both input and generate
  if (args.inputChecklist && args.generateChecklist) {
    console.error('❌ Error: Cannot specify both --input-checklist and --generate-checklist');
    console.error('Choose one input method');
    process.exit(1);
  }

  // Must have at least one output format
  if (!args.outputHeatmap && !args.outputMarkdown) {
    console.error('❌ Error: At least one output format must be specified (--output-heatmap or --output-markdown)');
    console.error('Run with --help for usage information');
    process.exit(1);
  }

  // Resolve relative paths to absolute
  if (args.inputChecklist) {
    args.inputChecklist = resolve(args.inputChecklist);
  }
  if (args.outputHeatmap) {
    args.outputHeatmap = resolve(args.outputHeatmap);
  }
  if (args.outputMarkdown) {
    args.outputMarkdown = resolve(args.outputMarkdown);
  }
}

/**
 * Main execution function
 */
function main(): void {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    return;
  }

  validateArgs(args);

  if (args.verbose) {
    console.log('🎯 Generating risk heatmap analysis...');
  }

  try {
    // Get QA checklist data
    let checklist: QAChecklistReport;
    if (args.inputChecklist) {
      checklist = loadChecklist(args.inputChecklist, args.verbose || false);
    } else {
      checklist = generateChecklist(args.verbose || false);
    }

    // Generate risk heatmap
    if (args.verbose) {
      console.log('📊 Analyzing risk metrics and coverage gaps...');
    }

    const heatmap = generateRiskHeatmap(checklist);

    if (args.verbose) {
      console.log(`✅ Risk analysis complete: ${heatmap.riskMetrics.length} categories analyzed, ${heatmap.coverageGaps.length} gaps identified`);
      console.log(`📈 Overall risk score: ${heatmap.overallRiskScore.toFixed(1)}/100`);
      console.log(`📊 Overall coverage: ${heatmap.overallCoverage.toFixed(1)}%`);
    }

    // Write outputs
    if (args.outputHeatmap) {
      writeJsonHeatmap(heatmap, args.outputHeatmap, args.verbose || false);
    }

    if (args.outputMarkdown) {
      writeMarkdownHeatmap(heatmap, args.outputMarkdown, args.verbose || false);
    }

    if (args.verbose) {
      console.log('🎉 Risk heatmap generation completed successfully!');
    }

  } catch (error) {
    console.error('❌ Failed to generate risk heatmap:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}
