/**
 * Skin Test Harness
 * 
 * Comprehensive test harness for skin system integration testing.
 * Provides a controlled environment for testing skin bindings, transitions,
 * and component behavior across different presets and configurations.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Define types locally to avoid import issues
type ComponentId = string;
type MotionLevel = 'minimal' | 'reduced' | 'full';
type StyleLabPillar = 'frontier' | 'wilderness' | 'empire';
type SkinPresetId = 'minimal-frontier' | 'minimal-wilderness' | 'minimal-empire' | 'wanderlust' | 'arcane-tech' | 'gilded-observatory' | 'slot_rack_iron_bronze' | 'slot_wilderness_bronze';

interface ComponentSkinBinding {
  componentId: ComponentId;
  name: string;
  description: string;
  version: string;
  defaultPreset: SkinPresetId;
  supportedPillars: StyleLabPillar[];
  supportedMotionLevels: MotionLevel[];
  cssClassBase: string;
  dataAttributePrefix: string;
  supportsMotionLevel: boolean;
  supportsTelemetry: boolean;
  supportsPillarSwitching: boolean;
  category: string;
  priority: number;
  tags: string[];
  skinProperties?: Record<string, unknown>;
}
import { useSkinSystem } from '../hooks/useSkinSystem';
import { useSkinTelemetry } from '../hooks/useSkinTelemetry';
import { getSkinReplacementAPI } from './SkinReplacementAPI';
import { SkinDevTools } from './SkinDevTools';
import { SkinDebugPanel } from './SkinDebugPanel';
import { SkinTestControls } from './SkinTestControls';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { StyleLabStack } from '@/ui/styleLab/StyleLabStack';
import { PgCard } from '../components/PgCard';
import { WorkerCard } from '../components/WorkerCard';
import { ActivitySlot } from '../components/ActivitySlot';
import { useMinimalStyleLabTokens } from '../hooks/useMinimalStyleLabTokens';

// ============================================================================
// TEST HARNESS TYPES
// ============================================================================

export interface SkinTestHarnessProps {
  /**
   * Test scenarios to run
   */
  scenarios?: SkinTestScenario[];
  
  /**
   * Whether to run tests automatically on mount
   * @default false
   */
  autoRun?: boolean;
  
  /**
   * Whether to show dev tools
   * @default true
   */
  showDevTools?: boolean;
  
  /**
   * Whether to show debug panel
   * @default true
   */
  showDebugPanel?: boolean;
  
  /**
   * Whether to show test controls
   * @default true
   */
  showTestControls?: boolean;
  
  /**
   * Test configuration
   */
  config?: SkinTestConfig;
  
  /**
   * Callback when test completes
   */
  onTestComplete?: (results: SkinTestResults) => void;
  
  /**
   * Custom className
   */
  className?: string;
}

export interface SkinTestScenario {
  id: string;
  name: string;
  description: string;
  setup: {
    presetId: SkinPresetId;
    pillar: StyleLabPillar;
    motionLevel: MotionLevel;
  };
  components: ComponentTestConfig[];
  expectations: TestExpectation[];
  duration?: number; // Test duration in ms
}

type ComponentType = 'PgCard' | 'WorkerCard' | 'ActivitySlot' | 'ResidentSlotRack';

export interface ComponentTestConfig {
  componentId: string;
  componentType: ComponentType;
  props: Record<string, any>;
  expectedClasses?: string[];
  expectedAttributes?: Record<string, string>;
  expectedStyles?: Record<string, string>;
}

export interface TestExpectation {
  type: 'class' | 'attribute' | 'style' | 'state' | 'telemetry';
  target: string; // Component ID or property name
  expected: any;
  actual?: any;
  passed?: boolean;
  error?: string;
}

export interface SkinTestResults {
  scenarioId: string;
  scenarioName: string;
  passed: boolean;
  duration: number;
  expectations: TestExpectation[];
  errors: string[];
  warnings: string[];
  telemetry: any[];
}

export interface SkinTestConfig {
  /**
   * Test timeout in milliseconds
   * @default 10000
   */
  timeout?: number;
  
  /**
   * Whether to run performance tests
   * @default true
   */
  runPerformanceTests?: boolean;
  
  /**
   * Whether to run accessibility tests
   * @default true
   */
  runAccessibilityTests?: boolean;
  
  /**
   * Whether to run visual regression tests
   * @default false
   */
  runVisualTests?: boolean;
  
