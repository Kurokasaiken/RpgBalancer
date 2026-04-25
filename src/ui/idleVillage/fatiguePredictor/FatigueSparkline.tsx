/**
 * Idle Village Fatigue Sparkline Component
 * 
 * React component for visualizing fatigue trends as a sparkline.
 * Configurable colors, interactive tooltips, and responsive design.
 * 
 * @since NP-019
 */

import React, { useMemo, useCallback } from 'react';
import type { FatigueDataPoint, FatiguePredictorConfig } from './fatiguePredictor';

interface FatigueSparklineProps {
  /** Fatigue data points to display */
  data: number[] | FatigueDataPoint[];
  /** Current configuration for thresholds and colors */
  config?: Partial<FatiguePredictorConfig>;
  /** Width of the sparkline */
  width?: number;
  /** Height of the sparkline */
  height?: number;
  /** Show tooltip on hover */
  showTooltip?: boolean;
  /** Click handler for data points */
  onPointClick?: (point: number | FatigueDataPoint, index: number) => void;
  /** CSS class name */
  className?: string;
  /** Custom color function */
  getColor?: (value: number) => string;
}

interface TooltipData {
  value: number;
  index: number;
  timestamp?: number;
  activityId?: string;
  x: number;
  y: number;
}

/**
 * Fatigue sparkline component for visualizing fatigue trends
 */
