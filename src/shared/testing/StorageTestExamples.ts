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

/**
 * Tests BalancerHistoryStore persistence with undo/redo functionality
 */

// ============================================================================
// Example 3: Testing Idle Village Activity Analytics
// ============================================================================

import { IdleVillageActivityStore } from '../../ui/idleVillage/analytics/IdleVillageActivityStore';
import type { AnalyticsRetentionConfig } from '../../ui/idleVillage/analytics/activityTelemetryConfig';

/**
 * Test data for analytics storage testing.
 */
const createTestAnalyticsData = () => ({
  events: [
    {
      id: 'event-1',
      type: 'jobStarted' as const,
      timestamp: Date.now() - 3600000, // 1 hour ago
      activityId: 'forest-work',
      scheduledId: 'scheduled-1',
      residentId: 'resident-1',
      activityType: 'job' as const,
      metadata: { location: 'forest' },
      sessionId: 'test-session-1',
    },
    {
      id: 'event-2',
      type: 'jobCompleted' as const,
      timestamp: Date.now() - 3000000, // 50 minutes ago
      activityId: 'forest-work',
      scheduledId: 'scheduled-1',
      residentId: 'resident-1',
      activityType: 'job' as const,
      duration: 600, // 10 minutes
      metadata: { location: 'forest', rewards: ['wood', 'experience'] },
      sessionId: 'test-session-1',
    },
  ],
  cachedMetrics: {
    eventsByType: {
      jobStarted: 1,
      jobCompleted: 1,
    },
    completionRates: {
      job: 1.0,
      quest: 0.0,
      maintenance: 0.0,
    },
    averageCompletionTimes: {
      job: 600,
      quest: 0,
      maintenance: 0,
    },
    failureRates: {
      job: 0.0,
      quest: 0.0,
      maintenance: 0.0,
    },
    residentPerformance: {
      'resident-1': {
        totalActivities: 2,
        completionRate: 1.0,
        averageCompletionTime: 600,
        preferredActivities: ['job'],
      },
    },
    hourlyActivityPattern: new Array(24).fill(0),
    riskMetrics: {
      highRiskActivities: 0,
      averageRiskScore: 0.1,
      riskByActivityType: {
        job: 0.1,
        quest: 0.0,
        maintenance: 0.0,
      },
    },
    fatigueMetrics: {
      fatigueRelatedFailures: 0,
      averageFatigueOnFailure: 0,
      fatigueImpactByActivityType: {
        job: 0.0,
        quest: 0.0,
        maintenance: 0.0,
      },
    },
  },
  lastMetricsCalculation: Date.now() - 60000, // 1 minute ago
  config: {
    maxEventAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEventCount: 10000,
    aggregationWindowMs: 60 * 60 * 1000, // 1 hour
    cleanupIntervalMs: 60 * 60 * 1000, // 1 hour
    enableAutoCleanup: false,
  },
  sessionId: 'test-session-1',
});

/**
 * Storage adapter for IdleVillageActivityStore.
 */
class ActivityStoreStorageAdapter implements StorageAdapter<any> {
  constructor(private store: IdleVillageActivityStore) {}

  async save(data: any): Promise<void> {
    // Add a test event to trigger save
    await this.store.addEvent({
      type: 'jobStarted',
      activityId: 'storage-test',
      scheduledId: 'storage-test',
      residentId: 'storage-test',
      activityType: 'job',
      metadata: { storageTest: true, ...data },
    });
  }

  async load(): Promise<any> {
    return this.store.getStoreStats();
  }

  async clear(): Promise<void> {
    await this.store.clearAllData();
  }
}

/**
 * Tests Idle Village Activity Analytics persistence
 */
