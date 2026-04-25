/**
 * Kanban Auto Audit Script
 * 
 * Automatically audits the Kanban (agent_assignments.md) to verify:
 * - "In corso" entries have agent/date
 * - "Completato" entries have evidence
 * - Policy compliance (KS-005)
 * - CI integration validation
 * 
 * @module kanbanAutoAudit
 * @since 2026-01-11
 * @author Orion-Coord
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { program } from 'commander';
import { validatePolicyKS005, runKanbanLint } from './kanbanLintIntegration';

/**
 * Kanban entry parsed from markdown table
 */
interface KanbanEntry {
  /** Row index in table */
  rowIndex: number;
  /** Task ID/name */
  taskId: string;
  /** Current status */
  status: 'Non assegnato' | 'In corso' | 'Completato' | 'Bloccato';
  /** Assigned agent */
  agent?: string;
  /** Start date */
  startDate?: string;
  /** End date */
  endDate?: string;
  /** Phase/Category */
  phase?: string;
  /** Evidence file/log reference */
  evidence?: string;
  /** Raw markdown content */
  rawContent: string;
}

/**
 * Audit validation result
 */
interface ValidationResult {
  /** Validation passed */
  valid: boolean;
  /** Validation rule that failed */
  rule: string;
  /** Error message */
  message: string;
  /** Severity level */
  severity: 'error' | 'warning' | 'info';
  /** Entry reference */
  entry?: KanbanEntry;
}

/**
 * Complete audit report
 */
interface AuditReport {
  /** Audit timestamp */
  timestamp: string;
  /** Total entries processed */
  totalEntries: number;
  /** Validation results */
  results: ValidationResult[];
  /** Summary statistics */
  summary: {
    errors: number;
    warnings: number;
    info: number;
    valid: number;
  };
  /** Policy compliance status */
  policyCompliance: {
    ks005Compliant: boolean;
    issues: string[];
  };
  /** CI integration status */
  ciIntegration: {
    kanbanLintPassed: boolean;
    lintErrors: string[];
    workflowExists: boolean;
    preCommitHookExists: boolean;
  };
}

/**
 * Parse markdown table rows from agent_assignments.md
 */
function parseKanbanTable(content: string): KanbanEntry[] {
  const entries: KanbanEntry[] = [];
  const lines = content.split('\n');
  let inTable = false;
  let headerParsed = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect table start
    if (line.includes('|') && line.includes('Task ID') && line.includes('Status')) {
      inTable = true;
      headerParsed = true;
      continue;
    }
    
    // Detect table end
    if (inTable && (!line.includes('|') || line === '')) {
      inTable = false;
      continue;
    }
    
    // Parse table rows
    if (inTable && headerParsed && line.includes('|') && !line.includes('---')) {
      const columns = line.split('|').map(col => col.trim()).filter(col => col);
      
      if (columns.length >= 8) {
        const entry: KanbanEntry = {
          rowIndex: i,
          taskId: columns[0] || '',
          status: columns[1] as KanbanEntry['status'],
          agent: columns[2] || undefined,
          startDate: columns[3] || undefined,
          endDate: columns[4] || undefined,
          phase: columns[5] || undefined,
          evidence: extractEvidenceFromContent(lines, i),
          rawContent: line,
        };
        
        entries.push(entry);
      }
    }
  }
  
  return entries;
}

/**
 * Extract evidence from content following table row
 */
function extractEvidenceFromContent(lines: string[], rowIndex: number): string | undefined {
  // Look for "Evidence:" in the next few lines after the table row
  for (let i = rowIndex + 1; i < Math.min(rowIndex + 10, lines.length); i++) {
    const line = lines[i].trim();
    if (line.startsWith('Evidence:')) {
      return line.substring(9).trim(); // Remove "Evidence:" prefix
    }
  }
  return undefined;
}

/**
 * Validate kanban entries against rules
 */
