/**
 * questSettlement — persistent, idempotent settlement of a concluded run
 * (PLAN-019-S2.5 T-2).
 *
 * Contract:
 * - `deriveSettlementPlan(run)` — pure: terminal state → frozen effect list.
 * - `beginSettlement(run, deps)` — persists `settling` (frozen plan, the
 *   durable "report shown" bit) with no aggregate mutation.
 * - `commitSettlement(run, deps)` — applies the plan's effects, releases the
 *   loadout, persists `settled` (R-260: the report's dismissal boundary).
 * - `settleRun(run, deps)` — the composed begin+commit driver for tests and
 *   non-UI callers.
 * - Effects are idempotent by `(runId, effectKey)` — the applied-key ledger
 *   lives INSIDE the mutated aggregate (the gameplay snapshot), so mutation
 *   + dedup key share one durable write (r2: no separate ledger table).
 * - Fungible resources use guarded deltas, never set-to-expected.
 * - Replay: a `settling` run re-applies the same frozen plan; already-keyed
 *   effects are skipped, the marker converges to `settled`.
 */
import type { MinimalGameplayState } from '@/store/useMinimalGameplay';
import type { MinimalActivityEntry } from '@/ui/idleVillage/config/activityLogPanelConfig';
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { QUEST_SETTLEMENT } from '@/balancing/config/idleVillage/quests/questSettlement';
import {
  normalizeMinimalResident,
  reduceResidentHealth,
  settlementEffectKey,
  type ConsequenceDefaults,
} from '@/engine/game/idleVillage/residentConsequences';

/* ---- Effect plan (pure) ------------------------------------------------ */

export type SettlementEffectKind =
  | 'village-gold'
  | 'village-xp'
  | 'resident-xp'
  | 'resident-wounded'
  | 'resident-dead'
  | 'loadout-release';

export interface SettlementEffect {
  /** Deduplication key within the run — the full idempotency key is
   *  `${runId}:${effect.key}` (built via `settlementEffectKey`). */
  key: string;
  kind: SettlementEffectKind;
  residentId?: string;
  amount?: number;
  /**
   * Optional per-effect wound length in caller ticks (R-186): when present
   * it overrides `QUEST_SETTLEMENT.woundRecoveryTicks`, letting future
   * tiered harm ride the same effect shape the lab uses (1/3/7d tiers).
   */
  durationTicks?: number;
}

export interface SettlementPlan {
  runId: string;
  questId: string;
  outcome: string;
  /**
   * Authored quest display title — carried for the event-log/epilogue copy.
   * Passed in by the caller (the scenario registry is behind an import the
   * gameplay store cannot take); falls back to `questId` in the copy.
   */
  questTitle?: string;
  /** Leader survived to settlement — gates reward eligibility (matrice T-1). */
  leaderAlive: boolean;
  objectiveDone: boolean;
  effects: SettlementEffect[];
  /** Every party member id — `applyPlanToState` releases their
   *  `isOnExpedition` flag in the same aggregate write as the effects
   *  (R-139: the release IS part of settlement — the party is «home»). */
  partyIds?: string[];
}

export interface SettlementMarker {
  status: 'settling' | 'settled';
  plan: SettlementPlan;
  /** Caller tick when status last transitioned. */
  atTick: number;
}

/**
 * Freeze the effect list for a terminal run. Pure — reads only the run record
 * (party fates, loot, `resolvedOffer.rewardResolved`). Wipe drops everything.
 */
