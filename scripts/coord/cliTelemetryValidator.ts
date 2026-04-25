/**
 * CLI Telemetry Validation Tool
 * 
 * Validates telemetry data integrity, checks for anomalies, and ensures
 * data quality before export or analysis.
 * 
 * @module cli-telemetry-validator
 * @since 2026-01-12
 * @author Cascade
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { program } from 'commander';
import { execSync } from 'child_process';

/**
 * Telemetry validation configuration
 */
interface ValidationConfig {
  /** Input file path */
  inputFile: string;
  /** Output report path */
  outputPath: string;
  /** Validation rules to apply */
  rules: ValidationRule[];
  /** Enable verbose logging */
  verbose: boolean;
  /** Fix issues automatically */
  autoFix: boolean;
  /** Generate detailed report */
  detailedReport: boolean;
}

/**
 * Validation rule interface
 */
interface ValidationRule {
  /** Rule identifier */
  id: string;
  /** Rule description */
  description: string;
  /** Rule severity */
  severity: 'error' | 'warning' | 'info';
  /** Validation function */
  validate: (data: any) => ValidationResult;
  /** Auto-fix function (optional) */
  fix?: (data: any) => any;
}

/**
 * Validation result interface
 */
interface ValidationResult {
  /** Rule passed */
  passed: boolean;
  /** Error message */
  message?: string;
  /** Error details */
  details?: any;
  /** Suggested fix */
  suggestion?: string;
}

/**
 * Telemetry validation report
 */
interface ValidationReport {
  /** Validation timestamp */
  timestamp: string;
  /** Input file */
  inputFile: string;
  /** Total records processed */
  totalRecords: number;
  /** Validation results */
  results: {
    rule: string;
    severity: string;
    passed: boolean;
    message?: string;
    count: number;
  }[];
  /** Summary statistics */
  summary: {
    totalErrors: number;
    totalWarnings: number;
    totalInfo: number;
    recordsWithIssues: number;
    validationScore: number; // 0-100
  };
  /** Fixed issues */
  fixedIssues: string[];
  /** Processing time */
  processingTime: number;
}

/**
 * Built-in validation rules
 */