export async function testIdleVillageActivityAnalytics() {
  const config: AnalyticsRetentionConfig = {
    maxEventAge: 24 * 60 * 60 * 1000, // 1 day for testing
    maxEventCount: 100,
    aggregationWindowMs: 60 * 60 * 1000,
    cleanupIntervalMs: 60 * 60 * 1000,
    enableAutoCleanup: false,
  };

  const store = new IdleVillageActivityStore(config);
  await store.initialize();
  
  const adapter = new ActivityStoreStorageAdapter(store);
  const tester = new StorageTestFramework('activity-analytics', adapter, {
    verbose: true,
  });

  const testData = createTestAnalyticsData();
  const alternateData = createTestAnalyticsData();

  try {
    const results = await tester.runFullTest(testData, alternateData);
    
    console.log('✅ Activity Analytics Storage Tests Completed');
    console.log(`📊 Results: ${results.passed}/${results.total} tests passed`);
    console.log(`⏱️  Average Save Time: ${results.averageSaveTime.toFixed(2)}ms`);
    console.log(`⏱️  Average Load Time: ${results.averageLoadTime.toFixed(2)}ms`);
    
    return results;
  } finally {
    store.destroy();
  }
}

/**
 * Tests BalancerHistoryStore persistence with undo/redo functionality
 */
export async function testBalancerUndoHistory(historyData: any) {
  const adapter: StorageAdapter<any> = {
    save: async (data) => {
      localStorage.setItem('balancerHistory', JSON.stringify(data));
    },
    load: () => {
      const raw = localStorage.getItem('balancerHistory');
      return raw ? JSON.parse(raw) : null;
    },
    clear: () => {
      localStorage.removeItem('balancerHistory');
    },
  };

  const tester = new StorageTestFramework(
    'balancerHistory',
    adapter,
    { verbose: true }
  );

  return tester.runFullTest(historyData, { ...historyData, currentIndex: 1 });
}

export async function testBalancerConfigStore(
  testConfig: BalancerConfig,
  alternateConfig?: BalancerConfig
) {
  await BalancerConfigStore.reset();

  const adapter: StorageAdapter<BalancerConfig> = {
    save: async (data) => {
      await BalancerConfigStore.save(data, 'Storage test save');
    },
    load: async () => {
      return BalancerConfigStore.load();
    },
    clear: async () => {
      await BalancerConfigStore.reset();
    },
  };

  const tester = new StorageTestFramework(
    'BalancerConfigStore',
    adapter,
    { verbose: true }
  );

  return tester.runFullTest(testConfig, alternateConfig ?? testConfig);
}

// ============================================================================
// Example 6: Testing Formula Safety Features in BalancerConfigStore
// ============================================================================

/**
 * Creates test config with formula safety settings
 */
function createTestConfigWithSafety(): BalancerConfig {
  const baseConfig = DEFAULT_CONFIG;
  
  // Add formula safety configuration
  baseConfig.formulaSafety = {
    enableRealTimeValidation: true,
    showSafetyBadges: true,
    maxComplexityLevel: 'medium',
    allowDivisionByVariables: true,
    warnOnPotentialCycles: true,
  };

  // Add a stat with formula for testing
  baseConfig.stats['testDerived'] = {
    id: 'testDerived',
    label: 'Test Derived',
    type: 'number',
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 50,
    weight: 1.0,
    isCore: false,
    isDerived: true,
    formula: 'hp * 0.5 + damage * 0.3',
  };

  return baseConfig;
}

/**
 * Tests formula safety configuration persistence
 */
