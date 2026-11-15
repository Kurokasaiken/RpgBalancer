/**
 * expeditionBagAssign — R-339/PLAN-119 T3-S2 helpers (artifact-r004 D7 + S2
 * "consequence preview (food cost)").
 *
 * Pure derivations shared by the bound stash picker (`VillageStashPanel`,
 * the canonical stash surface — Director ruling 2026-11-15: roster e stash
 * restano superfici sempre separate) and the expedition drawer's reserved
 * cost cell (`cassetto-cost-slot`). Both read only the shared ledger bag
 * shape and config numbers — no UI state, no side effects.
 */

/** Per-row assign verdict the bound picker mirrors (D7 eligibility highlight). */
export type BagAssignEligibility = 'eligible' | 'packed' | 'bagFull';

/**
 * Whether a click on a shelf row for `itemId` can pack it into the bound
 * planner's bag RIGHT NOW — mirrors the ledger's own reject reasons
 * (`useVillageStashStore.assign`: 'alreadyInBag' / 'bagFull') so the UI can
 * mark the row before the click, not after it.
 *
 * `bag` is the bound owner's sparse slot array (`bags[poi.id]`, may be
 * undefined when the bag is still empty); `bagSlots` is
 * `QUEST_STASH.bagSlots` — the capacity when no bag exists yet.
 */
export function bagAssignEligibility(
  bag: readonly (string | null)[] | null | undefined,
  itemId: string,
  bagSlots: number,
): BagAssignEligibility {
  if (bag && bag.includes(itemId)) return 'packed';
  const free = bag ? bag.filter((slot) => slot == null).length : bagSlots;
  return free > 0 ? 'eligible' : 'bagFull';
}

/**
 * The food-cost consequence preview for the drawer's reserved cost cell:
 * the food the departing members will consume over the whole journey —
 * `partySize × totalDays × foodConsumptionPerResidentPerDay` (the same
 * `globalRules` rate the TimeEngine applies per daytime tick to every
 * living resident; away members keep eating from the shared village pool).
 * Display-only: it previews a consumption the engine already bills, it does
 * not introduce a new charge. Negative/NaN inputs collapse to 0 so a
 * malformed feed can never paint a negative cost.
 */
export function expeditionFoodCost(partySize: number, totalDays: number, perResidentPerDay: number): number {
  if (!Number.isFinite(partySize) || !Number.isFinite(totalDays) || !Number.isFinite(perResidentPerDay)) return 0;
  return Math.max(0, Math.ceil(partySize * totalDays * perResidentPerDay));
}
