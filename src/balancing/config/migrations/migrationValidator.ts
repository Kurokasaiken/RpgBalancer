/**
 * Migration Validation and Rollback System
 * 
 * Comprehensive validation system for configuration migrations with
 * rollback capabilities, integrity checks, and audit trails.
 */

import type { BalancerConfig } from '../types';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import { ConfigMigrator, type MigrationResult, type MigrationChange } from './configMigrator';

/**
 * Validation rule interface
 */
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  validate: (config: BalancerConfig, context: ValidationContext) => ValidationResult;
}

/**
 * Validation context
 */
export interface ValidationContext {
  sourceVersion: string;
  targetVersion: string;
  migrationChanges: MigrationChange[];
  timestamp: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  details?: Record<string, unknown>;
  suggestions?: string[];
}

/**
 * Migration audit entry
 */
export interface MigrationAuditEntry {
  id: string;
  timestamp: string;
  operation: 'migrate' | 'rollback' | 'validate';
  sourceFile: string;
  targetFile?: string;
  backupFile?: string;
  sourceVersion: string;
  targetVersion: string;
  changes: MigrationChange[];
  validationResults: ValidationResult[];
  success: boolean;
  errors: string[];
  warnings: string[];
  duration: number;
  metadata?: Record<string, unknown>;
}

/**
 * Rollback point information
 */
export interface RollbackPoint {
  id: string;
  timestamp: string;
  originalFile: string;
  backupFile: string;
  version: string;
  checksum: string;
  metadata: Record<string, unknown>;
}

/**
 * Built-in validation rules
 */
