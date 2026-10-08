/**
 * questS1Lab/questPhaseRecord — what happened in each quest phase (R-106).
 *
 * The running-quest window shows one tile per phase already played plus the
 * next one. Each tile needs the *pertinent* part of the run — who lost how
 * many HP, who died, items found or spent, loot — so the window never parses
 * free log text: it reads the structured harms the engine already emits
 * (`ResolvedCheck.harms`, `recentHarms`) and diffs loot and bag flags around
 * the player action.
 */

import type { HarmEvent, LogEntry, QuestRunState } from './questRun';
import type { Verdict } from './questScenario';

/** Log kinds a phase tooltip shows; choices and node headers stay in the chronicle. */
export const PERTINENT_LOG_KINDS: ReadonlySet<LogEntry['kind']> = new Set([
  'CHECK',
  'WOUND',
  'DEATH',
  'DEATH_SAVE',
  'INTERCEPT',
  'HARM',
  'LOOT',
  'RETREAT',
  'QUEST_END',
]);

export interface PhaseRecord {
  beat: number;
  /** Labels of the options the player took in this phase. */
  choices: string[];
  /** Verdicts of the checks resolved in this phase, in order. */
  verdicts: Verdict[];
  harms: HarmEvent[];
  lootGained: string[];
  /** Bag flags (consumables) spent in this phase. */
  itemsSpent: string[];
  lines: LogEntry[];
}

export type PhaseOutcome = 'death' | 'hurt' | 'loot' | 'clean';

export const emptyPhase = (beat: number): PhaseRecord => ({
  beat,
  choices: [],
  verdicts: [],
  harms: [],
  lootGained: [],
  itemsSpent: [],
  lines: [],
});

/** Snapshot taken BEFORE `applyChoice` (the engine mutates the run in place). */
export interface RunSnapshot {
  logLength: number;
  loot: string[];
  flags: string[];
}

export const snapshotRun = (run: QuestRunState): RunSnapshot => ({
  logLength: run.log.length,
  loot: [...run.loot],
  flags: [...run.flags],
});

/** Folds the effects of one player action into the phase it was taken in. */
export function recordAction(
  phase: PhaseRecord,
  before: RunSnapshot,
  after: QuestRunState,
  choiceLabel: string | undefined,
  bagFlags: ReadonlySet<string>,
): PhaseRecord {
  const fresh = after.log.slice(before.logLength);
  return {
    ...phase,
    choices: choiceLabel ? [...phase.choices, choiceLabel] : phase.choices,
    verdicts: [...phase.verdicts, ...after.checkQueue.map((c) => c.verdict)],
    harms: [...phase.harms, ...after.checkQueue.flatMap((c) => c.harms), ...after.recentHarms],
    lootGained: [...phase.lootGained, ...after.loot.filter((item) => !before.loot.includes(item))],
    itemsSpent: [...phase.itemsSpent, ...before.flags.filter((f) => bagFlags.has(f) && !after.flags.includes(f))],
    lines: [...phase.lines, ...fresh.filter((e) => PERTINENT_LOG_KINDS.has(e.kind))],
  };
}

/** The worst thing that happened in the phase — drives the tile's mark and tone. */
export function phaseOutcome(phase: PhaseRecord): PhaseOutcome {
  if (phase.harms.some((h) => h.kind === 'death')) return 'death';
  if (phase.harms.some((h) => h.amount > 0)) return 'hurt';
  if (phase.lootGained.length > 0) return 'loot';
  return 'clean';
}

/** HP lost per member in the phase (deaths included), largest first. */
export function hpLostByMember(phase: PhaseRecord): { memberId: string; amount: number; died: boolean }[] {
  const byId = new Map<string, { memberId: string; amount: number; died: boolean }>();
  for (const h of phase.harms) {
    const row = byId.get(h.memberId) ?? { memberId: h.memberId, amount: 0, died: false };
    row.amount += Math.max(0, h.hpBefore - h.hpAfter);
    row.died ||= h.kind === 'death';
    byId.set(h.memberId, row);
  }
  return [...byId.values()].sort((a, b) => b.amount - a.amount);
}
