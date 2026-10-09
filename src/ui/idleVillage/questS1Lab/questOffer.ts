/**
 * questOffer — the offer resolution point (PLAN-019-S2.3).
 *
 * `resolveQuestOffer` is the single «constructor» of every value a POI
 * shows and a run executes: world signals → scales → ScenarioInstance
 * (a scaled copy of the authored nodes on an explicit whitelist) → the
 * `ResolvedOfferRecord` frozen into the run at launch. Estimate and run
 * consume the SAME instance, so the planning numbers the player sees and
 * the run they get cannot diverge.
 *
 * Scale whitelist (r2 contract — everything else is provably untouched):
 * - `check` nodes: `risk.wound` / `risk.death` × dangerScale, clamp [0,100]
 * - `combat` spec: `enemies` × dangerScale (round, ≥1), `hitDamage`
 *   × dangerScale (round, ≥0)
 * - `stats` (LabStat lists) is whitelisted but CATEGORICAL — no numeric
 *   scaling exists for a stat list in v0; declared no-op.
 * - EXCLUDED always: `costGold`/`grantsGold`/`costDays` (the run economy
 *   does not move), `harm`/`upfrontDamage`, `end`/`info` nodes.
 * `rewardScale` applies to `rewardBase` → `rewardResolved` (integer).
 */
