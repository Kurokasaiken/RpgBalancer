/**
 * heroLevelMock — PLAN-067 T-C1 (R-234): the in-memory Director «Level up»
 * boost. One bump = +1 level shown; reset clears everything. No persistence.
 */
import { describe, expect, it } from 'vitest';
import {
  bumpMockLevel,
  getMockLevelBoost,
  resetMockLevelsForTest,
} from '@/ui/idleVillage/rosterV2/heroLevelMock';

describe('heroLevelMock — in-memory Director levels', () => {
  // INV:hero-level-mock.INV-1 — each bump raises the resident's in-memory boost
  // by exactly one and resetMockLevelsForTest clears every boost (memory only,
  // no persistence).
  it('bumps the boost by one per call and reset clears it', () => {
    resetMockLevelsForTest();
    expect(getMockLevelBoost('h1')).toBe(0);
    expect(bumpMockLevel('h1')).toBe(1);
    expect(getMockLevelBoost('h1')).toBe(1);
    expect(bumpMockLevel('h1')).toBe(2);
    expect(getMockLevelBoost('other')).toBe(0);
    resetMockLevelsForTest();
    expect(getMockLevelBoost('h1')).toBe(0);
  });
});
