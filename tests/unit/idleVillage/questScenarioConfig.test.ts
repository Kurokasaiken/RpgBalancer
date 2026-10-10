/**
 * PLAN-019-S2.1 T-4 — scenario verification suite.
 *
 * Oracle = the FROZEN FIXTURES committed under
 * `tests/fixtures/idleVillage/quests/`:
 *  - `{id}.oracle.json` — authored objects + 1000 seeded trace digests,
 *    extracted from `git show HEAD:` of the deleted lab modules by
 *    `scripts/generate-quest-scenario-fixture.mts` (re-run only on an
 *    intentional re-baseline; never reads the live config).
 *  - `{id}.{coverage,checks}.json` — regression pins regenerated with
 *    `UPDATE_QUEST_FIXTURES=1`.
 *
 * Levels:
 *  (a) PARITY — the migrated parse `toStrictEqual`s the pre-migration
 *      authored graph/meta/presets (offer is new content, excluded), and
 *      1000 seeded MC runs on the current config reproduce the frozen
 *      per-seed digests exactly.
 *  (b) REGISTRY WIRING — `QUESTS` consumes the parsed config.
 *  (c) WITNESS REPLAY — `exploreScenario` must realize every authored
 *      (node, option) via the REAL engine; each witness replays
 *      deterministically; statically-declared edges ⊆ dynamic coverage.
 *  (d) ANALYZE-CHECK PARITY — `analyzeCheck` closed-form forecasts pinned.
 *  (e) DANGER-BAND CALIBRATION — `offer.dangerBandRef` consistent with a
 *      seeded `simulateQuest` of `offer.referenceParty` under the declared
 *      reference strategy (fixed seed, declared N, ±1 grade, ε-borderline
 *      never fails). Band table = the CANONICAL `DANGER_BANDS` of
 *      `questPois.ts` (S2.3 took ownership).
 *  (f) STAT-MATCHING PARSABILITY — every slot `requirement` is evaluable.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createRun,
  QUESTS,
  TUNE,
  type QuestId,
  type QuestRunState,
} from '@/ui/idleVillage/questS1Lab/questRun';
import { analyzeCheck, defaultStrategy, simulateQuest } from '@/ui/idleVillage/questS1Lab/questSimulation';
import { GOBLIN_PRESETS, ROVINE_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { ROVINE_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/rovine';
import { DANGER_BANDS } from '@/balancing/config/idleVillage/quests/questPois';
import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import { evaluateStatRequirement } from '@/engine/game/idleVillage/statMatching';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import {
  declaredReachable,
  exploreScenario,
  fnv1aHex,
  playRun,
  replayTrace,
  signatureOf,
} from './questScenarioExplorer';

/* ------------------------------------------------------------------ */
/* Fixtures (regression pins — not the parity oracle)                  */
/* ------------------------------------------------------------------ */

// vitest always runs from the repository root (package.json test script).
const FIXTURE_DIR = join(process.cwd(), 'tests/fixtures/idleVillage/quests');
const UPDATE = process.env.UPDATE_QUEST_FIXTURES === '1';

function fixturePath(questId: string, kind: string): string {
  return join(FIXTURE_DIR, `${questId}.${kind}.json`);
}
function readFixture<T>(questId: string, kind: string): T | null {
  const p = fixturePath(questId, kind);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8')) as T;
}
function writeFixture(questId: string, kind: string, data: unknown): void {
  const p = fixturePath(questId, kind);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}

interface ScenarioUnderTest {
  id: QuestId;
  parsed: QuestScenario;
  presetId: string;
  livePresets: unknown;
  /** Calibration strategy for the danger band — declared, deterministic. */
  referenceStrategy: Record<string, string>;
}

interface OracleFixture {
  source: string;
  authored: {
    nodes: Record<string, unknown>;
    startNode: string;
    primaryStats: string[];
    presets: unknown;
    meta?: Record<string, unknown>;
    beats?: readonly string[];
    intelLabels?: Record<string, string>;
  };
  traces: { runs: number; seedBase: number; digest: string; perSeed: string[] };
}

