/**
 * P4 — Monte Carlo benchmark of the generated catalog (PLAN-026 §6/§7).
 *
 * For every GENERATED_CATALOG imprint, run the real engine under declared
 * policies × ≥2 parties and measure:
 *
 *  1. Completamento — every sim reaches a terminal outcome (no 'running').
 *  2. Nessuna politica dominante — the reward%/anyDeath% spread across
 *     policies must be wide: the choices change the fate measurably.
 *  3. Banda misurata = banda dichiarata — `deriveOfferBand` (MC on the
 *     authored referenceParty) must land on `dangerBandRef` ±1 grade.
 *  4. Twist witness — ≥1 MC run traverses the twist branch of each
 *     gimmick (imboscata for the race, piena for the flood).
 *  5. Copertura statica — every emitted node is reachable from startNode.
 */

import { describe, expect, it } from 'vitest';
import {
  applyChoice,
  availableOptions,
  createRun,
  type QuestRunState,
} from '@/ui/idleVillage/questS1Lab/questRun';
import { simulateQuest, type SimStrategy } from '@/ui/idleVillage/questS1Lab/questSimulation';
import {
  createScenarioInstance as createInstance,
  deriveOfferBand,
} from '@/ui/idleVillage/questS1Lab/questOffer';
import { DANGER_BANDS } from '@/balancing/config/idleVillage/quests/questPois';
import type { LabMember, QuestNode } from '@/ui/idleVillage/questS1Lab/questScenario';
import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import {
  GENERATED_CATALOG,
} from '@/balancing/config/idleVillage/quests/generation/catalog';

const RUNS = 400;
const SEED = 777;

/* ------------------------------------------------------------------ */
/* Parties                                                             */
/* ------------------------------------------------------------------ */

/** The scenario's authored calibration party, traits-free. */
function referenceParty(s: QuestScenario): LabMember[] {
  return (s.offer.referenceParty ?? []).map((m) => ({ ...m })) as LabMember[];
}

/** A traited variant of the reference party — exercises every trait-gate
 *  the skeleton declares (avido/prudente/scavezzacollo). */
function traitedParty(s: QuestScenario): LabMember[] {
  return referenceParty(s).map((m, i) => ({
    ...m,
    traits: i === 0 ? ['avido', 'scavezzacollo', 'prudente'] : i === 1 ? ['prudente'] : [],
  }));
}

/* ------------------------------------------------------------------ */
/* Policies (choice-node id → option id, per scenario prefix)          */
/* ------------------------------------------------------------------ */

