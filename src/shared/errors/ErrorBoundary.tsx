/**
 * Error Boundary Component
 * React error boundary with graceful degradation and recovery strategies
 * 
 * @see NP-221 – Error Boundary System
 */

import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ErrorReporter, getErrorReporter, type ErrorReport } from './errorReporter';
import type { ErrorBoundaryConfig, RecoveryStrategy } from './errorBoundaryConfig';
import { DEFAULT_ERROR_BOUNDARY_CONFIG } from './errorBoundaryConfig';

/**
 * Error boundary props
 */
export type ErrorBoundaryFallbackRender = (context: {
  /** Last captured error */
  error: Error | null;
  /** React error info */
  errorInfo: ErrorInfo | null;
  /** Enhanced error report */
  errorReport: ErrorReport | null;
  /** Reset callback */
  resetError: () => void;
  /** Current retry count */
  retryCount: number;
}) => ReactNode;

export interface ErrorBoundaryProps {
  /** Child components */
  children: ReactNode;
  /** Custom configuration */
  config?: Partial<ErrorBoundaryConfig>;
  /** Fallback UI */
  fallback?: ReactNode | ErrorBoundaryFallbackRender;
  /** On error callback */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** On reset callback */
  onReset?: () => void;
}

/**
 * Error boundary state
 */
export interface ErrorBoundaryState {
  /** Has error occurred */
  hasError: boolean;
  /** Error object */
  error: Error | null;
  /** Error info */
  errorInfo: ErrorInfo | null;
  /** Error report */
  errorReport: ErrorReport | null;
  /** Retry count */
  retryCount: number;
  /** Is retrying */
  isRetrying: boolean;
}

/**
 * Error Boundary Component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorReporter: ErrorReporter;
  private config: ErrorBoundaryConfig;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.config = {
      ...DEFAULT_ERROR_BOUNDARY_CONFIG,
      ...props.config,
    };

    this.errorReporter = getErrorReporter(this.config);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorReport: null,
      retryCount: 0,
      isRetrying: false,
    };
  }

  /**
   * Static method to derive state from error
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Component did catch error
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Report error
    const errorReport = this.errorReporter.report(error, errorInfo.componentStack);

    // Update state with error info
    this.setState({
      errorInfo,
      errorReport,
    });

    // Call onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Check if should reload
    if (this.errorReporter.shouldReload()) {
      this.handleReload();
    } else {
      // Execute recovery strategy
      this.executeRecoveryStrategy(errorReport.strategy as RecoveryStrategy);
    }
  }

  /**
   * Execute recovery strategy
   */
  private executeRecoveryStrategy(strategy: RecoveryStrategy): void {
    switch (strategy) {
      case 'retry':
        this.handleRetry();
        break;
      case 'reload':
        this.handleReload();
        break;
      case 'fallback':
        // Already showing fallback UI
        break;
      case 'ignore':
        this.handleReset();
        break;
      case 'report':
        // Already reported
        break;
    }
  }

  /**
   * Handle retry
   */
  private handleRetry(): void {
    const { retryCount } = this.state;
    const maxAttempts = this.config.recovery.retry.maxAttempts;

    if (retryCount >= maxAttempts) {
      console.warn('[ErrorBoundary] Max retry attempts reached');
      return;
    }

    const delay = this.config.recovery.retry.delayMs * 
                  Math.pow(this.config.recovery.retry.backoffMultiplier, retryCount);

    this.setState({ isRetrying: true });

    this.retryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorReport: null,
        retryCount: retryCount + 1,
        isRetrying: false,
      });
    }, delay);
  }

  /**
   * Handle reload
   */
  private handleReload(): void {
    const delay = this.config.recovery.reload.delayMs;

    setTimeout(() => {
      if (this.config.recovery.reload.preserveState) {
        // Preserve state in sessionStorage before reload
        try {
          sessionStorage.setItem('error-boundary-reload', 'true');
        } catch (e) {
          console.warn('[ErrorBoundary] Failed to preserve state');
        }
      }
      window.location.reload();
    }, delay);
  }

  /**
   * Handle reset
   */
  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorReport: null,
      retryCount: 0,
      isRetrying: false,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  /**
   * Component will unmount
   */
  componentWillUnmount(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  /**
   * Render error UI
   */
  private renderErrorUI(): ReactNode {
    const { error, errorReport, isRetrying } = this.state;

    if (!this.config.showErrorUI) {
      return null;
    }

    // Use custom fallback if provided
    if (this.props.fallback) {
      if (typeof this.props.fallback === 'function') {
        return (this.props.fallback as ErrorBoundaryFallbackRender)({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          errorReport: this.state.errorReport,
          resetError: this.handleReset,
          retryCount: this.state.retryCount,
        });
      }
      return this.props.fallback;
    }

    const isDark = this.config.ui.theme === 'dark';

    return (
      <div
        style={{
          padding: '2rem',
          maxWidth: '600px',
          margin: '2rem auto',
          backgroundColor: isDark ? '#1e293b' : '#f8fafc',
          border: `2px solid ${isDark ? '#475569' : '#cbd5e1'}`,
          borderRadius: '8px',
          fontFamily: 'system-ui, sans-serif',
          color: isDark ? '#e2e8f0' : '#1e293b',
        }}
        data-testid="error-boundary-ui"
      >
        <h2 style={{ margin: '0 0 1rem 0', color: '#ef4444' }}>
          {this.getSeverityEmoji(errorReport?.severity)} Something went wrong
        </h2>

        {this.config.ui.showDetails && error && (
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ margin: '0.5rem 0', fontWeight: 'bold' }}>
              {error.name}: {error.message}
            </p>
            {errorReport && (
              <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', opacity: 0.8 }}>
                Category: {errorReport.category} | Severity: {errorReport.severity}
              </p>
            )}
          </div>
        )}

        {this.config.ui.showStackTrace && error?.stack && (
          <details style={{ marginBottom: '1rem' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
              Stack Trace
            </summary>
            <pre
              style={{
                padding: '1rem',
                backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '0.75rem',
              }}
            >
              {error.stack}
            </pre>
          </details>
        )}

        {isRetrying && (
          <p style={{ margin: '1rem 0', fontStyle: 'italic' }}>
            Retrying... (Attempt {this.state.retryCount + 1})
          </p>
        )}

        {this.config.ui.showRecoveryOptions && !isRetrying && (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
              data-testid="error-boundary-reset"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
              data-testid="error-boundary-reload"
            >
              Reload Page
            </button>
          </div>
        )}
      </div>
    );
  }

  /**
   * Get severity emoji
   */
  private getSeverityEmoji(severity?: string): string {
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
        return '⚠️';
    }
  }

  /**
   * Render
   */
  render(): ReactNode {
    if (this.state.hasError && this.config.enabled) {
      return this.renderErrorUI();
    }

    return this.props.children;
  }
}

/**
 * Error boundary hook for functional components
 */
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    setError,
    resetError,
  };
}