export const BUILT_IN_VALIDATION_RULES: ValidationRule[] = [
  {
    id: 'core-stats-presence',
    name: 'Core Stats Presence',
    description: 'Ensure all core stats (hp, damage, htk) are present',
    severity: 'error',
    validate: (config, context) => {
      const coreStats = ['hp', 'damage', 'htk'];
      const missing = coreStats.filter(stat => !config.stats[stat]);
      
      return {
        valid: missing.length === 0,
        rule: 'core-stats-presence',
        severity: 'error',
        message: missing.length > 0 
          ? `Missing core stats: ${missing.join(', ')}`
          : 'All core stats present',
        details: { missing, present: coreStats.filter(stat => config.stats[stat]) },
        suggestions: missing.map(stat => `Add core stat '${stat}' with default configuration`),
      };
    },
  },

  {
    id: 'core-stats-immutable',
    name: 'Core Stats Immutability',
    description: 'Core stats should not be deletable or have their fundamental properties changed',
    severity: 'error',
    validate: (config, context) => {
      const coreStats = ['hp', 'damage', 'htk'];
      const issues: string[] = [];
      
      coreStats.forEach(statId => {
        const stat = config.stats[statId];
        if (stat) {
          if (!stat.isCore) {
            issues.push(`${statId}: isCore flag must be true`);
          }
          if (stat.isLocked) {
            issues.push(`${statId}: should not be locked`);
          }
          if (stat.isHidden) {
            issues.push(`${statId}: should not be hidden`);
          }
        }
      });
      
      return {
        valid: issues.length === 0,
        rule: 'core-stats-immutable',
        severity: 'error',
        message: issues.length > 0 ? issues.join('; ') : 'Core stats properly configured',
        details: { issues },
        suggestions: ['Ensure all core stats have isCore: true, isLocked: false, isHidden: false'],
      };
    },
  },

  {
    id: 'stat-formula-validity',
    name: 'Stat Formula Validity',
    description: 'Validate derived stat formulas reference existing stats',
    severity: 'error',
    validate: (config, context) => {
      const derivedStats = Object.entries(config.stats)
        .filter(([_, stat]) => stat.isDerived && stat.formula);
      
      const issues: string[] = [];
      
      derivedStats.forEach(([statId, stat]) => {
        if (stat.formula) {
          // Extract stat references from formula
          const statRefs = stat.formula.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
          
          statRefs.forEach(ref => {
            if (!config.stats[ref]) {
              issues.push(`${statId}: Formula references non-existent stat '${ref}'`);
            }
          });
        }
      });
      
      return {
        valid: issues.length === 0,
        rule: 'stat-formula-validity',
        severity: 'error',
        message: issues.length > 0 ? issues.join('; ') : 'All formulas valid',
        details: { issues, derivedStats: derivedStats.map(([id, stat]) => ({ id, formula: stat.formula })) },
        suggestions: ['Ensure all formula references exist in the stats configuration'],
      };
    },
  },

  {
    id: 'card-stat-references',
    name: 'Card Stat References',
    description: 'Validate all cards reference existing stats',
    severity: 'error',
    validate: (config, context) => {
      const issues: string[] = [];
      
      Object.entries(config.cards).forEach(([cardId, card]) => {
        card.statIds.forEach(statId => {
          if (!config.stats[statId]) {
            issues.push(`${cardId}: References non-existent stat '${statId}'`);
          }
        });
      });
      
      return {
        valid: issues.length === 0,
        rule: 'card-stat-references',
        severity: 'error',
        message: issues.length > 0 ? issues.join('; ') : 'All card references valid',
        details: { issues },
        suggestions: ['Remove invalid stat references or add missing stats'],
      };
    },
  },

  {
    id: 'preset-weight-references',
    name: 'Preset Weight References',
    description: 'Validate all preset weights reference existing stats',
    severity: 'error',
    validate: (config, context) => {
      const issues: string[] = [];
      
      Object.entries(config.presets).forEach(([presetId, preset]) => {
        Object.keys(preset.weights).forEach(statId => {
          if (!config.stats[statId]) {
            issues.push(`${presetId}: References non-existent stat '${statId}'`);
          }
        });
      });
      
      return {
        valid: issues.length === 0,
        rule: 'preset-weight-references',
        severity: 'error',
        message: issues.length > 0 ? issues.join('; ') : 'All preset references valid',
        details: { issues },
        suggestions: ['Remove invalid weight references or add missing stats'],
      };
    },
  },

  {
    id: 'weight-consistency',
    name: 'Weight Consistency',
    description: 'Check for reasonable weight values and distributions',
    severity: 'warning',
    validate: (config, context) => {
      const issues: string[] = [];
      const weights = Object.values(config.stats).map(stat => stat.weight);
      
      // Check for extreme values
      weights.forEach((weight, index) => {
        if (weight < 0) {
          issues.push(`Stat ${index}: Negative weight ${weight}`);
        }
        if (weight > 100) {
          issues.push(`Stat ${index}: Very high weight ${weight}`);
        }
      });
      
      // Check for all zero weights (except derived)
      const nonDerivedWeights = Object.values(config.stats)
        .filter(stat => !stat.isDerived)
        .map(stat => stat.weight);
      
      if (nonDerivedWeights.every(w => w === 0)) {
        issues.push('All non-derived stats have zero weight');
      }
      
      return {
        valid: issues.length === 0,
        rule: 'weight-consistency',
        severity: 'warning',
        message: issues.length > 0 ? issues.join('; ') : 'Weights appear reasonable',
        details: { issues, weightStats: { min: Math.min(...weights), max: Math.max(...weights), avg: weights.reduce((a, b) => a + b, 0) / weights.length } },
        suggestions: ['Review extreme weight values and ensure meaningful distributions'],
      };
    },
  },

  {
    id: 'migration-completeness',
    name: 'Migration Completeness',
    description: 'Check if migration added expected properties and metadata',
    severity: 'info',
    validate: (config, context) => {
      const issues: string[] = [];
      
      // Check for migration metadata
      if (!config.metadata?.migrated) {
        issues.push('Missing migration metadata');
      }
      
      if (!config.metadata?.sourceVersion) {
        issues.push('Missing source version in metadata');
      }
      
      if (!config.metadata?.migrationDate) {
        issues.push('Missing migration date in metadata');
      }
      
      return {
        valid: issues.length === 0,
        rule: 'migration-completeness',
        severity: 'info',
        message: issues.length > 0 ? issues.join('; ') : 'Migration metadata complete',
        details: { issues, metadata: config.metadata },
        suggestions: ['Ensure migration process adds proper metadata'],
      };
    },
  },
];

/**
 * Migration validator class
 */
export class MigrationValidator {
  private static auditLog: MigrationAuditEntry[] = [];
  private static rollbackPoints: Map<string, RollbackPoint> = new Map();

