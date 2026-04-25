// src/ui/idleVillage/hooks/useMapHeatmapData.ts
// Hook for calculating activity density heatmap data for Idle Village map

import { useMemo, useRef } from 'react';
import type { ActiveHUDState } from './useActiveHUDState';
import type { 
  HeatmapConfig, 
  HeatmapState, 
  HeatmapDataPoint 
} from '@/balancing/config/idleVillage/heatmapConfig';

interface UseMapHeatmapDataProps {
  hudState: ActiveHUDState;
  config: HeatmapConfig;
  mapDimensions: { width: number; height: number };
  villageState?: any; // For future extensions
}

// Activity weights - hardcoded following config-first principles
const ACTIVITY_WEIGHTS = {
  job: 1.0,
  quest: 1.5,
  maintenance: 0.8,
  training: 0.6,
  default: 1.0,
} as const;

export function useMapHeatmapData({ hudState, config, mapDimensions }: UseMapHeatmapDataProps): HeatmapState {
  const lastUpdateRef = useRef<number>(Date.now());

  // Calculate heatmap data points
  const heatmapData = useMemo<HeatmapDataPoint[]>(() => {
    if (!config.enabled || !hudState.activities.length) {
      return [];
    }

    const { width, height } = mapDimensions;
    const cellSize = config.visual.cellSize;
    const cols = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);

    // Initialize density grid
    const densityGrid: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0));
    const activityTypeGrid: string[][] = Array(rows).fill(null).map(() => Array(cols).fill(''));

    // Aggregate activities by grid position
    hudState.activities.forEach((activity) => {
      // Use a simple hash function for deterministic positioning based on activity ID
      const hash = (str: string): number => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash + char) & hash;
        }
        return hash;
      };
      
      const activityHash = hash(activity.key);
      const gridX = Math.abs(activityHash) % cols;
      const gridY = Math.abs(Math.floor(activityHash / cols)) % rows;
      
      // Get weight for this activity type
      const weight = ACTIVITY_WEIGHTS[activity.activityType as keyof typeof ACTIVITY_WEIGHTS] ?? ACTIVITY_WEIGHTS.default;
      
      // Update density grid
      densityGrid[gridY][gridX] += weight;
      
      // Track activity types
      if (!activityTypeGrid[gridY][gridX].includes(activity.activityType)) {
        activityTypeGrid[gridY][gridX] += activityTypeGrid[gridY][gridX] ? `,${activity.activityType}` : activity.activityType;
      }
    });

    // Convert grid to data points
    const dataPoints: HeatmapDataPoint[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const density = densityGrid[row][col];
        if (density >= config.thresholds.minActivityThreshold) {
          const x = col * cellSize + cellSize / 2;
          const y = row * cellSize + cellSize / 2;
          
          // Calculate color based on density
          const color = interpolateColor(density, config);
          
          // Count activities in this cell
          const activityTypes = activityTypeGrid[row][col].split(',').filter(Boolean);
          const activityCount = activityTypes.length;
          
          dataPoints.push({
            x,
            y,
            density,
            activityCount,
            activityTypes,
            color,
            isActive: density > 0,
          });
        }
      }
    }

    return dataPoints;
  }, [hudState.activities, config, mapDimensions]);

  // Calculate grid dimensions
  const gridDimensions = useMemo(() => {
    const cellSize = config.visual.cellSize;
    return {
      width: mapDimensions.width,
      height: mapDimensions.height,
      cellSize,
      cols: Math.ceil(mapDimensions.width / cellSize),
      rows: Math.ceil(mapDimensions.height / cellSize),
    };
  }, [mapDimensions, config.visual.cellSize]);

  // Return heatmap state
  return useMemo(() => ({
    data: heatmapData,
    config,
    isVisible: true, // Controlled by parent component
    lastUpdate: lastUpdateRef.current,
    mapDimensions: gridDimensions,
  }), [heatmapData, config, gridDimensions]);

  // Helper function to interpolate color based on density
  function interpolateColor(density: number, cfg: HeatmapConfig): string {
    const { thresholds, colors } = cfg;
    
    if (density <= thresholds.mediumThreshold) {
      return colors.low;
    } else if (density <= thresholds.highThreshold) {
      return colors.medium;
    } else {
      return colors.high;
    }
  }
}
