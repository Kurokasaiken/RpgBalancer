import { useContext } from 'react';
import { SandboxTimingContext, type SandboxTimingApi } from './sandboxTimingContext';

/**
 * Lightweight hook to access the sandbox timing helpers (scheduleTimeout, etc.).
 * Throws if used outside of a SandboxTimingProvider so surfaces must wrap
 * themselves with the provider exported from {@link useSandboxTimingBridge}.
 */
export function useSandboxTiming(): SandboxTimingApi {
  const ctx = useContext(SandboxTimingContext);
  if (!ctx) {
    throw new Error('useSandboxTiming must be used within a SandboxTimingProvider');
  }
  return ctx;
}
