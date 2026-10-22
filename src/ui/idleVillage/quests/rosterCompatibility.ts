/**
 * rosterCompatibility — R-241 B5: composes the per-session
 * `getResidentCompatibility` resolvers that feed the `/game` roster cards.
 *
 * Planner slot compatibility is only meaningful while planning. As soon as
 * one session flags its quest context live (an unsettled expedition run, a
 * POI quest running or awaiting collect) the whole composition ABSTAINS —
 * `undefined` — so cards paint resident statuses (ferito, morto in grigio,
 * assigned, away) instead of «Nessuno slot compatibile» noise. With no
 * quest live, the first session that answers wins (unchanged semantics).
 */
import type { GetResidentCompatibility } from '@/ui/idleVillage/components/ResidentRosterTypes';

/** One session's contribution: a live-quest flag plus its own resolver. */
export interface RosterCompatibilitySource {
  /** True while this session's quest lifecycle is active — the roster must
   *  abstain from planner compatibility entirely. */
  contextActive: boolean;
  /** The session's own compatibility resolver (may itself abstain). */
  getResidentCompatibility: GetResidentCompatibility;
}

/**
 * Compose the sessions' resolvers into one roster-level function.
 * Any `contextActive` source short-circuits the chain to `undefined`;
 * otherwise the first non-undefined answer wins (expeditions before the
 * POI fallback, as the page already ordered them).
 */
export function composeRosterCompatibility(
  sources: ReadonlyArray<RosterCompatibilitySource>,
): GetResidentCompatibility {
  return (residentId) => {
    if (sources.some((s) => s.contextActive)) return undefined;
    for (const s of sources) {
      const answer = s.getResidentCompatibility(residentId);
      if (answer !== undefined) return answer;
    }
    return undefined;
  };
}
