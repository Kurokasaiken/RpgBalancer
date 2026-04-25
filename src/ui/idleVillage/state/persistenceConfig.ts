/**
 * Persistence guardrail configuration for Idle Village state.
 * Centralizes retry/backoff settings so tests and runtime can share a single source of truth.
 */

export interface PersistenceGuardrailConfig {
  /** Maximum attempts (initial try + retries). */
  maxAttempts: number;
  /** Base delay in milliseconds for the first retry (exponential backoff applies per attempt). */
  baseDelayMs: number;
  /** Jitter ratio applied to the delay to avoid thundering herds (0-1). */
  jitterRatio: number;
}

const defaultConfig: PersistenceGuardrailConfig = {
  maxAttempts: 3,
  baseDelayMs: 180,
  jitterRatio: 0.25,
};

let currentConfig: PersistenceGuardrailConfig = { ...defaultConfig };

/**
 * Returns the current persistence guardrail configuration.
 */
export function getPersistenceGuardrailConfig(): PersistenceGuardrailConfig {
  return currentConfig;
}

/**
 * Overrides the guardrail configuration. Intended for testing/build tooling scenarios.
 */
export function overridePersistenceGuardrailConfig(
  overrides: Partial<PersistenceGuardrailConfig>,
): void {
  currentConfig = { ...currentConfig, ...overrides };
}

/**
 * Restores the guardrail configuration to its default values.
 */
export function resetPersistenceGuardrailConfig(): void {
  currentConfig = { ...defaultConfig };
}

export type PersistenceDelayScheduler = (delayMs: number) => Promise<void>;

const defaultDelayScheduler: PersistenceDelayScheduler = (delayMs) =>
  new Promise((resolve) => {
    globalThis.setTimeout(resolve, delayMs);
  });

let delayScheduler: PersistenceDelayScheduler = defaultDelayScheduler;

/**
 * Allows tests to override the delay scheduler (e.g. fast-forward timers).
 */
export function setPersistenceDelayScheduler(scheduler: PersistenceDelayScheduler): void {
  delayScheduler = scheduler;
}

/**
 * Restores the default delay scheduler implementation.
 */
export function resetPersistenceDelayScheduler(): void {
  delayScheduler = defaultDelayScheduler;
}

/**
 * Schedules a persistence delay using the configured scheduler.
 */
export function schedulePersistenceDelay(delayMs: number): Promise<void> {
  return delayScheduler(Math.max(0, delayMs));
}

type PersistenceRandomSource = () => number;

const defaultRandomSource: PersistenceRandomSource = () => Math.random();

let randomSource: PersistenceRandomSource = defaultRandomSource;

/**
 * Overrides the random source used for jitter (useful for deterministic tests).
 */
export function setPersistenceRandomSource(source: PersistenceRandomSource): void {
  randomSource = source;
}

/**
 * Restores the default random source implementation.
 */
export function resetPersistenceRandomSource(): void {
  randomSource = defaultRandomSource;
}

/**
 * Returns a random value from the configured random source.
 */
export function getPersistenceRandom(): number {
  return randomSource();
}
