/**
 * Mock level boost (PLAN-067 T-C1, R-234): the Director «Level up» really raises the number shown on the
 * badge (4 → 5), in memory only — no XP, no persistence (PROGRESSION.md owns the real system). The
 * view-model adds this boost to the authored level.
 */
const boost = new Map<string, number>();

export const getMockLevelBoost = (residentId: string): number => boost.get(residentId) ?? 0;

/** One level up; returns the new boost. */
export const bumpMockLevel = (residentId: string): number => {
  const next = getMockLevelBoost(residentId) + 1;
  boost.set(residentId, next);
  return next;
};

export const resetMockLevelsForTest = (): void => boost.clear();
