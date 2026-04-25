/**
 * Skin Test Controls
 * 
 * Control panel for skin system test harness with scenario management,
 * test execution controls, and results visualization.
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { 
  SkinTestScenario, 
  SkinTestResults, 
  ComponentTestConfig,
  TestExpectation,
} from './SkinTestHarness';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { StyleLabStack } from '@/ui/styleLab/StyleLabStack';
import { useMinimalStyleLabTokens } from '../hooks/useMinimalStyleLabTokens';

// ============================================================================
// TEST CONTROLS TYPES
// ============================================================================

export interface SkinTestControlsProps {
  /**
   * Available test scenarios
   */
  scenarios: SkinTestScenario[];
  
  /**
   * Current scenario index
   */
  currentScenarioIndex: number;
  
  /**
   * Whether tests are currently running
   */
  isRunning: boolean;
  
  /**
   * Whether tests are paused
   */
  isPaused: boolean;
  
  /**
   * Test statistics
   */
  testStats: {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    totalDuration: number;
    averageDuration: number;
  };
  
  /**
   * All test results
   */
  testResults: SkinTestResults[];
  
  /**
   * Current test results
   */
  currentResults: SkinTestResults | null;
  
  /**
   * Callback to run all tests
   */
  onRunAll: () => void;
  
  /**
   * Callback to run single scenario
   */
  onRunScenario: (scenario: SkinTestScenario) => Promise<void>;
  
  /**
   * Callback to pause tests
   */
  onPause: () => void;
  
  /**
   * Callback to resume tests
   */
  onResume: () => void;
  
  /**
   * Callback to reset tests
   */
  onReset: () => void;
  
  /**
   * Callback to change scenario
   */
  onScenarioChange: (index: number) => void;
  
  /**
   * Custom className
   */
  className?: string;
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

interface TestProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

const TestProgressBar: React.FC<TestProgressBarProps> = ({
  current,
  total,
  className,
}) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  
  return (
    <div className={`skin-test-progress-bar ${className || ''}`}>
      <div className="skin-test-progress-track">
        <div 
          className="skin-test-progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="skin-test-progress-text">
        {current} / {total} ({percentage.toFixed(1)}%)
      </div>
    </div>
  );
};

interface TestResultSummaryProps {
  results: SkinTestResults[];
  className?: string;
}

const TestResultSummary: React.FC<TestResultSummaryProps> = ({
  results,
  className,
}) => {
  const stats = useMemo(() => {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    
    return {
      total: results.length,
      passed,
      failed,
      passRate: results.length > 0 ? (passed / results.length) * 100 : 0,
      totalDuration,
    };
  }, [results]);
  
  return (
    <div className={`skin-test-result-summary ${className || ''}`}>
      <div className="skin-test-summary-stats">
        <div className="skin-test-summary-item">
          <span className="skin-test-summary-label">Total:</span>
          <span className="skin-test-summary-value">{stats.total}</span>
        </div>
        <div className="skin-test-summary-item passed">
          <span className="skin-test-summary-label">Passed:</span>
          <span className="skin-test-summary-value">{stats.passed}</span>
        </div>
        <div className="skin-test-summary-item failed">
          <span className="skin-test-summary-label">Failed:</span>
          <span className="skin-test-summary-value">{stats.failed}</span>
        </div>
        <div className="skin-test-summary-item">
          <span className="skin-test-summary-label">Pass Rate:</span>
          <span className="skin-test-summary-value">{stats.passRate.toFixed(1)}%</span>
        </div>
        <div className="skin-test-summary-item">
          <span className="skin-test-summary-label">Duration:</span>
          <span className="skin-test-summary-value">{stats.totalDuration.toFixed(0)}ms</span>
        </div>
      </div>
    </div>
  );
};

interface ScenarioCardProps {
  scenario: SkinTestScenario;
  isActive: boolean;
  hasResults: boolean;
  results?: SkinTestResults;
  onSelect: () => void;
  onRun: () => void;
  disabled?: boolean;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  isActive,
  hasResults,
  results,
  onSelect,
  onRun,
  disabled = false,
}) => {
  const status = useMemo(() => {
    if (!hasResults) return 'pending';
    if (results?.passed) return 'passed';
    return 'failed';
  }, [hasResults, results]);
  
  return (
    <div 
      className={`skin-test-scenario-card ${isActive ? 'active' : ''} ${status}`}
      onClick={onSelect}
    >
      <div className="skin-test-scenario-header">
        <h4>{scenario.name}</h4>
        <div className={`skin-test-scenario-status ${status}`}>
          {status === 'pending' && '⏳'}
          {status === 'passed' && '✓'}
          {status === 'failed' && '✗'}
        </div>
      </div>
      
      <p className="skin-test-scenario-description">{scenario.description}</p>
      
      <div className="skin-test-scenario-setup">
        <div className="skin-test-scenario-setup-item">
          <span>Preset:</span>
          <span>{scenario.setup.presetId}</span>
        </div>
        <div className="skin-test-scenario-setup-item">
          <span>Pillar:</span>
          <span>{scenario.setup.pillar}</span>
        </div>
        <div className="skin-test-scenario-setup-item">
          <span>Motion:</span>
          <span>{scenario.setup.motionLevel}</span>
        </div>
      </div>
      
      <div className="skin-test-scenario-components">
        <span>Components: {scenario.components.length}</span>
        <span>Expectations: {scenario.expectations.length}</span>
      </div>
      
      {results && (
        <div className="skin-test-scenario-results">
          <span>Duration: {results.duration.toFixed(0)}ms</span>
          {results.errors.length > 0 && (
            <span className="skin-test-scenario-errors">
              {results.errors.length} errors
            </span>
          )}
        </div>
      )}
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRun();
        }}
        disabled={disabled}
        className="skin-test-scenario-run-btn"
      >
        Run
      </button>
    </div>
  );
};