export const FatigueSparkline: React.FC<FatigueSparklineProps> = ({
  data,
  config,
  width = 200,
  height = 40,
  showTooltip = true,
  onPointClick,
  className = '',
  getColor,
}) => {
  // Default configuration
  const defaultConfig = useMemo(() => ({
    visualization: {
      colorThresholds: {
        green: 0.3,
        yellow: 0.6,
        red: 0.8,
      },
    },
  }), []);

  const mergedConfig = useMemo(() => ({
    ...defaultConfig,
    ...config,
  }), [defaultConfig, config]);

  // Process data points
  const processedData = useMemo(() => {
    if (data.length === 0) return [];
    
    if (typeof data[0] === 'number') {
      return data.map((value, index) => ({
        value,
        index,
        timestamp: undefined,
        activityId: undefined,
      }));
    }
    
    return (data as FatigueDataPoint[]).map((point, index) => ({
      value: point.fatigue,
      index,
      timestamp: point.timestamp,
      activityId: point.activityId,
    }));
  }, [data]);

  // Calculate sparkline path
  const sparklinePath = useMemo(() => {
    if (processedData.length === 0) return '';
    
    const padding = 2;
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;
    
    const points = processedData.map((point, index) => {
      const x = padding + (index / (processedData.length - 1)) * usableWidth;
      const y = padding + usableHeight - (point.value / 100) * usableHeight;
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  }, [processedData, width, height]);

  // Calculate gradient stops
  const gradientStops = useMemo(() => {
    if (processedData.length === 0) return [];
    
    return processedData.map((point, index) => {
      const offset = (index / (processedData.length - 1)) * 100;
      const color = getColor 
        ? getColor(point.value)
        : getFatigueColor(point.value, mergedConfig.visualization.colorThresholds);
      return { offset, color };
    });
  }, [processedData, getColor, mergedConfig]);

  // Handle mouse move for tooltip
  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!showTooltip || processedData.length === 0) return;
    
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    
    // Find closest data point
    const padding = 2;
    const usableWidth = width - padding * 2;
    const relativeX = x - padding;
    const index = Math.round((relativeX / usableWidth) * (processedData.length - 1));
    
    if (index >= 0 && index < processedData.length) {
      const point = processedData[index];
      const tooltipData: TooltipData = {
        value: point.value,
        index,
        timestamp: point.timestamp,
        activityId: point.activityId,
        x: event.clientX,
        y: event.clientY,
      };
      
      // Dispatch custom event for tooltip
      const customEvent = new CustomEvent('fatigue-sparkline-tooltip', {
        detail: tooltipData,
      });
      document.dispatchEvent(customEvent);
    }
  }, [showTooltip, processedData, width]);

  // Handle click
  const handleClick = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!onPointClick || processedData.length === 0) return;
    
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    
    const padding = 2;
    const usableWidth = width - padding * 2;
    const relativeX = x - padding;
    const index = Math.round((relativeX / usableWidth) * (processedData.length - 1));
    
    if (index >= 0 && index < processedData.length) {
      const originalData = data[index];
      onPointClick(originalData, index);
    }
  }, [onPointClick, processedData, data, width]);

  // Generate unique gradient ID using data hash instead of random
  const gradientId = useMemo(() => {
    // Create a simple hash from the data to ensure uniqueness
    const dataHash = processedData.slice(0, 3).map(p => p.value.toFixed(1)).join('-');
    return `fatigue-gradient-${dataHash}`;
  }, [processedData]);

  if (processedData.length === 0) {
    return (
      <div 
        className={`fatigue-sparkline-empty ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 text-xs">No data</span>
      </div>
    );
  }

  return (
    <div className={`fatigue-sparkline-container ${className}`}>
      <svg
        width={width}
        height={height}
        className="fatigue-sparkline"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          // Hide tooltip
          const customEvent = new CustomEvent('fatigue-sparkline-tooltip', {
            detail: null,
          });
          document.dispatchEvent(customEvent);
        }}
        onClick={handleClick}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            {gradientStops.map((stop, index) => (
              <stop
                key={index}
                offset={`${stop.offset}%`}
                stopColor={stop.color}
              />
            ))}
          </linearGradient>
        </defs>
        
        {/* Sparkline path */}
        <path
          d={sparklinePath}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {processedData.map((point, index) => {
          const padding = 2;
          const usableWidth = width - padding * 2;
          const usableHeight = height - padding * 2;
          const x = padding + (index / (processedData.length - 1)) * usableWidth;
          const y = padding + usableHeight - (point.value / 100) * usableHeight;
          
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill={getColor 
                ? getColor(point.value)
                : getFatigueColor(point.value, mergedConfig.visualization.colorThresholds)
              }
              className="fatigue-sparkline-point"
              style={{ cursor: onPointClick ? 'pointer' : 'default' }}
            />
          );
        })}
      </svg>
    </div>
  );
};

/**
 * Gets color for fatigue level based on thresholds
 */
function getFatigueColor(
  fatigue: number, 
  thresholds: FatiguePredictorConfig['visualization']['colorThresholds']
): string {
  const percentage = fatigue / 100;
  
  if (percentage <= thresholds.green) return '#10b981'; // green
  if (percentage <= thresholds.yellow) return '#f59e0b'; // yellow
  return '#ef4444'; // red
}

/**
 * Tooltip component for fatigue sparkline
 */
export const FatigueSparklineTooltip: React.FC = () => {
  const [tooltip, setTooltip] = React.useState<TooltipData | null>(null);

  React.useEffect(() => {
    const handleTooltip = (event: CustomEvent<TooltipData | null>) => {
      setTooltip(event.detail);
    };

    document.addEventListener('fatigue-sparkline-tooltip', handleTooltip as EventListener);
    return () => {
      document.removeEventListener('fatigue-sparkline-tooltip', handleTooltip as EventListener);
    };
  }, []);

  if (!tooltip) return null;

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div
      className="fixed z-50 bg-gray-900 text-white px-2 py-1 rounded text-xs pointer-events-none"
      style={{
        left: tooltip.x + 10,
        top: tooltip.y - 30,
      }}
    >
      <div>Fatigue: {tooltip.value.toFixed(1)}</div>
      {tooltip.timestamp && (
        <div>Time: {formatTime(tooltip.timestamp)}</div>
      )}
      {tooltip.activityId && (
        <div>Activity: {tooltip.activityId}</div>
      )}
    </div>
  );
};

/**
 * Hook for using fatigue sparkline with tooltip
 */
export const useFatigueSparkline = () => {
  return {
    Sparkline: FatigueSparkline,
    Tooltip: FatigueSparklineTooltip,
  };
};

export default FatigueSparkline;
