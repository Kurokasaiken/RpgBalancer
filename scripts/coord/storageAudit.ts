#!/usr/bin/env tsx

/**
 * Storage Testing Audit Tool
 * 
 * Verifies that all modules with PersistenceService have test scenarios
 * in the Storage Test Framework and generates Kanban reports.
 * 
 * Usage:
 * ```bash
 * npm run storage:audit
 * tsx scripts/coord/storageAudit.ts
 * tsx scripts/coord/storageAudit.ts --format json
 * tsx scripts/coord/storageAudit.ts --output audit-report.md
 * ```
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, relative, extname } from 'path';
import { z } from 'zod';

// Configuration
const PROJECT_ROOT = process.cwd();
const SRC_DIR = join(PROJECT_ROOT, 'src');
const TESTS_DIR = join(PROJECT_ROOT, 'tests');

// Audit configuration
interface AuditConfig {
  includePatterns: string[];
  excludePatterns: string[];
  requiredTestPatterns: string[];
  storageTestNaming: {
    testFilePattern: RegExp;
    testFunctionPattern: RegExp;
    scenarioPattern: RegExp;
  };
}

const AUDIT_CONFIG: AuditConfig = {
  includePatterns: [
    '**/*.ts',
    '**/*.tsx',
  ],
  excludePatterns: [
    '**/*.d.ts',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
  ],
  requiredTestPatterns: [
    'PersistenceService',
    'saveData',
    'loadData',
    'localStorage',
    'sessionStorage',
  ],
  storageTestNaming: {
    testFilePattern: /storage.*\.test\.ts(x)?$/i,
    testFunctionPattern: /test.*storage|storage.*test/i,
    scenarioPattern: /scenario|test.*storage|storage.*test/i,
  },
};

// Schema definitions
const ModuleInfoSchema = z.object({
  filePath: z.string(),
  relativePath: z.string(),
  hasPersistenceService: z.boolean(),
  persistenceImports: z.array(z.string()),
  storageTestFile: z.string().optional(),
  hasStorageTests: z.boolean(),
  testCoverage: z.object({
    hasTestFile: z.boolean(),
    hasTestFunctions: z.boolean(),
    hasScenarios: z.boolean(),
    testFilePath: z.string().optional(),
  }),
  priority: z.enum(['high', 'medium', 'low']),
  moduleType: z.enum(['config', 'component', 'hook', 'service', 'utility', 'unknown']),
});

type ModuleInfo = z.infer<typeof ModuleInfoSchema>;

type AuditReport = {
  timestamp: string;
  summary: {
    totalModules: number;
    modulesWithPersistence: number;
    modulesWithTests: number;
    coveragePercentage: number;
    highPriorityMissing: number;
    mediumPriorityMissing: number;
    lowPriorityMissing: number;
  };
  modules: ModuleInfo[];
  recommendations: string[];
  nextSteps: string[];
};

// Utility functions
function findFiles(dir: string, pattern: string[]): string[] {
  // Use Node.js built-in child_process for git ls-files
  const { execSync } = eval('require')('child_process');
  const gitFiles = execSync(`git ls-files ${dir}`, { encoding: 'utf-8' });
  
  return gitFiles
    .split('\n')
    .filter(Boolean)
    .filter((file: string) => {
      const ext = extname(file);
      return pattern.some(p => file.includes(p) || (p.startsWith('*.') && ext === p.slice(1)));
    })
    .filter((file: string) => {
      return !AUDIT_CONFIG.excludePatterns.some(exclude => 
        file.includes(exclude.replace('**/', '').replace('*', ''))
      );
    });
}