const BUILT_IN_RULES: ValidationRule[] = [
  {
    id: 'required-fields',
    description: 'Check for required telemetry fields',
    severity: 'error',
    validate: (data: any[]) => {
      if (!Array.isArray(data)) {
        return { passed: false, message: 'Data must be an array' };
      }

      const requiredFields = ['timestamp', 'eventType', 'sessionId'];
      const missingFields: string[] = [];

      data.forEach((record, index) => {
        if (typeof record !== 'object' || record === null) {
          missingFields.push(`Record ${index}: Not an object`);
          return;
        }

        requiredFields.forEach(field => {
          if (!(field in record)) {
            missingFields.push(`Record ${index}: Missing ${field}`);
          }
        });
      });

      return {
        passed: missingFields.length === 0,
        message: missingFields.length > 0 ? `Missing required fields: ${missingFields.slice(0, 5).join(', ')}${missingFields.length > 5 ? '...' : ''}` : undefined,
        details: { missingFields }
      };
    }
  },

  {
    id: 'timestamp-format',
    description: 'Validate timestamp format and range',
    severity: 'error',
    validate: (data: any[]) => {
      const invalidTimestamps: string[] = [];

      data.forEach((record, index) => {
        if (!record.timestamp) return;

        const timestamp = record.timestamp;
        
        // Check if timestamp is valid number (Unix ms)
        if (typeof timestamp !== 'number' || timestamp < 0) {
          invalidTimestamps.push(`Record ${index}: Invalid timestamp format`);
          return;
        }

        // Check if timestamp is in reasonable range (2020-2030)
        const year2020 = new Date('2020-01-01').getTime();
        const year2030 = new Date('2030-01-01').getTime();
        
        if (timestamp < year2020 || timestamp > year2030) {
          invalidTimestamps.push(`Record ${index}: Timestamp out of range`);
        }
      });

      return {
        passed: invalidTimestamps.length === 0,
        message: invalidTimestamps.length > 0 ? `Invalid timestamps: ${invalidTimestamps.slice(0, 3).join(', ')}${invalidTimestamps.length > 3 ? '...' : ''}` : undefined,
        details: { invalidTimestamps }
      };
    }
  },

  {
    id: 'session-integrity',
    description: 'Check session ID consistency and format',
    severity: 'warning',
    validate: (data: any[]) => {
      const invalidSessions: string[] = [];
      const sessionCounts: Record<string, number> = {};

      data.forEach((record, index) => {
        if (!record.sessionId) {
          invalidSessions.push(`Record ${index}: Missing sessionId`);
          return;
        }

        const sessionId = record.sessionId;
        if (typeof sessionId !== 'string' || sessionId.length < 5) {
          invalidSessions.push(`Record ${index}: Invalid sessionId format`);
          return;
        }

        sessionCounts[sessionId] = (sessionCounts[sessionId] || 0) + 1;
      });

      // Check for sessions with very few events (might be corrupted)
      const suspiciousSessions = Object.entries(sessionCounts)
        .filter(([_, count]) => count < 2)
        .map(([sessionId]) => sessionId);

      return {
        passed: invalidSessions.length === 0 && suspiciousSessions.length === 0,
        message: invalidSessions.length > 0 || suspiciousSessions.length > 0 
          ? `Session issues: ${invalidSessions.length} invalid, ${suspiciousSessions.length} suspicious` 
          : undefined,
        details: { invalidSessions, suspiciousSessions }
      };
    }
  },

  {
    id: 'event-type-consistency',
    description: 'Validate event type consistency',
    severity: 'warning',
    validate: (data: any[]) => {
      const eventTypes = new Set<string>();
      const invalidEventTypes: string[] = [];

      // Known event types (can be extended)
      const knownEventTypes = [
        'pwa_install_tracked',
        'pwa_cold_start_metrics',
        'pwa_update_available',
        'user_interaction',
        'performance_metric',
        'error_occurred',
        'feature_used'
      ];

      data.forEach((record, index) => {
        if (!record.eventType) {
          invalidEventTypes.push(`Record ${index}: Missing eventType`);
          return;
        }

        const eventType = record.eventType;
        eventTypes.add(eventType);

        if (typeof eventType !== 'string' || eventType.length === 0) {
          invalidEventTypes.push(`Record ${index}: Invalid eventType format`);
        }
      });

      const unknownEventTypes = Array.from(eventTypes).filter(type => !knownEventTypes.includes(type));

      return {
        passed: invalidEventTypes.length === 0,
        message: invalidEventTypes.length > 0 || unknownEventTypes.length > 0
          ? `Event type issues: ${invalidEventTypes.length} invalid, ${unknownEventTypes.length} unknown (${unknownEventTypes.slice(0, 3).join(', ')})`
          : undefined,
        details: { invalidEventTypes, unknownEventTypes, knownEventTypes: Array.from(eventTypes) }
      };
    }
  },

  {
    id: 'duplicate-events',
    description: 'Check for duplicate events within same session',
    severity: 'info',
    validate: (data: any[]) => {
      const eventSignatures = new Set<string>();
      const duplicates: string[] = [];

      data.forEach((record, index) => {
        if (!record.timestamp || !record.eventType || !record.sessionId) return;

        // Create signature: sessionId eventType timestamp (rounded to second)
        const signature = `${record.sessionId}_${record.eventType}_${Math.floor(record.timestamp / 1000)}`;
        
        if (eventSignatures.has(signature)) {
          duplicates.push(`Duplicate: ${signature} (record ${index})`);
        } else {
          eventSignatures.add(signature);
        }
      });

      return {
        passed: duplicates.length === 0,
        message: duplicates.length > 0 ? `Found ${duplicates.length} potential duplicate events` : undefined,
        details: { duplicates }
      };
    }
  },

  {
    id: 'data-size-limits',
    description: 'Check for unusually large records',
    severity: 'warning',
    validate: (data: any[]) => {
      const largeRecords: string[] = [];
      const maxSize = 1024 * 1024; // 1MB per record

      data.forEach((record, index) => {
        const size = JSON.stringify(record).length;
        if (size > maxSize) {
          largeRecords.push(`Record ${index}: ${Math.round(size / 1024)}KB`);
        }
      });

      return {
        passed: largeRecords.length === 0,
        message: largeRecords.length > 0 ? `Found ${largeRecords.length} large records: ${largeRecords.slice(0, 3).join(', ')}` : undefined,
        details: { largeRecords }
      };
    }
  },

  {
    id: 'chronological-order',
    description: 'Check if events are in chronological order within sessions',
    severity: 'info',
    validate: (data: any[]) => {
      const sessionTimestamps: Record<string, number[]> = {};
      const outOfOrderSessions: string[] = [];

      // Group timestamps by session
      data.forEach(record => {
        if (!record.sessionId || !record.timestamp) return;
        
        if (!sessionTimestamps[record.sessionId]) {
          sessionTimestamps[record.sessionId] = [];
        }
        sessionTimestamps[record.sessionId].push(record.timestamp);
      });

      // Check chronological order within each session
      Object.entries(sessionTimestamps).forEach(([sessionId, timestamps]) => {
        for (let i = 1; i < timestamps.length; i++) {
          if (timestamps[i] < timestamps[i - 1]) {
            outOfOrderSessions.push(sessionId);
            break;
          }
        }
      });

      return {
        passed: outOfOrderSessions.length === 0,
        message: outOfOrderSessions.length > 0 ? `${outOfOrderSessions.length} sessions have out-of-order events` : undefined,
        details: { outOfOrderSessions }
      };
    }
  }
];

