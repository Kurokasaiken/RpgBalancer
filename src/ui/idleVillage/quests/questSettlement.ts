/**
 * questSettlement — persistent, idempotent settlement of a concluded run
 * (PLAN-019-S2.5 T-2).
 *
 * Contract:
 * - `deriveSettlementPlan(run)` — pure: terminal state → frozen effect list.
 * - `settleRun(run, deps)` — journal: mark `settling` → apply effects →
 *   mark `settled`, each step persisted before the next begins.
 * - Effects are idempotent by `(runId, effectKey)` — the applied-key ledger
 *   lives INSIDE the mutated aggregate (the gameplay snapshot), so mutation
 *   + dedup key share one durable write (r2: no separate ledger table).
 * - Fungible resources use guarded deltas, never set-to-expected.
 * - Replay: a `settling` run re-applies the same frozen plan; already-keyed
 *   effects are skipped, the marker converges to `settled`.
 */
import type { MinimalGameplayState } from '@/store/useMinimalGameplay';
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { QUEST_SETTLEMENT } from '@/balancing/config/idleVillage/quests/questSettlement';

/* ---- Effect plan (pure) ------------------------------------------------ */

export type SettlementEffectKind =
  | 'village-gold'
  | 'village-xp'
  | 'resident-wounded'
  | 'resident-dead'
  | 'loadout-release';

export interface SettlementEffect {
  /** Deduplication key within the run — the full idempotency key is
   *  `${runId}:${effect.key}`. */
  key: string;
  kind: SettlementEffectKind;
  residentId?: string;
  amount?: number;
}

export interface SettlementPlan {
  runId: string;
  questId: string;
  outcome: string;
  /** Leader survived to settlement — gates reward eligibility (matrice T-1). */
  leaderAlive: boolean;
  objectiveDone: boolean;
  effects: SettlementEffect[];
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
export function deriveSettlementPlan(run: QuestRunState): SettlementPlan {
  const runId = runIdOf(run);
  const leader = run.party[0];
  const wipe = run.outcome === 'wipe';
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
    leaderAlive: Boolean(leader && !leader.dead),
    objectiveDone: run.objectiveDone,
    effects,
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

/**
 * Apply a plan's effects to the minimal gameplay slice. Idempotent: effects
 * whose key is already in `appliedQuestEffectIds` are skipped. Fungible
 * resources use guarded deltas; `resident-dead`/`resident-wounded` are
 * set-to-expected (r2: discrete states). Returns the new state — the caller
 * commits it in ONE store write so mutation + ledger share the aggregate.
 */
export function applyPlanToState(
  state: MinimalState,
  plan: SettlementPlan,
  tick: number,
): ApplyResult {
  const ledger = new Set(state.appliedQuestEffectIds ?? []);
  const appliedNow: string[] = [];
  let gold = state.gold;
  let xp = state.xp;
  const injuredUntil = tick + QUEST_SETTLEMENT.woundRecoveryTicks;
  const residents = state.residents.map((r) => ({ ...r }));

  for (const effect of plan.effects) {
    const key = `${plan.runId}:${effect.key}`;
    if (ledger.has(key)) continue;
    switch (effect.kind) {
      case 'village-gold':
        gold += effect.amount ?? 0;
        break;
      case 'village-xp':
        xp += effect.amount ?? 0;
        break;
      case 'resident-wounded': {
        const r = residents.find((x) => x.id === effect.residentId);
        if (r && !r.isDead) {
          r.isInjured = true;
          r.isWorking = false;
          r.injuredUntilTick = Math.max(r.injuredUntilTick ?? 0, injuredUntil);
        }
        break;
      }
      case 'resident-dead': {
        const r = residents.find((x) => x.id === effect.residentId);
        if (r) {
          r.isDead = true;
          r.isInjured = false;
          r.isWorking = false;
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
  }

  return { next: { ...state, gold, xp, residents, appliedQuestEffectIds: [...ledger] }, appliedNow };
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
  /** Test seam (T-3): throws after the named journal step to simulate a
   *  crash mid-settlement. Never enabled in production paths. */
  fault?: { crashAfter?: 'intent' | 'effects' };
}

/**
 * Drive one settlement step to completion. Idempotent and replayable: if the
 * run is already `settled` this is a no-op; a `settling` run re-derives its
 * plan and re-applies it (dedup keys make re-application free).
 */
export async function settleRun(run: QuestRunState, deps: SettlementDeps): Promise<SettlementMarker> {
  const existing = run.settlement;
  if (existing?.status === 'settled') return existing;

  const plan = existing?.plan ?? deriveSettlementPlan(run);

  if (!existing || existing.status !== 'settling') {
    const intent: SettlementMarker = { status: 'settling', plan, atTick: deps.nowTick() };
    await deps.persistRun(intent);
  }
  deps.fault?.crashAfter === 'intent' && raiseCrash('intent');

  deps.applyToStore(plan);
  if (deps.releaseLoadout) await deps.releaseLoadout(plan.runId);
  deps.fault?.crashAfter === 'effects' && raiseCrash('effects');

  const done: SettlementMarker = { status: 'settled', plan, atTick: deps.nowTick() };
  await deps.persistRun(done);
  return done;
}

function raiseCrash(step: string): never {
  throw new Error(`settlement fault injection: crash after ${step}`);
}