export function deriveSettlementPlan(
  run: QuestRunState,
  opts?: { questTitle?: string },
): SettlementPlan {
  const runId = runIdOf(run);
  const leader = run.party[0];
  const wipe = run.outcome === 'wipe';
  const partyIds = run.party.map((member) => member.id);
  const effects: SettlementEffect[] = [];

  run.party.forEach((member, idx) => {
    if (member.dead) {
      effects.push({ key: `dead:${idx}:${member.id}`, kind: 'resident-dead', residentId: member.id });
    } else if (member.wounded) {
      effects.push({ key: `wounded:${idx}:${member.id}`, kind: 'resident-wounded', residentId: member.id });
    }
  });

  if (!wipe) {
    if (run.outcome === 'reward' && run.resolvedOffer && run.resolvedOffer.rewardResolved > 0) {
      effects.push({
        key: 'reward:village-gold',
        kind: 'village-gold',
        amount: run.resolvedOffer.rewardResolved,
      });
    }
    if (run.gold > 0) {
      effects.push({ key: 'loot:village-gold', kind: 'village-gold', amount: run.gold });
    }
    if (run.xp > 0) {
      effects.push({ key: 'xp:village', kind: 'village-xp', amount: run.xp });
      /* R-183: the same XP lands on every member who came home alive. */
      const survivors = run.party
        .map((member, idx) => ({ member, idx }))
        .filter(({ member }) => !member.dead);
      const each =
        QUEST_SETTLEMENT.residentXp.mode === 'split'
          ? Math.floor(run.xp / Math.max(1, survivors.length))
          : run.xp;
      if (each > 0) {
        survivors.forEach(({ member, idx }) => {
          effects.push({ key: `xp:resident:${idx}:${member.id}`, kind: 'resident-xp', residentId: member.id, amount: each });
        });
      }
    }
  }

  /* The expedition loadout reservation (S2.5 step 8) releases here — the
   * bag module already keys rows on runId so the release is naturally
   * idempotent; it is modelled as an effect for the journal's fault
   * boundary even though it does not mutate the gameplay aggregate. */
  effects.push({ key: 'loadout:release', kind: 'loadout-release' });

  return {
    runId,
    questId: run.questId,
    outcome: run.outcome,
    questTitle: opts?.questTitle,
    leaderAlive: Boolean(leader && !leader.dead),
    objectiveDone: run.objectiveDone,
    effects,
    partyIds,
  };
}

/** The run's stable identity for idempotency keys — scenario instance id if
 *  the run was launched from a resolved offer, else quest+seed+launch tick. */
export function runIdOf(run: QuestRunState): string {
  return (
    run.scenarioInstanceId ??
    `${run.questId}#${run.seed}@${run.launchedAtTick ?? run.frontier.startedAt}`
  );
}

/* ---- Store application (pure) ------------------------------------------ */

type MinimalState = MinimalGameplayState['state'];

export interface ApplyResult {
  next: MinimalState;
  /** Effect keys applied by THIS call (dedup vs the co-located ledger). */
  appliedNow: string[];
}

export interface ApplyOptions {
  /**
   * Tail cap for the persisted `eventLog` — the store passes its own limit
   * (`EVENT_LOG_LIMIT`); tests may omit it for an unbounded log.
   */
  eventLogLimit?: number;
}

/** Ledger key for the quest-outcome log line — deduped like an effect key. */
const OUTCOME_LOG_KEY = 'log:outcome';

/**
 * i18n keys for the settlement log lines (namespace `idleVillage`). The
 * keys are code constants, not authored content: the translated text lives
 * in `gameFrame.questLog.*`, this map only names it.
 */
const LOG_KEY = {
  outcomePrefix: 'gameFrame.questLog.outcome.',
  residentDead: 'gameFrame.questLog.residentDead',
  residentWounded: 'gameFrame.questLog.residentWounded',
  goldReward: 'gameFrame.questLog.goldReward',
  goldLoot: 'gameFrame.questLog.goldLoot',
  xp: 'gameFrame.questLog.xp',
  residentXp: 'gameFrame.questLog.residentXp',
} as const;

/**
 * The one headline entry per run — quest title + outcome, severity from
 * `QUEST_SETTLEMENT.logSeverity`. Keyed in the same ledger as effects so a
 * settlement replay never narrates twice.
 */
