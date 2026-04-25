/**
 * Archetype Comparison Matrix Component
 * 
 * Config-first component for side-by-side archetype comparison with matrix visualization.
 * Displays stat deltas, balance scores, and outlier highlights with sortable columns.
 * 
 * @since NP-134 – Config Balancer: Archetype Comparison Matrix
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useArchetypeComparison, useArchetypeDelta, useComparisonMetrics } from '../hooks/useArchetypeComparison';
import type { ComparisonMetric, SortDirection, DeltaThreshold } from '../../balancing/config/visualization/comparisonConfig';
import {
  getDeltaThreshold,
  getDeltaColor,
  getDeltaIcon,
  formatMetricValue,
  COLOR_SCHEME_DEFINITIONS,
  DEFAULT_COMPARISON_CONFIG,
} from '../../balancing/config/visualization/comparisonConfig';

/**
 * Delta indicator component
 */
function DeltaIndicator({ 
  value, 
  thresholds, 
  colorScheme = 'default' 
}: { 
  value: number; 
  thresholds: typeof DEFAULT_COMPARISON_CONFIG.thresholds; 
  colorScheme?: keyof typeof COLOR_SCHEME_DEFINITIONS; 
}) {
  const threshold = getDeltaThreshold(value, thresholds);
  const color = getDeltaColor(threshold, colorScheme);
  const icon = getDeltaIcon(threshold);
  
  return (
    <span 
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDeltaColorClass(color)}`}
      title={`${getDeltaLabel(threshold)}: ${Math.abs(value).toFixed(3)}`}
    >
      <span className="mr-1">{icon}</span>
      <span>{Math.abs(value).toFixed(2)}</span>
    </span>
  );
}

/**
 * Helper function to get color class
 */
function getDeltaColorClass(color: string): string {
  const colorMap: Record<string, string> = {
    '#10b981': 'text-green-600 dark:text-green-400',
    '#ef4444': 'text-red-600 dark:text-red-400',
    '#6b7280': 'text-gray-600 dark:text-gray-400',
    '#f59e0b': 'text-amber-600 dark:text-amber-400',
    '#dc2626': 'text-red-600 dark:text-red-400',
    '#059669': 'text-green-700 dark:text-green-300',
    '#000000': 'text-black',
    '#ffffff': 'text-white',
    '#808080': 'text-gray-500',
    '#ff0000': 'text-red-500',
    '#d97706': 'text-yellow-600 dark:text-yellow-400',
    '#fd7e14': 'text-yellow-600 dark:text-yellow-400',
    '#212529': 'text-gray-900',
    '#6c757d': 'text-gray-600',
    '#dee2e6': 'text-gray-500',
  };
  
  return colorMap[color] || 'text-gray-600';
}

/**
 * Helper function to get delta label
 */
function getDeltaLabel(threshold: DeltaThreshold): string {
  const labels = {
    insignificant: 'Insignificant',
    minor: 'Minor',
    moderate: 'Moderate',
    significant: 'Significant',
    major: 'Major',
  };
  
  return labels[threshold] || 'Unknown';
}

/**
 * Metric cell component
 */
function MetricCell({ 
  value, 
  metric, 
  format, 
  higherIsBetter 
}: { 
  value: number; 
  metric: ComparisonMetric; 
  format: string; 
  higherIsBetter: boolean; 
}) {
  const formattedValue = formatMetricValue(value, format);
  const isPositive = higherIsBetter ? value >= 0 : value <= 0;
  
  return (
    <div className={`text-right ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
      {formattedValue}
    </div>
  );
}

/**
 * Sortable table header component
 */
function SortableHeader({ 
  metric, 
  sortConfig, 
  onSortChange 
}: { 
  metric: ComparisonMetric; 
  sortConfig: { metric: ComparisonMetric; direction: SortDirection }; 
  onSortChange: (sortConfig: { metric: ComparisonMetric; direction: SortDirection }) => void; 
}) {
  const isSorted = sortConfig.metric === metric.id;
  const direction = sortConfig.direction;
  
  return (
    <th
      className={`
        px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer
        hover:bg-gray-50 dark:hover:bg-gray-800
        ${isSorted ? 'bg-gray-100 dark:bg-gray-700' : ''}
      `}
      onClick={() => {
        const newDirection = isSorted && direction === 'desc' ? 'asc' : 'desc';
        onSortChange({ metric: metric.id, direction: newDirection });
      }}
    >
      <div className="flex items-center">
        <span>{metric.name}</span>
        {isSorted && (
          <span className="ml-2">
            {direction === 'desc' ? '↓' : '↑'}
          </span>
        )}
      </div>
    </th>
  );
}

