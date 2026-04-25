/**
 * Radar Chart Visualization Component for Phase 10.5
 * 
 * SVG-based radar chart for displaying archetype stat profiles
 * with interactive features, animations, and config-first design.
 */

import React, { useCallback, useMemo } from 'react';
import { useRadarChart } from '@/balancing/hooks/useRadarChart';
import type { StressTestArchetype, MarginalUtilityResult, SynergyResult } from '@/balancing/stressTesting/types';
import type { BalancerConfig } from '@/balancing/config/types';

interface StatProfileRadarProps {
  /** Archetype data to display */
  archetypes: StressTestArchetype[];
  /** Marginal utility results */
  marginalUtilities?: MarginalUtilityResult[];
  /** Synergy results */
  synergies?: SynergyResult[];
  /** Balancer configuration */
  balancerConfig: BalancerConfig;
  /** Chart size */
  size?: 'small' | 'medium' | 'large';
  /** Show dataset controls */
  showDatasetControls?: boolean;
  /** Show export controls */
  showExportControls?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Radar chart component for stat profile visualization
 */
export function StatProfileRadar({
  archetypes,
  marginalUtilities = [],
  synergies = [],
  balancerConfig,
  size = 'medium',
  showDatasetControls = true,
  showExportControls = true,
  className = ''
}: StatProfileRadarProps) {
  const {
    state,
    toggleDataset,
    selectDataset,
    updateHover,
    exportData,
    processedData
  } = useRadarChart({
    archetypes,
    marginalUtilities,
    synergies,
    balancerConfig,
    enableAnimations: true,
    colorScheme: 'default'
  });

  // Handle dataset click
  const handleDatasetClick = useCallback((datasetId: string) => {
    selectDataset(state.selectedDataset === datasetId ? undefined : datasetId);
  }, [state.selectedDataset, selectDataset]);

  // Handle export
  const handleExport = useCallback((format: 'json' | 'csv') => {
    const data = exportData(format);
    const blob = new Blob([data], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `radar-chart.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportData]);

  // Size configuration
  const sizeConfig = useMemo(() => {
    switch (size) {
      case 'small':
        return { width: 300, height: 300 };
      case 'large':
        return { width: 600, height: 600 };
      default:
        return { width: 500, height: 500 };
    }
  }, [size]);

  const { width: chartWidth, height: chartHeight } = sizeConfig;
  const width = chartWidth;
  const height = chartHeight;
  const centerX = width / 2;
  const centerY = height / 2;

  return (
    <div className={`stat-profile-radar ${className}`}>
      {/* Controls */}
      {(showDatasetControls || showExportControls) && (
        <div className="radar-controls mb-4 flex gap-2">
          {showDatasetControls && (
            <div className="dataset-controls">
              {state.datasets.map(dataset => (
                <button
                  key={dataset.id}
                  onClick={() => toggleDataset(dataset.id)}
                  className={`px-3 py-1 rounded text-sm ${
                    dataset.visible 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  {dataset.name}
                </button>
              ))}
            </div>
          )}
          
          {showExportControls && (
            <div className="export-controls">
              <button
                onClick={() => handleExport('json')}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm mr-2"
              >
                Export JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
              >
                Export CSV
              </button>
            </div>
          )}
        </div>
      )}

      {/* Radar Chart SVG */}
      <div className="radar-chart-container">
        <svg
          width={chartWidth}
          height={chartHeight}
          className="radar-chart"
          style={{ backgroundColor: state.config.visual.backgroundColor }}
        >
          {/* Grid */}
          {state.config.grid.showCircular && processedData.gridPoints.map((points, index) => (
            <polygon
              key={`grid-${index}`}
              points={points}
              fill="none"
              stroke={state.config.visual.gridColor}
              strokeWidth="1"
              strokeDasharray={state.config.grid.lineStyle === 'dashed' ? '5,5' : undefined}
            />
          ))}

          {/* Radial lines */}
          {state.config.grid.showRadial && processedData.svgPoints && 
            Object.entries(processedData.svgPoints).map(([statId, point]) => (
              <line
                key={`radial-${statId}`}
                x1={centerX}
                y1={centerY}
                x2={point.split(',')[0]}
                y2={point.split(',')[1]}
                stroke={state.config.visual.gridColor}
                strokeWidth="1"
              />
            ))
          }

          {/* Dataset paths */}
          {state.datasets
            .filter(dataset => dataset.visible)
            .map(dataset => (
              <g key={dataset.id}>
                {/* Filled area */}
                <polygon
                  points={processedData.datasetPaths[dataset.id]}
                  fill={dataset.color}
                  fillOpacity={state.config.visual.fillOpacity}
                  stroke={dataset.color}
                  strokeWidth={state.config.visual.lineWidth}
                  className="cursor-pointer transition-all"
                  onClick={() => handleDatasetClick(dataset.id)}
                  onMouseEnter={() => updateHover({ datasetId: dataset.id })}
                  onMouseLeave={() => updateHover({ datasetId: undefined })}
                />
                
                {/* Data points */}
                {processedData.svgPoints && 
                  Object.entries(processedData.svgPoints).map(([statId, _point]) => {
                    const value = dataset.values[statId] || 0;
                    const radius = 20 + ((180 - 20) * value) / 100;
                    const angleRad = (state.stats.find(s => s.id === statId)?.angle || 0) * Math.PI / 180;
                    const pointX = centerX + Math.cos(angleRad - Math.PI / 2) * radius;
                    const pointY = centerY + Math.sin(angleRad - Math.PI / 2) * radius;
                    
                    return (
                      <circle
                        key={`${dataset.id}-${statId}`}
                        cx={pointX}
                        cy={pointY}
                        r="4"
                        fill={dataset.color}
                        stroke="white"
                        strokeWidth="2"
                        className="cursor-pointer"
                      />
                    );
                  })
                }
              </g>
            ))
          }

          {/* Labels */}
          {state.config.labels.showLabels && processedData.labelPositions.map(label => (
            <text
              key={label.id}
              x={label.x}
              y={label.y}
              fill={state.config.visual.labelColor}
              fontSize={state.config.labels.fontSize}
              fontFamily={state.config.labels.fontFamily}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {label.label}
            </text>
          ))}

          {/* Tooltip */}
          {state.hoverState.datasetId && (
            <g className="radar-tooltip">
              <rect
                x="10"
                y="10"
                width="150"
                height="60"
                fill="rgba(0, 0, 0, 0.8)"
                stroke="white"
                strokeWidth="1"
                rx="4"
              />
              <text
                x="85"
                y="30"
                fill="white"
                fontSize="12"
                textAnchor="middle"
              >
                {state.datasets.find(d => d.id === state.hoverState.datasetId)?.name}
              </text>
              <text
                x="85"
                y="50"
                fill="white"
                fontSize="10"
                textAnchor="middle"
              >
                Click to {state.selectedDataset === state.hoverState.datasetId ? 'deselect' : 'select'}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="radar-legend mt-4">
        {state.datasets
          .filter(dataset => dataset.visible)
          .map(dataset => (
            <div key={dataset.id} className="legend-item inline-flex items-center mr-4">
              <div
                className="legend-color w-4 h-4 mr-2"
                style={{ backgroundColor: dataset.color }}
              />
              <span className="text-sm">{dataset.name}</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}
