/**
 * MUST-PASS fixture for persistence:no-forbidden-apis (PLAN-122 T-3).
 * The sanctioned path: all save/load goes through PersistenceService's
 * async API. This file MUST pass the check; `governance:check --selftest`
 * verifies that.
 */
import { saveData, loadData } from '@/shared/persistence/PersistenceService';

export async function compliantSave(key: string, value: unknown): Promise<void> {
  await saveData(key, value);
}

export async function compliantLoad(key: string): Promise<unknown> {
  return loadData(key);
}
