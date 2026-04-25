/**
 * QuestTelemetryHeatmap Component
 *
 * Configurable heatmap visualization for quest telemetry data.
 * Supports multiple visualization modes, interactive features, and real-time updates.
 */

import React, { useMemo, useState, useCallback } from 'react';
import clsx from 'clsx';
import type { AggregatedTelemetry } from '@/ui/idleVillage/hooks/useQuestTelemetry';
import { useIdleVillageConfigStore } from '@/balancing/config/idleVillage/IdleVillageConfigStore';
import type { QuestTypeDefinition } from '@/balancing/config/idleVillage/types';

/**
 * Heatmap visualization modes
 */
export type HeatmapMode = 'grid' | 'timeline' | 'matrix' | 'radial';

/**
 * Heatmap color schemes
 */
export type ColorScheme = 'default' | 'viridis' | 'plasma' | 'warm' | 'cool' | 'gilded';

/**
 * Heatmap configuration interface
 */
export interface QuestHeatmapConfig {
  mode: HeatmapMode;
  colorScheme: ColorScheme;
  showLabels: boolean;
  showValues: boolean;
  showGrid: boolean;
  animateTransitions: boolean;
  maxItems: number;
  cellSize: number;
  gapSize: number;
  rounding: number;
  threshold: number;
}

/**
 * Default heatmap configuration
 */
export const DEFAULT_HEATMAP_CONFIG: QuestHeatmapConfig = {
  mode: 'grid',
  colorScheme: 'gilded',
  showLabels: true,
  showValues: true,
  showGrid: true,
  animateTransitions: true,
  maxItems: 20,
  cellSize: 40,
  gapSize: 2,
  rounding: 1,
  threshold: 0.01,
};

/**
 * Color scheme definitions
 */
const COLOR_SCHEMES: Record<ColorScheme, (intensity: number) => string> = {
  default: (intensity) => {
    const hue = 240 - intensity * 60; // Blue to yellow
    const lightness = 90 - intensity * 40;
    return `hsl(${hue}, 70%, ${lightness}%)`;
  },
  viridis: (intensity) => {
    // Viridis-like gradient
    const r = Math.round(68 + intensity * (253 - 68));
    const g = Math.round(1 + intensity * (231 - 1));
    const b = Math.round(84 + intensity * (37 - 84));
    return `rgb(${r}, ${g}, ${b})`;
  },
  plasma: (intensity) => {
    // Plasma-like gradient
    const r = Math.round(13 + intensity * (240 - 13));
    const g = Math.round(8 + intensity * (59 - 8));
    const b = Math.round(135 + intensity * (65 - 135));
    return `rgb(${r}, ${g}, ${b})`;
  },
  warm: (intensity) => {
    // Warm gradient (red to yellow)
    const hue = intensity * 60;
    return `hsl(${hue}, 80%, 60%)`;
  },
  cool: (intensity) => {
    // Cool gradient (blue to cyan)
    const hue = 180 + intensity * 60;
    return `hsl(${hue}, 70%, 50%)`;
  },
  gilded: (intensity) => {
    // Gilded Observatory theme (slate to amber)
    const r = Math.round(71 + intensity * (251 - 71));
    const g = Math.round(85 + intensity * (191 - 85));
    const b = Math.round(105 + intensity * (36 - 105));
    return `rgb(${r}, ${g}, ${b})`;
  },
};

/**
 * Quest telemetry heatmap component props
 */
export interface QuestTelemetryHeatmapProps {
  className?: string;
  telemetry: AggregatedTelemetry;
  config?: Partial<QuestHeatmapConfig>;
  onCellClick?: (questType: string, value: number, metadata: Record<string, unknown>) => void;
  onConfigChange?: (config: QuestHeatmapConfig) => void;
  showControls?: boolean;
  compact?: boolean;
}

/**
 * Grid heatmap visualization
 */
