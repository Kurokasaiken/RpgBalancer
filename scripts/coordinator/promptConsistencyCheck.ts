/**
 * Coordinator Prompt Consistency CLI
 * 
 * CLI tool for checking consistency between Kanban and docs.
 * Detects duplicate prompts, invalid states, missing KPIs, and reference issues.
 * 
 * @since 2026-01-20
 * @author Coordinator-Bot – Prompt QA
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { program } from 'commander';
import type {
  PromptEntryType,
  MarkdownDocumentType,
  ConsistencyResultType,
} from './promptConsistencySchema';
import { MarkdownPromptParser } from './markdownPromptParser';

/**
 * Consistency checker class
 */
class PromptConsistencyChecker {
  private parser = new MarkdownPromptParser();
  
  /**
   * Check for duplicate prompt IDs
   */
  private checkDuplicates(prompts: PromptEntryType[]): ConsistencyResultType['issues'] {
    const issues: ConsistencyResultType['issues'] = [];
    const seenIds = new Set<string>();
    
    for (const prompt of prompts) {
      if (seenIds.has(prompt.id)) {
        issues.push({
          type: 'duplicate',
          promptId: prompt.id,
          description: `Duplicate prompt ID found: ${prompt.id}`,
          severity: 'high',
          suggestion: 'Rename one of the duplicate prompts to use a unique ID',
        });
      } else {
        seenIds.add(prompt.id);
      }
    }
    
    return issues;
  }
  
  /**
   * Check for invalid states
   */
  private checkInvalidStates(prompts: PromptEntryType[]): ConsistencyResultType['issues'] {
    const issues: ConsistencyResultType['issues'] = [];
    const validStates = ['Non assegnato', 'In corso', 'Completato', 'Bloccato', 'Annullato', 'Sospeso'];
    
    for (const prompt of prompts) {
      if (!validStates.includes(prompt.state)) {
        issues.push({
          type: 'invalid_state',
          promptId: prompt.id,
          description: `Invalid state: ${prompt.state}`,
          severity: 'medium',
          suggestion: `Use one of: ${validStates.join(', ')}`,
        });
      }
    }
    
    return issues;
  }
  
  /**
   * Check for missing KPI requirements
   */
  private checkMissingKpis(prompts: PromptEntryType[]): ConsistencyResultType['issues'] {
    const issues: ConsistencyResultType['issues'] = [];
    
    for (const prompt of prompts) {
      if (!prompt.kpiRequirements || prompt.kpiRequirements.length === 0) {
        issues.push({
          type: 'missing_kpi',
          promptId: prompt.id,
          description: 'No KPI requirements defined',
          severity: 'medium',
          suggestion: 'Add KPI requirements to the prompt definition',
        });
      }
    }
    
    return issues;
  }
  
  /**
   * Check for missing references
   */
  private checkMissingReferences(prompts: PromptEntryType[]): ConsistencyResultType['issues'] {
    const issues: ConsistencyResultType['issues'] = [];
    const allIds = new Set(prompts.map(p => p.id));
    
    for (const prompt of prompts) {
      if (prompt.dependsOn) {
        for (const dep of prompt.dependsOn) {
          if (!allIds.has(dep)) {
            issues.push({
              type: 'missing_reference',
              promptId: prompt.id,
              description: `Missing dependency: ${dep}`,
              severity: 'high',
              suggestion: `Create prompt ${dep} or remove the dependency`,
            });
          }
        }
      }
    }
    
    return issues;
  }
  
  /**
   * Check for orphaned references
   */
  private checkOrphanedReferences(prompts: PromptEntryType[]): ConsistencyResultType['issues'] {
    const issues: ConsistencyResultType['issues'] = [];
    const allDeps = new Set<string>();
    
    // Collect all dependencies
    for (const prompt of prompts) {
      if (prompt.dependsOn) {
        for (const dep of prompt.dependsOn) {
          allDeps.add(dep);
        }
      }
    }
    
    // Check if any prompts are only referenced as dependencies
    for (const prompt of prompts) {
      if (allDeps.has(prompt.id) && prompt.state === 'Non assegnato') {
        issues.push({
          type: 'orphaned_reference',
          promptId: prompt.id,
          description: `Prompt exists but is only referenced as dependency and not assigned`,
          severity: 'low',
          suggestion: 'Assign the prompt or remove references to it',
        });
      }
    }
    
    return issues;
  }
  
