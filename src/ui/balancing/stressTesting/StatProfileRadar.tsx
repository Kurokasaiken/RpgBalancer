/**
 * Stat Profile Radar Chart Component
 * 
 * Polar chart visualization for displaying stat performance profiles
 * across multiple dimensions with Gilded Observatory retro theme and
 * auto-tuning capabilities.
 * 
 * @module StatProfileRadar
 * @since 2026-01-11
 * @author Aurelia-Heatmap
 */

import React, { useMemo } from 'react';
import type { MarginalUtilityMetrics } from '@/balancing/stressTesting/MarginalUtilityTypes';
import { useRadarAutoTuner } from './radarAutoTuner';
import type { RadarConfig } from './radarConfig';
import { DEFAULT_RADAR_CONFIG, mergeRadarConfig } from './radarConfig';

export interface StatProfileRadarProps {
  /** Stat metrics to display in radar chart */
  statMetrics: MarginalUtilityMetrics[];
  /** Complete radar configuration (overrides individual props) */
  radarConfig?: Partial<RadarConfig>;
  /** Maximum value for radar scale (deprecated, use radarConfig.autoTune.maxRange) */
  maxValue?: number;
  /** Chart dimensions (deprecated, use radarConfig.visual.dimensions) */
  width?: number;
  height?: number;
  /** Number of grid levels (deprecated, use radarConfig.visual.grid.levels) */
  gridLevels?: number;
  /** Enable auto-tuning (default: true) */
  enableAutoTune?: boolean;
  /** Enable animations (deprecated, use radarConfig.visual.animations.enabled) */
  enableAnimations?: boolean;
  /** Custom colors for different performance levels (deprecated, use radarConfig.visual) */
  colors?: {
    excellent: string;
    good: string;
    average: string;
    poor: string;
  };
  /** Callback for stat selection */
  onStatClick?: (statId: string, metrics: MarginalUtilityMetrics) => void;
  /** Enable telemetry (default: true) */
  enableTelemetry?: boolean;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Default colors for performance levels
 */
const DEFAULT_COLORS = {
  excellent: '#00ff00',    // Bright green for top performers
  good: '#88ff00',         // Yellow-green for good performers  
  average: '#ffaa00',      // Orange for average performers
  poor: '#ff4444',         // Red for poor performers
};

/**
 * Stat Profile Radar component for polar chart visualization with auto-tuning
 */
export function StatProfileRadar({
  statMetrics,
  radarConfig,
  maxValue,
  width,
  height,
  gridLevels,
  enableAutoTune = true,
  enableAnimations,
  colors,
  onStatClick,
  enableTelemetry = true,
  className = '',
}: StatProfileRadarProps) {
  // Auto-tune radar parameters
  const { autoTune } = useRadarAutoTuner(radarConfig?.autoTune);
  const autoTuneResult = useMemo(() => {
    if (enableAutoTune && statMetrics.length > 0) {
      return autoTune(statMetrics);
    }
    return null;
  }, [enableAutoTune, statMetrics, autoTune]);

  // Merge configuration with auto-tuning results
  const config = useMemo(() => {
    let baseConfig = mergeRadarConfig(DEFAULT_RADAR_CONFIG, radarConfig || {});
    
    // Apply auto-tuning results if available
    if (autoTuneResult) {
      baseConfig = mergeRadarConfig(baseConfig, {
        autoTune: {
          ...baseConfig.autoTune,
          maxRange: autoTuneResult.maxValue,
        },
        visual: {
          ...baseConfig.visual,
          grid: {
            ...baseConfig.visual.grid,
            levels: autoTuneResult.gridLevels,
          },
        },
      });
    }
    
    // Apply legacy props for backward compatibility
    if (maxValue) baseConfig.autoTune.maxRange = maxValue;
    if (width || height) {
      baseConfig.visual.dimensions = {
        ...baseConfig.visual.dimensions,
        width: width || baseConfig.visual.dimensions.width,
        height: height || baseConfig.visual.dimensions.height,
      };
    }
    if (gridLevels) {
      baseConfig.visual.grid.levels = gridLevels;
    }
    if (enableAnimations !== undefined) {
      baseConfig.visual.animations.enabled = enableAnimations;
    }
    
    return baseConfig;
  }, [radarConfig, autoTuneResult, maxValue, width, height, gridLevels, enableAnimations]);

  const { visual } = config;
  const centerX = visual.dimensions.width / 2;
  const centerY = visual.dimensions.height / 2;
  const radius = Math.min(visual.dimensions.width, visual.dimensions.height) * 0.35;

  // Calculate angles for stat positions
  const statAngles = useMemo(() => {
    const angleStep = (2 * Math.PI) / statMetrics.length;
    return statMetrics.map((_, index) => index * angleStep - Math.PI / 2);
  }, [statMetrics]);

  // Get color based on performance level
  const getPerformanceColor = (winRate: number): string => {
    if (winRate >= 0.7) return visual.polygon.fillColor;
    if (winRate >= 0.55) return visual.labels.color;
    if (winRate >= 0.45) return '#ffaa00'; // average orange
    return '#ff4444'; // poor red
  };

  // Convert polar to Cartesian coordinates
  const polarToCartesian = (angle: number, distance: number) => ({
    x: centerX + distance * Math.cos(angle),
    y: centerY + distance * Math.sin(angle),
  });

  // Generate SVG path for radar polygon
  const radarPath = useMemo(() => {
    const points = statMetrics.map((metric, index) => {
      const angle = statAngles[index];
      const distance = (metric.avgWinRate / config.autoTune.maxRange) * radius;
      const point = polarToCartesian(angle, distance);
      return `${point.x},${point.y}`;
    }).join(' ');
    
    return `M ${points} Z`;
  }, [statMetrics, statAngles, radius, config.autoTune.maxRange]);

  // Generate grid circles
  const gridCircles = useMemo(() => {
    return Array.from({ length: visual.grid.levels }, (_, index) => {
      const level = index + 1;
      const levelRadius = (radius / visual.grid.levels) * level;
      return levelRadius;
    });
  }, [visual.grid.levels, radius]);

  // Generate grid lines
  const gridLines = useMemo(() => {
    return statAngles.map(angle => {
      const start = polarToCartesian(angle, 0);
      const end = polarToCartesian(angle, radius);
      return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
    });
  }, [statAngles, radius]);

  // Handle stat click
  const handleStatClick = (metric: MarginalUtilityMetrics, event: React.MouseEvent) => {
    if (onStatClick) {
      onStatClick(metric.statId, metric);
    }

    if (enableTelemetry) {
      console.log('stat_profile_radar_stat_selected', {
        statId: metric.statId,
        avgWinRate: metric.avgWinRate,
        ranking: metric.ranking,
        matchupCount: metric.matchupCount,
      });
    }

    event.stopPropagation();
  };

  return (
    <div className={`stat-profile-radar ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        style={{ backgroundColor: '#000000' }}
      >
        {/* Grid circles */}
        {gridCircles.map((gridRadius, index) => (
          <circle
            key={`grid-${index}`}
            cx={centerX}
            cy={centerY}
            r={gridRadius}
            fill="none"
            stroke="#00ff00"
            strokeWidth="0.5"
            opacity={0.3}
          />
        ))}

        {/* Grid lines */}
        {gridLines.map((line, index) => (
          <line
            key={`line-${index}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#00ff00"
            strokeWidth="0.5"
            opacity={0.3}
          />
        ))}