function analyzeFile(filePath: string): ModuleInfo {
  const relativePath = relative(PROJECT_ROOT, filePath);
  const content = readFileSync(filePath, 'utf-8');
  
  // Check for PersistenceService usage
  const hasPersistenceService = AUDIT_CONFIG.requiredTestPatterns.some(pattern =>
    content.includes(pattern)
  );
  
  // Extract imports
  const persistenceImports: string[] = [];
  const importMatches = content.match(/import.*from\s+['"]([^'"]+)['"]/g) || [];
  importMatches.forEach(match => {
    const importPath = match.match(/from\s+['"]([^'"]+)['"]/)?.[1] || '';
    if (AUDIT_CONFIG.requiredTestPatterns.some(pattern => importPath.includes(pattern))) {
      persistenceImports.push(importPath);
    }
  });
  
  // Determine module type and priority
  const moduleType = determineModuleType(filePath, content);
  const priority = determinePriority(moduleType, hasPersistenceService);
  
  // Check for storage tests
  const testCoverage = checkStorageTestCoverage(relativePath);
  
  return {
    filePath,
    relativePath,
    hasPersistenceService,
    persistenceImports,
    storageTestFile: testCoverage.testFilePath,
    hasStorageTests: testCoverage.hasTestFile || testCoverage.hasTestFunctions || testCoverage.hasScenarios,
    testCoverage,
    priority,
    moduleType,
  };
}

function determineModuleType(filePath: string, content: string): ModuleInfo['moduleType'] {
  if (filePath.includes('/config/')) return 'config';
  if (filePath.includes('/components/')) return 'component';
  if (filePath.includes('/hooks/')) return 'hook';
  if (filePath.includes('/services/')) return 'service';
  if (content.includes('export function') || content.includes('export const')) return 'utility';
  return 'unknown';
}

function determinePriority(moduleType: ModuleInfo['moduleType'], hasPersistence: boolean): ModuleInfo['priority'] {
  if (!hasPersistence) return 'low';
  
  switch (moduleType) {
    case 'config':
    case 'service':
      return 'high';
    case 'hook':
    case 'component':
      return 'medium';
    default:
      return 'low';
  }
}

function checkStorageTestCoverage(modulePath: string) {
  const baseName = modulePath.replace(/^src\//, '').replace(/\.(ts|tsx)$/, '');
  const testDir = join(TESTS_DIR, 'storage');
  
  // Look for test files
  const possibleTestFiles = [
    join(testDir, `${baseName}.test.ts`),
    join(testDir, `${baseName}.test.tsx`),
    join(testDir, `${baseName}.storage.test.ts`),
    join(testDir, `${baseName}.Storage.test.ts`),
  ];
  
  let testFilePath: string | undefined;
  let hasTestFile = false;
  
  for (const testFile of possibleTestFiles) {
    if (existsSync(testFile)) {
      testFilePath = relative(PROJECT_ROOT, testFile);
      hasTestFile = true;
      break;
    }
  }
  
  // Check test content if file exists
  let hasTestFunctions = false;
  let hasScenarios = false;
  
  if (testFilePath && existsSync(testFilePath)) {
    const testContent = readFileSync(testFilePath, 'utf-8');
    hasTestFunctions = AUDIT_CONFIG.storageTestNaming.testFunctionPattern.test(testContent);
    hasScenarios = AUDIT_CONFIG.storageTestNaming.scenarioPattern.test(testContent);
  }
  
  return {
    hasTestFile,
    hasTestFunctions,
    hasScenarios,
    testFilePath,
  };
}

function generateAuditReport(modules: ModuleInfo[]): AuditReport {
  const modulesWithPersistence = modules.filter(m => m.hasPersistenceService);
  const modulesWithTests = modules.filter(m => m.hasStorageTests);
  const coveragePercentage = modulesWithPersistence.length > 0 
    ? (modulesWithTests.length / modulesWithPersistence.length) * 100 
    : 100;
  
  const highPriorityMissing = modules.filter(m => 
    m.priority === 'high' && m.hasPersistenceService && !m.hasStorageTests
  );
  const mediumPriorityMissing = modules.filter(m => 
    m.priority === 'medium' && m.hasPersistenceService && !m.hasStorageTests
  );
  const lowPriorityMissing = modules.filter(m => 
    m.priority === 'low' && m.hasPersistenceService && !m.hasStorageTests
  );
  
  const recommendations = generateRecommendations(modules, coveragePercentage);
  const nextSteps = generateNextSteps(highPriorityMissing, mediumPriorityMissing);
  
  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalModules: modules.length,
      modulesWithPersistence: modulesWithPersistence.length,
      modulesWithTests: modulesWithTests.length,
      coveragePercentage,
      highPriorityMissing: highPriorityMissing.length,
      mediumPriorityMissing: mediumPriorityMissing.length,
      lowPriorityMissing: lowPriorityMissing.length,
    },
    modules,
    recommendations,
    nextSteps,
  };
}