/**
 * Telemetry Validator Class
 */
export class TelemetryValidator {
  private config: ValidationConfig;
  private rules: ValidationRule[];

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = {
      inputFile: '',
      outputPath: 'test-results',
      rules: BUILT_IN_RULES,
      verbose: false,
      autoFix: false,
      detailedReport: true,
      ...config
    };

    this.rules = this.config.rules;
  }

  /**
   * Load telemetry data from file
   */
  private loadData(filePath: string): any[] {
    try {
      if (!existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (!Array.isArray(data)) {
        throw new Error('Telemetry data must be an array');
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to load telemetry data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Run all validation rules
   */
  private runValidations(data: any[]): ValidationReport['results'] {
    const results: ValidationReport['results'] = [];

    for (const rule of this.rules) {
      const startTime = Date.now();
      const result = rule.validate(data);
      const duration = Date.now() - startTime;

      // Count affected records if details available
      let count = 0;
      if (result.details) {
        if (Array.isArray(result.details.missingFields)) {
          count = result.details.missingFields.length;
        } else if (Array.isArray(result.details.invalidTimestamps)) {
          count = result.details.invalidTimestamps.length;
        } else if (Array.isArray(result.details.invalidSessions)) {
          count = result.details.invalidSessions.length;
        } else if (Array.isArray(result.details.duplicates)) {
          count = result.details.duplicates.length;
        }
      }

      results.push({
        rule: rule.id,
        severity: rule.severity,
        passed: result.passed,
        message: result.message,
        count
      });

      if (this.config.verbose) {
        console.log(`[${rule.severity.toUpperCase()}] ${rule.id}: ${result.passed ? 'PASSED' : 'FAILED'} (${duration}ms)`);
        if (result.message) {
          console.log(`  ${result.message}`);
        }
      }
    }

    return results;
  }

  /**
   * Apply auto-fixes if enabled
   */
  private applyAutoFixes(data: any[]): { fixedData: any[]; fixedIssues: string[] } {
    const fixedIssues: string[] = [];
    let fixedData = [...data];

    if (!this.config.autoFix) {
      return { fixedData, fixedIssues };
    }

    for (const rule of this.rules) {
      if (!rule.fix) continue;

      try {
        const result = rule.validate(fixedData);
        if (!result.passed) {
          fixedData = rule.fix(fixedData);
          fixedIssues.push(`Applied auto-fix for rule: ${rule.id}`);
          
          if (this.config.verbose) {
            console.log(`[AUTO-FIX] Applied fix for ${rule.id}`);
          }
        }
      } catch (error) {
        console.warn(`[AUTO-FIX] Failed to apply fix for ${rule.id}:`, error);
      }
    }

    return { fixedData, fixedIssues };
  }

  /**
   * Calculate validation score
   */
  private calculateValidationScore(results: ValidationReport['results']): number {
    let totalWeight = 0;
    let passedWeight = 0;

    const severityWeights = {
      error: 10,
      warning: 5,
      info: 1
    };

    results.forEach(result => {
      const weight = severityWeights[result.severity as keyof typeof severityWeights];
      totalWeight += weight;
      
      if (result.passed) {
        passedWeight += weight;
      }
    });

    return totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 100;
  }

  /**
   * Generate validation report
   */
  private generateReport(
    data: any[],
    results: ValidationReport['results'],
    fixedIssues: string[],
    processingTime: number
  ): ValidationReport {
    const totalErrors = results.filter(r => r.severity === 'error' && !r.passed).length;
    const totalWarnings = results.filter(r => r.severity === 'warning' && !r.passed).length;
    const totalInfo = results.filter(r => r.severity === 'info' && !r.passed).length;
    
    const recordsWithIssues = results
      .filter(r => !r.passed)
      .reduce((sum, r) => sum + r.count, 0);

    return {
      timestamp: new Date().toISOString(),
      inputFile: this.config.inputFile,
      totalRecords: data.length,
      results,
      summary: {
        totalErrors,
        totalWarnings,
        totalInfo,
        recordsWithIssues,
        validationScore: this.calculateValidationScore(results)
      },
      fixedIssues,
      processingTime
    };
  }

  /**
   * Save report to file
   */
  private saveReport(report: ValidationReport): string {
    // Ensure output directory exists
    if (!existsSync(this.config.outputPath)) {
      mkdirSync(this.config.outputPath, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = join(this.config.outputPath, `telemetry-validation-${timestamp}.json`);
    
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    return reportPath;
  }

  /**
   * Validate telemetry data
   */
  async validate(): Promise<ValidationReport> {
    const startTime = Date.now();

    if (this.config.verbose) {
      console.log(`🔍 Loading telemetry data from: ${this.config.inputFile}`);
    }

    const data = this.loadData(this.config.inputFile);

    if (this.config.verbose) {
      console.log(`📊 Loaded ${data.length} telemetry records`);
    }

    // Apply auto-fixes if enabled
    const { fixedData, fixedIssues } = this.applyAutoFixes(data);

    // Run validations
    const results = this.runValidations(fixedData);

    // Generate report
    const processingTime = Date.now() - startTime;
    const report = this.generateReport(fixedData, results, fixedIssues, processingTime);

    // Save report
    const reportPath = this.saveReport(report);

    if (this.config.verbose) {
      console.log(`📋 Validation report saved to: ${reportPath}`);
      console.log(`📊 Validation Score: ${report.summary.validationScore}/100`);
      console.log(`⏱️ Processing Time: ${processingTime}ms`);
    }

    return report;
  }

  /**
   * Add custom validation rule
   */
  addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  /**
   * Get available rules
   */
  getRules(): ValidationRule[] {
    return [...this.rules];
  }
}

/**
 * CLI interface
 */
async function main() {
  program
    .name('telemetry-validator')
    .description('CLI tool for validating telemetry data integrity')
    .version('1.0.0')
    .requiredOption('-i, --input <file>', 'Input telemetry file (JSON)')
    .option('-o, --output <dir>', 'Output directory for reports', 'test-results')
    .option('-v, --verbose', 'Verbose logging', false)
    .option('--auto-fix', 'Automatically fix issues when possible', false)
    .option('--no-detailed-report', 'Generate minimal report', false)
    .action(async (options) => {
      const validator = new TelemetryValidator({
        inputFile: options.input,
        outputPath: options.output,
        verbose: options.verbose,
        autoFix: options.autoFix,
        detailedReport: options.detailedReport,
      });

      try {
        const report = await validator.validate();
        
        console.log('\n📊 Telemetry Validation Results:');
        console.log(`✅ Validation Score: ${report.summary.validationScore}/100`);
        console.log(`📁 Input File: ${report.inputFile}`);
        console.log(`📈 Total Records: ${report.totalRecords}`);
        console.log(`❌ Errors: ${report.summary.totalErrors}`);
        console.log(`⚠️ Warnings: ${report.summary.totalWarnings}`);
        console.log(`ℹ️ Info: ${report.summary.totalInfo}`);
        console.log(`🔧 Fixed Issues: ${report.fixedIssues.length}`);
        console.log(`⏱️ Processing Time: ${report.processingTime}ms`);
        
        if (report.summary.validationScore < 80) {
          console.log('\n⚠️ Validation score below 80%. Review the detailed report for issues.');
          process.exit(1);
        } else {
          console.log('\n✅ Telemetry data validation passed!');
          process.exit(0);
        }
      } catch (error) {
        console.error('❌ Validation failed:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  await program.parseAsync();
}

// Run CLI if called directly
if (require.main === module) {
  main().catch(console.error);
}

export default TelemetryValidator;
