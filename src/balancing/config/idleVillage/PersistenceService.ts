import merge from 'lodash.merge';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from './defaultConfig';
import { IdleVillageConfigSchema } from './schemas';
import type { IdleVillageConfig } from './types';
import { applyIdleVillageConfigDefaults } from './configNormalizer';
import { isTauriRuntime } from '@/shared/persistence/runtime';
export { isTauriRuntime };
import { loadData, saveData } from '@/shared/persistence/PersistenceService';

const DYNAMIC_CONFIG_RELATIVE_PATH = '../src/data/dynamicConfig.json';

/**
 * Shared persistence key used by the web/localStorage fallback.
 */
export const IDLE_VILLAGE_CONFIG_STORAGE_KEY = 'idleVillageConfig';

/**
 * Deep copies a JSON-serializable value.
 */
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

let cachedDynamicConfigPath: string | null = null;

/**
 * Resolves the absolute file system path for the dynamic Idle Village configuration file.
 */
async function resolveDynamicConfigPath(): Promise<string> {
  if (cachedDynamicConfigPath) return cachedDynamicConfigPath;
  const { resolveResource } = await import('@tauri-apps/api/path');
  cachedDynamicConfigPath = await resolveResource(DYNAMIC_CONFIG_RELATIVE_PATH);
  return cachedDynamicConfigPath;
}

/**
 * Reads the raw JSON contents of the dynamic configuration file from disk.
 */
async function readDynamicConfigFile(): Promise<string | null> {
  if (!isTauriRuntime()) return null;
  try {
    const path = await resolveDynamicConfigPath();
    const { readTextFile } = await import('@tauri-apps/plugin-fs');
    return await readTextFile(path);
  } catch (error) {
    console.warn('[PersistenceService] Unable to read dynamic config file.', error);
    return null;
  }
}

/**
 * Persists the provided raw JSON payload to the dynamic configuration file.
 */
async function writeRawDynamicConfig(payload: string): Promise<void> {
  if (!isTauriRuntime()) return;
  try {
    const { writeTextFile } = await import('@tauri-apps/plugin-fs');
    const path = await resolveDynamicConfigPath();
    await writeTextFile(path, payload);
  } catch (error) {
    console.warn('[PersistenceService] Unable to write dynamic config file.', error);
  }
}

/**
 * Loads the effective Idle Village configuration, merging disk overrides with defaults.
 */
/**
 * Loads the Idle Village config snapshot from localStorage/web persistence.
 */
async function loadConfigFromWebStorage(): Promise<IdleVillageConfig> {
  const stored = await loadData(IDLE_VILLAGE_CONFIG_STORAGE_KEY, DEFAULT_IDLE_VILLAGE_CONFIG);
  const candidate = merge({}, DEFAULT_IDLE_VILLAGE_CONFIG, stored);
  const validation = IdleVillageConfigSchema.safeParse(candidate);
  if (validation.success) {
    return applyIdleVillageConfigDefaults(validation.data);
  }
  console.warn('[PersistenceService] Web storage config invalid. Restoring defaults.');
  await saveData(IDLE_VILLAGE_CONFIG_STORAGE_KEY, DEFAULT_IDLE_VILLAGE_CONFIG);
  return applyIdleVillageConfigDefaults(clone(DEFAULT_IDLE_VILLAGE_CONFIG));
}

export async function loadFinalConfigFromDisk(): Promise<IdleVillageConfig> {
  if (!isTauriRuntime()) {
    return loadConfigFromWebStorage();
  }

  const raw = await readDynamicConfigFile();

  if (!raw || raw.trim().length === 0) {
    await persistConfigToDisk(DEFAULT_IDLE_VILLAGE_CONFIG);
    return applyIdleVillageConfigDefaults(clone(DEFAULT_IDLE_VILLAGE_CONFIG));
  }

  try {
    const parsed = JSON.parse(raw);
    const candidate = merge({}, DEFAULT_IDLE_VILLAGE_CONFIG, parsed);
    const validation = IdleVillageConfigSchema.safeParse(candidate);
    if (validation.success) {
      return applyIdleVillageConfigDefaults(validation.data);
    }
    console.warn('[PersistenceService] Validation failed for merged dynamic config.', validation.error);
  } catch (error) {
    console.warn('[PersistenceService] Dynamic config JSON is invalid. Restoring defaults.', error);
  }
  await persistConfigToDisk(DEFAULT_IDLE_VILLAGE_CONFIG);
  return applyIdleVillageConfigDefaults(clone(DEFAULT_IDLE_VILLAGE_CONFIG));
}

/**
 * Serializes and persists an Idle Village configuration snapshot to disk.
 */
export async function persistConfigToDisk(config: IdleVillageConfig): Promise<void> {
  if (!isTauriRuntime()) {
    await saveData(IDLE_VILLAGE_CONFIG_STORAGE_KEY, config);
    return;
  }
  const serialized = JSON.stringify(config, null, 2);
  await writeRawDynamicConfig(serialized);
}
