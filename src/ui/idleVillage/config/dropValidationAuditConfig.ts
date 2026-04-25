/**
 * Idle Village Drop Validation Audit CLI Configuration
 * 
 * Configuration for drop validation audit system that checks
 * validation rules, telemetry consistency, and compliance with KS-030 standards.
 */

import { z } from 'zod';

/**
 * Validation rule types
 */
export const ValidationRuleTypeSchema = z.enum([
  'stat_tags',           // Resident stat tag validation
  'fatigue_threshold',    // Fatigue threshold validation
  'crew_limits',         // Crew capacity validation
  'activity_requirements', // Activity-specific requirements
  'location_constraints', // Location-specific constraints
  'time_restrictions',   // Time-based restrictions
  'resource_limits',     // Resource usage limits
  'custom_rule',        // Custom validation rules
]);

export type ValidationRuleType = z.infer<typeof ValidationRuleTypeSchema>;

/**
 * Validation severity levels
 */
export const ValidationSeveritySchema = z.enum([
  'info',      // Informational only
  'warning',   // Warning level
  'error',     // Error level
  'critical',  // Critical failure
]);

export type ValidationSeverity = z.infer<typeof ValidationSeveritySchema>;

/**
 * Validation result status
 */
export const ValidationStatusSchema = z.enum([
  'passed',    // Validation passed
  'failed',    // Validation failed
  'skipped',    // Validation skipped
  'error',     // Validation error occurred
  'timeout',   // Validation timeout
]);

export type ValidationStatus = z.infer<typeof ValidationStatusSchema>;

/**
 * Validation rule configuration
 */
export interface ValidationRule {
  /** Unique rule identifier */
  id: string;
  /** Rule name */
  name: string;
  /** Rule description */
  description: string;
  /** Rule type */
  type: ValidationRuleType;
  /** Severity level */
  severity: ValidationSeverity;
  /** Rule enabled status */
  enabled: boolean;
  /** Target validation contexts */
  targetContexts: string[];
  /** Rule parameters */
  parameters: Record<string, unknown>;
  /** Validation function */
  validator: string; // Reference to validator function
  /** Error message template */
  errorMessage: string;
  /** Success message template */
  successMessage: string;
  /** Tags for categorization */
  tags: string[];
  /** Metadata */
  metadata: {
    /** Rule version */
    version: string;
    /** Created timestamp */
    created: string;
    /** Modified timestamp */
    modified: string;
    /** Author */
    author: string;
    /** Dependencies */
    dependencies: string[];
    /** Documentation link */
    documentation?: string;
  };
}

/**
 * Validation context configuration
 */
export interface ValidationContext {
  /** Context identifier */
  id: string;
  /** Context name */
  name: string;
  /** Context description */
  description: string;
  /** Context type */
  type: 'location' | 'resident' | 'activity' | 'global';
  /** Context parameters */
  parameters: Record<string, unknown>;
  /** Validation rules to apply */
  rules: string[];
  /** Override settings */
  overrides: {
    /** Rule severity overrides */
    severityOverrides?: Record<string, ValidationSeverity>;
    /** Rule parameter overrides */
    parameterOverrides?: Record<string, Record<string, unknown>>;
  };
  /** Metadata */
  metadata: {
    /** Context version */
    version: string;
    /** Created timestamp */
    created: string;
    /** Modified timestamp */
    modified: string;
    /** Author */
    author: string;
    /** Documentation link */
    documentation?: string;
  };
}

/**
 * Validation audit configuration
 */