interface CurrentResultsProps {
  results: SkinTestResults | null;
  className?: string;
}

const CurrentResults: React.FC<CurrentResultsProps> = ({
  results,
  className,
}) => {
  if (!results) {
    return (
      <div className={`skin-test-current-results ${className || ''}`}>
        <h4>Current Results</h4>
        <p>No results available</p>
      </div>
    );
  }
  
  const passedExpectations = results.expectations.filter(exp => exp.passed).length;
  const failedExpectations = results.expectations.filter(exp => !exp.passed).length;
  
  return (
    <div className={`skin-test-current-results ${className || ''}`}>
      <div className="skin-test-current-results-header">
        <h4>{results.scenarioName}</h4>
        <div className={`skin-test-current-results-status ${results.passed ? 'passed' : 'failed'}`}>
          {results.passed ? '✓ PASSED' : '✗ FAILED'}
        </div>
      </div>
      
      <div className="skin-test-current-results-summary">
        <div className="skin-test-current-results-item">
          <span>Duration:</span>
          <span>{results.duration.toFixed(0)}ms</span>
        </div>
        <div className="skin-test-current-results-item">
          <span>Expectations:</span>
          <span>{passedExpectations}/{results.expectations.length} passed</span>
        </div>
        <div className="skin-test-current-results-item">
          <span>Errors:</span>
          <span>{results.errors.length}</span>
        </div>
        <div className="skin-test-current-results-item">
          <span>Warnings:</span>
          <span>{results.warnings.length}</span>
        </div>
      </div>
      
      {results.errors.length > 0 && (
        <div className="skin-test-current-results-errors">
          <h5>Errors</h5>
          {results.errors.map((error, index) => (
            <div key={index} className="skin-test-current-results-error">
              {error}
            </div>
          ))}
        </div>
      )}
      
      {results.expectations.length > 0 && (
        <div className="skin-test-current-results-expectations">
          <h5>Expectations</h5>
          <div className="skin-test-expectations-list">
            {results.expectations.map((exp, index) => (
              <div key={index} className={`skin-test-expectation-item ${exp.passed ? 'passed' : 'failed'}`}>
                <div className="skin-test-expectation-header">
                  <span className="skin-test-expectation-type">{exp.type}</span>
                  <span className="skin-test-expectation-target">{exp.target}</span>
                  <span className={`skin-test-expectation-status ${exp.passed ? 'passed' : 'failed'}`}>
                    {exp.passed ? '✓' : '✗'}
                  </span>
                </div>
                <div className="skin-test-expectation-details">
                  <div>Expected: {JSON.stringify(exp.expected)}</div>
                  <div>Actual: {JSON.stringify(exp.actual)}</div>
                  {exp.error && (
                    <div className="skin-test-expectation-error">{exp.error}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN TEST CONTROLS COMPONENT
// ============================================================================

export const SkinTestControls: React.FC<SkinTestControlsProps> = ({
  scenarios,
  currentScenarioIndex,
  isRunning,
  isPaused,
  testStats,
  testResults,
  currentResults,
  onRunAll,
  onRunScenario,
  onPause,
  onResume,
  onReset,
  onScenarioChange,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'scenarios' | 'results' | 'current'>('scenarios');
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);
  
  const tokens = useMinimalStyleLabTokens();
  
  const currentScenario = scenarios[currentScenarioIndex];
  
  // Event handlers
  const handleScenarioSelect = useCallback((index: number) => {
    onScenarioChange(index);
  }, [onScenarioChange]);
  
  const handleRunScenario = useCallback(async (scenario: SkinTestScenario) => {
    const index = scenarios.findIndex(s => s.id === scenario.id);
    if (index !== -1) {
      onScenarioChange(index);
      await onRunScenario(scenario);
    }
  }, [scenarios, onScenarioChange, onRunScenario]);
  
  const handleRunAll = useCallback(() => {
    onRunAll();
  }, [onRunAll]);
  
  const handlePause = useCallback(() => {
    onPause();
  }, [onPause]);
  
  const handleResume = useCallback(() => {
    onResume();
  }, [onResume]);
  
  const handleReset = useCallback(() => {
    onReset();
    setActiveTab('scenarios');
    setExpandedScenario(null);
  }, [onReset]);
  
  const toggleScenarioExpansion = useCallback((scenarioId: string) => {
    setExpandedScenario(prev => prev === scenarioId ? null : scenarioId);
  }, []);
  
  // Get results for scenario
  const getScenarioResults = useCallback((scenarioId: string) => {
    return testResults.find(r => r.scenarioId === scenarioId);
  }, [testResults]);
  
  return (
    <StyleLabSurface className={`skin-test-controls ${className || ''}`}>
      <StyleLabStack spacing="md">
        {/* Header Controls */}
        <div className="skin-test-controls-header">
          <h3>Test Controls</h3>
          
          <div className="skin-test-controls-actions">
            {!isRunning && (
              <>
                <button onClick={handleRunAll} className="skin-test-btn primary">
                  Run All Tests
                </button>
                <button onClick={handleReset} className="skin-test-btn secondary">
                  Reset
                </button>
              </>
            )}
            
            {isRunning && !isPaused && (
              <button onClick={handlePause} className="skin-test-btn warning">
                Pause
              </button>
            )}
            
            {isRunning && isPaused && (
              <button onClick={handleResume} className="skin-test-btn primary">
                Resume
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {(isRunning || testResults.length > 0) && (
          <TestProgressBar
            current={testResults.length}
            total={scenarios.length}
          />
        )}

        {/* Test Statistics */}
        {(testResults.length > 0 || isRunning) && (
          <TestResultSummary results={testResults} />
        )}

        {/* Tab Navigation */}
        <div className="skin-test-controls-tabs">
          <button
            className={`skin-test-tab ${activeTab === 'scenarios' ? 'active' : ''}`}
            onClick={() => setActiveTab('scenarios')}
          >
            Scenarios ({scenarios.length})
          </button>
          <button
            className={`skin-test-tab ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
            disabled={testResults.length === 0}
          >
            Results ({testResults.length})
          </button>
          <button
            className={`skin-test-tab ${activeTab === 'current' ? 'active' : ''}`}
            onClick={() => setActiveTab('current')}
            disabled={!currentResults}
          >
            Current
          </button>
        </div>

        {/* Tab Content */}
        <div className="skin-test-controls-content">
          {activeTab === 'scenarios' && (
            <div className="skin-test-scenarios">
              <div className="skin-test-scenarios-list">
                {scenarios.map((scenario, index) => {
                  const results = getScenarioResults(scenario.id);
                  const isExpanded = expandedScenario === scenario.id;
                  
                  return (
                    <ScenarioCard
                      key={scenario.id}
                      scenario={scenario}
                      isActive={index === currentScenarioIndex}
                      hasResults={!!results}
                      results={results}
                      onSelect={() => handleScenarioSelect(index)}
                      onRun={() => handleRunScenario(scenario)}
                      disabled={isRunning}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="skin-test-results">
              {testResults.length === 0 ? (
                <p>No test results available</p>
              ) : (
                <div className="skin-test-results-list">
                  {testResults.map((result) => (
                    <div key={result.scenarioId} className={`skin-test-result-item ${result.passed ? 'passed' : 'failed'}`}>
                      <div className="skin-test-result-item-header">
                        <h4>{result.scenarioName}</h4>
                        <div className={`skin-test-result-status ${result.passed ? 'passed' : 'failed'}`}>
                          {result.passed ? '✓ PASSED' : '✗ FAILED'}
                        </div>
                      </div>
                      
                      <div className="skin-test-result-item-summary">
                        <span>Duration: {result.duration.toFixed(0)}ms</span>
                        <span>Expectations: {result.expectations.filter(e => e.passed).length}/{result.expectations.length}</span>
                        <span>Errors: {result.errors.length}</span>
                      </div>
                      
                      {result.errors.length > 0 && (
                        <details className="skin-test-result-errors">
                          <summary>Errors ({result.errors.length})</summary>
                          {result.errors.map((error, index) => (
                            <div key={index} className="skin-test-result-error">{error}</div>
                          ))}
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'current' && (
            <CurrentResults results={currentResults} />
          )}
        </div>

        {/* Current Scenario Info */}
        {currentScenario && (
          <div className="skin-test-current-scenario">
            <h4>Current Scenario</h4>
            <div className="skin-test-current-scenario-info">
              <div className="skin-test-current-scenario-name">
                {currentScenario.name}
              </div>
              <div className="skin-test-current-scenario-description">
                {currentScenario.description}
              </div>
              <div className="skin-test-current-scenario-setup">
                <div>Preset: {currentScenario.setup.presetId}</div>
                <div>Pillar: {currentScenario.setup.pillar}</div>
                <div>Motion: {currentScenario.setup.motionLevel}</div>
              </div>
            </div>
          </div>
        )}
      </StyleLabStack>
    </StyleLabSurface>
  );
};

export default SkinTestControls;
