#!/usr/bin/env tsx

/**
 * Physics Lab Evidence Automation & Guardian Handoff Script
 * 
 * Scans all Physics Lab evidence logs, extracts safeguard results,
 * generates automated reports, and prepares Guardian handoff documentation.
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface SafeguardResult {
  lint?: {
    status: 'PASS' | 'FAIL';
    errors?: number;
    warnings?: number;
    details?: string[];
  };
  test?: {
    status: 'PASS' | 'FAIL';
    passed?: number;
    failed?: number;
    total?: number;
    details?: string[];
  };
  build?: {
    status: 'PASS' | 'FAIL';
    details?: string[];
  };
  kanban?: {
    status: 'PASS' | 'FAIL';
    validated?: number;
    details?: string[];
  };
}

interface EvidenceLog {
  promptId: string;
  title: string;
  date: string;
  agent: string;
  status: 'Completato' | 'In corso' | 'Bloccato';
  safeguardResults: SafeguardResult;
  files: string[];
  summary: string;
  evidencePath: string;
}

interface GuardianHandoffReport {
  generatedAt: string;
  totalLogs: number;
  completedTasks: number;
  overallHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  logs: EvidenceLog[];
  summary: {
    byStatus: Record<string, number>;
    byAgent: Record<string, number>;
    commonIssues: string[];
    recommendations: string[];
  };
}

/**
 * Parse safeguard results from log content
 */
