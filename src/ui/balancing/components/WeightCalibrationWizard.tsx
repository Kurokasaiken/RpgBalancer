/**
 * Weight Calibration Wizard Component
 * 
 * Step-by-step wizard for calibrating stat weights using Monte Carlo simulations.
 * Provides intuitive UI for configuration, simulation, and results review.
 * 
 * @since NP-121 – Stat Weight Calibration Wizard
 */

import React, { useState, useEffect } from 'react';
import { useWeightCalibration, useSimulationProgress } from '../hooks/useWeightCalibration';
import { useBalancerConfig } from '../hooks/useBalancerConfig';
import type {
  WizardState,
  CalibrationStrategy,
  SimulationPreset,
} from '../../balancing/config/weightWizardConfig';
import {
  WIZARD_STEPS,
  CALIBRATION_STRATEGIES,
  SIMULATION_PRESETS,
  CALIBRATION_STRATEGY_CONFIGS,
  WIZARD_UI_CONFIG,
} from '../../balancing/config/weightWizardConfig';

/**
 * Wizard step components
 */
type WizardStateUpdater = (updates: Partial<WizardState>) => void;

interface BaseWizardStepProps {
  state: WizardState;
  updateState: WizardStateUpdater;
}

interface RunCalibrationStepProps {
  state: WizardState;
  runCalibration: () => Promise<void>;
  stopCalibration: () => void;
}

interface ReviewResultsStepProps {
  state: WizardState;
}

