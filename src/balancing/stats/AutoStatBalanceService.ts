import type { BalancerConfig } from '../config/types';
import type { AutoStatBalancerOptions, AutoStatBalancerResult } from './AutoStatBalancer';
import { runAutoBalanceSession } from './AutoStatBalancer';
import { StatBalanceHistoryStore } from './StatBalanceHistoryStore';

export interface RunAndStoreAutoBalanceOptions extends AutoStatBalancerOptions {
  /** Whether to persist individual runs to StatBalanceHistoryStore (default: true) */
  persistRuns?: boolean;
  /** Whether to persist the session object to StatBalanceHistoryStore (default: true) */
  persistSession?: boolean;
}

export type RunAndStoreAutoBalanceResult = AutoStatBalancerResult;

export async function runAndStoreAutoBalanceSession(
  initialConfig: BalancerConfig,
  options?: Partial<RunAndStoreAutoBalanceOptions>,
): Promise<RunAndStoreAutoBalanceResult> {
  const resolved: RunAndStoreAutoBalanceOptions = {
    maxIterations: options?.maxIterations ?? 5,
    iterationsPerTier: options?.iterationsPerTier ?? 1000,
    seed: options?.seed ?? 123456,
    sessionId: options?.sessionId,
    advisorOptions: options?.advisorOptions,
    persistRuns: options?.persistRuns ?? true,
    persistSession: options?.persistSession ?? true,
  };

  const { finalConfig, session } = await runAutoBalanceSession(initialConfig, resolved);

  if (resolved.persistRuns) {
    session.runs.forEach((run) => StatBalanceHistoryStore.addRun(run));
  }

  if (resolved.persistSession) {
    StatBalanceHistoryStore.addSession(session);
  }

  return { finalConfig, session };
}