export interface ValidationAuditConfig {
  /** Audit name */
  name: string;
  /** Audit description */
  description: string;
  /** Audit scope */
  scope: {
    /** Contexts to audit */
    contexts: string[];
    /** Rule types to include */
    ruleTypes: ValidationRuleType[];
    /** Severities to include */
    severities: ValidationSeverity[];
    /** Tags to filter */
    tags?: string[];
  };
  /** Audit settings */
  settings: {
    /** Enable dry run mode */
    dryRun: boolean;
    /** Enable verbose logging */
    verbose: boolean;
    /** Enable progress reporting */
    progressReporting: boolean;
    /** Maximum execution time (ms) */
    maxExecutionTime: number;
    /** Batch size for processing */
    batchSize: number;
    /** Enable parallel processing */
    parallelProcessing: boolean;
    /** Maximum concurrent operations */
    maxConcurrentOps: number;
  };
  /** Output configuration */
  output: {
    /** Include detailed results */
    includeDetailedResults: boolean;
    /** Include summary statistics */
    includeSummary: boolean;
    /** Include rule details */
    includeRuleDetails: boolean;
    /** Include context information */
    includeContextInfo: boolean;
    /** Include metadata */
    includeMetadata: boolean;
    /** Export format */
    format: 'json' | 'csv' | 'markdown' | 'html';
    /** Output file path */
    outputPath?: string;
    /** Create timestamped filename */
    createTimestampedFilename: boolean;
  };
  /** Telemetry configuration */
  telemetry: {
    /** Enable telemetry emission */
    enabled: boolean;
    /** Track audit events */
    trackAuditEvents: boolean;
    /** Track validation results */
    trackValidationResults: boolean;
    /** Track rule violations */
    trackRuleViolations: boolean;
    /** Track compliance metrics */
    trackComplianceMetrics: boolean;
    /** Telemetry endpoint */
    endpoint?: string;
  };
  /** Compliance configuration */
  compliance: {
    /** Enable compliance checking */
    enabled: boolean;
    /** Compliance standards to check */
    standards: string[];
    /** Required rule coverage */
    requiredRuleCoverage: number;
    /** Maximum allowed failures per severity */
    maxFailuresPerSeverity: Record<ValidationSeverity, number>;
    /** Compliance threshold (0-1) */
    complianceThreshold: number;
    /** Enable auto-fix suggestions */
    enableAutoFix: boolean;
    /** Auto-fix strategies */
    autoFixStrategies: Record<string, string>;
  };
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Result identifier */
  id: string;
  /** Rule ID */
  ruleId: string;
  /** Context ID */
  contextId: string;
  /** Validation status */
  status: ValidationStatus;
  /** Validation timestamp */
  timestamp: number;
  /** Execution duration (ms) */
  duration: number;
  /** Validation data */
  data: {
    /** Input data */
    input: unknown;
    /** Expected result */
    expected?: unknown;
    /** Actual result */
    actual: unknown;
    /** Validation details */
    details: Record<string, unknown>;
    /** Error information */
    error?: {
      type: string;
      message: string;
      stack?: string;
      code?: string;
    };
  };
  /** Messages */
  messages: {
    /** Success message */
    success?: string;
    /** Warning message */
    warning?: string;
    /** Error message */
    error?: string;
    /** Info message */
    info?: string;
  };
  /** Metrics */
  metrics: {
    /** Validation score (0-1) */
    score: number;
    /** Confidence score (0-1) */
    confidence: number;
    /** Performance metrics */
    performance: {
      /** Execution time (ms) */
      executionTime: number;
      /** Memory usage */
      memoryUsage: number;
      /** CPU usage */
      cpuUsage: number;
    };
    /** Compliance metrics */
    compliance: {
      /** Compliance score (0-1) */
      score: number;
      /** Rule coverage */
      ruleCoverage: number;
      /** Standard compliance */
      standardCompliance: Record<string, boolean>;
    };
  };
  /** Tags */
  tags: string[];
  /** Metadata */
  metadata: {
    /** Result version */
    version: string;
    /** Created timestamp */
    created: string;
    /** Modified timestamp */
    modified: string;
    /** Auditor */
    auditor: string;
    /** Audit session ID */
    auditSessionId: string;
    /** Environment */
    environment: string;
  };
}

/**
 * Audit session result
 */