function outcomeLogEntry(plan: SettlementPlan, timestamp: number): MinimalActivityEntry {
  const quest = plan.questTitle ?? plan.questId;
  const severity =
    QUEST_SETTLEMENT.logSeverity.outcome[plan.outcome] ??
    QUEST_SETTLEMENT.logSeverity.outcomeFallback;
  return {
    id: `${plan.runId}:${OUTCOME_LOG_KEY}`,
    timestamp,
    severity,
    message: `Expedition "${quest}" — outcome: ${plan.outcome}.`,
    messageKey: `${LOG_KEY.outcomePrefix}${plan.outcome}`,
    messageParams: { quest },
    activityId: plan.questId,
    type: 'quest_outcome',
  };
}

/**
 * Event-log line for a single applied effect — null for effects that stay
 * silent (loadout release is internal bookkeeping). The entry id is the
 * effect's own ledger key: deterministic, unique, replay-stable.
 */
function effectLogEntry(
  effect: SettlementEffect,
  plan: SettlementPlan,
  residents: MinimalState['residents'],
  timestamp: number,
): MinimalActivityEntry | null {
  const sev = QUEST_SETTLEMENT.logSeverity;
  const quest = plan.questTitle ?? plan.questId;
  const base = {
    id: settlementEffectKey(plan.runId, effect.key),
    timestamp,
    activityId: plan.questId,
    type: 'quest_settlement' as const,
  };
  switch (effect.kind) {
    case 'resident-dead': {
      const name =
        residents.find((r) => r.id === effect.residentId)?.name ?? effect.residentId ?? 'unknown';
      return {
        ...base,
        severity: sev.residentDead,
        residentId: effect.residentId,
        message: `${name} fell on the expedition.`,
        messageKey: LOG_KEY.residentDead,
        messageParams: { name },
      };
    }
    case 'resident-wounded': {
      const name =
        residents.find((r) => r.id === effect.residentId)?.name ?? effect.residentId ?? 'unknown';
      return {
        ...base,
        severity: sev.residentWounded,
        residentId: effect.residentId,
        message: `${name} came back wounded from the expedition.`,
        messageKey: LOG_KEY.residentWounded,
        messageParams: { name },
      };
    }
    case 'village-gold': {
      const amount = effect.amount ?? 0;
      const isReward = effect.key.startsWith('reward:');
      return {
        ...base,
        severity: sev.villageGold,
        message: isReward
          ? `Quest reward: +${amount} gold (${quest}).`
          : `Loot: +${amount} gold (${quest}).`,
        messageKey: isReward ? LOG_KEY.goldReward : LOG_KEY.goldLoot,
        messageParams: { amount, quest },
      };
    }
    case 'village-xp': {
      const amount = effect.amount ?? 0;
      return {
        ...base,
        severity: sev.villageXp,
        message: `Expedition experience: +${amount} XP (${quest}).`,
        messageKey: LOG_KEY.xp,
        messageParams: { amount, quest },
      };
    }
    case 'resident-xp': {
      const amount = effect.amount ?? 0;
      const name =
        residents.find((r) => r.id === effect.residentId)?.name ?? effect.residentId ?? 'unknown';
      return {
        ...base,
        severity: sev.residentXp,
        residentId: effect.residentId,
        message: `${name} gained ${amount} XP (${quest}).`,
        messageKey: LOG_KEY.residentXp,
        messageParams: { name, amount, quest },
      };
    }
    default:
      return null;
  }
}

/**
 * Apply a plan's effects to the minimal gameplay slice. Idempotent: effects
 * whose key is already in `appliedQuestEffectIds` are skipped. Fungible
 * resources use guarded deltas; `resident-dead`/`resident-wounded` are
 * set-to-expected (r2: discrete states). Returns the new state — the caller
 * commits it in ONE store write so mutation + ledger share the aggregate.
 *
 * The same call also writes the village's memory of the run: one outcome
 * headline plus one line per applied effect into `eventLog` (PLAN-019-S4
 * T-1), deduped through the same ledger — a replay never narrates twice.
 */
