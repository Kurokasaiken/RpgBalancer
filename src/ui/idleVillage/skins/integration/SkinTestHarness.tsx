/**
 * TS-004: Skin System Test Harness
 * 
 * Comprehensive testing harness for the TS-Series skin system.
 * Provides UI for testing components, validating integration, and
 * monitoring skin system performance.
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { getSkinReplacementAPI_TS003, type SkinReplacementAPI_TS003 } from '../SkinReplacementAPI_TS003';
import { SkinDevTools_TS003 } from '../SkinDevTools_TS003';
import { 
  ComponentIntegrationPatterns,
  migrateComponent,
  batchMigrateComponents,
  CommonComponentConfigs,
  type ComponentIntegrationConfig,
  type MigrationResult,
  type BatchMigrationConfig
} from './ComponentIntegrationPatterns';

// ============================================================================
// TYPES
// ============================================================================

// Define types locally to avoid import issues
type ComponentId = string;
type MotionLevel = 'minimal' | 'reduced' | 'full';
type StyleLabPillar = 'frontier' | 'wilderness' | 'empire';
type SkinPresetId = 'minimal-frontier' | 'minimal-wilderness' | 'minimal-empire' | 'wanderlust' | 'arcane-tech' | 'gilded-observatory';

interface TestHarnessConfig {
  /** Whether to show advanced features */
  showAdvanced?: boolean;
  /** Whether to enable real-time monitoring */
  enableMonitoring?: boolean;
  /** Whether to show migration tools */
  showMigrationTools?: boolean;
  /** Whether to show component testing */
  showComponentTesting?: boolean;
  /** Whether to show performance metrics */
  showPerformanceMetrics?: boolean;
  /** Update interval for real-time data */
  updateInterval?: number;
  /** Maximum number of log entries */
  maxLogEntries?: number;
}

interface TestResult {
  id: string;
  componentId: ComponentId;
  testName: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  startTime: number;
  endTime?: number;
  duration?: number;
  error?: string;
  details?: Record<string, unknown>;
}

interface ComponentTestSuite {
  componentId: ComponentId;
  tests: Array<{
    name: string;
    description: string;
    test: (api: SkinReplacementAPI_TS003) => Promise<boolean>;
  }>;
}

// ============================================================================
// TEST SUITES
// ============================================================================

const createTestSuites = (): ComponentTestSuite[] => [
  {
    componentId: 'ActivitySlot',
    tests: [
      {
        name: 'Basic Registration',
        description: 'Test component registration with skin system',
        test: async (api) => {
          const binding = CommonComponentConfigs.ActivitySlot;
          const inspection = api.inspectComponent(binding.componentId);
          return inspection !== null && inspection.isRegistered;
        },
      },
      {
        name: 'Style Generation',
        description: 'Test CSS class and attribute generation',
        test: async (api) => {
          const binding = CommonComponentConfigs.ActivitySlot;
          const inspection = api.inspectComponent(binding.componentId);
          return inspection !== null && 
                 inspection.currentClasses.length > 0 && 
                 Object.keys(inspection.currentAttributes).length > 0;
        },
      },
      {
        name: 'Preset Switching',
        description: 'Test preset switching functionality',
        test: async (api) => {
          const result = await api.replacePreset('wanderlust', { animate: false, validate: true });
          return result;
        },
      },
    ],
  },
  {
    componentId: 'ActiveHUD',
    tests: [
      {
        name: 'Basic Registration',
        description: 'Test HUD registration with skin system',
        test: async (api) => {
          const binding = CommonComponentConfigs.ActiveHUD;
          const inspection = api.inspectComponent(binding.componentId);
          return inspection !== null && inspection.isRegistered;
        },
      },
      {
        name: 'Style Application',
        description: 'Test HUD style application',
        test: async (api) => {
          const binding = CommonComponentConfigs.ActiveHUD;
          const inspection = api.inspectComponent(binding.componentId);
          return inspection !== null && 
                 inspection.currentStyles !== undefined &&
                 Object.keys(inspection.currentStyles).length > 0;
        },
      },
    ],
  },
  {
    componentId: 'PgCard',
    tests: [
      {
        name: 'Drag Integration',
        description: 'Test drag-and-drop skin integration',
        test: async (api) => {
          const binding = CommonComponentConfigs.PgCard;
          const inspection = api.inspectComponent(binding.componentId);
          return inspection !== null && 
                 inspection.binding.skinProperties?.supportsDrag === true;
        },
      },
      {
        name: 'Performance Metrics',
        description: 'Test performance metrics collection',
        test: async (api) => {
          const metrics = api.getPerformanceMetrics();
          return typeof metrics === 'object' && Object.keys(metrics).length > 0;
        },
      },
    ],
  },
];

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