export interface AuditSessionResult {
  /** Session identifier */
  id: string;
  /** Session name */
  name: string;
  /** Session description */
  description: string;
  /** Start timestamp */
  startTime: number;
  /** End timestamp */
  endTime: number;
  /** Total duration (ms) */
  duration: number;
  /** Audit configuration */
  config: ValidationAuditConfig;
  /** Context results */
  contextResults: Record<string, {
    contextId: string;
    contextName: string;
    totalRules: number;
    passed: number;
    failed: number;
    skipped: number;
    errors: number;
    timeouts: number;
    averageDuration: number;
    complianceScore: number;
  }>;
  /** Rule results */
  ruleResults: Record<string, {
    ruleId: string;
    ruleName: string;
    ruleType: ValidationRuleType;
    totalExecutions: number;
    passed: number;
    failed: number;
    skipped: number;
    errors: number;
    timeouts: number;
    averageDuration: number;
    averageScore: number;
    contexts: string[];
    violations: string[];
  }>;
  /** Overall summary */
  summary: {
    /** Total contexts audited */
    totalContexts: number;
    /** Total rules executed */
    totalRules: number;
    /** Total validations */
    totalValidations: number;
    /** Passed validations */
    passedValidations: number;
    /** Failed validations */
    failedValidations: number;
    /** Skipped validations */
    skippedValidations: number;
    /** Error validations */
    errorValidations: number;
    /** Timeout validations */
    timeoutValidations: number;
    /** Overall compliance score */
    complianceScore: number;
    /** Average execution time */
    averageExecutionTime: number;
    /** Total execution time */
    totalExecutionTime: number;
    /** Success rate (0-1) */
    successRate: number;
    /** Performance metrics */
    performance: {
      /** Average execution time */
      averageExecutionTime: number;
      /** Peak memory usage */
      peakMemoryUsage: number;
      /** Peak CPU usage */
      peakCpuUsage: number;
    };
  };
  /** Violations by severity */
  violationsBySeverity: Record<ValidationSeverity, {
    count: number;
    ruleIds: string[];
    contextIds: string[];
  }>;
  /** Violations by type */
  violationsByType: Record<ValidationRuleType, {
    count: number;
    ruleIds: string[];
    contextIds: string[];
  }>;
  /** Violations by context */
  violationsByContext: Record<string, {
    count: number;
    ruleIds: string[];
    severities: Record< ValidationSeverity, number>;
    types: Record<ValidationRuleType, number>;
  }>;
  /** Recommendations */
  recommendations: {
    /** Auto-fix suggestions */
    autoFixSuggestions: Array<{
      ruleId: string;
      contextId: string;
      issue: string;
      suggestion: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      estimatedEffort: 'low' | 'medium' | 'high' | 'critical';
    }>;
    /** Compliance improvements */
    complianceImprovements: Array<{
      standard: string;
      currentScore: number;
      targetScore: number;
      gap: number;
      recommendations: string[];
    }>;
    /** Performance optimizations */
    performanceOptimizations: Array<{
      area: string;
      issue: string;
      suggestion: string;
      estimatedImpact: 'low' | 'medium' | 'high' | 'critical';
    }>;
  };
  /** Export data */
  exportData: {
    /** JSON export data */
    json?: string;
    /** CSV export data */
    csv?: string;
    /** Markdown export data */
    markdown?: string;
    /** HTML export data */
    html?: string;
  };
  /** Metadata */
  metadata: {
    /** Audit version */
    version: string;
    /** Created timestamp */
    created: string;
    /** Modified timestamp */
    modified: string;
    /** Auditor */
    auditor: string;
    /** Environment */
    environment: string;
    /** Tool version */
    toolVersion: string;
  };
}

/**
 * Zod schemas for validation
 */