export function applyPlanToState(
  state: MinimalState,
  plan: SettlementPlan,
  tick: number,
  opts?: ApplyOptions,
): ApplyResult {
  const ledger = new Set(state.appliedQuestEffectIds ?? []);
  const appliedNow: string[] = [];
  let gold = state.gold;
  let xp = state.xp;
  /* R-186: wound/death/xp semantics come from the shared engine kernel —
   * same reducer the canonical VillageState adapter uses. Store-only
   * fields (isWorking, isOnExpedition) stay the caller's concern. */
  const consequenceDefaults: ConsequenceDefaults = {
    woundTicks: QUEST_SETTLEMENT.woundRecoveryTicks,
  };
  const residents = state.residents.map((r) => ({ ...r }));
  const logEntries: MinimalActivityEntry[] = [];
  const now = Date.now();

  /* The outcome headline rides the same ledger as effects — it is written
   * once per run even on crash→replay, but it is not an "applied effect"
   * so it stays out of `appliedNow` (telemetry counts real effects only). */
  const outcomeKey = settlementEffectKey(plan.runId, OUTCOME_LOG_KEY);
  if (!ledger.has(outcomeKey)) {
    logEntries.push(outcomeLogEntry(plan, now));
    ledger.add(outcomeKey);
  }

  for (const effect of plan.effects) {
    const key = settlementEffectKey(plan.runId, effect.key);
    if (ledger.has(key)) continue;
    switch (effect.kind) {
      case 'village-gold':
        gold += effect.amount ?? 0;
        break;
      case 'village-xp':
        xp += effect.amount ?? 0;
        break;
      case 'resident-xp': {
        /* Guarded delta, like the fungible village totals. */
        const r = residents.find((x) => x.id === effect.residentId);
        if (r) {
          r.xp = reduceResidentHealth(
            normalizeMinimalResident(r),
            { kind: 'xp', amount: effect.amount ?? 0 },
            tick,
            consequenceDefaults,
          ).xp;
        }
        break;
      }
      case 'resident-wounded': {
        const r = residents.find((x) => x.id === effect.residentId);
        if (r) {
          const next = reduceResidentHealth(
            normalizeMinimalResident(r),
            { kind: 'wound', durationTicks: effect.durationTicks },
            tick,
            consequenceDefaults,
          );
          if (!next.dead) {
            r.isInjured = next.injured;
            r.isWorking = false;
            r.injuredUntilTick = next.injuredUntil ?? undefined;
          }
        }
        break;
      }
      case 'resident-dead': {
        const r = residents.find((x) => x.id === effect.residentId);
        if (r) {
          /* Death is terminal and clears every wound field — including the
           * previously-leaked `injuredUntilTick` (declared delta, WITNESS-04:
           * the type contract says «the wound fields are cleared»). */
          const next = reduceResidentHealth(
            normalizeMinimalResident(r),
            { kind: 'death' },
            tick,
            consequenceDefaults,
          );
          r.isDead = next.dead;
          r.isInjured = next.injured;
          r.isWorking = false;
          r.injuredUntilTick = next.injuredUntil ?? undefined;
        }
        break;
      }
      case 'loadout-release':
        /* Handled by the orchestrator (bag reservation release), not the
         * gameplay aggregate — still keyed so the journal records it. */
        break;
    }
    ledger.add(key);
    appliedNow.push(key);
    const entry = effectLogEntry(effect, plan, residents, now);
    if (entry) logEntries.push(entry);
  }

  /* R-139: settlement IS the homecoming — release the expedition flag on
   *  every party member in the same aggregate write. Unconditional (not
   *  ledger-keyed): setting `false` twice is free, and a replayed plan on a
   *  snapshot where the flag still stands must still release it. */
  if (plan.partyIds?.length) {
    const released = new Set(plan.partyIds);
    residents.forEach((r) => {
      if (released.has(r.id)) r.isOnExpedition = false;
    });
  }

  const eventLog =
    logEntries.length > 0
      ? [...(state.eventLog ?? []), ...logEntries].slice(-(opts?.eventLogLimit ?? Infinity))
      : state.eventLog;

  return {
    next: { ...state, gold, xp, residents, eventLog, appliedQuestEffectIds: [...ledger] },
    appliedNow,
  };
}