  /**
   * Validate a configuration against all rules
   */
  static async validate(
    config: BalancerConfig,
    context: ValidationContext,
    customRules: ValidationRule[] = []
  ): Promise<ValidationResult[]> {
    const allRules = [...BUILT_IN_VALIDATION_RULES, ...customRules];
    const results: ValidationResult[] = [];

    for (const rule of allRules) {
      try {
        const result = rule.validate(config, context);
        results.push(result);
      } catch (error) {
        results.push({
          valid: false,
          rule: rule.id,
          severity: 'error',
          message: `Rule execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    return results;
  }

  /**
   * Validate a migration result
   */
  static async validateMigration(
    result: MigrationResult,
    migratedConfig: BalancerConfig
  ): Promise<ValidationResult[]> {
    const context: ValidationContext = {
      sourceVersion: result.sourceVersion,
      targetVersion: result.targetVersion,
      migrationChanges: result.changes,
      timestamp: new Date().toISOString(),
    };

    return this.validate(migratedConfig, context);
  }

  /**
   * Create a rollback point
   */
  static async createRollbackPoint(
    originalFile: string,
    backupFile: string,
    version: string,
    metadata: Record<string, unknown> = {}
  ): Promise<RollbackPoint> {
    const originalData = await loadData(originalFile);
    const checksum = this.calculateChecksum(originalData);

    const rollbackPoint: RollbackPoint = {
      id: `rollback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      originalFile,
      backupFile,
      version,
      checksum,
      metadata,
    };

    this.rollbackPoints.set(rollbackPoint.id, rollbackPoint);
    await this.saveRollbackPoints();

    return rollbackPoint;
  }

  /**
   * Perform rollback with integrity validation
   */
  static async performRollback(rollbackPointId: string): Promise<{
    success: boolean;
    error?: string;
    auditEntry?: MigrationAuditEntry;
  }> {
    const rollbackPoint = this.rollbackPoints.get(rollbackPointId);
    
    if (!rollbackPoint) {
      return {
        success: false,
        error: `Rollback point not found: ${rollbackPointId}`,
      };
    }

    const startTime = Date.now();
    const auditEntry: MigrationAuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      operation: 'rollback',
      sourceFile: rollbackPoint.backupFile,
      targetFile: rollbackPoint.originalFile,
      sourceVersion: rollbackPoint.version,
      targetVersion: 'unknown',
      changes: [],
      validationResults: [],
      success: false,
      errors: [],
      warnings: [],
      duration: 0,
      metadata: rollbackPoint.metadata,
    };

    try {
      // Validate backup file integrity
      const backupData = await loadData(rollbackPoint.backupFile);
      const currentChecksum = this.calculateChecksum(backupData);
      
      if (currentChecksum !== rollbackPoint.checksum) {
        throw new Error('Backup file integrity check failed');
      }

      // Perform rollback
      await saveData(rollbackPoint.originalFile, backupData);
      
      // Validate rolled back configuration
      const validation = ConfigMigrator.validateConfig(backupData);
      auditEntry.validationResults = validation.errors.map(error => ({
        valid: false,
        rule: 'schema-validation',
        severity: 'error' as const,
        message: error,
      }));

      auditEntry.success = validation.valid;
      auditEntry.duration = Date.now() - startTime;

      if (!validation.valid) {
        auditEntry.errors = validation.errors;
      }

      // Log audit entry
      this.auditLog.push(auditEntry);
      await this.saveAuditLog();

      return {
        success: true,
        auditEntry,
      };

    } catch (error) {
      auditEntry.success = false;
      auditEntry.errors = [error instanceof Error ? error.message : 'Unknown error'];
      auditEntry.duration = Date.now() - startTime;
      
      this.auditLog.push(auditEntry);
      await this.saveAuditLog();

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        auditEntry,
      };
    }
  }

  /**
   * Log migration to audit trail
   */
  static async logMigration(result: MigrationResult, migratedConfig: BalancerConfig): Promise<void> {
    const validationResults = await this.validateMigration(result, migratedConfig);
    
    const auditEntry: MigrationAuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      operation: 'migrate',
      sourceFile: result.inputFile,
      targetFile: result.outputFile,
      backupFile: result.backupFile,
      sourceVersion: result.sourceVersion,
      targetVersion: result.targetVersion,
      changes: result.changes,
      validationResults,
      success: result.success,
      errors: result.errors,
      warnings: result.warnings,
      duration: result.duration,
      metadata: {
        validationResult: validationResults.every(r => r.valid),
        errorCount: validationResults.filter(r => r.severity === 'error').length,
        warningCount: validationResults.filter(r => r.severity === 'warning').length,
      },
    };

    this.auditLog.push(auditEntry);
    await this.saveAuditLog();
  }

