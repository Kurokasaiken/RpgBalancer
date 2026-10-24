/**
 * PLAN-029 SP-1 — contract tests for the lab foundation modules:
 * canonicalize (T-3), kitSchemas (T-4), gimmickRegistry (T-5),
 * diagnosticGates (T-2 ratified tuple).
 *
 * Contract source: context/QUEST_GEN_LAB_CONTRACTS.md §6/§9/§10.
 */

import { describe, expect, it } from 'vitest';
import {
  canonicalize,
  canonicalizationVersion,
  stripUndefinedDeep,
} from '@/balancing/config/idleVillage/quests/generation/canonicalize';
import { DIAGNOSTIC_GATE_IDS } from '@/balancing/config/idleVillage/quests/generation/diagnosticGates';
import {
  FloodDomainKitSchema,
  FloodTuningSchema,
  LocalizedRaceDomainKitSchema,
  parseRaceDomainKit,
  RaceDomainKitSchema,
  RaceTuningSchema,
} from '@/balancing/config/idleVillage/quests/generation/kitSchemas';
import {
  GIMMICK_REGISTRY,
  gimmickRow,
} from '@/balancing/config/idleVillage/quests/generation/gimmickRegistry';
import {
  generateFloodVault,
  FLOOD_DEFAULT_TUNING,
} from '@/balancing/config/idleVillage/quests/generation/floodVault';
import {
  generateRaceScenario,
  RACE_DEFAULT_TUNING,
} from '@/balancing/config/idleVillage/quests/generation/raceGimmick';
import { PASSO_MONTANO_KIT, PALUDE_KIT } from '@/balancing/config/idleVillage/quests/generation/kits';
import { MINIERA_FLOOD_KIT } from '@/balancing/config/idleVillage/quests/generation/floodMiniera';
import { MARE_FLOOD_KIT } from '@/balancing/config/idleVillage/quests/generation/narrated/flood-mare.kit';
import { MINIERA_RACE_KIT } from '@/balancing/config/idleVillage/quests/generation/narrated/race-miniera.kit';
import { parseQuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';

/* ------------------------------------------------------------------ */
/* canonicalize (T-3)                                                  */
/* ------------------------------------------------------------------ */

describe('canonicalize', () => {
  it('sorts object keys by UTF-16 code-unit order recursively', () => {
    expect(canonicalize({ b: 1, a: { d: 2, c: 3 } })).toBe('{"a":{"c":3,"d":2},"b":1}');
  });

  it('preserves array order', () => {
    expect(canonicalize([2, 1, 3])).toBe('[2,1,3]');
  });

  it('serializes scalars with JSON semantics (-0 → 0)', () => {
    expect(canonicalize({ a: -0, b: 'x"y', c: true, d: null })).toBe(
      '{"a":0,"b":"x\\"y","c":true,"d":null}',
    );
  });

  it('throws on undefined values (strict — never silently drops)', () => {
    expect(() => canonicalize({ a: undefined, b: 1 } as never)).toThrow(/undefined/);
  });

  it('throws on NaN and Infinity', () => {
    expect(() => canonicalize(NaN as never)).toThrow(/non-finite/);
    expect(() => canonicalize(Infinity as never)).toThrow(/non-finite/);
  });

  it('throws on non-JSON types (function, symbol, bigint)', () => {
    expect(() => canonicalize({ f: () => 1 } as never)).toThrow(/non-JSON type/);
    expect(() => canonicalize(Symbol('s') as never)).toThrow(/non-JSON type/);
    expect(() => canonicalize(1n as never)).toThrow(/non-JSON type/);
  });

  it('throws on cycles with a path', () => {
    const o: Record<string, unknown> = { a: 1 };
    o.self = o;
    expect(() => canonicalize(o as never)).toThrow(/cycle at '\$\.self'/);
  });

  it('throws on non-plain objects (Date, class instances)', () => {
    expect(() => canonicalize(new Date(0) as never)).toThrow(/non-plain object/);
  });

  it('is deterministic across differently-ordered inputs', () => {
    expect(canonicalize({ z: 1, a: 2, m: { y: 3, b: 4 } })).toBe(
      canonicalize({ m: { b: 4, y: 3 }, a: 2, z: 1 }),
    );
  });
});

describe('stripUndefinedDeep', () => {
  it('strips undefined-valued keys recursively', () => {
    expect(
      stripUndefinedDeep({ a: undefined, b: 1, c: { d: undefined, e: 2 } }),
    ).toEqual({ b: 1, c: { e: 2 } });
  });

  it('golden: canonicalize(stripUndefinedDeep({a:undefined,b:1})) === \'{"b":1}\'', () => {
    expect(canonicalize(stripUndefinedDeep({ a: undefined, b: 1 }))).toBe('{"b":1}');
  });

  it('merged tuning with explicit undefined hashes stably', () => {
    const merged = { ...RACE_DEFAULT_TUNING, ...{ twistChance: undefined } };
    expect(canonicalize(stripUndefinedDeep(merged))).toBe(
      canonicalize({ goal: 6, twistRearmChance: 60 }),
    );
  });

  it('throws on array holes', () => {
    // eslint-disable-next-line no-sparse-arrays
    expect(() => stripUndefinedDeep([1, , 3])).toThrow(/hole/);
  });

  it('throws on functions/symbols (never strips them)', () => {
    expect(() => stripUndefinedDeep({ f: () => 1 })).toThrow(/non-JSON type/);
  });

  it('canonicalizationVersion is pinned at 1', () => {
    expect(canonicalizationVersion).toBe(1);
  });
});

describe('canonical envelopes (golden vectors, contract §11)', () => {
  it('GenerationInputEnvelope golden string', () => {
    const envelope = {
      v: 1,
      gimmickId: 'race',
      kit: { id: 'k' },
      tuning: { goal: 6 },
      generatorVersion: 'gv1',
      schemaVersion: 'sv1',
      engineVersion: 'ev1',
    };
    expect(canonicalize(envelope)).toBe(
      '{"engineVersion":"ev1","generatorVersion":"gv1","gimmickId":"race","kit":{"id":"k"},"schemaVersion":"sv1","tuning":{"goal":6},"v":1}',
    );
  });

  it('RunInputEnvelope golden string', () => {
    const envelope = {
      v: 1,
      scenarioHash: 'qsv1-abc',
      party: [{ id: 'm1' }],
      runSeed: 42,
      engineVersion: 'ev1',
    };
    expect(canonicalize(envelope)).toBe(
      '{"engineVersion":"ev1","party":[{"id":"m1"}],"runSeed":42,"scenarioHash":"qsv1-abc","v":1}',
    );
  });
});

/* ------------------------------------------------------------------ */
/* diagnosticGates (T-2 ratified tuple)                                */
/* ------------------------------------------------------------------ */

describe('DIAGNOSTIC_GATE_IDS', () => {
  it('contains exactly the ratified six ids', () => {
    expect([...DIAGNOSTIC_GATE_IDS]).toEqual([
      'graphCoverage',
      'vocabCoherence',
      'hookCoverage',
      'mcDiagnostic',
      'copyGate',
      'journeyDag',
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* kitSchemas (T-4)                                                    */
/* ------------------------------------------------------------------ */

describe('kitSchemas — baked kit fixtures', () => {
  it('all flat baked race kits parse', () => {
    expect(RaceDomainKitSchema.parse(PASSO_MONTANO_KIT)).toBeTruthy();
    expect(RaceDomainKitSchema.parse(PALUDE_KIT)).toBeTruthy();
  });

  it('all flat baked flood kits parse', () => {
    expect(FloodDomainKitSchema.parse(MINIERA_FLOOD_KIT)).toBeTruthy();
    expect(FloodDomainKitSchema.parse(MARE_FLOOD_KIT)).toBeTruthy();
  });

  it('the localized narrated race kit parses its {en,it} wrapper', () => {
    expect(LocalizedRaceDomainKitSchema.parse(MINIERA_RACE_KIT)).toBeTruthy();
    // and each locale is a valid flat kit on its own
    expect(RaceDomainKitSchema.parse(MINIERA_RACE_KIT.en)).toBeTruthy();
    expect(RaceDomainKitSchema.parse(MINIERA_RACE_KIT.it)).toBeTruthy();
  });

  it('shipped tuning defaults parse', () => {
    expect(RaceTuningSchema.parse(RACE_DEFAULT_TUNING)).toBeTruthy();
    expect(FloodTuningSchema.parse(FLOOD_DEFAULT_TUNING)).toBeTruthy();
  });
});

describe('kitSchemas — boundary rejections', () => {
  it('rejects a kit with a missing copy node (exhaustive contract)', () => {
    const broken = {
      ...PASSO_MONTANO_KIT,
      copy: Object.fromEntries(
        Object.entries(PASSO_MONTANO_KIT.copy).filter(([k]) => k !== 'fine'),
      ),
    };
    expect(RaceDomainKitSchema.safeParse(broken).success).toBe(false);
  });

  it('rejects a kit with an unknown copy node', () => {
    const broken = {
      ...PASSO_MONTANO_KIT,
      copy: {
        ...PASSO_MONTANO_KIT.copy,
        inventato: { title: 'x', body: 'y' },
      },
    };
    expect(RaceDomainKitSchema.safeParse(broken).success).toBe(false);
  });

  it('rejects a copy leaf with an unknown field (strict)', () => {
    const broken = {
      ...PASSO_MONTANO_KIT,
      copy: {
        ...PASSO_MONTANO_KIT.copy,
        fine: { ...PASSO_MONTANO_KIT.copy.fine, evil: true },
      },
    };
    expect(RaceDomainKitSchema.safeParse(broken).success).toBe(false);
  });

  it('rejects malformed copy BEFORE generate is called', () => {
    const malformed = { ...PASSO_MONTANO_KIT, title: 42 };
    expect(() => parseRaceDomainKit(malformed)).toThrow();
  });

  it('rejects fractional tuning (integer percents only, audit L-04)', () => {
    expect(
      RaceTuningSchema.safeParse({ goal: 6, twistChance: 50.5, twistRearmChance: 60 }).success,
    ).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* gimmickRegistry (T-5)                                               */
/* ------------------------------------------------------------------ */

describe('gimmickRegistry', () => {
  it('has exactly the two capped rows', () => {
    expect(GIMMICK_REGISTRY.map((r) => r.gimmickId).sort()).toEqual(['flood-vault', 'race']);
  });

  it('generate is the identity reference to the canonical generator', () => {
    expect(gimmickRow('race')?.generate).toBe(generateRaceScenario);
    expect(gimmickRow('flood-vault')?.generate).toBe(generateFloodVault);
  });

  it('v1 rows ship with no declared opt-outs', () => {
    for (const row of GIMMICK_REGISTRY) expect(row.declaredOptOuts).toEqual([]);
  });

  it('rows produce valid scenarios via the kit they ship', () => {
    const race = gimmickRow('race');
    const flood = gimmickRow('flood-vault');
    expect(race).toBeDefined();
    expect(flood).toBeDefined();
    const raceScenario = race!.generate(race!.kitSchema.parse(PASSO_MONTANO_KIT));
    const floodScenario = flood!.generate(flood!.kitSchema.parse(MINIERA_FLOOD_KIT));
    // the generator self-parses; re-parse to prove the emitted value is schema-clean
    expect(() => parseQuestScenario(raceScenario)).not.toThrow();
    expect(() => parseQuestScenario(floodScenario)).not.toThrow();
  });

  it('unknown gimmick id returns undefined (never a fallback row)', () => {
    expect(gimmickRow('meld' as never)).toBeUndefined();
  });
});
