/**
 * missionResolver — stochastic counterpart of the Mission Planner DP
 * (MP-06, PLAN-018 T-006).
 *
 * `computeMissionPreview` (missionPlannerMath) enumerates the outcome
 * distribution analytically; this module samples one run from *the same
 * model*: the same weakest-tag phase check, the same per-member risk rates,
 * dead members leave the living set for later phases, injured members keep
 * rolling, checkpoints honour the player's continue/retreat decision (D2),
 * and a wipe forces `deadly` (spec §4.3).
 *
 * The DP stays the normative contract — the resolver is validated against it
 * by seeded agreement tests (tests/unit/idleVillage/missionResolver.test.ts).
 */

import {
  classifyTier,
  memberPhaseRisk,
  phaseSuccessBound,
  phaseWeakestStat,
  type MissionConsumableSpec,
  type MissionItemEffect,
  type MissionPlannerInput,
  type QuestOutcomeTier,
} from './missionPlannerMath';
import {
  DEFAULT_QUEST_SKILL_CHECK_CONFIG,
  type QuestSkillCheckConfig,
} from '@/balancing/config/idleVillage/quests/questSkillCheckConfig';
import type { QuestBlueprint } from '@/balancing/config/idleVillage/quests/questBlueprints.schema';
import { defaultQuestItems } from '@/balancing/config/idleVillage/quests/questItems';
import type { ResidentState } from './TimeEngine';
import type { LoadoutAssignment } from './missionPlannerLoadout';
import {
  buildMissionInput,
  buildMissionPhaseSpecs,
  type MissionDraftConsumable,
} from './missionPlannerEngine';
import {
  toMissionDraft,
  type MissionPlannerDraft,
  type PlannerLiveState,
  type PlannerSlotSpec,
} from './missionPlannerDraft';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Per-member state that persists across phases (spec §4.1). */
export type MemberLifeState = 'alive' | 'injured' | 'dead';

/** One member's risk roll inside a resolved phase. */
export interface MemberRiskRoll {
  residentId: string;
  /** Integer d100 in [1, 100]. */
  riskRoll: number;
  dead: boolean;
  wounded: boolean;
}

/** A resolved phase: the party verdict plus every member's risk roll. */
export interface ResolvedMissionPhase {
  phaseIndex: number;
  phaseId: string;
  verdict: 'epicfail' | 'bigwin' | 'win' | 'almost' | 'fail';
  /** `passed` follows the MP-06 contract: only `win` and `bigwin` pass. */
  passed: boolean;
  roll: number;
  skillTag: string | null;
  memberRolls: MemberRiskRoll[];
  /** Bitmask over `input.members` still alive after this phase. */
  aliveMaskAfter: number;
}

/** Snapshot handed to the continue/retreat decision between phases (D2). */
export interface MissionRunCheckpoint {
  /** Index of the phase just resolved (0-based). */
  phaseIndex: number;
  aliveMask: number;
  passedPhases: number;
  playedPhases: number;
}

/** The sampled outcome of a full expedition run. */
export interface MissionRunResult {
  phases: ResolvedMissionPhase[];
  /** Final state of every member, keyed by resident id. */
  memberOutcomes: Record<string, MemberLifeState>;
  playedPhases: number;
  passedPhases: number;
  anyDeath: boolean;
  /** Every member died — the run stops and the tier is forced `deadly`. */
  wiped: boolean;
  /** The player chose to leave at a checkpoint (D2). */
  retreated: boolean;
  tier: QuestOutcomeTier;
  /** Resolved quest duration in the input's duration units (ms for runtime). */
  duration: number;
  /** Reward multiplier for the sampled tier, incl. consumable/item deltas. */
  rewardMultiplier: number;
}

// ---------------------------------------------------------------------------
// Phase resolution (single step, shared by the run sampler and the session)
// ---------------------------------------------------------------------------

const rollD100 = (rng: () => number): number => 1 + Math.floor(rng() * 100);

/**
 * Classifies a d100 roll into the astrolabe verdict vocabulary, using the same
 * thresholds as `resolveMilestoneWithoutAnimation` and the same discrete
 * masses as `phaseVerdictCounts` (the DP): epicfail ≥ threshold, then bigwin /
 * win / almost / fail bands inside the success bound.
 */
export function rollPhaseVerdict(
  successBound: number,
  config: QuestSkillCheckConfig,
  rng: () => number,
): { verdict: ResolvedMissionPhase['verdict']; roll: number } {
  const t = config.backgroundResolution;
  const roll = rollD100(rng);
  let verdict: ResolvedMissionPhase['verdict'];
  if (roll >= t.epicFailThreshold) {
    verdict = 'epicfail';
  } else if (roll <= successBound * t.criticalWinFraction) {
    verdict = 'bigwin';
  } else if (roll <= successBound) {
    verdict = 'win';
  } else if (roll <= successBound + t.nearMissBand) {
    verdict = 'almost';
  } else {
    verdict = 'fail';
  }
  return { verdict, roll };
}

