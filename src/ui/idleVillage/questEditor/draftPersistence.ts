/**
 * questEditor/draftPersistence — autosave of the op log (NOT the
 * candidate store; approved content lives elsewhere). Key `qge:v1:draft`.
 */
import { loadData, saveData, clearData } from '@/shared/persistence/PersistenceService';
import type { EditorOp } from './editorOps';

export interface DraftRecord {
  v: 1;
  parentSource: 'catalog' | 'candidate' | 'authored' | 'envelope';
  parentRef: string;          // catalog id / candidate id / questId / envelope hash
  parentScenarioHash: string;
  ops: EditorOp[];
  savedAt: string;
}

const KEY = 'qge:v1:draft';

export async function saveDraft(rec: DraftRecord): Promise<void> {
  await saveData(KEY, rec);
}

export async function loadDraft(): Promise<DraftRecord | null> {
  const d = await loadData<DraftRecord>(KEY);
  return d && d.v === 1 ? d : null;
}

export async function clearDraft(): Promise<void> {
  await clearData(KEY);
}
