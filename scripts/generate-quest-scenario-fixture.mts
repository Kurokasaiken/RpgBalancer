/**
 * generate-quest-scenario-fixture — PLAN-019-S2.1 (critica r2), R-135 re-baseline.
 *
 * Regenerates the FROZEN parity oracle under
 * `tests/fixtures/idleVillage/quests/{id}.oracle.json`:
 *   1. `authored` — the scenario authored objects taken from the CANONICAL
 *      config modules `src/balancing/config/idleVillage/quests/scenarios/*.ts`
 *      (`*_SCENARIO_AUTHORED` literals). R-135 history: the original oracle
 *      was extracted from `git show HEAD:` of the deleted lab modules; with
 *      the English re-baseline the canonical authored config IS the source —
 *      the oracle is a committed snapshot of it. `offer` is excluded (S2.1
 *      contract: not part of parity) and the additive planning fields
 *      `previewHint`/`revealHint`/`hidden` are stripped per node, mirroring
 *      the test's own comparison window.
 *   2. `traces` — Monte Carlo digests (N declared, fixed seed base) computed
 *      by driving the CANONICAL engine (`questRun.ts`) on the live parsed
 *      scenario in `QUESTS`, through the shared seeded uniform policy
 *      (`playRun`/`signatureOf` from `tests/unit/idleVillage/questScenarioExplorer.ts`).
 *
 * Usage: `npx tsx --tsconfig tsconfig.app.json scripts/generate-quest-scenario-fixture.mts`
 * Re-run only when intentionally re-baselining; the test suite treats the
 * committed output as the oracle.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const REPO = new URL('..', import.meta.url).pathname;
const SCEN_DIR = 'src/balancing/config/idleVillage/quests/scenarios';
const OUT_DIR = join(REPO, 'tests/fixtures/idleVillage/quests');
const TRACE_RUNS = 1000; // critica r2: N declared, fixed
const TRACE_SEED_BASE = 1;

/** Per-node fields stripped from the parity window (S3 additive planning data). */
const STRIPPED_NODE_FIELDS = new Set(['previewHint', 'revealHint', 'hidden']);

interface Spec {
  questId: 'goblin' | 'rovine';
  /** Module under `scenarios/` exporting `<NAME>_SCENARIO_AUTHORED`. */
  modulePath: string;
  authoredExport: string;
  /** Lab presets module export used as `livePresets` in the test. */
  presetsExport: string;
  /** The preset id the trace digests are driven with. */
  presetId: string;
}

const SPECS: Spec[] = [
  {
    questId: 'goblin',
    modulePath: `${SCEN_DIR}/goblin`,
    authoredExport: 'GOBLIN_SCENARIO_AUTHORED',
    presetsExport: 'GOBLIN_PRESETS',
    presetId: 'gob-band',
  },
  {
    questId: 'rovine',
    modulePath: `${SCEN_DIR}/rovine`,
    authoredExport: 'ROVINE_SCENARIO_AUTHORED',
    presetsExport: 'ROVINE_PRESETS',
    presetId: 'rv-eroe',
  },
];

interface AuthoredLiteral {
  title: string;
  flavour?: string;
  startNode: string;
  primaryStats: string[];
  beats?: readonly string[];
  intelLabels?: Record<string, string>;
  nodes: Record<string, Record<string, unknown>>;
}

function stripPlanningFields(nodes: AuthoredLiteral['nodes']): AuthoredLiteral['nodes'] {
  return Object.fromEntries(
    Object.entries(nodes).map(([id, n]) => [
      id,
      Object.fromEntries(Object.entries(n).filter(([k]) => !STRIPPED_NODE_FIELDS.has(k))),
    ]),
  );
}

async function main(): Promise<void> {
  const { playRun, signatureOf, fnv1aHex } = await import(
    '../tests/unit/idleVillage/questScenarioExplorer'
  );
  const presetsMod = (await import('../src/ui/idleVillage/questS1Lab/questLabPresets')) as Record<
    string,
    unknown
  >;

  mkdirSync(OUT_DIR, { recursive: true });

  for (const spec of SPECS) {
    const mod = (await import(`../${spec.modulePath}`)) as Record<string, unknown>;
    const authored = mod[spec.authoredExport] as AuthoredLiteral;
    const presets = presetsMod[spec.presetsExport];

    const authoredSnapshot = {
      nodes: stripPlanningFields(authored.nodes),
      startNode: authored.startNode,
      primaryStats: authored.primaryStats,
      presets,
      meta: { title: authored.title, flavour: authored.flavour },
      ...(authored.beats ? { beats: authored.beats } : {}),
      ...(authored.intelLabels ? { intelLabels: authored.intelLabels } : {}),
    };

    const perSeed: string[] = [];
    for (let i = 0; i < TRACE_RUNS; i += 1) {
      const seed = TRACE_SEED_BASE + i;
      const { state } = playRun(spec.questId, spec.presetId, seed);
      if (!state.ended) throw new Error(`${spec.questId} seed ${seed} did not terminate`);
      perSeed.push(fnv1aHex(signatureOf(state)));
    }

    const payload = {
      generatedBy: 'scripts/generate-quest-scenario-fixture.mts',
      source: `${spec.modulePath}.ts (${spec.authoredExport}, R-135 English re-baseline)`,
      authored: authoredSnapshot,
      traces: {
        runs: TRACE_RUNS,
        seedBase: TRACE_SEED_BASE,
        digest: fnv1aHex(perSeed.join('')),
        perSeed,
      },
    };
    const out = join(OUT_DIR, `${spec.questId}.oracle.json`);
    writeFileSync(out, JSON.stringify(payload, null, 2) + '\n');
    console.log(`${spec.questId}: oracle written → ${out} (${TRACE_RUNS} seeds, digest ${payload.traces.digest})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
