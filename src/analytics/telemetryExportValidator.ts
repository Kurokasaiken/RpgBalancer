/**
 * Telemetry Export Validator for Punch Club
 * 
 * Validates telemetry exports to ensure 100% pass rate for PC-M2E requirements
 * with Zod schema validation and comprehensive error reporting
 */

import { z } from 'zod';
import { createHeadlessDiagnostics } from '@/shared/telemetry/headlessDiagnostics';
import {
  PunchClubTelemetryEventSchema,
  PunchClubExportSchema,
} from '@/analytics/telemetry/punchClubTelemetrySchemas';

const diagnostics = createHeadlessDiagnostics('TelemetryExportValidator', 'analytics');

/**
 * Telemetry event validation result
 */
export interface TelemetryValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  /** Validation errors if any */
  errors: ValidationError[];
  /** Warnings if any */
  warnings: ValidationWarning[];
  /** Validation statistics */
  stats: ValidationStats;
  /** Processing time in milliseconds */
  processingTime: number;
}

/**
 * Validation error details
 */
export interface ValidationError {
  /** Error type */
  type: 'schema' | 'required' | 'format' | 'range' | 'type';
  /** Field path where error occurred */
  field: string;
  /** Error message */
  message: string;
  /** Original value that caused error */
  value: unknown;
  /** Severity level */
  severity: 'error' | 'critical';
}

/**
 * Validation warning details
 */
export interface ValidationWarning {
  /** Warning type */
  type: 'deprecated' | 'recommendation' | 'performance';
  /** Field path */
  field: string;
  /** Warning message */
  message: string;
  /** Original value */
  value: unknown;
}

/**
 * Validation statistics
 */
export interface ValidationStats {
  /** Total events processed */
  totalEvents: number;
  /** Valid events */
  validEvents: number;
  /** Invalid events */
  invalidEvents: number;
  /** Events with warnings */
  eventsWithWarnings: number;
  /** Pass rate percentage */
  passRate: number;
}

/**
 * Base telemetry event schema
 */