function parseSafeguardResults(content: string): SafeguardResult {
  const result: SafeguardResult = {};
  
  // Parse Lint results
  const lintMatch = content.match(/### ✅ Lint[\s\S]*?Status: (Passed|Failed)/i);
  if (lintMatch) {
    result.lint = {
      status: lintMatch[1].toUpperCase() as 'PASS' | 'FAIL'
    };
    
    // Extract errors/warnings if present
    const errorMatch = content.match(/errors?: (\d+)/i);
    const warningMatch = content.match(/warnings?: (\d+)/i);
    if (errorMatch) result.lint.errors = parseInt(errorMatch[1]);
    if (warningMatch) result.lint.warnings = parseInt(warningMatch[1]);
  }
  
  // Parse Test results
  const testMatch = content.match(/### ✅ Tests?[\s\S]*?Status: (Passed|Failed)/i);
  if (testMatch) {
    result.test = {
      status: testMatch[1].toUpperCase() as 'PASS' | 'FAIL'
    };
    
    // Extract test counts if present
    const passedMatch = content.match(/(\d+) passing|passed: (\d+)/i);
    const failedMatch = content.match(/(\d+) failing|failed: (\d+)/i);
    if (passedMatch) result.test.passed = parseInt(passedMatch[1] || passedMatch[2]);
    if (failedMatch) result.test.failed = parseInt(failedMatch[1] || failedMatch[2]);
  }
  
  // Parse Build results
  const buildMatch = content.match(/### ✅ Build Check[\s\S]*?Status: (Passed|Failed)/i);
  if (buildMatch) {
    result.build = {
      status: buildMatch[1].toUpperCase() as 'PASS' | 'FAIL'
    };
  }
  
  // Parse Kanban results
  const kanbanMatch = content.match(/### ✅ Kanban[\s\S]*?Status: (Passed|Failed)/i);
  if (kanbanMatch) {
    result.kanban = {
      status: kanbanMatch[1].toUpperCase() as 'PASS' | 'FAIL'
    };
    
    const validatedMatch = content.match(/(\d+) prompts validated/i);
    if (validatedMatch) result.kanban.validated = parseInt(validatedMatch[1]);
  }
  
  return result;
}

/**
 * Extract metadata from log content
 */
function extractLogMetadata(content: string, filePath: string): Partial<EvidenceLog> {
  const metadata: Partial<EvidenceLog> = {};
  
  // Extract prompt ID from filename
  const filename = path.basename(filePath);
  const idMatch = filename.match(/^(pl-\w+)-\d{4}-\d{2}-\d{2}\.log$/i);
  if (idMatch) {
    metadata.promptId = idMatch[1].toUpperCase();
  }
  
  // Extract title from first line or header
  const titleMatch = content.match(/^# (.+)$/m);
  if (titleMatch) {
    metadata.title = titleMatch[1];
  }
  
  // Extract date
  const dateMatch = content.match(/\*\*Date\*\*: (\d{4}-\d{2}-\d{2})/i);
  if (dateMatch) {
    metadata.date = dateMatch[1];
  }
  
  // Extract agent
  const agentMatch = content.match(/\*\*Agent\*\*: (\w+)/i);
  if (agentMatch) {
    metadata.agent = agentMatch[1];
  }
  
  // Extract status
  const statusMatch = content.match(/\*\*Status\*\*: (\w+)/i);
  if (statusMatch) {
    const status = statusMatch[1];
    if (status === 'Completato' || status === 'In corso' || status === 'Bloccato') {
      metadata.status = status;
    }
  }
  
  // Extract summary section
  const summaryMatch = content.match(/## Summary\s*\n([\s\S]*?)(?=##|$)/i);
  if (summaryMatch) {
    metadata.summary = summaryMatch[1].trim();
  }
  
  metadata.evidencePath = filePath;
  
  return metadata;
}

/**
 * Scan for all Physics Lab evidence logs
 */
async function scanEvidenceLogs(): Promise<string[]> {
  const pattern = 'test-results/pl-*.log';
  const files = await glob(pattern, { cwd: process.cwd() });
  
  // Sort by date (newest first)
  return files.sort((a, b) => {
    const dateA = a.match(/(\d{4}-\d{2}-\d{2})/)?.[1] || '';
    const dateB = b.match(/(\d{4}-\d{2}-\d{2})/)?.[1] || '';
    return dateB.localeCompare(dateA);
  });
}

/**
 * Process a single log file
 */
async function processLogFile(filePath: string): Promise<EvidenceLog> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const metadata = extractLogMetadata(content, filePath);
  const safeguardResults = parseSafeguardResults(content);
  
  // Extract file list if present
  const files: string[] = [];
  const filesMatch = content.match(/## Files Created[/Modified]+\s*\n([\s\S]*?)(?=##|$)/i);
  if (filesMatch) {
    const fileLines = filesMatch[1].split('\n').filter(line => line.startsWith('-'));
    fileLines.forEach(line => {
      const pathMatch = line.match(/`([^`]+)`/);
      if (pathMatch) files.push(pathMatch[1]);
    });
  }
  
  return {
    promptId: metadata.promptId || 'UNKNOWN',
    title: metadata.title || 'Unknown Task',
    date: metadata.date || new Date().toISOString().split('T')[0],
    agent: metadata.agent || 'Unknown',
    status: metadata.status || 'In corso', // Default to In corso for unknown status
    safeguardResults,
    files,
    summary: metadata.summary || '',
    evidencePath: filePath
  };
}

/**
 * Generate Guardian handoff report
 */
function generateGuardianReport(logs: EvidenceLog[]): GuardianHandoffReport {
  const completedTasks = logs.filter(log => log.status === 'Completato').length;
  const totalLogs = logs.length;
  
  // Calculate overall health
  const failedSafeguards = logs.filter(log => 
    Object.values(log.safeguardResults).some(result => result?.status === 'FAIL')
  ).length;
  
  let overallHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
  if (failedSafeguards > totalLogs * 0.25) overallHealth = 'CRITICAL';
  else if (failedSafeguards > 0) overallHealth = 'WARNING';
  
  // Generate summaries
  const byStatus = logs.reduce((acc, log) => {
    acc[log.status] = (acc[log.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const byAgent = logs.reduce((acc, log) => {
    acc[log.agent] = (acc[log.agent] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Extract common issues
  const commonIssues: string[] = [];
  const lintFailures = logs.filter(log => log.safeguardResults.lint?.status === 'FAIL');
  const testFailures = logs.filter(log => log.safeguardResults.test?.status === 'FAIL');
  const buildFailures = logs.filter(log => log.safeguardResults.build?.status === 'FAIL');
  
  if (lintFailures.length > 0) commonIssues.push(`${lintFailures.length} tasks have lint failures`);
  if (testFailures.length > 0) commonIssues.push(`${testFailures.length} tasks have test failures`);
  if (buildFailures.length > 0) commonIssues.push(`${buildFailures.length} tasks have build failures`);
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (failedSafeguards > 0) {
    recommendations.push('Address failed safeguards before production deployment');
  }
  if (testFailures.length > 0) {
    recommendations.push('Review and fix failing test suites');
  }
  if (lintFailures.length > 0) {
    recommendations.push('Resolve lint warnings to maintain code quality');
  }
  if (completedTasks === totalLogs) {
    recommendations.push('All Physics Lab tasks completed - ready for production review');
  }
  
  return {
    generatedAt: new Date().toISOString(),
    totalLogs,
    completedTasks,
    overallHealth,
    logs,
    summary: {
      byStatus,
      byAgent,
      commonIssues,
      recommendations
    }
  };
}

/**
 * Save reports in multiple formats
 */
async function saveReports(report: GuardianHandoffReport): Promise<void> {
  const timestamp = new Date().toISOString().split('T')[0];
  const baseFilename = `pl-evd-${timestamp}`;
  
  // Save JSON report
  const jsonPath = `test-results/${baseFilename}.json`;
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  
  // Save Markdown report
  const markdownPath = `test-results/${baseFilename}.md`;
  const markdown = generateMarkdownReport(report);
  fs.writeFileSync(markdownPath, markdown);
  
  // Save evidence log (simplified version)
  const logPath = `test-results/${baseFilename}.log`;
  const logContent = generateLogReport(report);
  fs.writeFileSync(logPath, logContent);
  
  console.log(`Reports saved:`);
  console.log(`  JSON: ${jsonPath}`);
  console.log(`  Markdown: ${markdownPath}`);
  console.log(`  Log: ${logPath}`);
}

/**
 * Generate Markdown report
 */
function generateMarkdownReport(report: GuardianHandoffReport): string {
  const { summary, logs } = report;
  
  let markdown = `# Physics Lab Evidence Automation Report\n\n`;
  markdown += `**Generated**: ${report.generatedAt}\n`;
  markdown += `**Total Tasks**: ${report.totalLogs}\n`;
  markdown += `**Completed**: ${report.completedTasks}\n`;
  markdown += `**Overall Health**: ${report.overallHealth}\n\n`;
  
  // Summary section
  markdown += `## Summary\n\n`;
  markdown += `### By Status\n\n`;
  Object.entries(summary.byStatus).forEach(([status, count]) => {
    markdown += `- **${status}**: ${count}\n`;
  });
  
  markdown += `\n### By Agent\n\n`;
  Object.entries(summary.byAgent).forEach(([agent, count]) => {
    markdown += `- **${agent}**: ${count}\n`;
  });
  
  if (summary.commonIssues.length > 0) {
    markdown += `\n### Common Issues\n\n`;
    summary.commonIssues.forEach(issue => {
      markdown += `- ${issue}\n`;
    });
  }
  
  if (summary.recommendations.length > 0) {
    markdown += `\n### Recommendations\n\n`;
    summary.recommendations.forEach(rec => {
      markdown += `- ${rec}\n`;
    });
  }
  
  // Detailed logs
  markdown += `\n## Detailed Evidence Logs\n\n`;
  logs.forEach(log => {
    markdown += `### ${log.promptId} - ${log.title}\n\n`;
    markdown += `**Date**: ${log.date}\n`;
    markdown += `**Agent**: ${log.agent}\n`;
    markdown += `**Status**: ${log.status}\n`;
    markdown += `**Evidence**: ${log.evidencePath}\n\n`;
    
    // Safeguard results
    markdown += `#### Safeguard Results\n\n`;
    Object.entries(log.safeguardResults).forEach(([type, result]) => {
      if (result) {
        markdown += `- **${type}**: ${result.status}`;
        if (result.errors !== undefined) markdown += ` (${result.errors} errors)`;
        if (result.warnings !== undefined) markdown += ` (${result.warnings} warnings)`;
        markdown += `\n`;
      }
    });
    
    if (log.files.length > 0) {
      markdown += `\n#### Files\n\n`;
      log.files.forEach(file => {
        markdown += `- \`${file}\`\n`;
      });
    }
    
    if (log.summary) {
      markdown += `\n#### Summary\n\n`;
      markdown += `${log.summary.substring(0, 200)}...\n`;
    }
    
    markdown += `\n---\n\n`;
  });
  
  return markdown;
}

/**
 * Generate simplified log report
 */
function generateLogReport(report: GuardianHandoffReport): string {
  const { summary, logs } = report;
  
  let content = `# PL-EVD – Physics Lab Evidence Automation & Guardian Handoff\n\n`;
  content += `Generated: ${report.generatedAt}\n`;
  content += `Total Logs: ${report.totalLogs}\n`;
  content += `Completed: ${report.completedTasks}\n`;
  content += `Health: ${report.overallHealth}\n\n`;
  
  content += `## Safeguard Summary\n\n`;
  Object.entries(summary.byStatus).forEach(([status, count]) => {
    content += `${status}: ${count}\n`;
  });
  
  if (summary.commonIssues.length > 0) {
    content += `\n## Issues\n\n`;
    summary.commonIssues.forEach(issue => {
      content += `- ${issue}\n`;
    });
  }
  
  content += `\n## Individual Logs\n\n`;
  logs.forEach(log => {
    content += `${log.promptId}: ${log.status} (${log.evidencePath})\n`;
  });
  
  return content;
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log('🔍 Physics Lab Evidence Automation - Starting scan...\n');
  
  try {
    // Scan for evidence logs
    const logFiles = await scanEvidenceLogs();
    console.log(`Found ${logFiles.length} Physics Lab evidence logs`);
    
    if (logFiles.length === 0) {
      console.log('⚠️  No Physics Lab evidence logs found');
      return;
    }
    
    // Process each log
    const logs: EvidenceLog[] = [];
    for (const logFile of logFiles) {
      console.log(`Processing: ${logFile}`);
      const log = await processLogFile(logFile);
      logs.push(log);
    }
    
    // Generate Guardian report
    const report = generateGuardianReport(logs);
    
    // Save reports
    await saveReports(report);
    
    // Print summary
    console.log('\n📊 Summary:');
    console.log(`  Total tasks: ${report.totalLogs}`);
    console.log(`  Completed: ${report.completedTasks}`);
    console.log(`  Health: ${report.overallHealth}`);
    
    if (report.summary.commonIssues.length > 0) {
      console.log('\n⚠️  Issues:');
      report.summary.commonIssues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    console.log('\n✅ Evidence automation completed successfully');
    
  } catch (error) {
    console.error('❌ Error during evidence automation:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

export { 
  main, 
  generateGuardianReport, 
  processLogFile, 
  parseSafeguardResults,
  extractLogMetadata,
  scanEvidenceLogs
};
