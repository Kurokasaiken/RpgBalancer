/**
 * Unit tests for the quest simulation preview layer (R-082).
 *
 * Covers the 20 counterfactual cases from the Director's spec: every case
 * verifies the forecast changes only when a meaningful simulation input
 * changes, and stays deterministic while inputs don't.
 *
 * - `simulateQuest` is Monte Carlo on the real engine — assertions are
 *   distributional, never single-run values.
 * - `analyzeCheck` is the exact closed form of the same band math — its
 *   assertions can be precise.
 */

import { describe, expect, it } from 'vitest';
import { applyChoice, createRun, nodesFor, QUESTS } from '@/ui/idleVillage/questS1Lab/questRun';
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import type { LabStat } from '@/ui/idleVillage/questS1Lab/questScenario';
import {
  analyzeCheck,
  CHECKPOINT_OPTIONS,
  choiceNodesFor,
  computeForecastDelta,
  defaultStrategy,
  simulateQuest,
} from '@/ui/idleVillage/questS1Lab/questSimulation';

const SEED = 7;
const RUNS = 1500;

/** Fresh rovine run on the strongest authored preset. */
function rovineRun(): QuestRunState {
  return createRun('rv-eroe', 42, 'rovine');
}

/** Shallow state variant — the sim clones internally, so callers may build
 *  hypothetical states cheaply; the input run must never be mutated. */
function withParty(run: QuestRunState, mutate: (m: QuestRunState['party']) => QuestRunState['party']): QuestRunState {
  return { ...run, party: mutate(run.party.map((m) => ({ ...m, stats: { ...m.stats } }))) };
}

const sim = (state: QuestRunState, strategy = {}, seed = SEED) =>
  simulateQuest(state, strategy, { runs: RUNS, seed });

const node = (state: QuestRunState, id: string) => nodesFor(state)[id]!;

describe('quest simulation — determinism and engine fidelity', () => {
  it('is deterministic: same inputs + seed → identical forecast', () => {
    const a = sim(rovineRun(), defaultStrategy(rovineRun()));
    const b = sim(rovineRun(), defaultStrategy(rovineRun()));
    expect(a).toEqual(b);
  });

  it('does not mutate the input run state', () => {
    const run = rovineRun();
    sim(run);
    expect(run.party.every((m) => !m.wounded && !m.dead)).toBe(true);
    expect(run.nodeId).toBe(QUESTS.rovine.startNode);
    expect(run.ended).toBe(false);
  });

  it('outcome distribution covers 100% and days are at least the authored base', () => {
    const r = sim(rovineRun());
    const sum =
      r.outcomePct.reward + r.outcomePct.survived + r.outcomePct.fled + r.outcomePct.wipe;
    expect(sum).toBeCloseTo(100, 5);
    expect(r.daysMin).toBeGreaterThanOrEqual(4);
    expect(r.daysP50).toBeGreaterThanOrEqual(r.daysMin);
    expect(r.daysP90).toBeLessThanOrEqual(r.daysMax);
  });

  it('preserves state between phases — wounds propagate (attrition exists in results)', () => {
    const r = sim(rovineRun(), { 'rv-checkpoint': 'rv-continua' });
    // The push strategy crosses rv-attrito + rv-camera: some runs must wound.
    expect(r.anyWoundPct).toBeGreaterThan(0);
    expect(r.avgWounded).toBeGreaterThan(0);
  });

  it('leader death forbids the reward outcome — engine rule, not a formula', () => {
    const run = rovineRun();
    const dead = withParty(run, (p) => p.map((m) => (m.role === 'leader' ? { ...m, dead: true } : m)));
    const r = sim(dead);
    expect(r.outcomePct.reward).toBe(0);
    expect(r.leaderDeathPct).toBe(100);
  });
});