const TestResultsViewer: React.FC<{
  results: TestResult[];
  onClearResults: () => void;
}> = ({ results, onClearResults }) => {
  const stats = useMemo(() => {
    const total = results.length;
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const running = results.filter(r => r.status === 'running').length;
    const pending = results.filter(r => r.status === 'pending').length;

    return { total, passed, failed, running, pending };
  }, [results]);

  return (
    <div className="skin-test-harness__results-viewer">
      <div className="skin-test-harness__results-header">
        <h4>Test Results</h4>
        <div className="skin-test-harness__results-stats">
          <span className="skin-test-harness__stat skin-test-harness__stat--total">
            Total: {stats.total}
          </span>
          <span className="skin-test-harness__stat skin-test-harness__stat--passed">
            Passed: {stats.passed}
          </span>
          <span className="skin-test-harness__stat skin-test-harness__stat--failed">
            Failed: {stats.failed}
          </span>
          <span className="skin-test-harness__stat skin-test-harness__stat--running">
            Running: {stats.running}
          </span>
          <button
            onClick={onClearResults}
            className="skin-test-harness__button skin-test-harness__button--small"
          >
            Clear Results
          </button>
        </div>
      </div>

      <div className="skin-test-harness__results-list">
        {results.map((result) => (
          <div
            key={result.id}
            className={`skin-test-harness__result-item skin-test-harness__result-item--${result.status}`}
          >
            <div className="skin-test-harness__result-header">
              <span className="skin-test-harness__result-name">{result.testName}</span>
              <span className="skin-test-harness__result-component">{result.componentId}</span>
              <span className="skin-test-harness__result-status">{result.status}</span>
              {result.duration && (
                <span className="skin-test-harness__result-duration">
                  {result.duration.toFixed(2)}ms
                </span>
              )}
            </div>
            {result.error && (
              <div className="skin-test-harness__result-error">
                {result.error}
              </div>
            )}
            {result.details && (
              <div className="skin-test-harness__result-details">
                <pre>{JSON.stringify(result.details, null, 2)}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const MigrationTool: React.FC<{
  api: SkinReplacementAPI_TS003;
}> = ({ api }) => {
  const [selectedComponents, setSelectedComponents] = useState<ComponentId[]>([]);
  const [migrationPattern, setMigrationPattern] = useState<keyof typeof ComponentIntegrationPatterns>('Basic Wrapper');
  const [migrationResults, setMigrationResults] = useState<MigrationResult[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);

  const availableComponents = useMemo(() => {
    return Object.keys(CommonComponentConfigs);
  }, []);

  const handleComponentToggle = useCallback((componentId: ComponentId) => {
    setSelectedComponents(prev => 
      prev.includes(componentId)
        ? prev.filter(id => id !== componentId)
        : [...prev, componentId]
    );
  }, []);

  const handleBatchMigration = useCallback(async () => {
    if (selectedComponents.length === 0) return;

    setIsMigrating(true);
    setMigrationResults([]);

    const batchConfig: BatchMigrationConfig = {
      components: selectedComponents.map(componentId => ({
        component: () => React.createElement('div', {}, `Mock ${componentId}`), // Mock component
        config: CommonComponentConfigs[componentId],
        pattern: migrationPattern,
      })),
      onProgress: (completed, total, current) => {
        console.log(`Migration progress: ${completed}/${total} - ${current}`);
      },
      onComplete: (results) => {
        setMigrationResults(results);
        setIsMigrating(false);
      },
      onError: (error, componentId) => {
        console.error(`Migration error for ${componentId}:`, error);
      },
    };

    await batchMigrateComponents(batchConfig);
  }, [selectedComponents, migrationPattern]);

  return (
    <div className="skin-test-harness__migration-tool">
      <h4>Component Migration Tool</h4>
      
      <div className="skin-test-harness__migration-controls">
        <div className="skin-test-harness__form-group">
          <label>Select Components:</label>
          <div className="skin-test-harness__component-list">
            {availableComponents.map(componentId => (
              <label key={componentId} className="skin-test-harness__checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedComponents.includes(componentId)}
                  onChange={() => handleComponentToggle(componentId)}
                />
                {componentId}
              </label>
            ))}
          </div>
        </div>

        <div className="skin-test-harness__form-group">
          <label>Migration Pattern:</label>
          <select
            value={migrationPattern}
            onChange={(e) => setMigrationPattern(e.target.value as keyof typeof ComponentIntegrationPatterns)}
            className="skin-test-harness__select"
          >
            {ComponentIntegrationPatterns.map((pattern, index) => (
              <option key={index} value={pattern.name}>
                {pattern.name} ({pattern.complexity})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleBatchMigration}
          disabled={isMigrating || selectedComponents.length === 0}
          className="skin-test-harness__button skin-test-harness__button--primary"
        >
          {isMigrating ? 'Migrating...' : `Migrate ${selectedComponents.length} Components`}
        </button>
      </div>

      {migrationResults.length > 0 && (
        <div className="skin-test-harness__migration-results">
          <h5>Migration Results</h5>
          <div className="skin-test-harness__results-summary">
            <span>Success: {migrationResults.filter(r => r.success).length}</span>
            <span>Failed: {migrationResults.filter(r => !r.success).length}</span>
            <span>Total Time: {migrationResults.reduce((sum, r) => sum + r.migrationTime, 0).toFixed(2)}ms</span>
          </div>
          <div className="skin-test-harness__results-details">
            {migrationResults.map((result) => (
              <div
                key={result.componentId}
                className={`skin-test-harness__migration-result skin-test-harness__migration-result--${result.success ? 'success' : 'error'}`}
              >
                <div className="skin-test-harness__result-header">
                  <span>{result.componentId}</span>
                  <span>{result.success ? '✓' : '✗'}</span>
                  <span>{result.migrationTime.toFixed(2)}ms</span>
                </div>
                {result.errors.length > 0 && (
                  <div className="skin-test-harness__result-errors">
                    {result.errors.map((error, index) => (
                      <div key={index} className="skin-test-harness__error-item">{error}</div>
                    ))}
                  </div>
                )}
                {result.warnings.length > 0 && (
                  <div className="skin-test-harness__result-warnings">
                    {result.warnings.map((warning, index) => (
                      <div key={index} className="skin-test-harness__warning-item">{warning}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN TEST HARNESS COMPONENT
// ============================================================================

const SkinTestHarness: React.FC<TestHarnessConfig> = ({
  showAdvanced = false,
  enableMonitoring = true,
  showMigrationTools = true,
  showComponentTesting = true,
  showPerformanceMetrics = true,
  updateInterval = 1000,
  maxLogEntries = 50,
}) => {
  const api = useMemo(() => getSkinReplacementAPI_TS003(), []);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [selectedTestSuites, setSelectedTestSuites] = useState<ComponentId[]>([]);
  const testSuites = useMemo(() => createTestSuites(), []);

  // Update monitoring data
  useEffect(() => {
    if (!enableMonitoring) return;

    const interval = setInterval(() => {
      // Update monitoring data here
    }, updateInterval);

    return () => clearInterval(interval);
  }, [enableMonitoring, updateInterval]);

  // Test execution
  const runTestSuite = useCallback(async (componentId: ComponentId) => {
    const suite = testSuites.find(s => s.componentId === componentId);
    if (!suite) return;

    const results: TestResult[] = [];

    for (const test of suite.tests) {
      const testId = `${componentId}-${test.name}`;
      const startTime = performance.now();

      setTestResults(prev => [
        ...prev.filter(r => r.id !== testId),
        {
          id: testId,
          componentId,
          testName: test.name,
          status: 'running',
          startTime,
        },
      ]);

      try {
        const result = await test.test(api);
        const endTime = performance.now();
        const duration = endTime - startTime;

        setTestResults(prev => [
          ...prev.filter(r => r.id !== testId),
          {
            id: testId,
            componentId,
            testName: test.name,
            status: result ? 'passed' : 'failed',
            startTime,
            endTime,
            duration,
            error: result ? undefined : 'Test assertion failed',
          },
        ]);
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        setTestResults(prev => [
          ...prev.filter(r => r.id !== testId),
          {
            id: testId,
            componentId,
            testName: test.name,
            status: 'failed',
            startTime,
            endTime,
            duration,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        ]);
      }

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }, [api, testSuites]);

  const runSelectedTests = useCallback(async () => {
    setIsRunningTests(true);
    setTestResults([]);

    for (const componentId of selectedTestSuites) {
      await runTestSuite(componentId);
    }

    setIsRunningTests(false);
  }, [selectedTestSuites, runTestSuite]);

  const handleTestSuiteToggle = useCallback((componentId: ComponentId) => {
    setSelectedTestSuites(prev =>
      prev.includes(componentId)
        ? prev.filter(id => id !== componentId)
        : [...prev, componentId]
    );
  }, []);

  const clearTestResults = useCallback(() => {
    setTestResults([]);
  }, []);

  return (
    <div className="skin-test-harness">
      <div className="skin-test-harness__header">
        <h2>TS-Series Skin System Test Harness</h2>
        <div className="skin-test-harness__header-actions">
          <button
            onClick={() => setActiveTab('devtools')}
            className="skin-test-harness__button skin-test-harness__button--small"
          >
            Open DevTools
          </button>
        </div>
      </div>

      <div className="skin-test-harness__tabs">
        <button
          className={`skin-test-harness__tab ${activeTab === 'overview' ? 'skin-test-harness__tab--active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        {showComponentTesting && (
          <button
            className={`skin-test-harness__tab ${activeTab === 'testing' ? 'skin-test-harness__tab--active' : ''}`}
            onClick={() => setActiveTab('testing')}
          >
            Component Testing
          </button>
        )}
        {showMigrationTools && (
          <button
            className={`skin-test-harness__tab ${activeTab === 'migration' ? 'skin-test-harness__tab--active' : ''}`}
            onClick={() => setActiveTab('migration')}
          >
            Migration Tools
          </button>
        )}
        {showPerformanceMetrics && (
          <button
            className={`skin-test-harness__tab ${activeTab === 'performance' ? 'skin-test-harness__tab--active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            Performance
          </button>
        )}
        {showAdvanced && (
          <button
            className={`skin-test-harness__tab ${activeTab === 'advanced' ? 'skin-test-harness__tab--active' : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            Advanced
          </button>
        )}
      </div>

      <div className="skin-test-harness__content">
        {activeTab === 'overview' && (
          <div className="skin-test-harness__overview">
            <h3>System Overview</h3>
            <div className="skin-test-harness__overview-grid">
              <div className="skin-test-harness__overview-card">
                <h4>TS-Series Status</h4>
                <div className="skin-test-harness__status-list">
                  <div className="skin-test-harness__status-item skin-test-harness__status-item--success">
                    TS-001: Core Schema & Manager ✓
                  </div>
                  <div className="skin-test-harness__status-item skin-test-harness__status-item--success">
                    TS-002: SkinSlot & Hook Integration ✓
                  </div>
                  <div className="skin-test-harness__status-item skin-test-harness__status-item--success">
                    TS-003: SkinReplacementAPI & DevTools ✓
                  </div>
                  <div className="skin-test-harness__status-item skin-test-harness__status-item--success">
                    TS-004: Component Integration & Test Harness ✓
                  </div>
                </div>
              </div>

              <div className="skin-test-harness__overview-card">
                <h4>System Health</h4>
                <div className="skin-test-harness__health-metrics">
                  <div className="skin-test-harness__metric">
                    <span className="skin-test-harness__metric-label">Registered Components:</span>
                    <span className="skin-test-harness__metric-value">
                      {api.getCurrentState().activeBindings ? Object.keys(api.getCurrentState().activeBindings).length : 0}
                    </span>
                  </div>
                  <div className="skin-test-harness__metric">
                    <span className="skin-test-harness__metric-label">Current Preset:</span>
                    <span className="skin-test-harness__metric-value">{api.getCurrentState().currentPreset}</span>
                  </div>
                  <div className="skin-test-harness__metric">
                    <span className="skin-test-harness__metric-label">System Updates:</span>
                    <span className="skin-test-harness__metric-value">{api.getCurrentState().updateCount}</span>
                  </div>
                </div>
              </div>

              <div className="skin-test-harness__overview-card">
                <h4>Quick Actions</h4>
                <div className="skin-test-harness__quick-actions">
                  <button
                    onClick={() => setActiveTab('testing')}
                    className="skin-test-harness__button"
                  >
                    Run Component Tests
                  </button>
                  <button
                    onClick={() => setActiveTab('migration')}
                    className="skin-test-harness__button"
                  >
                    Open Migration Tools
                  </button>
                  <button
                    onClick={() => setActiveTab('devtools')}
                    className="skin-test-harness__button"
                  >
                    Open DevTools
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'testing' && showComponentTesting && (
          <div className="skin-test-harness__testing">
            <div className="skin-test-harness__testing-controls">
              <h3>Component Testing</h3>
              <div className="skin-test-harness__test-selection">
                <label>Select Test Suites:</label>
                <div className="skin-test-harness__test-suites">
                  {testSuites.map((suite) => (
                    <label key={suite.componentId} className="skin-test-harness__checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedTestSuites.includes(suite.componentId)}
                        onChange={() => handleTestSuiteToggle(suite.componentId)}
                      />
                      {suite.componentId} ({suite.tests.length} tests)
                    </label>
                  ))}
                </div>
              </div>

              <div className="skin-test-harness__test-actions">
                <button
                  onClick={runSelectedTests}
                  disabled={isRunningTests || selectedTestSuites.length === 0}
                  className="skin-test-harness__button skin-test-harness__button--primary"
                >
                  {isRunningTests ? 'Running Tests...' : `Run ${selectedTestSuites.length} Test Suites`}
                </button>
                <button
                  onClick={clearTestResults}
                  className="skin-test-harness__button skin-test-harness__button--secondary"
                >
                  Clear Results
                </button>
              </div>
            </div>

            <TestResultsViewer results={testResults} onClearResults={clearTestResults} />
          </div>
        )}

        {activeTab === 'migration' && showMigrationTools && (
          <div className="skin-test-harness__migration">
            <MigrationTool api={api} />
          </div>
        )}

        {activeTab === 'performance' && showPerformanceMetrics && (
          <div className="skin-test-harness__performance">
            <h3>Performance Metrics</h3>
            <div className="skin-test-harness__performance-content">
              <div className="skin-test-harness__metrics-overview">
                <h4>System Performance</h4>
                <div className="skin-test-harness__metrics-grid">
                  {Object.entries(api.getPerformanceMetrics()).map(([name, value]) => (
                    <div key={name} className="skin-test-harness__metric-item">
                      <div className="skin-test-harness__metric-name">{name}</div>
                      <div className="skin-test-harness__metric-value">{value.toFixed(2)}ms</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="skin-test-harness__debug-log">
                <h4>Recent Debug Log</h4>
                <div className="skin-test-harness__log-entries">
                  {api.getDebugLog(20).map((entry, index) => (
                    <div key={index} className={`skin-test-harness__log-entry skin-test-harness__log-entry--${entry.success ? 'success' : 'error'}`}>
                      <span className="skin-test-harness__log-timestamp">{entry.timestamp}</span>
                      <span className="skin-test-harness__log-action">{entry.action}</span>
                      {entry.error && <span className="skin-test-harness__log-error">{entry.error}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'devtools' && (
          <div className="skin-test-harness__devtools">
            <SkinDevTools_TS003
              showAdvanced={showAdvanced}
              showPerformance={showPerformanceMetrics}
              showHotReload={true}
              showInspection={true}
              showReplacementAPI={true}
              maxDebugEntries={maxDebugEntries}
            />
          </div>
        )}

        {activeTab === 'advanced' && showAdvanced && (
          <div className="skin-test-harness__advanced">
            <h3>Advanced Tools</h3>
            <div className="skin-test-harness__advanced-content">
              <div className="skin-test-harness__advanced-section">
                <h4>System Diagnostics</h4>
                <div className="skin-test-harness__diagnostic-actions">
                  <button
                    onClick={() => api.clearDebugLog()}
                    className="skin-test-harness__button"
                  >
                    Clear Debug Log
                  </button>
                  <button
                    onClick={() => {
                      const state = api.exportSkinState();
                      console.log('Skin State Export:', state);
                    }}
                    className="skin-test-harness__button"
                  >
                    Export State to Console
                  </button>
                  <button
                    onClick={() => {
                      const inspections = api.inspectAllComponents();
                      console.log('Component Inspections:', inspections);
                    }}
                    className="skin-test-harness__button"
                  >
                    Inspect All Components
                  </button>
                </div>
              </div>

              <div className="skin-test-harness__advanced-section">
                <h4>Integration Patterns</h4>
                <div className="skin-test-harness__patterns-list">
                  {ComponentIntegrationPatterns.map((pattern, index) => (
                    <div key={index} className="skin-test-harness__pattern-item">
                      <h5>{pattern.name}</h5>
                      <p>{pattern.description}</p>
                      <div className="skin-test-harness__pattern-meta">
                        <span>Complexity: {pattern.complexity}</span>
                        <span>Effort: {pattern.migrationEffort}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

SkinTestHarness.displayName = 'SkinTestHarness';

export default SkinTestHarness;
