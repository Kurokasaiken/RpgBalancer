#!/usr/bin/env tsx

/**
 * Persistence Service Audit & Hardening Tool
 * 
 * Comprehensive audit of storage usage patterns, security vulnerabilities,
 * and compliance with persistence policies across the entire codebase.
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface AuditConfig {
  scanPaths: string[];
  excludePatterns: string[];
  enableSecurityScan: boolean;
  enablePerformanceScan: boolean;
  enableComplianceScan: boolean;
  maxFileSize: number; // bytes
  timeout: number; // ms
}

interface StorageViolation {
  type: 'localStorage' | 'sessionStorage' | 'directStorage' | 'securityRisk' | 'performanceIssue';
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line: number;
  column: number;
  code: string;
  description: string;
  recommendation: string;
}

interface SecurityIssue {
  type: 'dataExposure' | 'injectionRisk' | 'piiStorage' | 'weakEncryption';
  severity: 'critical' | 'high' | 'medium';
  file: string;
  line: number;
  description: string;
  evidence: string;
  recommendation: string;
}

interface PerformanceIssue {
  type: 'synchronousOperation' | 'largeDataset' | 'memoryLeak' | 'blockingCall';
  severity: 'high' | 'medium' | 'low';
  file: string;
  line: number;
  description: string;
  impact: string;
  recommendation: string;
}

interface ComplianceResult {
  file: string;
  usesPersistenceService: boolean;
  usesDirectStorage: boolean;
  violations: StorageViolation[];
  securityIssues: SecurityIssue[];
  performanceIssues: PerformanceIssue[];
  score: number; // 0-100
}

interface AuditReport {
  timestamp: string;
  config: AuditConfig;
  summary: {
    totalFiles: number;
    filesWithStorage: number;
    violations: StorageViolation[];
    securityIssues: SecurityIssue[];
    performanceIssues: PerformanceIssue[];
    complianceScore: number;
  };
  results: ComplianceResult[];
  recommendations: string[];
}

// ============================================================================
// AUDIT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: AuditConfig = {
  scanPaths: [
    'src/**/*.ts',
    'src/**/*.tsx',
    'src/**/*.js',
    'src/**/*.jsx',
  ],
  excludePatterns: [
    'node_modules/**',
    'dist/**',
    'build/**',
    '.git/**',
    '**/*.test.*',
    '**/*.spec.*',
    'coverage/**',
    'test-results/**',
  ],
  enableSecurityScan: true,
  enablePerformanceScan: true,
  enableComplianceScan: true,
  maxFileSize: 1024 * 1024, // 1MB
  timeout: 30000, // 30 seconds
};

// ============================================================================
// PATTERN DEFINITIONS
// ============================================================================

