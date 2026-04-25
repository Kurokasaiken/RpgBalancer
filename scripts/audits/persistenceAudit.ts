#!/usr/bin/env tsx

/**
 * Persistence Audit Script
 * 
 * Scans the repository for direct usage of localStorage, sessionStorage,
 * and synchronous persistence patterns that violate the async PersistenceService policy.
 * 
 * Usage:
 *   tsx scripts/audits/persistenceAudit.ts
 *   tsx scripts/audits/persistenceAudit.ts --verbose
 *   tsx scripts/audits/persistenceAudit.ts --output results.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';
import { program } from 'commander';

interface AuditResult {
  violations: PersistenceViolation[];
  summary: AuditSummary;
  timestamp: string;
  scanDuration: number;
}

interface ScanOptions {
  verbose?: boolean;
  rootDir?: string;
}

interface PersistenceViolation {
  file: string;
  line: number;
  column: number;
  type: 'localStorage' | 'sessionStorage' | 'sync-persistence' | 'direct-storage';
  pattern: string;
  context: string;
  severity: 'error' | 'warning';
  recommendation: string;
}

interface AuditSummary {
  totalFiles: number;
  scannedFiles: number;
  violations: {
    total: number;
    errors: number;
    warnings: number;
    byType: Record<string, number>;
  };
  compliance: {
    percentage: number;
    status: 'compliant' | 'non-compliant' | 'partial';
  };
}

/**
 * Patterns that violate persistence policy
 */
