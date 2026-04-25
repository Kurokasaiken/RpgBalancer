/**
 * Safeguard Debt Scanner
 * 
 * Scans completed prompts from the last 14 days to identify safeguard debt
 * (lint, test, build warnings/errors) and generates remediation reports.
 * 
 * @module safeguardDebtScanner
 * @since 2026-01-14
 * @author Orion-Coord
 */

import { readFileSync, existsSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';
import { program } from 'commander';

/**
 * Safeguard debt entry for a completed prompt
 */
interface SafeguardDebtEntry {
  /** Prompt ID */
  promptId: string;
  /** Prompt name/title */
  promptName: string;
  /** Completion date */
  completionDate: string;
  /** Evidence log file */
  evidenceFile: string;
  /** Lint status and issues */
  lint: {
    passed: boolean;
    errors: number;
    warnings: number;
    issues: string[];
  };
  /** Test status and issues */
  test: {
    passed: boolean;
    failures: number;
    issues: string[];
  };
  /** Build status and issues */
  build: {
    passed: boolean;
    errors: number;
    issues: string[];
  };
  /** Kanban lint status */
  kanban: {
    passed: boolean;
    issues: string[];
  };
  /** Overall debt score */
  debtScore: number;
  /** Remediation priority */
  priority: 'high' | 'medium' | 'low';
}

/**
 * Scanner configuration
 */
interface ScannerConfig {
  /** Days to look back for completed prompts */
  lookbackDays: number;
  /** Test results directory */
  testResultsDir: string;
  /** Agent assignments file */
  agentAssignmentsFile: string;
  /** Minimum debt score to include in report */
  minDebtScore: number;
}

/**
 * Default scanner configuration
 */
const DEFAULT_CONFIG: ScannerConfig = {
  lookbackDays: 14,
  testResultsDir: 'test-results',
  agentAssignmentsFile: 'src/docs/docs/coordinator/agent_assignments.md',
  minDebtScore: 1
};

/**
 * Parse kanban entries from agent_assignments.md
 */
function parseKanbanEntries(content: string): Array<{
  promptId: string;
  promptName: string;
  status: string;
  completionDate?: string;
  evidence?: string;
}> {
  const entries: Array<{
    promptId: string;
    promptName: string;
    status: string;
    completionDate?: string;
    evidence?: string;
  }> = [];
  
  const lines = content.split('\n');
  let inTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect table start
    if (line.includes('|') && line.includes('Task ID') && line.includes('Status')) {
      inTable = true;
      continue;
    }
    
    // Detect table end
    if (inTable && (!line.includes('|') || line === '')) {
      inTable = false;
      continue;
    }
    
    // Parse table rows
    if (inTable && line.includes('|')) {
      const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
      
      if (cells.length >= 12) {
        const [taskId, status, _phase, _agent, _startDate, endDate, __, ___, ____, _____, ______, evidence] = cells;
        
        // Extract prompt ID and name
        const promptId = taskId.split(' ')[0] || taskId;
        const promptName = taskId.replace(promptId, '').trim() || taskId;
        
        entries.push({
          promptId,
          promptName,
          status,
          completionDate: endDate && endDate !== '-' ? endDate : undefined,
          evidence: evidence && evidence !== '-' ? evidence : undefined
        });
      }
    }
  }
  
  return entries;
}

/**
 * Get completed prompts within lookback period
 */
function getCompletedPrompts(config: ScannerConfig): Array<{
  promptId: string;
  promptName: string;
  completionDate: string;
  evidence?: string;
}> {
  const content = readFileSync(config.agentAssignmentsFile, 'utf-8');
  const entries = parseKanbanEntries(content);
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - config.lookbackDays);
  
  return entries
    .filter(entry => entry.status === 'Completato' && entry.completionDate)
    .filter(entry => {
      const completionDate = new Date(entry.completionDate!);
      return completionDate >= cutoffDate;
    })
    .map(entry => ({
      promptId: entry.promptId,
      promptName: entry.promptName,
      completionDate: entry.completionDate!,
      evidence: entry.evidence
    }));
}

/**
 * Parse safeguard results from evidence log content
 */
