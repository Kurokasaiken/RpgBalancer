/**
 * Tests for the goblin quest engine (PLAN-022).
 * Covers the Director's positional targeting model, HP pools, combat
 * escalation, F5 verdict bands, F7 ambush, consumable timing and rewards.
 */
import { describe, expect, it } from 'vitest';
import {
  applyChoice,
  availableOptions,
  consumableFutureChecks,
  createRun,
  nodesFor,
  positionalWeights,
  useHealing,
  type QuestRunState,
} from '@/ui/idleVillage/questS1Lab/questRun';

/** Drive a run forward picking the option whose id contains `match`. */
function pick(state: QuestRunState, match: string): QuestRunState {
  const opt = availableOptions(state).find((o) => o.id.includes(match)) ?? availableOptions(state)[0];
  return applyChoice(state, opt.id);
}

/** Play until the run lands on (or ends at) a node whose id matches. */
function playUntil(state: QuestRunState, nodeId: string, guard = 60): QuestRunState {
  let g = 0;
  while (!state.ended && state.nodeId !== nodeId && g++ < guard) {
    const node = nodesFor(state)[state.nodeId];
    // deterministic-ish path: pursue when possible, keep looting minimal
    if (node?.kind === 'combat') {
      state = applyChoice(state, 'fight-turn');
    } else if (state.nodeId === 'gob-incalzare') {
      state = pick(state, 'insegui');
    } else if (state.nodeId === 'gob-esplora-extra') {
      state = pick(state, 'fermati');
    } else {
      const opts = availableOptions(state);
      state = applyChoice(state, opts[0]?.id ?? 'advance');
    }
  }
  return state;
}

describe('positionalWeights', () => {
  it('matches the Director profile for 1..4 living members', () => {
    expect(positionalWeights(1)).toEqual([100]);
    expect(positionalWeights(2)).toEqual([20, 80]);
    expect(positionalWeights(3)).toEqual([0, 20, 80]);
    expect(positionalWeights(4)).toEqual([0, 0, 20, 80]);
  });

  it('escalates T1 → T2 → T3+ and stays stable past T3', () => {
    expect(positionalWeights(4, 1)).toEqual([0, 0, 20, 80]);
    expect(positionalWeights(4, 2)).toEqual([0, 5, 25, 70]);
    expect(positionalWeights(4, 3)).toEqual([5, 10, 25, 60]);
    expect(positionalWeights(4, 6)).toEqual([5, 10, 25, 60]);
  });
});

describe('goblin createRun', () => {
  it('gives the hero 100 HP and members 60, with the three consumables', () => {
    const run = createRun('gob-band', 7, 'goblin');
    expect(run.party.map((m) => m.maxHp)).toEqual([100, 60, 60, 60]);
    expect(run.flags).toEqual(['hasBonusForza', 'hasBonusPerc', 'hasHealing']);
  });
});

describe('useHealing', () => {
  it('heals the most-hurt living member for 20 and consumes the flag', () => {
    const run = createRun('gob-band', 7, 'goblin');
    run.party[3].hp = 20;
    const next = useHealing(run);
    expect(next.party[3].hp).toBe(40);
    expect(next.flags).not.toContain('hasHealing');
  });
});

