/**
 * memorialHall — the log of the fallen (PLAN-067 T-C5, R-234, DEATH-1 = B).
 *
 * Every `resident-dead` effect of a settled run writes one entry: who, their level, where, and on
 * which day. Keys are `${runId}:${effectKey}`, so a replayed settlement never writes twice. Pure: the
 * store owns persistence, the «Memoriale» menu entry only reads the list.
 */
import type { SettlementPlan } from '@/ui/idleVillage/quests/questSettlement';

export interface MemorialEntry {
  /** `${runId}:${effectKey}` — the idempotency key. */
  key: string;
  name: string;
  level: number;
  place: string;
  day: number;
}

export interface MemorialContext {
  nameOf: (residentId: string) => string;
  levelOf: (residentId: string) => number;
  placeOf: (questId: string) => string;
  dayOf: (runId: string) => number;
}

export function memorialEntriesFromPlan(plan: SettlementPlan, ctx: MemorialContext): MemorialEntry[] {
  return plan.effects
    .filter((e) => e.kind === 'resident-dead' && e.residentId)
    .map((e) => ({
      key: `${plan.runId}:${e.key}`,
      name: ctx.nameOf(e.residentId!),
      level: ctx.levelOf(e.residentId!),
      place: ctx.placeOf(plan.questId),
      day: ctx.dayOf(plan.runId),
    }));
}

/** Appends only the entries whose key is not logged yet, keeping the order the deaths happened. */
export function appendMemorial(log: readonly MemorialEntry[], incoming: readonly MemorialEntry[]): MemorialEntry[] {
  const seen = new Set(log.map((e) => e.key));
  const fresh = incoming.filter((e) => !seen.has(e.key));
  return fresh.length === 0 ? [...log] : [...log, ...fresh];
}
