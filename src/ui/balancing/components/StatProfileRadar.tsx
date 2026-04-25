/**
 * Stat Profile Radar Chart Component
 * 
 * Advanced radar chart visualization for displaying stat profiles
 * with interactive features, filtering, and comprehensive analysis.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  useStatProfile, 
  type StatProfileRadarConfig,
  type StatProfileFilterOptions,
  type ProcessedStatData,
  type RadarChartDataset,
  type RadarChartAxis,
} from '@/ui/balancing/hooks/useStatProfile';
import type { 
  StressTestArchetype, 
  MarginalUtilityResult,
  SynergyResult 
} from '@/balancing/stressTesting/types';
import { STAT_VISUALIZATION_CONFIG } from '@/balancing/config/idleVillage/statVisualizationConfig';

const buildTestId = (label: string): string =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'swatch';

interface StatProfileRadarProps {
  /** Stress test archetypes data */
  archetypes: StressTestArchetype[];
  /** Marginal utility results */
  marginalUtilities: MarginalUtilityResult[];
  /** Synergy results */
  synergies: SynergyResult[];
  /** Stat labels for display */
  statLabels: Record<string, string>;
  /** Radar chart configuration */
  config?: Partial<StatProfileRadarConfig>;
  /** Initial filter options */
  initialFilters?: Partial<StatProfileFilterOptions>;
  /** Show statistics panel */
  showStatistics?: boolean;
  /** Show export controls */
  showExportControls?: boolean;
  /** Show search bar */
  showSearch?: boolean;
  /** Show dataset controls */
  showDatasetControls?: boolean;
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Chart size */
  size?: 'small' | 'medium' | 'large';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Radar chart SVG component
 */
