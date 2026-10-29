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

export interface LoadedScenario {
  workingCopy: WorkingCopy;
  parent: Omit<DraftRecord, 'ops' | 'savedAt' | 'v'>;
  scenario: QuestScenario;
}

const pack = (scenario: QuestScenario, parentSource: DraftRecord['parentSource'], parentRef: string): LoadedScenario => ({
  workingCopy: createWorkingCopy(scenario),
  parent: { parentSource, parentRef, parentScenarioHash: computeScenarioVersion(scenario) },
  scenario,
});

/** Generated catalog entry (gimmick output baked in config). */
export function loadFromCatalog(id: string): LoadedScenario | null {
  const sc = generatedScenarioById(id);
  return sc ? pack(sc, 'catalog', id) : null;
}

/** Shared candidate store (`qgl:v1:candidates`). */
export async function loadFromCandidate(candidateId: string): Promise<LoadedScenario | null> {
  const c = (await loadCandidates()).find((x: LabCandidate) => x.id === candidateId);
  return c ? pack(c.scenario, 'candidate', c.id) : null;
}

/** Authored quest fork — browser never writes the .ts manuscript. */
export function loadAuthored(questId: 'goblin' | 'rovine'): LoadedScenario {
  return pack(questId === 'goblin' ? GOBLIN_SCENARIO : ROVINE_SCENARIO, 'authored', questId);
}

/** Versioned envelope import — re-parsed + validated (qgl-export-v1). */
export function loadFromEnvelope(raw: unknown): LoadedScenario | null {
  const env = parseExportEnvelope(raw);
  if (!env?.scenario) return null;
  const sc = parseQuestScenario(env.scenario);
  return pack(sc, 'envelope', env.generation?.generatorVersion ?? 'import');
}