export const ValidationRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: ValidationRuleTypeSchema,
  severity: ValidationSeveritySchema,
  enabled: z.boolean(),
  targetContexts: z.array(z.string()),
  parameters: z.record(z.unknown()),
  validator: z.string(),
  errorMessage: z.string(),
  successMessage: z.string(),
  tags: z.array(z.string()),
  metadata: z.object({
    version: z.string(),
    created: z.string(),
    modified: z.string(),
    author: z.string(),
    dependencies: z.array(z.string()),
    documentation: z.string().optional(),
  }),
});

export const ValidationContextSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['location', 'resident', 'activity', 'global']),
  parameters: z.record(z.unknown()),
  rules: z.array(z.string()),
  overrides: z.object({
    severityOverrides: z.record(z.enum(['info', 'warning', 'error', 'critical']).optional()),
    parameterOverrides: z.record(z.record(z.unknown())).optional(),
  }),
  metadata: z.object({
    version: z.string(),
    created: z.string(),
    modified: z.string(),
    author: z.string(),
    documentation: z.string().optional(),
  }),
});

export const ValidationAuditConfigSchema = z.object({
  name: z.string(),
  description: z.string(),
  scope: z.object({
    contexts: z.array(z.string()),
    ruleTypes: z.array(ValidationRuleTypeSchema),
    severities: z.array(ValidationSeveritySchema),
    tags: z.array(z.string()).optional(),
  }),
  settings: z.object({
    dryRun: z.boolean(),
    verbose: z.boolean(),
    progressReporting: z.boolean(),
    maxExecutionTime: z.number().min(1000).max(300000),
    batchSize: z.number().min(1).max(100),
    parallelProcessing: z.boolean(),
    maxConcurrentOps: z.number().min(1).max(10),
  }),
  output: z.object({
    includeDetailedResults: z.boolean(),
    includeSummary: z.boolean(),
    includeRuleDetails: z.boolean(),
    includeContextInfo: z.boolean(),
    includeMetadata: z.boolean(),
    format: z.enum(['json', 'csv', 'markdown', 'html']),
    outputPath: z.string().optional(),
    createTimestampedFilename: z.boolean(),
  }),
  telemetry: z.object({
    enabled: z.boolean(),
    trackAuditEvents: z.boolean(),
    trackValidationResults: z.boolean(),
    trackRuleViolations: z.boolean(),
    trackComplianceMetrics: z.boolean(),
    endpoint: z.string().optional(),
  }),
  compliance: z.object({
    enabled: z.boolean(),
    standards: z.array(z.string()),
    requiredRuleCoverage: z.number().min(0).max(1),
    maxFailuresPerSeverity: z.record(z.enum(['info', 'warning', 'error', 'critical']), z.number().min(0)),
    complianceThreshold: z.number().min(0).max(1),
    enableAutoFix: z.boolean(),
    autoFixStrategies: z.record(z.string()),
  }),
});

export const ValidationResultSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  contextId: z.string(),
  status: ValidationStatusSchema,
  timestamp: z.number(),
  duration: z.number(),
  data: z.object({
    input: z.unknown(),
    expected: z.unknown().optional(),
    actual: z.unknown(),
    details: z.record(z.unknown()),
    error: z.object({
      type: z.string(),
      message: z.string(),
      stack: z.string().optional(),
      code: z.string().optional(),
    }).optional(),
  }),
  messages: z.object({
    success: z.string().optional(),
    warning: z.string().optional(),
    error: z.string().optional(),
    info: z.string().optional(),
  }),
  metrics: z.object({
    score: z.number().min(0).max(1),
    confidence: z.number().min(0).max(1),
    performance: z.object({
      executionTime: z.number(),
      memoryUsage: z.number(),
      cpuUsage: z.number(),
    }),
    compliance: z.object({
      score: z.number().min(0).max(1),
      ruleCoverage: z.number(),
      standardCompliance: z.record(z.boolean()),
    }),
  }),
  tags: z.array(z.string()),
  metadata: z.object({
    version: z.string(),
    created: z.string(),
    modified: z.string(),
    auditor: z.string(),
    auditSessionId: z.string(),
    environment: z.string(),
  }),
});