describe('quest simulation — the 20 counterfactuals', () => {
  const base = () => rovineRun();

  it('1. base party — sane forecast on the hero preset', () => {
    const r = sim(base());
    expect(r.outcomePct.reward).toBeGreaterThan(0);
    expect(r.perMember).toHaveLength(4);
    expect(r.zeroDeathsPct + r.anyDeathPct).toBeCloseTo(100, 5);
  });

  it('2. adding a villager changes the forecast (extra body = extra exposure)', () => {
    const added = withParty(base(), (p) => [
      ...p,
      {
        id: 'extra',
        name: 'Tano',
        role: 'member',
        stats: { str: 40, con: 40, agi: 40, perc: 40, int: 40, cha: 40 },
        portrait: '',
        hp: 10,
        maxHp: 10,
        wounded: false,
        dead: false,
      },
    ]);
    expect(sim(added)).not.toEqual(sim(base()));
  });

  it('3. removing a villager changes the forecast', () => {
    const removed = withParty(base(), (p) => p.filter((m) => m.id !== 'r4'));
    expect(sim(removed)).not.toEqual(sim(base()));
  });

  it('4. replacing the leader changes leader-risk reporting', () => {
    const swapped = withParty(base(), (p) =>
      p.map((m) => ({
        ...m,
        role: m.id === 'r2' ? 'leader' : m.role === 'leader' ? 'member' : m.role,
      })),
    );
    const r = sim(swapped);
    expect(r.perMember.find((m) => m.role === 'leader')?.id).toBe('r2');
    expect(r).not.toEqual(sim(base()));
  });

  it('5. increasing the main stat raises the check bound', () => {
    const run = base();
    const boosted = withParty(run, (p) =>
      p.map((m) => (m.role === 'leader' ? { ...m, stats: { ...m.stats, str: m.stats.str + 20 } } : m)),
    );
    const a0 = analyzeCheck(run, node(run, 'rv-fiume'));
    const a1 = analyzeCheck(boosted, node(run, 'rv-fiume'));
    expect(a1.successBound).toBeCloseTo(a0.successBound + 10, 5); // str+con avg → +10
    expect(sim(boosted)).not.toEqual(sim(run));
  });

  it('6. decreasing the main stat lowers the check bound', () => {
    const run = base();
    const weakened = withParty(run, (p) =>
      p.map((m) => (m.role === 'leader' ? { ...m, stats: { ...m.stats, str: m.stats.str - 30 } } : m)),
    );
    const a0 = analyzeCheck(run, node(run, 'rv-fiume'));
    const a1 = analyzeCheck(weakened, node(run, 'rv-fiume'));
    expect(a1.successBound).toBeCloseTo(a0.successBound - 15, 5);
  });

  it('7. an owned-but-unused consumable does NOT change the quest forecast', () => {
    const run = base();
    const withRope: QuestRunState = { ...run, flags: [...run.flags, 'hasCorda'] };
    // Director 2026-10-04: the quest sim ignores consumables — identical output.
    expect(sim(withRope)).toEqual(sim(run));
  });

  it('8. committing the consumable adds its bonus to the check forecast', () => {
    // The gracile preset's bound is low enough that +15 stays under the
    // canonical ceiling — on the hero preset the rope would correctly clamp
    // at 95 (the ceiling is engine behaviour, tested by the clamp itself).
    const run = createRun('rv-gracile', 42, 'rovine');
    const withRope: QuestRunState = { ...run, flags: [...run.flags, 'hasCorda'] };
    const fiume = node(run, 'rv-fiume'); // str+con → rope applies
    const without = analyzeCheck(withRope, fiume, { useConsumable: false });
    const with_ = analyzeCheck(withRope, fiume, { useConsumable: true });
    expect(without.consumableApplied).toBe(false);
    expect(with_.consumableApplied).toBe(true);
    expect(with_.successBound).toBeCloseTo(without.successBound + 15, 5);
    expect(with_.successPct).toBeGreaterThan(without.successPct);
  });

  it('9. removing the consumable removes the bonus — same as never having it', () => {
    const run = base();
    const fiume = node(run, 'rv-fiume');
    const clean = analyzeCheck(run, fiume, { useConsumable: true });
    expect(clean.consumable).toBeUndefined();
    const withRope: QuestRunState = { ...run, flags: ['hasCorda'] };
    const stowed = analyzeCheck(withRope, fiume, { useConsumable: false });
    expect(stowed.successBound).toBeCloseTo(clean.successBound, 5);
  });

  it('10. a wounded member carries their wound through the forecast', () => {
    const run = base();
    const hurt = withParty(run, (p) => p.map((m) => (m.id === 'r2' ? { ...m, wounded: true } : m)));
    const a = analyzeCheck(hurt, node(run, 'rv-check-osserva'));
    const pietro = a.perMember.find((m) => m.id === 'r2')!;
    // Already wounded ⇒ he stays wounded unless the check kills him.
    expect(pietro.woundPct).toBeGreaterThan(90);
    expect(sim(hurt)).not.toEqual(sim(run));
  });

  it('11. a dead member no longer contributes — sneak loses its best agi', () => {
    const run = base();
    const killed = withParty(run, (p) => p.map((m) => (m.id === 'r3' ? { ...m, dead: true } : m)));
    const a0 = analyzeCheck(run, node(run, 'rv-check-sneak')); // agi — Sara's stat
    const a1 = analyzeCheck(killed, node(run, 'rv-check-sneak'));
    expect(a1.successBound).toBeLessThan(a0.successBound);
  });

  it('12. a wounded leader reports higher leader risk', () => {
    const run = base();
    const hurt = withParty(run, (p) =>
      p.map((m) => (m.role === 'leader' ? { ...m, wounded: true } : m)),
    );
    const a0 = analyzeCheck(run, node(run, 'rv-fiume'));
    const a1 = analyzeCheck(hurt, node(run, 'rv-fiume'));
    // The wounded leader stays wounded ⇒ leaderWoundPct saturates upward.
    expect(a1.leaderWoundPct).toBeGreaterThan(a0.leaderWoundPct);
    expect(sim(hurt).leaderWoundPct).toBeGreaterThan(sim(run).leaderWoundPct);
  });

  it('13. a dead leader zeroes the reward probability (see engine test)', () => {
    const run = base();
    const dead = withParty(run, (p) => p.map((m) => (m.role === 'leader' ? { ...m, dead: true } : m)));
    expect(sim(dead).outcomePct.reward).toBe(0);
  });

  it('14/15. stealth vs combat produce different distributions — fight pays more, risks more', () => {
    const run = base();
    const sneak = sim(run, { 'rv-guardie': 'rv-sneak' });
    const fight = sim(run, { 'rv-guardie': 'rv-fight' });
    expect(fight).not.toEqual(sneak);
    // The guards' loot only exists if they are fought.
    expect(sneak.optionalPct.guardLoot).toBe(0);
    expect(fight.optionalPct.guardLoot).toBeGreaterThan(0);
  });

  it('16/17. return vs continue at the checkpoint trades safety for depth', () => {
    const run = base();
    const cp = CHECKPOINT_OPTIONS.rovine;
    const secure = sim(run, { [cp.nodeId]: cp.secure });
    const push = sim(run, { [cp.nodeId]: cp.push });
    expect(push).not.toEqual(secure);
    // Pushing deeper costs days and bodies, pays treasure.
    expect(push.daysAvg).toBeGreaterThan(secure.daysAvg);
    expect(push.treasureAvg).toBeGreaterThanOrEqual(secure.treasureAvg);
  });

  it('18. a guaranteed-success party almost always brings the reward home', () => {
    const god = withParty(base(), (p) =>
      p.map((m) => ({ ...m, stats: Object.fromEntries(Object.keys(m.stats).map((s) => [s, 99])) as Record<LabStat, number> })),
    );
    const r = sim(god);
    expect(r.outcomePct.reward).toBeGreaterThan(50);
  });

  it('19. a hopeless party nearly never earns the reward', () => {
    const weak = withParty(base(), (p) =>
      p.map((m) => ({ ...m, stats: Object.fromEntries(Object.keys(m.stats).map((s) => [s, 5])) as Record<LabStat, number> })),
    );
    const r = sim(weak);
    // Fails cost wounds and days, not progress — so a wrecked party still
    // limps home occasionally. It must stay a fraction of the base rate.
    expect(r.outcomePct.reward).toBeLessThan(15);
    expect(r.outcomePct.reward).toBeLessThan(sim(base()).outcomePct.reward / 3);
  });

  it('20. a check with no death band can never kill — analytic zero', () => {
    const run = base();
    const a = analyzeCheck(run, node(run, 'rv-check-osserva')); // risk {wound:2, death:0}
    expect(a.anyDeathPct).toBe(0);
    expect(a.perMember.every((m) => m.deathPct === 0)).toBe(true);
  });
});

