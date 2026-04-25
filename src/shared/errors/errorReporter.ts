/**
 * Error Reporter
 * Handles error reporting with telemetry integration and stack trace capture
 * 
 * @see NP-221 – Error Boundary System
 */

import type { ErrorBoundaryConfig } from './errorBoundaryConfig';
import { categorizeError, DEFAULT_ERROR_BOUNDARY_CONFIG } from './errorBoundaryConfig';

/**
 * Error report data
 */
export interface ErrorReport {
  /** Error message */
  message: string;
  /** Error name */
  name: string;
  /** Stack trace */
  stack?: string;
  /** Component stack (React) */
  componentStack?: string;
  /** Error category */
  category: string;
  /** Error severity */
  severity: string;
  /** Recovery strategy */
  strategy: string;
  /** Timestamp */
  timestamp: number;
  /** User agent */
  userAgent?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Error reporter class
 */
export class ErrorReporter {
  private config: ErrorBoundaryConfig;
  private errorCount: number = 0;
  private lastError: Error | null = null;
  private lastErrorTime: number = 0;

  constructor(config: Partial<ErrorBoundaryConfig> = {}) {
    this.config = {
      ...DEFAULT_ERROR_BOUNDARY_CONFIG,
      ...config,
    };
  }

  /**
   * Report an error
   */
  report(error: Error, componentStack?: string): ErrorReport {
    this.errorCount++;
    this.lastError = error;
    this.lastErrorTime = Date.now();

    const categorization = categorizeError(error, this.config);
    
    const report: ErrorReport = {
      message: error.message || 'Unknown error',
      name: error.name || 'Error',
      stack: this.config.captureStackTrace ? error.stack : undefined,
      componentStack: componentStack,
      category: categorization.category,
      severity: categorization.severity,
      strategy: categorization.strategy,
      timestamp: Date.now(),
      userAgent: this.config.telemetry.includeUserAgent ? navigator.userAgent : undefined,
      metadata: {
        errorCount: this.errorCount,
        timeSinceLastError: this.lastErrorTime > 0 ? Date.now() - this.lastErrorTime : 0,
      },
    };

    // Console logging
    if (this.config.enableConsoleLog) {
      this.logToConsole(report);
    }

    // Telemetry reporting
    if (this.config.enableTelemetry) {
      this.reportToTelemetry(report);
    }

    return report;
  }

  /**
   * Log error to console
   */
  private logToConsole(report: ErrorReport): void {
    const emoji = this.getSeverityEmoji(report.severity);
    
    console.error(
      `${emoji} Error Boundary: ${report.name}\n` +
      `  Message: ${report.message}\n` +
      `  Category: ${report.category}\n` +
      `  Severity: ${report.severity}\n` +
      `  Strategy: ${report.strategy}\n` +
      `  Count: ${this.errorCount}`
    );

    if (this.config.ui.showStackTrace && report.stack) {
      console.error('Stack trace:', report.stack);
    }

    if (report.componentStack) {
      console.error('Component stack:', report.componentStack);
    }
  }

  /**
   * Report error to telemetry system
   */
  private reportToTelemetry(report: ErrorReport): void {
    const payload: Record<string, unknown> = {
      errorName: report.name,
      errorMessage: report.message,
      category: report.category,
      severity: report.severity,
      strategy: report.strategy,
      errorCount: this.errorCount,
      timestamp: report.timestamp,
    };

    if (this.config.telemetry.includeStackTrace && report.stack) {
      payload.stack = report.stack;
    }

    if (this.config.telemetry.includeComponentStack && report.componentStack) {
      payload.componentStack = report.componentStack;
    }

    if (this.config.telemetry.includeUserAgent && report.userAgent) {
      payload.userAgent = report.userAgent;
    }

    console.log(`[ErrorReporter] ${this.config.telemetry.event}`, payload);
  }

  /**
   * Get emoji for severity level
   */
  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  }

  /**
   * Check if max errors reached
   */
  shouldReload(): boolean {
    return this.errorCount >= this.config.maxErrorsBeforeReload;
  }

  /**
   * Get error count
   */
  getErrorCount(): number {
    return this.errorCount;
  }

  /**
   * Reset error count
   */
  resetErrorCount(): void {
    this.errorCount = 0;
    this.lastError = null;
    this.lastErrorTime = 0;
  }

  /**
   * Get last error
   */
  getLastError(): Error | null {
    return this.lastError;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ErrorBoundaryConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): ErrorBoundaryConfig {
    return { ...this.config };
  }
}

/**
 * Global error reporter instance
 */
let globalErrorReporter: ErrorReporter | null = null;

/**
 * Get global error reporter
 */
export function getErrorReporter(config?: Partial<ErrorBoundaryConfig>): ErrorReporter {
  if (!globalErrorReporter) {
    globalErrorReporter = new ErrorReporter(config);
  }
  return globalErrorReporter;
}

/**
 * Reset global error reporter
 */
export function resetErrorReporter(): void {
  globalErrorReporter = null;
}
