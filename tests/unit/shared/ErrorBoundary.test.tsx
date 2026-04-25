/**
 * Error Boundary Tests
 * Unit tests for error boundary system
 * 
 * @see NP-221 – Error Boundary System
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ErrorBoundary } from '../../../src/shared/errors/ErrorBoundary';
import { ErrorReporter, getErrorReporter, resetErrorReporter } from '../../../src/shared/errors/errorReporter';
import { categorizeError, DEFAULT_ERROR_BOUNDARY_CONFIG } from '../../../src/shared/errors/errorBoundaryConfig';

// Test component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    resetErrorReporter();
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const reporter = getErrorReporter();
      const config = reporter.getConfig();
      
      expect(config.enabled).toBe(true);
      expect(config.showErrorUI).toBe(true);
      expect(config.enableTelemetry).toBe(true);
    });

    it('should accept custom configuration', () => {
      const reporter = getErrorReporter({
        maxErrorsBeforeReload: 10,
        showErrorUI: false,
      });
      const config = reporter.getConfig();
      
      expect(config.maxErrorsBeforeReload).toBe(10);
      expect(config.showErrorUI).toBe(false);
    });
  });

  describe('Error Categorization', () => {
    it('should categorize TypeError', () => {
      const error = new TypeError('Cannot read property');
      const result = categorizeError(error);
      
      expect(result.category).toBe('render');
      expect(result.severity).toBe('high');
      expect(result.strategy).toBe('fallback');
    });

    it('should categorize ReferenceError', () => {
      const error = new ReferenceError('Variable not defined');
      const result = categorizeError(error);
      
      expect(result.category).toBe('render');
      expect(result.severity).toBe('high');
    });

    it('should categorize network errors', () => {
      const error = new Error('Network request failed');
      const result = categorizeError(error);
      
      expect(result.category).toBe('network');
      expect(result.severity).toBe('medium');
      expect(result.strategy).toBe('retry');
    });

    it('should categorize permission errors', () => {
      const error = new Error('Permission denied');
      const result = categorizeError(error);
      
      expect(result.category).toBe('permission');
      expect(result.severity).toBe('medium');
    });

    it('should categorize validation errors', () => {
      const error = new Error('Invalid input');
      const result = categorizeError(error);
      
      expect(result.category).toBe('validation');
      expect(result.severity).toBe('low');
    });

    it('should categorize unknown errors', () => {
      const error = new Error('Something went wrong');
      const result = categorizeError(error);
      
      expect(result.category).toBe('unknown');
      expect(result.severity).toBe('high');
    });
  });

  describe('Error Reporter', () => {
    it('should report error with stack trace', () => {
      const reporter = new ErrorReporter();
      const error = new Error('Test error');
      
      const report = reporter.report(error);
      
      expect(report.message).toBe('Test error');
      expect(report.name).toBe('Error');
      expect(report.stack).toBeDefined();
      expect(report.timestamp).toBeDefined();
    });

    it('should increment error count', () => {
      const reporter = new ErrorReporter();
      
      expect(reporter.getErrorCount()).toBe(0);
      
      reporter.report(new Error('Error 1'));
      expect(reporter.getErrorCount()).toBe(1);
      
      reporter.report(new Error('Error 2'));
      expect(reporter.getErrorCount()).toBe(2);
    });

    it('should track last error', () => {
      const reporter = new ErrorReporter();
      const error = new Error('Last error');
      
      reporter.report(error);
      
      expect(reporter.getLastError()).toBe(error);
    });

    it('should reset error count', () => {
      const reporter = new ErrorReporter();
      
      reporter.report(new Error('Error 1'));
      reporter.report(new Error('Error 2'));
      expect(reporter.getErrorCount()).toBe(2);
      
      reporter.resetErrorCount();
      expect(reporter.getErrorCount()).toBe(0);
      expect(reporter.getLastError()).toBeNull();
    });

    it('should check if should reload', () => {
      const reporter = new ErrorReporter({ maxErrorsBeforeReload: 3 });
      
      expect(reporter.shouldReload()).toBe(false);
      
      reporter.report(new Error('Error 1'));
      reporter.report(new Error('Error 2'));
      expect(reporter.shouldReload()).toBe(false);
      
      reporter.report(new Error('Error 3'));
      expect(reporter.shouldReload()).toBe(true);
    });

    it('should include component stack when provided', () => {
      const reporter = new ErrorReporter();
      const error = new Error('Test error');
      const componentStack = 'at Component\n  at App';
      
      const report = reporter.report(error, componentStack);
      
      expect(report.componentStack).toBe(componentStack);
    });

    it('should include user agent when enabled', () => {
      const reporter = new ErrorReporter({
        telemetry: {
          ...DEFAULT_ERROR_BOUNDARY_CONFIG.telemetry,
          includeUserAgent: true,
        },
      });
      
      const report = reporter.report(new Error('Test error'));
      
      expect(report.userAgent).toBeDefined();
    });

    it('should not include stack trace when disabled', () => {
      const reporter = new ErrorReporter({ captureStackTrace: false });
      
      const report = reporter.report(new Error('Test error'));
      
      expect(report.stack).toBeUndefined();
    });
  });

  describe('ErrorBoundary Component', () => {
    it('should render children when no error', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Test content')).toBeDefined();
    });

    it('should catch and display error', () => {
      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(screen.getByText(/Something went wrong/i)).toBeDefined();
      
      consoleError.mockRestore();
    });

    it('should show error details when enabled', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <ErrorBoundary config={{ ui: { ...DEFAULT_ERROR_BOUNDARY_CONFIG.ui, showDetails: true } }}>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(screen.getByText(/Test error/i)).toBeDefined();
      
      consoleError.mockRestore();
    });

    it('should show recovery options when enabled', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <ErrorBoundary config={{ ui: { ...DEFAULT_ERROR_BOUNDARY_CONFIG.ui, showRecoveryOptions: true } }}>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(screen.getByTestId('error-boundary-reset')).toBeDefined();
      expect(screen.getByTestId('error-boundary-reload')).toBeDefined();
      
      consoleError.mockRestore();
    });

    it('should use custom fallback when provided', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <ErrorBoundary fallback={<div>Custom fallback</div>}>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Custom fallback')).toBeDefined();
      
      consoleError.mockRestore();
    });

    it('should call onError callback', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const onError = vi.fn();
      
      render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(onError).toHaveBeenCalled();
      
      consoleError.mockRestore();
    });

    it('should not show UI when disabled', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <ErrorBoundary config={{ showErrorUI: false }}>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(screen.queryByTestId('error-boundary-ui')).toBeNull();
      
      consoleError.mockRestore();
    });
  });

  describe('Recovery Strategies', () => {
    it('should support retry strategy', () => {
      const error = new Error('Network request failed');
      const result = categorizeError(error);
      
      expect(result.strategy).toBe('retry');
    });

    it('should support fallback strategy', () => {
      const error = new TypeError('Cannot read property');
      const result = categorizeError(error);
      
      expect(result.strategy).toBe('fallback');
    });

    it('should support report strategy', () => {
      const error = new Error('Invalid input');
      const result = categorizeError(error);
      
      expect(result.strategy).toBe('report');
    });
  });

  describe('Edge Cases', () => {
    it('should handle error without message', () => {
      const reporter = new ErrorReporter();
      const error = new Error();
      
      const report = reporter.report(error);
      
      expect(report.message).toBe('Unknown error');
    });

    it('should handle error without name', () => {
      const reporter = new ErrorReporter();
      const error = new Error('Test');
      error.name = '';
      
      const report = reporter.report(error);
      
      expect(report.name).toBe('Error');
    });

    it('should handle multiple errors in sequence', () => {
      const reporter = new ErrorReporter();
      
      reporter.report(new Error('Error 1'));
      reporter.report(new Error('Error 2'));
      reporter.report(new Error('Error 3'));
      
      expect(reporter.getErrorCount()).toBe(3);
      expect(reporter.getLastError()?.message).toBe('Error 3');
    });
  });
});
