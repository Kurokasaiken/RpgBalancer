/**
 * hash — content digests for lab candidates (PLAN-029 SP-2 T-3).
 *
 * Pipeline (contract §5): `stripUndefinedDeep → canonicalize → UTF-8 →
 * crypto.subtle.digest('SHA-256')` → 64 lowercase hex chars. Async — the
 * only crypto primitive used is the browser's SubtleCrypto (also
 * available in the test runtime via node:crypto webcrypto).
 *
 * `scenarioHash` binds validation reports to the candidate content
 * (SP-3); `kitHash` binds the effective kit input snapshot — picked
 * per C-1: kitHash is computed here over the effective kit (there is
 * no registry field carrying a kit digest today).
 */

import {
  canonicalize,
  stripUndefinedDeep,
  type JsonValue,
} from '@/balancing/config/idleVillage/quests/generation/canonicalize';

async function sha256Hex(canonical: string): Promise<string> {
  const bytes = new TextEncoder().encode(canonical);
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('crypto.subtle unavailable — cannot hash');
  const digest = await subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Content hash of a scenario (or kit snapshot) — sha256 over the
 * canonical serialization with undefined-valued keys stripped.
 * @param value the value to hash (must be JSON-shaped after stripping).
 * @returns 64-char lowercase hex digest, prefixed `sha256-`.
 */
export async function computeContentHash(value: JsonValue): Promise<string> {
  const canonical = canonicalize(stripUndefinedDeep(value));
  return `sha256-${await sha256Hex(canonical)}`;
}

/** Hash of the generated scenario object — binds validation reports. */
export function computeScenarioHash(scenario: JsonValue): Promise<string> {
  return computeContentHash(scenario);
}

/** Hash of the effective (post-merge) kit input snapshot. */
export function computeKitHash(effectiveKit: JsonValue): Promise<string> {
  return computeContentHash(effectiveKit);
}