export const AuditSessionResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  startTime: z.number(),
  endTime: z.number(),
  duration: z.number(),
  config: ValidationAuditConfigSchema,
  contextResults: z.record(z.object({
    contextId: z.string(),
    contextName: z.string(),
    totalRules: z.number(),
    passed: z.number(),
    failed: z.number(),
    skipped: z.number(),
    errors: z.number(),
    timeouts: z.number(),
    averageDuration: z.number(),
    complianceScore: z.number(),
  })),
  ruleResults: z.record(z.object({
    ruleId: z.string(),
    ruleName: z.string(),
    ruleType: ValidationRuleTypeSchema,
    totalExecutions: z.number(),
    passed: z.number(),
    failed: z.number(),
    skipped: z.number(),
    errors: z.number(),
    timeouts: z.number(),
    averageDuration: z.number(),
    averageScore: z.number(),
    contexts: z.array(z.string()),
    violations: z.array(z.string()),
  })),
  summary: z.object({
    totalContexts: z.number(),
    totalRules: z.number(),
    totalValidations: z.number(),
    passedValidations: z.number(),
    failedValidations: z.number(),
    skippedValidations: z.number(),
    errorValidations: z.number(),
    timeoutValidations: z.number(),
    complianceScore: z.number(),
    averageExecutionTime: z.number(),
    totalExecutionTime: z.number(),
    successRate: z.number(),
    performance: z.object({
      averageExecutionTime: z.number(),
      peakMemoryUsage: z.number(),
      peakCpuUsage: z.number(),
    }),
  }),
  violationsBySeverity: z.record(z.object({
    count: z.number(),
    ruleIds: z.array(z.string()),
    contextIds: z.array(z.string()),
  })),
  violationsByType: z.record(z.object({
    count: z.number(),
    ruleIds: z.array(z.string()),
    contextIds: z.array(z.string()),
  })),
  violationsByContext: z.record(z.object({
    count: z.number(),
    ruleIds: z.array(z.string()),
    severities: z.record(z.number()),
    types: z.record(z.number()),
  })),
  recommendations: z.object({
    autoFixSuggestions: z.array(z.object({
      ruleId: z.string(),
      contextId: z.string(),
      issue: z.string(),
      suggestion: z.string(),
      priority: z.enum(['low', 'medium', 'high', 'critical']),
      estimatedEffort: z.enum(['low', 'medium', 'high', 'critical']),
    })),
    complianceImprovements: z.array(z.object({
      standard: z.string(),
      currentScore: z.number(),
      targetScore: z.number(),
      gap: z.number(),
      recommendations: z.array(z.string()),
    })),
    performanceOptimizations: z.array(z.object({
      area: z.string(),
      issue: z.string(),
      suggestion: z.string(),
      estimatedImpact: z.enum(['low', 'min', 'medium', 'high', 'critical']),
    })),
  }),
  exportData: z.object({
    json: z.string().optional(),
    csv: z.string().optional(),
    markdown: z.string().optional(),
    html: z.string().optional(),
  }),
  metadata: z.object({
    version: z.string(),
    created: z.string(),
    modified: z.string(),
    auditor: z.string(),
    environment: z.string(),
    toolVersion: z.string(),
  }),
});

/**
 * Default configuration
 */