  /**
   * Run full consistency check
   */
  async runCheck(documents: { [path: string]: MarkdownDocumentType }): Promise<ConsistencyResultType> {
    const allPrompts: PromptEntryType[] = [];
    
    // Collect all prompts from all documents
    for (const doc of Object.values(documents)) {
      allPrompts.push(...doc.prompts);
    }
    
    // Run all checks
    const issues = [
      ...this.checkDuplicates(allPrompts),
      ...this.checkInvalidStates(allPrompts),
      ...this.checkMissingKpis(allPrompts),
      ...this.checkMissingReferences(allPrompts),
      ...this.checkOrphanedReferences(allPrompts),
    ];
    
    // Calculate summary
    const summary = {
      duplicates: issues.filter(i => i.type === 'duplicate').length,
      invalidStates: issues.filter(i => i.type === 'invalid_state').length,
      missingKpis: issues.filter(i => i.type === 'missing_kpi').length,
      missingReferences: issues.filter(i => i.type === 'missing_reference').length,
      orphanedReferences: issues.filter(i => i.type === 'orphaned_reference').length,
    };
    
    // Emit telemetry if issues found
    if (issues.length > 0) {
      this.emitTelemetry(issues, summary);
    }
    
    return {
      timestamp: new Date().toISOString(),
      totalPrompts: allPrompts.length,
      issues,
      summary,
      exportFormat: 'json',
    };
  }
  
