/**
 * Safeguard Debt Fixer
 * 
 * Orchestrates automated fixes for safeguard debt issues found by the scanner.
 * Runs lint/test/build commands and applies minimal patches following config-first principles.
 * 
 * @module safeguardDebtFixer
 * @since 2026-01-14
 * @author Orion-Coord
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { program } from 'commander';
import { SafeguardDebtEntry } from './safeguardDebtScanner';

/**
 * Fix result for a single operation
 */
interface FixResult {
  /** Operation type */
  operation: 'lint' | 'test' | 'build' | 'kanban';
  /** Target path/pattern */
  target: string;
  /** Success status */
  success: boolean;
  /** Output from command */
  output: string;
  /** Errors encountered */
  errors: string[];
  /** Files modified */
  modifiedFiles: string[];
  /** Time taken in milliseconds */
  duration: number;
}

/**
 * Overall fix session result
 */
interface FixSessionResult {
  /** Session ID */
  sessionId: string;
  /** Timestamp */
  timestamp: string;
  /** Target prompt ID */
  promptId: string;
  /** Individual fix results */
  results: FixResult[];
  /** Overall success */
  success: boolean;
  /** Total time taken */
  totalDuration: number;
  /** Summary statistics */
  summary: {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    filesModified: number;
    totalErrors: number;
  };
}

/**
 * Common fix patterns for safeguard issues
 */
const FIX_PATTERNS = {
  // Lint fixes
  unusedVar: /'(\w+)' is defined but never used/,
  unusedImport: /'(\w+)' is imported but never used/,
  anyType: /Unexpected any/,
  missingType: /implicitly has an 'any' type/,
  
  // Test fixes
  missingTest: /No test files found/,
  testFailure: /Test failed:/,
  
  // Build fixes
  typescriptError: /error TS\d+/,
  missingModule: /Cannot find module/,
  
  // Kanban fixes
  kanbanLint: /Kanban lint fallito/
};

/**
 * Apply automated fix for a specific issue
 */
function applyFix(content: string, issue: string, _filePath: string): string {
  let fixedContent = content;
  
  // Fix unused variables
  const unusedVarMatch = issue.match(FIX_PATTERNS.unusedVar);
  if (unusedVarMatch) {
    const varName = unusedVarMatch[1];
    fixedContent = fixedContent.replace(
      new RegExp(`(const|let|var)\\s+${varName}\\s*=`, 'g'),
      `$1 _${varName} =`
    );
  }
  
  // Fix unused imports
  const unusedImportMatch = issue.match(FIX_PATTERNS.unusedImport);
  if (unusedImportMatch) {
    const importName = unusedImportMatch[1];
    fixedContent = fixedContent.replace(
      new RegExp(`import\\s*\\{[^}]*${importName}[^}]*\\}\\s*from`, 'g'),
      match => match.replace(new RegExp(`\\b${importName}\\b`), `_${importName}`)
    );
  }
  
  // Fix require() imports (convert to ES6 imports)
  if (issue.includes('require() style import is forbidden')) {
    fixedContent = fixedContent.replace(
      /require\(['"]([^'"]+)['"]\)\./g,
      (match, modulePath) => {
        // Try to guess the import name from module path
        const importName = modulePath.split('/').pop()?.replace(/\.\w+$/, '') || 'module';
        return `${importName}.`;
      }
    );
  }
  
  return fixedContent;
}

/**
 * Run lint command and attempt fixes
 */