export const DEFAULT_VALIDATION_AUDIT_CONFIG: ValidationAuditConfig = {
  name: 'Idle Village Drop Validation Audit',
  description: 'Comprehensive audit of drop validation rules and compliance with KS-030 standards',
  scope: {
    contexts: [
      'global-audit',
      'location-audit',
      'resident-audit',
      'activity-audit',
    ],
    ruleTypes: [
      'stat_tags',
      'fatigue_threshold',
      'crew_limits',
      'activity_requirements',
      'location_constraints',
      'time_restrictions',
      'resource_limits',
      'custom_rule',
    ],
    severities: ['warning', 'error', 'critical'],
    tags: ['ks-030', 'drop-validation', 'idle-village'],
  },
  settings: {
    dryRun: false,
    verbose: true,
    progressReporting: true,
    maxExecutionTime: 60000, // 60 seconds
    batchSize: 10,
    parallelProcessing: true,
    maxConcurrentOps: 5,
  },
  output: {
    includeDetailedResults: true,
    includeSummary: true,
    includeRuleDetails: true,
    includeContextInfo: true,
    includeMetadata: true,
    format: 'json',
    createTimestampedFilename: true,
  },
  telemetry: {
    enabled: true,
    trackAuditEvents: true,
    trackValidationResults: true,
    trackRuleViolations: true,
    trackComplianceMetrics: true,
  },
  compliance: {
    enabled: true,
    standards: ['ks-030-drop-validation', 'idle-village-compliance'],
    requiredRuleCoverage: 0.8, // 80% rule coverage required
    maxFailuresPerSeverity: {
      info: 10,
      warning: 5,
      error: 3,
      critical: 1,
    },
    complianceThreshold: 0.8, // 80% compliance required
    enableAutoFix: true,
    autoFixStrategies: {
      'stat_tags': 'Update resident stat tags to match requirements',
      'fatigue_threshold': 'Adjust fatigue thresholds based on resident stats',
      'crew_limits': 'Optimize crew capacity assignments',
      'activity_requirements': 'Review activity-specific requirements',
      'location_constraints': 'Check location-specific constraints',
      'time_restrictions': 'Validate time-based restrictions',
      'resource_limits': 'Monitor resource usage limits',
      'custom_rule': 'Review custom rule implementations',
    },
  },
};

/**
 * Preset configurations
 */