/* ---- Orchestration (journal over the two aggregates) ------------------- */

export interface SettlementDeps {
  /** Persist the run record with an updated settlement marker. */
  persistRun: (marker: SettlementMarker) => Promise<void> | void;
  /** Commit the store mutation (single aggregate write: effects + ledger). */
  applyToStore: (plan: SettlementPlan) => void;
  /** Release the expedition loadout reservation for this runId. */
  releaseLoadout?: (runId: string) => Promise<void> | void;
  nowTick: () => number;
  /** Authored quest display title — frozen into the plan for log/epilogue
   *  copy (`SettlementPlan.questTitle`). */
  questTitle?: string;
  /** Test seam (T-3): throws after the named journal step to simulate a
   *  crash mid-settlement. Never enabled in production paths. */
  fault?: { crashAfter?: 'intent' | 'effects' };
}

/**
 * The village-resource delta a committed plan grants (R-260) — the HUD's
 * transient «+N» feedback. Derived FROM the frozen plan, not recomputed
 * elsewhere, so the chip can never tell a different story than the ledger.
 */
export function settlementResourceDelta(plan: SettlementPlan): { gold: number; xp: number } {
  let gold = 0;
  let xp = 0;
  for (const effect of plan.effects) {
    if (effect.kind === 'village-gold') gold += effect.amount ?? 0;
    else if (effect.kind === 'village-xp') xp += effect.amount ?? 0;
  }
  return { gold, xp };
}

/**
 * Journal step 1 (R-260): stamp `settling` — the frozen plan + the durable
 * "report shown" bit. Persists WITHOUT touching the gameplay aggregate:
 * resources must not move until the report is dismissed. Idempotent — a run
 * already carrying a marker returns it unchanged (never regresses `settled`).
 */
export async function beginSettlement(run: QuestRunState, deps: SettlementDeps): Promise<SettlementMarker> {
  const existing = run.settlement;
  if (existing) return existing;
  const plan = deriveSettlementPlan(run, { questTitle: deps.questTitle });
  const intent: SettlementMarker = { status: 'settling', plan, atTick: deps.nowTick() };
  await deps.persistRun(intent);
  return intent;
}

/**
 * Journal step 2 (R-260): commit — apply the frozen plan's effects, release
 * the loadout, persist `settled`. Idempotent and replayable: a `settled` run
 * is a no-op; a `settling` run re-applies its own plan (dedup keys make
 * re-application free); an unmarked run begins implicitly so a dismissal
 * never needs a prior begin to land its grant.
 */
export async function commitSettlement(run: QuestRunState, deps: SettlementDeps): Promise<SettlementMarker> {
  const existing = run.settlement;
  if (existing?.status === 'settled') return existing;
  const marker = existing ?? (await beginSettlement(run, deps));

  deps.applyToStore(marker.plan);
  if (deps.releaseLoadout) await deps.releaseLoadout(marker.plan.runId);
  deps.fault?.crashAfter === 'effects' && raiseCrash('effects');

  const done: SettlementMarker = { status: 'settled', plan: marker.plan, atTick: deps.nowTick() };
  await deps.persistRun(done);
  return done;
}

/**
 * The one-shot driver: begin + commit in the same call. Kept for tests and
 * non-UI callers — the UI path drives the two steps separately so the
 * report's show/dismiss boundary owns the commit (R-260).
 */
export async function settleRun(run: QuestRunState, deps: SettlementDeps): Promise<SettlementMarker> {
  const existing = run.settlement;
  if (existing?.status === 'settled') return existing;

  let marker = existing;
  if (!marker) {
    marker = await beginSettlement(run, deps);
    deps.fault?.crashAfter === 'intent' && raiseCrash('intent');
  }

  return commitSettlement({ ...run, settlement: marker }, deps);
}

function raiseCrash(step: string): never {
  throw new Error(`settlement fault injection: crash after ${step}`);
}
