/**
 * Unit tests for the engine-v2 declarative outcome interpreter
 * (PLAN-026 — verdictTable/OutcomeSpec/GotoSpec/vars/armRolls/traits).
 *
 * Two layers:
 * - `applyOutcomeSpec` directly (deterministic effect assertions);
 * - end-to-end through `createRun`/`applyChoice` on a synthetic
 *   `ScenarioInstance` (verdict-table lookup, arm rolls, initial vars,
 *   trait-gated options, legacy-switch fallback).
 */

import { describe, expect, it } from 'vitest';
import {
  applyChoice,
  applyOutcomeSpec,
  availableOptions,
  createRun,
  partyHasTrait,
  type ScenarioInstance,
  type QuestRunState,
} from '@/ui/idleVillage/questS1Lab/questRun';
import type { LabMember, OutcomeSpec, QuestNode } from '@/ui/idleVillage/questS1Lab/questScenario';
import { parseQuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

function member(id: string, traits?: string[]): LabMember {
  return {
    id,
    name: id,
    role: 'leader',
    stats: { perc: 40, int: 40, str: 40, con: 40, agi: 40, cha: 40 },
    hp: 100,
    ...(traits ? { traits } : {}),
  };
}

/** Small generated-style scenario exercising every declarative feature. */
function testNodes(): Record<string, QuestNode> {
  return {
    'gen-start': {
      id: 'gen-start',
      kind: 'choice',
      title: 'La crepa nel passo',
      body: 'I predoni sono già oltre la cresta.',
      options: [
        { id: 'go', label: 'Tenta il passo', detail: '', next: 'CHECK:gen-check' },
        { id: 'bail', label: 'Torna indietro', detail: '', next: 'gen-end' },
        { id: 'greedy', label: 'La scorciatoia dell’avido', detail: '', next: 'gen-end', requiresTrait: 'avido' },
        { id: 'shy', label: 'Solo per i coraggiosi', detail: '', next: 'gen-end', hiddenIfTrait: 'codardo' },
      ],
    },
    'gen-check': {
      id: 'gen-check',
      kind: 'check',
      title: 'Passa la crepa',
      body: '',
      stats: ['str'],
      risk: { wound: 0, death: 0 },
      verdictTable: {
        epicfail: { goto: 'gen-end-epic', setFlags: ['epic'] },
        fail: { goto: 'gen-after', vars: [{ var: 'rival', op: 'inc', value: 2 }] },
        almost: { goto: 'gen-after', vars: [{ var: 'rival', op: 'inc', value: 1 }] },
        win: { goto: 'gen-after', setFlags: ['clean'] },
        bigwin: { goto: 'gen-after', setFlags: ['clean'], vars: [{ var: 'rival', op: 'dec', value: 1 }] },
      },
    },
    'gen-after': {
      id: 'gen-after',
      kind: 'choice',
      title: 'Oltre la crepa',
      body: '',
      options: [
        { id: 'push-hot', label: 'Spingi', detail: '', next: 'CHECK:gen-push-hot' },
        { id: 'push-cold', label: 'Con calma', detail: '', next: 'CHECK:gen-push-cold' },
        { id: 'push-armed', label: 'Insisti', detail: '', next: 'CHECK:gen-push-armed' },
        { id: 'leave', label: 'Basta', detail: '', next: 'gen-end' },
      ],
    },
    // Conditional goto on a numeric var — heat always lands ≥ threshold.
    'gen-push-hot': {
      id: 'gen-push-hot',
      kind: 'check',
      title: 'Ultimo sforzo',
      body: '',
      stats: ['str'],
      risk: { wound: 0, death: 0 },
      verdictTable: {
        else: {
          vars: [{ var: 'heat', op: 'set', value: 9 }],
          goto: { branches: [{ when: { varGE: { var: 'heat', value: 6 } }, then: 'gen-end-lost' }], else: 'gen-end' },
        },
      },
    },
    // Same table shape, heat lands under the threshold → `else` branch.
    'gen-push-cold': {
      id: 'gen-push-cold',
      kind: 'check',
      title: 'Passo misurato',
      body: '',
      stats: ['str'],
      risk: { wound: 0, death: 0 },
      verdictTable: {
        else: {
          vars: [{ var: 'heat', op: 'set', value: 3 }],
          goto: { branches: [{ when: { varGE: { var: 'heat', value: 6 } }, then: 'gen-end-lost' }], else: 'gen-end' },
        },
      },
    },
    // Conditional goto on an armed twist flag (armRolls produces it).
    'gen-push-armed': {
      id: 'gen-push-armed',
      kind: 'check',
      title: 'Quando il mazzo scopre',
      body: '',
      stats: ['str'],
      risk: { wound: 0, death: 0 },
      verdictTable: {
        else: {
          goto: { branches: [{ when: { flag: 'twist_armed' }, then: 'gen-end-lost' }], else: 'gen-end' },
        },
      },
    },
    'gen-end': { id: 'gen-end', kind: 'end', title: 'Rientro', body: '' },
    'gen-end-lost': { id: 'gen-end-lost', kind: 'end', title: 'Superati', body: '' },
    'gen-end-epic': { id: 'gen-end-epic', kind: 'end', title: 'Disastro', body: '' },
  };
}

function testInstance(overrides?: Partial<ScenarioInstance>): ScenarioInstance {
  return {
    instanceId: 'qsi-test-gen',
    questId: 'cassa',
    scenarioHash: 'testhash',
    nodes: testNodes(),
    startNode: 'gen-start',
    ...overrides,
  };
}

function makeRun(inst?: ScenarioInstance, seed = 1, traits?: string[]): QuestRunState {
  return createRun({ party: [member('m1', traits)], seed, questId: 'cassa', scenarioInstance: inst ?? testInstance() });
}

const CHECK_NODE: QuestNode = { id: 'n', kind: 'check', title: 'Check', body: '', stats: ['str'] };

/* ------------------------------------------------------------------ */
/* applyOutcomeSpec — effect semantics                                 */
/* ------------------------------------------------------------------ */

describe('engine v2 — applyOutcomeSpec', () => {
  it('resolves a plain-string goto', () => {
    const state = makeRun();
    expect(applyOutcomeSpec(state, CHECK_NODE, { goto: 'gen-end' })).toBe('gen-end');
  });

  it('setFlags/clearFlags mutate the flag set', () => {
    const state = makeRun();
    state.flags.push('gone');
    applyOutcomeSpec(state, CHECK_NODE, {
      goto: 'gen-end',
      setFlags: ['a', 'b'],
      clearFlags: ['gone'],
    });
    expect(state.flags).toEqual(expect.arrayContaining(['a', 'b']));
    expect(state.flags).not.toContain('gone');
  });

  it('setFlags is idempotent (no duplicates)', () => {
    const state = makeRun();
    applyOutcomeSpec(state, CHECK_NODE, { goto: 'gen-end', setFlags: ['a'] });
    applyOutcomeSpec(state, CHECK_NODE, { goto: 'gen-end', setFlags: ['a'] });
    expect(state.flags.filter((f) => f === 'a')).toHaveLength(1);
  });

  it('vars ops: set/inc/dec with missing var read as 0', () => {
    const state = makeRun();
    applyOutcomeSpec(state, CHECK_NODE, {
      goto: 'gen-end',
      vars: [
        { var: 'you', op: 'set', value: 3 },
        { var: 'rival', op: 'inc', value: 4 },
        { var: 'you', op: 'dec', value: 1 },
      ],
    });
    expect(state.vars).toEqual({ you: 2, rival: 4 });
  });

  it('conditional goto sees the state AFTER the effects', () => {
    const state = makeRun();
    const spec: OutcomeSpec = {
      vars: [{ var: 'rival', op: 'inc', value: 6 }],
      goto: { branches: [{ when: { varGE: { var: 'rival', value: 6 } }, then: 'gen-end-lost' }], else: 'gen-end' },
    };
    expect(applyOutcomeSpec(state, CHECK_NODE, spec)).toBe('gen-end-lost');
  });

  it('goto else is the fallback when no branch matches', () => {
    const state = makeRun();
    expect(
      applyOutcomeSpec(state, CHECK_NODE, {
        goto: {
          branches: [
            { when: { flag: 'missing' }, then: 'gen-end-lost' },
            { when: { varLT: { var: 'heat', value: 0 } }, then: 'gen-end-epic' },
          ],
          else: 'gen-end',
        },
      }),
    ).toBe('gen-end');
  });

  it('flag/notFlag conditions evaluate the flag set', () => {
    const state = makeRun();
    state.flags.push('armed');
    const spec: OutcomeSpec = {
      goto: {
        branches: [
          { when: { flag: 'armed', notFlag: 'blocked' }, then: 'gen-end-lost' },
        ],
        else: 'gen-end',
      },
    };
    expect(applyOutcomeSpec(state, CHECK_NODE, spec)).toBe('gen-end-lost');
    state.flags.push('blocked');
    expect(applyOutcomeSpec(state, CHECK_NODE, spec)).toBe('gen-end');
  });

  it('rollFlag arms the flag at chance 100, never at 0', () => {
    const always = makeRun();
    applyOutcomeSpec(always, CHECK_NODE, { goto: 'gen-end', rollFlag: { flag: 'twist', chance: 100 } });
    expect(always.flags).toContain('twist');
    const never = makeRun();
    applyOutcomeSpec(never, CHECK_NODE, { goto: 'gen-end', rollFlag: { flag: 'twist', chance: 0 } });
    expect(never.flags).not.toContain('twist');
  });

  it('takeLoot keeps the item TAKEN, not SECURED (end → survived, not reward)', () => {
    const state = makeRun();
    applyOutcomeSpec(state, CHECK_NODE, { goto: 'gen-end', takeLoot: ['reliquia'] });
    expect(state.loot).toContain('reliquia');
    expect(state.objectiveDone).toBe(false);
    applyChoice(state, 'bail'); // reach gen-end through the authored choice
    expect(state.ended).toBe(true);
    expect(state.outcome).toBe('survived'); // loot in hand ≠ objective done
    expect(state.loot).toContain('reliquia');
  });

  it('setObjective done + loot in hand at an end node → reward', () => {
    const state = makeRun();
    applyOutcomeSpec(state, CHECK_NODE, {
      goto: 'gen-end',
      takeLoot: ['reliquia'],
      setObjective: 'done',
    });
    applyChoice(state, 'bail');
    expect(state.outcome).toBe('reward');
  });

  it('setInfo/goldDelta/log apply their effects', () => {
    const state = makeRun();
    applyOutcomeSpec(state, CHECK_NODE, {
      goto: 'gen-end',
      setInfo: ['turni'],
      goldDelta: -5,
      log: 'I predoni ti hanno visto.',
    });
    expect(state.info).toContain('turni');
    expect(state.gold).toBe(-5);
    expect(state.log.at(-1)).toEqual({ kind: 'INFO', text: 'I predoni ti hanno visto.' });
  });
});

/* ------------------------------------------------------------------ */
/* End-to-end through createRun + applyChoice on a ScenarioInstance     */
/* ------------------------------------------------------------------ */

describe('engine v2 — run on a generated ScenarioInstance', () => {
  it('starts on the instance startNode', () => {
    const state = makeRun();
    expect(state.nodeId).toBe('gen-start');
  });

  it('initialVars seed the run vars', () => {
    const state = makeRun(testInstance({ initialVars: { rival: 4, you: 3 } }));
    expect(state.vars).toEqual({ rival: 4, you: 3 });
  });

  it('verdictTable rows drive routing per verdict across seeds', () => {
    const seen = new Map<string, string>();
    for (let seed = 1; seed <= 40; seed += 1) {
      const run = makeRun(testInstance(), seed);
      applyChoice(run, 'go');
      const verdict = run.checkQueue[0]?.verdict;
      expect(verdict).toBeDefined();
      seen.set(verdict!, run.nodeId);
      const expected: Record<string, string> = {
        epicfail: 'gen-end-epic',
        fail: 'gen-after',
        almost: 'gen-after',
        win: 'gen-after',
        bigwin: 'gen-after',
      };
      expect(run.nodeId).toBe(expected[verdict!]);
    }
    // sanity: several verdict bands actually exercised
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });

  it('verdictTable vars ops land on the run state (fail/almost path)', () => {
    let sawVarChange = false;
    for (let seed = 1; seed <= 40 && !sawVarChange; seed += 1) {
      const run = makeRun(testInstance(), seed);
      applyChoice(run, 'go');
      const verdict = run.checkQueue[0]?.verdict;
      if (verdict === 'fail') {
        expect(run.vars?.rival).toBe(2);
        sawVarChange = true;
      } else if (verdict === 'almost') {
        expect(run.vars?.rival).toBe(1);
        sawVarChange = true;
      }
    }
    expect(sawVarChange).toBe(true);
  });

  it('conditional goto on vars: heat ≥6 → lost node, below → normal end', () => {
    let sawHot = false;
    let sawCold = false;
    for (let seed = 1; seed <= 40 && !(sawHot && sawCold); seed += 1) {
      const hot = makeRun(testInstance(), seed);
      applyChoice(hot, 'go');
      if (hot.nodeId === 'gen-after') {
        applyChoice(hot, 'push-hot');
        expect(hot.nodeId).toBe('gen-end-lost');
        expect(hot.vars?.heat).toBe(9);
        sawHot = true;
      }
      const cold = makeRun(testInstance(), seed);
      applyChoice(cold, 'go');
      if (cold.nodeId === 'gen-after') {
        applyChoice(cold, 'push-cold');
        expect(cold.nodeId).toBe('gen-end');
        expect(cold.vars?.heat).toBe(3);
        sawCold = true;
      }
    }
    expect(sawHot).toBe(true);
    expect(sawCold).toBe(true);
  });

  it('armRolls: chance 100 arms the flag — requiresTrait gates the roll', () => {
    const withTrait = makeRun(
      testInstance({ armRolls: [{ flag: 'twist_armed', chance: 100, requiresTrait: 'avido' }] }),
      1,
      ['avido'],
    );
    expect(withTrait.flags).toContain('twist_armed');
    const noTrait = makeRun(
      testInstance({ armRolls: [{ flag: 'twist_armed', chance: 100, requiresTrait: 'avido' }] }),
    );
    expect(noTrait.flags).not.toContain('twist_armed');
  });

  it('armed twist flag steers the conditional goto', () => {
    const armed = makeRun(
      testInstance({ armRolls: [{ flag: 'twist_armed', chance: 100 }] }),
      1,
    );
    expect(armed.flags).toContain('twist_armed');
    for (let seed = 1; seed <= 40; seed += 1) {
      const r = makeRun(
        testInstance({ armRolls: [{ flag: 'twist_armed', chance: 100 }] }),
        seed,
      );
      applyChoice(r, 'go');
      if (r.nodeId !== 'gen-after') continue;
      applyChoice(r, 'push-armed');
      expect(r.nodeId).toBe('gen-end-lost');
      return;
    }
    throw new Error('no seed reached gen-after');
  });

  it('trait-gated options: requiresTrait shows only for carriers, hiddenIfTrait hides', () => {
    const avido = makeRun(testInstance(), 1, ['avido']);
    const idsAvido = availableOptions(avido).map((o) => o.id);
    expect(idsAvido).toContain('greedy');
    expect(idsAvido).toContain('shy');
    const plain = makeRun(testInstance(), 1, ['codardo']);
    const idsPlain = availableOptions(plain).map((o) => o.id);
    expect(idsPlain).not.toContain('greedy');
    expect(idsPlain).not.toContain('shy');
  });

  it('partyHasTrait reads living members only', () => {
    const state = makeRun(testInstance(), 1, ['avido']);
    expect(partyHasTrait(state, 'avido')).toBe(true);
    expect(partyHasTrait(state, 'codardo')).toBe(false);
    state.party[0]!.dead = true;
    expect(partyHasTrait(state, 'avido')).toBe(false);
  });

  it('does not mutate the authored instance node map', () => {
    const inst = testInstance();
    const before = JSON.stringify(inst.nodes);
    const run = makeRun(inst);
    applyChoice(run, 'go');
    expect(JSON.stringify(inst.nodes)).toBe(before);
  });
});

/* ------------------------------------------------------------------ */
/* Legacy fallback — authored nodes keep the switch                     */
/* ------------------------------------------------------------------ */

describe('engine v2 — legacy fallback', () => {
  it('authored cassa nodes still route through the legacy switch', () => {
    const run = createRun('ibrido', 7);
    applyChoice(run, 'no-buy'); // mercante → incidente → avvistamento (auto check)
    expect(run.nodeId).toBe('approccio'); // legacy case 'avvistamento' → 'approccio'
  });
});

/* ------------------------------------------------------------------ */
/* Schema validation                                                   */
/* ------------------------------------------------------------------ */

describe('engine v2 — QuestScenarioSchema verdictTable', () => {
  function baseScenario(nodes: Record<string, unknown>, extra?: Record<string, unknown>) {
    return {
      id: 'gen-test',
      title: 'Test',
      scenarioVersion: 'v0',
      startNode: 'gen-start',
      primaryStats: ['str'],
      beats: ['uno'],
      offer: {
        objective: 'test',
        slots: {
          required: [{ id: 's1', role: 'leader', statFocus: ['str'] }],
          optional: [],
        },
      },
      ...extra,
      nodes,
    };
  }

  it('accepts a complete verdictTable with existing goto targets', () => {
    const parsed = parseQuestScenario(
      baseScenario({
        'gen-start': {
          id: 'gen-start',
          kind: 'choice',
          title: 't',
          body: 'b',
          options: [{ id: 'go', label: 'l', detail: 'd', next: 'CHECK:gen-check' }],
        },
        'gen-check': {
          id: 'gen-check',
          kind: 'check',
          title: 't',
          body: 'b',
          stats: ['str'],
          verdictTable: {
            else: { goto: { branches: [{ when: { varGE: { var: 'x', value: 1 } }, then: 'gen-end' }], else: 'gen-end' } },
          },
        },
        'gen-end': { id: 'gen-end', kind: 'end', title: 't', body: 'b' },
      }),
    );
    expect(parsed.nodes['gen-check']?.verdictTable?.else?.goto).toBeDefined();
  });

  it('rejects a goto target that does not exist', () => {
    expect(() =>
      parseQuestScenario(
        baseScenario({
          'gen-start': {
            id: 'gen-start',
            kind: 'choice',
            title: 't',
            body: 'b',
            options: [{ id: 'go', label: 'l', detail: 'd', next: 'CHECK:gen-check' }],
          },
          'gen-check': {
            id: 'gen-check',
            kind: 'check',
            title: 't',
            body: 'b',
            stats: ['str'],
            verdictTable: { else: { goto: 'ghost-node' } },
          },
          'gen-end': { id: 'gen-end', kind: 'end', title: 't', body: 'b' },
        }),
      ),
    ).toThrow(/ghost-node/);
  });

  it('rejects an incomplete verdictTable without an else row', () => {
    expect(() =>
      parseQuestScenario(
        baseScenario({
          'gen-start': {
            id: 'gen-start',
            kind: 'choice',
            title: 't',
            body: 'b',
            options: [{ id: 'go', label: 'l', detail: 'd', next: 'CHECK:gen-check' }],
          },
          'gen-check': {
            id: 'gen-check',
            kind: 'check',
            title: 't',
            body: 'b',
            stats: ['str'],
            verdictTable: { win: { goto: 'gen-end' }, fail: { goto: 'gen-end' } },
          },
          'gen-end': { id: 'gen-end', kind: 'end', title: 't', body: 'b' },
        }),
      ),
    ).toThrow(/verdictTable incompleta/);
  });

  it('counts armRolls/setFlags/rollFlag as flag producers for requiresFlag', () => {
    expect(() =>
      parseQuestScenario(
        baseScenario(
          {
            'gen-start': {
              id: 'gen-start',
              kind: 'choice',
              title: 't',
              body: 'b',
              options: [
                { id: 'go', label: 'l', detail: 'd', next: 'gen-end', requiresFlag: 'twist_armed' },
              ],
            },
            'gen-end': { id: 'gen-end', kind: 'end', title: 't', body: 'b' },
          },
          { armRolls: [{ flag: 'twist_armed', chance: 50, requiresTrait: 'avido' }] },
        ),
      ),
    ).not.toThrow();
  });
});
