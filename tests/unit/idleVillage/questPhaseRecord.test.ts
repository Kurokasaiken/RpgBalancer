import { describe, it, expect } from 'vitest';
import { applyChoice, availableOptions, createRun, nodesFor } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { emptyPhase, hpLostByMember, phaseOutcome, recordAction, snapshotRun, type PhaseRecord } from '@/ui/idleVillage/questS1Lab/questPhaseRecord';

const BAG = new Set(['hasBonusForza', 'hasBonusPerc', 'hasHealing']);

/** Plays the goblin quest taking the first option each time, folding actions into phases like the window does. */
function playthrough(seed: number) {
  const run = createRun(GOBLIN_PRESETS[0].id, seed, 'goblin');
  const beatOf = () => nodesFor(run)[run.nodeId]?.beat ?? 0;
  const phases: PhaseRecord[] = [emptyPhase(beatOf())];
  for (let step = 0; step < 80 && !run.ended; step += 1) {
    const option = availableOptions(run).find((o) => !o.disabled);
    if (!option) break;
    const before = snapshotRun(run);
    applyChoice(run, option.id);
    phases[phases.length - 1] = recordAction(phases[phases.length - 1], before, run, option.label, BAG);
    if (!run.ended && beatOf() !== phases[phases.length - 1].beat) phases.push(emptyPhase(beatOf()));
  }
  return { run, phases };
}

describe('questPhaseRecord', () => {
  it('splits a full goblin run into ordered phases that start at the assignment', () => {
    const { run, phases } = playthrough(1234);
    expect(run.ended).toBe(true);
    expect(phases[0].beat).toBe(0);
    expect(phases[0].choices).toEqual(['Depart']);
    for (let i = 1; i < phases.length; i += 1) expect(phases[i].beat).toBeGreaterThanOrEqual(phases[i - 1].beat);
  });

  it('accounts every HP the engine took, across phases', () => {
    for (const seed of [1, 7, 99, 2024]) {
      const { run, phases } = playthrough(seed);
      const recorded = phases.flatMap(hpLostByMember).reduce((sum, row) => sum + row.amount, 0);
      const lost = run.party.reduce((sum, m) => sum + (m.maxHp - Math.max(0, m.hp)), 0);
      // Healing can give HP back, so the record is never below what is missing now.
      expect(recorded).toBeGreaterThanOrEqual(lost);
    }
  });

  // INV:R-234-phase-hp-once — a harm is folded into its phase once, however many
  // times the window records actions on a run whose harm window was not reset (clock maturing:
  // `act(matureReady)` re-reads the same `checkQueue`/`recentHarms`). Audit F3: «−600 HP» on a 93 HP hero.
  it('counts each engine harm once when the same harm window is recorded repeatedly (R-234)', () => {
    const { run } = playthrough(7);
    const harm = { seq: 41, memberId: 'hero', amount: 12, kind: 'harm' as const, hpBefore: 83, hpAfter: 71 };
    const state = { ...run, ended: false, checkQueue: [], recentHarms: [harm] } as typeof run;
    let phase = emptyPhase(3);
    for (let tick = 0; tick < 50; tick += 1) {
      phase = recordAction(phase, snapshotRun(state), state, undefined, BAG);
    }
    expect(phase.harms).toHaveLength(1);
    expect(hpLostByMember(phase)).toEqual([{ memberId: 'hero', amount: 12, died: false }]);
  });

  it('marks a phase with a death as the worst outcome', () => {
    const phase = { ...emptyPhase(4), harms: [{ seq: 1, memberId: 'a', amount: 30, kind: 'death' as const, hpBefore: 20, hpAfter: 0 }] };
    expect(phaseOutcome(phase)).toBe('death');
    expect(hpLostByMember(phase)).toEqual([{ memberId: 'a', amount: 20, died: true }]);
    expect(phaseOutcome(emptyPhase(1))).toBe('clean');
  });
});
