/**
 * Shared context for sandbox timing utilities so test harnesses can reuse the
 * deterministic timeout helpers without depending on the full sandbox clock.
 */
import { createContext } from 'react';

export interface SandboxTimingApi {
  /** Schedule a callback to run after the specified delay (in ms). */
  scheduleTimeout: (callback: () => void, delayMs: number) => () => void;
}

export const SandboxTimingContext = createContext<SandboxTimingApi | null>(null);
