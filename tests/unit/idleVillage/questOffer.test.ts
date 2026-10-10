/**
 * questOffer — PLAN-019-S2.3 contracts.
 *
 * (a) `questPois` — schema, window ordering, duration contract
 *     (`estimatedDurationTicks = ticksPerNode × expectedPathNodes`), slot-id
 *     partition ⊆ authored `offer.slots`, `expectedPathNodes` within ±40% of
 *     the simulated median visited-path (declared tolerance — paths vary by
 *     strategy).
 * (b) `worldScaling` — monotonicity, hard clamp to `range`, missing signals
 *     → identity 1.0, determinism, out-of-domain clamp FALSIFIABLE
 *     (beyond-domain ≡ domain max, not "or it is reported").
 * (c) `rewardTiers` — half-open intervals, boundary belongs to the higher
 *     tier; `resolveReward` rounding declared (Math.round).
 * (d) `transformScenarioNodes` — whitelist: check `risk` and combat
 *     `enemies`/`hitDamage` only; `costGold`/`grantsGold`/`costDays`/
 *     `harm`/`upfrontDamage`/`end`/`info` byte-identical; identity scale
 *     deep-equal; base scenario never mutated.
 * (e) Extremes — the instance re-validated by `QuestScenarioSchema` at
 *     `dangerScale` min (1.0) and max (config range top): S2.1 semantic
 *     validation covers scaled content, not only the base scenario.
 * (f) `resolveQuestOffer` → `createRun`/`simulateQuest` consume the SAME
 *     instance (`nodesFor(run) === instance.nodes`); `resolvedOffer`
 *     byte-identical between the last estimate and the frozen run record
 *     (launch = freeze, no re-resolution).
 * (g) Persistence — the save carries the ScenarioInstance; a run whose
 *     `scenarioInstanceId` is unregistered falls back to the authored map
 *     (declared legacy migration).
 * (h) `estimateForParty` — 'incomplete' on unlaunchable assignments; the
 *     party's own band (planning number) stays distinct from
 *     `bandIds.danger` (reference-party hypothesis).
 */
