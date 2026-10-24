/**
 * mcGate — the SP-4 Monte Carlo async diagnostic runner.
 *
 * PARITY INVARIANT: seed/runs are pinned to the same constants the
 * offer-band derivation uses (BAND_SEED=777, BAND_RUNS=2000) so the
 * lab's MC diagnostic is bit-comparable to `deriveOfferBand` — never a
 * second, divergent number. Applicability: requires
 * `offer.referenceParty` (the calibration party) — scenarios without
 * one report NOT_APPLICABLE.
 *
 * Status semantics: WARNING-class diagnostic — a wildly-off band is
 * flagged, never a content FAIL (diagnostics never block run entry).
 */

import type { QuestScenario } from '../questScenario.schema';
import { QuestScenarioSchema } from '../questScenario.schema';
import { createScenarioInstance } from '@/ui/idleVillage/questS1Lab/questOffer';
import { createRun } from '@/ui/idleVillage/questS1Lab/questRun';
import type { LabMember } from '@/ui/idleVillage/questS1Lab/questScenario';
import {
  defaultStrategy,
  simulateQuestAsync,
} from '@/ui/idleVillage/questS1Lab/questSimulation';
import type { AsyncGateRunner } from './gateRegistry';
import type { GateResult } from './types';

/** Parity constants — identical to questOffer.ts deriveOfferBand. */
const MC_RUNS = 2000;
const MC_SEED = 777;

export const mcDiagnosticRunner: AsyncGateRunner = {
  id: 'mcDiagnostic',
  async: true,
  async run(input, ctx): Promise<Omit<GateResult, 'id' | 'kind'>> {
    const parsed = QuestScenarioSchema.safeParse(input.scenario);
    if (!parsed.success) {
      return { status: 'NOT_RUN', execution: 'ok', notRunReason: 'skipped', summaryKey: 'mc.skipped' };
    }
    const scenario: QuestScenario = parsed.data;
    const ref = scenario.offer.referenceParty;
    if (!ref?.length) {
      return {
        status: 'NOT_RUN',
        execution: 'ok',
        notRunReason: 'notApplicable',
        summaryKey: 'mc.noRefParty',
      };
    }
    const instance = createScenarioInstance(scenario, { dangerScale: 1, rewardScale: 1 }, 'gen');
    const run = createRun({
      party: { members: ref.map((m) => ({ ...m })) as LabMember[] },
      seed: MC_SEED,
      questId: instance.questId,
      scenarioInstance: instance,
    });
    const sim = await simulateQuestAsync(run, defaultStrategy(run), {
      runs: MC_RUNS,
      seed: MC_SEED,
      signal: ctx.signal,
    });
    const metrics = {
      runs: sim.nRuns,
      successPct: Math.round(sim.successPct * 100) / 100,
      anyDeathPct: Math.round(sim.anyDeathPct * 100) / 100,
    };
    // diagnostic verdict: flagged when the band is extreme (uncalibrated
    // advisory — honest WARNING, never FAIL)
    const extreme = sim.anyDeathPct >= 80 || sim.successPct <= 5;
    return {
      status: extreme ? 'WARNING' : 'PASS',
      execution: 'ok',
      summaryKey: extreme ? 'mc.extreme' : 'mc.ok',
      metrics,
    };
  },
};
