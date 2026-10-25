/**
 * R-281 roster→seat replace planner: a roster medallion dropped on an
 * occupied seat takes the seat; the displaced resident leaves `assignments`
 * entirely and lands back in the (derived) roster — no eligibility gate on
 * the way out, the roster accepts everyone. The incoming resident still
 * crosses the same gate a drop on an empty seat would
 * (`isEligible(residentId, toSlot)`), so a replace can never seat someone a
 * direct drop would refuse.
 *
 * Sibling of `planSlotSwap` (questExpedition.ts); kept in its own module so
 * an additive change here does not touch that file's INV import-closures.
 *
 * @param assignments The session's slot→resident map (sparse: untouched
 *   seats have no key — membership cannot stand in for seat existence,
 *   which stays the caller's duty via `controller.slots`/`slotBlueprints`).
 * @param toSlot POI-scoped slot id the drop lands on.
 * @param residentId The roster resident being dragged.
 * @param isEligible The session's quest eligibility gate.
 * @returns The next assignments map, or `null` when the drop is refused
 *   (resident already seated there, or an ineligible landing).
 */
export function planRosterSlotReplace(
  assignments: Record<string, string | null>,
  toSlot: string,
  residentId: string,
  isEligible: (residentId: string, slotId: string) => boolean,
): Record<string, string | null> | null {
  if (assignments[toSlot] === residentId) return null;
  if (!isEligible(residentId, toSlot)) return null;
  return { ...assignments, [toSlot]: residentId };
}