export const VALIDATION_AUDIT_PRESETS = {
  /** Quick audit for CI/CD pipelines */
  quick: {
    ...DEFAULT_VALIDATION_AUDIT_CONFIG,
    name: 'Quick Drop Validation Audit',
    description: 'Fast audit for CI/CD pipelines with essential checks only',
    scope: {
      contexts: ['global-audit'],
      ruleTypes: ['stat_tags', 'crew_limits'],
      severities: ['error', 'critical'],
      tags: ['ci-cd', 'quick-audit'],
    },
    settings: {
      ...DEFAULT_VALIDATION_AUDIT_CONFIG.settings,
      maxExecutionTime: 30000, // 30 seconds
      parallelProcessing: false,
      maxConcurrentOps: 1,
    },
    compliance: {
      ...DEFAULT_VALIDATION_AUDIT_CONFIG.compliance,
      requiredRuleCoverage: 0.5, // 50% coverage for quick audit
      maxFailuresPerSeverity: {
        info: 5,
        warning: 3,
        error: 2,
        critical: 1,
      },
      complianceThreshold: 0.7, // 70% compliance for quick audit
    },
  },
  
  /** Standard audit for staging environments */
  standard: {
    ...DEFAULT_VALIDATION_AUDIT_CONFIG,
    name: 'Standard Drop Validation Audit',
    description: 'Comprehensive audit for staging environments',
    scope: {
      contexts: ['global-audit', 'location-audit', 'resident-audit'],
      ruleTypes: ['stat_tags', 'fatigue_threshold', 'crew_limits', 'activity_requirements'],
      severities: ['warning', 'error', 'critical'],
      tags: ['staging', 'standard-audit'],
    },
    settings: {
      ...DEFAULT_VALIDATION_AUDIT_CONFIG.settings,
      maxExecutionTime: 120000, // 2 minutes
      parallelProcessing: true,
      maxConcurrentOps: 3,
    },
    compliance: {
      ...DEFAULT_VALIDATION_AUDIT_CONFIG.compliance,
      requiredRuleCoverage: 0.8,
      maxFailuresPerSeverity: {
        info: 10,
        warning: 5,
        error: 3,
        critical: 1,
      },
      complianceThreshold: 0.8,
    },
  },
  
  /** Comprehensive audit for production */
  comprehensive: {
    ...DEFAULT_VALIDATION_AUDIT_CONFIG,
    name: 'Comprehensive Drop Validation Audit',
    description: 'Full audit for production environments with all validation types',
    scope: {
      contexts: ['global-audit', 'location-audit', 'resident-audit', 'activity-audit'],
      ruleTypes: [
        'stat_tags',
        'fatigue_threshold',
        'crew_limits',
        'activity_requirements',
        'location_constraints',
        'time_restrictions',
        'resource_limits',
        'custom_rule',
      ],
      severities: ['info', 'warning', 'error', 'critical'],
      tags: ['production', 'comprehensive-audit'],
    },
    settings: {
      ...DEFAULT_VALIDATION_AUDIT_CONFIG.settings,
      maxExecutionTime: 300000, // 5 minutes
      parallelProcessing: true,
      maxConcurrentOps: 5,
    },
    compliance: {
      ...DEFAULT_VALIDATION_AUDIT_CONFIG.compliance,
      requiredRuleCoverage: 0.9,
      maxFailuresPerSeverity: {
        info: 15,
        warning: 10,
        error: 5,
        critical: 2,
      },
      complianceThreshold: 0.9,
    },
  },
  
  /** Performance-focused audit */
  performance: {
    ...DEFAULT_VALIDATION_AUDIT_CONFIG,
    name: 'Performance-Focused Drop Validation Audit',
    description: 'Audit focused on performance metrics and optimization',
    scope: {
      contexts: ['global-audit'],
      ruleTypes: ['resource_limits', 'time_restrictions'],
      severities: ['warning', 'error'],
      tags: ['performance', 'optimization'],
    },
    settings: {
      ...DEFAULT_VALIDATION_AUDIT_CONFIG.settings,
      maxExecutionTime: 45000, // 45 seconds
      parallelProcessing: true,
      maxConcurrentOps: 10,
    },
    compliance: {
      ...DEFAULT_VALIDATION_AUDIT_CONFIG.compliance,
      requiredRuleCoverage: 0.6,
      maxFailuresPerSeverity: {
        info: 20,
        warning: 10,
        error: 5,
        critical: 2,
      },
      complianceThreshold: 0.6,
    },
  },
  
  /** Compliance-focused audit */
  compliance: {
    ...DEFAULT_VALIDATION_AUDIT_CONFIG,
    name: 'Compliance-Focused Drop Validation Audit',
    description: 'Audit focused on compliance standards and regulatory requirements',
    scope: {
      contexts: ['global-audit', 'location-audit', 'resident-audit', 'activity-audit'],
      ruleTypes: ['stat_tags', 'fatigue_threshold', 'crew_limits', 'activity_requirements'],
      severities: ['warning', 'error', 'critical'],
      tags: ['compliance', 'regulatory'],
    },
    settings: {
      ...DEFAULT_VALIDATION_AUDIT_CONFIG.settings,
      maxExecutionTime: 180000, // 3 minutes
      parallelProcessing: true,
      maxConcurrentOps: 3,
    },
    compliance: {
      ...DEFAULT_VALIDATION_AUDIT_CONFIG.compliance,
      requiredRuleCoverage: 0.95,
      maxFailuresPerSeverity: {
        info: 5,
        warning: 3,
        error: 2,
        critical: 1,
      },
      complianceThreshold: 0.95,
    },
  },
} as const;

/**
 * Validation audit preset type
 */
export type ValidationAuditPreset = keyof typeof VALIDATION_AUDIT_PRESETS;

/**
 * Export configuration
 */