function generateRecommendations(modules: ModuleInfo[], coveragePercentage: number): string[] {
  const recommendations: string[] = [];
  
  if (coveragePercentage < 50) {
    recommendations.push('CRITICAL: Less than 50% storage test coverage. Immediate action required.');
  } else if (coveragePercentage < 80) {
    recommendations.push('WARNING: Storage test coverage below 80%. Priority for next sprint.');
  } else if (coveragePercentage < 100) {
    recommendations.push('INFO: Good progress, but complete coverage recommended for production.');
  } else {
    recommendations.push('EXCELLENT: 100% storage test coverage achieved.');
  }
  
  const highPriorityMissing = modules.filter(m => 
    m.priority === 'high' && m.hasPersistenceService && !m.hasStorageTests
  );
  
  if (highPriorityMissing.length > 0) {
    recommendations.push(`HIGH PRIORITY: ${highPriorityMissing.length} high-priority modules missing storage tests.`);
  }
  
  return recommendations;
}

function generateNextSteps(highPriority: ModuleInfo[], mediumPriority: ModuleInfo[]): string[] {
  const steps: string[] = [];
  
  if (highPriority.length > 0) {
    steps.push(`Create storage tests for ${highPriority.length} high-priority modules:`);
    highPriority.forEach(module => {
      steps.push(`  - ${module.relativePath}`);
    });
  }
  
  if (mediumPriority.length > 0) {
    steps.push(`Plan storage tests for ${mediumPriority.length} medium-priority modules:`);
    mediumPriority.forEach(module => {
      steps.push(`  - ${module.relativePath}`);
    });
  }
  
  steps.push('Update coordinator guidelines with audit process');
  steps.push('Integrate audit into CI/CD pipeline');
  
  return steps;
}

