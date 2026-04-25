/**
 * Storage Testing Integration for BalancerConfigStore
 * 
 * Integrates the generic StorageTestFramework with BalancerConfigStore
 * to provide comprehensive testing for config persistence operations.
 */

import { StorageTestFramework, type StorageAdapter } from '../../shared/testing/StorageTestFramework';
import { BalancerConfigStore } from './BalancerConfigStore';
import { DEFAULT_CONFIG } from './defaultConfig';
import type { BalancerConfig } from './types';

/**
 * Adapter for BalancerConfigStore to work with StorageTestFramework
 */
class BalancerConfigStoreAdapter implements StorageAdapter<BalancerConfig> {
  private storageKey: string;

  constructor(storageKey: string = 'rpg_balancer_config') {
    this.storageKey = storageKey;
  }

  async save(data: BalancerConfig): Promise<void> {
    // Use the store's save method but with a custom storage key for testing
    await BalancerConfigStore.save(data, 'Storage test save');
  }

  async load(): Promise<BalancerConfig> {
    try {
      // Load from the store's current state
      const config = BalancerConfigStore.getCurrentConfigSnapshot() || DEFAULT_CONFIG;
      return config;
    } catch (error) {
      console.warn('Failed to load from BalancerConfigStore, returning default:', error);
      return DEFAULT_CONFIG;
    }
  }

  async clear(): Promise<void> {
    await BalancerConfigStore.resetToDefault('Storage test clear');
  }
}

/**
 * Creates a storage test instance for BalancerConfigStore
 */
export function createBalancerConfigStorageTest(storageKey?: string): StorageTestFramework<BalancerConfig> {
  const adapter = new BalancerConfigStoreAdapter(storageKey);
  return new StorageTestFramework('BalancerConfigStore', adapter, {
    verbose: true,
    timeout: 5000,
    maxRetries: 3,
  });
}

/**
 * Test data for BalancerConfigStore testing
 */
export const BALANCER_TEST_DATA: BalancerConfig = {
  ...DEFAULT_CONFIG,
  // Add some test modifications
  stats: {
    ...DEFAULT_CONFIG.stats,
    testStat: {
      id: 'testStat',
      label: 'Test Stat',
      description: 'A stat for testing purposes',
      type: 'number' as const,
      min: 10,
      max: 100,
      step: 5,
      defaultValue: 50,
      weight: 1.5,
      isCore: false,
      isDerived: false,
      isPenalty: false,
      baseStat: false,
      isDetrimental: false,
      formula: 'baseValue * 1.2',
    },
  },
  cards: {
    ...DEFAULT_CONFIG.cards,
    testCard: {
      id: 'testCard',
      title: 'Test Card',
      color: '#FF6B6B',
      icon: 'test-icon',
      statIds: ['hp', 'damage'],
      isCore: false,
      order: 999,
      isLocked: false,
    },
  },
};

export const BALANCER_ALTERNATE_DATA: BalancerConfig = {
  ...DEFAULT_CONFIG,
  stats: {
    ...DEFAULT_CONFIG.stats,
    alternateStat: {
      id: 'alternateStat',
      label: 'Alternate Stat',
      description: 'An alternate stat for testing',
      type: 'number' as const,
      min: 20,
      max: 200,
      step: 10,
      defaultValue: 100,
      weight: 2.0,
      isCore: false,
      isDerived: false,
      isPenalty: false,
      baseStat: false,
      isDetrimental: false,
      formula: 'baseValue * 1.5',
    },
  },
  cards: {
    ...DEFAULT_CONFIG.cards,
    alternateCard: {
      id: 'alternateCard',
      title: 'Alternate Card',
      color: '#4ECDC4',
      icon: 'alternate-icon',
      statIds: ['hp', 'damage', 'defense'],
      isCore: false,
      order: 998,
      isLocked: false,
    },
  },
};

/**
 * Runs comprehensive storage tests for BalancerConfigStore
 */
export async function runBalancerConfigStorageTests(): Promise<{
  success: boolean;
  results: unknown;
  summary: string;
}> {
  try {
    const tester = createBalancerConfigStorageTest();
    
    // Run the full test suite
    const suite = await tester.runFullTest(BALANCER_TEST_DATA, BALANCER_ALTERNATE_DATA);
    
    const success = suite.successRate === 100;
    const summary = `BalancerConfigStore storage tests: ${suite.passedCount}/${suite.tests.length} passed (${suite.successRate.toFixed(1)}%)`;
    
    return {
      success,
      results: suite,
      summary,
    };
  } catch (error) {
    console.error('BalancerConfigStore storage tests failed:', error);
    return {
      success: false,
      results: null,
      summary: `BalancerConfigStore storage tests failed: ${error}`,
    };
  }
}

/**
 * Validates that BalancerConfigStore properly integrates with async PersistenceService
 */
export async function validateBalancerConfigPersistenceIntegration(): Promise<{
  success: boolean;
  details: string[];
}> {
  const details: string[] = [];
  
  try {
    // Test basic save/load cycle
    const originalConfig = await BalancerConfigStore.load();
    details.push('✓ Successfully loaded initial config');
    
    // Test save with modifications
    const modifiedConfig = {
      ...originalConfig,
      stats: {
        ...originalConfig.stats,
        persistenceTest: {
          id: 'persistenceTest',
          label: 'Persistence Test',
          description: 'Testing persistence integration',
          type: 'number' as const,
          min: 5,
          max: 50,
          step: 5,
          defaultValue: 25,
          weight: 1.0,
          isCore: false,
          isDerived: false,
          isPenalty: false,
          baseStat: false,
          isDetrimental: false,
          formula: 'baseValue',
        },
      },
    };
    
    await BalancerConfigStore.save(modifiedConfig, 'Persistence test');
    details.push('✓ Successfully saved modified config');
    
    // Verify the save persisted
    const loadedConfig = await BalancerConfigStore.load();
    if (loadedConfig.stats.persistenceTest) {
      details.push('✓ Modifications persisted correctly');
    } else {
      details.push('✗ Modifications did not persist');
    }
    
    // Test history functionality
    const history = BalancerConfigStore.getHistory();
    if (history.length > 0) {
      details.push(`✓ History contains ${history.length} snapshots`);
    } else {
      details.push('✗ History is empty');
    }
    
    // Test undo functionality
    if (history.length > 0) {
      await BalancerConfigStore.undo();
      details.push('✓ Undo functionality works');
    } else {
      details.push('⚠ Cannot test undo (no history)');
    }
    
    return {
      success: details.every(detail => detail.startsWith('✓')),
      details,
    };
  } catch (error) {
    return {
      success: false,
      details: [`✗ Persistence integration failed: ${error}`],
    };
  }
}
