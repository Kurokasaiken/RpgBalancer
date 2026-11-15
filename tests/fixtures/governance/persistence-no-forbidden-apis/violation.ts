/**
 * MUST-FAIL fixture for persistence:no-forbidden-apis (PLAN-122 T-3).
 * Seeded violations: bare localStorage, window.sessionStorage member access,
 * and an ad-hoc storage-middleware import. This file MUST fail the check;
 * `governance:check --selftest` verifies that.
 */
// eslint-disable-next-line
import localforage from 'localforage';

export function rogueSave(value: unknown): void {
  localStorage.setItem('rogue-key', JSON.stringify(value));
}

export function rogueLoad(): string | null {
  return window.sessionStorage.getItem('rogue-key');
}

export async function rogueMiddleware(): Promise<void> {
  await localforage.setItem('k', 'v');
}