/**
 * Outlier highlight component
 */
function OutlierHighlight({ outliers }: { outliers: string[] }) {
  if (outliers.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-1">
      {outliers.map(outlier => (
        <span
          key={outlier}
          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
          title={`Outlier in: ${outlier}`}
        >
          ⚠️ {outlier}
        </span>
      ))}
    </div>
  );
}

/**
 * Statistics panel component
 */
function StatisticsPanel({ statistics }: { statistics: any }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Comparison Statistics
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Total Archetypes:</span>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {statistics.totalArchetypes}
          </div>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Avg Balance Score:</span>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {statistics.averageBalanceScore.toFixed(2)}
          </div>
        </div>
        <div>
          <span className="text <span className="text-gray-600 dark:text-gray-400">Highest Score:</span>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {statistics.highestScore.toFixed(2)}
          </div>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Lowest Score:</span>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {statistics.lowestScore.toFixed(2)}
          </div>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Outliers:</span>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {statistics.outlierCount}
          </div>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Delta Threshold:</span>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {(DEFAULT_COMPARISON_CONFIG.thresholds.significant * 100).toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Filter controls component
 */
function FilterControls({
  filterConfig,
  onFilterChange,
  availableMetrics,
  sortConfig,
  onSortChange,
}: {
  filterConfig: any;
  onFilterChange: (filterConfig: any) => void;
  availableMetrics: ComparisonMetric[];
  sortConfig: { metric: ComparisonMetric; direction: SortDirection };
  onSortChange: (sortConfig: { metric: ComparisonMetric; direction: SortDirection }) => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Filters & Sorting
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search
          </label>
          <input
            type="text"
            value={filterConfig.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Search archetypes..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* Outlier Filter */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filterConfig.outlierOnly}
              onChange={(e) => onFilterChange({ outlierOnly: e.target.checked })}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Outliers Only
            </span>
          </label>
        </div>
        
        {/* Balance Score Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Balance Score Range
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={filterConfig.minBalanceScore}
              onChange={(e) => onFilterChange({ minBalanceScore: parseFloat(e.target.value) })}
              className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">to</span>
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={filterConfig.maxBalanceScore}
              onChange={(e) => onFilterChange({ maxBalanceScore: parseFloat(e.target.value) })}
              className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            />
          </div>
        </div>
        
        {/* Sort Controls */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sort By
          </label>
          <select
            value={sortConfig.metric}
            onChange={(e) => onSortChange({ metric: e.target.value as ComparisonMetric, direction: sortConfig.direction })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {availableMetrics.map(metric => (
              <option key={metric.id} value={metric.id}>
                {metric.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Direction
          </label>
          <select
            value={sortConfig.direction}
            onChange={(e) => onSortChange({ metric: sortConfig.metric, direction: e.target.value as SortDirection })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>
    </div>
  );
}

/**
 * Export/Import controls component
 */
function ExportImportControls({
  onExport,
  onImport,
  onReset,
}: {
  onExport: () => void;
  onImport: (data: string) => boolean;
  onReset: () => void;
}) {
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  
  const handleImport = () => {
    const success = onImport(importText);
    if (success) {
      setShowImport(false);
      setImportText('');
    }
  };
  
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex space-x-2">
        <button
          onClick={onExport}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          onClick={onReset}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Reset
        </button>
      </div>
      
      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Import Configuration
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Paste your comparison configuration JSON below.
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste JSON configuration here..."
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

/**
 * Main Archetype Comparison Matrix Component
 */
export function ArchetypeComparisonMatrix() {
  const {
    results,
    config,
    updateConfig,
    selectedArchetypes,
    updateSelectedArchetypes,
    sortConfig,
    updateSortConfig,
    filterConfig,
    updateFilterConfig,
    compareArchetypes,
    getArchetypeById,
    exportResults,
    importConfiguration,
    resetComparison,
    archetypeOptions,
    statistics,
  } = useArchetypeComparison();

  const { availableMetrics } = useComparisonMetrics();
  
  // Auto-select archetypes if none selected
  useEffect(() => {
    if (selectedArchetypes.length === 0 && archetypeOptions.length > 0) {
      updateSelectedArchetype(archetypeOptions.slice(0, 5));
    }
  }, [archetypeOptions, selectedArchetypes.length, updateSelectedArchetype]);

  // Emit telemetry when comparison is viewed
  useEffect(() => {
    if (results.length > 0) {
      // Emit telemetry event
      console.log('TELEMETRY: archetype_comparison_viewed', {
        archetypeCount: results.length,
        config: config,
        timestamp: Date.now(),
      });
    }
  }, [results.length, config]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Archetype Comparison Matrix
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Side-by-side archetype comparison with stat deltas, balance scores, and outlier highlights.
        </p>
      </div>

      {/* Statistics */}
      <StatisticsPanel statistics={statistics} />

      {/* Controls */}
      <FilterControls
        filterConfig={filterConfig}
        onFilterChange={updateFilterConfig}
        availableMetrics={availableMetrics}
        sortConfig={sortConfig}
        onSortChange={updateSortConfig}
      />

      {/* Archetype Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Selected Archetypes ({selectedArchetypes.length}/{config.maxArchetypes})
        </h3>
        <div className="flex flex-wrap gap-2">
          {archetypeOptions.slice(0, 10).map(archetypeId => (
            <button
              key={archetypeId}
              onClick={() => {
                const isSelected = selectedArchetypes.includes(archetypeId);
                const newSelection = isSelected
                  ? selectedArchetypes.filter(id => id !== archetypeId)
                  : [...selectedArchetypes, archetypeId];
                updateSelectedArchetype(newSelection);
              }}
              className={`
                px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${selectedArchetypes.includes(archetypeId)
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }
              `}
            >
              {archetypeId}
            </button>
          ))}
        </div>
        {selectedArchetypeOptions.length > 10 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Showing 10 of {archetypeOptions.length} available archetypes. Select more to compare.
          </p>
        )}
      </div>

      {/* Comparison Matrix */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Archetype
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Balance Score
                </th>
                {config.metrics.map(metric => (
                  <SortableHeader
                    key={metric.id}
                    metric={metric}
                    sortConfig={sortConfig}
                    onSortChange={updateSortConfig}
                  />
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Outliers
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {results.map((result, index) => (
                <tr
                  key={result.archetypeId}
                  className={`
                    hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                    ${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : ''}
                  `}
                >
                  {/* Archetype Info */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {result.archetypeId}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {result.archetypeName}
                      </div>
                    </div>
                  </td>
                  
                  {/* Rank */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        #{result.rank}
                      </span>
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        ({result.percentile.toFixed(1)}%)
                      </span>
                    </div>
                  </td>
                  
                  {/* Balance Score */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {result.balanceScore.toFixed(2)}
                      </span>
                      <DeltaIndicator
                        value={0}
                        thresholds={config.thresholds}
                      />
                    </div>
                  </td>
                  
                  {/* Metrics */}
                  {config.metrics.map(metric => (
                    <td key={metric.id} className="px-4 py-4 whitespace-nowrap">
                      <MetricCell
                        value={result.metrics[metric.id] || 0}
                        metric={metric}
                        format={metric.format}
                        higherIsBetter={metric.higherIsBetter}
                      />
                    </td>
                  ))}
                  
                  {/* Outliers */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <OutlierHighlight outliers={result.outliers} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export/Import Controls */}
      <ExportImportControls
        onExport={exportResults}
        onImport={importConfiguration}
        onReset={resetComparison}
      />

      {/* Empty State */}
      {results.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7m0 0h6m0 0v6m0 0h6m-6 0v6M6 5v6M6 5m-6 0v6"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            No Archetypes Selected
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Select archetypes above to start comparing.
          </p>
        </div>
      )}
    </div>
  );
}