describe('quest simulation — signal vs noise', () => {
  it('an irrelevant input (member name) does not change the forecast', () => {
    const run = rovineRun();
    const renamed = withParty(run, (p) => p.map((m) => ({ ...m, name: `${m.name} Jr.` })));
    // Names are display data — compare the metrics, stripping the name echo.
    const strip = (r: ReturnType<typeof sim>) => ({
      ...r,
      perMember: r.perMember.map(({ name: _n, ...rest }) => rest),
    });
    expect(strip(sim(renamed))).toEqual(strip(sim(run)));
  });

  it('the strategy map only touches its own nodes', () => {
    const run = rovineRun();
    const opts = choiceNodesFor(run).map((n) => n.id);
    expect(opts).toContain('rv-checkpoint');
    const strat = defaultStrategy(run);
    // Overriding a node the run never reaches must be a no-op.
    const ghost = sim(run, { ...strat, 'no-such-node': 'x' });
    expect(ghost).toEqual(sim(run, strat));
  });

  it('check analysis is exact: verdict probabilities sum to 1 and match the clamp', () => {
    const run = rovineRun();
    const a = analyzeCheck(run, node(run, 'rv-fiume'));
    const total = Object.values(a.verdicts).reduce((x, y) => x + y, 0);
    expect(total).toBeCloseTo(1, 10);
    expect(a.successPct).toBe(Math.round(a.successBound));
    expect(a.successBound).toBeLessThanOrEqual(95);
    expect(a.successBound).toBeGreaterThanOrEqual(5);
  });

  it('mid-run state is simulated from where it actually is', () => {
    // Play the merchant beat for real, then forecast from the next node.
    const run = rovineRun();
    const mid = applyChoice(run, 'rv-osserva');
    const r = sim(mid);
    expect(mid.nodeId).not.toBe(QUESTS.rovine.startNode);
    expect(r.outcomePct.reward + r.outcomePct.survived + r.outcomePct.fled + r.outcomePct.wipe).toBeCloseTo(100, 5);
  });
});