import type { LabMember, QuestNode } from './questScenario';
import {
  createRun,
  registerScenarioInstance,
  scenarioInstanceById,
  type QuestId,
  type ResolvedOfferRecord,
  type ScenarioInstance,
} from './questRun';
import { defaultStrategy, hashSimInput, simulateQuest, type QuestSimResult, type SimStrategy } from './questSimulation';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { ROVINE_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/rovine';
import { computeScenarioVersion, type QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import { dangerBandFor, questPoiById, type QuestPoi } from '@/balancing/config/idleVillage/quests/questPois';
import { computeWorldScales, type WorldProgressSignals, type WorldScales } from '@/balancing/config/idleVillage/quests/worldScaling';
import { resolveReward, rewardTierFor } from '@/balancing/config/idleVillage/quests/rewardTiers';
import { useMinimalGameplayStore } from '@/store/useMinimalGameplay';

/** Schema stamp of the resolved-offer record — persisted inside the run. */
export const OFFER_SCHEMA_VERSION = 1;

/** Parsed scenarios indexed by quest id — the base content the offer
 *  resolution transforms. */
const SCENARIOS: Partial<Record<QuestId, QuestScenario>> = {
  goblin: GOBLIN_SCENARIO,
  rovine: ROVINE_SCENARIO,
};

/** Parsed scenario for a quest id — `undefined` for quests without a
 *  canonical scenario (cassa stays lab-only in this slice). */
export function scenarioForQuest(questId: QuestId): QuestScenario | undefined {
  return SCENARIOS[questId];
}

/**
 * The real world signals (D-I v0): `daysPlayed` is the TimeEngine day index
 * of the canonical store — real, never derived from POI-local clocks.
 */
export function collectWorldProgressSignals(): WorldProgressSignals {
  const day = useMinimalGameplayStore.getState()?.state?.currentDay;
  return { daysPlayed: Number.isFinite(day) ? Math.max(0, Math.floor(day)) : 0 };
}

/* ------------------------------------------------------------------ */
/* Whitelisted node transform (pure).                                  */
/* ------------------------------------------------------------------ */

const clampPct = (v: number) => Math.min(100, Math.max(0, v));

/**
 * Copy `nodes` applying `dangerScale` to the whitelisted fields only.
 * Pure: the input map is never mutated — an identity scale (1.0) yields a
 * deep-equal copy, not the same object.
 */
export function transformScenarioNodes(
  nodes: Record<string, QuestNode>,
  dangerScale: number,
): Record<string, QuestNode> {
  const out = structuredClone(nodes) as Record<string, QuestNode>;
  for (const node of Object.values(out)) {
    if (node.kind === 'check' && node.risk) {
      node.risk = {
        wound: clampPct(node.risk.wound * dangerScale),
        death: clampPct(node.risk.death * dangerScale),
      };
    }
    if (node.kind === 'combat' && node.combat) {
      node.combat = {
        ...node.combat,
        enemies: Math.max(1, Math.round(node.combat.enemies * dangerScale)),
        hitDamage: Math.max(0, Math.round(node.combat.hitDamage * dangerScale)),
      };
    }
  }
  return out;
}

/**
 * Build + register the ScenarioInstance for a scenario under `scales`.
 * `instanceId` is content-addressed (`qsi-<fnv1a>` of base hash + scales) —
 * the same resolution always yields the same instance, and two different
 * scale sets can coexist in the registry.
 */
export function createScenarioInstance(scenario: QuestScenario, scales: WorldScales): ScenarioInstance {
  const nodes = transformScenarioNodes(scenario.nodes, scales.dangerScale);
  const scenarioHash = computeScenarioVersion(scenario);
  const instanceId = `qsi-${hashSimInput({ scenarioHash, scales }).toString(16)}`;
  return registerScenarioInstance({
    instanceId,
    questId: scenario.id as QuestId,
    scenarioHash,
    nodes,
  });
}

/* ------------------------------------------------------------------ */
/* resolveQuestOffer — the constructor.                                 */
/* ------------------------------------------------------------------ */

export interface ResolvedQuestOffer {
  /** The frozen record — what `createRun({resolvedOffer})` stores and what
   *  the settlement reads in S2.5. */
  resolvedOffer: ResolvedOfferRecord;
  /** The node map the estimate and the run consume — same object. */
  instance: ScenarioInstance;
}

/**
 * Resolve a POI offer ONCE (detail open — r2): signals snapshot with
 * `daysPlayed` fixed, scales from worldScaling, instance transformed,
 * reward resolved to the integer the settlement will pay.
 * `signals` is injectable for tests/determinism; omit = collect real.
 * `bandSim` tunes the reference-band derivation (`runs`/`seed`/`strategy`);
 * the band it returns is an HYPOTHESIS ON THE REFERENCE PARTY — never a
 * prediction for the player's current assignment.
 */
export function resolveQuestOffer(
  poi: QuestPoi,
  opts?: {
    signals?: WorldProgressSignals;
    bandSim?: { runs?: number; seed?: number; strategy?: SimStrategy };
  },
): ResolvedQuestOffer {
  const scenario = scenarioForQuest(poi.questId);
  if (!scenario) throw new Error(`resolveQuestOffer: nessuno scenario canonico per questId '${poi.questId}'`);
  const signals = opts?.signals ?? collectWorldProgressSignals();
  const scales = computeWorldScales(signals);
  const instance = createScenarioInstance(scenario, scales);
  const rewardResolved = resolveReward(scenario.offer.rewardBase ?? 0, scales.rewardScale);
  const danger = deriveOfferBand(instance, scenario, opts?.bandSim);
  const resolvedOffer: ResolvedOfferRecord = {
    offerSchemaVersion: OFFER_SCHEMA_VERSION,
    poiId: poi.id,
    instanceId: instance.instanceId,
    scenarioHash: instance.scenarioHash,
    scales,
    bandIds: { danger, rewardTier: rewardTierFor(rewardResolved).id },
    signals: { daysPlayed: signals.daysPlayed ?? 0 },
    rewardResolved,
    resolvedAtDay: signals.daysPlayed ?? 0,
  };
  return { resolvedOffer, instance };
}

/* ------------------------------------------------------------------ */
/* Bands — derived, never authored.                                     */
/* ------------------------------------------------------------------ */

const BAND_RUNS = 2000;
const BAND_SEED = 777;

/**
 * The offer's danger band: `anyDeathPct` of the scenario's `referenceParty`
 * simulated on THIS instance → `dangerBandFor`. Returned as a band ID —
 * the caller MUST present it as an hypothesis on the declared reference
 * party, never as the player's expected outcome (that is `estimateForParty`).
 */
export function deriveOfferBand(
  instance: ScenarioInstance,
  scenario: QuestScenario,
  opts?: { runs?: number; seed?: number; strategy?: SimStrategy },
): string {
  const ref = scenario.offer.referenceParty;
  if (!ref?.length) return dangerBandFor(0).id;
  const run = createRun({
    party: { members: ref.map((m) => ({ ...m })) as LabMember[] },
    seed: opts?.seed ?? BAND_SEED,
    questId: instance.questId,
    scenarioInstance: instance,
  });
  const strategy = { ...defaultStrategy(run), ...opts?.strategy };
  const sim = simulateQuest(run, strategy, { runs: opts?.runs ?? BAND_RUNS, seed: opts?.seed ?? BAND_SEED });
  return dangerBandFor(sim.anyDeathPct).id;
}

/* ------------------------------------------------------------------ */
/* estimateForParty — the live planning number (S2.4 calls it).         */
/* ------------------------------------------------------------------ */

export type PartyEstimate =
  | 'incomplete'
  | {
      /** Same sim the run would play — same instance, same engine. */
      sim: QuestSimResult;
      /** `danger` = band derived from the PARTY's own anyDeathPct — the
       *  planning number, distinct from `bandIds.danger` (reference). */
      bands: { danger: string };
      nSim: number;
    };

/**
 * Monte Carlo estimate of THIS party on THIS resolved offer.
 * 'incomplete' when the assignment cannot launch: fewer members than the
 * POI's required slots, or no `leader` in the party (the engine's reward
 * path needs one), or the instance is no longer registered.
 */
export function estimateForParty(
  resolvedOffer: ResolvedOfferRecord,
  members: LabMember[],
  opts?: { runs?: number; seed?: number; strategy?: SimStrategy },
): PartyEstimate {
  const poi = questPoiById(resolvedOffer.poiId);
  const instance = scenarioInstanceById(resolvedOffer.instanceId);
  if (!poi || !instance) return 'incomplete';
  const required = poi.slots.required.length;
  if (members.length < required || !members.some((m) => m.role === 'leader')) return 'incomplete';
  const run = createRun({
    party: { members },
    seed: opts?.seed ?? hashSimInput({ instanceId: instance.instanceId, party: members.map((m) => m.id) }),
    questId: instance.questId,
    scenarioInstance: instance,
    resolvedOffer,
  });
  const strategy = { ...defaultStrategy(run), ...opts?.strategy };
  const runs = opts?.runs ?? 1000;
  const sim = simulateQuest(run, strategy, { runs, seed: opts?.seed });
  return { sim, bands: { danger: dangerBandFor(sim.anyDeathPct).id }, nSim: runs };
}

/** The node map an estimate/run resolved through `resolvedOffer` uses —
 *  `nodesFor` on a state carries it; this helper serves UI code that only
 *  holds the record. */
export function nodesForResolvedOffer(resolvedOffer: ResolvedOfferRecord): Record<string, QuestNode> | undefined {
  return scenarioInstanceById(resolvedOffer.instanceId)?.nodes;
}