function parseSafeguardResults(content: string): {
  lint: SafeguardDebtEntry['lint'];
  test: SafeguardDebtEntry['test'];
  build: SafeguardDebtEntry['build'];
  kanban: SafeguardDebtEntry['kanban'];
} {
  const lint: SafeguardDebtEntry['lint'] = { passed: true, errors: 0, warnings: 0, issues: [] };
  const test: SafeguardDebtEntry['test'] = { passed: true, failures: 0, issues: [] };
  const build: SafeguardDebtEntry['build'] = { passed: true, errors: 0, issues: [] };
  const kanban: SafeguardDebtEntry['kanban'] = { passed: true, issues: [] };
  
  const lines = content.split('\n');
  
  for (const line of lines) {
    // Parse lint results
    if (line.includes('✅') || line.includes('❌')) {
      if (line.includes('lint')) {
        lint.passed = line.includes('✅');
        if (line.includes('error')) {
          const match = line.match(/(\d+)\s+error/);
          if (match) lint.errors = parseInt(match[1]);
        }
        if (line.includes('warning')) {
          const match = line.match(/(\d+)\s+warning/);
          if (match) lint.warnings = parseInt(match[1]);
        }
      }
      if (line.includes('test')) {
        test.passed = line.includes('✅');
        if (line.includes('failing') || line.includes('failed')) {
          const match = line.match(/(\d+)\s+failing|failed/);
          if (match) test.failures = parseInt(match[1]);
        }
      }
      if (line.includes('build')) {
        build.passed = line.includes('✅');
        if (line.includes('error')) {
          const match = line.match(/(\d+)\s+error/);
          if (match) build.errors = parseInt(match[1]);
        }
      }
      if (line.includes('kanban')) {
        kanban.passed = line.includes('✅');
      }
    }
    
    // Collect specific issues
    if (line.includes('error:') || line.includes('warning:') || line.includes('failed')) {
      const issue = line.trim();
      if (issue.includes('lint')) lint.issues.push(issue);
      else if (issue.includes('test')) test.issues.push(issue);
      else if (issue.includes('build')) build.issues.push(issue);
      else if (issue.includes('kanban')) kanban.issues.push(issue);
    }
  }
  
  return { lint, test, build, kanban };
}

/**
 * Calculate debt score for a prompt
 */
function calculateDebtScore(entry: SafeguardDebtEntry): number {
  let score = 0;
  
  // Lint issues
  score += entry.lint.errors * 3;
  score += entry.lint.warnings;
  
  // Test issues
  score += entry.test.failures * 2;
  
  // Build issues
  score += entry.build.errors * 4;
  
  // Kanban issues
  score += entry.kanban.issues.length;
  
  return score;
}

/**
 * Determine remediation priority
 */
function getPriority(debtScore: number): 'high' | 'medium' | 'low' {
  if (debtScore >= 10) return 'high';
  if (debtScore >= 5) return 'medium';
  return 'low';
}

/**
 * Find evidence file for a prompt
 */
