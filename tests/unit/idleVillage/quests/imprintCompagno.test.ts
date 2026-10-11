/**
 * Unit tests for the first compiled imprint (R-152): «Il traghetto della
 * cassa» — IMPR-002 «Il compagno che ride» × kit palude, emitted as a real
 * `QuestScenario` on the 'gen' engine profile.
 *
 * Proves the imprint→graph compilation contract end-to-end:
 * - schema parse + catalog registration (`gen-impr002-palude`);
 * - run vars seeded from `initialVars` (`sospetto`) and trait-gated
 *   `armRolls` (`fiuto-prudente`);
 * - B2 cracks accumulate `sospetto` once per channel (`segna-*`);
 * - B3 turn routes on post-effect state: 'pronti' → surprise path,
 *   sospetto≥2 → confirmation read, 'annusati' → heavy ambush, else toll;
 * - B4 fork: surprise combat (2 turns), cordon combat (4 turns), walkway
 *   flight, bluff — and a failed bluff removes the option ('smascherati');
 * - B5 irony: 'posta-mossa' lands for whoever reaches the chest;
 * - B6 fork: prisoner delivered → reward, prisoner escaped → 'a-fuggito'
 *   chain seed, honoured/betrayed deal, 'a-padrone'.
 */

import { describe, expect, it } from 'vitest';
import {
  applyChoice,
  availableOptions,
  createRun,
  type QuestRunState,
} from '@/ui/idleVillage/questS1Lab/questRun';
import { createScenarioInstance as createInstance } from '@/ui/idleVillage/questS1Lab/questOffer';
import type { LabMember } from '@/ui/idleVillage/questS1Lab/questScenario';
import { GENERATED_CATALOG, IMPR002_PALUDE_SCENARIO } from '@/balancing/config/idleVillage/quests/generation/catalog';

const SCENARIO = IMPR002_PALUDE_SCENARIO;

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

function member(id: string, role: LabMember['role'], stats?: Partial<LabMember['stats']>, traits?: string[]): LabMember {
  return {
    id,
    name: id,
    role,
    stats: { perc: 70, int: 50, str: 65, con: 65, agi: 60, cha: 60, ...stats },
    hp: 100,
    ...(traits ? { traits } : {}),
  };
}

function party(traits?: string[]): LabMember[] {
  return [
    member('m-lead', 'leader', { perc: 80, cha: 70 }, traits),
    member('m-fighter', 'member', { str: 80, con: 70 }),
    member('m-fixer', 'member', { cha: 75, int: 65 }),
    member('m-bg', 'bodyguard', { con: 80, str: 60, agi: 55 }),
  ];
}

function genRun(seed: number, traits?: string[]): QuestRunState {
  return createRun({
    party: party(traits),
    seed,
    questId: 'gen',
    scenarioInstance: createInstance(SCENARIO, { dangerScale: 1, rewardScale: 1 }, 'gen'),
  });
}

function driveToEnd(run: QuestRunState, pick: (s: QuestRunState) => string | undefined, maxSteps = 60): QuestRunState {
  // `applyChoice` = submitCommand + matureReady: info beats auto-commit, so
  // one call lands on the next waiting frontier (or the end).
  for (let i = 0; i < maxSteps && !run.ended; i += 1) {
    const opts = availableOptions(run);
    if (!opts.length) break;
    const chosen = pick(run);
    applyChoice(run, chosen && opts.some((o) => o.id === chosen) ? chosen : opts[0]!.id);
  }
  return run;
}

const opt = (s: QuestRunState, id: string) => availableOptions(s).find((o) => o.id === id)?.id;

/* ------------------------------------------------------------------ */
/* Schema + catalog                                                    */
/* ------------------------------------------------------------------ */

