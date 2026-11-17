/**
 * sandboxTimingContext — shared deterministic-timing context (PLAN-054 test
 * infra): without a provider the context is null, so consumers must degrade
 * gracefully instead of assuming a sandbox clock.
 */
import { describe, expect, it } from 'vitest';
import React, { useContext } from 'react';
import { renderHook } from '@testing-library/react';
import { SandboxTimingContext } from '@/ui/idleVillage/hooks/sandboxTimingContext';

describe('sandboxTimingContext — opt-in timing api', () => {
  // INV:sandbox-timing-context.INV-1 — without a provider the context resolves
  // to null; a provided api is delivered verbatim (scheduleTimeout included).
  it('is null without a provider and delivers the provided api verbatim', () => {
    const { result } = renderHook(() => useContext(SandboxTimingContext));
    expect(result.current).toBeNull();
    const api = { scheduleTimeout: (cb: () => void, _ms: number) => { cb(); return () => {}; } };
    const wrapped = renderHook(() => useContext(SandboxTimingContext), {
      wrapper: ({ children }) => (
        <SandboxTimingContext.Provider value={api}>{children}</SandboxTimingContext.Provider>
      ),
    });
    expect(wrapped.result.current).toBe(api);
  });
});