/**
 * Rolls the per-member risk of one phase. Rates are computed on the
 * phase-start alive mask — matching the DP, where cover applies while the
 * carrier was alive when the phase began — then deaths are applied at once.
 */
export function rollPhaseMemberRisks(
  input: MissionPlannerInput,
  phaseIndex: number,
  aliveMask: number,
  rng: () => number = Math.random,
): { rolls: MemberRiskRoll[]; aliveMaskAfter: number } {
  const phase = input.phases[phaseIndex];
  const rolls: MemberRiskRoll[] = [];
  let aliveMaskAfter = aliveMask;

  input.members.forEach((member, i) => {
    if (!(aliveMask & (1 << i))) return;
    const risk = memberPhaseRisk(
      input.members,
      i,
      phase,
      aliveMask,
      input.consumables,
      input.emptySlotPenalty,
    );
    const riskRoll = rollD100(rng);
    // +1e-9 guards the fraction→pp round-trip (0.06 * 100 is not exactly 6).
    const dead = riskRoll <= risk.death * 100 + 1e-9;
    const wounded = !dead && riskRoll <= (risk.death + risk.injury) * 100 + 1e-9;
    rolls.push({ residentId: member.residentId, riskRoll, dead, wounded });
    if (dead) aliveMaskAfter &= ~(1 << i);
  });

  return { rolls, aliveMaskAfter };
}

/**
 * Resolves one phase: the weakest-tag party check plus every living member's
 * risk roll. This is the sampling dual of one DP transition step.
 */
export function resolveMissionPhase(
  input: MissionPlannerInput,
  phaseIndex: number,
  aliveMask: number,
  config: QuestSkillCheckConfig = DEFAULT_QUEST_SKILL_CHECK_CONFIG,
  rng: () => number = Math.random,
): ResolvedMissionPhase {
  const phase = input.phases[phaseIndex];
  const { stat, tag } = phaseWeakestStat(
    input.members,
    aliveMask,
    phase,
    input.partyStatMult ?? 1,
    config,
  );
  const bound = phaseSuccessBound(stat, phase.difficulty, config);
  const { verdict, roll } = rollPhaseVerdict(bound, config, rng);
  const { rolls, aliveMaskAfter } = rollPhaseMemberRisks(input, phaseIndex, aliveMask, rng);
  return {
    phaseIndex,
    phaseId: phase.phaseId,
    verdict,
    passed: verdict === 'win' || verdict === 'bigwin',
    roll,
    skillTag: tag,
    memberRolls: rolls,
    aliveMaskAfter,
  };
}

// ---------------------------------------------------------------------------
// Full-run sampler
// ---------------------------------------------------------------------------

/**
 * Samples a full expedition from the planner model.
 * @param input - The canonical `MissionPlannerInput` (same object the DP reads)
 * @param config - Skill-check config
 * @param rng - Random source in [0, 1), injectable for seeded tests
 * @param opts - `shouldContinue` is consulted after every phase except the
 *   last; returning false ends the run as a retreat (D2). Absent → always on.
 * @returns The sampled run — phases, per-member outcomes, tier, duration
 */
export function resolveMissionRun(
  input: MissionPlannerInput,
  config: QuestSkillCheckConfig = DEFAULT_QUEST_SKILL_CHECK_CONFIG,
  rng: () => number = Math.random,
  opts?: { shouldContinue?: (checkpoint: MissionRunCheckpoint) => boolean },
): MissionRunResult {
  const memberOutcomes = initialMemberStates(input);
  let aliveMask = (1 << input.members.length) - 1;
  const phases: ResolvedMissionPhase[] = [];
  let retreated = false;

  for (let k = 0; k < input.phases.length; k += 1) {
    if (aliveMask === 0) break;
    const res = resolveMissionPhase(input, k, aliveMask, config, rng);
    phases.push(res);
    res.memberRolls.forEach((r) => {
      if (r.dead) memberOutcomes[r.residentId] = 'dead';
      else if (r.wounded && memberOutcomes[r.residentId] === 'alive') {
        memberOutcomes[r.residentId] = 'injured';
      }
    });
    aliveMask = res.aliveMaskAfter;
    if (aliveMask === 0) break;
    if (k < input.phases.length - 1 && opts?.shouldContinue) {
      const keepGoing = opts.shouldContinue({
        phaseIndex: k,
        aliveMask,
        passedPhases: phases.filter((p) => p.passed).length,
        playedPhases: phases.length,
      });
      if (!keepGoing) {
        retreated = true;
        break;
      }
    }
  }

  const playedPhases = phases.length;
  const passedPhases = phases.filter((p) => p.passed).length;
  const anyDeath = Object.values(memberOutcomes).includes('dead');
  const wiped = input.members.length > 0 && aliveMask === 0;
  // Wipe forces `deadly` regardless of verdicts already collected (spec §4.3).
  const tier = wiped ? 'deadly' : classifyTier(passedPhases, playedPhases, anyDeath);

  return {
    phases,
    memberOutcomes,
    playedPhases,
    passedPhases,
    anyDeath,
    wiped,
    retreated,
    tier,
    duration: missionRunDuration(input),
    rewardMultiplier: missionRunRewardMultiplier(input, tier),
  };
}