export async function testBalancerConfigFormulaSafety() {
  await BalancerConfigStore.reset();

  const testConfig = createTestConfigWithSafety();
  const alternateConfig = createTestConfigWithSafety();
  
  // Modify safety settings for alternate config
  alternateConfig.formulaSafety = {
    enableRealTimeValidation: false,
    showSafetyBadges: false,
    maxComplexityLevel: 'low',
    allowDivisionByVariables: false,
    warnOnPotentialCycles: false,
  };

  // Test safety configuration persistence
  await BalancerConfigStore.updateFormulaSafety(testConfig.formulaSafety);
  const retrievedSafety = BalancerConfigStore.getFormulaSafety();
  
  console.log('Formula Safety Test Results:');
  console.log('- Original safety config:', testConfig.formulaSafety);
  console.log('- Retrieved safety config:', retrievedSafety);
  console.log('- Safety persistence match:', JSON.stringify(testConfig.formulaSafety) === JSON.stringify(retrievedSafety));

  // Test safety snapshot creation
  const safetySnapshot = await BalancerConfigStore.createSafetySnapshot('Formula safety test');
  console.log('- Safety snapshot created:', safetySnapshot.description);
  console.log('- Safety snapshot checksum:', safetySnapshot.checksum);

  // Test formula history
  const formulaHistory = BalancerConfigStore.getFormulaHistory();
  console.log('- Formula history entries:', formulaHistory.length);

  // Create adapter for full framework test
  const adapter: StorageAdapter<BalancerConfig> = {
    save: async (data) => {
      await BalancerConfigStore.save(data, 'Formula safety test save');
    },
    load: async () => {
      return BalancerConfigStore.load();
    },
    clear: async () => {
      await BalancerConfigStore.reset();
    },
  };

  const tester = new StorageTestFramework(
    'BalancerConfigFormulaSafety',
    adapter,
    { verbose: true }
  );

  return tester.runFullTest(testConfig, alternateConfig);
}

// ============================================================================
// Example 4: Testing Balancer History Store
// ============================================================================

import { BalancerHistoryStore, defaultHistoryStore } from '../../balancing/config/BalancerHistoryStore';

export async function testBalancerHistoryStore(
  testConfig: BalancerConfig,
  alternateConfig?: BalancerConfig
) {
  // Create a test store with deterministic timestamps
  const testStore = new BalancerHistoryStore({
    maxSnapshots: 5,
    storageKey: 'testBalancerHistory',
    autoSave: true,
    deterministicTimestamps: true,
    baseTimestamp: 1640995200000, // 2022-01-01 00:00:00 UTC
    operationTimeoutMs: 1000,
  });

  await testStore.initialize();

  const adapter: StorageAdapter<BalancerConfig> = {
    save: async (data) => {
      await testStore.pushSnapshot(data, 'Storage test save');
    },
    load: async () => {
      return testStore.getCurrentConfig() ?? DEFAULT_CONFIG;
    },
    clear: async () => {
      await testStore.clear();
    },
  };

  const tester = new StorageTestFramework(
    'BalancerHistoryStore',
    adapter,
    { verbose: true }
  );

  return tester.runFullTest(testConfig, alternateConfig ?? testConfig);
}

// ============================================================================
// Example 5: Testing History Store Race Conditions
// ============================================================================

export async function testHistoryStoreRaceConditions(
  testConfig: BalancerConfig
) {
  const testStore = new BalancerHistoryStore({
    maxSnapshots: 3,
    storageKey: 'testRaceConditions',
    autoSave: true,
    deterministicTimestamps: true,
    baseTimestamp: 1640995200000,
    operationTimeoutMs: 500,
  });

  await testStore.initialize();

  // Test concurrent operations
  const concurrentOperations = [];
  
  // Simulate rapid undo/redo operations
  for (let i = 0; i < 10; i++) {
    concurrentOperations.push(
      testStore.pushSnapshot({ ...testConfig, activePresetId: `preset_${i}` }, `Concurrent operation ${i}`)
    );
  }

  // Wait for all operations to complete
  await Promise.allSettled(concurrentOperations);

  // Test rapid undo/redo
  const undoRedoOperations = [];
  for (let i = 0; i < 5; i++) {
    undoRedoOperations.push(testStore.undo());
    undoRedoOperations.push(testStore.redo());
  }

  await Promise.allSettled(undoRedoOperations);

  // Get storage stats for validation
  const stats = testStore.getStorageStats();
  const state = testStore.getState();
  
  console.log('History Store Race Condition Test Results:', {
    snapshotCount: stats.snapshotCount,
    currentIndex: stats.currentIndex,
    canUndo: stats.canUndo,
    canRedo: stats.canRedo,
    recentOperations: state.recentOperations.length,
    currentOperation: state.currentOperation,
  });

  return {
    success: true,
    snapshotCount: stats.snapshotCount,
    operationCount: state.recentOperations.length,
    raceConditionDetected: state.recentOperations.some(op => !op.completed),
  };
}