function readOracle(questId: string): OracleFixture {
  const oracle = readFixture<OracleFixture>(questId, 'oracle');
  expect(
    oracle,
    `oracolo ${questId}.oracle.json mancante — rigenera con \`npx tsx --tsconfig tsconfig.app.json scripts/generate-quest-scenario-fixture.mts\``,
  ).not.toBeNull();
  return oracle!;
}

const SCENARIOS: ScenarioUnderTest[] = [
  {
    id: 'goblin',
    parsed: GOBLIN_SCENARIO,
    presetId: GOBLIN_PRESETS[0].id,
    livePresets: GOBLIN_PRESETS,
    // The quest-completing line: pursue the fleeing goblins, stop looting.
    referenceStrategy: { 'gob-incalzare': 'gob-insegui', 'gob-esplora-extra': 'gob-fermati' },
  },
  {
    id: 'rovine',
    parsed: ROVINE_SCENARIO,
    presetId: ROVINE_PRESETS[0].id,
    livePresets: ROVINE_PRESETS,
    // The mockup line: observe, sneak, take the treasure, go home.
    referenceStrategy: {},
  },
];

/* ------------------------------------------------------------------ */
/* (a) Parity vs the frozen pre-migration oracle                        */
/* ------------------------------------------------------------------ */

describe('parity vs frozen oracle (git-HEAD authored)', () => {
  for (const s of SCENARIOS) {
    it(`${s.id}: migrated graph/meta is 1:1 with the pre-migration authored object`, () => {
      const oracle = readOracle(s.id);
      // `offer` is new authored content (S2.1 contract) — not part of parity.
      // `previewHint`/`revealHint` (S3 T-1) and `hidden` (S3, Director
      // 2026-10-10 event marker) are additive planning/presentation data —
      // same class: stripped before the frozen-oracle comparison.
      const stripPlanningHints = (nodes: Record<string, Record<string, unknown>>) =>
        Object.fromEntries(
          Object.entries(nodes).map(([id, n]) => {
            const { previewHint: _p, revealHint: _r, hidden: _h, ...rest } = n;
            return [id, rest];
          }),
        );
      /* Director copy pass 2026-10-10 (S3): the oracle stays frozen on the
       * pre-migration original; these overrides re-baseline only the authored
       * strings that were deliberately renamed («Un nascondiglio»→«Tesoro
       * nascosto», «L'accampamento goblin»→«Assalto», «I goblin
       * fuggono»→«Incalzare» + the stash trade-off copy). Everything else —
       * graph, stats, risk, effects — is still compared strictly. */
      const copyOverrides: Record<string, Record<string, unknown>> =
        s.id === 'goblin'
          ? {
              'gob-bottino-scelta': {
                title: 'Tesoro nascosto',
                body: 'Sotto il masso, un bottino avvolto in stracci. Prenderlo in silenzio costa mano ferma — un suono e il campo si sveglia.',
              },
              'gob-accampamento': { title: 'Assalto' },
              'gob-incalzare': { title: 'Incalzare' },
            }
          : {};
      const optionDetailOverrides: Record<string, Record<string, string>> =
        s.id === 'goblin'
          ? {
              'gob-bottino-scelta': {
                'gob-prendi': 'Destrezza. Se la mano tradisce, il campo si sveglia.',
                'gob-lascia-bottino': 'Un campo che dorme vale più di un bottino: passate oltre.',
              },
            }
          : {};
      const expected = {
        nodes: Object.fromEntries(
          Object.entries(oracle.authored.nodes).map(([id, n]) => [
            id,
            {
              ...(n as Record<string, unknown>),
              ...copyOverrides[id],
              ...('options' in (n as Record<string, unknown>)
                ? {
                    options: ((n as { options?: Record<string, unknown>[] }).options ?? []).map((o) => ({
                      ...o,
                      detail: optionDetailOverrides[id]?.[String(o.id)] ?? o.detail,
                    })),
                  }
                : {}),
            },
          ]),
        ),
        beats: (oracle.authored.beats ?? []).map((b) => ({ Bottino: 'Tesoro', Accampamento: 'Assalto' })[b] ?? b),
      };
      expect(stripPlanningHints(s.parsed.nodes)).toStrictEqual(expected.nodes);
      expect(s.parsed.startNode).toBe(oracle.authored.startNode);
      expect([...s.parsed.primaryStats]).toStrictEqual(oracle.authored.primaryStats);
      if (oracle.authored.beats) {
        expect(s.parsed.beats).toStrictEqual(expected.beats);
      }
      if (oracle.authored.meta) {
        expect(s.parsed.title).toBe(oracle.authored.meta['title']);
        expect(s.parsed.flavour).toBe(oracle.authored.meta['flavour']);
      }
      if (oracle.authored.intelLabels) {
        expect(s.parsed.intelLabels).toStrictEqual(oracle.authored.intelLabels);
      }
      expect(s.livePresets).toStrictEqual(oracle.authored.presets);
    });

    it(`${s.id}: option ordering preserved in every node`, () => {
      const oracle = readOracle(s.id);
      for (const [id, node] of Object.entries(oracle.authored.nodes)) {
        const before = ((node as { options?: { id: string }[] }).options ?? []).map((o) => o.id);
        const after = (s.parsed.nodes[id]?.options ?? []).map((o) => o.id);
        expect(after, `node ${id}`).toStrictEqual(before);
      }
    });

    it(
      `${s.id}: 1000 seeded MC runs reproduce the frozen digests`,
      () => {
        const oracle = readOracle(s.id);
        const perSeed: string[] = [];
        for (let i = 0; i < oracle.traces.runs; i += 1) {
          const seed = oracle.traces.seedBase + i;
          const { state } = playRun(s.id, s.presetId, seed);
          expect(state.ended, `seed ${seed} non terminato`).toBe(true);
          perSeed.push(fnv1aHex(signatureOf(state)));
        }
        expect(perSeed).toStrictEqual(oracle.traces.perSeed);
        expect(fnv1aHex(perSeed.join(''))).toBe(oracle.traces.digest);
      },
      120_000,
    );
  }
});