export interface ValidationExportConfig {
  /** Include detailed results */
  includeDetailedResults: boolean;
  /** Include summary statistics */
  includeSummary: boolean;
  /** Include rule details */
  includeRuleDetails: boolean;
  /** Include context information */
  includeContextInfo: boolean;
  /** Include metadata */
  includeMetadata: boolean;
  /** Export format */
  format: 'json' | 'csv' | 'markdown' | 'html';
  /** Output file path */
  outputPath?: string;
  /** Create timestamped filename */
  createTimestampedFilename: boolean;
  /** Time range filter */
  timeRange?: {
    start: Date;
    end: Date;
  };
  /** Context filter */
  contexts?: string[];
  /** Rule type filter */
  ruleTypes?: ValidationRuleType[];
  /** Severity filter */
  severities?: ValidationSeverity[];
  /** Tags filter */
  tags?: string[];
}

/**
 * Drop validation filter configuration
 */
export interface DropValidationFilters {
  /** Context types to include */
  contextTypes?: Array<'location' | 'resident' | 'activity' | 'global'>;
  /** Rule types to include */
  ruleTypes?: ValidationRuleType[];
  /** Severities to include */
  severities?: ValidationSeverity[];
  /** Tags to include */
  tags?: string[];
  /** Minimum duration */
  minDuration?: number;
  /** Maximum duration */
  maxDuration?: number;
  /** Context filter */
  contexts?: string[];
  /** Rule filter */
  rules?: string[];
  /** Date range filter */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** Performance filter */
  performance?: {
    minExecutionTime?: number;
    maxExecutionTime?: number;
    minScore?: number;
    maxScore?: number;
  };
  /** Compliance filter */
  compliance?: {
    minComplianceScore?: number;
    maxComplianceScore?: number;
    minRuleCoverage?: number;
    maxRuleCoverage?: number;
  };
}

/**
 * Compliance standards
 */
export interface ComplianceStandard {
  /** Standard identifier */
  id: string;
  /** Standard name */
  name: string;
  /** Standard description */
  description: string;
  /** Standard requirements */
  requirements: Array<{
    id: string;
    requirement: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>;
  /** Validation rules covered */
  validationRules: string[];
  /** Compliance score threshold */
  complianceThreshold: number;
  /** Documentation */
  documentation: string;
  /** Version */
  version: string;
}

/**
 * Auto-fix strategy
 */
export interface AutoFixStrategy {
  /** Strategy identifier */
  id: string;
  /** Strategy name */
  name: string;
  /** Strategy description */
  description: string;
  /** Applicable rule types */
  applicableRuleTypes: ValidationRuleType[];
  /** Implementation approach */
  implementation: string;
  /** Priority */
  priority: 'low' | 'medium' | 'high' | 'critical';
  /** Estimated effort */
  estimatedEffort: 'low' | 'medium' | 'high' | 'critical';
  /** Success criteria */
  successCriteria: string;
  /** Documentation */
  documentation: string;
  /** Version */
  version: string;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** Execution time in milliseconds */
  executionTime: number;
  /** Memory usage in bytes */
  memoryUsage: number;
  /** CPU usage percentage */
  cpuUsage: number;
  /** Database queries */
  databaseQueries: number;
  /** File operations */
  fileOperations: number;
  /** Network requests */
  networkRequests: number;
}

/**
 * Compliance metrics
 */
export interface ComplianceMetrics {
  /** Overall compliance score (0-1) */
  score: number;
  /** Rule coverage percentage */
  ruleCoverage: number;
  /** Standard compliance by standard */
  standardCompliance: Record<string, boolean>;
  /** Violations by severity */
  violationsBySeverity: Record<ValidationSeverity, number>;
  /** Violations by type */
  violationsByType: Record<ValidationRuleType, number>;
  /** Recommendations generated */
  recommendations: string[];
}

/**
 * Recommendation priority levels
 */
export type RecommendationPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Auto-fix priority levels
 */
export type AutoFixEffort = 'low' | 'medium' | 'high' | 'critical';

/**
 * Audit environment
 */
export type AuditEnvironment = 'development' | 'staging' | 'production' | 'test';

/**
 * Export format types
 */
export type ExportFormat = 'json' | 'csv' | 'markdown' | 'html';
