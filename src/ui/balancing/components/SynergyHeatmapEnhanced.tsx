/**
 * Enhanced Synergy Heatmap Component
 * 
 * Advanced visualization component for displaying synergy data with
 * interactive features, filtering, and comprehensive tooltips.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  useSynergyHeatmapEnhanced,
  type EnhancedSynergyFilterOptions,
  type UseSynergyHeatmapEnhancedResult,
} from '@/ui/balancing/hooks/useSynergyHeatmapEnhanced';
import type { SynergyHeatmapConfig, SynergyRating } from '@/ui/balancing/config/synergyHeatmapConfig';
import type { SynergyResult, MarginalUtilityResult } from '@/balancing/stressTesting/types';

interface SynergyHeatmapEnhancedProps {
  /** Synergy results from stress testing */
  synergies: SynergyResult[];
  /** Marginal utility results */
  marginalUtilities: MarginalUtilityResult[];
  /** Stat labels for display */
  statLabels: Record<string, string>;
  /** Heatmap configuration */
  config?: Partial<SynergyHeatmapConfig>;
  /** Initial filter options */
  initialFilters?: Partial<EnhancedSynergyFilterOptions>;
  /** Show statistics panel */
  showStatistics?: boolean;
  /** Show export controls */
  showExportControls?: boolean;
  /** Show search bar */
  showSearch?: boolean;
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Tooltip component for synergy cells
 */
interface SynergyTooltipProps {
  synergy: SynergyResult | null;
  statLabels: Record<string, string>;
  show: boolean;
  position: { x: number; y: number };
}

