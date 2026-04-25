/**
 * Drag & Drop Stress Test UI Components
 * 
 * React components for visual feedback and progress tracking during
 * stress test execution with real-time updates and comprehensive reporting.
 * 
 * @since NP-014
 */

import React, { useState } from 'react';
import clsx from 'clsx';
import type { StressTestProgress, StressTestResult, StressTestMetrics } from './dragDropStressTestHarness';
import type { ValidationAnalysis } from './dragDropStressTestValidation';

/**
 * Progress bar component for stress test execution
 */
export interface StressTestProgressBarProps {
  /** Current progress information */
  progress: StressTestProgress;
  /** Whether to show detailed metrics */
  showDetails?: boolean;
  /** Custom className */
  className?: string;
}

export const StressTestProgressBar: React.FC<StressTestProgressBarProps> = ({
  progress,
  showDetails = false,
  className,
}) => {
  const { completedOperations, totalOperations, progressPercentage, currentOpsPerSecond, errorCount } = progress;
  
  return (
    <div className={clsx('bg-slate-800 rounded-lg p-4', className)}>
      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-300">
            Progress: {completedOperations.toLocaleString()} / {totalOperations.toLocaleString()}
          </span>
          <span className="text-sm text-slate-400">
            {progressPercentage.toFixed(1)}%
          </span>
        </div>
        
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className={clsx(
              'h-2 rounded-full transition-all duration-300',
              progress.status === 'completed' ? 'bg-green-500' :
              progress.status === 'failed' ? 'bg-red-500' :
              'bg-blue-500'
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
      
      {showDetails && (
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-slate-400">Ops/sec:</span>
            <span className="ml-2 text-white font-medium">
              {currentOpsPerSecond.toFixed(1)}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Errors:</span>
            <span className={clsx(
              'ml-2 font-medium',
              errorCount > 0 ? 'text-red-400' : 'text-green-400'
            )}>
              {errorCount}
            </span>
          </div>
          <div>
            <span className="text-slate-400">ETA:</span>
            <span className="ml-2 text-white font-medium">
              {progress.estimatedRemainingTime > 0 
                ? `${(progress.estimatedRemainingTime / 1000).toFixed(0)}s`
                : 'N/A'
              }
            </span>
          </div>
        </div>
      )}
      
      <div className="mt-2">
        <div className={clsx(
          'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
          progress.status === 'completed' ? 'bg-green-500/20 text-green-300' :
          progress.status === 'failed' ? 'bg-red-500/20 text-red-300' :
          'bg-blue-500/20 text-blue-300'
        )}>
          <div className={clsx(
            'w-2 h-2 rounded-full mr-2',
            progress.status === 'completed' ? 'bg-green-400' :
            progress.status === 'failed' ? 'bg-red-400' :
            'bg-blue-400 animate-pulse'
          )} />
          {progress.status === 'running' ? 'Running' :
           progress.status === 'completed' ? 'Completed' :
           progress.status === 'failed' ? 'Failed' : 'Unknown'}
        </div>
      </div>
    </div>
  );
};

/**
 * Metrics display component
 */
export interface StressTestMetricsProps {
  /** Test metrics to display */
  metrics: StressTestMetrics;
  /** Whether to show detailed breakdown */
  showDetails?: boolean;
  /** Custom className */
  className?: string;
}

export const StressTestMetrics: React.FC<StressTestMetricsProps> = ({
  metrics,
  showDetails = false,
  className,
}) => {
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };
  
  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };
  
  return (
    <div className={clsx('bg-slate-800 rounded-lg p-4', className)}>
      <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">
            {metrics.operationsPerSecond.toFixed(0)}
          </div>
          <div className="text-xs text-slate-400">Ops/sec</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">
            {(metrics.successRate * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400">Success Rate</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {formatDuration(metrics.averageOperationDuration)}
          </div>
          <div className="text-xs text-slate-400">Avg Duration</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">
            {formatBytes(metrics.memoryUsage.delta)}
          </div>
          <div className="text-xs text-slate-400">Memory Delta</div>
        </div>
      </div>
      
      {showDetails && (
        <div className="space-y-3">
          <div className="border-t border-slate-700 pt-3">
            <h4 className="text-sm font-medium text-slate-300 mb-2">Duration Analysis</h4>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-slate-400">Fastest:</span>
                <span className="ml-1 text-white">{formatDuration(metrics.fastestOperationDuration)}</span>
              </div>
              <div>
                <span className="text-slate-400">Slowest:</span>
                <span className="ml-1 text-white">{formatDuration(metrics.slowestOperationDuration)}</span>
              </div>
              <div>
                <span className="text-slate-400">P50:</span>
                <span className="ml-1 text-white">{formatDuration(metrics.percentiles.p50)}</span>
              </div>
              <div>
                <span className="text-slate-400">P95:</span>
                <span className="ml-1 text-white">{formatDuration(metrics.percentiles.p95)}</span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-700 pt-3">
            <h4 className="text-sm font-medium text-slate-300 mb-2">Memory Usage</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-400">Initial:</span>
                <span className="ml-1 text-white">{formatBytes(metrics.memoryUsage.initial)}</span>
              </div>
              <div>
                <span className="text-slate-400">Peak:</span>
                <span className="ml-1 text-white">{formatBytes(metrics.memoryUsage.peak)}</span>
              </div>
              <div>
                <span className="text-slate-400">Final:</span>
                <span className="ml-1 text-white">{formatBytes(metrics.memoryUsage.final)}</span>
              </div>
            </div>
          </div>
          
          {metrics.errorStats.totalErrors > 0 && (
            <div className="border-t border-slate-700 pt-3">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Error Analysis</h4>
              <div className="space-y-1">
                {Object.entries(metrics.errorStats.errorsByType).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-xs">
                    <span className="text-slate-400">{type}:</span>
                    <span className="text-red-400">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Validation analysis display component
 */
export interface StressTestValidationProps {
  /** Validation analysis results */
  analysis: ValidationAnalysis;
  /** Custom className */
  className?: string;
}

export const StressTestValidation: React.FC<StressTestValidationProps> = ({
  analysis,
  className,
}) => {
  const getStatusColor = (status: ValidationAnalysis['status']) => {
    switch (status) {
      case 'passed': return 'text-green-400 bg-green-500/20';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20';
      case 'failed': return 'text-red-400 bg-red-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-400';
    if (score >= 0.7) return 'text-yellow-400';
    if (score >= 0.5) return 'text-orange-400';
    return 'text-red-400';
  };
  
  return (
    <div className={clsx('bg-slate-800 rounded-lg p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Validation Analysis</h3>
        <div className={clsx(
          'px-3 py-1 rounded-full text-sm font-medium',
          getStatusColor(analysis.status)
        )}>
          {analysis.status.toUpperCase()}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className={clsx('text-2xl font-bold', getScoreColor(analysis.validationScore))}>
            {(analysis.validationScore * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400">Validation Score</div>
        </div>
        
        <div className="text-center">
          <div className={clsx('text-2xl font-bold', getScoreColor(analysis.resultAccuracy))}>
            {(analysis.resultAccuracy * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400">Result Accuracy</div>
        </div>
        
        <div className="text-center">
          <div className={clsx('text-2xl font-bold', getScoreColor(analysis.performanceScore))}>
            {(analysis.performanceScore * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400">Performance Score</div>
        </div>
      </div>
      
      {analysis.errorAnalysis.totalErrors > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Critical Errors</h4>
          <div className="space-y-1">
            {analysis.errorAnalysis.criticalErrors.slice(0, 3).map((error, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{error.type}:</span>
                <div className="flex items-center gap-2">
                  <span className={clsx(
                    'px-2 py-0.5 rounded',
                    error.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                    error.severity === 'high' ? 'bg-orange-500/20 text-orange-300' :
                    error.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-slate-500/20 text-slate-300'
                  )}>
                    {error.severity}
                  </span>
                  <span className="text-white">{error.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {analysis.performanceAnalysis.bottlenecks.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Performance Bottlenecks</h4>
          <div className="space-y-1">
            {analysis.performanceAnalysis.bottlenecks.slice(0, 3).map((bottleneck, index) => (
              <div key={index} className="text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400">{bottleneck.type}:</span>
                  <span className={clsx(
                    'px-2 py-0.5 rounded',
                    bottleneck.severity === 'high' ? 'bg-red-500/20 text-red-300' :
                    bottleneck.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-blue-500/20 text-blue-300'
                  )}>
                    {bottleneck.severity}
                  </span>
                </div>
                <div className="text-slate-500 ml-2">{bottleneck.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {analysis.recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-2">Recommendations</h4>
          <ul className="space-y-1">
            {analysis.recommendations.slice(0, 5).map((recommendation, index) => (
              <li key={index} className="text-xs text-slate-400 flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/**
 * Complete stress test results display
 */
export interface StressTestResultsProps {
  /** Test results */
  result: StressTestResult;
  /** Validation analysis */
  analysis: ValidationAnalysis;
  /** Whether to show detailed breakdown */
  showDetails?: boolean;
  /** Custom className */
  className?: string;
}

export const StressTestResults: React.FC<StressTestResultsProps> = ({
  result,
  analysis,
  showDetails = false,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'validation'>('metrics');
  
  return (
    <div className={clsx('space-y-4', className)}>
      {/* Test Summary */}
      <div className="bg-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white">Test Results</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">
              {result.config.scenario.replace('_', ' ').toUpperCase()}
            </span>
            <span className="text-sm text-slate-400">
              {result.operations.length.toLocaleString()} operations
            </span>
          </div>
        </div>
        
        <div className="text-sm text-slate-400">
          Duration: {((result.endTime - result.startTime) / 1000).toFixed(2)}s
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="bg-slate-800 rounded-lg p-1">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('metrics')}
            className={clsx(
              'flex-1 px-3 py-2 rounded text-sm font-medium transition-colors',
              activeTab === 'metrics' 
                ? 'bg-blue-500 text-white' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            )}
          >
            Metrics
          </button>
          <button
            onClick={() => setActiveTab('validation')}
            className={clsx(
              'flex-1 px-3 py-2 rounded text-sm font-medium transition-colors',
              activeTab === 'validation' 
                ? 'bg-blue-500 text-white' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            )}
          >
            Validation
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'metrics' && (
        <StressTestMetrics 
          metrics={result.metrics} 
          showDetails={showDetails}
        />
      )}
      
      {activeTab === 'validation' && (
        <StressTestValidation analysis={analysis} />
      )}
    </div>
  );
};

/**
 * Real-time stress test monitor
 */
export interface StressTestMonitorProps {
  /** Current progress */
  progress: StressTestProgress | null;
  /** Test results (when available) */
  result?: StressTestResult;
  /** Validation analysis (when available) */
  analysis?: ValidationAnalysis;
  /** Whether to show detailed information */
  showDetails?: boolean;
  /** Custom className */
  className?: string;
}

export const StressTestMonitor: React.FC<StressTestMonitorProps> = ({
  progress,
  result,
  analysis,
  showDetails = false,
  className,
}) => {
  const [showMetrics, setShowMetrics] = useState(false);
  
  return (
    <div className={clsx('space-y-4', className)}>
      {/* Progress Bar */}
      {progress && (
        <StressTestProgressBar 
          progress={progress} 
          showDetails={showDetails}
        />
      )}
      
      {/* Results */}
      {result && analysis && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Test Complete</h3>
            <button
              onClick={() => setShowMetrics(!showMetrics)}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
            >
              {showMetrics ? 'Hide' : 'Show'} Details
            </button>
          </div>
          
          <StressTestResults 
            result={result}
            analysis={analysis}
            showDetails={showMetrics}
          />
        </>
      )}
    </div>
  );
};