/* ------------------------------------------------------------------ */
/* (b) Registry wiring                                                  */
/* ------------------------------------------------------------------ */

describe('QUESTS registry — single source of truth', () => {
  it('goblin/rovine QUESTS entries ARE the parsed config (same object)', () => {
    expect(QUESTS.goblin.nodes).toBe(GOBLIN_SCENARIO.nodes);
    expect(QUESTS.rovine.nodes).toBe(ROVINE_SCENARIO.nodes);
    expect(QUESTS.goblin.startNode).toBe(GOBLIN_SCENARIO.startNode);
    expect(QUESTS.rovine.startNode).toBe(ROVINE_SCENARIO.startNode);
    expect([...QUESTS.goblin.primaryStats]).toStrictEqual(GOBLIN_SCENARIO.primaryStats);
    expect([...QUESTS.rovine.primaryStats]).toStrictEqual(ROVINE_SCENARIO.primaryStats);
  });
});

/* ------------------------------------------------------------------ */
/* (c) Guaranteed coverage — engine enumeration + witness replay        */
/* ------------------------------------------------------------------ */

interface CoverageFixture {
  covered: string[];
  nodes: string[];
  witnessSignatures: Record<string, string>;
}

describe('guaranteed coverage (engine enumeration + witness replay)', () => {
  for (const s of SCENARIOS) {
    it(
      `${s.id}: every authored node and option is realized; witnesses replay deterministically`,
      { timeout: 600_000 },
      () => {
        const exploration = exploreScenario(s.id, s.presetId, s.parsed);
        expect(exploration.truncated, 'esplorazione troncata: grafo troppo grande').toBe(false);

        const allElements: string[] = [];
        const allNodes = Object.keys(s.parsed.nodes);
        for (const [id, node] of Object.entries(s.parsed.nodes)) {
          // info/harm nodes are timed beats (frontier 'pending' — matured by
          // the clock, never a player command); 'advance' is the lab-legacy
          // synthetic and is never offered by availableOptions. Combat is the
          // only kind with a synthetic player command.
          if (node.kind === 'combat') allElements.push(`${id}/fight-turn`);
          for (const o of node.options ?? []) allElements.push(`${id}/${o.id}`);
        }

        // (1) Enumeration must realize every authored node and option.
        for (const el of allElements) {
          expect(exploration.covered.has(el), `elemento '${el}' non raggiungibile da nessuna policy`).toBe(true);
        }
        for (const id of allNodes) {
          expect(exploration.visitedNodes.has(id), `nodo '${id}' mai raggiunto in nessun cammino`).toBe(true);
        }

        // (2) Static declared enumeration ⊆ dynamic coverage (declared edges
        //     never promise an element the engine cannot reach).
        const declared = declaredReachable(s.parsed);
        for (const el of declared.options) {
          expect(exploration.covered.has(el), `elemento '${el}' dichiarato ma non realizzato`).toBe(true);
        }

        // (3) Targeted traces: replay each witness on a fresh run and compare
        //     the final signature vs the pinned fixture.
        const witnessSignatures: Record<string, string> = {};
        for (const el of allElements) {
          const witness = exploration.witnesses.get(el);
          expect(witness, `nessun testimone per '${el}'`).toBeDefined();
          const replay = replayTrace(s.id, s.presetId, witness!);
          expect(replay.applied.length, `testimone di '${el}' diverge dal percorso`).toBe(witness!.length);
          witnessSignatures[el] = fnv1aHex(replay.signature);
        }

        const payload: CoverageFixture = {
          covered: [...exploration.covered].sort(),
          nodes: allNodes.sort(),
          witnessSignatures,
        };
        if (UPDATE) writeFixture(s.id, 'coverage', payload);
        const fixture = readFixture<CoverageFixture>(s.id, 'coverage');
        expect(fixture, `fixture ${s.id}.coverage.json mancante — UPDATE_QUEST_FIXTURES=1`).not.toBeNull();
        expect(payload).toStrictEqual(fixture);
      },
      120_000,
    );
  }
});