const VIOLATION_PATTERNS = [
  // Direct localStorage usage
  {
    pattern: /localStorage\./g,
    type: 'localStorage' as const,
    severity: 'error' as const,
    recommendation: 'Use PersistenceService.getItem() / setItem() instead'
  },
  // Direct sessionStorage usage
  {
    pattern: /sessionStorage\./g,
    type: 'sessionStorage' as const,
    severity: 'error' as const,
    recommendation: 'Use PersistenceService.getItem() / setItem() instead'
  },
  // Synchronous storage patterns
  {
    pattern: /\.getItem\(/g,
    type: 'sync-persistence' as const,
    severity: 'warning' as const,
    recommendation: 'Use async PersistenceService methods'
  },
  {
    pattern: /\.setItem\(/g,
    type: 'sync-persistence' as const,
    severity: 'warning' as const,
    recommendation: 'Use async PersistenceService methods'
  },
  // Direct storage property access
  {
    pattern: /storage\./g,
    type: 'direct-storage' as const,
    severity: 'error' as const,
    recommendation: 'Use PersistenceService abstraction layer'
  }
];

/**
 * Files and directories to exclude from scanning
 */
const EXCLUDE_PATTERNS = [
  'node_modules/**',
  'dist/**',
  'build/**',
  'coverage/**',
  '.git/**',
  'test-results/**',
  'tmp/**',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  '**/*.spec.tsx',
  '**/*.mock.ts',
  '**/scripts/audits/persistenceAudit.ts', // Exclude this script
  '**/scripts/**/__tests__/**', // Exclude test files in scripts
  '**/vitest.config.ts',
  '**/jest.config.js',
  '**/babel.config.js'
];

/**
 * Allowed patterns (false positives to ignore)
 */
const ALLOWED_PATTERNS = [
  // Comments about localStorage
  /\/\/.*localStorage/g,
  /\/\*[\s\S]*?localStorage[\s\S]*?\*\//g,
  // Documentation strings
  /`[^`]*localStorage[^`]*`/g,
  /'[^']*localStorage[^']*'/g,
  /"[^"]*localStorage[^"]*"/g,
  // Import statements (unlikely but possible)
  /import.*localStorage/g,
  // Type definitions
  /: localStorage/g,
  /localStorage: /g,
  // Function parameters
  /\(localStorage/g,
  /localStorage, /g,
  // Console logging about localStorage
  /console\.(log|warn|error).*localStorage/g
];

/**
 * Scans a single file for persistence violations
 */
function scanFile(filePath: string, content: string): PersistenceViolation[] {
  const violations: PersistenceViolation[] = [];
  const lines = content.split('\n');

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const lineNumber = lineIndex + 1;

    for (const violationPattern of VIOLATION_PATTERNS) {
      let match;
      // Reset regex lastIndex
      violationPattern.pattern.lastIndex = 0;
      
      while ((match = violationPattern.pattern.exec(line)) !== null) {
        const column = match.index + 1;
        const context = line.trim();
        
        // Check if this is a false positive
        const isFalsePositive = ALLOWED_PATTERNS.some(allowedPattern => 
          allowedPattern.test(line)
        );

        if (!isFalsePositive) {
          violations.push({
            file: filePath,
            line: lineNumber,
            column,
            type: violationPattern.type,
            pattern: match[0],
            context,
            severity: violationPattern.severity,
            recommendation: violationPattern.recommendation
          });
        }
      }
    }
  }

  return violations;
}

/**
 * Scans all files in the repository for persistence violations
 */
async function scanRepository(options: ScanOptions = {}): Promise<AuditResult> {
  const startTime = Date.now();
  const violations: PersistenceViolation[] = [];
  const rootDir = options.rootDir ?? process.cwd();
  
  // Get all TypeScript and JavaScript files
  const files = await glob('**/*.{ts,tsx,js,jsx}', {
    ignore: EXCLUDE_PATTERNS,
    cwd: rootDir
  });

  const totalFiles = files.length;
  let scannedFiles = 0;

  if (options.verbose) {
    console.log(`🔍 Scanning ${totalFiles} files for persistence violations...`);
  }

  for (const file of files) {
    try {
      const filePath = join(rootDir, file);
      const content = readFileSync(filePath, 'utf-8');
      const fileViolations = scanFile(file, content);
      
      violations.push(...fileViolations);
      scannedFiles++;

      if (options.verbose && fileViolations.length > 0) {
        console.log(`❌ ${file}: ${fileViolations.length} violations`);
      }
    } catch {
      if (options.verbose) {
        console.log(`⚠️  Could not read file: ${file}`);
      }
    }
  }

  const scanDuration = Date.now() - startTime;
  const summary = generateSummary(totalFiles, scannedFiles, violations);

  return {
    violations,
    summary,
    timestamp: new Date().toISOString(),
    scanDuration
  };
}

/**
 * Generates audit summary statistics
 */
function generateSummary(totalFiles: number, scannedFiles: number, violations: PersistenceViolation[]): AuditSummary {
  const errors = violations.filter(v => v.severity === 'error').length;
  const warnings = violations.filter(v => v.severity === 'warning').length;
  
  const violationsByType = violations.reduce((acc, violation) => {
    acc[violation.type] = (acc[violation.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const compliancePercentage = scannedFiles > 0 
    ? ((scannedFiles - violations.length) / scannedFiles) * 100 
    : 100;

  let complianceStatus: 'compliant' | 'non-compliant' | 'partial';
  if (errors === 0 && warnings === 0) {
    complianceStatus = 'compliant';
  } else if (errors > 0) {
    complianceStatus = 'non-compliant';
  } else {
    complianceStatus = 'partial';
  }

  return {
    totalFiles,
    scannedFiles,
    violations: {
      total: violations.length,
      errors,
      warnings,
      byType: violationsByType
    },
    compliance: {
      percentage: compliancePercentage,
      status: complianceStatus
    }
  };
}

/**
 * Prints audit results to console
 */
function printResults(result: AuditResult, options: { verbose?: boolean }): void {
  console.log('\n🔍 Persistence Audit Results');
  console.log('='.repeat(50));
  console.log(`📊 Summary:`);
  console.log(`   Files scanned: ${result.summary.scannedFiles}/${result.summary.totalFiles}`);
  console.log(`   Violations: ${result.summary.violations.total} (${result.summary.violations.errors} errors, ${result.summary.violations.warnings} warnings)`);
  console.log(`   Compliance: ${result.summary.compliance.percentage.toFixed(1)}% (${result.summary.compliance.status})`);
  console.log(`   Duration: ${result.scanDuration}ms`);
  console.log(`   Timestamp: ${result.timestamp}`);

  if (result.violations.length > 0) {
    console.log('\n❌ Violations Found:');
    console.log('-'.repeat(50));

    // Group violations by file
    const violationsByFile = result.violations.reduce((acc, violation) => {
      if (!acc[violation.file]) {
        acc[violation.file] = [];
      }
      acc[violation.file].push(violation);
      return acc;
    }, {} as Record<string, PersistenceViolation[]>);

    for (const [file, fileViolations] of Object.entries(violationsByFile)) {
      console.log(`\n📁 ${file}`);
      for (const violation of fileViolations) {
        const icon = violation.severity === 'error' ? '❌' : '⚠️';
        console.log(`   ${icon} Line ${violation.line}:${violation.column} - ${violation.type}`);
        console.log(`      Pattern: ${violation.pattern}`);
        console.log(`      Context: ${violation.context.substring(0, 100)}${violation.context.length > 100 ? '...' : ''}`);
        console.log(`      💡 ${violation.recommendation}`);
      }
    }
  }

  if (options.verbose) {
    console.log('\n📈 Violations by Type:');
    for (const [type, count] of Object.entries(result.summary.violations.byType)) {
      console.log(`   ${type}: ${count}`);
    }
  }

  console.log('\n🎯 Recommendations:');
  if (result.summary.violations.errors > 0) {
    console.log('   - Fix all error-level violations before merging');
    console.log('   - Use async PersistenceService for all storage operations');
  }
  if (result.summary.violations.warnings > 0) {
    console.log('   - Consider fixing warning-level violations for better consistency');
  }
  if (result.summary.compliance.status === 'compliant') {
    console.log('   ✅ No violations found! Repository is fully compliant.');
  }
}

/**
 * Saves audit results to JSON file
 */
function saveResults(result: AuditResult, outputPath: string): void {
  try {
    writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`\n💾 Results saved to: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Failed to save results: ${error}`);
  }
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  program
    .name('persistenceAudit')
    .description('Audit repository for persistence policy violations')
    .option('-v, --verbose', 'Enable verbose output')
    .option('-o, --output <file>', 'Save results to JSON file')
    .option('-r, --root <path>', 'Repository root to scan (default: current working directory)')
    .parse();

  const options = program.opts();
  const rootDir: string | undefined = options.root;

  try {
    const result = await scanRepository({ verbose: options.verbose, rootDir });
    
    printResults(result, options);

    if (options.output) {
      saveResults(result, options.output);
    }

    // Exit with appropriate code
    if (result.summary.violations.errors > 0) {
      console.log('\n❌ Audit failed with errors');
      process.exit(1);
    } else if (result.summary.violations.warnings > 0) {
      console.log('\n⚠️  Audit passed with warnings');
      process.exit(0);
    } else {
      console.log('\n✅ Audit passed successfully');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

function isDirectExecution(): boolean {
  if (typeof process === 'undefined' || !process.argv?.[1]) {
    return false;
  }

  const entryPath = process.argv[1].startsWith('file://')
    ? process.argv[1]
    : `file://${process.argv[1]}`;

  return import.meta.url === entryPath;
}

if (isDirectExecution()) {
  main();
}

export { scanRepository, scanFile, type AuditResult, type PersistenceViolation, type AuditSummary };