function findEvidenceFile(promptId: string, config: ScannerConfig): string | null {
  if (!existsSync(config.testResultsDir)) return null;
  
  const files = readdirSync(config.testResultsDir);
  
  // Look for files containing the prompt ID
  const matchingFiles = files.filter(file => 
    file.toLowerCase().includes(promptId.toLowerCase()) && 
    (file.endsWith('.log') || file.endsWith('.md'))
  );
  
  // Return the most recent matching file
  if (matchingFiles.length > 0) {
    return matchingFiles
      .map(file => ({
        file,
        mtime: statSync(join(config.testResultsDir, file)).mtime
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())[0].file;
  }
  
  return null;
}

/**
 * Scan a single prompt for safeguard debt
 */
function scanPrompt(promptId: string, promptName: string, completionDate: string, config: ScannerConfig): SafeguardDebtEntry | null {
  const evidenceFile = findEvidenceFile(promptId, config);
  
  if (!evidenceFile) {
    // No evidence file found - create entry with unknown status
    return {
      promptId,
      promptName,
      completionDate,
      evidenceFile: 'Not found',
      lint: { passed: false, errors: 0, warnings: 0, issues: ['No evidence file found'] },
      test: { passed: false, failures: 0, issues: ['No evidence file found'] },
      build: { passed: false, errors: 0, issues: ['No evidence file found'] },
      kanban: { passed: false, issues: ['No evidence file found'] },
      debtScore: 5,
      priority: 'medium'
    };
  }
  
  try {
    const evidencePath = join(config.testResultsDir, evidenceFile);
    const content = readFileSync(evidencePath, 'utf-8');
    const safeguardResults = parseSafeguardResults(content);
    
    const entry: SafeguardDebtEntry = {
      promptId,
      promptName,
      completionDate,
      evidenceFile,
      ...safeguardResults,
      debtScore: 0,
      priority: 'low'
    };
    
    entry.debtScore = calculateDebtScore(entry);
    entry.priority = getPriority(entry.debtScore);
    
    return entry;
  } catch (_error) {
    return {
      promptId,
      promptName,
      completionDate,
      evidenceFile,
      lint: { passed: false, errors: 0, warnings: 0, issues: ['Failed to parse evidence file'] },
      test: { passed: false, failures: 0, issues: ['Failed to parse evidence file'] },
      build: { passed: false, errors: 0, issues: ['Failed to parse evidence file'] },
      kanban: { passed: false, issues: ['Failed to parse evidence file'] },
      debtScore: 3,
      priority: 'medium'
    };
  }
}

/**
 * Run safeguard debt scan
 */
function runScan(config: ScannerConfig): SafeguardDebtEntry[] {
  console.log(`🔍 Scanning safeguard debt for completed prompts (last ${config.lookbackDays} days)...\n`);
  
  const completedPrompts = getCompletedPrompts(config);
  console.log(`Found ${completedPrompts.length} completed prompts in lookback period\n`);
  
  const entries: SafeguardDebtEntry[] = [];
  
  for (const prompt of completedPrompts) {
    const entry = scanPrompt(prompt.promptId, prompt.promptName, prompt.completionDate, config);
    if (entry && entry.debtScore >= config.minDebtScore) {
      entries.push(entry);
      console.log(`📋 ${entry.promptId}: ${entry.debtScore} debt points (${entry.priority} priority)`);
    }
  }
  
  // Sort by debt score (highest first)
  entries.sort((a, b) => b.debtScore - a.debtScore);
  
  return entries;
}

/**
 * Generate scan report
 */
function generateReport(entries: SafeguardDebtEntry[]): string {
  const totalDebt = entries.reduce((sum, entry) => sum + entry.debtScore, 0);
  const highPriority = entries.filter(e => e.priority === 'high').length;
  const mediumPriority = entries.filter(e => e.priority === 'medium').length;
  const lowPriority = entries.filter(e => e.priority === 'low').length;
  
  let report = `# Safeguard Debt Scan Report\n\n`;
  report += `**Generated**: ${new Date().toISOString()}\n`;
  report += `**Total Entries**: ${entries.length}\n`;
  report += `**Total Debt Score**: ${totalDebt}\n`;
  report += `**High Priority**: ${highPriority}\n`;
  report += `**Medium Priority**: ${mediumPriority}\n`;
  report += `**Low Priority**: ${lowPriority}\n\n`;
  
  // Summary by category
  report += `## Summary by Category\n\n`;
  
  const lintIssues = entries.reduce((sum, e) => sum + e.lint.errors + e.lint.warnings, 0);
  const testIssues = entries.reduce((sum, e) => sum + e.test.failures, 0);
  const buildIssues = entries.reduce((sum, e) => sum + e.build.errors, 0);
  const kanbanIssues = entries.reduce((sum, e) => sum + e.kanban.issues.length, 0);
  
  report += `- **Lint Issues**: ${lintIssues} (${entries.filter(e => !e.lint.passed).length} prompts)\n`;
  report += `- **Test Issues**: ${testIssues} (${entries.filter(e => !e.test.passed).length} prompts)\n`;
  report += `- **Build Issues**: ${buildIssues} (${entries.filter(e => !e.build.passed).length} prompts)\n`;
  report += `- **Kanban Issues**: ${kanbanIssues} (${entries.filter(e => !e.kanban.passed).length} prompts)\n\n`;
  
  // Detailed entries
  report += `## Detailed Entries\n\n`;
  
  for (const entry of entries) {
    report += `### ${entry.promptId} (${entry.priority} priority)\n\n`;
    report += `**Name**: ${entry.promptName}\n`;
    report += `**Completion Date**: ${entry.completionDate}\n`;
    report += `**Evidence File**: ${entry.evidenceFile}\n`;
    report += `**Debt Score**: ${entry.debtScore}\n\n`;
    
    report += `#### Safeguard Results\n\n`;
    report += `- **Lint**: ${entry.lint.passed ? '✅' : '❌'} (${entry.lint.errors} errors, ${entry.lint.warnings} warnings)\n`;
    report += `- **Test**: ${entry.test.passed ? '✅' : '❌'} (${entry.test.failures} failures)\n`;
    report += `- **Build**: ${entry.build.passed ? '✅' : '❌'} (${entry.build.errors} errors)\n`;
    report += `- **Kanban**: ${entry.kanban.passed ? '✅' : '❌'}\n\n`;
    
    // Show issues if any
    const allIssues = [
      ...entry.lint.issues.map(i => `Lint: ${i}`),
      ...entry.test.issues.map(i => `Test: ${i}`),
      ...entry.build.issues.map(i => `Build: ${i}`),
      ...entry.kanban.issues.map(i => `Kanban: ${i}`)
    ];
    
    if (allIssues.length > 0) {
      report += `#### Issues\n\n`;
      allIssues.forEach(issue => {
        report += `- ${issue}\n`;
      });
      report += '\n';
    }
    
    report += '---\n\n';
  }
  
  // Recommendations
  report += `## Recommendations\n\n`;
  
  if (highPriority > 0) {
    report += `### High Priority (${highPriority} prompts)\n`;
    report += `Address these immediately as they have significant safeguard debt.\n\n`;
  }
  
  if (mediumPriority > 0) {
    report += `### Medium Priority (${mediumPriority} prompts)\n`;
    report += `Address these in the next cleanup cycle.\n\n`;
  }
  
  if (lowPriority > 0) {
    report += `### Low Priority (${lowPriority} prompts)\n`;
    report += `Address these during regular maintenance.\n\n`;
  }
  
  report += `### Automated Fix Suggestions\n\n`;
  report += `- Run \`npx tsx scripts/coord/safeguardDebtFixer.ts\` to attempt automated fixes\n`;
  report += `- Focus on lint warnings first (usually easiest to fix)\n`;
  report += `- Review build errors for missing dependencies or configuration issues\n`;
  report += `- Check test failures for missing test files or broken imports\n\n`;
  
  return report;
}

/**
 * Setup CLI program
 */
function setupCLI(): void {
  program
    .name('safeguard-debt-scanner')
    .description('Scan completed prompts for safeguard debt')
    .version('1.0.0');

  program
    .command('scan')
    .description('Run safeguard debt scan')
    .option('-d, --days <number>', 'Lookback period in days', '14')
    .option('-o, --output <path>', 'Output directory for reports', 'test-results')
    .option('--min-score <number>', 'Minimum debt score to include', '1')
    .option('--json', 'Output JSON instead of markdown')
    .action((options) => {
      const config: ScannerConfig = {
        ...DEFAULT_CONFIG,
        lookbackDays: parseInt(options.days),
        minDebtScore: parseInt(options.minScore)
      };
      
      const entries = runScan(config);
      
      if (options.json) {
        console.log(JSON.stringify(entries, null, 2));
      } else {
        const report = generateReport(entries);
        const timestamp = new Date().toISOString().split('T')[0];
        const reportPath = join(options.output, `safeguard-debt-scan-${timestamp}.md`);
        
        writeFileSync(reportPath, report, 'utf-8');
        console.log(`\n📄 Report saved: ${reportPath}`);
        console.log(`\n📊 Summary: ${entries.length} prompts with safeguard debt`);
      }
    });

  program
    .command('list')
    .description('List completed prompts in lookback period')
    .option('-d, --days <number>', 'Lookback period in days', '14')
    .action((options) => {
      const config: ScannerConfig = {
        ...DEFAULT_CONFIG,
        lookbackDays: parseInt(options.days)
      };
      
      const prompts = getCompletedPrompts(config);
      
      console.log(`\n📋 Completed prompts (last ${options.days} days):\n`);
      prompts.forEach(prompt => {
        console.log(`- ${prompt.promptId}: ${prompt.promptName} (${prompt.completionDate})`);
      });
      
      console.log(`\nTotal: ${prompts.length} prompts\n`);
    });
}

// Run CLI if called directly
if (require.main === module) {
  setupCLI();
  program.parse();
}

export {
  runScan,
  generateReport,
  getCompletedPrompts,
  scanPrompt,
  parseKanbanEntries,
  calculateDebtScore,
  getPriority,
  parseSafeguardResults,
  type SafeguardDebtEntry,
  type ScannerConfig
};
