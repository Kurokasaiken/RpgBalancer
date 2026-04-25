// src/ui/idleVillage/components/MapHeatmapOverlay.tsx
// Config-first heatmap overlay component for Idle Village map

import React, { useMemo, useCallback } from 'react';
import type { HeatmapState, HeatmapDataPoint } from '@/balancing/config/idleVillage/heatmapConfig';

/**
 * Props for the MapHeatmapOverlay component.
 */
export interface MapHeatmapOverlayProps {
  /** Heatmap state with data and configuration */
  heatmapState: HeatmapState;
  /** Whether the heatmap is currently visible */
  isVisible: boolean;
  /** Callback for toggling heatmap visibility */
  onToggle?: (isVisible: boolean) => void;
  /** Show legend */
  showLegend?: boolean;
  /** Enable hover effects */
  enableHover?: boolean;
  /** CSS class name for additional styling */
  className?: string;
}

/**
 * Individual heatmap tile component.
 */
const HeatmapTile: React.FC<{
  dataPoint: HeatmapDataPoint;
  cellSize: number;
  borderRadius: number;
  enableHover: boolean;
  onHover?: (x: number, y: number, dataPoint: HeatmapDataPoint) => void;
  onClick?: (x: number, y: number, dataPoint: HeatmapDataPoint) => void;
}> = ({ dataPoint, cellSize, borderRadius, enableHover, onHover, onClick }) => {
  const handleMouseEnter = useCallback(() => {
    if (enableHover && onHover) {
      onHover(dataPoint.x, dataPoint.y, dataPoint);
    }
  }, [enableHover, onHover, dataPoint]);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(dataPoint.x, dataPoint.y, dataPoint);
    }
  }, [onClick, dataPoint]);

  const tileStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${dataPoint.x - cellSize / 2}px`,
    top: `${dataPoint.y - cellSize / 2}px`,
    width: `${cellSize}px`,
    height: `${cellSize}px`,
    backgroundColor: dataPoint.color,
    borderRadius: `${borderRadius}px`,
    transition: 'all 0.3s ease-in-out',
    cursor: enableHover ? 'pointer' : 'default',
    opacity: dataPoint.isActive ? 0.8 : 0.3,
    boxShadow: dataPoint.isActive ? '0 0 10px rgba(251, 191, 36, 0.3)' : 'none',
  };

  return (
    <div
      style={tileStyle}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      data-testid={`heatmap-tile-${Math.round(dataPoint.x)}-${Math.round(dataPoint.y)}`}
      data-density={dataPoint.density}
      data-activity-types={dataPoint.activityTypes.join(',')}
      data-is-active={dataPoint.isActive}
    />
  );
};

/**
 * Heatmap legend component.
 */
const HeatmapLegend: React.FC<{
  config: HeatmapState['config'];
  compact?: boolean;
}> = ({ config, compact = false }) => {
  const { colors, thresholds, legend } = config;
  
  if (!legend.showLegend) return null;

  const legendStyle: React.CSSProperties = {
    position: 'absolute',
    top: legend.position.includes('top') ? '10px' : 'auto',
    bottom: legend.position.includes('bottom') ? '10px' : 'auto',
    left: legend.position.includes('left') ? '10px' : 'auto',
    right: legend.position.includes('right') ? '10px' : 'auto',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    padding: compact ? '8px' : '12px',
    fontSize: compact ? '10px' : '12px',
    color: '#e2e8f0',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
  };

  const legendItems = [
    { color: colors.low, label: 'Low', value: `≤${thresholds.mediumThreshold - 1}` },
    { color: colors.medium, label: 'Medium', value: `${thresholds.mediumThreshold}-${thresholds.highThreshold - 1}` },
    { color: colors.high, label: 'High', value: `≥${thresholds.highThreshold}` },
  ];

  return (
    <div style={legendStyle} data-testid="heatmap-legend">
      <div style={{ 
        fontWeight: 'bold', 
        marginBottom: '8px', 
        fontSize: compact ? '9px' : '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: '#fbbf24'
      }}>
        Activity Density
      </div>
      <div style={{ 
        display: legend.orientation === 'vertical' ? 'flex' : 'flex',
        flexDirection: legend.orientation === 'vertical' ? 'column' : 'row',
        gap: compact ? '4px' : '8px',
        alignItems: legend.orientation === 'vertical' ? 'flex-start' : 'center'
      }}>
        {legendItems.map((item, index) => (
          <div 
            key={index}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: compact ? '4px' : '6px',
              flexDirection: legend.orientation === 'vertical' ? 'row' : 'row'
            }}
          >
            <div
              style={{
                width: compact ? '12px' : '16px',
                height: compact ? '12px' : '16px',
                backgroundColor: item.color,
                borderRadius: '2px',
                border: `1px solid ${colors.border}`,
              }}
            />
            <div style={{ fontSize: compact ? '9px' : '10px' }}>
              {item.label}
              {legend.showValues && (
                <span style={{ opacity: 0.7, marginLeft: '2px' }}>
                  ({item.value})
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * MapHeatmapOverlay component that renders activity density visualization.
 * Config-first design with Gilded Observatory theme.
 */
const MapHeatmapOverlay: React.FC<MapHeatmapOverlayProps> = ({
  heatmapState,
  isVisible,
  onToggle,
  showLegend = true,
  enableHover = true,
  className = '',
}) => {
  const { data, config, mapDimensions } = heatmapState;

  // Memoize filtered data points for performance
  const visibleDataPoints = useMemo(() => {
    return data.filter(point => point.isActive || config.thresholds.minActivityThreshold === 0);
  }, [data, config.thresholds.minActivityThreshold]);

  // Handle tile hover
  const handleTileHover = useCallback((x: number, y: number, dataPoint: HeatmapDataPoint) => {
    // Log hover interaction for telemetry
    console.log('[Heatmap] Tile hover:', { x, y, density: dataPoint.density, activityTypes: dataPoint.activityTypes });
  }, []);

  // Handle tile click
  const handleTileClick = useCallback((x: number, y: number, dataPoint: HeatmapDataPoint) => {
    // Log click interaction for telemetry
    console.log('[Heatmap] Tile click:', { x, y, density: dataPoint.density, activityTypes: dataPoint.activityTypes });
  }, []);

  // Handle toggle
  const handleToggle = useCallback(() => {
    if (onToggle) {
      onToggle(!isVisible);
    }
  }, [isVisible, onToggle]);

  // Container style
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: `${mapDimensions.width}px`,
    height: `${mapDimensions.height}px`,
    pointerEvents: isVisible ? 'auto' : 'none',
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 0.3s ease-in-out',
    zIndex: 100,
  };

  // Toggle button style
  const toggleButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '10px',
    left: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    border: `1px solid ${config.colors.border}`,
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '10px',
    color: '#fbbf24',
    cursor: 'pointer',
    backdropFilter: 'blur(4px)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    transition: 'all 0.2s ease-in-out',
    zIndex: 1001,
  };

  if (!config.enabled) {
    return null;
  }

  return (
    <div 
      style={containerStyle}
      className={`map-heatmap-overlay ${className}`}
      data-testid="map-heatmap-overlay"
      data-visible={isVisible}
    >
      {/* Toggle button */}
      <button
        style={toggleButtonStyle}
        onClick={handleToggle}
        data-testid="heatmap-toggle-button"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.2)';
          e.currentTarget.style.borderColor = '#fbbf24';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          e.currentTarget.style.borderColor = config.colors.border;
        }}
      >
        {isVisible ? '🔥 Hide Heatmap' : '🗺️ Show Heatmap'}
      </button>

      {/* Heatmap tiles */}
      {visibleDataPoints.map((dataPoint) => (
        <HeatmapTile
          key={`${dataPoint.x}-${dataPoint.y}`}
          dataPoint={dataPoint}
          cellSize={config.visual.cellSize}
          borderRadius={config.visual.borderRadius}
          enableHover={enableHover}
          onHover={handleTileHover}
          onClick={handleTileClick}
        />
      ))}

      {/* Legend */}
      {showLegend && isVisible && (
        <HeatmapLegend 
          config={config} 
          compact={config.legend.compact}
        />
      )}

      {/* Stats overlay (for debugging/development) */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: `1px solid ${config.colors.border}`,
            borderRadius: '6px',
            padding: '8px',
            fontSize: '9px',
            color: '#94a3b8',
            fontFamily: 'monospace',
            backdropFilter: 'blur(4px)',
          }}
          data-testid="heatmap-debug-stats"
        >
          <div>Active Tiles: {visibleDataPoints.length}</div>
          <div>Max Density: {Math.max(...visibleDataPoints.map(p => p.density)).toFixed(2)}</div>
          <div>Grid: {mapDimensions.cols}x{mapDimensions.rows}</div>
        </div>
      )}
    </div>
  );
};

export default MapHeatmapOverlay;
