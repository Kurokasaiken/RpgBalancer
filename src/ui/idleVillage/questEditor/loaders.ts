/**
 * questEditor/loaders — scenario ingress: catalog, candidates, authored
 * fork, envelope import, gimmick generate (PLAN-102 T-3).
 * All loads produce a WorkingCopy parent ref; authored never mutates source.
 */
import { parseQuestScenario, type QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import { generatedScenarioById } from '@/balancing/config/idleVillage/quests/generation/catalog';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { ROVINE_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/rovine';
import { parseExportEnvelope } from '@/ui/idleVillage/questGenLab/exportEnvelope';
import { loadCandidates } from '@/ui/idleVillage/questGenLab/candidatePersistence';
import { computeScenarioVersion } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import type { LabCandidate } from '@/ui/idleVillage/questGenLab/candidate';
import type { WorkingCopy } from './workingCopy';
import { createWorkingCopy } from './workingCopy';
import type { DraftRecord } from './draftPersistence';
import type { EditedCandidate, EditedProvenance } from './editedCandidate';

export interface LoadedScenario {
  workingCopy: WorkingCopy;
  parent: Omit<DraftRecord, 'ops' | 'savedAt' | 'v'>;
  scenario: QuestScenario;
  /** IT overlay edits saved with a previous edit session (W-03 keys `${nodeId}.${field}`). */
  overlayEdits?: Record<string, string>;
  /** Authored quest this scenario descends from — gates the authored it-IT overlay lookup. */
  overlayQuestId?: 'goblin' | 'rovine';
}

const pack = (
  scenario: QuestScenario,
  parentSource: DraftRecord['parentSource'],
  parentRef: string,
  extra?: Pick<LoadedScenario, 'overlayEdits' | 'overlayQuestId'>,
): LoadedScenario => ({
  workingCopy: createWorkingCopy(scenario),
  parent: { parentSource, parentRef, parentScenarioHash: computeScenarioVersion(scenario) },
  scenario,
  ...extra,
});

/** Authored quest ids that own an it-IT content overlay — anything else resolves `missing`. */
const authoredQuestId = (v: unknown): 'goblin' | 'rovine' | undefined => (v === 'goblin' || v === 'rovine' ? v : undefined);

/** IT-side extras recoverable from edited provenance (candidate or envelope). */
const fromProvenance = (ep: EditedProvenance | undefined): Pick<LoadedScenario, 'overlayEdits' | 'overlayQuestId'> => ({
  overlayEdits: ep?.overlayEdits,
  overlayQuestId: ep?.parentSource === 'authored' ? authoredQuestId(ep?.parentRef) : undefined,
});

/** Generated catalog entry (gimmick output baked in config). */
export function loadFromCatalog(id: string): LoadedScenario | null {
  const sc = generatedScenarioById(id);
  return sc ? pack(sc, 'catalog', id) : null;
}

/** Shared candidate store (`qgl:v1:candidates`). */
export async function loadFromCandidate(candidateId: string): Promise<LoadedScenario | null> {
  const c = (await loadCandidates()).find((x: LabCandidate) => x.id === candidateId);
  if (!c) return null;
  return pack(c.scenario, 'candidate', c.id, fromProvenance((c as EditedCandidate).editedProvenance));
}

/** Authored quest fork — browser never writes the .ts manuscript. */
export function loadAuthored(questId: 'goblin' | 'rovine'): LoadedScenario {
  return pack(questId === 'goblin' ? GOBLIN_SCENARIO : ROVINE_SCENARIO, 'authored', questId, { overlayQuestId: questId });
}

/** Versioned envelope import — re-parsed + validated (qgl-export-v1). */
export function loadFromEnvelope(raw: unknown): LoadedScenario | null {
  const env = parseExportEnvelope(raw);
  if (!env?.scenario) return null;
  const sc = parseQuestScenario(env.scenario);
  const extra = fromProvenance((env as { editedProvenance?: EditedProvenance }).editedProvenance);
  return pack(sc, 'envelope', env.generation?.generatorVersion ?? 'import', extra);
}
