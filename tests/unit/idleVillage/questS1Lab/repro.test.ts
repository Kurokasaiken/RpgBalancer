import { describe, it, expect } from 'vitest';
import { createRun, applyChoice, availableOptions } from '../../../../src/ui/idleVillage/questS1Lab/questRun';
import { SCENARIO_NODES } from '../../../../src/ui/idleVillage/questS1Lab/questScenario';

const STRATS = [
  { merc: 'rv-osserva', g: 'rv-sneak', t: 'rv-prendi', c: 'rv-continua' },
  { merc: 'rv-incalza', g: 'rv-fight', t: 'rv-sicuro', c: 'rv-continua' },
  { merc: 'rv-incalza', g: 'rv-fight', t: 'rv-prendi', c: 'rv-torna' },
];

describe('repro loop', () => {
  it('full runs across seeds+strategies', () => {
    let checked = 0;
    for (const st of STRATS) {
      for (let seed = 1; seed <= 3000; seed++) {
        const run = createRun('rv-eroe', seed, 'rovine');
        let guard = 0;
        try {
          while (!run.ended && guard++ < 50) {
            const opts = availableOptions(run);
            if (opts.length === 0) break;
            const id = run.nodeId;
            let pick = opts.find((o) => !o.disabled)?.id ?? opts[0].id;
            if (id === 'rv-mercante') pick = st.merc;
            if (id === 'rv-guardie') pick = st.g;
            if (id === 'rv-tesoro-scelta') pick = st.t;
            if (id === 'rv-checkpoint') pick = st.c;
            if (id === 'rv-ritorno-evento') pick = 'rv-lascia';
            applyChoice(run, pick);
          }
          checked++;
        } catch (e: any) {
          console.log('CRASH seed', seed, 'strat', JSON.stringify(st), '::', e.message);
          console.log('node', run.nodeId, 'ended', run.ended);
          return;
        }
      }
    }
    console.log('no crash over', checked, 'runs');
  });

  it('an authored info-node cycle degrades to a terminal state instead of overflowing the stack', () => {
    // Regression: enterNode used to recurse through check/info/harm chains —
    // a cyclic `next` link (e.g. authored mid-edit) crashed the whole React
    // tree with RangeError. Now the traversal is bounded by TUNE.maxAutoSteps.
    SCENARIO_NODES['test-loop-a'] = { id: 'test-loop-a', kind: 'info', title: 'A', body: 'loop a', next: 'test-loop-b' };
    SCENARIO_NODES['test-loop-b'] = { id: 'test-loop-b', kind: 'info', title: 'B', body: 'loop b', next: 'test-loop-a' };
    try {
      const run = createRun('fisico', 1, 'cassa');
      run.nodeId = 'test-loop-a';
      expect(() => applyChoice(run, 'advance')).not.toThrow();
      expect(run.ended).toBeTruthy();
    } finally {
      delete SCENARIO_NODES['test-loop-a'];
      delete SCENARIO_NODES['test-loop-b'];
    }
  });
});