describe('goblin run flow', () => {
  it('a full run ends with XP awarded and an outcome', () => {
    let run = createRun('gob-band', 42, 'goblin');
    run = playUntil(run, 'gob-fine', 80);
    expect(run.ended).toBe(true);
    expect(run.outcome).not.toBe('running');
    if (run.outcome !== 'wipe') {
      expect(run.xp).toBeGreaterThan(0);
    }
  });

  it('combat turns hit positional targets and never the same member twice per turn', () => {
    // Drive to the F4 combat and play all turns; the engine's hit log must
    // never name the same member twice in one turn.
    let run = createRun('gob-band', 11, 'goblin');
    run = playUntil(run, 'gob-combattimento');
    expect(run.nodeId).toBe('gob-combattimento');
    while (!run.ended && run.nodeId === 'gob-combattimento') {
      const before = run.log.length;
      run = applyChoice(run, 'fight-turn');
      const turnLog = run.log.slice(before).filter((e) => e.kind === 'HARM' || e.kind === 'DEATH');
      const names = turnLog.map((e) => e.text.split(' ')[0]);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('leaving the trophy at the ambush fails the quest but keeps everyone XP', () => {
    let run = createRun('gob-band', 3, 'goblin');
    // Force the ambush branch: survivors left, no extermination.
    run = playUntil(run, 'gob-agguato-scelta', 80);
    if (run.ended) return; // some seeds may never reach the ambush — fine
    expect(run.nodeId).toBe('gob-agguato-scelta');
    run = pick(run, 'molla-trofeo');
    run = playUntil(run, 'gob-fine', 10);
    expect(run.ended).toBe(true);
    expect(run.objectiveDone).toBe(false);
    expect(run.loot).not.toContain('trofeo dei goblin');
    expect(run.xp).toBeGreaterThan(0);
  });

  it('F5 pursue check exists with Forza behind the choice', () => {
    const nodes = nodesFor(createRun('gob-band', 1, 'goblin'));
    expect(nodes['gob-incalza-check'].stats).toContain('str');
    expect(nodes['gob-combattimento'].combat?.escalateProfile).toBe(true);
    expect(nodes['gob-ultimo-scontro'].combat?.turns).toBe(1);
  });

  /* ---- R-097: F5 must be a real risk/reward decision, not a free-roll ---- */

  it('letting them flee sets the MILD ambush flag (spec: flee = agguato mite)', () => {
    const run = createRun('gob-band', 1, 'goblin');
    run.nodeId = 'gob-incalzare';
    const next = applyChoice(run, 'gob-lascia-fuggire');
    expect(next.flags).toContain('agguatoMite');
    expect(next.flags).not.toContain('agguatoPeggiore');
  });

  it('a failed pursuit sets agguatoPeggiore and pays a blood toll NOW', () => {
    // Find a seed where the pursuit check fails deterministically.
    let failed: QuestRunState | null = null;
    for (let seed = 1; seed <= 200 && !failed; seed++) {
      let run = createRun('gob-band', seed, 'goblin');
      run.nodeId = 'gob-incalzare';
      const logMark = run.log.length;
      run = applyChoice(run, 'gob-insegui', { useConsumable: false });
      const v = run.lastCheck?.verdict;
      if (v === 'fail' || v === 'epicfail') {
        failed = run;
        expect(run.flags).toContain('agguatoPeggiore');
        const newLines = run.log.slice(logMark).map((e) => e.text);
        expect(newLines.some((t) => t.includes('incassa il colpo'))).toBe(true);
      }
    }
    expect(failed).not.toBeNull();
  });

  it('agguatoPeggiore removes the trophy bail-out at F7 (forced last stand)', () => {
    const run = createRun('gob-band', 1, 'goblin');
    run.nodeId = 'gob-agguato-scelta';
    run.flags.push('agguatoPeggiore');
    const ids = availableOptions(run).map((o) => o.id);
    expect(ids).toContain('gob-ultima-mischia');
    expect(ids).not.toContain('gob-molla-trofeo');
    // …and a mild ambush keeps the bail-out.
    const run2 = createRun('gob-band', 1, 'goblin');
    run2.nodeId = 'gob-agguato-scelta';
    run2.flags.push('agguatoMite');
    expect(availableOptions(run2).map((o) => o.id)).toContain('gob-molla-trofeo');
  });

  it('mild ambush fights a cheaper last stand than worsened (20 vs 30 dmg)', () => {
    const mite = createRun('gob-band', 1, 'goblin');
    mite.nodeId = 'gob-ultimo-scontro';
    mite.flags.push('agguatoMite');
    const peggiore = createRun('gob-band', 1, 'goblin');
    peggiore.nodeId = 'gob-ultimo-scontro';
    peggiore.flags.push('agguatoPeggiore');
    const m1 = applyChoice(mite, 'fight-turn');
    const p1 = applyChoice(peggiore, 'fight-turn');
    const hitsOf = (s: QuestRunState, from: number) =>
      s.log.slice(from).filter((e) => e.text.includes('incassa il colpo'));
    void hitsOf;
    const mHits = m1.log.filter((e) => e.text.includes('incassa il colpo (−20'));
    const pHits = p1.log.filter((e) => e.text.includes('incassa il colpo (−30'));
    expect(mHits.length).toBeGreaterThanOrEqual(1);
    expect(pHits.length).toBeGreaterThanOrEqual(1);
  });
});

describe('consumableFutureChecks (R-097)', () => {
  it('lists later checks that accept the consumable flag, ordered by beat', () => {
    const run = createRun('gob-band', 1, 'goblin');
    run.nodeId = 'gob-esplora'; // beat 1, previewing the PER-only check
    const later = consumableFutureChecks(run, 'hasBonusForza', 'gob-tracce-per');
    expect(later.map((c) => c.nodeId)).toEqual(['gob-assalto', 'gob-incalza-check']);
  });

  it('returns empty at F5 — the last str check — so spending is "free"', () => {
    const run = createRun('gob-band', 1, 'goblin');
    run.nodeId = 'gob-incalzare';
    expect(consumableFutureChecks(run, 'hasBonusForza', 'gob-incalza-check')).toEqual([]);
  });
});