const BaseTelemetryEventSchema = z.object({
  eventType: z.string(),
  timestamp: z.number().int().positive(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  data: z.record(z.unknown()),
});

/**
 * PWA install event schema
 */
const PWAInstallEventSchema = BaseTelemetryEventSchema.extend({
  eventType: z.enum([
    'pwa_install_prompt_available',
    'pwa_install_prompt_shown', 
    'pwa_install_success',
    'pwa_install_dismissed',
    'pwa_install_error'
  ]),
  data: z.object({
    userAgent: z.string().optional(),
    platform: z.string().optional(),
    promptShown: z.boolean().optional(),
    installAttempts: z.number().int().positive().optional(),
    error: z.string().optional(),
  }),
});

/**
 * PWA performance event schema
 */
const PWAPerformanceEventSchema = BaseTelemetryEventSchema.extend({
  eventType: z.enum([
    'pwa_cold_start',
    'pwa_sw_activation',
    'pwa_sw_update_success',
    'pwa_sw_update_failed',
    'pwa_cache_hit',
    'pwa_cache_miss'
  ]),
  data: z.object({
    coldStartTime: z.number().positive().optional(),
    swVersion: z.string().optional(),
    cacheSize: z.number().positive().optional(),
    updateDuration: z.number().positive().optional(),
  }),
});

/**
 * Punch Club landing event schema
 */
const LandingEventSchema = BaseTelemetryEventSchema.extend({
  eventType: z.enum([
    'landing_view',
    'cta_click',
    'opt_out',
    'consent_accepted',
    'shared_link_accessed',
    'session_started',
    'launch_click',
    'redirect_completed'
  ]),
  data: z.object({
    source: z.string().optional(),
    medium: z.string().optional(),
    campaign: z.string().optional(),
    consentGiven: z.boolean().optional(),
    redirectUrl: z.string().optional(),
  }),
});

/**
 * Stress test telemetry event schema
 */
const StressTestEventSchema = BaseTelemetryEventSchema.extend({
  eventType: z.enum([
    'stress_run_completed',
    'stress_run_failed',
    'stress_batch_completed'
  ]),
  data: z.object({
    runId: z.string(),
    scenario: z.string(),
    iterations: z.number().int().positive(),
    duration: z.number().positive(),
    success: z.boolean(),
    error: z.string().optional(),
  }),
});

/**
 * Union of all telemetry event schemas
 */
const TelemetryEventSchema = z.discriminatedUnion('eventType', [
  PWAInstallEventSchema,
  PWAPerformanceEventSchema,
  LandingEventSchema,
  StressTestEventSchema,
]);

/**
 * Telemetry export batch schema
 */
const TelemetryExportSchema = z.object({
  exportId: z.string().uuid(),
  exportTimestamp: z.number().int().positive(),
  version: z.string(),
  source: z.string(),
  events: z.array(TelemetryEventSchema),
  metadata: z.object({
    totalEvents: z.number().int().positive(),
    dateRange: z.object({
      start: z.number().int().positive(),
      end: z.number().int().positive(),
    }),
    filters: z.record(z.unknown()).optional(),
  }),
});

/**
 * Telemetry export validator configuration
 */
export interface TelemetryValidatorConfig {
  /** Enable strict validation */
  strictMode: boolean;
  /** Maximum events per batch */
  maxEventsPerBatch: number;
  /** Enable performance warnings */
  enablePerformanceWarnings: boolean;
  /** Custom validation rules */
  customRules: CustomValidationRule[];
}

/**
 * Custom validation rule
 */
export interface CustomValidationRule {
  /** Rule identifier */
  id: string;
  /** Event types this rule applies to */
  eventTypes: string[];
  /** Validation function */
  validate: (event: unknown) => ValidationError | ValidationWarning | null;
  /** Rule description */
  description: string;
}

/**
 * Default validator configuration
 */
export const DEFAULT_TELEMETRY_VALIDATOR_CONFIG: TelemetryValidatorConfig = {
  strictMode: true,
  maxEventsPerBatch: 10000,
  enablePerformanceWarnings: true,
  customRules: [],
};

/**
 * Telemetry export validator class
 */
export class TelemetryExportValidator {
  private config: TelemetryValidatorConfig;

  constructor(config: Partial<TelemetryValidatorConfig> = {}) {
    this.config = { ...DEFAULT_TELEMETRY_VALIDATOR_CONFIG, ...config };
  }

  /**
   * Validate telemetry export data
   */
  validateExport(exportData: unknown): TelemetryValidationResult {
    const startTime = performance.now();
    
    const result: TelemetryValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      stats: {
        totalEvents: 0,
        validEvents: 0,
        invalidEvents: 0,
        eventsWithWarnings: 0,
        passRate: 0,
      },
      processingTime: 0,
    };

    try {
      // Validate export structure using Punch Club schema
      const exportResult = PunchClubExportSchema.safeParse(exportData);
      
      if (!exportResult.success) {
        result.isValid = false;
        result.errors.push({
          type: 'schema',
          field: 'export',
          message: 'Invalid export structure',
          value: exportData,
          severity: 'critical',
        });
        
        diagnostics.error('Export validation failed', { 
          errors: exportResult.error.issues 
        });
        
        return this.finalizeResult(result, startTime);
      }

      const validatedExport = exportResult.data;
      result.stats.totalEvents = validatedExport.events.length;

      // Validate each event using Punch Club schema
      validatedExport.events.forEach((event, index) => {
        const eventValidation = this.validateEvent(event, index);
        
        if (eventValidation.errors.length > 0) {
          result.isValid = false;
          result.errors.push(...eventValidation.errors);
          result.stats.invalidEvents++;
        } else {
          result.stats.validEvents++;
        }

        if (eventValidation.warnings.length > 0) {
          result.warnings.push(...eventValidation.warnings);
          result.stats.eventsWithWarnings++;
        }
      });

      // Apply custom validation rules
      this.applyCustomRules(validatedExport.events, result);

      // Calculate pass rate
      result.stats.passRate = result.stats.totalEvents > 0 
        ? Math.round((result.stats.validEvents / result.stats.totalEvents) * 100)
        : 0;

      // Final validation check
      if (this.config.strictMode && result.stats.passRate < 100) {
        result.isValid = false;
      }

      diagnostics.info('Export validation completed', {
        totalEvents: result.stats.totalEvents,
        passRate: result.stats.passRate,
        errors: result.errors.length,
        warnings: result.warnings.length,
      });

    } catch (error) {
      result.isValid = false;
      result.errors.push({
        type: 'schema',
        field: 'validation',
        message: error instanceof Error ? error.message : 'Unknown validation error',
        value: error,
        severity: 'critical',
      });
      
      diagnostics.error('Validation exception', { error });
    }

    return this.finalizeResult(result, startTime);
  }

  /**
   * Validate individual event
   */
  private validateEvent(event: unknown, index: number): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const result = { errors: [] as ValidationError[], warnings: [] as ValidationWarning[] };

    try {
      // Schema validation using Punch Club schema
      const schemaResult = PunchClubTelemetryEventSchema.safeParse(event);
      
      if (!schemaResult.success) {
        result.errors.push({
          type: 'schema',
          field: `events[${index}]`,
          message: 'Invalid event structure',
          value: event,
          severity: 'error',
        });
        
        return result;
      }

      const validatedEvent = schemaResult.data;

      // Business logic validations
      this.validateEventBusinessRules(validatedEvent, index, result);

      // Performance warnings
      if (this.config.enablePerformanceWarnings) {
        this.checkPerformanceIssues(validatedEvent, index, result);
      }

    } catch (error) {
      result.errors.push({
        type: 'schema',
        field: `events[${index}]`,
        message: error instanceof Error ? error.message : 'Event validation failed',
        value: event,
        severity: 'critical',
      });
    }

    return result;
  }

  /**
   * Validate event business rules
   */
  private validateEventBusinessRules(
    event: z.infer<typeof PunchClubTelemetryEventSchema>,
    index: number,
    result: { errors: ValidationError[]; warnings: ValidationWarning[] }
  ): void {
    // Timestamp validation
    const now = Date.now();
    if (event.timestamp > now) {
      result.errors.push({
        type: 'range',
        field: `events[${index}].timestamp`,
        message: 'Timestamp cannot be in the future',
        value: event.timestamp,
        severity: 'error',
      });
    }

    // Very old timestamps (more than 1 year)
    const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
    if (event.timestamp < oneYearAgo) {
      result.warnings.push({
        type: 'recommendation',
        field: `events[${index}].timestamp`,
        message: 'Very old timestamp detected',
        value: event.timestamp,
      });
    }

    // Event-specific validations
    switch (event.eventType) {
      case 'pwa_install_success':
        if (!event.data.promptShown) {
          result.warnings.push({
            type: 'recommendation',
            field: `events[${index}].data.promptShown`,
            message: 'Install success without prompt shown flag',
            value: event.data.promptShown,
          });
        }
        break;

      case 'pwa_cold_start':
        if (!event.data.coldStartTime) {
          result.errors.push({
            type: 'required',
            field: `events[${index}].data.coldStartTime`,
            message: 'Cold start time is required for pwa_cold_start events',
            value: event.data.coldStartTime,
            severity: 'error',
          });
        }
        break;

      case 'stress_run_completed':
        if (!event.data.runId) {
          result.errors.push({
            type: 'required',
            field: `events[${index}].data.runId`,
            message: 'Run ID is required for stress test events',
            value: event.data.runId,
            severity: 'error',
          });
        }
        break;
    }
  }

  /**
   * Check for performance issues
   */
  private checkPerformanceIssues(
    event: z.infer<typeof PunchClubTelemetryEventSchema>,
    index: number,
    result: { errors: ValidationError[]; warnings: ValidationWarning[] }
  ): void {
    // Large data objects
    const dataSize = JSON.stringify(event.data).length;
    if (dataSize > 10000) { // 10KB
      result.warnings.push({
        type: 'performance',
        field: `events[${index}].data`,
        message: `Large event data (${dataSize} bytes) may impact performance`,
        value: dataSize,
      });
    }

    // Missing session ID for user events
    const userEvents = ['pwa_install_success', 'cta_click', 'consent_accepted'];
    if (userEvents.includes(event.eventType) && !event.sessionId) {
      result.warnings.push({
        type: 'recommendation',
        field: `events[${index}].sessionId`,
        message: 'Session ID recommended for user events',
        value: event.sessionId,
      });
    }
  }

  /**
   * Apply custom validation rules
   */
  private applyCustomRules(
    events: z.infer<typeof PunchClubTelemetryEventSchema>[],
    result: TelemetryValidationResult
  ): void {
    for (const rule of this.config.customRules) {
      events.forEach((event) => {
        if (rule.eventTypes.includes(event.eventType)) {
          const ruleResult = rule.validate(event);
          
          if (ruleResult) {
            if (ruleResult.severity === 'critical' || ruleResult.severity === 'error') {
              result.errors.push(ruleResult as ValidationError);
            } else {
              result.warnings.push(ruleResult as ValidationWarning);
            }
          }
        }
      });
    }
  }

  /**
   * Finalize validation result
   */
  private finalizeResult(
    result: TelemetryValidationResult,
    startTime: number
  ): TelemetryValidationResult {
    result.processingTime = Math.round(performance.now() - startTime);
    return result;
  }

  /**
   * Get validation summary
   */
  getValidationSummary(result: TelemetryValidationResult): string {
    const lines = [
      `Telemetry Validation Summary`,
      `===========================`,
      `Valid: ${result.isValid ? '✅' : '❌'}`,
      `Pass Rate: ${result.stats.passRate}%`,
      `Total Events: ${result.stats.totalEvents}`,
      `Valid Events: ${result.stats.validEvents}`,
      `Invalid Events: ${result.stats.invalidEvents}`,
      `Events with Warnings: ${result.stats.eventsWithWarnings}`,
      `Processing Time: ${result.processingTime}ms`,
      '',
    ];

    if (result.errors.length > 0) {
      lines.push('Errors:');
      result.errors.forEach((error, index) => {
        lines.push(`${index + 1}. [${error.severity.toUpperCase()}] ${error.field}: ${error.message}`);
      });
      lines.push('');
    }

    if (result.warnings.length > 0) {
      lines.push('Warnings:');
      result.warnings.forEach((warning, index) => {
        lines.push(`${index + 1}. [${warning.type.toUpperCase()}] ${warning.field}: ${warning.message}`);
      });
      lines.push('');
    }

    return lines.join('\n');
  }
}

/**
 * Default validator instance
 */
export const defaultTelemetryValidator = new TelemetryExportValidator();

/**
 * Convenience function for quick validation
 */
export function validateTelemetryExport(
  exportData: unknown,
  config?: Partial<TelemetryValidatorConfig>
): TelemetryValidationResult {
  const validator = new TelemetryExportValidator(config);
  return validator.validateExport(exportData);
}