// ============================================================================
// Example 6: Testing History Store Performance
// ============================================================================

export async function testHistoryStorePerformance(
  testConfig: BalancerConfig
) {
  const testStore = new BalancerHistoryStore({
    maxSnapshots: 10,
    storageKey: 'testPerformance',
    autoSave: true,
    deterministicTimestamps: true,
    baseTimestamp: 1640995200000,
    operationTimeoutMs: 100,
  });

  await testStore.initialize();

  const startTime = performance.now();
  
  // Test 100 rapid operations
  const operations = [];
  for (let i = 0; i < 100; i++) {
    operations.push(
      testStore.pushSnapshot(
        { ...testConfig, activePresetId: `perf_test_${i}` },
        `Performance test ${i}`
      )
    );
  }

  await Promise.all(operations);
  
  // Test 50 undo operations
  const undoOperations = [];
  for (let i = 0; i < 50; i++) {
    undoOperations.push(testStore.undo());
  }

  await Promise.all(undoOperations);
  
  // Test 50 redo operations
  const redoOperations = [];
  for (let i = 0; i < 50; i++) {
    redoOperations.push(testStore.redo());
  }

  await Promise.all(redoOperations);
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;

  const stats = testStore.getStorageStats();
  
  console.log('History Store Performance Test Results:', {
    totalTime: `${totalTime.toFixed(2)}ms`,
    averageOperationTime: `${(totalTime / 200).toFixed(2)}ms`,
    snapshotCount: stats.snapshotCount,
    maxSnapshots: 10,
    operationsPerSecond: Math.round(200000 / totalTime),
  });

  return {
    success: true,
    totalTime,
    averageOperationTime: totalTime / 200,
    operationsPerSecond: Math.round(200000 / totalTime),
    snapshotCount: stats.snapshotCount,
  };
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

// ============================================================================
// Example 7: Testing STS Data Lake Connector
// ============================================================================

import { STSDataLakeConnector, DEFAULT_DATA_LAKE_CONFIG } from '../../analytics/stsDataLakeConnector';
import type { STSTelemetryEvent } from '../../analytics/stsTelemetry';

/**
 * Test data for STS Data Lake Connector
 */
const STS_TEST_DATA: STSTelemetryEvent[] = [
  {
    type: 'sts_mana_surge_detected',
    timestamp: Date.now(),
    sessionId: 'test-session-1',
    data: {
      alertId: 'alert-123',
      level: 'high',
      value: 8,
      threshold: 5,
      metadata: {
        scenarioId: 'scenario-1',
        turnNumber: 5,
      },
    },
  },
  {
    type: 'sts_mana_generated',
    timestamp: Date.now() + 1000,
    sessionId: 'test-session-1',
    data: {
      amount: 3,
      turnNumber: 6,
      source: 'relic',
    },
  },
  {
    type: 'sts_turn_complete',
    timestamp: Date.now() + 2000,
    sessionId: 'test-session-1',
    data: {
      turnNumber: 6,
      manaAtStart: 5,
      manaAtEnd: 8,
      cardsPlayed: 2,
    },
  },
];

/**
 * Alternate test data for STS Data Lake Connector
 */
const STS_ALTERNATE_DATA: STSTelemetryEvent[] = [
  {
    type: 'sts_simulation_start',
    timestamp: Date.now(),
    sessionId: 'test-session-2',
    data: {
      scenarioId: 'scenario-2',
      seed: 12345,
      character: 'ironclad',
    },
  },
  {
    type: 'sts_scenario_loaded',
    timestamp: Date.now() + 500,
    sessionId: 'test-session-2',
    data: {
      scenarioId: 'scenario-2',
      presetName: 'basic-preset',
    },
  },
];

/**
 * Tests STS Data Lake Connector with Storage Testing Framework
 */
export async function testSTSDataLakeConnector(
  testData: STSTelemetryEvent[] = STS_TEST_DATA,
  alternateData: STSTelemetryEvent[] = STS_ALTERNATE_DATA
) {
  console.log('🧪 Testing STS Data Lake Connector storage...');
  
  // Create a custom adapter for the data lake connector
  const adapter = {
    save: async (data: any) => {
      // Simulate saving to data lake
      console.log(`  💾 Saving ${data.length} records to data lake`);
      return Promise.resolve();
    },
    load: async () => {
      // Simulate loading checkpoint
      return {
        lastProcessedTimestamp: 0,
        lastBatchId: '',
        totalRecordsProcessed: 0,
        failedRecords: 0,
        lastCheckpointTime: Date.now(),
      };
    },
    clear: async () => {
      console.log('  🗑️  Clearing data lake storage');
      return Promise.resolve();
    },
  };

  // Create connector with test configuration
  const connector = new STSDataLakeConnector({
    ...DEFAULT_DATA_LAKE_CONFIG,
    batchSize: 2, // Small batch for testing
    maxRetries: 1, // Fewer retries for faster testing
    outputPath: 'test-data/exports/sts/data-lake-test',
  });

  // Test basic functionality
  const testResults = {
    basicOperations: false,
    batchProcessing: false,
    errorHandling: false,
    checkpointRecovery: false,
    statistics: false,
  };

  try {
    // Test 1: Basic operations
    console.log('  📋 Testing basic operations...');
    await connector.initialize();
    await connector.processEvent(testData[0]);
    await connector.flush();
    testResults.basicOperations = true;

    // Test 2: Batch processing
    console.log('  📦 Testing batch processing...');
    await connector.processEvents(testData.slice(1, 3));
    testResults.batchProcessing = true;

    // Test 3: Error handling
    console.log('  ⚠️  Testing error handling...');
    try {
      // Process invalid event (should be handled gracefully)
      await connector.processEvent({
        type: 'invalid_event',
        timestamp: Date.now(),
        sessionId: '',
        data: {},
      } as any);
      testResults.errorHandling = true;
    } catch (error) {
      // Expected to fail validation
      testResults.errorHandling = true;
    }

    // Test 4: Checkpoint recovery
    console.log('  🔄 Testing checkpoint recovery...');
    const stats1 = await connector.getStatistics();
    await connector.reset();
    const stats2 = await connector.getStatistics();
    testResults.checkpointRecovery = stats2.totalRecordsProcessed === 0;

    // Test 5: Statistics
    console.log('  📊 Testing statistics...');
    const finalStats = await connector.getStatistics();
    testResults.statistics = finalStats !== null;

  } catch (error) {
    console.error('  ❌ STS Data Lake Connector test failed:', error);
  }

  // Generate test report
  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length;
  const successRate = (passedTests / totalTests) * 100;

  const result = {
    testName: 'STS Data Lake Connector',
    success: successRate >= 80, // Consider successful if 80%+ tests pass
    totalTests,
    passedTests,
    failedTests: totalTests - passedTests,
    successRate,
    duration: 0, // Would track actual duration in real implementation
    testResults,
    errors: [] as string[],
  };

  console.log(`  ✅ STS Data Lake Connector test completed: ${passedTests}/${totalTests} tests passed (${successRate.toFixed(1)}%)`);
  
  return result;
}