/* ------------------------------------------------------------------ */
/* (d) Exact per-check analysis vs fixture                              */
/* ------------------------------------------------------------------ */

interface ChecksFixture {
  presetId: string;
  seed: number;
  analyses: Record<string, unknown>;
}

function canonicalCheckState(questId: QuestId, presetId: string): QuestRunState {
  return createRun(presetId, 777, questId);
}

describe('exact per-check analysis vs fixture (analyzeCheck)', () => {
  for (const s of SCENARIOS) {
    it(`${s.id}: closed-form check forecasts pinned to fixture`, () => {
      const analyses: Record<string, unknown> = {};
      for (const [id, node] of Object.entries(s.parsed.nodes)) {
        if (node.kind !== 'check') continue;
        const state = canonicalCheckState(s.id, s.presetId);
        state.nodeId = id;
        const a = analyzeCheck(state, node, { useConsumable: false });
        analyses[id] = {
          baseScore: a.baseScore,
          bonus: a.bonus,
          successBound: a.successBound,
          successPct: a.successPct,
          verdicts: a.verdicts,
          noHarmPct: a.noHarmPct,
          anyWoundPct: a.anyWoundPct,
          anyDeathPct: a.anyDeathPct,
          leaderWoundPct: a.leaderWoundPct,
          leaderDeathPct: a.leaderDeathPct,
          toll: a.toll ?? null,
          perMember: a.perMember.map((m) => ({
            id: m.id, healthyPct: m.healthyPct, woundPct: m.woundPct, deathPct: m.deathPct,
          })),
        };
      }
      const payload: ChecksFixture = { presetId: s.presetId, seed: 777, analyses };
      if (UPDATE) writeFixture(s.id, 'checks', payload);
      const fixture = readFixture<ChecksFixture>(s.id, 'checks');
      expect(fixture, `fixture ${s.id}.checks.json mancante — UPDATE_QUEST_FIXTURES=1`).not.toBeNull();
      expect(payload).toStrictEqual(fixture);
    });
  }
});