import { describe, expect, it } from 'vitest';
import {
  availableOptions,
  createRun,
  matureReady,
  nodesFor,
  QUESTS,
  registerScenarioInstance,
  scenarioInstanceById,
  submitCommand,
  type QuestRunState,
} from '@/ui/idleVillage/questS1Lab/questRun';
import { defaultStrategy } from '@/ui/idleVillage/questS1Lab/questSimulation';
import {
  createScenarioInstance,
  deriveOfferBand,
  estimateForParty,
  resolveQuestOffer,
  transformScenarioNodes,
  OFFER_SCHEMA_VERSION,
} from '@/ui/idleVillage/questS1Lab/questOffer';
import {
  DANGER_BANDS,
  dangerBandFor,
  isPoiConsumed,
  poiConsumesOnReportClose,
  QUEST_POIS,
  questPoiById,
  QuestPoiSchema,
} from '@/balancing/config/idleVillage/quests/questPois';
import {
  computeWorldScales,
  WORLD_SCALING,
  WorldScalingSchema,
} from '@/balancing/config/idleVillage/quests/worldScaling';
import { resolveReward, rewardTierFor, REWARD_TIERS } from '@/balancing/config/idleVillage/quests/rewardTiers';
import { QuestScenarioSchema } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { ROVINE_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/rovine';
import type { LabMember } from '@/ui/idleVillage/questS1Lab/questScenario';

const SCENARIO_BY_QUEST = { goblin: GOBLIN_SCENARIO, rovine: ROVINE_SCENARIO } as const;

/** Median visited-path length under the default strategy — the empirical
 *  counterpart of `expectedPathNodes` (N=300, declared tolerance ±40%). */
function medianPathLength(questId: 'goblin' | 'rovine'): number {
  const preset = QUESTS[questId].presets[0].id;
  const lens: number[] = [];
  for (let i = 0; i < 300; i++) {
    const s = createRun(preset, i + 1, questId);
    const strat = defaultStrategy(s);
    let guard = 0;
    while (s.outcome === 'running' && guard++ < 500) {
      matureReady(s, 1e9);
      const opts = availableOptions(s);
      if (!opts.length) break;
      submitCommand(s, (strat as Record<string, string>)[s.nodeId] ?? opts[0].id, { tick: guard });
    }
    lens.push(s.visitedNodes.length);
  }
  lens.sort((a, b) => a - b);
  return lens[Math.floor(lens.length / 2)];
}

/* ------------------------------------------------------------------ */
/* (a) questPois                                                        */
/* ------------------------------------------------------------------ */

describe('questPois config', () => {
  it('parses and covers the two slice POIs', () => {
    expect(QUEST_POIS.map((p) => p.questId).sort()).toEqual(['goblin', 'rovine']);
    for (const poi of QUEST_POIS) {
      expect(() => QuestPoiSchema.parse(poi)).not.toThrow();
      expect(poi.availableUntilDay).toBeGreaterThan(poi.availableFromDay);
      expect(poi.estimatedDurationTicks).toBe(poi.ticksPerNode * poi.expectedPathNodes);
    }
  });

  it('slot ids partition ⊆ authored offer.slots (required/optional respected)', () => {
    for (const poi of QUEST_POIS) {
      const offer = SCENARIO_BY_QUEST[poi.questId as 'goblin' | 'rovine'].offer;
      const reqIds = new Set(offer.slots.required.map((s) => s.id));
      const optIds = new Set(offer.slots.optional.map((s) => s.id));
      for (const id of poi.slots.required) expect(reqIds.has(id), `${poi.id}: required '${id}' non in offer.slots.required`).toBe(true);
      for (const id of poi.slots.optional) expect(optIds.has(id), `${poi.id}: optional '${id}' non in offer.slots.optional`).toBe(true);
    }
  });

  it('expectedPathNodes within ±40% of the simulated median path', () => {
    for (const poi of QUEST_POIS) {
      const median = medianPathLength(poi.questId as 'goblin' | 'rovine');
      const ratio = Math.abs(poi.expectedPathNodes - median) / median;
      expect(ratio, `${poi.id}: expectedPathNodes=${poi.expectedPathNodes} vs median=${median}`).toBeLessThanOrEqual(0.4);
    }
  });

  /* PLAN-019-S4 T-3 (D-S4-6): POI lifecycle — one-shot by default, an
   *  authored `repeatable` offer is never consumed and ignores even a
   *  stale consumed record. */
  it('repeatable lifecycle: default one-shot, repeatable survives its report', () => {
    /* Both slice POIs are one-shot (no flag authored). */
    for (const poi of QUEST_POIS) {
      expect(poi.repeatable).toBeUndefined();
      expect(poiConsumesOnReportClose(poi)).toBe(true);
      expect(isPoiConsumed(poi, [poi.id])).toBe(true);
      expect(isPoiConsumed(poi, [])).toBe(false);
    }
    /* A repeatable offer parses and is never consumed. */
    const rep = QuestPoiSchema.parse({ ...QUEST_POIS[0], id: 'poi-rep', repeatable: true });
    expect(poiConsumesOnReportClose(rep)).toBe(false);
    /* Stale consumed records are ignored — honest migration for a POI
     *  consumed before `repeatable` was authored. */
    expect(isPoiConsumed(rep, ['poi-rep'])).toBe(false);
    expect(isPoiConsumed(rep, null)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* (b) worldScaling                                                     */
/* ------------------------------------------------------------------ */

describe('worldScaling', () => {
  it('schema parses the authored table', () => {
    expect(() => WorldScalingSchema.parse(WORLD_SCALING)).not.toThrow();
  });

  it('monotone non-decreasing in daysPlayed', () => {
    let prev = computeWorldScales({ daysPlayed: 0 });
    for (let d = 1; d <= 30; d++) {
      const s = computeWorldScales({ daysPlayed: d });
      expect(s.dangerScale).toBeGreaterThanOrEqual(prev.dangerScale);
      expect(s.rewardScale).toBeGreaterThanOrEqual(prev.rewardScale);
      prev = s;
    }
  });

  it('clamped to declared range at both ends; out-of-domain clamps (falsifiable)', () => {
    const lo = computeWorldScales({ daysPlayed: -5 });
    const hi = computeWorldScales({ daysPlayed: 999 });
    const atMax = computeWorldScales({ daysPlayed: WORLD_SCALING.signals.daysPlayed.domain[1] });
    expect(lo.dangerScale).toBe(WORLD_SCALING.outputs.dangerScale.range[0]);
    expect(hi.dangerScale).toBe(WORLD_SCALING.outputs.dangerScale.range[1]);
    expect(hi).toEqual(atMax); // beyond-domain ≡ clamped at domain max
  });

  it('missing signals → identity 1.0', () => {
    expect(computeWorldScales({})).toEqual({ dangerScale: 1, rewardScale: 1 });
    expect(computeWorldScales({ daysPlayed: undefined })).toEqual({ dangerScale: 1, rewardScale: 1 });
  });

  it('deterministic', () => {
    expect(computeWorldScales({ daysPlayed: 12 })).toEqual(computeWorldScales({ daysPlayed: 12 }));
  });
});

/* ------------------------------------------------------------------ */
/* (c) rewardTiers                                                      */
/* ------------------------------------------------------------------ */

describe('rewardTiers', () => {
  it('ordered, first tier at 0', () => {
    expect(REWARD_TIERS[0].minReward).toBe(0);
    for (let i = 1; i < REWARD_TIERS.length; i++) {
      expect(REWARD_TIERS[i].minReward).toBeGreaterThan(REWARD_TIERS[i - 1].minReward);
    }
  });

  it('half-open intervals: boundary belongs to the higher tier', () => {
    expect(rewardTierFor(REWARD_TIERS[1].minReward - 1).id).toBe(REWARD_TIERS[0].id);
    expect(rewardTierFor(REWARD_TIERS[1].minReward).id).toBe(REWARD_TIERS[1].id);
    expect(rewardTierFor(10_000).id).toBe(REWARD_TIERS[REWARD_TIERS.length - 1].id);
  });

  it('resolveReward = Math.round(base × scale), clamped ≥ 0', () => {
    expect(resolveReward(101, 0.5)).toBe(51); // exact .5 rounds up
    expect(resolveReward(60, 1.0)).toBe(60);
    expect(resolveReward(100, 1.25)).toBe(125);
    expect(resolveReward(10, -2)).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* (d) transform whitelist                                              */
/* ------------------------------------------------------------------ */

describe('transformScenarioNodes — whitelist', () => {
  const SCALE = 1.4;

  it('scales check risk and combat enemies/hitDamage only', () => {
    const out = transformScenarioNodes(GOBLIN_SCENARIO.nodes, SCALE);
    for (const [id, node] of Object.entries(GOBLIN_SCENARIO.nodes)) {
      const t = out[id];
      if (node.kind === 'check' && node.risk) {
        expect(t.risk!.wound).toBeCloseTo(Math.min(100, node.risk.wound * SCALE), 6);
        expect(t.risk!.death).toBeCloseTo(Math.min(100, node.risk.death * SCALE), 6);
      } else {
        expect(t.risk).toEqual(node.risk);
      }
      if (node.kind === 'combat' && node.combat) {
        expect(t.combat!.enemies).toBe(Math.max(1, Math.round(node.combat.enemies * SCALE)));
        expect(t.combat!.hitDamage).toBe(Math.max(0, Math.round(node.combat.hitDamage * SCALE)));
        // untouched combat fields
        expect(t.combat!.turns).toBe(node.combat.turns);
        expect(t.combat!.killPerWin).toBe(node.combat.killPerWin);
        expect(t.combat!.nextCleared).toBe(node.combat.nextCleared);
      } else {
        expect(t.combat).toEqual(node.combat);
      }
      // excluded everywhere: economy + harm + routing + text
      for (const [i, opt] of (node.options ?? []).entries()) {
        const to = t.options![i];
        expect(to.costGold).toBe(opt.costGold);
        expect(to.grantsGold).toBe(opt.grantsGold);
        expect(to.costDays).toBe(opt.costDays);
        expect(to.next).toBe(opt.next);
      }
      expect(t.upfrontDamage).toEqual(node.upfrontDamage);
      expect(t.stats).toEqual(node.stats); // categorical — declared no-op v0
      expect(t.next).toBe(node.next);
      expect(t.kind).toBe(node.kind);
    }
  });

  it('identity scale → deep-equal copy; base map never mutated', () => {
    const before = JSON.stringify(GOBLIN_SCENARIO.nodes);
    const out = transformScenarioNodes(GOBLIN_SCENARIO.nodes, 1.0);
    expect(out).not.toBe(GOBLIN_SCENARIO.nodes);
    expect(out).toEqual(GOBLIN_SCENARIO.nodes);
    expect(JSON.stringify(GOBLIN_SCENARIO.nodes)).toBe(before);
  });
});

/* ------------------------------------------------------------------ */
/* (e) instance re-validation at scale extremes                          */
/* ------------------------------------------------------------------ */

describe('scenario instances at scale extremes', () => {
  const extremes = [1.0, WORLD_SCALING.outputs.dangerScale.range[1]];
  for (const scenario of [GOBLIN_SCENARIO, ROVINE_SCENARIO]) {
    for (const dangerScale of extremes) {
      it(`${scenario.id} @ dangerScale=${dangerScale} still validates (S2.1 semantics)`, () => {
        const nodes = transformScenarioNodes(scenario.nodes, dangerScale);
        expect(() => QuestScenarioSchema.parse({ ...scenario, nodes })).not.toThrow();
      });
    }
  }
});

/* ------------------------------------------------------------------ */
/* (f) resolveQuestOffer + same-instance + freeze                        */
/* ------------------------------------------------------------------ */

const PARTY: LabMember[] = [
  { id: 'r1', name: 'A', role: 'leader', hp: 80, stats: { str: 60, con: 55, agi: 40, perc: 35, int: 30, cha: 30 } },
  { id: 'r2', name: 'B', role: 'member', hp: 60, stats: { str: 55, con: 50, agi: 45, perc: 40, int: 35, cha: 30 } },
];

describe('resolveQuestOffer', () => {
  const poi = questPoiById('poi-goblin')!;

  it('resolves scales, reward, bands, signals — instance registered', () => {
    const { resolvedOffer, instance } = resolveQuestOffer(poi, {
      signals: { daysPlayed: 30 },
      bandSim: { runs: 400 },
    });
    const scales = computeWorldScales({ daysPlayed: 30 });
    expect(resolvedOffer.scales).toEqual(scales);
    expect(resolvedOffer.offerSchemaVersion).toBe(OFFER_SCHEMA_VERSION);
    expect(resolvedOffer.rewardResolved).toBe(resolveReward(GOBLIN_SCENARIO.offer.rewardBase!, scales.rewardScale));
    expect(DANGER_BANDS.some((b) => b.id === resolvedOffer.bandIds.danger)).toBe(true);
    expect(resolvedOffer.signals.daysPlayed).toBe(30);
    expect(scenarioInstanceById(instance.instanceId)).toBe(instance);
    // scaled content actually differs at dangerScale > 1 — goblin's danger
    // channel is combat (check risk is authored 0/0 there; risk scaling is
    // proven on rovine by the whitelist test + the extremes suite).
    expect(scales.dangerScale).toBeGreaterThan(1);
    const combatSum = (nodes: typeof instance.nodes) =>
      Object.values(nodes).reduce((s, n) => s + (n.combat ? n.combat.enemies + n.combat.hitDamage : 0), 0);
    expect(combatSum(instance.nodes)).toBeGreaterThan(combatSum(GOBLIN_SCENARIO.nodes));
  });

  it('createRun + simulateQuest consume the SAME instance (nodesFor(run) === instance.nodes)', () => {
    const { resolvedOffer, instance } = resolveQuestOffer(poi, { signals: { daysPlayed: 10 }, bandSim: { runs: 200 } });
    const run = createRun({ party: { members: PARTY }, seed: 7, questId: 'goblin', scenarioInstance: instance, resolvedOffer });
    expect(nodesFor(run)).toBe(instance.nodes);
    expect(run.scenarioInstanceId).toBe(instance.instanceId);
  });

  it('frozen resolvedOffer byte-identical between estimate and launched run', () => {
    const { resolvedOffer, instance } = resolveQuestOffer(poi, { signals: { daysPlayed: 5 }, bandSim: { runs: 200 } });
    const before = JSON.stringify(resolvedOffer);
    void estimateForParty(resolvedOffer, PARTY, { runs: 100, seed: 1 });
    const run = createRun({ party: { members: PARTY }, seed: 3, questId: 'goblin', scenarioInstance: instance, resolvedOffer });
    expect(JSON.stringify(run.resolvedOffer)).toBe(before);
    expect(JSON.stringify(resolvedOffer)).toBe(before); // estimate does not mutate
  });

  it('identity signals (day 0) → scales 1.0 → instance nodes deep-equal authored', () => {
    const { instance } = resolveQuestOffer(poi, { signals: { daysPlayed: 0 }, bandSim: { runs: 100 } });
    expect(instance.nodes).toEqual(GOBLIN_SCENARIO.nodes);
  });
});

/* ------------------------------------------------------------------ */
/* (g) persistence — instance travels with the save                      */
/* ------------------------------------------------------------------ */

describe('instance persistence contract', () => {
  it('save payload carries the instance; re-registering restores nodesFor', () => {
    const poi = questPoiById('poi-goblin')!;
    const { resolvedOffer, instance } = resolveQuestOffer(poi, { signals: { daysPlayed: 20 }, bandSim: { runs: 200 } });
    const run = createRun({ party: { members: PARTY }, seed: 11, questId: 'goblin', scenarioInstance: instance, resolvedOffer });
    // the useQuestRun save payload shape: run + scenarioInstance
    const payload = JSON.parse(JSON.stringify({ run, scenarioInstance: instance }));
    const fresh = registerScenarioInstance(payload.scenarioInstance);
    expect(fresh.instanceId).toBe(instance.instanceId);
    expect(nodesFor(payload.run as QuestRunState)).toBe(fresh.nodes);
  });

  it('unregistered instanceId → authored-map fallback (declared migration)', () => {
    const run = createRun({ party: { members: PARTY }, seed: 1, questId: 'goblin' });
    run.scenarioInstanceId = 'qsi-does-not-exist';
    expect(nodesFor(run)).toBe(QUESTS.goblin.nodes);
  });
});

/* ------------------------------------------------------------------ */
/* (h) estimateForParty                                                  */
/* ------------------------------------------------------------------ */

describe('estimateForParty', () => {
  const poi = questPoiById('poi-goblin')!;
  const resolved = () => resolveQuestOffer(poi, { signals: { daysPlayed: 8 }, bandSim: { runs: 200 } }).resolvedOffer;

  it('incomplete when required slots are unfilled or no leader', () => {
    const offer = resolved();
    expect(estimateForParty(offer, [], { runs: 50 })).toBe('incomplete');
    expect(estimateForParty(offer, [PARTY[1]], { runs: 50 })).toBe('incomplete'); // no leader
  });

  it('incomplete when the instance is unknown', () => {
    const offer = { ...resolved(), instanceId: 'qsi-gone' };
    expect(estimateForParty(offer, PARTY, { runs: 50 })).toBe('incomplete');
  });

  it('full party → sim + party-own band, deterministic per seed', () => {
    const offer = resolved();
    const a = estimateForParty(offer, PARTY, { runs: 200, seed: 42 });
    const b = estimateForParty(offer, PARTY, { runs: 200, seed: 42 });
    if (a === 'incomplete' || b === 'incomplete') throw new Error('party completa non stimata');
    expect(a.nSim).toBe(200);
    expect(DANGER_BANDS.some((x) => x.id === a.bands.danger)).toBe(true);
    expect(a.sim.anyDeathPct).toBeCloseTo(b.sim.anyDeathPct, 6);
    expect(a.sim.outcomePct).toEqual(b.sim.outcomePct);
  });

  it('party band is the planning number — distinct field from the reference band', () => {
    const { resolvedOffer } = resolveQuestOffer(poi, { signals: { daysPlayed: 8 }, bandSim: { runs: 200 } });
    const est = estimateForParty(resolvedOffer, PARTY, { runs: 200, seed: 9 });
    if (est === 'incomplete') throw new Error('incomplete');
    // Both are valid band ids; the party band derives from ITS sim, not
    // from bandIds.danger (which simulates the referenceParty). The fields
    // are independently derived — equality is possible but not structural.
    expect(typeof est.bands.danger).toBe('string');
    expect(typeof resolvedOffer.bandIds.danger).toBe('string');
  });
});

/* ------------------------------------------------------------------ */
/* Danger band derivation (reference-party hypothesis)                   */
/* ------------------------------------------------------------------ */

describe('deriveOfferBand', () => {
  it('goblin reference party → alta (S2.1 calibration: anyDeathPct ≈ 65%)', () => {
    const { instance } = resolveQuestOffer(questPoiById('poi-goblin')!, {
      signals: { daysPlayed: 0 },
      bandSim: { runs: 200 },
    });
    const band = deriveOfferBand(instance, GOBLIN_SCENARIO, { runs: 800, strategy: { 'gob-incalzare': 'gob-insegui', 'gob-esplora-extra': 'gob-fermati' } });
    expect(band).toBe(dangerBandFor(65).id);
    expect(band).toBe('alta');
  });
});
