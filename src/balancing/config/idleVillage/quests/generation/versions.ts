/**
 * versions — version-field constants for lab receipts (PLAN-029 SP-1
 * T-7 resolution; contract doc §11).
 *
 * SP-1's audit found no reliable existing owners for the three version
 * fields — this module IS the owning module, co-located with the
 * generation surface it versions. Update rules (recorded in the audit):
 * - SCHEMA_VERSION: bump when QuestScenarioSchema shape changes.
 * - ENGINE_VERSION: bump when run-engine semantics change
 *   (createRun/applyChoice/previewOption/verdictTable execution).
 * - generatorVersion: owned per-gimmick on the registry row (see
 *   gimmickRegistry.ts) — bump when the generator or its merge
 *   semantics change.
 */

/** Scenario-schema contract version — bump on schema shape change. */
export const SCHEMA_VERSION = 'qschema-v1';

/** Run-engine semantics version — bump on engine behavior change. */
export const ENGINE_VERSION = 'qengine-v1';