const GridHeatmap: React.FC<{
  questTypeBreakdown: Record<string, number>;
  questTypeDefinitions: Record<string, QuestTypeDefinition>;
  config: QuestHeatmapConfig;
  onCellClick?: (questType: string, value: number, metadata: Record<string, unknown>) => void;
}> = ({ questTypeBreakdown, questTypeDefinitions, config, onCellClick }) => {
  const totalQuests = Object.values(questTypeBreakdown).reduce((sum, count) => sum + count, 0);
  const colorFunction = COLOR_SCHEMES[config.colorScheme];
  
  const sortedQuestTypes = useMemo(() => {
    return Object.entries(questTypeDefinitions)
      .sort(([, a], [, b]) => (a.priority ?? Number.MAX_SAFE_INTEGER) - (b.priority ?? Number.MAX_SAFE_INTEGER))
      .slice(0, config.maxItems);
  }, [questTypeDefinitions, config.maxItems]);

  const maxCount = Math.max(...Object.values(questTypeBreakdown), 1);

  const handleCellClick = useCallback((questTypeId: string, count: number) => {
    if (onCellClick) {
      const percentage = totalQuests > 0 ? count / totalQuests : 0;
      const definition = questTypeDefinitions[questTypeId];
      onCellClick(questTypeId, count, {
        percentage,
        definition,
        total: totalQuests,
      });
    }
  }, [onCellClick, questTypeDefinitions, totalQuests]);

  return (
    <div className="space-y-3">
      {config.showLabels && (
        <h4 className="text-xs font-medium text-slate-300 uppercase tracking-wide">
          Quest Type Distribution
        </h4>
      )}
      
      <div 
        className={clsx(
          'grid gap-1',
          config.showGrid && 'border border-slate-700/30 p-2 rounded-lg bg-slate-900/20'
        )}
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${config.cellSize}px, 1fr))`,
          gap: `${config.gapSize}px`,
        }}
      >
        {sortedQuestTypes.map(([id, definition]) => {
          const count = questTypeBreakdown[id] || 0;
          const intensity = count > config.threshold ? count / maxCount : 0;
          const color = colorFunction(intensity);
          
          return (
            <div
              key={id}
              className={clsx(
                'relative rounded cursor-pointer transition-all duration-300 hover:scale-110 hover:z-10',
                config.animateTransitions && 'transition-all duration-300'
              )}
              style={{
                backgroundColor: color,
                height: `${config.cellSize}px`,
                opacity: count > 0 ? 0.9 : 0.2,
              }}
              onClick={() => handleCellClick(id, count)}
              title={`${definition.label}: ${count} quests (${((count / totalQuests) * 100).toFixed(1)}%)`}
            >
              {config.showValues && count > 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-white drop-shadow-md">
                    {count}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {config.showLabels && (
        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
          {sortedQuestTypes.map(([id, definition]) => (
            <div key={id} className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded"
                style={{ backgroundColor: COLOR_SCHEMES[config.colorScheme](0.5) }}
              />
              <span>{definition.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Timeline heatmap visualization
 */
const TimelineHeatmap: React.FC<{
  recentQuests: AggregatedTelemetry['recentQuests'];
  questTypeDefinitions: Record<string, QuestTypeDefinition>;
  config: QuestHeatmapConfig;
  onCellClick?: (questType: string, value: number, metadata: Record<string, unknown>) => void;
}> = ({ recentQuests, questTypeDefinitions, config, onCellClick }) => {
  const colorFunction = COLOR_SCHEMES[config.colorScheme];
  
  const timelineData = useMemo(() => {
    return recentQuests
      .slice(0, config.maxItems)
      .map((entry, index) => {
        const definition = Object.values(questTypeDefinitions).find(def => 
          def.matchers?.some(matcher => 
            matcher.includes?.some(needle => entry.questId.includes(needle.toLowerCase()))
          )
        );
        
        return {
          entry,
          questType: definition?.id || 'unknown',
          definition: definition || { id: 'unknown', label: 'Unknown' },
          index,
          success: entry.result.success,
          duration: entry.result.durationSeconds,
        };
      });
  }, [recentQuests, questTypeDefinitions, config.maxItems]);

  const maxDuration = Math.max(...timelineData.map(d => d.duration), 1);

  const handleCellClick = useCallback((data: typeof timelineData[0]) => {
    if (onCellClick) {
      onCellClick(data.questType, 1, {
        entry: data.entry,
        definition: data.definition,
        success: data.success,
        duration: data.duration,
        timelineIndex: data.index,
      });
    }
  }, [onCellClick]);

  return (
    <div className="space-y-3">
      {config.showLabels && (
        <h4 className="text-xs font-medium text-slate-300 uppercase tracking-wide">
          Recent Quest Timeline
        </h4>
      )}
      
      <div className="space-y-1">
        {timelineData.map((data) => {
          const intensity = data.duration / maxDuration;
          const color = colorFunction(intensity);
          const successColor = data.success ? color : `${color}88`;
          
          return (
            <div
              key={`${data.entry.questId}-${data.index}`}
              className={clsx(
                'flex items-center gap-2 p-2 rounded cursor-pointer transition-all duration-300 hover:scale-105',
                config.animateTransitions && 'transition-all duration-300'
              )}
              style={{ backgroundColor: successColor }}
              onClick={() => handleCellClick(data)}
              title={`${data.definition.label} - ${data.success ? 'Success' : 'Failure'} (${data.duration}s)`}
            >
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: data.success ? '#10b981' : '#ef4444' }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white truncate">
                  {data.definition.label}
                </div>
                {config.showValues && (
                  <div className="text-[10px] text-slate-300">
                    {data.duration.toFixed(1)}s
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-400">
                {new Date(data.entry.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Matrix heatmap visualization
 */
const MatrixHeatmap: React.FC<{
  questTypeBreakdown: Record<string, number>;
  successRates: Record<string, number>;
  questTypeDefinitions: Record<string, QuestTypeDefinition>;
  config: QuestHeatmapConfig;
  onCellClick?: (questType: string, value: number, metadata: Record<string, unknown>) => void;
}> = ({ questTypeBreakdown, successRates, questTypeDefinitions, config, onCellClick }) => {
  const colorFunction = COLOR_SCHEMES[config.colorScheme];
  
  const matrixData = useMemo(() => {
    return Object.entries(questTypeDefinitions)
      .sort(([, a], [, b]) => (a.priority ?? Number.MAX_SAFE_INTEGER) - (b.priority ?? Number.MAX_SAFE_INTEGER))
      .slice(0, config.maxItems)
      .map(([id, definition]) => ({
        id,
        definition,
        count: questTypeBreakdown[id] || 0,
        successRate: successRates[id] || 0,
      }));
  }, [questTypeDefinitions, questTypeBreakdown, successRates, config.maxItems]);

  const maxCount = Math.max(...matrixData.map(d => d.count), 1);

  const handleCellClick = useCallback((data: typeof matrixData[0]) => {
    if (onCellClick) {
      onCellClick(data.id, data.count, {
        definition: data.definition,
        successRate: data.successRate,
        percentage: data.count / Math.max(...Object.values(questTypeBreakdown), 1),
      });
    }
  }, [onCellClick, questTypeBreakdown]);

  return (
    <div className="space-y-3">
      {config.showLabels && (
        <h4 className="text-xs font-medium text-slate-300 uppercase tracking-wide">
          Quest Type Matrix (Count vs Success Rate)
        </h4>
      )}
      
      <div className="space-y-1">
        {matrixData.map((data) => {
          const countIntensity = data.count / maxCount;
          const successIntensity = data.successRate;
          
          const countColor = colorFunction(countIntensity);
          const successColor = COLOR_SCHEMES.cool(successIntensity);
          
          return (
            <div
              key={data.id}
              className={clsx(
                'flex items-center gap-2 p-2 rounded cursor-pointer transition-all duration-300 hover:scale-105',
                config.animateTransitions && 'transition-all duration-300'
              )}
              style={{ backgroundColor: `${countColor}33` }}
              onClick={() => handleCellClick(data)}
              title={`${data.definition.label}: ${data.count} quests, ${((data.successRate) * 100).toFixed(1)}% success`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white truncate">
                  {data.definition.label}
                </div>
                {config.showValues && (
                  <div className="flex items-center gap-2 text-[10px] text-slate-300">
                    <span>Count: {data.count}</span>
                    <span>Success: {((data.successRate) * 100).toFixed(1)}%</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: countColor }}
                  title={`Count intensity: ${(countIntensity * 100).toFixed(1)}%`}
                />
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: successColor }}
                  title={`Success rate: ${((data.successRate) * 100).toFixed(1)}%`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Radial heatmap visualization
 */
const RadialHeatmap: React.FC<{
  questTypeBreakdown: Record<string, number>;
  questTypeDefinitions: Record<string, QuestTypeDefinition>;
  config: QuestHeatmapConfig;
  onCellClick?: (questType: string, value: number, metadata: Record<string, unknown>) => void;
}> = ({ questTypeBreakdown, questTypeDefinitions, config, onCellClick }) => {
  const colorFunction = COLOR_SCHEMES[config.colorScheme];
  
  const radialData = useMemo(() => {
    const total = Object.values(questTypeBreakdown).reduce((sum, count) => sum + count, 0);
    return Object.entries(questTypeDefinitions)
      .sort(([, a], [, b]) => (a.priority ?? Number.MAX_SAFE_INTEGER) - (b.priority ?? Number.MAX_SAFE_INTEGER))
      .slice(0, config.maxItems)
      .map(([id, definition]) => ({
        id,
        definition,
        count: questTypeBreakdown[id] || 0,
        percentage: total > 0 ? (questTypeBreakdown[id] || 0) / total : 0,
      }));
  }, [questTypeDefinitions, questTypeBreakdown, config.maxItems]);

  const maxCount = Math.max(...radialData.map(d => d.count), 1);

  const handleCellClick = useCallback((data: typeof radialData[0]) => {
    if (onCellClick) {
      onCellClick(data.id, data.count, {
        definition: data.definition,
        percentage: data.percentage,
      });
    }
  }, [onCellClick]);

  const radius = Math.min(config.cellSize * 3, 120);
  const center = radius + 20;

  return (
    <div className="space-y-3">
      {config.showLabels && (
        <h4 className="text-xs font-medium text-slate-300 uppercase tracking-wide">
          Radial Quest Distribution
        </h4>
      )}
      
      <div className="flex justify-center">
        <svg width={center * 2} height={center * 2} className="overflow-visible">
          {radialData.map((data, index) => {
            const intensity = data.count / maxCount;
            const color = colorFunction(intensity);
            const angle = (index / radialData.length) * 2 * Math.PI - Math.PI / 2;
            const innerRadius = radius * 0.3;
            const outerRadius = radius * (0.3 + intensity * 0.7);
            
            const x1 = center + innerRadius * Math.cos(angle);
            const y1 = center + innerRadius * Math.sin(angle);
            const x2 = center + outerRadius * Math.cos(angle);
            const y2 = center + outerRadius * Math.sin(angle);
            
            return (
              <g key={data.id}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={color}
                  strokeWidth={8}
                  className={clsx(
                    'cursor-pointer transition-all duration-300',
                    config.animateTransitions && 'transition-all duration-300'
                  )}
                  onClick={() => handleCellClick(data)}
                  opacity={data.count > 0 ? 0.9 : 0.2}
                  title={`${data.definition.label}: ${data.count} quests (${(data.percentage * 100).toFixed(1)}%)`}
                />
                {config.showValues && data.count > 0 && (
                  <text
                    x={center + (outerRadius + 15) * Math.cos(angle)}
                    y={center + (outerRadius + 15) * Math.sin(angle)}
                    fill="white"
                    fontSize="10"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none"
                  >
                    {data.count}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      
      {config.showLabels && (
        <div className="flex flex-wrap gap-2 text-xs text-slate-400 justify-center">
          {radialData.map((data) => (
            <div key={data.id} className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded"
                style={{ backgroundColor: colorFunction(data.count / maxCount) }}
              />
              <span>{data.definition.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Heatmap controls component
 */
const HeatmapControls: React.FC<{
  config: QuestHeatmapConfig;
  onConfigChange: (config: QuestHeatmapConfig) => void;
  compact?: boolean;
}> = ({ config, onConfigChange, compact }) => {
  const handleConfigChange = useCallback((updates: Partial<QuestHeatmapConfig>) => {
    onConfigChange({ ...config, ...updates });
  }, [config, onConfigChange]);

  return (
    <div className={clsx(
      'flex flex-wrap gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50',
      compact && 'p-2 gap-1'
    )}>
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-400">Mode:</label>
        <select
          value={config.mode}
          onChange={(e) => handleConfigChange({ mode: e.target.value as HeatmapMode })}
          className="text-xs bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white"
        >
          <option value="grid">Grid</option>
          <option value="timeline">Timeline</option>
          <option value="matrix">Matrix</option>
          <option value="radial">Radial</option>
        </select>
      </div>
      
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-400">Colors:</label>
        <select
          value={config.colorScheme}
          onChange={(e) => handleConfigChange({ colorScheme: e.target.value as ColorScheme })}
          className="text-xs bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white"
        >
          <option value="default">Default</option>
          <option value="viridis">Viridis</option>
          <option value="plasma">Plasma</option>
          <option value="warm">Warm</option>
          <option value="cool">Cool</option>
          <option value="gilded">Gilded</option>
        </select>
      </div>
      
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={config.showValues}
            onChange={(e) => handleConfigChange({ showValues: e.target.checked })}
            className="rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500"
          />
          Values
        </label>
        
        <label className="flex items-center gap-1 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={config.showGrid}
            onChange={(e) => handleConfigChange({ showGrid: e.target.checked })}
            className="rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500"
          />
          Grid
        </label>
        
        <label className="flex items-center gap-1 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={config.animateTransitions}
            onChange={(e) => handleConfigChange({ animateTransitions: e.target.checked })}
            className="rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500"
          />
          Animate
        </label>
      </div>
    </div>
  );
};

/**
 * Main QuestTelemetryHeatmap component
 */
export const QuestTelemetryHeatmap: React.FC<QuestTelemetryHeatmapProps> = ({
  className,
  telemetry,
  config = {},
  onCellClick,
  onConfigChange,
  showControls = true,
  compact = false,
}) => {
  const questTypeDefinitions = useIdleVillageConfigStore((state) => state.config.questTypes ?? {});
  
  const [currentConfig, setCurrentConfig] = useState<QuestHeatmapConfig>({
    ...DEFAULT_HEATMAP_CONFIG,
    ...config,
  });

  const handleConfigChange = useCallback((newConfig: QuestHeatmapConfig) => {
    setCurrentConfig(newConfig);
    onConfigChange?.(newConfig);
  }, [onConfigChange]);

  // Calculate success rates for matrix view
  const successRates = useMemo(() => {
    const rates: Record<string, number> = {};
    Object.entries(telemetry.questTypeBreakdown).forEach(([questType, count]) => {
      const typeEntries = telemetry.recentQuests.filter(entry => {
        const definition = Object.values(questTypeDefinitions).find(def => 
          def.matchers?.some(matcher => 
            matcher.includes?.some(needle => entry.questId.includes(needle.toLowerCase()))
          )
        );
        return definition?.id === questType;
      });
      
      const successful = typeEntries.filter(entry => entry.result.success).length;
      rates[questType] = typeEntries.length > 0 ? successful / typeEntries.length : 0;
    });
    return rates;
  }, [telemetry.questTypeBreakdown, telemetry.recentQuests, questTypeDefinitions]);

  const renderHeatmap = useCallback(() => {
    const commonProps = {
      questTypeDefinitions,
      config: currentConfig,
      onCellClick,
    };

    switch (currentConfig.mode) {
      case 'grid':
        return (
          <GridHeatmap
            questTypeBreakdown={telemetry.questTypeBreakdown}
            {...commonProps}
          />
        );
      case 'timeline':
        return (
          <TimelineHeatmap
            recentQuests={telemetry.recentQuests}
            {...commonProps}
          />
        );
      case 'matrix':
        return (
          <MatrixHeatmap
            questTypeBreakdown={telemetry.questTypeBreakdown}
            successRates={successRates}
            {...commonProps}
          />
        );
      case 'radial':
        return (
          <RadialHeatmap
            questTypeBreakdown={telemetry.questTypeBreakdown}
            {...commonProps}
          />
        );
      default:
        return (
          <GridHeatmap
            questTypeBreakdown={telemetry.questTypeBreakdown}
            {...commonProps}
          />
        );
    }
  }, [currentConfig, telemetry, questTypeDefinitions, successRates, onCellClick]);

  if (!telemetry || telemetry.totalQuests === 0) {
    return (
      <div className={clsx(
        'bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4',
        className
      )}>
        <div className="text-center text-slate-400 text-sm">
          No quest data available for heatmap visualization
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(
      'bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4',
      compact && 'p-3',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
          Quest Telemetry Heatmap
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          <span className="text-xs text-slate-400">Live</span>
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <HeatmapControls
          config={currentConfig}
          onConfigChange={handleConfigChange}
          compact={compact}
        />
      )}

      {/* Heatmap Visualization */}
      <div className="mt-4">
        {renderHeatmap()}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{telemetry.totalQuests} total quests</span>
          <span>{Object.keys(telemetry.questTypeBreakdown).length} types</span>
          <span>{currentConfig.mode} view</span>
        </div>
      </div>
    </div>
  );
};

export default QuestTelemetryHeatmap;
