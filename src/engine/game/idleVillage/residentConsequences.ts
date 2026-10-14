/**
 * residentConsequences — shared, pure per-resident consequence kernel
 * (R-186, plan `.mw/plans/r186-settlement-convergence.md` r003).
 *
 * The real game (`MinimalGameplayState`) and the canonical engine aggregate
 * (`VillageState` / `ResidentState`) used to each hand-roll wound/death/xp
 * writes. This module is the single source for the per-resident state
 * machine both sides delegate to:
 *
 *   Dead > Injured > Away/Available
 *
 * - `wound` — sets injured, extends recovery via `max(existing, now + d)`
 *   where `d = durationTicks ?? defaults.woundTicks`. No-op on the dead.
 * - `death` — terminal: clears every wound field, zeroes HP. Idempotent.
 * - `xp` — guarded delta (`xp + amount`), applied to whoever the caller
 *   targets (the /game plan only emits resident-xp for survivors).
 *
 * Deliberately OUT of scope (aggregate-specific, stay with the callers):
 * village gold/XP, loadout release, event-log lines, `isWorking` /
 * `isOnExpedition` flags (store-only), the applied-effects ledger
 * (caller-owned: `appliedQuestEffectIds` in `/game`, `resolvedInstances`
 * in the lab), and wound targeting/tier policy.
 */
import type { ResidentState, VillageState } from './TimeEngine';

/**
 * The normalized projection every aggregate can be compared on — the
 * parity contract between `MinimalResident` and `ResidentState`.
 */
export interface ResidentHealthSlice {
  dead: boolean;
  injured: boolean;
  /** Absolute target tick when the wound heals; null when not wounded. */
  injuredUntil: number | null;
  xp: number;
}

/** A single per-resident consequence, aggregate-agnostic. */
export type ResidentConsequence =
  | { kind: 'wound'; durationTicks?: number }
  | { kind: 'death' }
  | { kind: 'xp'; amount: number };

/** Per-aggregate defaults injected by the caller (config-first). */
export interface ConsequenceDefaults {
  /** Wound length used when the consequence carries no `durationTicks`. */
  woundTicks: number;
}

/**
 * Canonical idempotency key format — `${runId}:${effectKey}`. The ledger
 * itself stays caller-owned; this only single-sources the key shape so
 * `/game` and any future aggregate dedupe on the same convention.
 */
export function settlementEffectKey(runId: string, effectKey: string): string {
  return `${runId}:${effectKey}`;
}

/**
 * Validates a requested wound duration — finite integer `>= 1` — or falls
 * back to the aggregate default (itself clamped to `>= 1`).
 */
export function resolveWoundTicks(requested: number | undefined, fallback: number): number {
  if (typeof requested === 'number' && Number.isInteger(requested) && requested >= 1) {
    return requested;
  }
  return Number.isInteger(fallback) && fallback >= 1 ? fallback : 1;
}

/**
 * Pure per-resident transition shared by both aggregates. Operates on the
 * normalized slice so `MinimalResident` and `ResidentState` can never
 * diverge on wound/death/xp semantics again.
 */
export function reduceResidentHealth(
  health: ResidentHealthSlice,
  consequence: ResidentConsequence,
  nowTick: number,
  defaults: ConsequenceDefaults,
): ResidentHealthSlice {
  switch (consequence.kind) {
    case 'death':
      /* Terminal: clears every wound field, preserves accumulated xp. */
      return { dead: true, injured: false, injuredUntil: null, xp: health.xp };
    case 'wound': {
      if (health.dead) return health;
      const duration = resolveWoundTicks(consequence.durationTicks, defaults.woundTicks);
      return {
        ...health,
        injured: true,
        injuredUntil: Math.max(health.injuredUntil ?? 0, nowTick + duration),
      };
    }
    case 'xp':
      return { ...health, xp: health.xp + consequence.amount };
  }
}

/** Projection: canonical engine resident → comparable slice. */
export function normalizeResidentState(r: ResidentState): ResidentHealthSlice {
  return {
    dead: r.status === 'dead',
    injured: r.status === 'injured' || r.isInjured,
    injuredUntil: r.injuryRecoveryTime ?? null,
    xp: r.xp ?? 0,
  };
}

/**
 * Projection: gameplay-store resident → comparable slice. Typed structurally
 * (not `MinimalResident`) so this engine module takes no `src/ui` import.
 */
export function normalizeMinimalResident(r: {
  isDead?: boolean;
  isInjured: boolean;
  injuredUntilTick?: number;
  xp?: number;
}): ResidentHealthSlice {
  return {
    dead: r.isDead === true,
    injured: !r.isDead && r.isInjured,
    injuredUntil: r.isDead || !r.isInjured ? null : (r.injuredUntilTick ?? null),
    xp: r.xp ?? 0,
  };
}

/**
 * Apply a consequence to a canonical `ResidentState`. Death is terminal and
 * clears `isInjured`/`injuryRecoveryTime`/`currentHp`; a wound on an `away`
 * resident flips status to `injured` — the TimeEngine recovery sweep (R-139
 * guard) must not heal them while their activity still owns them, and
 * completion only transitions `away` members.
 */
export function applyConsequenceToResidentState(
  resident: ResidentState,
  consequence: ResidentConsequence,
  nowTick: number,
  defaults: ConsequenceDefaults,
): ResidentState {
  const next = reduceResidentHealth(normalizeResidentState(resident), consequence, nowTick, defaults);
  if (next.dead) {
    return {
      ...resident,
      status: 'dead',
      currentHp: 0,
      isInjured: false,
      injuryRecoveryTime: undefined,
      xp: next.xp,
    };
  }
  if (next.injured) {
    return {
      ...resident,
      status: 'injured',
      isInjured: true,
      injuryRecoveryTime: next.injuredUntil ?? undefined,
      xp: next.xp,
    };
  }
  return { ...resident, xp: next.xp };
}

/**
 * Batch adapter over `VillageState`: deterministic array order, zero RNG,
 * skips consequences for unknown ids. No ledger — idempotency is the
 * caller's job (`appliedQuestEffectIds`, `resolvedInstances`, …).
 */
export function applyConsequencesToVillage(
  state: VillageState,
  entries: ReadonlyArray<{ residentId: string; consequence: ResidentConsequence }>,
  nowTick: number,
  defaults: ConsequenceDefaults,
): VillageState {
  if (entries.length === 0) return state;
  const residents = { ...state.residents };
  let touched = false;
  for (const { residentId, consequence } of entries) {
    const r = residents[residentId];
    if (!r) continue;
    residents[residentId] = applyConsequenceToResidentState(r, consequence, nowTick, defaults);
    touched = true;
  }
  return touched ? { ...state, residents } : state;
}
