/**
 * eventsBarModel — pure selection model for the collapsed Events bar.
 * Kept component-free so it can be shared/tested without weakening the
 * fast-refresh boundary of HudRealEventsBar.
 */
import type { HudEvent } from '@/ui/idleVillage/components/gameFrame/HudEventLedger';

/**
 * Pick the event the collapsed bar represents. Event types listed in
 * `pinnedTypeIds` (currently the ledger's `pinTypesWhenCollapsed`, threat
 * first) outrank everything else; inside the chosen group the nearest deadline
 * wins and ties keep the host's authored order. Rows still travelling into the
 * ledger (`arriving`) are hidden until their hand-off completes.
 */
export function selectEventsBarEvent(
  events: readonly HudEvent[],
  pinnedTypeIds: readonly string[],
): HudEvent | undefined {
  const visible = events.filter((event) => !event.arriving);
  if (visible.length === 0) return undefined;
  const pinned = visible.filter((event) => pinnedTypeIds.includes(event.typeId));
  const candidates = pinned.length > 0 ? pinned : visible;
  return candidates.reduce((best, event) => (event.daysLeft < best.daysLeft ? event : best), candidates[0]);
}