function SelectStatsStep({ state, updateState }: BaseWizardStepProps) {
  const { config: balancerConfig } = useBalancerConfig();
  
  const handleStatToggle = (statId: string) => {
    const selectedStats = state.selectedStats.includes(statId)
      ? state.selectedStats.filter(id => id !== statId)
      : [...state.selectedStats, statId];
    
    updateState({ selectedStats });
  };
  
  const availableStats = balancerConfig.stats.filter(stat => !stat.isHidden && !stat.isLocked);
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Select Stats for Calibration
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Choose {WIZARD_UI_CONFIG.minSelectedStats}-{WIZARD_UI_CONFIG.maxSelectedStats} stats to calibrate.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableStats.map(stat => (
          <div
            key={stat.id}
            className={`
              p-4 border rounded-lg cursor-pointer transition-colors
              ${state.selectedStats.includes(stat.id)
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }
            `}
            onClick={() => handleStatToggle(stat.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{stat.label}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.description}</p>
              </div>
              <div className="w-5 h-5 rounded border-2 border-current flex items-center justify-center">
                {state.selectedStats.includes(stat.id) && (
                  <div className="w-2 h-2 rounded-full bg-current" />
                )}
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Current weight: {stat.weight}
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Selected: {state.selectedStats.length} / {WIZARD_UI_CONFIG.maxSelectedStats}
      </div>
    </div>
  );
}

function SetTargetsStep({ state, updateState }: BaseWizardStepProps) {
  const [newTarget, setNewTarget] = useState({
    strategy: 'target-turns' as CalibrationStrategy,
    targetValue: 15,
    tolerance: 0.1,
    priority: 1,
  });
  
  const handleWeightChange = (statId: string, weight: number) => {
    const weights = state.weights.map(w => 
      w.statId === statId ? { ...w, weight } : w
    );
    updateState({ weights });
  };
  
  const addTarget = () => {
    const targets = [...state.targets, newTarget];
    updateState({ targets });
    setNewTarget({
      strategy: 'target-turns',
      targetValue: 15,
      tolerance: 0.1,
      priority: 1,
    });
  };
  
  const removeTarget = (index: number) => {
    const targets = state.targets.filter((_, i) => i !== index);
    updateState({ targets });
  };
  
  useEffect(() => {
    // Initialize weights for selected stats
    if (state.selectedStats.length > 0 && state.weights.length === 0) {
      const weights = state.selectedStats.map(statId => ({
        statId,
        weight: 1.0,
        priority: 1,
        locked: false,
      }));
      updateState({ weights });
    }
  }, [state.selectedStats, state.weights.length, updateState]);
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Configure Weights and Targets
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Set initial weights and calibration targets for selected stats.
        </p>
      </div>
      
      {/* Weight Configuration */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Stat Weights</h4>
        <div className="space-y-3">
          {state.weights.map(weight => {
            const stat = state.selectedStats.find(id => id === weight.statId);
            return (
              <div key={weight.statId} className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {stat}
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="5.0"
                    step="0.1"
                    value={weight.weight}
                    onChange={(e) => handleWeightChange(weight.statId, parseFloat(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="w-20">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={weight.priority}
                    onChange={(e) => {
                      const weights = state.weights.map(w => 
                        w.statId === weight.statId ? { ...w, priority: parseInt(e.target.value) } : w
                      );
                      updateState({ weights });
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={weight.locked}
                    onChange={(e) => {
                      const weights = state.weights.map(w => 
                        w.statId === weight.statId ? { ...w, locked: e.target.checked } : w
                      );
                      updateState({ weights });
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">Lock</label>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Target Configuration */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Calibration Targets</h4>
        
        {/* Add New Target */}
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Strategy</label>
              <select
                value={newTarget.strategy}
                onChange={(e) => setNewTarget({ ...newTarget, strategy: e.target.value as CalibrationStrategy })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {CALIBRATION_STRATEGIES.map(strategy => (
                  <option key={strategy} value={strategy}>
                    {CALIBRATION_STRATEGY_CONFIGS[strategy].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Value</label>
              <input
                type="number"
                value={newTarget.targetValue}
                onChange={(e) => setNewTarget({ ...newTarget, targetValue: parseFloat(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tolerance</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={newTarget.tolerance}
                onChange={(e) => setNewTarget({ ...newTarget, tolerance: parseFloat(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={addTarget}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add Target
              </button>
            </div>
          </div>
        </div>
        
        {/* Existing Targets */}
        <div className="space-y-2">
          {state.targets.map((target, index) => (
            <div key={index} className="flex items-center justify-between p-3 border border-gray-300 dark:border-gray-600 rounded-lg">
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {CALIBRATION_STRATEGY_CONFIGS[target.strategy].label}
                </span>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  Target: {target.targetValue} ±{(target.tolerance * 100).toFixed(0)}%
                </span>
              </div>
              <button
                onClick={() => removeTarget(index)}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConfigureSimulationStep({ state, updateState }: BaseWizardStepProps) {
  const handlePresetChange = (preset: SimulationPreset) => {
    updateState({
      simulationConfig: {
        ...state.simulationConfig,
        preset,
        ...SIMULATION_PRESETS[preset],
      },
    });
  };
  
  const handleConfigChange = (field: string, value: number) => {
    updateState({
      simulationConfig: {
        ...state.simulationConfig,
        [field]: value,
      },
    });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Configure Simulation
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Choose simulation parameters for Monte Carlo analysis.
        </p>
      </div>
      
      {/* Preset Selection */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Simulation Preset</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(SIMULATION_PRESETS) as SimulationPreset[]).map(preset => (
            <div
              key={preset}
              className={`
                p-4 border rounded-lg cursor-pointer transition-colors
                ${state.simulationConfig.preset === preset
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }
              `}
              onClick={() => handlePresetChange(preset)}
            >
              <h5 className="font-medium text-gray-900 dark:text-gray-100 capitalize">{preset}</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {SIMULATION_PRESETS[preset].iterations.toLocaleString()} iterations
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                ~{(SIMULATION_PRESETS[preset].timeoutMs / 1000).toFixed(0)}s
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Custom Configuration */}
      {state.simulationConfig.preset === 'custom' && (
        <div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Custom Parameters</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Iterations</label>
              <input
                type="number"
                min="100"
                max="50000"
                value={state.simulationConfig.iterations}
                onChange={(e) => handleConfigChange('iterations', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Turns</label>
              <input
                type="number"
                min="5"
                max="50"
                value={state.simulationConfig.targetTurns}
                onChange={(e) => handleConfigChange('targetTurns', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Seed</label>
              <input
                type="number"
                min="0"
                value={state.simulationConfig.seed}
                onChange={(e) => handleConfigChange('seed', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Timeout (ms)</label>
              <input
                type="number"
                min="1000"
                max="300000"
                value={state.simulationConfig.timeoutMs}
                onChange={(e) => handleConfigChange('timeoutMs', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Simulation Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Simulation Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Iterations:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
              {state.simulationConfig.iterations.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Target Turns:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
              {state.simulationConfig.targetTurns}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Seed:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
              {state.simulationConfig.seed}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Est. Time:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
              ~{(state.simulationConfig.timeoutMs / 1000).toFixed(0)}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RunCalibrationStep({ state, runCalibration, stopCalibration }: RunCalibrationStepProps) {
  const simulationProgress = useSimulationProgress();
  
  useEffect(() => {
    if (state.isRunning) {
      simulationProgress.startProgress(state.simulationConfig.iterations);
    } else {
      simulationProgress.completeProgress();
    }
  }, [state.isRunning, state.simulationConfig.iterations, simulationProgress]);
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Run Weight Calibration
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Execute Monte Carlo simulation to calibrate stat weights.
        </p>
      </div>
      
      {/* Calibration Status */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        {state.isRunning ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Running simulation...</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {Math.round(state.progress * 100)}% complete
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${state.progress * 100}%` }}
              />
            </div>
            
            {/* Estimated Time */}
            {simulationProgress.estimatedTimeRemaining > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Estimated time remaining: {Math.round(simulationProgress.estimatedTimeRemaining / 1000)}s
              </div>
            )}
            
            {/* Stop Button */}
            <button
              onClick={stopCalibration}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Stop Simulation
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Ready to Calibrate
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Click start to begin Monte Carlo simulation with {state.simulationConfig.iterations.toLocaleString()} iterations
            </p>
            <button
              onClick={runCalibration}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Start Calibration
            </button>
          </div>
        )}
      </div>
      
      {/* Errors */}
      {state.errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Errors</h4>
          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
            {state.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ReviewResultsStep({ state }: ReviewResultsStepProps) {
  if (!state.results.calibrationResults) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">No calibration results available</p>
      </div>
    );
  }
  
  const { calibrationResults, summary } = state.results;
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Calibration Results
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Review calibrated weights and performance improvements.
        </p>
      </div>
      
      {/* Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Improvement</span>
            <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {summary.totalImprovement.toFixed(1)}%
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Confidence</span>
            <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {(summary.averageConfidence * 100).toFixed(1)}%
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Targets Met</span>
            <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {summary.targetsMet}/{summary.totalTargets}
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Iterations</span>
            <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {calibrationResults[0]?.iterations.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
      
      {/* Detailed Results */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Stat Weight Changes</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Stat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Original Weight
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Calibrated Weight
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Improvement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {calibrationResults.map((result, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {result.statId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {result.originalWeight.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {result.calibratedWeight.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      result.improvement > 0
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {result.improvement > 0 ? '+' : ''}{result.improvement.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {(result.confidence * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Weight Calibration Wizard Component
 */
export function WeightCalibrationWizard() {
  const {
    state,
    updateState,
    nextStep,
    previousStep,
    goToStep,
    validateCurrentStep,
    isStepAccessible,
    runCalibration,
    stopCalibration,
    resetWizard,
    exportResults,
    importConfiguration,
  } = useWeightCalibration();
  
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  
  const handleExport = () => {
    const results = exportResults();
    setShowExport(true);
    navigator.clipboard.writeText(results);
  };
  
  const handleImport = () => {
    if (importConfiguration(importText)) {
      setShowImport(false);
      setImportText('');
    }
  };
  
  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 'select-stats':
        return <SelectStatsStep state={state} updateState={updateState} />;
      case 'set-targets':
        return <SetTargetsStep state={state} updateState={updateState} />;
      case 'configure-simulation':
        return <ConfigureSimulationStep state={state} updateState={updateState} />;
      case 'run-calibration':
        return <RunCalibrationStep state={state} runCalibration={runCalibration} stopCalibration={stopCalibration} />;
      case 'review-results':
        return <ReviewResultsStep state={state} />;
      default:
        return null;
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Stat Weight Calibration Wizard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Calibrate stat weights using Monte Carlo simulations for optimal performance
        </p>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex space-x-2">
            {WIZARD_STEPS.map(step => (
              <button
                key={step}
                onClick={() => isStepAccessible(step) && goToStep(step)}
                disabled={!isStepAccessible(step)}
                className={`
                  px-3 py-1 text-sm font-medium rounded-md transition-colors
                  ${state.currentStep === step
                    ? 'bg-blue-600 text-white'
                    : isStepAccessible(step)
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {step.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {Math.round(state.progress * 100)}% Complete
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${state.progress * 100}%` }}
          />
        </div>
      </div>
      
      {/* Step Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        {renderCurrentStep()}
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between items-center">
        <div>
          {state.currentStep !== 'select-stats' && (
            <button
              onClick={previousStep}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Previous
            </button>
          )}
        </div>
        
        <div className="flex space-x-2">
          {/* Action Buttons */}
          {state.currentStep === 'review-results' && (
            <>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Export Results
              </button>
              <button
                onClick={() => setShowImport(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                Import Config
              </button>
              <button
                onClick={resetWizard}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Reset Wizard
              </button>
            </>
          )}
          
          {state.currentStep !== 'review-results' && (
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {state.currentStep === 'run-calibration' ? 'Review Results' : 'Next'}
            </button>
          )}
        </div>
      </div>
      
      {/* Validation Errors */}
      {validateCurrentStep().length > 0 && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Please fix the following issues:</h4>
          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
            {validateCurrentStep().map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Export Modal */}
      {showExport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Export Results
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Results have been copied to clipboard. You can also download them below.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowExport(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Import Configuration
            </h3>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste your configuration JSON here..."
              className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowImport(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