        {/* Radar polygon */}
        <path
          d={radarPath}
          fill="#00ff00"
          fillOpacity={0.2}
          stroke="#00ff00"
          strokeWidth="2"
          className={enableAnimations ? 'animate-pulse' : ''}
        />

        {/* Data points */}
        {statMetrics.map((metric, index) => {
          const angle = statAngles[index];
          const distance = (metric.avgWinRate / maxValue) * radius;
          const point = polarToCartesian(angle, distance);
          const color = getPerformanceColor(metric.avgWinRate);

          return (
            <g key={metric.statId}>
              {/* Data point */}
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill={color}
                stroke="#000000"
                strokeWidth="2"
                className="cursor-pointer hover:r-8 transition-all duration-200"
                onClick={(e) => handleStatClick(metric, e)}
                style={{ filter: `drop-shadow(0 0 4px ${color})` }}
              />

              {/* Stat label */}
              <text
                x={polarToCartesian(angle, radius + 20).x}
                y={polarToCartesian(angle, radius + 20).y}
                fill="#00ff00"
                fontSize="12"
                fontFamily="'Courier New', monospace"
                textAnchor="middle"
                dominantBaseline="middle"
                className="pointer-events-none"
              >
                {metric.statId.toUpperCase()}
              </text>

              {/* Performance value */}
              <text
                x={polarToCartesian(angle, radius + 35).x}
                y={polarToCartesian(angle, radius + 35).y}
                fill={color}
                fontSize="10"
                fontFamily="'Courier New', monospace"
                textAnchor="middle"
                dominantBaseline="middle"
                className="pointer-events-none"
              >
                {(metric.avgWinRate * 100).toFixed(1)}%
              </text>
            </g>
          );
        })}

        {/* Center point */}
        <circle
          cx={centerX}
          cy={centerY}
          r="3"
          fill="#00ff00"
          stroke="#000000"
          strokeWidth="1"
        />

        {/* Scale labels */}
        {gridCircles.map((gridRadius, index) => {
          const level = index + 1;
          const value = (maxValue / gridLevels) * level;
          return (
            <text
              key={`scale-${index}`}
              x={centerX + 5}
              y={centerY - gridRadius + 3}
              fill="#00ff00"
              fontSize="10"
              fontFamily="'Courier New', monospace"
              opacity={0.6}
            >
              {value.toFixed(2)}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: colors.excellent }}
          />
          <span className="text-xs text-green-400 font-mono">Excellent (≥70%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: colors.good }}
          />
          <span className="text-xs text-green-300 font-mono">Good (55-70%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: colors.average }}
          />
          <span className="text-xs text-yellow-400 font-mono">Average (45-55%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: colors.poor }}
          />
          <span className="text-xs text-red-400 font-mono">Poor (&lt;45%)</span>
        </div>
      </div>

      {/* Stats summary */}
      <div className="mt-4 text-center">
        <div className="text-xs text-green-400 font-mono">
          Top Performer: {(() => {
            const topPerformer = statMetrics.reduce((best, current) => 
              current.avgWinRate > best.avgWinRate ? current : best
            );
            const maxWinRate = Math.max(...statMetrics.map(m => m.avgWinRate));
            return `${topPerformer.statId.toUpperCase()} (${(maxWinRate * 100).toFixed(1)}%)`;
          })()}
        </div>
        <div className="text-xs text-green-300 font-mono mt-1">
          Average Win Rate: {(statMetrics.reduce((sum, m) => sum + m.avgWinRate, 0) / statMetrics.length * 100).toFixed(1)}%
        </div>
      </div>
    </div>
  );
}