  /**
   * Get audit history
   */
  static getAuditHistory(limit?: number): MigrationAuditEntry[] {
    const sorted = [...this.auditLog].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return limit ? sorted.slice(0, limit) : sorted;
  }

  /**
   * Get available rollback points
   */
  static getRollbackPoints(): RollbackPoint[] {
    return Array.from(this.rollbackPoints.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Generate validation report
   */
  static generateValidationReport(results: ValidationResult[]): string {
    const lines: string[] = [];
    
    lines.push('# Migration Validation Report');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');

    // Summary
    const total = results.length;
    const errors = results.filter(r => r.severity === 'error').length;
    const warnings = results.filter(r => r.severity === 'warning').length;
    const info = results.filter(r => r.severity === 'info').length;
    
    lines.push('## Summary');
    lines.push(`- Total Rules: ${total}`);
    lines.push(`- Errors: ${errors}`);
    lines.push(`- Warnings: ${warnings}`);
    lines.push(`- Info: ${info}`);
    lines.push(`- Overall Status: ${errors === 0 ? '✅ Passed' : '❌ Failed'}`);
    lines.push('');

    // Group by severity
    const bySeverity = {
      error: results.filter(r => r.severity === 'error'),
      warning: results.filter(r => r.severity === 'warning'),
      info: results.filter(r => r.severity === 'info'),
    };

    Object.entries(bySeverity).forEach(([severity, items]) => {
      if (items.length > 0) {
        lines.push(`## ${severity.charAt(0).toUpperCase() + severity.slice(1)}s`);
        items.forEach(result => {
          const icon = severity === 'error' ? '❌' : severity === 'warning' ? '⚠️' : 'ℹ️';
          lines.push(`### ${icon} ${result.rule}`);
          lines.push(`**Message:** ${result.message}`);
          
          if (result.details) {
            lines.push('**Details:**');
            Object.entries(result.details).forEach(([key, value]) => {
              lines.push(`- ${key}: ${JSON.stringify(value)}`);
            });
          }
          
          if (result.suggestions && result.suggestions.length > 0) {
            lines.push('**Suggestions:**');
            result.suggestions.forEach(suggestion => {
              lines.push(`- ${suggestion}`);
            });
          }
          
          lines.push('');
        });
      }
    });

    return lines.join('\n');
  }

  /**
   * Calculate checksum for data integrity
   */
  private static calculateChecksum(data: unknown): string {
    // Simple hash implementation for checksum
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Save audit log to storage
   */
  private static async saveAuditLog(): Promise<void> {
    try {
      await saveData('migration_audit_log', this.auditLog);
    } catch (error) {
      console.warn('Failed to save audit log:', error);
    }
  }

  /**
   * Save rollback points to storage
   */
  private static async saveRollbackPoints(): Promise<void> {
    try {
      await saveData('migration_rollback_points', Array.from(this.rollbackPoints.entries()));
    } catch (error) {
      console.warn('Failed to save rollback points:', error);
    }
  }

  /**
   * Load audit log from storage
   */
  private static async loadAuditLog(): Promise<void> {
    try {
      const data = await loadData('migration_audit_log', []);
      this.auditLog = Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('Failed to load audit log:', error);
      this.auditLog = [];
    }
  }

  /**
   * Load rollback points from storage
   */
  private static async loadRollbackPoints(): Promise<void> {
    try {
      const data = await loadData('migration_rollback_points', []);
      this.rollbackPoints = new Map(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn('Failed to load rollback points:', error);
      this.rollbackPoints = new Map();
    }
  }

  /**
   * Initialize validator (load stored data)
   */
  static async initialize(): Promise<void> {
    await Promise.all([
      this.loadAuditLog(),
      this.loadRollbackPoints(),
    ]);
  }
}