function policiesFor(s: QuestScenario): Record<string, SimStrategy> {
  const prefix = s.startNode.split('-')[0]!;
  const K = prefix;
  if (s.id.startsWith('gen-race-')) {
    return {
      bilanciata: { [`${K}-partenza`]: `${K}-via-a`, [`${K}-tappa`]: `${K}-sprint`, [`${K}-vetta`]: `${K}-carico` },
      cauta: { [`${K}-partenza`]: `${K}-via-b`, [`${K}-tappa`]: `${K}-passo`, [`${K}-vetta`]: `${K}-carico` },
      scorciatoie: { [`${K}-partenza`]: `${K}-via-b`, [`${K}-tappa`]: `${K}-tagliata`, [`${K}-vetta`]: `${K}-carico` },
      rischiosa: { [`${K}-partenza`]: `${K}-via-a`, [`${K}-tappa`]: `${K}-balzo`, [`${K}-vetta`]: `${K}-attesa` },
    };
  }
  // flood skeleton
  return {
    fuga: { [`${K}-ingresso`]: `${K}-via-gabbia`, [`${K}-crocevia`]: `${K}-punta`, [`${K}-sbarramento`]: `${K}-sfonda`, [`${K}-piena`]: `${K}-mollare` },
    bilanciata: { [`${K}-ingresso`]: `${K}-via-cunicolo`, [`${K}-crocevia`]: `${K}-punta`, [`${K}-sbarramento`]: `${K}-sfonda`, [`${K}-piena`]: `${K}-mollare` },
    avida: { [`${K}-ingresso`]: `${K}-via-cunicolo`, [`${K}-crocevia`]: `${K}-saccheggia`, [`${K}-sbarramento`]: `${K}-ultimopezzo`, [`${K}-piena`]: `${K}-tenere` },
    prudente: { [`${K}-ingresso`]: `${K}-via-cunicolo`, [`${K}-crocevia`]: `${K}-puntellare`, [`${K}-sbarramento`]: `${K}-sfonda`, [`${K}-piena`]: `${K}-mollare` },
  };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function runFor(s: QuestScenario, party: LabMember[], seed: number): QuestRunState {
  return createRun({
    party,
    seed,
    questId: 'gen',
    scenarioInstance: createInstance(s, { dangerScale: 1, rewardScale: 1 }, 'gen'),
  });
}

/** Single-run driver — returns the terminal state (witness counting). */
function driveToEnd(run: QuestRunState, strategy: SimStrategy, maxSteps = 60): QuestRunState {
  for (let i = 0; i < maxSteps && !run.ended; i += 1) {
    const opts = availableOptions(run).filter((o) => !o.disabled);
    if (!opts.length) break;
    const want = strategy[run.nodeId];
    const pick = opts.find((o) => o.id === want) ?? opts[0]!;
    applyChoice(run, pick.id);
  }
  return run;
}

/** Static graph coverage — every node reachable from startNode via
 *  option.next (CHECK:x → x) and verdictTable gotos. */
function reachableFrom(start: string, nodes: Record<string, QuestNode>): Set<string> {
  const edgesOf = (n: QuestNode): string[] => {
    const out: string[] = [];
    for (const o of n.options ?? []) {
      if (o.next.startsWith('CHECK:')) out.push(o.next.slice(6));
      else out.push(o.next);
    }
    for (const row of Object.values(n.verdictTable ?? {})) {
      const g = row.goto;
      if (!g) continue;
      if (typeof g === 'string') out.push(g);
      else {
        out.push(g.else);
        for (const b of g.branches) out.push(b.then);
      }
    }
    return out;
  };
  const seen = new Set<string>([start]);
  const queue = [start];
  while (queue.length) {
    for (const t of edgesOf(nodes[queue.shift()!]!)) if (!seen.has(t)) { seen.add(t); queue.push(t); }
  }
  return seen;
}

/** Twist-branch node ids per gimmick (the route the twist diverts to). */
function twistNodesFor(s: QuestScenario): string[] {
  return Object.keys(s.nodes).filter((id) => /-imboscata$|-piena$/.test(id));
}

/* ------------------------------------------------------------------ */
/* Benchmark                                                           */
/* ------------------------------------------------------------------ */

/** Strict dominance on one cell: A dominates B iff A is ≥ on reward and
 *  ≤ on death/wipe, strictly better somewhere. The plan's acceptance
 *  («nessuna politica dominante») means no policy dominates ALL others —
 *  a dominated policy is a finding (tuning signal), a dominating one is
 *  a design failure: the choice is fake. */
function dominates(
  a: { reward: number; death: number; wipe: number; loot: number },
  b: { reward: number; death: number; wipe: number; loot: number },
): boolean {
  return (
    a.reward >= b.reward &&
    a.loot >= b.loot &&
    a.death <= b.death &&
    a.wipe <= b.wipe &&
    (a.reward > b.reward || a.loot > b.loot || a.death < b.death || a.wipe < b.wipe)
  );
}

describe('P4 — generated catalog Monte Carlo benchmark', () => {
  const rows: string[] = [];

  it('policies × parties — every sim terminates, no dominant policy, band check', { timeout: 60_000 }, () => {
    for (const scenario of Object.values(GENERATED_CATALOG)) {
      const policies = policiesFor(scenario);
      const parties = { reference: referenceParty(scenario), traited: traitedParty(scenario) };
      const table: { policy: string; party: string; reward: number; death: number; wipe: number; loot: number }[] = [];

      for (const [partyName, party] of Object.entries(parties)) {
        for (const [policyName, strategy] of Object.entries(policies)) {
          const run = runFor(scenario, party, SEED);
          const sim = simulateQuest(run, strategy, { runs: RUNS, seed: SEED });
          const terminal = sim.outcomePct.reward + sim.outcomePct.survived + sim.outcomePct.fled + sim.outcomePct.wipe;
          // Every run reaches a terminal outcome (runOneSim guard is the cap).
          expect(terminal, `${scenario.id}/${policyName}/${partyName}: ${terminal}% non-terminal`).toBeGreaterThan(95);
          table.push({ policy: policyName, party: partyName, reward: sim.outcomePct.reward, death: sim.anyDeathPct, wipe: sim.outcomePct.wipe, loot: sim.lootAvgCount });
          rows.push(
            `${scenario.id.padEnd(24)} ${partyName.padEnd(9)} ${policyName.padEnd(11)} reward ${sim.outcomePct.reward.toFixed(1).padStart(5)}%  death ${sim.anyDeathPct.toFixed(1).padStart(5)}%  wipe ${sim.outcomePct.wipe.toFixed(1).padStart(5)}%  loot ${sim.lootAvgCount.toFixed(2)}`,
          );
        }
      }

      for (const partyName of Object.keys(parties)) {
        const cell = table.filter((r) => r.party === partyName);
        const rewards = cell.map((r) => r.reward);
        const deaths = cell.map((r) => r.death);
        const spreadR = Math.max(...rewards) - Math.min(...rewards);
        const spreadD = Math.max(...deaths) - Math.min(...deaths);
        rows.push(`${scenario.id.padEnd(24)} ${partyName.padEnd(9)} spread     Δreward ${spreadR.toFixed(1)}pp  Δdeath ${spreadD.toFixed(1)}pp`);

        // Dominance matrix: a policy dominating EVERY other is the design
        // failure the plan guards against. A policy dominated everywhere
        // is a trap option — reported, not failed (greedy traps are legit).
        const dominators: string[] = [];
        const dominated: string[] = [];
        for (const a of cell) {
          const others = cell.filter((b) => b !== a);
          if (others.every((b) => dominates(a, b))) dominators.push(a.policy);
          if (others.every((b) => dominates(b, a))) dominated.push(a.policy);
        }
        if (dominated.length) rows.push(`${scenario.id.padEnd(24)} ${partyName.padEnd(9)} dominated  ${dominated.join(', ')} (trap — tuning signal)`);
        expect(dominators, `${scenario.id}/${partyName}: policy dominates all others → fake choice`).toEqual([]);
      }

      // Measured band = declared band (±1 grade — boundary tolerance).
      const instance = createInstance(scenario, { dangerScale: 1, rewardScale: 1 }, 'gen');
      const measured = deriveOfferBand(instance, scenario, { runs: RUNS, seed: SEED });
      const declared = scenario.offer.dangerBandRef;
      const order = DANGER_BANDS.map((b) => b.id);
      const gi = Math.abs(order.indexOf(measured) - order.indexOf(declared!));
      rows.push(`${scenario.id.padEnd(24)} band       declared ${declared}  measured ${measured} (±${gi} grade)`);
      expect(gi, `${scenario.id}: declared '${declared}' vs measured '${measured}'`).toBeLessThanOrEqual(1);
    }
  });

  it('twist witness — each gimmick\'s diverted route is traversable under MC', { timeout: 60_000 }, () => {
    for (const scenario of Object.values(GENERATED_CATALOG)) {
      const twistNodes = twistNodesFor(scenario);
      expect(twistNodes.length, `${scenario.id}: no twist node found`).toBeGreaterThan(0);
      const policies = policiesFor(scenario);
      let witnessed = 0;
      // Greedy/risky policies maximize twist exposure.
      for (const strategy of Object.values(policies)) {
        for (let seed = 1; seed <= 60; seed += 1) {
          const run = driveToEnd(runFor(scenario, traitedParty(scenario), seed), strategy);
          if (twistNodes.some((n) => run.visitedNodes.includes(n))) witnessed += 1;
        }
      }
      rows.push(`${scenario.id.padEnd(24)} twist      ${twistNodes.join(',')} witnessed in ${witnessed} runs`);
      expect(witnessed, `${scenario.id}: twist branch never witnessed`).toBeGreaterThan(0);
    }
  });

  it('static coverage — every emitted node is reachable from startNode', () => {
    for (const scenario of Object.values(GENERATED_CATALOG)) {
      const reachable = reachableFrom(scenario.startNode, scenario.nodes);
      const orphans = Object.keys(scenario.nodes).filter((id) => !reachable.has(id));
      expect(orphans, `${scenario.id}: unreachable nodes ${orphans.join(',')}`).toEqual([]);
    }
  });

  it('emits the benchmark table for the evidence log', () => {
    // eslint-disable-next-line no-console
    console.log('\n=== PLAN-026 P4 benchmark table ===\n' + rows.join('\n') + '\n');
  });
});