// ---------------------------------------------------------------------------
// Quest-level aggregates (same formulas as the DP terminal block, spec §5)
// ---------------------------------------------------------------------------

const sumDelta = (
  items: readonly (MissionConsumableSpec | MissionItemEffect)[],
  key: 'injuryChanceDelta' | 'deathChanceDelta' | 'rewardMultiplierDelta' | 'durationDelta',
): number => items.reduce((acc, it) => acc + (it[key] ?? 0), 0);

/** Resolved run duration: phase units + deltas, multiplied, floored at min. */
export function missionRunDuration(input: MissionPlannerInput): number {
  const rawDuration =
    input.phases.reduce((acc, p) => acc + p.durationUnits, 0) +
    sumDelta(input.consumables ?? [], 'durationDelta') +
    sumDelta(input.itemEffects ?? [], 'durationDelta');
  const durationMult =
    (input.consumables ?? []).reduce((acc, it) => acc * (it.durationMult ?? 1), 1) *
    (input.itemEffects ?? []).reduce((acc, it) => acc * (it.durationMult ?? 1), 1);
  return Math.max(input.durationMin ?? 1, Math.round(rawDuration * durationMult));
}

/** Reward multiplier for a sampled tier: config base + consumable/item deltas. */
export function missionRunRewardMultiplier(
  input: MissionPlannerInput,
  tier: QuestOutcomeTier,
): number {
  const base = input.rewardMultipliers?.[tier] ?? 1;
  const delta =
    sumDelta(input.consumables ?? [], 'rewardMultiplierDelta') +
    sumDelta(input.itemEffects ?? [], 'rewardMultiplierDelta');
  return Math.max(0, base + delta);
}

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

/** Fresh member-state map for a run start: everyone alive. */
export function initialMemberStates(
  input: MissionPlannerInput,
): Record<string, MemberLifeState> {
  return Object.fromEntries(input.members.map((m) => [m.residentId, 'alive' as const]));
}

/** Bitmask of the members whose state is not `dead` (injured members stay in). */
export function aliveMaskFromStates(
  input: MissionPlannerInput,
  states: Readonly<Record<string, MemberLifeState>>,
): number {
  return input.members.reduce(
    (mask, m, i) => (states[m.residentId] === 'dead' ? mask : mask | (1 << i)),
    0,
  );
}

/**
 * Translates per-member outcomes into the consequences list consumed by
 * `QuestPowerResult` — the MP-06 replacement for the deprecated
 * `resolvePartyConsequences` (QuestPowerEngine): consequences now come from
 * the risk rolls the phases actually produced, not from a second model.
 */
export function memberConsequencesFromStates(
  states: Readonly<Record<string, MemberLifeState>>,
): Array<{ residentId: string; consequence: 'none' | 'injured' | 'dead' }> {
  return Object.entries(states).map(([residentId, state]) => ({
    residentId,
    consequence: state === 'dead' ? 'dead' : state === 'injured' ? 'injured' : 'none',
  }));
}

export interface SessionMissionInputArgs {
  /** Quest slots in canonical order (index = member slotIndex). */
  slotBlueprints: readonly PlannerSlotSpec[];
  /** slotId → residentId. */
  assignments: Record<string, string>;
  /** residentId → slot→itemId loadout (empty for a legacy launch). */
  loadouts: Record<string, LoadoutAssignment>;
  /** Consumables committed at launch (D3: applied on every check). */
  consumables: readonly MissionDraftConsumable[];
  residentsById: Readonly<Record<string, ResidentState | undefined>>;
  blueprint: QuestBlueprint;
  rewardMultipliers?: MissionPlannerInput['rewardMultipliers'];
  config?: QuestSkillCheckConfig;
}

/**
 * Builds the canonical `MissionPlannerInput` for a live quest run — the same
 * object the Planner previewed at launch, so the resolver samples from the
 * distribution the player was shown (MP-06 "same model" contract). Routes
 * through `toMissionDraft` + `buildMissionInput`: loadouts go through MP-03,
 * consumables are validated against the canonical catalog, empty slots pay
 * their authored penalty.
 */
export function buildSessionMissionInput(args: SessionMissionInputArgs): MissionPlannerInput {
  const config = args.config ?? DEFAULT_QUEST_SKILL_CHECK_CONFIG;
  const live: PlannerLiveState = {
    residentsById: args.residentsById,
    slots: args.slotBlueprints,
    itemCatalog: defaultQuestItems,
  };
  const draft: MissionPlannerDraft = {
    assignments: args.assignments,
    loadouts: args.loadouts,
    consumables: Object.fromEntries(args.consumables.map((c) => [c.itemId, c.qty ?? 1])),
  };
  const missionDraft = toMissionDraft(draft, live, buildMissionPhaseSpecs(args.blueprint, config));
  missionDraft.rewardMultipliers = args.rewardMultipliers;
  return buildMissionInput(missionDraft, config);
}