const STORAGE_PATTERNS = {
  // Direct localStorage usage
  localStorage: {
    pattern: /localStorage\.(getItem|setItem|removeItem|clear)\s*\(/g,
    type: 'localStorage' as const,
    description: 'Direct localStorage usage detected',
    recommendation: 'Use PersistenceService instead',
  },
  
  // Direct sessionStorage usage
  sessionStorage: {
    pattern: /sessionStorage\.(getItem|setItem|removeItem|clear)\s*\(/g,
    type: 'sessionStorage' as const,
    description: 'Direct sessionStorage usage detected',
    recommendation: 'Use PersistenceService instead',
  },
  
  // Window storage access
  windowStorage: {
    pattern: /window\.(localStorage|sessionStorage)\./g,
    type: 'directStorage' as const,
    description: 'Direct window storage access detected',
    recommendation: 'Use PersistenceService instead',
  },
  
  // Synchronous file operations (performance)
  syncFileOps: {
    pattern: /fs\.(readFileSync|writeFileSync|existsSync)\s*\(/g,
    type: 'performanceIssue' as const,
    description: 'Synchronous file operation detected',
    recommendation: 'Use async file operations',
  },
} as const;

const SECURITY_PATTERNS = {
  // Potential data exposure
  dataExposure: {
    pattern: /(password|token|secret|key|api_key|private_key)\s*[=:]/gi,
    type: 'dataExposure' as const,
    description: 'Potential sensitive data storage detected',
    recommendation: 'Avoid storing sensitive data in localStorage',
  },
  
  // PII patterns
  piiPatterns: {
    pattern: /(email|phone|address|ssn|credit_card|social_security)\s*[=:]/gi,
    type: 'piiStorage' as const,
    description: 'Potential PII storage detected',
    recommendation: 'Avoid storing PII in client-side storage',
  },
  
  // JSON injection risks
  jsonInjection: {
    pattern: /JSON\.parse\s*\(\s*[^)]*\+\s*[^)]*\)/g,
    type: 'injectionRisk' as const,
    description: 'Potential JSON injection vulnerability',
    recommendation: 'Validate and sanitize data before JSON.parse',
  },
} as const;

const PERFORMANCE_PATTERNS = {
  // Large object storage
  largeObjects: {
    pattern: /JSON\.stringify\s*\(\s*[^)]*\)\s*.{0,200}(localStorage|sessionStorage)/g,
    type: 'largeDataset' as const,
    description: 'Large object storage detected',
    recommendation: 'Consider data compression or pagination',
  },
  
  // Blocking operations
  blockingOps: {
    pattern: /(while|for)\s*\([^)]*\)\s*\{[^}]*localStorage[^}]*\}/g,
    type: 'blockingCall' as const,
    description: 'Blocking loop with storage operations',
    recommendation: 'Use async iteration or batch operations',
  },
  
  // Synchronous file operations
  syncFileOps: {
    pattern: /require\(['"]fs['"]\)\.readFileSync|fs\.readFileSync/g,
    type: 'synchronousOperation' as const,
    description: 'Synchronous file operation detected',
    recommendation: 'Use async file operations',
  },
} as const;

// ============================================================================
// AUDIT ENGINE
// ============================================================================

class PersistenceAuditor {
  private config: AuditConfig;
  private report: AuditReport;

  constructor(config: Partial<AuditConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.report = this.initializeReport();
  }

  private initializeReport(): AuditReport {
    return {
      timestamp: new Date().toISOString(),
      config: this.config,
      summary: {
        totalFiles: 0,
        filesWithStorage: 0,
        violations: [],
        securityIssues: [],
        performanceIssues: [],
        complianceScore: 0,
      },
      results: [],
      recommendations: [],
    };
  }

  async runAudit(): Promise<AuditReport> {
    console.log('🔍 Starting Persistence Service Audit...');
    console.log(`📁 Scanning paths: ${this.config.scanPaths.join(', ')}`);

    const files = await this.getFilesToScan();
    this.report.summary.totalFiles = files.length;

    console.log(`📄 Found ${files.length} files to analyze`);

    for (const file of files) {
      await this.auditFile(file);
    }

    this.calculateSummary();
    this.generateRecommendations();

    console.log('✅ Audit completed');
    return this.report;
  }

  private async getFilesToScan(): Promise<string[]> {
    const allFiles: string[] = [];

    for (const scanPath of this.config.scanPaths) {
      const files = await glob(scanPath, {
        ignore: this.config.excludePatterns,
        absolute: true,
      });
      allFiles.push(...files);
    }

    // Remove duplicates and filter by size
    const uniqueFiles = [...new Set(allFiles)];
    return uniqueFiles.filter(file => {
      try {
        const stats = fs.statSync(file);
        return stats.isFile() && stats.size <= this.config.maxFileSize;
      } catch {
        return false;
      }
    });
  }

  private async auditFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      const result: ComplianceResult = {
        file: filePath,
        usesPersistenceService: false,
        usesDirectStorage: false,
        violations: [],
        securityIssues: [],
        performanceIssues: [],
        score: 100,
      };

      // Check for PersistenceService usage
      result.usesPersistenceService = /PersistenceService/.test(content);

      // Scan for violations
      this.scanForViolations(content, lines, result);
      this.scanForSecurityIssues(content, lines, result);
      this.scanForPerformanceIssues(content, lines, result);

      // Calculate score
      result.score = this.calculateFileScore(result);
      result.usesDirectStorage = result.violations.length > 0;

      if (result.violations.length > 0 || result.securityIssues.length > 0 || result.performanceIssues.length > 0) {
        this.report.summary.filesWithStorage++;
      }

      this.report.results.push(result);

    } catch (error) {
      console.error(`❌ Error auditing file ${filePath}:`, error);
    }
  }

  private scanForViolations(content: string, lines: string[], result: ComplianceResult): void {
    Object.entries(STORAGE_PATTERNS).forEach(([name, pattern]) => {
      let match;
      while ((match = pattern.pattern.exec(content)) !== null) {
        const lineIndex = content.substring(0, match.index).split('\n').length - 1;
        const lineContent = lines[lineIndex] || '';
        const column = match.index - content.lastIndexOf('\n', match.index - 1) - 1;

        const violation: StorageViolation = {
          type: pattern.type,
          severity: this.getSeverity(pattern.type),
          file: result.file,
          line: lineIndex + 1,
          column,
          code: lineContent.trim(),
          description: pattern.description,
          recommendation: pattern.recommendation,
        };

        result.violations.push(violation);
        this.report.summary.violations.push(violation);
      }
    });
  }

  private scanForSecurityIssues(content: string, lines: string[], result: ComplianceResult): void {
    if (!this.config.enableSecurityScan) return;

    Object.entries(SECURITY_PATTERNS).forEach(([name, pattern]) => {
      let match;
      while ((match = pattern.pattern.exec(content)) !== null) {
        const lineIndex = content.substring(0, match.index).split('\n').length - 1;
        const lineContent = lines[lineIndex] || '';

        const issue: SecurityIssue = {
          type: pattern.type,
          severity: this.getSecuritySeverity(pattern.type),
          file: result.file,
          line: lineIndex + 1,
          description: pattern.description,
          evidence: match[0],
          recommendation: pattern.recommendation,
        };

        result.securityIssues.push(issue);
        this.report.summary.securityIssues.push(issue);
      }
    });
  }

  private scanForPerformanceIssues(content: string, lines: string[], result: ComplianceResult): void {
    if (!this.config.enablePerformanceScan) return;

    Object.entries(PERFORMANCE_PATTERNS).forEach(([name, pattern]) => {
      let match;
      while ((match = pattern.pattern.exec(content)) !== null) {
        const lineIndex = content.substring(0, match.index).split('\n').length - 1;
        const lineContent = lines[lineIndex] || '';

        const issue: PerformanceIssue = {
          type: pattern.type,
          severity: this.getPerformanceSeverity(pattern.type),
          file: result.file,
          line: lineIndex + 1,
          description: pattern.description,
          impact: this.getPerformanceImpact(pattern.type),
          recommendation: pattern.recommendation,
        };

        result.performanceIssues.push(issue);
        this.report.summary.performanceIssues.push(issue);
      }
    });
  }

  private getSeverity(type: string): 'critical' | 'high' | 'medium' | 'low' {
    switch (type) {
      case 'localStorage':
      case 'sessionStorage':
        return 'high';
      case 'directStorage':
        return 'medium';
      case 'performanceIssue':
        return 'low';
      default:
        return 'medium';
    }
  }

  private getSecuritySeverity(type: string): 'critical' | 'high' | 'medium' {
    switch (type) {
      case 'dataExposure':
      case 'piiStorage':
        return 'critical';
      case 'injectionRisk':
        return 'high';
      default:
        return 'medium';
    }
  }

  private getPerformanceSeverity(type: string): 'high' | 'medium' | 'low' {
    switch (type) {
      case 'blockingCall':
        return 'high';
      case 'largeDataset':
        return 'medium';
      case 'synchronousOperation':
        return 'low';
      default:
        return 'low';
    }
  }

  private getPerformanceImpact(type: string): string {
    switch (type) {
      case 'blockingCall':
        return 'Can freeze UI during execution';
      case 'largeDataset':
        return 'Increased memory usage and slower operations';
      case 'synchronousOperation':
        return 'Blocks main thread execution';
      default:
        return 'Unknown impact';
    }
  }

  private calculateFileScore(result: ComplianceResult): number {
    let score = 100;

    // Deduct points for violations
    result.violations.forEach((v: StorageViolation) => {
      switch (v.severity) {
        case 'critical': score -= 25; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    });

    // Deduct points for security issues
    result.securityIssues.forEach((i: SecurityIssue) => {
      switch (i.severity) {
        case 'critical': score -= 30; break;
        case 'high': score -= 20; break;
        case 'medium': score -= 10; break;
      }
    });

    // Deduct points for performance issues
    result.performanceIssues.forEach((i: PerformanceIssue) => {
      switch (i.severity) {
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    });

    // Bonus for using PersistenceService
    if (result.usesPersistenceService) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateSummary(): void {
    const totalScore = this.report.results.reduce((sum: number, result: ComplianceResult) => sum + result.score, 0);
    this.report.summary.complianceScore = this.report.results.length > 0 
      ? Math.round(totalScore / this.report.results.length)
      : 0;
  }

  private generateRecommendations(): void {
    const recommendations = new Set<string>();

    // Analyze common patterns
    const localStorageViolations = this.report.summary.violations.filter((v: StorageViolation) => v.type === 'localStorage');
    if (localStorageViolations.length > 0) {
      recommendations.add(`Replace ${localStorageViolations.length} direct localStorage usage(s) with PersistenceService`);
    }

    const sessionStorageViolations = this.report.summary.violations.filter((v: StorageViolation) => v.type === 'sessionStorage');
    if (sessionStorageViolations.length > 0) {
      recommendations.add(`Replace ${sessionStorageViolations.length} direct sessionStorage usage(s) with PersistenceService`);
    }

    const criticalSecurityIssues = this.report.summary.securityIssues.filter((i: SecurityIssue) => i.severity === 'critical');
    if (criticalSecurityIssues.length > 0) {
      recommendations.add(`Address ${criticalSecurityIssues.length} critical security issue(s) immediately`);
    }

    const highPerformanceIssues = this.report.summary.performanceIssues.filter((i: PerformanceIssue) => i.severity === 'high');
    if (highPerformanceIssues.length > 0) {
      recommendations.add(`Optimize ${highPerformanceIssues.length} high-impact performance issue(s)`);
    }

    if (this.report.summary.complianceScore < 80) {
      recommendations.add('Overall compliance score is below 80% - implement comprehensive fixes');
    }

    // Add general recommendations
    recommendations.add('Implement automated testing to prevent localStorage direct usage');
    recommendations.add('Add lint rules to detect storage violations');
    recommendations.add('Document proper PersistenceService usage patterns');
    recommendations.add('Regular security audits for sensitive data handling');

    this.report.recommendations = Array.from(recommendations);
  }

  generateReport(): string {
    const report = [];

    // Header
    report.push('# Persistence Service Audit Report');
    report.push('');
    report.push(`**Generated:** ${this.report.timestamp}`);
    report.push(`**Files Scanned:** ${this.report.summary.totalFiles}`);
    report.push(`**Files with Storage:** ${this.report.summary.filesWithStorage}`);
    report.push(`**Compliance Score:** ${this.report.summary.complianceScore}/100`);
    report.push('');

    // Summary
    report.push('## Summary');
    report.push('');
    report.push(`- **Violations:** ${this.report.summary.violations.length}`);
    report.push(`- **Security Issues:** ${this.report.summary.securityIssues.length}`);
    report.push(`- **Performance Issues:** ${this.report.summary.performanceIssues.length}`);
    report.push('');

    // Critical Issues
    const criticalViolations = this.report.summary.violations.filter((v: StorageViolation) => v.severity === 'critical');
    const criticalSecurity = this.report.summary.securityIssues.filter((i: SecurityIssue) => i.severity === 'critical');

    if (criticalViolations.length > 0 || criticalSecurity.length > 0) {
      report.push('## 🚨 Critical Issues');
      report.push('');

      criticalViolations.forEach((v: StorageViolation) => {
        report.push(`### ${v.type} in ${path.relative(process.cwd(), v.file)}`);
        report.push(`**Line ${v.line}:** ${v.description}`);
        report.push(`**Code:** \`${v.code}\``);
        report.push(`**Recommendation:** ${v.recommendation}`);
        report.push('');
      });

      criticalSecurity.forEach((i: SecurityIssue) => {
        report.push(`### ${i.type} in ${path.relative(process.cwd(), i.file)}`);
        report.push(`**Line ${i.line}:** ${i.description}`);
        report.push(`**Evidence:** \`${i.evidence}\``);
        report.push(`**Recommendation:** ${i.recommendation}`);
        report.push('');
      });
    }

    // Recommendations
    report.push('## Recommendations');
    report.push('');
    this.report.recommendations.forEach((rec: string) => {
      report.push(`- ${rec}`);
    });
    report.push('');

    // Detailed Results
    report.push('## Detailed Results');
    report.push('');

    this.report.results.forEach((result: ComplianceResult) => {
      if (result.violations.length > 0 || result.securityIssues.length > 0 || result.performanceIssues.length > 0) {
        report.push(`### ${path.relative(process.cwd(), result.file)}`);
        report.push(`**Score:** ${result.score}/100`);
        report.push(`**Uses PersistenceService:** ${result.usesPersistenceService ? '✅' : '❌'}`);
        report.push('');

        if (result.violations.length > 0) {
          report.push('**Violations:**');
          result.violations.forEach((v: StorageViolation) => {
            report.push(`- Line ${v.line}: ${v.description} (${v.severity})`);
          });
          report.push('');
        }

        if (result.securityIssues.length > 0) {
          report.push('**Security Issues:**');
          result.securityIssues.forEach((i: SecurityIssue) => {
            report.push(`- Line ${i.line}: ${i.description} (${i.severity})`);
          });
          report.push('');
        }

        if (result.performanceIssues.length > 0) {
          report.push('**Performance Issues:**');
          result.performanceIssues.forEach((i: PerformanceIssue) => {
            report.push(`- Line ${i.line}: ${i.description} (${i.severity})`);
          });
          report.push('');
        }
      }
    });

    return report.join('\n');
  }
}

// ============================================================================
// CLI EXECUTION
// ============================================================================

async function main() {
  try {
    console.log('🔧 Persistence Service Audit & Hardening Tool');
    console.log('==========================================\n');

    const auditor = new PersistenceAuditor();
    const report = await auditor.runAudit();

    // Generate and save report
    const reportContent = auditor.generateReport();
    const reportPath = 'test-results/ks-081-storage-audit-report.md';
    
    // Ensure directory exists
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, reportContent);

    // Print summary
    console.log('\n📊 Audit Summary:');
    console.log(`- Files scanned: ${report.summary.totalFiles}`);
    console.log(`- Files with storage: ${report.summary.filesWithStorage}`);
    console.log(`- Violations found: ${report.summary.violations.length}`);
    console.log(`- Security issues: ${report.summary.securityIssues.length}`);
    console.log(`- Performance issues: ${report.summary.performanceIssues.length}`);
    console.log(`- Compliance score: ${report.summary.complianceScore}/100`);
    console.log(`\n📄 Report saved to: ${reportPath}`);

    // Exit with appropriate code
    const criticalIssues = [...report.summary.violations, ...report.summary.securityIssues]
      .filter((i: StorageViolation | SecurityIssue) => i.severity === 'critical').length;

    if (criticalIssues > 0) {
      console.log(`\n❌ ${criticalIssues} critical issues found - immediate action required`);
      process.exit(1);
    } else if (report.summary.complianceScore < 80) {
      console.log(`\n⚠️  Compliance score below 80% - improvements needed`);
      process.exit(2);
    } else {
      console.log(`\n✅ Audit passed - good compliance score`);
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(3);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { PersistenceAuditor, type AuditReport, type ComplianceResult };