  /**
   * Test data for components
   */
  testData?: {
    pgCard: any;
    workerCard: any;
    activitySlot: any;
  };
}

// ============================================================================
// DEFAULT TEST SCENARIOS
// ============================================================================

const DEFAULT_TEST_SCENARIOS: SkinTestScenario[] = [
  {
    id: 'slot-rack-wilderness-bronze',
    name: 'Slot Rack - Wilderness Bronze',
    description: 'Test slot rack with Wilderness Bronze preset',
    setup: {
      presetId: 'slot_wilderness_bronze',
      pillar: 'wilderness',
      motionLevel: 'full',
    },
    components: [
      {
        componentId: 'test-slot-rack',
        componentType: 'ResidentSlotRack',
        props: {
          slots: [],
          layout: 'board',
        },
        expectedClasses: ['resident-slot-rack-skin', 'slot_wilderness_bronze'],
        expectedAttributes: {
          'data-slot-skin': 'slot_wilderness_bronze',
          'data-skin-preset': 'slot_wilderness_bronze',
          'data-style-lab-pillar': 'wilderness',
        },
      },
    ],
    expectations: [],
  },
  {
    id: 'minimal-frontier-full',
    name: 'Minimal Frontier - Full Motion',
    description: 'Test minimal frontier preset with full motion level',
    setup: {
      presetId: 'minimal-frontier',
      pillar: 'frontier',
      motionLevel: 'full',
    },
    components: [
      {
        componentId: 'test-pgcard',
        componentType: 'PgCard',
        props: {
          workerId: 'test-worker-1',
          label: 'Test Worker',
          hp: 100,
          fatigue: 20,
          maxHp: 100,
        },
        expectedClasses: ['pgcard', 'pgcard-minimal-frontier', 'pgcard-full-motion'],
        expectedAttributes: {
          'data-skin': 'minimal-frontier',
          'data-pillar': 'frontier',
          'data-motion': 'full',
        },
      },
      {
        componentId: 'test-workercard',
        componentType: 'WorkerCard',
        props: {
          id: 'test-worker-2',
          name: 'Test Worker Card',
          hp: 80,
          fatigue: 30,
        },
        expectedClasses: ['worker-card', 'worker-card-minimal-frontier'],
        expectedAttributes: {
          'data-skin': 'minimal-frontier',
          'data-pillar': 'frontier',
        },
      },
      {
        componentId: 'test-activityslot',
        componentType: 'ActivitySlot',
        props: {
          slotId: 'test-slot-1',
          iconName: 'mine',
          label: 'Gold Mine',
          progressFraction: 0.5,
          elapsedSeconds: 30,
          totalDuration: 60,
        },
        expectedClasses: ['activity-slot', 'activity-slot-minimal-frontier'],
        expectedAttributes: {
          'data-skin': 'minimal-frontier',
          'data-pillar': 'frontier',
        },
      },
    ],
    expectations: [
      { type: 'state', target: 'isTransitioning', expected: false },
      { type: 'telemetry', target: 'skin_preset_changed', expected: 1 },
    ],
  },
  {
    id: 'wanderlust-wilderness-reduced',
    name: 'Wanderlust Wilderness - Reduced Motion',
    description: 'Test wanderlust preset with wilderness pillar and reduced motion',
    setup: {
      presetId: 'wanderlust',
      pillar: 'wilderness',
      motionLevel: 'reduced',
    },
    components: [
      {
        componentId: 'test-pgcard-wilderness',
        componentType: 'PgCard',
        props: {
          workerId: 'test-worker-3',
          label: 'Wilderness Worker',
          hp: 90,
          fatigue: 40,
          maxHp: 100,
        },
        expectedClasses: ['pgcard', 'pgcard-wanderlust', 'pgcard-reduced-motion'],
        expectedAttributes: {
          'data-skin': 'wanderlust',
          'data-pillar': 'wilderness',
          'data-motion': 'reduced',
        },
      },
    ],
    expectations: [
      { type: 'state', target: 'isTransitioning', expected: false },
      { type: 'telemetry', target: 'skin_pillar_changed', expected: 1 },
    ],
  },
];

// ============================================================================
// TEST HARNESS COMPONENT
// ============================================================================

