/**
 * CanonicalDataBridge — frozen-kit data boundary (PLAN-054): kits access
 * canonical hooks, resolvers and config through this bridge only. Re-exports
 * are by identity — never private copies — and no mock fixture ships here.
 */
import { describe, expect, it } from 'vitest';
import * as bridge from '@/ui/idleVillage/frozen/_infra/CanonicalDataBridge';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import { TEST_RESIDENTS } from '@/balancing/config/idleVillage/testResidents';

describe('CanonicalDataBridge — re-export, never re-implementation', () => {
  // INV:canonical-data-bridge.INV-1 — the bridge re-exports the canonical
  // config, hooks and resolvers by identity (same reference), so frozen kits
  // can never drift onto a private copy — and it ships no mock fixtures.
  it('re-exports canonical objects by identity and ships no mocks', () => {
    expect(bridge.DEFAULT_IDLE_VILLAGE_CONFIG).toBe(DEFAULT_IDLE_VILLAGE_CONFIG);
    expect(bridge.TEST_RESIDENTS).toBe(TEST_RESIDENTS);
    expect(typeof bridge.useRosterData).toBe('function');
    expect(typeof bridge.useResidentVisualResolver).toBe('function');
    expect(Object.keys(bridge).some((key) => /mock/i.test(key))).toBe(false);
  });
});