describe('imprint compilation — schema and catalog', () => {
  it('parses at import and registers in GENERATED_CATALOG', () => {
    expect(SCENARIO.id).toBe('gen-impr002-palude');
    expect(SCENARIO.startNode).toBe('im-partenza');
    expect(GENERATED_CATALOG['gen-impr002-palude']).toBe(SCENARIO);
  });

  it('every check node carries a verdictTable (data-driven, no legacy path)', () => {
    const checks = Object.values(SCENARIO.nodes).filter((n) => n.kind === 'check');
    expect(checks.length).toBeGreaterThanOrEqual(10);
    for (const c of checks) expect(c.verdictTable, `check '${c.id}'`).toBeDefined();
  });

  it('seven beats map B0–B6 and intel labels cover every setInfo id', () => {
    expect(SCENARIO.beats).toHaveLength(7);
    const set = new Set<string>();
    for (const n of Object.values(SCENARIO.nodes)) {
      for (const o of Object.values(n.verdictTable ?? {})) {
        for (const i of o?.setInfo ?? []) set.add(i);
      }
    }
    for (const i of set) expect(SCENARIO.intelLabels?.[i], `intel '${i}' senza label`).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/* Run creation — vars, armRolls, the first fork                        */
/* ------------------------------------------------------------------ */

describe('imprint run — creation and B0/B1', () => {
  it('createRun seeds sospetto and starts at the premise', () => {
    const run = genRun(1);
    expect(run.questId).toBe('gen');
    expect(run.nodeId).toBe('im-partenza');
    expect(run.vars).toEqual({ sospetto: 0 });
  });

  it('the prudente armRoll gates the third cracks channel', () => {
    let armed = false;
    for (let seed = 1; seed <= 40 && !armed; seed += 1) {
      const run = genRun(seed, ['prudente']);
      armed = run.flags.includes('fiuto-prudente');
    }
    expect(armed, 'fiuto-prudente mai armato su 40 seed con prudente').toBe(true);
    const plain = genRun(1);
    expect(plain.flags).not.toContain('fiuto-prudente');
  });

  it('accepting the help flags uomini-di-a; refusing routes to the walkways', () => {
    const helped = genRun(1);
    applyChoice(helped, 'im-accetta');
    expect(helped.flags).toContain('uomini-di-a');
    // The B1 info beat auto-matures — the run sits at the cracks hub.
    expect(helped.nodeId).toBe('im-segnali');
    expect(helped.visitedNodes).toContain('im-canali');

    const alone = genRun(1);
    applyChoice(alone, 'im-rifiuta');
    expect(alone.flags).toContain('senza-guida');
    // The walkway check resolved inline — the run sits at the cracks hub.
    expect(alone.nodeId).toBe('im-segnali');
  });
});

/* ------------------------------------------------------------------ */
/* B2 cracks + B3 turn routing                                          */
/* ------------------------------------------------------------------ */

describe('imprint run — cracks and the turn', () => {
  it('a winning watch raises sospetto and the channel cannot repeat', () => {
    let sawGain = false;
    for (let seed = 1; seed <= 30 && !sawGain; seed += 1) {
      const run = genRun(seed);
      applyChoice(run, 'im-accetta');
      expect(run.nodeId).toBe('im-segnali');
      applyChoice(run, 'im-osserva');
      expect(run.nodeId).toBe('im-segnali'); // back to the hub, channel spent
      expect(availableOptions(run).map((o) => o.id)).not.toContain('im-osserva');
      if ((run.vars?.sospetto ?? 0) > 0) {
        sawGain = true;
        expect(run.info).toContain('fedeli-ad-a');
      }
    }
    expect(sawGain, 'nessun seed ha prodotto una crepa su 30').toBe(true);
  });

  it('sospetto≥2 routes the turn to the confirmation read → pronti → surprise option', () => {
    let sawPronti = false;
    for (let seed = 1; seed <= 40; seed += 1) {
      const run = genRun(seed);
      applyChoice(run, 'im-accetta');
      run.vars = { sospetto: 2 };
      applyChoice(run, 'im-lascia');
      expect(run.visitedNodes).toContain('im-lettura');
      expect(run.nodeId).toBe('im-scelta');
      if (run.flags.includes('pronti')) {
        sawPronti = true;
        expect(availableOptions(run).map((o) => o.id)).toContain('im-primo-colpo');
        break;
      }
    }
    expect(sawPronti, 'im-lettura non ha mai prodotto pronti su 40 seed').toBe(true);
  });

  it('an unseen approach (walkways win) routes to im-disposti with pronti already set', () => {
    let saw = false;
    for (let seed = 1; seed <= 40 && !saw; seed += 1) {
      const run = genRun(seed);
      applyChoice(run, 'im-rifiuta');
      if (!run.flags.includes('pronti')) continue; // walkway roll failed — try next seed
      applyChoice(run, 'im-lascia');
      expect(run.visitedNodes).toContain('im-disposti');
      expect(run.nodeId).toBe('im-scelta');
      expect(availableOptions(run).map((o) => o.id)).toContain('im-primo-colpo');
      saw = true;
    }
    expect(saw, 'approccio non visto mai testimoniato su 40 seed').toBe(true);
  });

  it('blind arrival lands on the trap toll — no surprise option', () => {
    const run = genRun(1);
    applyChoice(run, 'im-accetta');
    applyChoice(run, 'im-lascia');
    expect(run.visitedNodes).toContain('im-trappola');
    expect(run.nodeId).toBe('im-scelta');
    expect(run.flags).not.toContain('pronti');
    expect(availableOptions(run).map((o) => o.id)).not.toContain('im-primo-colpo');
  });
});

/* ------------------------------------------------------------------ */
/* B4 fork                                                             */
/* ------------------------------------------------------------------ */

describe('imprint run — inside-out fork', () => {
  it('a failed bluff flags smascherati and removes the recita option', () => {
    let sawMask = false;
    for (let seed = 1; seed <= 60 && !sawMask; seed += 1) {
      const run = genRun(seed);
      applyChoice(run, 'im-accetta');
      applyChoice(run, 'im-lascia');
      expect(run.nodeId).toBe('im-scelta');
      applyChoice(run, 'im-via-recita');
      if (run.flags.includes('smascherati')) {
        sawMask = true;
        expect(run.nodeId).toBe('im-scelta'); // back at the fork
        expect(availableOptions(run).map((o) => o.id)).not.toContain('im-via-recita');
      }
    }
    expect(sawMask, 'farsa mai fallita su 60 seed').toBe(true);
  });

  it('the cordon fight resolves into a-piede (cleared) or rotti (held)', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40 && seen.size < 2; seed += 1) {
      const run = genRun(seed);
      applyChoice(run, 'im-accetta');
      applyChoice(run, 'im-lascia');
      applyChoice(run, 'im-via-forza');
      expect(run.nodeId).toBe('im-scontro');
      while (run.nodeId === 'im-scontro' && !run.ended) applyChoice(run, 'fight-turn');
      if (!run.ended) seen.add(run.nodeId);
    }
    expect(seen.has('im-a-piede') || seen.has('im-rotti'), 'il combattimento non è mai uscito').toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* B5 irony + B6 fork                                                   */
/* ------------------------------------------------------------------ */

describe('imprint run — irony and fork', () => {
  it('prisoner path: the chest is a ghost (posta-mossa) and a delivered prisoner → reward', () => {
    let sawReward = false;
    for (let seed = 1; seed <= 80 && !sawReward; seed += 1) {
      const run = driveToEnd(genRun(seed), (s) =>
        opt(s, 'im-accetta') ?? opt(s, 'im-lascia') ?? opt(s, 'im-via-forza') ??
        opt(s, 'fight-turn') ?? opt(s, 'im-lega'),
      );
      if (run.outcome === 'reward' && run.flags.includes('a-consegnato')) {
        sawReward = true;
        expect(run.flags).toContain('posta-mossa');
        expect(run.objectiveDone).toBe(true);
      }
    }
    expect(sawReward, 'mai reward a-consegnato su 80 seed').toBe(true);
  });

  it('the prisoner can escape in the dark — survived with the a-fuggito chain seed', () => {
    let sawFuga = false;
    for (let seed = 1; seed <= 80 && !sawFuga; seed += 1) {
      const run = driveToEnd(genRun(seed), (s) =>
        opt(s, 'im-accetta') ?? opt(s, 'im-lascia') ?? opt(s, 'im-via-forza') ??
        opt(s, 'fight-turn') ?? opt(s, 'im-lega'),
      );
      if (run.ended && run.flags.includes('a-fuggito')) {
        sawFuga = true;
        expect(run.outcome).toBe('survived');
        expect(run.flags).not.toContain('a-consegnato');
      }
    }
    expect(sawFuga, 'a-fuggito mai testimoniato su 80 seed').toBe(true);
  });

  it('the recita path can close the deal — soci-onorati → reward', () => {
    let sawDeal = false;
    for (let seed = 1; seed <= 80 && !sawDeal; seed += 1) {
      const run = driveToEnd(genRun(seed), (s) =>
        opt(s, 'im-accetta') ?? opt(s, 'im-lascia') ?? opt(s, 'im-via-recita') ??
        opt(s, 'im-stretta') ?? opt(s, 'fight-turn') ?? opt(s, 'im-lega'),
      );
      if (run.outcome === 'reward' && run.flags.includes('soci-onorati')) {
        sawDeal = true;
        expect(run.flags).toContain('posta-mossa');
        expect(run.info).toContain('depositario-traccia');
      }
    }
    expect(sawDeal, 'mai reward soci-onorati su 80 seed').toBe(true);
  });

  it('flight keeps him master of the water — survived, a-padrone', () => {
    const run = driveToEnd(genRun(1), (s) =>
      opt(s, 'im-accetta') ?? opt(s, 'im-lascia') ?? opt(s, 'im-via-fuga'),
    );
    expect(run.ended).toBe(true);
    expect(run.flags).toContain('a-padrone');
    expect(run.outcome).toBe('survived');
  });
});