describe('quest simulation — WHY attribution + forecast delta (S3 T-2)', () => {
  it('attributes every harm event to an authored node title', () => {
    const run = rovineRun();
    const r = sim(run, { 'rv-checkpoint': 'rv-continua' }); // push: crosses the risky stretch
    const titles = new Set(Object.values(nodesFor(run)).map((n) => n.title));
    expect(r.whyBySource.length).toBeGreaterThan(0);
    for (const src of r.whyBySource) {
      expect(titles.has(src.source)).toBe(true);
      expect(src.runsPct).toBeGreaterThan(0);
      expect(src.runsPct).toBeLessThanOrEqual(100);
      expect(src.woundSharePct).toBeGreaterThanOrEqual(0);
      expect(src.woundSharePct).toBeLessThanOrEqual(100);
      expect(src.deathSharePct).toBeGreaterThanOrEqual(0);
      expect(src.deathSharePct).toBeLessThanOrEqual(100);
    }
  });

  it('shares partition the totals: death share sums to ~100, rows sorted by impact', () => {
    const r = sim(rovineRun(), { 'rv-checkpoint': 'rv-continua' });
    const deathSum = r.whyBySource.reduce((a, s) => a + s.deathSharePct, 0);
    const woundSum = r.whyBySource.reduce((a, s) => a + s.woundSharePct, 0);
    if (r.anyDeathPct > 0) expect(deathSum).toBeCloseTo(100, 5);
    if (r.anyWoundPct > 0) expect(woundSum).toBeCloseTo(100, 5);
    const impact = r.whyBySource.map((s) => s.deathSharePct + s.woundSharePct);
    expect(impact).toEqual([...impact].sort((a, b) => b - a));
  });

  it('computeForecastDelta is the signed pp difference of the headline metrics', () => {
    const run = rovineRun();
    const weak = sim(withParty(run, (p) => p.map((m) => ({ ...m, stats: { ...m.stats, fort: 0, edge: 0, perc: 0, ward: 0 } }))));
    const strong = sim(run);
    const d = computeForecastDelta(strong, weak);
    expect(d.deathPp).toBeCloseTo(strong.anyDeathPct - weak.anyDeathPct, 10);
    expect(d.woundPp).toBeCloseTo(strong.anyWoundPct - weak.anyWoundPct, 10);
    expect(d.rewardPp).toBeCloseTo(strong.outcomePct.reward - weak.outcomePct.reward, 10);
    expect(d.wipePp).toBeCloseTo(strong.outcomePct.wipe - weak.outcomePct.wipe, 10);
    expect(d.days).toBeCloseTo(strong.daysAvg - weak.daysAvg, 10);
    // The strong party should look strictly safer than the zero-stat one.
    expect(d.deathPp).toBeLessThanOrEqual(0);
  });

  it('reversibility: sim is a pure function of inputs — a rebuilt party returns an identical result', () => {
    const solo = sim(rovineRun());
    // A different configuration…
    const two = sim(
      withParty(rovineRun(), (p) => [
        ...p,
        { id: 'extra', name: 'Extra', role: 'member', hp: 20, maxHp: 20, stats: { fort: 10, perc: 10, edge: 10, ward: 10 }, dead: false, wounded: false, traits: [] },
      ]),
    );
    expect(two).not.toEqual(solo);
    // …then the original again — bit-identical (same inputs → same seed → same numbers).
    expect(sim(rovineRun())).toEqual(solo);
  });
});
