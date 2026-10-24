/**
 * gimmickRegistry — the two-row registry of generatable gimmicks
 * (PLAN-029 SP-1 T-5; contract: context/QUEST_GEN_LAB_CONTRACTS.md §10).
 *
 * Invariants:
 * - `generate` is the identity reference to the canonical generator —
 *   no wrapper, no dispatch layer.
 * - Row `generate` params are typed via the schema-inferred kit/tuning
 *   types (`z.infer` from kitSchemas.ts): an interface drift breaks
 *   compilation here AND in the kitSchemas compat checks — the
 *   compile-time seam alarm. The generator's own param types remain
 *   the runtime contract.
 * - `declaredOptOuts` names ONLY ids from `DIAGNOSTIC_GATE_IDS` —
 *   hard gates (schema parse, graph integrity) are absent from that
 *   union by construction, so a row cannot suppress a hard gate.
 *   An opt-out means the gate reports NOT_RUN / NOT_APPLICABLE,
 *   never a suppressed PASS. v1 rows ship with `[]` — no diagnostic
 *   has evidence of genuine inapplicability yet (contract doc §6).
 * - `domains` lists the DomainVocab ids the row's kits can dress
 *   (audit §8 provenance surface).
 */

import type { QuestScenario } from '../questScenario.schema';
import type { DiagnosticGateId } from './diagnosticGates';
import { generateRaceScenario } from './raceGimmick';
import { generateFloodVault } from './floodVault';
import {
  FloodDomainKitSchema,
  FloodTuningPartialSchema,
  RaceDomainKitSchema,
  RaceTuningPartialSchema,
  type FloodDomainKitAuthored,
  type FloodTuningPartialAuthored,
  type RaceDomainKitAuthored,
  type RaceTuningPartialAuthored,
} from './kitSchemas';

interface GimmickRowBase {
  /** DomainVocab ids this gimmick's kits can dress. */
  readonly domains: readonly string[];
  /** Diagnostics the row declares inapplicable — v1 ships empty. */
  readonly declaredOptOuts: readonly DiagnosticGateId[];
}

/** The race gimmick row — gara di avanzamento su `vars` you/rival. */
export interface RaceGimmickRow extends GimmickRowBase {
  readonly gimmickId: 'race';
  readonly generate: (
    kit: RaceDomainKitAuthored,
    tuning?: RaceTuningPartialAuthored,
  ) => QuestScenario;
  readonly kitSchema: typeof RaceDomainKitSchema;
  readonly tuningSchema: typeof RaceTuningPartialSchema;
}

/** The flood gimmick row — la volta che allaga, loot-vs-escape. */
export interface FloodGimmickRow extends GimmickRowBase {
  readonly gimmickId: 'flood-vault';
  readonly generate: (
    kit: FloodDomainKitAuthored,
    tuning?: FloodTuningPartialAuthored,
  ) => QuestScenario;
  readonly kitSchema: typeof FloodDomainKitSchema;
  readonly tuningSchema: typeof FloodTuningPartialSchema;
}

/** A registry row — discriminated union on `gimmickId`. */
export type GimmickRow = RaceGimmickRow | FloodGimmickRow;

/** Ids the registry can generate — the only generatable gimmicks in v1. */
export type GimmickId = GimmickRow['gimmickId'];

/** The two canonical rows — capped at 2, no plugin architecture. */
export const GIMMICK_REGISTRY: readonly GimmickRow[] = [
  {
    gimmickId: 'race',
    generate: generateRaceScenario,
    kitSchema: RaceDomainKitSchema,
    tuningSchema: RaceTuningPartialSchema,
    domains: ['passo-montano', 'palude', 'miniera'],
    declaredOptOuts: [],
  },
  {
    gimmickId: 'flood-vault',
    generate: generateFloodVault,
    kitSchema: FloodDomainKitSchema,
    tuningSchema: FloodTuningPartialSchema,
    domains: ['miniera', 'mare'],
    declaredOptOuts: [],
  },
] as const;

/**
 * Look up a gimmick row by id.
 * @param id candidate gimmick id (picker input).
 * @returns the row, or undefined for unknown ids.
 */
export function gimmickRow(id: GimmickId): GimmickRow | undefined {
  return GIMMICK_REGISTRY.find((row) => row.gimmickId === id);
}
