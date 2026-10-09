/**
 * generate-quest-scenario-fixture — PLAN-019-S2.1 (critica r2).
 *
 * Regenerates the FROZEN parity oracle under
 * `tests/fixtures/idleVillage/quests/{id}.oracle.json`:
 *   1. `authored` — the pre-migration scenario objects, extracted from
 *      `git show HEAD:src/ui/idleVillage/questS1Lab/questScenario{Goblin,Rovine}.ts`
 *      (the live lab modules were deleted by the S2.1 migration — the oracle
 *      cannot be a live file, and HEAD is the last commit that still holds
 *      the originals).
 *   2. `traces` — Monte Carlo digests (N declared, fixed seed base) computed
 *      by driving the CANONICAL engine (`questRun.ts`) with the ORIGINAL
 *      definitions injected into `QUESTS`, through the shared seeded
 *      uniform policy (`playRun`/`signatureOf` from
 *      `tests/unit/idleVillage/questScenarioExplorer.ts`).
 *
 * Usage: `npx tsx --tsconfig tsconfig.app.json scripts/generate-quest-scenario-fixture.mts`
 * Re-run only when intentionally re-baselining; the test suite treats the
 * committed output as the oracle.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO = new URL('..', import.meta.url).pathname;
const LAB = 'src/ui/idleVillage/questS1Lab';
const OUT_DIR = join(REPO, 'tests/fixtures/idleVillage/quests');
const TRACE_RUNS = 1000; // critica r2: N declared, fixed
const TRACE_SEED_BASE = 1;

interface OriginalModule {
  nodes: Record<string, unknown>;
  startNode: string;
  primaryStats: string[];
  presets: unknown[];
  meta?: Record<string, unknown>;
  beats?: readonly string[];
  intelLabels?: Record<string, string>;
}

interface Spec {
  questId: 'goblin' | 'rovine';
  headPath: string;
  exports: {
    nodes: string;
    startNode: string;
    primaryStats: string;
    presets: string;
    meta?: string;
    beats?: string;
    intelLabels?: string;
  };
}

const SPECS: Spec[] = [
  {
    questId: 'goblin',
    headPath: `${LAB}/questScenarioGoblin.ts`,
    exports: {
      nodes: 'GOBLIN_NODES',
      startNode: 'GOBLIN_START_NODE',
      primaryStats: 'GOBLIN_PRIMARY_STATS',
      presets: 'GOBLIN_PRESETS',
      meta: 'GOBLIN_META',
      beats: 'GOBLIN_BEATS',
    },
  },
  {
    questId: 'rovine',
    headPath: `${LAB}/questScenarioRovine.ts`,
    exports: {
      nodes: 'ROVINE_NODES',
      startNode: 'ROVINE_START_NODE',
      primaryStats: 'ROVINE_PRIMARY_STATS',
      presets: 'ROVINE_PRESETS',
      beats: 'ROVINE_BEATS',
      intelLabels: 'ROVINE_INTEL_LABELS',
    },
  },
];

/** Extracts a module's HEAD content into a temp file and imports it
 *  (the lab modules only have `import type` — erased, never resolved). */
async function loadOriginal(spec: Spec): Promise<OriginalModule> {
  const src = execFileSync('git', ['-C', REPO, 'show', `HEAD:${spec.headPath}`], {
    encoding: 'utf8',
  });
  const dir = mkdtempSync(join(tmpdir(), 'questS21-orig-'));
  const file = join(dir, `${spec.questId}.ts`);
  writeFileSync(file, src);
  const mod = (await import(pathToFileURL(file).href)) as Record<string, unknown>;
  return {
    nodes: mod[spec.exports.nodes] as OriginalModule['nodes'],
    startNode: mod[spec.exports.startNode] as string,
    primaryStats: mod[spec.exports.primaryStats] as string[],
    presets: mod[spec.exports.presets] as unknown[],
    meta: spec.exports.meta ? (mod[spec.exports.meta] as Record<string, unknown>) : undefined,
    beats: spec.exports.beats ? (mod[spec.exports.beats] as readonly string[]) : undefined,
    intelLabels: spec.exports.intelLabels
      ? (mod[spec.exports.intelLabels] as Record<string, string>)
      : undefined,
  };
}

async function main(): Promise<void> {
  const { QUESTS } = await import('../src/ui/idleVillage/questS1Lab/questRun');
  const { playRun, signatureOf, fnv1aHex } = await import(
    '../tests/unit/idleVillage/questScenarioExplorer'
  );

  mkdirSync(OUT_DIR, { recursive: true });

  for (const spec of SPECS) {
    const orig = await loadOriginal(spec);
    const authored = {
      nodes: orig.nodes,
      startNode: orig.startNode,
      primaryStats: orig.primaryStats,
      presets: orig.presets,
      ...(orig.meta ? { meta: orig.meta } : {}),
      ...(orig.beats ? { beats: orig.beats } : {}),
      ...(orig.intelLabels ? { intelLabels: orig.intelLabels } : {}),
    };

    // Trace digests on the ORIGINAL definition, injected into the registry.
    const saved = QUESTS[spec.questId];
    QUESTS[spec.questId] = {
      nodes: orig.nodes as never,
      presets: orig.presets as never,
      primaryStats: orig.primaryStats as never,
      startNode: orig.startNode,
    };
    const perSeed: string[] = [];
    try {
      for (let i = 0; i < TRACE_RUNS; i += 1) {
        const seed = TRACE_SEED_BASE + i;
        const { state } = playRun(spec.questId, (orig.presets as { id: string }[])[0].id, seed);
        perSeed.push(fnv1aHex(signatureOf(state)));
      }
    } finally {
      QUESTS[spec.questId] = saved;
    }

    const payload = {
      generatedBy: 'scripts/generate-quest-scenario-fixture.mts',
      source: `git HEAD:${spec.headPath}`,
      authored,
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