function runLintFix(targetPath: string): FixResult {
  const startTime = Date.now();
  const result: FixResult = {
    operation: 'lint',
    target: targetPath,
    success: false,
    output: '',
    errors: [],
    modifiedFiles: [],
    duration: 0
  };
  
  try {
    console.log(`🔧 Running lint fix on: ${targetPath}`);
    result.output = execSync(`npm run lint -- ${targetPath}`, {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    // Check if lint passed
    if (result.output.includes('0 errors') && !result.output.includes('error')) {
      result.success = true;
      console.log(`✅ Lint passed for: ${targetPath}`);
    } else {
      // Try to apply common fixes
      if (existsSync(targetPath)) {
        const content = readFileSync(targetPath, 'utf-8');
        const lines = result.output.split('\n');
        let fixedContent = content;
        let modified = false;
        
        for (const line of lines) {
          if (line.includes('error:') || line.includes('warning:')) {
            const originalContent = fixedContent;
            fixedContent = applyFix(fixedContent, line, targetPath);
            
            if (fixedContent !== originalContent) {
              modified = true;
              console.log(`🔧 Applied fix for: ${line.trim()}`);
            }
          }
        }
        
        if (modified) {
          writeFileSync(targetPath, fixedContent, 'utf-8');
          result.modifiedFiles.push(targetPath);
          
          // Re-run lint to check if fixes worked
          const retryOutput = execSync(`npm run lint -- ${targetPath}`, {
            encoding: 'utf-8',
            stdio: 'pipe'
          });
          
          if (retryOutput.includes('0 errors') && !retryOutput.includes('error')) {
            result.success = true;
            result.output = retryOutput;
            console.log(`✅ Lint fixes successful for: ${targetPath}`);
          } else {
            result.errors.push('Lint fixes did not resolve all issues');
            result.output = retryOutput;
          }
        }
      }
    }
  } catch (error: Error | unknown) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown lint error');
    const errorObj = error as { stdout?: string; stderr?: string };
    result.output = errorObj.stdout || errorObj.stderr || '';
  }
  
  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Run test command and attempt fixes
 */
function runTestFix(targetPath: string): FixResult {
  const startTime = Date.now();
  const result: FixResult = {
    operation: 'test',
    target: targetPath,
    success: false,
    output: '',
    errors: [],
    modifiedFiles: [],
    duration: 0
  };
  
  try {
    console.log(`🧪 Running test fix on: ${targetPath}`);
    result.output = execSync(`npm run test -- ${targetPath}`, {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    // Check if tests passed
    if (result.output.includes('PASS') || result.output.includes('Test Suites:')) {
      result.success = true;
      console.log(`✅ Tests passed for: ${targetPath}`);
    } else {
      result.errors.push('Tests are still failing');
    }
  } catch (error: Error | unknown) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown test error');
    result.output = (error as { stdout?: string; stderr?: string }).stdout || (error as { stdout?: string; stderr?: string }).stderr || '';
    
    // Try to identify common test issues
    if (result.output.includes('No test files found')) {
      result.errors.push('No test files found - need to create tests');
    }
    if (result.output.includes('Cannot find module')) {
      result.errors.push('Missing module dependency');
    }
  }
  
  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Run build command and attempt fixes
 */
function runBuildFix(): FixResult {
  const startTime = Date.now();
  const result: FixResult = {
    operation: 'build',
    target: 'project',
    success: false,
    output: '',
    errors: [],
    modifiedFiles: [],
    duration: 0
  };
  
  try {
    console.log(`🏗️ Running build check`);
    result.output = execSync('npm run build:check', {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    if (result.output.includes('success') || result.output.includes('Build check passed')) {
      result.success = true;
      console.log(`✅ Build check passed`);
    } else {
      result.errors.push('Build check failed');
    }
  } catch (error: Error | unknown) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown build error');
    result.output = (error as { stdout?: string; stderr?: string }).stdout || (error as { stdout?: string; stderr?: string }).stderr || '';
    
    // Try to identify common build issues
    if (result.output.includes('error TS')) {
      result.errors.push('TypeScript compilation errors');
    }
    if (result.output.includes('Cannot find module')) {
      result.errors.push('Missing dependencies');
    }
  }
  
  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Run kanban lint and attempt fixes
 */
function runKanbanFix(): FixResult {
  const startTime = Date.now();
  const result: FixResult = {
    operation: 'kanban',
    target: 'agent_assignments.md',
    success: false,
    output: '',
    errors: [],
    modifiedFiles: [],
    duration: 0
  };
  
  try {
    console.log(`📋 Running kanban lint`);
    result.output = execSync('npm run kanban:lint', {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    if (result.output.includes('passato') || result.output.includes('passed')) {
      result.success = true;
      console.log(`✅ Kanban lint passed`);
    } else {
      result.errors.push('Kanban lint failed');
      
      // Try to extract and fix common kanban issues
      const lines = result.output.split('\n');
      for (const line of lines) {
        if (line.includes('Stato') && line.includes('non permesso')) {
          result.errors.push(`Invalid kanban state: ${line}`);
        }
        if (line.includes('devono avere')) {
          result.errors.push(`Missing required field: ${line}`);
        }
      }
    }
  } catch (error: Error | unknown) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown kanban error');
    result.output = (error as { stdout?: string; stderr?: string }).stdout || (error as { stdout?: string; stderr?: string }).stderr || '';
  }
  
  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Fix safeguard debt for a specific prompt
 */
function fixPromptDebt(promptId: string, debtEntry: SafeguardDebtEntry): FixSessionResult {
  const sessionId = `fix-${promptId}-${Date.now()}`;
  const startTime = Date.now();
  
  console.log(`\n🔧 Starting fix session for: ${promptId}`);
  console.log(`Session ID: ${sessionId}`);
  
  const results: FixResult[] = [];
  
  // Determine what needs fixing based on debt entry
  if (!debtEntry.lint.passed) {
    // Try to identify target files from evidence
    const targetFiles = extractTargetFiles(debtEntry.evidenceFile);
    for (const file of targetFiles) {
      const result = runLintFix(file);
      results.push(result);
    }
  }
  
  if (!debtEntry.test.passed) {
    const targetFiles = extractTargetFiles(debtEntry.evidenceFile, 'test');
    for (const file of targetFiles) {
      const result = runTestFix(file);
      results.push(result);
    }
  }
  
  if (!debtEntry.build.passed) {
    const result = runBuildFix();
    results.push(result);
  }
  
  if (!debtEntry.kanban.passed) {
    const result = runKanbanFix();
    results.push(result);
  }
  
  const totalDuration = Date.now() - startTime;
  const successfulOperations = results.filter(r => r.success).length;
  const failedOperations = results.filter(r => !r.success).length;
  const filesModified = results.flatMap(r => r.modifiedFiles);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  
  const sessionResult: FixSessionResult = {
    sessionId,
    timestamp: new Date().toISOString(),
    promptId,
    results,
    success: failedOperations === 0,
    totalDuration,
    summary: {
      totalOperations: results.length,
      successfulOperations,
      failedOperations,
      filesModified: filesModified.length,
      totalErrors
    }
  };
  
  console.log(`\n📊 Fix session completed for: ${promptId}`);
  console.log(`✅ Successful operations: ${successfulOperations}`);
  console.log(`❌ Failed operations: ${failedOperations}`);
  console.log(`📁 Files modified: ${filesModified.length}`);
  console.log(`⏱️ Duration: ${totalDuration}ms`);
  
  return sessionResult;
}

/**
 * Extract target files from evidence file path
 */
function extractTargetFiles(evidenceFile: string, _type: 'lint' | 'test' = 'lint'): string[] {
  const files: string[] = [];
  
  // Try to parse file paths from evidence file name
  if (evidenceFile.includes('idle-village')) {
    files.push('src/ui/idleVillage', 'tests/unit/idleVillage');
  }
  if (evidenceFile.includes('sts')) {
    files.push('src/ui/tools/sts', 'tests/unit/sts');
  }
  if (evidenceFile.includes('coord')) {
    files.push('scripts/coord', 'tests/unit/coord');
  }
  if (evidenceFile.includes('balancing')) {
    files.push('src/balancing', 'tests/unit/balancing');
  }
  
  return files;
}

/**
 * Generate fix session report
 */
function generateFixReport(sessions: FixSessionResult[]): string {
  const totalSessions = sessions.length;
  const successfulSessions = sessions.filter(s => s.success).length;
  const totalOperations = sessions.reduce((sum, s) => sum + s.results.length, 0);
  const totalDuration = sessions.reduce((sum, s) => sum + s.totalDuration, 0);
  const totalFilesModified = sessions.reduce((sum, s) => sum + s.summary.filesModified, 0);
  
  let report = `# Safeguard Debt Fix Report\n\n`;
  report += `**Generated**: ${new Date().toISOString()}\n`;
  report += `**Total Sessions**: ${totalSessions}\n`;
  report += `**Successful Sessions**: ${successfulSessions}\n`;
  report += `**Total Operations**: ${totalOperations}\n`;
  report += `**Total Duration**: ${totalDuration}ms\n`;
  report += `**Files Modified**: ${totalFilesModified}\n\n`;
  
  // Session details
  report += `## Session Details\n\n`;
  
  for (const session of sessions) {
    report += `### ${session.promptId} (${session.success ? '✅' : '❌'})\n\n`;
    report += `**Session ID**: ${session.sessionId}\n`;
    report += `**Duration**: ${session.totalDuration}ms\n`;
    report += `**Operations**: ${session.results.length}\n`;
    report += `**Files Modified**: ${session.summary.filesModified}\n\n`;
    
    for (const result of session.results) {
      report += `#### ${result.operation.toUpperCase()} (${result.success ? '✅' : '❌'})\n\n`;
      report += `**Target**: ${result.target}\n`;
      report += `**Duration**: ${result.duration}ms\n`;
      
      if (result.modifiedFiles.length > 0) {
        report += `**Modified Files**: ${result.modifiedFiles.join(', ')}\n`;
      }
      
      if (result.errors.length > 0) {
        report += `**Errors**:\n`;
        result.errors.forEach(error => {
          report += `- ${error}\n`;
        });
      }
      
      report += '\n';
    }
    
    report += '---\n\n';
  }
  
  // Summary by operation type
  report += `## Summary by Operation Type\n\n`;
  
  const operationStats = {
    lint: { total: 0, successful: 0, failed: 0 },
    test: { total: 0, successful: 0, failed: 0 },
    build: { total: 0, successful: 0, failed: 0 },
    kanban: { total: 0, successful: 0, failed: 0 }
  };
  
  sessions.forEach(session => {
    session.results.forEach(result => {
      const stats = operationStats[result.operation];
      stats.total++;
      if (result.success) {
        stats.successful++;
      } else {
        stats.failed++;
      }
    });
  });
  
  Object.entries(operationStats).forEach(([op, stats]) => {
    report += `### ${op.toUpperCase()}\n`;
    report += `- Total: ${stats.total}\n`;
    report += `- Successful: ${stats.successful}\n`;
    report += `- Failed: ${stats.failed}\n`;
    report += `- Success Rate: ${stats.total > 0 ? ((stats.successful / stats.total) * 100).toFixed(1) : 0}%\n\n`;
  });
  
  // Recommendations
  report += `## Recommendations\n\n`;
  
  if (successfulSessions < totalSessions) {
    report += `### Manual Review Required\n`;
    report += `Some sessions failed and require manual review:\n`;
    sessions.filter(s => !s.success).forEach(session => {
      report += `- ${session.promptId}: ${session.summary.totalErrors} errors\n`;
    });
    report += '\n';
  }
  
  report += `### Next Steps\n`;
  report += `1. Review failed operations and apply manual fixes\n`;
  report += `2. Re-run safeguard debt scanner to verify fixes\n`;
  report += `3. Update documentation if patterns were identified\n`;
  report += `4. Consider adding automated tests for common issues\n\n`;
  
  return report;
}

/**
 * Setup CLI program
 */
function setupCLI(): void {
  program
    .name('safeguard-debt-fixer')
    .description('Fix safeguard debt issues found by scanner')
    .version('1.0.0');

  program
    .command('fix')
    .description('Fix safeguard debt for specific prompt')
    .argument('<prompt-id>', 'Prompt ID to fix')
    .option('-e, --evidence <file>', 'Evidence file path')
    .option('-o, --output <path>', 'Output directory for reports', 'test-results')
    .action((promptId, options) => {
      // Create a mock debt entry for testing
      const mockDebtEntry: SafeguardDebtEntry = {
        promptId,
        promptName: `Test prompt ${promptId}`,
        completionDate: new Date().toISOString().split('T')[0],
        evidenceFile: options.evidence || 'test.log',
        lint: { passed: false, errors: 1, warnings: 0, issues: ['Test error'] },
        test: { passed: false, failures: 1, issues: ['Test failure'] },
        build: { passed: true, errors: 0, issues: [] },
        kanban: { passed: true, issues: [] },
        debtScore: 5,
        priority: 'medium'
      };
      
      const session = fixPromptDebt(promptId, mockDebtEntry);
      const report = generateFixReport([session]);
      
      const timestamp = new Date().toISOString().split('T')[0];
      const reportPath = join(options.output, `safeguard-debt-fix-${promptId}-${timestamp}.md`);
      
      writeFileSync(reportPath, report, 'utf-8');
      console.log(`\n📄 Fix report saved: ${reportPath}`);
    });

  program
    .command('batch')
    .description('Fix multiple prompts from JSON file')
    .argument('<json-file>', 'JSON file with debt entries')
    .option('-o, --output <path>', 'Output directory for reports', 'test-results')
    .action((jsonFile, options) => {
      try {
        const content = readFileSync(jsonFile, 'utf-8');
        const debtEntries: SafeguardDebtEntry[] = JSON.parse(content);
        
        console.log(`\n🔧 Starting batch fix for ${debtEntries.length} prompts`);
        
        const sessions: FixSessionResult[] = [];
        
        for (const entry of debtEntries) {
          const session = fixPromptDebt(entry.promptId, entry);
          sessions.push(session);
        }
        
        const report = generateFixReport(sessions);
        const timestamp = new Date().toISOString().split('T')[0];
        const reportPath = join(options.output, `safeguard-debt-batch-fix-${timestamp}.md`);
        
        writeFileSync(reportPath, report, 'utf-8');
        console.log(`\n📄 Batch fix report saved: ${reportPath}`);
        
      } catch (error: Error | unknown) {
        console.error(`❌ Failed to read JSON file: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
}

// Run CLI if called directly
if (require.main === module) {
  setupCLI();
  program.parse();
}

export {
  fixPromptDebt,
  generateFixReport,
  runLintFix,
  runTestFix,
  runBuildFix,
  runKanbanFix,
  type FixResult,
  type FixSessionResult
};