const SynergyTooltip: React.FC<SynergyTooltipProps> = ({ synergy, statLabels, show, position }) => {
  if (!show || !synergy) return null;

  return (
    <div 
      className="absolute z-50 bg-slate-900 border border-amber-400/40 rounded-lg p-3 shadow-xl max-w-xs"
      style={{
        left: `${position.x}px`,
        top: `${position.y + 10}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="text-ivory text-sm">
        <div className="font-semibold mb-2">
          {statLabels[synergy.statIds[0]] || synergy.statIds[0]} × {statLabels[synergy.statIds[1]] || synergy.statIds[1]}
        </div>
        <div className="space-y-1">
          <div>
            <span className="text-amber-200">Multiplier:</span>{' '}
            <span className="font-mono">{synergy.synergyMultiplier.toFixed(2)}x</span>
          </div>
          <div>
            <span className="text-amber-200">Expected:</span>{' '}
            <span className="font-mono">{synergy.expectedScore.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-amber-200">Type:</span>{' '}
            <span className={
              synergy.isOpSynergy ? 'text-emerald-400' : 
              synergy.isWeakSynergy ? 'text-rose-400' : 
              'text-amber-400'
            }>
              {synergy.isOpSynergy ? 'OP' : synergy.isWeakSynergy ? 'Weak' : 'Normal'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Statistics panel component
 */
type SynergyStatistics = ReturnType<UseSynergyHeatmapEnhancedResult['getStatistics']>;

const StatisticsPanel: React.FC<{
  statistics: SynergyStatistics;
  compact?: boolean;
}> = ({ statistics, compact = false }) => {
  const stats = [
    { label: 'Total Synergies', value: statistics.totalSynergies, color: 'text-amber-200' },
    { label: 'OP Synergies', value: statistics.opSynergies, color: 'text-emerald-400' },
    { label: 'Weak Synergies', value: statistics.weakSynergies, color: 'text-rose-400' },
    { label: 'Avg Multiplier', value: statistics.averageMultiplier.toFixed(2), color: 'text-cyan-300' },
    { label: 'Highest', value: statistics.highestMultiplier.toFixed(2), color: 'text-green-300' },
    { label: 'Lowest', value: statistics.lowestMultiplier.toFixed(2), color: 'text-orange-300' },
  ];

  return (
    <div className={`bg-slate-900/95 border border-amber-400/40 rounded-lg p-4 ${compact ? 'p-2' : ''}`}>
      <h3 className={`text-ivory font-semibold mb-3 ${compact ? 'text-sm' : ''}`}>Statistics</h3>
      <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-3'} gap-3`}>
        {stats.map(stat => (
          <div key={stat.label} className="text-center">
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
            <div className={`text-xs ${compact ? 'text-amber-200' : 'text-amber-300'} uppercase tracking-wider`}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Export controls component
 */
const ExportControls: React.FC<{
  onExportCSV: () => void;
  onExportJSON: () => void;
  compact?: boolean;
}> = ({ onExportCSV, onExportJSON, compact = false }) => {
  return (
    <div className={`bg-slate-900/95 border border-amber-400/40 rounded-lg p-4 ${compact ? 'p-2' : ''}`}>
      <h3 className={`text-ivory font-semibold mb-3 ${compact ? 'text-sm' : ''}`}>Export Data</h3>
      <div className={`flex gap-2 ${compact ? 'flex-col' : ''}`}>
        <button
          onClick={onExportCSV}
          className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-ivory rounded-lg font-medium transition-colors text-sm"
        >
          Export CSV
        </button>
        <button
          onClick={onExportJSON}
          className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-ivory rounded-lg font-medium transition-colors text-sm"
        >
          Export JSON
        </button>
      </div>
    </div>
  );
};

/**
 * Filter controls component
 */
const FilterControls: React.FC<{
  filters: EnhancedSynergyFilterOptions;
  onFilterChange: (filters: Partial<EnhancedSynergyFilterOptions>) => void;
  onReset: () => void;
  compact?: boolean;
}> = ({ filters, onFilterChange, onReset, compact = false }) => {
  return (
    <div className={`bg-slate-900/95 border border-amber-400/40 rounded-lg p-4 ${compact ? 'p-2' : ''}`}>
      <h3 className={`text-ivory font-semibold mb-3 ${compact ? 'text-sm' : ''}`}>Filters</h3>
      
      <div className={`space-y-3 ${compact ? 'space-y-2' : ''}`}>
        {/* Multiplier Range */}
        <div>
          <label className={`block text-amber-200 text-sm mb-1 ${compact ? 'text-xs' : ''}`}>
            Multiplier Range
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={filters.minMultiplier}
              onChange={(e) => onFilterChange({ minMultiplier: parseFloat(e.target.value) })}
              className="w-20 px-2 py-1 bg-slate-800 border border-amber-400/40 rounded text-ivory text-sm"
              placeholder="Min"
            />
            <span className="text-amber-200 text-sm">to</span>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={filters.maxMultiplier}
              onChange={(e) => onFilterChange({ maxMultiplier: parseFloat(e.target.value) })}
              className="w-20 px-2 py-1 bg-slate-800 border border-amber-400/40 rounded text-ivory text-sm"
              placeholder="Max"
            />
          </div>
        </div>

        {/* Synergy Rating */}
        <div>
          <label className={`block text-amber-200 text-sm mb-1 ${compact ? 'text-xs' : ''}`}>
            Synergy Rating
          </label>
          <select
            value={filters.rating}
            onChange={(e) => onFilterChange({ rating: e.target.value as SynergyRating | 'all' })}
            className="w-full px-2 py-1 bg-slate-800 border border-amber-400/40 rounded text-ivory text-sm"
          >
            <option value="all">All Ratings</option>
            <option value="op">OP Synergies</option>
            <option value="strong">Strong Synergies</option>
            <option value="balanced">Balanced</option>
            <option value="weak">Weak Synergies</option>
            <option value="underpowered">Underpowered</option>
          </select>
        </div>

        {/* Sort Options */}
        <div>
          <label className={`block text-amber-200 text-sm mb-1 ${compact ? 'text-xs' : ''}`}>
            Sort By
          </label>
          <div className="flex gap-2">
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as EnhancedSynergyFilterOptions['sortBy'] })}
              className="flex-1 px-2 py-1 bg-slate-800 border border-amber-400/40 rounded text-ivory text-sm"
            >
              <option value="multiplier">Multiplier</option>
              <option value="score">Score</option>
              <option value="stat1">Stat 1</option>
              <option value="stat2">Stat 2</option>
            </select>
            <select
              value={filters.sortDirection}
              onChange={(e) => onFilterChange({ sortDirection: e.target.value as EnhancedSynergyFilterOptions['sortDirection'] })}
              className="px-2 py-1 bg-slate-800 border border-amber-400/40 rounded text-ivory text-sm"
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="w-full px-3 py-2 bg-rose-600 hover:bg-rose-500 text-ivory rounded-lg font-medium transition-colors text-sm"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

/**
 * Search component
 */
const SearchBar: React.FC<{
  onSearch: (query: string) => void;
  placeholder?: string;
  compact?: boolean;
}> = ({ onSearch, placeholder = 'Search synergies...', compact = false }) => {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        onChange={(e) => onSearch(e.target.value)}
        className={`w-full px-3 py-2 bg-slate-800 border border-amber-400/40 rounded-lg text-ivory placeholder-amber-400/50 ${compact ? 'py-1 text-sm' : ''}`}
      />
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400/50">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  );
};

/**
 * Main Enhanced Synergy Heatmap Component
 */
export default function SynergyHeatmapEnhanced({
  synergies,
  marginalUtilities,
  statLabels,
  config,
  initialFilters,
  showStatistics = true,
  showExportControls = true,
  showSearch = true,
  compact = false,
  className = '',
}: SynergyHeatmapEnhancedProps) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [tooltipData, setTooltipData] = useState<{ synergy: SynergyResult | null; position: { x: number; y: number } } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    heatmapData,
    tableData,
    filters,
    updateFilters,
    resetFilters,
    getStatistics,
    exportData,
    searchSynergies,
    trackInteraction,
  } = useSynergyHeatmapEnhanced({
    synergies,
    marginalUtilities,
    statLabels,
    config,
  });

  // Apply initial filters
  React.useEffect(() => {
    if (initialFilters) {
      updateFilters(initialFilters);
    }
  }, [initialFilters, updateFilters]);

  // Handle search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return tableData;
    return searchSynergies(searchQuery);
  }, [searchQuery, tableData, searchSynergies]);

  // Handle export
  const handleExportCSV = useCallback(() => {
    const csv = exportData('csv');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synergy-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    trackInteraction('export', { format: 'csv' });
  }, [exportData, trackInteraction]);

  const handleExportJSON = useCallback(() => {
    const json = exportData('json');
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synergy-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    trackInteraction('export', { format: 'json' });
  }, [exportData, trackInteraction]);

  // Get stat IDs for table headers
  const statIds = useMemo(() => {
    const ids = new Set<string>();
    synergies.forEach(synergy => {
      synergy.statIds.forEach(id => ids.add(id));
    });
    return Array.from(ids).sort();
  }, [synergies]);

  // Handle cell hover
  const handleCellHover = useCallback((row: number, col: number, event: React.MouseEvent) => {
    if (row === col) return; // Skip diagonal cells
    
    const cell = heatmapData[row]?.[col];
    if (cell?.synergy?.synergy) {
      setHoveredCell({ row, col });
      setTooltipData({
        synergy: cell.synergy.synergy,
        position: { x: event.clientX, y: event.clientY },
      });
    }
  }, [heatmapData]);

  const handleCellLeave = useCallback(() => {
    setHoveredCell(null);
    setTooltipData(null);
  }, []);

  const displayData = searchQuery.trim() ? searchResults : tableData;

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-ivory mb-2">
          Synergy Analysis
        </h2>
        <p className="text-amber-200">
          Interactive heatmap and table visualization of stat synergies
        </p>
      </div>

      {/* Controls Row */}
      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'} gap-4`}>
        {/* Search */}
        {showSearch && (
          <SearchBar
            onSearch={setSearchQuery}
            placeholder="Search synergies..."
            compact={compact}
          />
        )}

        {/* Filters */}
        <FilterControls
          filters={filters}
          onFilterChange={updateFilters}
          onReset={resetFilters}
          compact={compact}
        />

        {/* Statistics */}
        {showStatistics && (
          <StatisticsPanel
            statistics={getStatistics()}
            compact={compact}
          />
        )}

        {/* Export Controls */}
        {showExportControls && (
          <ExportControls
            onExportCSV={handleExportCSV}
            onExportJSON={handleExportJSON}
            compact={compact}
          />
        )}
      </div>

      {/* Heatmap */}
      <div className="bg-slate-900/95 border border-amber-400/40 rounded-lg p-4 overflow-x-auto">
        <h3 className="text-lg font-semibold text-ivory mb-4">Synergy Heatmap</h3>
        <div className="min-w-150">
          <table className="border border-amber-400/30 bg-slate-950/95 text-ivory rounded-lg">
            <thead>
              <tr className="border-b border-amber-400/30">
                <th className="px-2 py-1 text-xs uppercase tracking-wider text-amber-200 text-left">
                  Stats
                </th>
                {statIds.map(statId => (
                  <th key={statId} className="px-2 py-1 text-xs uppercase tracking-wider text-amber-200 text-center min-w-20">
                    {statLabels[statId] || statId}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {statIds.map((rowStatId, rowIndex) => (
                <tr key={rowStatId} className="border-b border-amber-400/20">
                  <td className="px-2 py-1 text-sm font-medium text-amber-200">
                    {statLabels[rowStatId] || rowStatId}
                  </td>
                  {statIds.map((colStatId, colIndex) => {
                    const cell = heatmapData[rowIndex]?.[colIndex];
                    const isHovered = hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex;
                    const isDiagonal = rowIndex === colIndex;
                    
                    return (
                      <td
                        key={colStatId}
                        className={`
                          px-2 py-1 text-center text-xs font-mono transition-all duration-200
                          ${isDiagonal ? 'bg-slate-800/50' : ''}
                          ${isHovered ? 'ring-2 ring-amber-400/50' : ''}
                          ${!isDiagonal ? 'cursor-pointer hover:brightness-110' : ''}
                        `}
                        style={{
                          ...(cell?.synergy.colorConfig && {
                            backgroundColor: cell.synergy.colorConfig.bg,
                            borderColor: cell.synergy.colorConfig.border,
                            color: cell.synergy.colorConfig.text,
                          })
                        }}
                        onMouseEnter={(e) => handleCellHover(rowIndex, colIndex, e)}
                        onMouseLeave={handleCellLeave}
                      >
                        {cell?.synergy.text}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/95 border border-amber-400/40 rounded-lg p-4 overflow-x-auto">
        <h3 className="text-lg font-semibold text-ivory mb-4">
          Synergy Details {searchQuery && `(Results: ${displayData.length})`}
        </h3>
        <div className="min-w-200">
          <table className="border border-amber-400/30 bg-slate-950/95 text-ivory rounded-lg">
            <thead>
              <tr className="border-b border-amber-400/30">
                <th className="px-4 py-2 text-xs uppercase tracking-wider text-amber-200 text-left">
                  Stat Pair
                </th>
                <th className="px-4 py-2 text-xs uppercase tracking-wider text-amber-200 text-center">
                  Multiplier
                </th>
                <th className="px-4 py-2 text-xs uppercase tracking-wider text-amber-200 text-center">
                  Expected
                </th>
                <th className="px-4 py-2 text-xs uppercase tracking-wider text-amber-200 text-center">
                  Type
                </th>
                <th className="px-4 py-2 text-xs uppercase tracking-wider text-amber-200 text-center">
                  Combined Score
                </th>
                <th className="px-4 py-2 text-xs uppercase tracking-wider text-amber-200 text-center">
                  MU1 Score
                </th>
                <th className="px-4 py-2 text-xs uppercase tracking-wider text-amber-200 text-center">
                  MU2 Score
                </th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, index) => (
                <tr key={index} className="border-b border-amber-400/20 hover:bg-slate-800/30">
                  <td className="px-4 py-2 text-sm font-medium text-amber-200">
                    {row.statPair}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-mono ${
                      row.synergy.synergy?.isOpSynergy ? 'bg-emerald-600' :
                      row.synergy.synergy?.isWeakSynergy ? 'bg-rose-600' :
                      'bg-amber-600'
                    }`}>
                      {row.synergy.text}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center font-mono text-sm">
                    {row.synergy.synergy?.expectedScore?.toFixed(2) || 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className={`text-xs font-medium ${
                      row.synergy.synergy?.isOpSynergy ? 'text-emerald-400' :
                      row.synergy.synergy?.isWeakSynergy ? 'text-rose-400' :
                      'text-amber-400'
                    }`}>
                      {row.synergy.synergy?.isOpSynergy ? 'OP' : 
                       row.synergy.synergy?.isWeakSynergy ? 'Weak' : 'Normal'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center font-mono text-sm">
                    {row.combinedScore.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-center font-mono text-sm">
                    {row.marginalUtilities[0]?.averageScore?.toFixed(2) || 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-center font-mono text-sm">
                    {row.marginalUtilities[1]?.averageScore?.toFixed(2) || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tooltip */}
      {tooltipData && (
        <SynergyTooltip
          synergy={tooltipData.synergy}
          statLabels={statLabels}
          show={!!tooltipData}
          position={tooltipData.position}
        />
      )}
    </div>
  );
}