const RadarChartSVG: React.FC<{
  datasets: RadarChartDataset[];
  statData: ProcessedStatData[];
  size: 'small' | 'medium' | 'large';
  showGrid: boolean;
  showLabels: boolean;
  animateTransitions: boolean;
}> = ({ datasets, statData, size, showGrid, showLabels, animateTransitions }) => {
  const svgSize = size === 'small' ? 300 : size === 'medium' ? 400 : 500;
  const center = svgSize / 2;
  const radius = svgSize * 0.35;
  const { styles } = STAT_VISUALIZATION_CONFIG;
  
  // Calculate angles for each stat
  const angleStep = (2 * Math.PI) / statData.length;
  
  // Generate points for radar polygon
  const generatePoints = (data: RadarChartAxis[]) => {
    return data.map((point, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = center + radius * point.value * Math.cos(angle);
      const y = center + radius * point.value * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };
  
  // Generate grid lines
  const generateGridLines = () => {
    const lines = [];
    for (let level = 0.2; level <= 1; level += 0.2) {
      const points = statData.map((_, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const x = center + radius * level * Math.cos(angle);
        const y = center + radius * level * Math.sin(angle);
        return `${x},${y}`;
      }).join(' ');
      lines.push(points);
    }
    return lines;
  };
  
  // Generate axis lines
  const generateAxisLines = () => {
    return statData.map((_, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return `${center},${center} ${x},${y}`;
    });
  };
  
  return (
    <svg width={svgSize} height={svgSize} className="w-full h-full">
      {/* Background circle */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill={styles.background}
        stroke={styles.grid}
        strokeWidth="1"
      />
      
      {/* Grid lines */}
      {showGrid && generateGridLines().map((points, index) => (
        <polygon
          key={`grid-${index}`}
          points={points}
          fill="none"
          stroke={styles.grid}
          strokeWidth="1"
        />
      ))}
      
      {/* Axis lines */}
      {generateAxisLines().map((line, index) => (
        <line
          key={`axis-${index}`}
          x1={line.split(' ')[0].split(',')[0]}
          y1={line.split(' ')[0].split(',')[1]}
          x2={line.split(' ')[1].split(',')[0]}
          y2={line.split(' ')[1].split(',')[1]}
          stroke={styles.grid}
          strokeWidth="1"
        />
      ))}
      
      {/* Stat labels */}
      {showLabels && statData.map((stat, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const labelRadius = radius + 20;
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);
        
        return (
          <text
            key={`label-${index}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-medium"
            style={{
              fontSize: size === 'small' ? '10px' : size === 'medium' ? '11px' : '12px',
              fill: styles.label,
            }}
          >
            {stat.statName}
          </text>
        );
      })}
      
      {/* Dataset polygons */}
      {datasets.filter(dataset => dataset.visible).map((dataset, datasetIndex) => (
        <g key={`dataset-${datasetIndex}`}>
          <polygon
            points={generatePoints(dataset.data)}
            fill={dataset.fillColor}
            stroke={dataset.color}
            strokeWidth={dataset.borderWidth}
            className={animateTransitions ? 'transition-all duration-300' : ''}
            style={{
              fillOpacity: 0.3,
              strokeOpacity: 0.8,
            }}
          />
          
          {/* Data points */}
          {dataset.data.map((point, pointIndex) => (
            <circle
              key={`point-${pointIndex}`}
              cx={center + radius * point.value * Math.cos(pointIndex * angleStep - Math.PI / 2)}
              cy={center + radius * point.value * Math.sin(pointIndex * angleStep - Math.PI / 2)}
              r={dataset.pointSize}
              fill={dataset.color}
              stroke="rgba(30, 41, 59, 0.8)"
              strokeWidth="1"
              className={animateTransitions ? 'transition-all duration-200' : ''}
            />
          ))}
        </g>
      ))}
    </svg>
  );
};

/**
 * Statistics panel component
 */
const StatisticsPanel: React.FC<{
  statistics: ReturnType<ReturnType<typeof useStatProfile>['getStatistics']>;
  compact?: boolean;
}> = ({ statistics, compact = false }) => {
  const stats = [
    { label: 'Total Stats', value: statistics.totalStats, color: 'text-amber-200' },
    { label: 'Archetypes', value: statistics.totalArchetypes, color: 'text-cyan-300' },
    { label: 'Avg Value', value: statistics.averageStatValue.toFixed(1), color: 'text-emerald-400' },
    { label: 'Highest', value: statistics.highestStatValue.toFixed(1), color: 'text-green-300' },
    { label: 'Lowest', value: statistics.lowestStatValue.toFixed(1), color: 'text-orange-300' },
    { label: 'Avg Variance', value: statistics.averageVariance.toFixed(2), color: 'text-purple-300' },
  ];

  return (
    <div className={`bg-slate-900/95 border border-amber-400/40 rounded-lg p-4 ${compact ? 'p-2' : ''}`}>
      <h3 className={`text-ivory font-semibold mb-3 ${compact ? 'text-sm' : ''}`}>Stat Profile Statistics</h3>
      <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-3'} gap-3`}>
        {stats.map(stat => (
          <div key={stat.label} className="text-center">
            <div className={`text-xl font-bold ${stat.color}`}>
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
  filters: StatProfileFilterOptions;
  onFilterChange: (filters: Partial<StatProfileFilterOptions>) => void;
  onReset: () => void;
  compact?: boolean;
}> = ({ filters, onFilterChange, onReset, compact = false }) => {
  return (
    <div className={`bg-slate-900/95 border border-amber-400/40 rounded-lg p-4 ${compact ? 'p-2' : ''}`}>
      <h3 className={`text-ivory font-semibold mb-3 ${compact ? 'text-sm' : ''}`}>Filters</h3>
      
      <div className={`space-y-3 ${compact ? 'space-y-2' : ''}`}>
        {/* Average Score Range */}
        <div>
          <label className={`block text-amber-200 text-sm mb-1 ${compact ? 'text-xs' : ''}`}>
            Average Score Range
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={filters.minAverageScore}
              onChange={(e) => onFilterChange({ minAverageScore: parseFloat(e.target.value) })}
              className="w-20 px-2 py-1 bg-slate-800 border border-amber-400/40 rounded text-ivory text-sm"
              placeholder="Min"
            />
            <span className="text-amber-200 text-sm">to</span>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={filters.maxAverageScore}
              onChange={(e) => onFilterChange({ maxAverageScore: parseFloat(e.target.value) })}
              className="w-20 px-2 py-1 bg-slate-800 border border-amber-400/40 rounded text-ivory text-sm"
              placeholder="Max"
            />
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <label className={`block text-amber-200 text-sm mb-1 ${compact ? 'text-xs' : ''}`}>
            Sort By
          </label>
          <div className="flex gap-2">
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as StatProfileFilterOptions['sortBy'] })}
              className="flex-1 px-2 py-1 bg-slate-800 border border-amber-400/40 rounded text-ivory text-sm"
            >
              <option value="name">Name</option>
              <option value="average">Average</option>
              <option value="variance">Variance</option>
              <option value="count">Count</option>
            </select>
            <select
              value={filters.sortDirection}
              onChange={(e) => onFilterChange({ sortDirection: e.target.value as StatProfileFilterOptions['sortDirection'] })}
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
 * Dataset controls component
 */
const DatasetControls: React.FC<{
  datasets: RadarChartDataset[];
  onToggleDataset: (datasetLabel: string) => void;
  compact?: boolean;
}> = ({ datasets, onToggleDataset, compact = false }) => {
  return (
    <div className={`bg-slate-900/95 border border-amber-400/40 rounded-lg p-4 ${compact ? 'p-2' : ''}`}>
      <h3 className={`text-ivory font-semibold mb-3 ${compact ? 'text-sm' : ''}`}>Datasets</h3>
      <div className="space-y-2">
        {datasets.map(dataset => (
          <div key={dataset.label} className="flex items-center justify-between">
            <span className={`text-sm ${compact ? 'text-xs' : ''} ${
              dataset.visible ? 'text-ivory' : 'text-amber-400/50'
            }`}>
              {dataset.label}
            </span>
            <button
              onClick={() => onToggleDataset(dataset.label)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                dataset.visible 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-ivory' 
                  : 'bg-slate-700 hover:bg-slate-600 text-amber-300'
              }`}
            >
              {dataset.visible ? 'Hide' : 'Show'}
            </button>
          </div>
        ))}
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
}> = ({ onSearch, placeholder = 'Search stats...', compact = false }) => {
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
        </svg>
      </div>
    </div>
  );
};

/**
 * Main Stat Profile Radar Chart Component
 */
export default function StatProfileRadar({
  archetypes,
  marginalUtilities,
  synergies,
  statLabels,
  config,
  initialFilters,
  showStatistics = true,
  showExportControls = true,
  showSearch = true,
  showDatasetControls = true,
  compact = false,
  size = 'medium',
  className = '',
}: StatProfileRadarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const {
    statData,
    datasets,
    filters,
    updateFilters,
    resetFilters,
    getStatistics,
    exportToCSV,
    exportToJSON,
    searchStats,
    getColorScheme,
    toggleDataset,
    getDatasetVisibility,
  } = useStatProfile({
    archetypes,
    marginalUtilities,
    synergies,
    statLabels,
    config,
    initialFilters,
  });

  // Apply initial filters
  React.useEffect(() => {
    if (initialFilters) {
      updateFilters(initialFilters);
    }
  }, [initialFilters, updateFilters]);

  // Handle search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return statData;
    return searchStats(searchQuery);
  }, [searchQuery, statData, searchStats]);

  // Handle export
  const handleExportCSV = useCallback(() => {
    const csv = exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stat-profile-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportToCSV]);

  const handleExportJSON = useCallback(() => {
    const json = exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stat-profile-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportToJSON]);

  const displayData = searchQuery.trim() ? searchResults : statData;

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-ivory mb-2">
          Stat Profile Radar Chart
        </h2>
        <p className="text-amber-200">
          Interactive radar chart visualization of stat profiles and distributions
        </p>
      </div>

      {/* Controls Row */}
      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'} gap-4`}>
        {/* Search */}
        {showSearch && (
          <SearchBar
            onSearch={setSearchQuery}
            placeholder="Search stats..."
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

      {/* Dataset Controls */}
      {showDatasetControls && (
        <DatasetControls
          datasets={datasets}
          onToggleDataset={toggleDataset}
          compact={compact}
        />
      )}

      {/* Radar Chart */}
      <div className="bg-slate-900/95 border border-amber-400/40 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-ivory mb-4">
          Stat Profile Visualization {searchQuery && `(Results: ${displayData.length})`}
        </h3>
        
        <div className="flex justify-center">
          <div className={`relative ${compact ? 'w-64 h-64' : size === 'small' ? 'w-80 h-80' : size === 'medium' ? 'w-96 h-96' : 'w-120 h-120'}`}>
            {displayData.length > 0 ? (
              <RadarChartSVG
                datasets={datasets}
                statData={displayData}
                size={size}
                showGrid={config?.showGrid !== false}
                showLabels={config?.showStatLabels !== false}
                animateTransitions={config?.animateTransitions !== false}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-amber-200 text-center">
                  No stat data available
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      {datasets.length > 0 && (
        <div className="bg-slate-900/95 border border-amber-400/40 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-ivory mb-4">Legend</h3>
          <div className="flex flex-wrap gap-4">
            {datasets.filter(dataset => getDatasetVisibility(dataset.label)).map(dataset => (
              <div key={dataset.label} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: dataset.color }}
                  data-testid={`legend-swatch-${buildTestId(dataset.label)}`}
                />
                <span className="text-sm text-ivory">{dataset.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Color Scheme Info */}
      <div className="bg-slate-900/95 border border-amber-400/40 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-ivory mb-4">Color Scheme</h3>
        <div className="flex flex-wrap gap-2">
          {getColorScheme().map((color, index) => {
            const levelLabel = index === 0 ? 'Low' : index === 1 ? 'Medium' : 'High';
            return (
              <div key={levelLabel} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                  data-testid={`color-scheme-${levelLabel.toLowerCase()}`}
                />
                <span className="text-sm text-amber-200">
                  {levelLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