function formatReport(report: AuditReport, format: 'json' | 'markdown' = 'markdown'): string {
  if (format === 'json') {
    return JSON.stringify(report, null, 2);
  }
  
  // Markdown format
  let markdown = `# Storage Testing Audit Report\n\n`;
  markdown += `**Generated**: ${new Date(report.timestamp).toLocaleString()}\n\n`;
  
  // Summary
  markdown += `## Summary\n\n`;
  markdown += `| Metric | Value |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| Total Modules | ${report.summary.totalModules} |\n`;
  markdown += `| Modules with Persistence | ${report.summary.modulesWithPersistence} |\n`;
  markdown += `| Modules with Storage Tests | ${report.summary.modulesWithTests} |\n`;
  markdown += `| Coverage Percentage | ${report.summary.coveragePercentage.toFixed(1)}% |\n`;
  markdown += `| High Priority Missing | ${report.summary.highPriorityMissing} |\n`;
  markdown += `| Medium Priority Missing | ${report.summary.mediumPriorityMissing} |\n`;
  markdown += `| Low Priority Missing | ${report.summary.lowPriorityMissing} |\n\n`;
  
  // Coverage status
  const coverageStatus = report.summary.coveragePercentage >= 80 ? '✅' : 
                        report.summary.coveragePercentage >= 50 ? '⚠️' : '❌';
  markdown += `**Coverage Status**: ${coverageStatus} ${report.summary.coveragePercentage.toFixed(1)}%\n\n`;
  
  // Recommendations
  markdown += `## Recommendations\n\n`;
  report.recommendations.forEach(rec => {
    markdown += `- ${rec}\n`;
  });
  markdown += `\n`;
  
  // Missing tests by priority
  if (report.summary.highPriorityMissing > 0 || report.summary.mediumPriorityMissing > 0) {
    markdown += `## Missing Storage Tests\n\n`;
    
    const missingHigh = report.modules.filter(m => 
      m.priority === 'high' && m.hasPersistenceService && !m.hasStorageTests
    );
    const missingMedium = report.modules.filter(m => 
      m.priority === 'medium' && m.hasPersistenceService && !m.hasStorageTests
    );
    
    if (missingHigh.length > 0) {
      markdown += `### High Priority (${missingHigh.length})\n\n`;
      missingHigh.forEach(module => {
        markdown += `- \`${module.relativePath}\`\n`;
      });
      markdown += `\n`;
    }
    
    if (missingMedium.length > 0) {
      markdown += `### Medium Priority (${missingMedium.length})\n\n`;
      missingMedium.forEach(module => {
        markdown += `- \`${module.relativePath}\`\n`;
      });
      markdown += `\n`;
    }
  }
  
  // Next steps
  markdown += `## Next Steps\n\n`;
  report.nextSteps.forEach(step => {
    markdown += `${step}\n`;
  });
  markdown += `\n`;
  
  // Detailed module list
  markdown += `## Module Details\n\n`;
  markdown += `| Module | Type | Priority | Persistence | Tests | Coverage |\n`;
  markdown += `|--------|------|----------|-------------|-------|----------|\n`;
  
  report.modules.forEach(module => {
    const persistenceIcon = module.hasPersistenceService ? '✅' : '❌';
    const testsIcon = module.hasStorageTests ? '✅' : '❌';
    const coverageIcon = module.testCoverage.hasTestFile ? '✅' : '❌';
    
    markdown += `| \`${module.relativePath}\` | ${module.moduleType} | ${module.priority} | ${persistenceIcon} | ${testsIcon} | ${coverageIcon} |\n`;
  });
  
  return markdown;
}

// CLI interface
interface CliOptions {
  format?: 'json' | 'markdown';
  output?: string;
  verbose?: boolean;
}

function parseCliArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--format' && i + 1 < args.length) {
      options.format = args[i + 1] as 'json' | 'markdown';
      i++;
    } else if (arg === '--output' && i + 1 < args.length) {
      options.output = args[i + 1];
      i++;
    } else if (arg === '--verbose') {
      options.verbose = true;
    }
  }
  
  return options;
}

// Main execution
async function main() {
  const options = parseCliArgs();
  
  console.log('🔍 Storage Testing Audit Tool');
  console.log('==============================\n');
  
  try {
    // Find all source files
    console.log('📁 Scanning source files...');
    const sourceFiles = findFiles(SRC_DIR, AUDIT_CONFIG.includePatterns);
    console.log(`Found ${sourceFiles.length} source files\n`);
    
    // Analyze each file
    console.log('🔬 Analyzing modules...');
    const modules: ModuleInfo[] = [];
    
    for (const file of sourceFiles) {
      try {
        const module = analyzeFile(file);
        if (module.hasPersistenceService || options.verbose) {
          modules.push(module);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to analyze ${file}:`, error);
      }
    }
    
    console.log(`Analyzed ${modules.length} modules with persistence service\n`);
    
    // Generate report
    console.log('📊 Generating audit report...');
    const report = generateAuditReport(modules);
    
    // Output report
    const format = options.format || 'markdown';
    const reportContent = formatReport(report, format);
    
    if (options.output) {
      writeFileSync(options.output, reportContent, 'utf-8');
      console.log(`✅ Report saved to ${options.output}\n`);
    } else {
      console.log(reportContent);
    }
    
    // Exit with error code if critical issues
    const criticalIssues = report.summary.highPriorityMissing > 0 || report.summary.coveragePercentage < 50;
    if (criticalIssues) {
      console.log('\n❌ CRITICAL ISSUES FOUND - Exit code 1');
      process.exit(1);
    } else {
      console.log('\n✅ Audit completed successfully');
    }
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, generateAuditReport, analyzeFile, formatReport };
