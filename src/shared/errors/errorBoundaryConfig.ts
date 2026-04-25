/**
 * Error Boundary Configuration
 * Config-first error boundary system with categorization and recovery strategies
 * 
 * @see NP-221 – Error Boundary System
 */

import { z } from 'zod';

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type ErrorSeverity = typeof ErrorSeverity[keyof typeof ErrorSeverity];

/**
 * Error categories
 */
export const ErrorCategory = {
  RENDER: 'render',
  NETWORK: 'network',
  STATE: 'state',
  VALIDATION: 'validation',
  PERMISSION: 'permission',
  UNKNOWN: 'unknown',
} as const;

export type ErrorCategory = typeof ErrorCategory[keyof typeof ErrorCategory];

/**
 * Recovery strategies
 */
export const RecoveryStrategy = {
  RETRY: 'retry',
  RELOAD: 'reload',
  FALLBACK: 'fallback',
  IGNORE: 'ignore',
  REPORT: 'report',
} as const;

export type RecoveryStrategy = typeof RecoveryStrategy[keyof typeof RecoveryStrategy];

/**
 * Error boundary configuration
 */
export interface ErrorBoundaryConfig {
  /** Enable error boundary */
  enabled: boolean;
  /** Show error UI to user */
  showErrorUI: boolean;
  /** Enable telemetry reporting */
  enableTelemetry: boolean;
  /** Enable console logging */
  enableConsoleLog: boolean;
  /** Enable stack trace capture */
  captureStackTrace: boolean;
  /** Maximum errors before forcing reload */
  maxErrorsBeforeReload: number;
  /** Error categorization rules */
  categorization: {
    [key: string]: {
      category: ErrorCategory;
      severity: ErrorSeverity;
      strategy: RecoveryStrategy;
    };
  };
  /** Recovery strategies config */
  recovery: {
    retry: {
      maxAttempts: number;
      delayMs: number;
      backoffMultiplier: number;
    };
    reload: {
      delayMs: number;
      preserveState: boolean;
    };
    fallback: {
      showFallbackUI: boolean;
      fallbackMessage: string;
    };
  };
  /** UI configuration */
  ui: {
    showDetails: boolean;
    showStackTrace: boolean;
    showRecoveryOptions: boolean;
    theme: 'light' | 'dark';
  };
  /** Telemetry configuration */
  telemetry: {
    event: string;
    includeStackTrace: boolean;
    includeComponentStack: boolean;
    includeUserAgent: boolean;
  };
}

/**
 * Zod schema for error boundary config
 */
export const ErrorBoundaryConfigSchema = z.object({
  enabled: z.boolean(),
  showErrorUI: z.boolean(),
  enableTelemetry: z.boolean(),
  enableConsoleLog: z.boolean(),
  captureStackTrace: z.boolean(),
  maxErrorsBeforeReload: z.number().min(1).max(100),
  categorization: z.record(z.object({
    category: z.enum(['render', 'network', 'state', 'validation', 'permission', 'unknown']),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    strategy: z.enum(['retry', 'reload', 'fallback', 'ignore', 'report']),
  })),
  recovery: z.object({
    retry: z.object({
      maxAttempts: z.number(),
      delayMs: z.number(),
      backoffMultiplier: z.number(),
    }),
    reload: z.object({
      delayMs: z.number(),
      preserveState: z.boolean(),
    }),
    fallback: z.object({
      showFallbackUI: z.boolean(),
      fallbackMessage: z.string(),
    }),
  }),
  ui: z.object({
    showDetails: z.boolean(),
    showStackTrace: z.boolean(),
    showRecoveryOptions: z.boolean(),
    theme: z.enum(['light', 'dark']),
  }),
  telemetry: z.object({
    event: z.string(),
    includeStackTrace: z.boolean(),
    includeComponentStack: z.boolean(),
    includeUserAgent: z.boolean(),
  }),
});

/**
 * Default error boundary configuration
 */
export const DEFAULT_ERROR_BOUNDARY_CONFIG: ErrorBoundaryConfig = {
  enabled: true,
  showErrorUI: true,
  enableTelemetry: true,
  enableConsoleLog: true,
  captureStackTrace: true,
  maxErrorsBeforeReload: 5,
  categorization: {
    'TypeError': {
      category: 'render',
      severity: 'high',
      strategy: 'fallback',
    },
    'ReferenceError': {
      category: 'render',
      severity: 'high',
      strategy: 'fallback',
    },
    'NetworkError': {
      category: 'network',
      severity: 'medium',
      strategy: 'retry',
    },
    'ValidationError': {
      category: 'validation',
      severity: 'low',
      strategy: 'report',
    },
    'PermissionError': {
      category: 'permission',
      severity: 'medium',
      strategy: 'report',
    },
    'StateError': {
      category: 'state',
      severity: 'high',
      strategy: 'reload',
    },
  },
  recovery: {
    retry: {
      maxAttempts: 3,
      delayMs: 1000,
      backoffMultiplier: 2,
    },
    reload: {
      delayMs: 2000,
      preserveState: true,
    },
    fallback: {
      showFallbackUI: true,
      fallbackMessage: 'Something went wrong. Please try again.',
    },
  },
  ui: {
    showDetails: true,
    showStackTrace: false,
    showRecoveryOptions: true,
    theme: 'dark',
  },
  telemetry: {
    event: 'error_boundary_caught',
    includeStackTrace: true,
    includeComponentStack: true,
    includeUserAgent: true,
  },
};

/**
 * Categorize error based on configuration
 */
export function categorizeError(
  error: Error,
  config: ErrorBoundaryConfig = DEFAULT_ERROR_BOUNDARY_CONFIG
): {
  category: ErrorCategory;
  severity: ErrorSeverity;
  strategy: RecoveryStrategy;
} {
  const errorName = error.name || 'Error';
  const errorMessage = error.message || '';

  // Check configured categorization rules
  if (config.categorization[errorName]) {
    return config.categorization[errorName];
  }

  // Fallback categorization based on message patterns
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return {
      category: 'network',
      severity: 'medium',
      strategy: 'retry',
    };
  }

  if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
    return {
      category: 'permission',
      severity: 'medium',
      strategy: 'report',
    };
  }

  if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    return {
      category: 'validation',
      severity: 'low',
      strategy: 'report',
    };
  }

  // Default unknown error
  return {
    category: 'unknown',
    severity: 'high',
    strategy: 'fallback',
  };
}

/**
 * Validate error boundary configuration
 */
export function validateErrorBoundaryConfig(config: unknown): ErrorBoundaryConfig {
  return ErrorBoundaryConfigSchema.parse(config);
}
