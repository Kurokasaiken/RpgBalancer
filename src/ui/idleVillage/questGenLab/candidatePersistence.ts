/**
 * candidatePersistence — SP-6 persistence seam for lab candidates.
 *
 * All access goes through the canonical PersistenceService (project
 * invariant — never direct browser storage). Key namespace `qgl:v1:*`
 * is versioned so shape changes rotate the key, not migrations.
 */

import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import {
  hydrateCandidates,
  serializeCandidates,
} from './candidateSerialization';
import type { LabCandidate } from './candidate';

/** Versioned storage key for the candidate list. */
export const CANDIDATES_STORAGE_KEY = 'qgl:v1:candidates';

/**
 * Persist the candidate list — strict serialization, never throws on
 * quota/service failure (a lab losing autosave must not crash a run).
 */
export async function saveCandidates(list: readonly LabCandidate[]): Promise<void> {
  try {
    await saveData(CANDIDATES_STORAGE_KEY, serializeCandidates(list));
  } catch {
    // autosave failure is non-fatal — the lab keeps working
  }
}

/**
 * Load persisted candidates — strict hydration, all-or-nothing.
 * Corrupted/absent payloads resolve to an empty list.
 */
export async function loadCandidates(): Promise<LabCandidate[]> {
  try {
    const raw = await loadData<unknown>(CANDIDATES_STORAGE_KEY, []);
    return hydrateCandidates(raw) ?? [];
  } catch {
    return [];
  }
}