function validateEntries(entries: KanbanEntry[]): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  for (const entry of entries) {
    // Rule: "In corso" must have agent and start date
    if (entry.status === 'In corso') {
      if (!entry.agent) {
        results.push({
          valid: false,
          rule: 'IN_COURSE_AGENT_REQUIRED',
          message: `"In corso" entry must have assigned agent`,
          severity: 'error',
          entry,
        });
      }
      
      if (!entry.startDate) {
        results.push({
          valid: false,
          rule: 'IN_COURSE_DATE_REQUIRED',
          message: `"In corso" entry must have start date`,
          severity: 'error',
          entry,
        });
      }
      
      if (entry.agent && entry.startDate) {
        results.push({
          valid: true,
          rule: 'IN_COURSE_COMPLETE',
          message: `"In corso" entry has agent and date`,
          severity: 'info',
          entry,
        });
      }
    }
    
    // Rule: "Completato" must have evidence
    if (entry.status === 'Completato') {
      if (!entry.evidence) {
        results.push({
          valid: false,
          rule: 'COMPLETED_EVIDENCE_REQUIRED',
          message: `"Completato" entry must have evidence reference`,
          severity: 'error',
          entry,
        });
      } else if (!entry.endDate) {
        results.push({
          valid: false,
          rule: 'COMPLETED_DATE_REQUIRED',
          message: `"Completato" entry must have end date`,
          severity: 'warning',
          entry,
        });
      } else {
        results.push({
          valid: true,
          rule: 'COMPLETED_COMPLETE',
          message: `"Completato" entry has evidence and date`,
          severity: 'info',
          entry,
        });
      }
    }
    
    // Rule: "Non assegnato" should not have agent/date
    if (entry.status === 'Non assegnato') {
      if (entry.agent || entry.startDate) {
        results.push({
          valid: false,
          rule: 'UNASSIGNED_SHOULD_NOT_HAVE_DETAILS',
          message: `"Non assegnato" entry should not have agent or date`,
          severity: 'warning',
          entry,
        });
      }
    }
    
    // Rule: Check for stale "In corso" entries (older than 30 days)
    if (entry.status === 'In corso' && entry.startDate) {
      const startDate = new Date(entry.startDate);
      const now = new Date();
      const daysDiff = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 30) {
        results.push({
          valid: false,
          rule: 'STALE_IN_COURSE',
          message: `"In corso" entry is older than 30 days (${Math.round(daysDiff)} days)`,
          severity: 'warning',
          entry,
        });
      }
    }
  }
  
  return results;
}

/**
 * Check KS-005 policy compliance using integrated validation
 */
function checkPolicyCompliance(content: string): { compliant: boolean; issues: string[] } {
  const policyValidation = validatePolicyKS005(content);
  return {
    compliant: policyValidation.passed,
    issues: policyValidation.violations
  };
}

/**
 * Generate audit report
 */
function generateAuditReport(entries: KanbanEntry[], validationResults: ValidationResult[], content: string): AuditReport {
  const errors = validationResults.filter(r => r.severity === 'error').length;
  const warnings = validationResults.filter(r => r.severity === 'warning').length;
  const info = validationResults.filter(r => r.severity === 'info').length;
  const valid = validationResults.filter(r => r.valid).length;
  
  // Check KS-005 policy compliance
  const policyCompliance = checkPolicyCompliance(content);
  
  // Check CI integration status
  const kanbanLintResult = runKanbanLint();
  const workflowExists = existsSync('.github/workflows/kanban-lint.yml');
  const preCommitHookExists = existsSync('.git/hooks/pre-commit');
  
  return {
    timestamp: new Date().toISOString(),
    totalEntries: entries.length,
    results: validationResults,
    summary: {
      errors,
      warnings,
      info,
      valid,
    },
    policyCompliance: {
      ks005Compliant: policyCompliance.compliant,
      issues: policyCompliance.issues,
    },
    ciIntegration: {
      kanbanLintPassed: kanbanLintResult.passed,
      lintErrors: kanbanLintResult.errors,
      workflowExists,
      preCommitHookExists,
    },
  };
}

/**
 * Format report as markdown
 */
