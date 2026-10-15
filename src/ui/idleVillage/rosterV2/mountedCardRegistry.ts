/**
 * Mounted-card registry (PLAN-032 SP-5) — the rosterV2 card layer owns the
 * "is this resident's card on screen" predicate. A card counts as on-screen
 * when it is MOUNTED — viewport culling is a rendering concern above this
 * seam, never part of eligibility.
 *
 * The decorative layer (`HeroLevelDecor`) registers each card on mount and
 * unregisters on unmount; `runHeroLevelUpStaging` reads the registry at
 * command time. Module-level Set: presentation state only, nothing persisted.
 */

const mounted = new Set<string>();

/**
 * Registers a mounted roster card. Returns the unregister callback (pair it
 * with the effect cleanup, or call it in an explicit teardown path).
 */
export const registerMountedCard = (residentId: string): (() => void) => {
  mounted.add(residentId);
  return () => {
    mounted.delete(residentId);
  };
};

/** True while a card for `residentId` is mounted anywhere in the rosterV2 layer. */
export const isCardMounted = (residentId: string): boolean => mounted.has(residentId);

/** Mounted resident ids — diagnostics and tests; callers must not mutate the result. */
export const mountedCardIds = (): readonly string[] => [...mounted];

/** Test helper: empties the registry (a roster unmount normally unregisters). */
export const clearMountedCardsForTest = (): void => {
  mounted.clear();
};
