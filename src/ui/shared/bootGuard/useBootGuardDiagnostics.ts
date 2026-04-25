import { useCallback, useEffect } from 'react';
import { trackBootGuardEvent, type BootGuardTelemetryPayload } from '@/analytics/devBootGuard';

export interface UseBootGuardDiagnosticsOptions {
  /** Page identifier from devBootGuardConfig */
  pageId: string;
  /** Source component name for logs */
  source: string;
}

export interface BootGuardDiagnostics {
  /** Clear any stored error for this page */
  clearError(): void;
  /** Capture a runtime error and emit boot guard telemetry */
  captureError(error: Error, componentStack?: string): void;
}

/**
 * Hook for components to participate in Multi-App Boot Guard diagnostics.
 * Provides a stable API to clear/capture errors and emit telemetry events.
 */
export function useBootGuardDiagnostics({
  pageId,
  source,
}: UseBootGuardDiagnosticsOptions): BootGuardDiagnostics {
  const clearError = useCallback(() => {
    // In a real implementation, this could clear a global error flag or UI overlay.
    // For now, we simply emit a telemetry event indicating the error was cleared.
    if (typeof window !== 'undefined' && (window as any).__bootGuardEvents) {
      const events = (window as any).__bootGuardEvents;
      const idx = events.findIndex((e: any) => e.payload.pageId === pageId && e.payload.errorMessage);
      if (idx >= 0) {
        events.splice(idx, 1);
      }
    }
  }, [pageId]);

  const captureError = useCallback(
    (error: Error, componentStack?: string) => {
      const payload: BootGuardTelemetryPayload = {
        pageId,
        label: source,
        route: window.location.pathname,
        attempt: 1,
        maxAttempts: 1,
        status: 'failure',
        errorMessage: error.message,
        metadata: {
          componentStack,
          stack: error.stack,
          source,
        },
      };
      trackBootGuardEvent('boot_guard_failure', payload);
    },
    [pageId, source],
  );

  // Auto-clear errors on unmount to avoid stale state
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  return { clearError, captureError };
}