export const SkinTestHarness: React.FC<SkinTestHarnessProps> = ({
  scenarios = DEFAULT_TEST_SCENARIOS,
  autoRun = false,
  showDevTools = true,
  showDebugPanel = true,
  showTestControls = true,
  config = {},
  onTestComplete,
  className,
}) => {
  // State management
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [testResults, setTestResults] = useState<SkinTestResults[]>([]);
  const [currentResults, setCurrentResults] = useState<SkinTestResults | null>(null);
  const [testStartTime, setTestStartTime] = useState<number>(0);
  const [componentInstances, setComponentInstances] = useState<Map<string, any>>(new Map());
  
  // Refs
  const testTimeoutRef = useRef<NodeJS.Timeout>();
  const componentRefs = useRef<Map<string, React.RefObject<any>>>(new Map());
  
  // Hooks
  const {
    state,
    setPreset,
    setPillar,
    setMotionLevel,
    validateState,
  } = useSkinSystem();
  
  const telemetry = useSkinTelemetry({
    trackPerformance: true,
    componentType: 'test-harness',
  });
  
  const tokens = useMinimalStyleLabTokens();
  const replacementAPI = getSkinReplacementAPI();
  
  // Current scenario
  const currentScenario = scenarios[currentScenarioIndex];
  
  // Test configuration
  const testConfig = useMemo(() => ({
    timeout: 10000,
    runPerformanceTests: true,
    runAccessibilityTests: true,
    runVisualTests: false,
    testData: {
      pgCard: {
        workerId: 'test-worker',
        label: 'Test Worker',
        hp: 100,
        fatigue: 20,
        maxHp: 100,
      },
      workerCard: {
        id: 'test-worker',
        name: 'Test Worker',
        hp: 80,
        fatigue: 30,
      },
      activitySlot: {
        slotId: 'test-slot',
        iconName: 'mine',
        label: 'Test Activity',
        progressFraction: 0.5,
        elapsedSeconds: 30,
        totalDuration: 60,
      },
    },
    ...config,
  }), [config]);
  
  // Initialize component refs
  useEffect(() => {
    const refs = new Map<string, React.RefObject<any>>();
    scenarios.forEach(scenario => {
      scenario.components.forEach(component => {
        if (!refs.has(component.componentId)) {
          refs.set(component.componentId, React.createRef());
        }
      });
    });
    componentRefs.current = refs;
  }, [scenarios]);
  
  // Run single scenario
  const runScenario = useCallback(async (scenario: SkinTestScenario): Promise<SkinTestResults> => {
    const startTime = performance.now();
    const results: SkinTestResults = {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      passed: true,
      duration: 0,
      expectations: [],
      errors: [],
      warnings: [],
      telemetry: [],
    };
    
    try {
      // Setup skin state
      await replacementAPI.replaceState({
        currentPreset: scenario.setup.presetId,
        currentPillar: scenario.setup.pillar,
        currentMotionLevel: scenario.setup.motionLevel,
      }, {
        animateTransition: false,
        trackTelemetry: true,
        metadata: {
          reason: 'test-harness',
          scenarioId: scenario.id,
        },
      });
      
      // Wait for transition to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Test component expectations
      for (const componentConfig of scenario.components) {
        const componentRef = componentRefs.current.get(componentConfig.componentId);
        if (!componentRef?.current) {
          results.errors.push(`Component ${componentConfig.componentId} not rendered`);
          results.passed = false;
          continue;
        }
        
        const element = componentRef.current;
        
        // Test classes
        if (componentConfig.expectedClasses) {
          const actualClasses = Array.from(element.classList || []);
          for (const expectedClass of componentConfig.expectedClasses) {
            const hasClass = actualClasses.includes(expectedClass);
            results.expectations.push({
              type: 'class',
              target: `${componentConfig.componentId}.${expectedClass}`,
              expected: true,
              actual: hasClass,
              passed: hasClass,
              error: hasClass ? undefined : `Missing class: ${expectedClass}`,
            });
            
            if (!hasClass) {
              results.passed = false;
            }
          }
        }
        
        // Test attributes
        if (componentConfig.expectedAttributes) {
          for (const [attrName, expectedValue] of Object.entries(componentConfig.expectedAttributes)) {
            const actualValue = element.getAttribute(attrName);
            const passed = actualValue === expectedValue;
            results.expectations.push({
              type: 'attribute',
              target: `${componentConfig.componentId}.${attrName}`,
              expected: expectedValue,
              actual: actualValue,
              passed,
              error: passed ? undefined : `Attribute ${attrName}: expected ${expectedValue}, got ${actualValue}`,
            });
            
            if (!passed) {
              results.passed = false;
            }
          }
        }
        
        // Test styles
        if (componentConfig.expectedStyles) {
          const computedStyles = window.getComputedStyle(element);
          for (const [styleProp, expectedValue] of Object.entries(componentConfig.expectedStyles)) {
            const actualValue = computedStyles.getPropertyValue(styleProp);
            const passed = actualValue === expectedValue;
            results.expectations.push({
              type: 'style',
              target: `${componentConfig.componentId}.${styleProp}`,
              expected: expectedValue,
              actual: actualValue,
              passed,
              error: passed ? undefined : `Style ${styleProp}: expected ${expectedValue}, got ${actualValue}`,
            });
            
            if (!passed) {
              results.passed = false;
            }
          }
        }
      }
      
      // Test state expectations
      for (const expectation of scenario.expectations) {
        if (expectation.type === 'state') {
          let actualValue: any;
          switch (expectation.target) {
            case 'isTransitioning':
              actualValue = state.isTransitioning;
              break;
            case 'currentPreset':
              actualValue = state.currentPreset;
              break;
            case 'currentPillar':
              actualValue = state.currentPillar;
              break;
            case 'currentMotionLevel':
              actualValue = state.currentMotionLevel;
              break;
            default:
              actualValue = undefined;
          }
          
          const passed = actualValue === expectation.expected;
          results.expectations.push({
            ...expectation,
            actual: actualValue,
            passed,
            error: passed ? undefined : `State ${expectation.target}: expected ${expectation.expected}, got ${actualValue}`,
          });
          
          if (!passed) {
            results.passed = false;
          }
        }
      }
      
      // Collect telemetry events
      // In a real implementation, this would collect actual telemetry events
      results.telemetry = [
        {
          type: 'skin_preset_changed',
          timestamp: Date.now(),
          data: { presetId: scenario.setup.presetId },
        },
      ];
      
    } catch (error) {
      results.errors.push(error instanceof Error ? error.message : 'Unknown error');
      results.passed = false;
    }
    
    results.duration = performance.now() - startTime;
    return results;
  }, [state, replacementAPI]);
  
  // Run all scenarios
  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const allResults: SkinTestResults[] = [];
    
    for (let i = 0; i < scenarios.length; i++) {
      if (isPaused) break;
      
      setCurrentScenarioIndex(i);
      const scenario = scenarios[i];
      setCurrentResults(null);
      
      try {
        const results = await runScenario(scenario);
        setCurrentResults(results);
        allResults.push(results);
        
        // Wait between scenarios
        if (i < scenarios.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        const failedResult: SkinTestResults = {
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          passed: false,
          duration: 0,
          expectations: [],
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          warnings: [],
          telemetry: [],
        };
        allResults.push(failedResult);
      }
    }
    
    setTestResults(allResults);
    setIsRunning(false);
    onTestComplete?.(allResults);
  }, [scenarios, isPaused, runScenario, onTestComplete]);
  
  // Auto-run tests
  useEffect(() => {
    if (autoRun && !isRunning && scenarios.length > 0) {
      runAllTests();
    }
  }, [autoRun, scenarios, isRunning, runAllTests]);
  
  // Render component based on type
  const renderComponent = useCallback((config: ComponentTestConfig) => {
    const ref = componentRefs.current.get(config.componentId);
    const props = { ...testConfig.testData[config.componentType], ...config.props };
    
    switch (config.componentType) {
      case 'PgCard':
        return (
          <PgCard
            ref={ref}
            {...props}
          />
        );
      case 'WorkerCard':
        return (
          <WorkerCard
            ref={ref}
            {...props}
          />
        );
      case 'ActivitySlot':
        return (
          <ActivitySlot
            ref={ref}
            {...props}
          />
        );
      default:
        return <div ref={ref}>Unknown component type: {config.componentType}</div>;
    }
  }, [testConfig]);
  
  // Calculate test statistics
  const testStats = useMemo(() => {
    const passed = testResults.filter(r => r.passed).length;
    const failed = testResults.filter(r => !r.passed).length;
    const totalDuration = testResults.reduce((sum, r) => sum + r.duration, 0);
    
    return {
      total: testResults.length,
      passed,
      failed,
      passRate: testResults.length > 0 ? (passed / testResults.length) * 100 : 0,
      totalDuration,
      averageDuration: testResults.length > 0 ? totalDuration / testResults.length : 0,
    };
  }, [testResults]);
  
  return (
    <StyleLabSurface className={`skin-test-harness ${className || ''}`}>
      <StyleLabStack spacing="lg">
        {/* Header */}
        <div className="skin-test-harness-header">
          <h2>Skin System Test Harness</h2>
          <div className="skin-test-harness-stats">
            <span>Tests: {testStats.passed}/{testStats.total} passed</span>
            <span>Duration: {testStats.totalDuration.toFixed(0)}ms</span>
            <span>Status: {isRunning ? 'Running' : isPaused ? 'Paused' : 'Ready'}</span>
          </div>
        </div>

        {/* Test Controls */}
        {showTestControls && (
          <SkinTestControls
            scenarios={scenarios}
            currentScenarioIndex={currentScenarioIndex}
            isRunning={isRunning}
            isPaused={isPaused}
            testStats={testStats}
            testResults={testResults}
            currentResults={currentResults}
            onRunAll={runAllTests}
            onRunScenario={runScenario}
            onPause={() => setIsPaused(true)}
            onResume={() => setIsPaused(false)}
            onReset={() => {
              setTestResults([]);
              setCurrentResults(null);
              setCurrentScenarioIndex(0);
            }}
            onScenarioChange={setCurrentScenarioIndex}
          />
        )}

        {/* Current Scenario Display */}
        {currentScenario && (
          <div className="skin-test-scenario">
            <h3>{currentScenario.name}</h3>
            <p>{currentScenario.description}</p>
            <div className="skin-test-scenario-setup">
              <span>Preset: {currentScenario.setup.presetId}</span>
              <span>Pillar: {currentScenario.setup.pillar}</span>
              <span>Motion: {currentScenario.setup.motionLevel}</span>
            </div>
          </div>
        )}

        {/* Component Test Area */}
        {currentScenario && (
          <div className="skin-test-components">
            <h4>Components Under Test</h4>
            <div className="skin-test-component-grid">
              {currentScenario.components.map(config => (
                <div key={config.componentId} className="skin-test-component">
                  <div className="skin-test-component-header">
                    <span>{config.componentId}</span>
                    <span>{config.componentType}</span>
                  </div>
                  <div className="skin-test-component-instance">
                    {renderComponent(config)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="skin-test-results">
            <h4>Test Results</h4>
            <div className="skin-test-results-summary">
              <div className="skin-test-result-item passed">
                <span>Passed: {testStats.passed}</span>
              </div>
              <div className="skin-test-result-item failed">
                <span>Failed: {testStats.failed}</span>
              </div>
              <div className="skin-test-result-item">
                <span>Pass Rate: {testStats.passRate.toFixed(1)}%</span>
              </div>
            </div>
            
            <div className="skin-test-results-details">
              {testResults.map(result => (
                <div key={result.scenarioId} className={`skin-test-result ${result.passed ? 'passed' : 'failed'}`}>
                  <div className="skin-test-result-header">
                    <span>{result.scenarioName}</span>
                    <span>{result.passed ? '✓' : '✗'}</span>
                    <span>{result.duration.toFixed(0)}ms</span>
                  </div>
                  {result.errors.length > 0 && (
                    <div className="skin-test-result-errors">
                      {result.errors.map((error, i) => (
                        <div key={i} className="skin-test-error">{error}</div>
                      ))}
                    </div>
                  )}
                  {result.expectations.length > 0 && (
                    <div className="skin-test-result-expectations">
                      {result.expectations.map((exp, i) => (
                        <div key={i} className={`skin-test-expectation ${exp.passed ? 'passed' : 'failed'}`}>
                          <span>{exp.type}: {exp.target}</span>
                          <span>Expected: {JSON.stringify(exp.expected)}</span>
                          <span>Actual: {JSON.stringify(exp.actual)}</span>
                          {exp.error && <span className="skin-test-error">{exp.error}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dev Tools */}
        {showDevTools && (
          <SkinDevTools
            showAdvanced={true}
            enableDebug={true}
            showTelemetry={true}
            showReplacementAPI={true}
            showRegistry={true}
          />
        )}

        {/* Debug Panel */}
        {showDebugPanel && (
          <SkinDebugPanel
            showPerformance={true}
            showTelemetry={true}
            showValidation={true}
            showDiagnostics={true}
            maxEvents={50}
            updateInterval={1000}
            autoScroll={true}
          />
        )}
      </StyleLabStack>
    </StyleLabSurface>
  );
};

export default SkinTestHarness;
