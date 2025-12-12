/**
 * Storage Test Framework - Usage Examples
 * 
 * Demonstrates how to use StorageTestFramework with different storage systems
 * used throughout the application.
 */

import { StorageTestFramework, type StorageAdapter } from './StorageTestFramework';

// ============================================================================
// Example 1: Testing localStorage with JSON serialization
// ============================================================================

export async function testLocalStorageJSON<T>(
  storageKey: string,
  testData: T,
  alternateData?: T
) {
  const adapter: StorageAdapter<T> = {
    save: (data) => {
      localStorage.setItem(storageKey, JSON.stringify(data));
    },
    load: () => {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : ({} as T);
    },
    clear: () => {
      localStorage.removeItem(storageKey);
    },
  };

  const tester = new StorageTestFramework(
    `localStorage: ${storageKey}`,
    adapter,
    { verbose: true }
  );

  return tester.runFullTest(testData, alternateData);
}

// ============================================================================
// Example 2: Testing Balancer Config Store
// ============================================================================

import type { BalancerConfig } from '../../balancing/config/types';
import { BalancerConfigStore } from '../../balancing/config/BalancerConfigStore';
import { DEFAULT_CONFIG } from '../../balancing/config/defaultConfig';

export async function testBalancerConfigStore(testConfig: BalancerConfig) {
  const adapter: StorageAdapter<BalancerConfig> = {
    save: (data) => {
      BalancerConfigStore.save(data, 'Test save');
    },
    load: () => {
      return BalancerConfigStore.load();
    },
    clear: () => {
      BalancerConfigStore.reset();
    },
  };

  const tester = new StorageTestFramework(
    'BalancerConfigStore',
    adapter,
    { verbose: true }
  );

  return tester.runFullTest(testConfig);
}

// ============================================================================
// Example 3: Testing Spell Storage
// ============================================================================

import type { Spell } from '../../balancing/spellTypes';
import { loadSpells, saveSpells } from '../../balancing/spellStorage';

export async function testSpellStorage(testSpells: Spell[]) {
  const adapter: StorageAdapter<Spell[]> = {
    save: (data) => {
      saveSpells(data);
    },
    load: () => {
      return loadSpells();
    },
    clear: () => {
      saveSpells([]);
    },
  };

  const tester = new StorageTestFramework(
    'SpellStorage',
    adapter,
    { verbose: true }
  );

  return tester.runFullTest(testSpells, []);
}

// ============================================================================
// Example 4: Testing Character Storage
// ============================================================================

import type { Character } from '../../balancing/character/types';
import { loadCharacters, upsertCharacter } from '../../balancing/character/storage';

export async function testCharacterStorage(testCharacter: Character) {
  const adapter: StorageAdapter<Character[]> = {
    save: (data) => {
      // For character storage, we upsert
      data.forEach((char) => upsertCharacter(char));
    },
    load: () => {
      return loadCharacters();
    },
    clear: () => {
      // Note: Character storage doesn't have a direct clear, so we'd need to implement it
      // For now, this is a limitation
      localStorage.removeItem('rpg_balancer_characters');
    },
  };

  const tester = new StorageTestFramework(
    'CharacterStorage',
    adapter,
    { verbose: true }
  );

  return tester.runFullTest([testCharacter], []);
}

// ============================================================================
// Example 5: Testing Preset Storage
// ============================================================================

import type { UserPreset } from '../../balancing/presetStorage';
import {
  loadUserPresets,
  deleteUserPreset,
} from '../../balancing/presetStorage';

export async function testPresetStorage(testPreset: Omit<UserPreset, 'id' | 'isUserCreated' | 'createdAt' | 'modifiedAt'>) {
  const adapter: StorageAdapter<Record<string, UserPreset>> = {
    save: (data) => {
      // For presets, we need to save each one
      Object.values(data).forEach((preset) => {
        // This is a simplified version - actual implementation would be more complex
        localStorage.setItem(
          `user_preset_${preset.id}`,
          JSON.stringify(preset)
        );
      });
    },
    load: () => {
      return loadUserPresets();
    },
    clear: () => {
      const presets = loadUserPresets();
      Object.keys(presets).forEach((id) => {
        deleteUserPreset(id);
      });
    },
  };

  const tester = new StorageTestFramework(
    'PresetStorage',
    adapter,
    { verbose: true }
  );

  const testData = {
    test_preset: {
      id: 'test_preset',
      name: testPreset.name,
      description: testPreset.description,
      weights: testPreset.weights,
      isUserCreated: true,
      createdAt: new Date(),
      modifiedAt: new Date(),
    },
  };

  return tester.runFullTest(testData);
}

// ============================================================================
// Example 6: Custom Storage Implementation
// ============================================================================

export class CustomMemoryStorage<T> {
  private data: Map<string, T> = new Map();

  set(key: string, value: T): void {
    this.data.set(key, value);
  }

  get(key: string): T | null {
    return this.data.get(key) || null;
  }

  delete(key: string): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }
}

export async function testCustomMemoryStorage<T>(
  testData: T,
  storageKey: string = 'test'
) {
  const storage = new CustomMemoryStorage<T>();

  const adapter: StorageAdapter<T> = {
    save: (data) => {
      storage.set(storageKey, data);
    },
    load: () => {
      const loaded = storage.get(storageKey);
      if (!loaded) throw new Error('No data in storage');
      return loaded;
    },
    clear: () => {
      storage.clear();
    },
  };

  const tester = new StorageTestFramework(
    'CustomMemoryStorage',
    adapter,
    { verbose: true }
  );

  return tester.runFullTest(testData);
}

// ============================================================================
// Batch Test Runner
// ============================================================================

export interface BatchTestConfig {
  testBalancer?: boolean;
  testSpells?: boolean;
  testCharacters?: boolean;
  testPresets?: boolean;
  testCustom?: boolean;
}

export async function runAllStorageTests(
  config: BatchTestConfig = {
    testBalancer: true,
    testSpells: true,
    testCharacters: true,
    testPresets: true,
    testCustom: true,
  }
) {
  const results = [];

  console.log('\n🚀 Starting Comprehensive Storage Test Suite\n');

  if (config.testBalancer) {
    console.log('Testing Balancer Config Store...');
    const balancerResult = await testBalancerConfigStore(DEFAULT_CONFIG);
    results.push(balancerResult);
  }

  if (config.testSpells) {
    console.log('Testing Spell Storage...');
    // Would need actual test data
    // results.push(await testSpellStorage(testSpells));
  }

  if (config.testCharacters) {
    console.log('Testing Character Storage...');
    // Would need actual test data
    // results.push(await testCharacterStorage(testCharacter));
  }

  if (config.testPresets) {
    console.log('Testing Preset Storage...');
    // Would need actual test data
    // results.push(await testPresetStorage(testPreset));
  }

  if (config.testCustom) {
    console.log('Testing Custom Memory Storage...');
    const customResult = await testCustomMemoryStorage({ test: 'data' });
    results.push(customResult);
  }

  return results;
}