  /**
   * Emit telemetry for inconsistencies
   */
  private emitTelemetry(issues: ConsistencyResultType['issues'], summary: Record<string, number>): void {
    const telemetryEvent = new CustomEvent('coordinator_prompt_inconsistency_found', {
      detail: {
        timestamp: new Date().toISOString(),
        totalIssues: issues.length,
        issuesByType: summary,
        severityBreakdown: {
          critical: issues.filter(i => i.severity === 'critical').length,
          high: issues.filter(i => i.severity === 'high').length,
          medium: issues.filter(i => i.severity === 'medium').length,
          low: issues.filter(i => i.severity === 'low').length,
        },
      },
    });
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(telemetryEvent);
    } else {
      // Node.js environment - log to console
      console.log('Telemetry:', telemetryEvent.detail);
    }
  }
  
  /**
   * Export results to JSON
   */
  exportToJson(result: ConsistencyResultType): string {
    return JSON.stringify(result, null, 2);
  }
  
  /**
   * Export results to Markdown
   */
  exportToMarkdown(result: ConsistencyResultType): string {
    const lines: string[] = [];
    
    lines.push('# Prompt Consistency Check Results');
    lines.push('');
    lines.push(`**Timestamp:** ${result.timestamp}`);
    lines.push(`**Total Prompts:** ${result.totalPrompts}`);
    lines.push(`**Issues Found:** ${result.issues.length}`);
    lines.push('');
    
    // Summary table
    lines.push('## Summary');
    lines.push('');
    lines.push('| Issue Type | Count |');
    lines.push('|------------|-------|');
    lines.push(`| Duplicates | ${result.summary.duplicates} |`);
    lines.push(`| Invalid States | ${result.summary.invalidStates} |`);
    lines.push(`| Missing KPIs | ${result.summary.missingKpis} |`);
    lines.push(`| Missing References | ${result.summary.missingReferences} |`);
    lines.push(`| Orphaned References | ${result.summary.orphanedReferences} |`);
    lines.push('');
    
    // Issues details
    if (result.issues.length > 0) {
      lines.push('## Issues');
      lines.push('');
      
      // Group by severity
      const criticalIssues = result.issues.filter(i => i.severity === 'critical');
      const highIssues = result.issues.filter(i => i.severity === 'high');
      const mediumIssues = result.issues.filter(i => i.severity === 'medium');
      const lowIssues = result.issues.filter(i => i.severity === 'low');
      
      if (criticalIssues.length > 0) {
        lines.push('### Critical Issues');
        lines.push('');
        for (const issue of criticalIssues) {
          lines.push(`- **${issue.promptId}**: ${issue.description}`);
          if (issue.suggestion) {
            lines.push(`  - *Suggestion:* ${issue.suggestion}`);
          }
        }
        lines.push('');
      }
      
      if (highIssues.length > 0) {
        lines.push('### High Priority Issues');
        lines.push('');
        for (const issue of highIssues) {
          lines.push(`- **${issue.promptId}**: ${issue.description}`);
          if (issue.suggestion) {
            lines.push(`  - *Suggestion:* ${issue.suggestion}`);
          }
        }
        lines.push('');
      }
      
      if (mediumIssues.length > 0) {
        lines.push('### Medium Priority Issues');
        lines.push('');
        for (const issue of mediumIssues) {
          lines.push(`- **${issue.promptId}**: ${issue.description}`);
          if (issue.suggestion) {
            lines.push(`  - *Suggestion:* ${issue.suggestion}`);
          }
        }
        lines.push('');
      }
      
      if (lowIssues.length > 0) {
        lines.push('### Low Priority Issues');
        lines.push('');
        for (const issue of lowIssues) {
          lines.push(`- **${issue.promptId}**: ${issue.description}`);
          if (issue.suggestion) {
            lines.push(`  - *Suggestion:* ${issue.suggestion}`);
          }
        }
        lines.push('');
      }
    } else {
      lines.push('✅ No issues found!');
      lines.push('');
    }
    
    return lines.join('\n');
  }
  
  /**
   * Export results to CSV
   */
  exportToCsv(result: ConsistencyResultType): string {
    const lines: string[] = [];
    
    // CSV header
    lines.push('Type,Prompt ID,Description,Severity,Suggestion');
    
    // CSV rows
    for (const issue of result.issues) {
      const row = [
        issue.type,
        issue.promptId,
        `"${issue.description.replace(/"/g, '""')}"`,
        issue.severity,
        `"${(issue.suggestion || '').replace(/"/g, '""')}"`,
      ];
      lines.push(row.join(','));
    }
    
    return lines.join('\n');
  }
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  program
    .name('prompt-consistency-check')
    .description('CLI tool for checking prompt consistency in Kanban documents')
    .version('1.0.0')
    .option('-i, --input <file>', 'Input file path (default: agent_assignments.md)')
    .option('-o, --output <file>', 'Output file path')
    .option('-f, --format <format>', 'Output format (json|markdown|csv)', 'json')
    .option('-v, --verbose', 'Verbose output')
    .option('--fix-mode', 'Enable fix mode (not implemented)')
    .option('--no-suggestions', 'Disable suggestions in output')
    .parse();
  
  const options = program.opts();
  
  // Set default input file
  const inputFile = options.input || 'src/docs/docs/coordinator/agent_assignments.md';
  
  if (!existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    process.exit(1);
  }
  
  try {
    // Read and parse input file
    const content = readFileSync(inputFile, 'utf-8');
    const parser = new MarkdownPromptParser();
    const documents = await parser.parseDocuments({ [inputFile]: content });
    
    // Run consistency check
    const checker = new PromptConsistencyChecker();
    const result = await checker.runCheck(documents);
    
    // Set export format
    result.exportFormat = options.format;
    
    // Generate output
    let output: string;
    switch (options.format) {
      case 'markdown':
        output = checker.exportToMarkdown(result);
        break;
      case 'csv':
        output = checker.exportToCsv(result);
        break;
      case 'json':
      default:
        output = checker.exportToJson(result);
        break;
    }
    
    // Write output to file or console
    if (options.output) {
      writeFileSync(options.output, output, 'utf-8');
      console.log(`Results written to: ${options.output}`);
    } else {
      console.log(output);
    }
    
    // Verbose output
    if (options.verbose) {
      console.error(`\\nProcessed ${result.totalPrompts} prompts`);
      console.error(`Found ${result.issues.length} issues`);
      console.error(`Exit code: ${result.issues.length > 0 ? 1 : 0}`);
    }
    
    // Set exit code based on issues found
    process.exit(result.issues.length > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(2);
  }
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('promptConsistencyCheck.ts')) {
  main().catch(console.error);
}

export { PromptConsistencyChecker };
