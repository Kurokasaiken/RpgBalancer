/**
 * nextEvent — what the centre tab of the top HUD says (PLAN-067 HUD-3 = P1, R-234).
 *
 * The event ledger already knows what is coming and when; the top HUD shows only the NEAREST one,
 * in one of three states. Nothing is invented: no event within the window means no tab at all —
 * never an empty frame.
 *
 *   alarm — a THREAT within 5 days (only danger lights the tab: a finished granary is news, not an alarm)
 *   quiet — the nearest other event within 10 days
 *   none  — nothing to say (the tab disappears)
 */
import type { HudEvent } from './HudEventLedger';

export type NextEventState = 'alarm' | 'quiet' | 'none';
export interface NextEventModel { state: NextEventState; event?: HudEvent }

export const NEXT_EVENT_THREAT_ALARM_DAYS = 5;
export const NEXT_EVENT_WINDOW_DAYS = 10;

export function nextEventModel(events: readonly HudEvent[]): NextEventModel {
  const near = events
    .filter((e) => !e.arriving && e.daysLeft <= NEXT_EVENT_WINDOW_DAYS)
    .sort((a, b) => a.daysLeft - b.daysLeft);
  const event = near[0];
  if (!event) return { state: 'none' };
  const alarm = event.typeId === 'threat' && event.daysLeft <= NEXT_EVENT_THREAT_ALARM_DAYS;
  return { state: alarm ? 'alarm' : 'quiet', event };
}