/* ------------------------------------------------------------------ */
/* (e) dangerBandRef calibration                                        */
/* ------------------------------------------------------------------ */

/**
 * Danger-band calibration support — the band TABLE is canonical in
 * `questPois.ts` (S2.3); this suite only proves the declared `dangerBandRef`
 * is consistent with a simulation of `offer.referenceParty`. Metric:
 * `anyDeathPct` of the reference run — P(≥1 member dies), the player-visible
 * meaning of "danger". ε = 2pp: a metric within ε of a boundary is
 * «borderline» and never fails the assertion.
 */
const BAND_EPSILON_PP = 2;
const BAND_SIM_RUNS = 2000;
const BAND_SIM_SEED = 777;

function deriveDangerBand(anyDeathPct: number): { band: string; borderline: boolean } {
  const idx = DANGER_BANDS.findIndex((b) => b.maxAnyDeathPct === null || anyDeathPct < b.maxAnyDeathPct);
  const band = DANGER_BANDS[Math.max(0, idx)];
  const prevMax = idx > 0 ? (DANGER_BANDS[idx - 1].maxAnyDeathPct ?? Infinity) : -Infinity;
  const thisMax = band.maxAnyDeathPct ?? Infinity;
  const borderline =
    Math.abs(anyDeathPct - thisMax) <= BAND_EPSILON_PP ||
    Math.abs(anyDeathPct - prevMax) <= BAND_EPSILON_PP;
  return { band: band.id, borderline };
}

describe('offer coherence — dangerBandRef vs referenceParty simulation', () => {
  for (const s of SCENARIOS) {
    it(
      `${s.id}: declared band within ±1 grade of the simulated one (N=${BAND_SIM_RUNS}, seed=${BAND_SIM_SEED})`,
      () => {
        const ref = s.parsed.offer.referenceParty!;
        const run = createRun(s.presetId, BAND_SIM_SEED, s.id);
        run.party = ref.map((m) => ({
          ...m,
          name: m.name ?? m.id,
          hp: m.hp ?? TUNE.hp,
          maxHp: m.hp ?? TUNE.hp,
          wounded: false,
          dead: false,
        }));
        const strategy = { ...defaultStrategy(run), ...s.referenceStrategy };
        const sim = simulateQuest(run, strategy, { runs: BAND_SIM_RUNS, seed: BAND_SIM_SEED });
        const { band, borderline } = deriveDangerBand(sim.anyDeathPct);
        const declaredIdx = DANGER_BANDS.findIndex((b) => b.id === s.parsed.offer.dangerBandRef);
        const derivedIdx = DANGER_BANDS.findIndex((b) => b.id === band);
        expect(declaredIdx, `dangerBandRef '${s.parsed.offer.dangerBandRef}' ignoto`).toBeGreaterThanOrEqual(0);
        const gradeDelta = Math.abs(declaredIdx - derivedIdx);
        expect(
          gradeDelta <= 1 || borderline,
          `${s.id}: banda dichiarata '${s.parsed.offer.dangerBandRef}' vs derivata '${band}' ` +
            `(anyDeathPct=${sim.anyDeathPct.toFixed(1)}, reward=${sim.outcomePct.reward.toFixed(1)}%)`,
        ).toBe(true);
      },
      180_000,
    );
  }
});

/* ------------------------------------------------------------------ */
/* (f) statMatching parsability                                         */
/* ------------------------------------------------------------------ */

describe('offer slots — statMatching parsability', () => {
  it('every slot requirement is evaluable by evaluateStatRequirement', () => {
    const emptyResident = { statTags: [] } as unknown as ResidentState;
    for (const s of SCENARIOS) {
      for (const slot of [...s.parsed.offer.slots.required, ...s.parsed.offer.slots.optional]) {
        if (!slot.requirement) continue;
        expect(() => evaluateStatRequirement(emptyResident, slot.requirement)).not.toThrow();
      }
    }
  });
});