function formatReportAsMarkdown(report: AuditReport): string {
  const { timestamp, totalEntries, summary, policyCompliance, ciIntegration } = report;
  
  let md = `# Kanban Auto Audit Report\n\n`;
  md += `**Generated**: ${new Date(timestamp).toLocaleString()}\n`;
  md += `**Total Entries**: ${totalEntries}\n\n`;
  
  // Summary section
  md += `## Summary\n\n`;
  md += `- ✅ Valid: ${summary.valid}\n`;
  md += `- ❌ Errors: ${summary.errors}\n`;
  md += `- ⚠️ Warnings: ${summary.warnings}\n`;
  md += `- ℹ️ Info: ${summary.info}\n\n`;
  
  // CI integration status
  md += `## CI Integration Status\n\n`;
  md += `- **Kanban Lint**: ${ciIntegration.kanbanLintPassed ? '✅ Passed' : '❌ Failed'}\n`;
  md += `- **GitHub Actions Workflow**: ${ciIntegration.workflowExists ? '✅ Exists' : '❌ Missing'}\n`;
  md += `- **Pre-commit Hook**: ${ciIntegration.preCommitHookExists ? '✅ Exists' : '❌ Missing'}\n\n`;
  
  if (ciIntegration.lintErrors.length > 0) {
    md += `### Lint Errors:\n\n`;
    ciIntegration.lintErrors.forEach(error => {
      md += `- ${error}\n`;
    });
    md += '\n';
  }
  
  // Policy compliance
  md += `## Policy Compliance (KS-005)\n\n`;
  md += policyCompliance.ks005Compliant ? '✅ **Compliant**' : '❌ **Non-Compliant**';
  md += '\n\n';
  
  if (policyCompliance.issues.length > 0) {
    md += `### Issues:\n\n`;
    policyCompliance.issues.forEach(issue => {
      md += `- ${issue}\n`;
    });
    md += '\n';
  }
  
  // Validation results
  const errors = report.results.filter(r => r.severity === 'error');
  const warnings = report.results.filter(r => r.severity === 'warning');
  
  if (errors.length > 0) {
    md += `## Errors (${errors.length})\n\n`;
    errors.forEach(result => {
      md += `### ${result.rule}\n`;
      md += `- **Entry**: ${result.entry?.taskId || 'Unknown'}\n`;
      md += `- **Message**: ${result.message}\n`;
      md += `- **Row**: ${result.entry?.rowIndex || 'Unknown'}\n\n`;
    });
  }
  
  if (warnings.length > 0) {
    md += `## Warnings (${warnings.length})\n\n`;
    warnings.forEach(result => {
      md += `### ${result.rule}\n`;
      md += `- **Entry**: ${result.entry?.taskId || 'Unknown'}\n`;
      md += `- **Message**: ${result.message}\n`;
      md += `- **Row**: ${result.entry?.rowIndex || 'Unknown'}\n\n`;
    });
  }
  
  return md;
}

/**
 * Main audit function
 */
async function runAudit(options: { inputFile: string; outputDir?: string }): Promise<AuditReport> {
  const inputFile = options.inputFile;
  
  if (!existsSync(inputFile)) {
    throw new Error(`Input file not found: ${inputFile}`);
  }
  
  const content = readFileSync(inputFile, 'utf-8');
  const entries = parseKanbanTable(content);
  const validationResults = validateEntries(entries);
  const report = generateAuditReport(entries, validationResults, content);
  
  // Save reports
  const outputDir = options.outputDir || 'test-results';
  const timestamp = new Date().toISOString().split('T')[0];
  
  // JSON report
  const jsonReportPath = join(outputDir, `coord-kanban-auto-audit-${timestamp}.json`);
  writeFileSync(jsonReportPath, JSON.stringify(report, null, 2), 'utf-8');
  
  // Markdown report
  const mdReportPath = join(outputDir, `coord-kanban-auto-audit-${timestamp}.md`);
  const mdReport = formatReportAsMarkdown(report);
  writeFileSync(mdReportPath, mdReport, 'utf-8');
  
  console.log(`✅ Audit completed successfully`);
  console.log(`📄 JSON report: ${jsonReportPath}`);
  console.log(`📝 Markdown report: ${mdReportPath}`);
  console.log(`📊 Summary: ${report.summary.valid} valid, ${report.summary.errors} errors, ${report.summary.warnings} warnings`);
  
  if (!report.policyCompliance.ks005Compliant) {
    console.log(`⚠️ Policy compliance issues detected: ${report.policyCompliance.issues.length}`);
  }
  
  return report;
}

// CLI setup
program
  .name('kanban-auto-audit')
  .description('Auto audit Kanban (agent_assignments.md) for compliance and evidence')
  .version('1.0.0');

program
  .command('run')
  .description('Run kanban audit')
  .option('-f, --file <path>', 'Input file path (default: src/docs/docs/coordinator/agent_assignments.md)', 'src/docs/docs/coordinator/agent_assignments.md')
  .option('-o, --output <path>', 'Output directory (default: test-results)', 'test-results')
  .action(async (options) => {
    try {
      await runAudit({
        inputFile: options.file,
        outputDir: options.output,
      });
    } catch (error) {
      console.error('❌ Audit failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate kanban and exit with error code if issues found')
  .option('-f, --file <path>', 'Input file path', 'src/docs/docs/coordinator/agent_assignments.md')
  .action(async (options) => {
    try {
      const report = await runAudit({
        inputFile: options.file,
      });
      
      // Exit with error code if there are errors
      if (report.summary.errors > 0) {
        console.error(`❌ Found ${report.summary.errors} errors`);
        process.exit(1);
      }
      
      if (report.summary.warnings > 0) {
        console.warn(`⚠️ Found ${report.summary.warnings} warnings`);
      }
      
      console.log('✅ Kanban validation passed');
    } catch (error) {
      console.error('❌ Validation failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Parse CLI arguments
if (import.meta.url) {
  // ES module environment
  program.parse();
}

export { runAudit, parseKanbanTable, validateEntries, generateAuditReport, type KanbanEntry, type AuditReport };
