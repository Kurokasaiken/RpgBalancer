/**
 * Quest Decision Heatmap Component - NP-022
 * 
 * Main React component for the quest decision heatmap visualization.
 * Integrates the heatmap engine, legend, tooltip, and filter components
 * into a complete interactive spatial visualization system.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import { QuestDecisionHeatmapEngine } from '../utils/questDecisionHeatmapEngine';
import {
  type QuestDecisionHeatmapConfig,
  type QuestDecisionData,
  type HeatmapCell,
  DEFAULT_QUEST_DECISION_HEATMAP_CONFIG,
} from '../config/questDecisionHeatmapConfig';
import { QuestDecisionHeatmapLegend } from './QuestDecisionHeatmapLegend';
import { QuestDecisionHeatmapTooltip, useQuestDecisionTooltip } from './QuestDecisionHeatmapTooltip';
import { QuestDecisionHeatmapFilter } from './QuestDecisionHeatmapFilter';

const diagnostics = createSandboxDiagnostics('QuestDecisionHeatmap', 'component');

/**
 * Props for QuestDecisionHeatmap component
 */
export interface QuestDecisionHeatmapProps {
  /** Quest decision data to visualize */
  data: QuestDecisionData[];
  /** Configuration for the heatmap */
  config?: Partial<QuestDecisionHeatmapConfig>;
  /** Callback for data selection changes */
  onSelectionChange?: (selectedCells: HeatmapCell[], selectedDecisions: QuestDecisionData[]) => void;
  /** Callback for filter changes */
  onFilterChange?: (filteredData: QuestDecisionData[]) => void;
  /** Custom CSS class names */
  className?: string;
  /** Whether to show legend */
  showLegend?: boolean;
  /** Whether to show tooltip */
  showTooltip?: boolean;
  /** Whether to show filter */
  showFilter?: boolean;
  /** Whether component is visible */
  visible?: boolean;
  /** Whether to enable auto-refresh */
  autoRefresh?: boolean;
  /** Auto-refresh interval in milliseconds */
  refreshInterval?: number;
}

/**
 * Main Quest Decision Heatmap component
 */
export const QuestDecisionHeatmap: React.FC<QuestDecisionHeatmapProps> = ({
  data,
  config: userConfig,
  onSelectionChange,
  onFilterChange,
  className = '',
  showLegend = true,
  showTooltip = true,
  showFilter = true,
  visible = true,
  autoRefresh = false,
  refreshInterval = 30000,
}) => {
  const config = useMemo(() => ({
    ...DEFAULT_QUEST_DECISION_HEATMAP_CONFIG,
    ...userConfig,
  }), [userConfig]);

  const engineRef = useRef<QuestDecisionHeatmapEngine>();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedCells, setSelectedCells] = useState<HeatmapCell[]>([]);
  const [selectedDecisions, setSelectedDecisions] = useState<QuestDecisionData[]>([]);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [statistics, setStatistics] = useState<ReturnType<typeof engineRef.current?.getStatistics>>();
  
  const tooltip = useQuestDecisionTooltip(config.tooltip);
  const [isFilterVisible, setIsFilterVisible] = useState(config.filter.enabled);
  const [isLegendVisible, setIsLegendVisible] = useState(config.legend.enabled);

  // Initialize engine
  useEffect(() => {
    if (!visible || !containerRef.current) return;

    const engine = new QuestDecisionHeatmapEngine(config);
    engineRef.current = engine;

    // Setup event listeners
    engine.addEventListener('cell-click', ({ cell }) => {
      const selection = engine.getSelection();
      setSelectedCells(selection.cells);
      setSelectedDecisions(selection.decisions);
      onSelectionChange?.(selection.cells, selection.decisions);
    });

    engine.addEventListener('cell-hover', ({ cell }) => {
      setHoveredCell(cell);
      
      if (showTooltip && cell) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          tooltip.showTooltip(
            { cell },
            { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
          );
        }
      } else if (!cell) {
        tooltip.hideTooltip();
      }
    });

    engine.addEventListener('data-updated', ({ cells }) => {
      setStatistics(engine.getStatistics());
    });

    engine.addEventListener('render-complete', ({ duration }) => {
      diagnostics.debug('Heatmap render completed', { duration });
    });

    engine.addEventListener('error', ({ error, context }) => {
      diagnostics.error('Heatmap engine error', { error, context });
    });

    // Initialize rendering context
    const element = config.visualization.rendering.mode === 'canvas' ? canvasRef.current : svgRef.current;
    if (element) {
      engine.initializeRenderingContext(element);
    }

    setIsInitialized(true);
    setStatistics(engine.getStatistics());

    return () => {
      engine.destroy();
    };
  }, [visible, config, showTooltip, onSelectionChange]);

  // Update data when it changes
  useEffect(() => {
    if (engineRef.current && isInitialized) {
      engineRef.current.setData(data);
    }
  }, [data, isInitialized]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (engineRef.current && containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        
        // Update config with new dimensions
        engineRef.current.updateConfig({
          layout: {
            ...config.layout,
            width: clientWidth,
            height: clientHeight,
          },
        });
      }
    };

    if (config.layout.responsive) {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [config.layout.responsive, config.layout]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !refreshInterval) return;

    const interval = setInterval(() => {
      // This would typically trigger a data refresh
      diagnostics.debug('Auto-refresh triggered');
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Handle mouse events for interaction
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!engineRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    engineRef.current.handleMouseMove(x, y);
  }, []);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (!engineRef.current || !containerRef.current || !config.visualization.interaction.zoom.wheel) return;

    event.preventDefault();
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    engineRef.current.handleZoom(delta, x, y);
  }, [config.visualization.interaction.zoom.wheel]);

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!engineRef.current || !config.visualization.interaction.pan.enabled) return;

    const startX = event.clientX;
    const startY = event.clientY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      engineRef.current?.handlePan(deltaX, deltaY);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [config.visualization.interaction.pan.enabled]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!engineRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      switch (event.key) {
        case 'r':
        case 'R':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            engineRef.current.resetViewport();
          }
          break;
        case '+':
        case '=':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            engineRef.current.handleZoom(0.1, centerX, centerY);
          }
          break;
        case '-':
        case '_':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            engineRef.current.handleZoom(-0.1, centerX, centerY);
          }
          break;
        case 'Escape':
          engineRef.current.clearSelection();
          break;
      }
    };

    if (config.accessibility.keyboardNavigation) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [config.accessibility.keyboardNavigation]);

  // Generate legend data
  const legendData = useMemo(() => {
    if (!statistics) return undefined;

    const decisions = data.reduce((acc, decision) => {
      acc[decision.decisionType] = (acc[decision.decisionType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const priorities = data.reduce((acc, decision) => {
      acc[decision.priority] = (acc[decision.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categories = data.reduce((acc, decision) => {
      acc[decision.category] = (acc[decision.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const outcomes = data.reduce((acc, decision) => {
      if (decision.outcome) {
        acc[decision.outcome] = (acc[decision.outcome] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      decisions,
      priorities,
      categories,
      outcomes,
    };
  }, [data, statistics]);

  // Handle filter changes
  const handleFilterChange = useCallback((filters: any) => {
    if (engineRef.current) {
      engineRef.current.applyFilters(filters);
      
      const filteredData = engineRef.current.getFilteredData();
      onFilterChange?.(filteredData);
    }
  }, [onFilterChange]);

  // Handle legend selection changes
  const handleLegendSelectionChange = useCallback((selectedItems: string[]) => {
    // This would typically update filters based on legend selection
    diagnostics.debug('Legend selection changed', { selectedItems });
  }, []);

  // Handle legend grouping changes
  const handleLegendGroupingChange = useCallback((grouping: string) => {
    diagnostics.debug('Legend grouping changed', { grouping });
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className={`relative bg-gray-900 border border-gray-700 rounded-lg overflow-hidden ${className}`}>
      {/* Main heatmap container */}
      <div
        ref={containerRef}
        className="relative"
        style={{
          width: config.layout.width,
          height: config.layout.height,
          minWidth: '300px',
          minHeight: '200px',
        }}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
      >
        {/* Canvas rendering */}
        {config.visualization.rendering.mode === 'canvas' && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0"
            style={{ width: '100%', height: '100%' }}
          />
        )}

        {/* SVG rendering */}
        {config.visualization.rendering.mode === 'svg' && (
          <svg
            ref={svgRef}
            className="absolute inset-0"
            style={{ width: '100%', height: '100%' }}
          />
        )}

        {/* WebGL rendering (fallback to canvas) */}
        {config.visualization.rendering.mode === 'webgl' && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0"
            style={{ width: '100%', height: '100%' }}
          />
        )}

        {/* Loading indicator */}
        {!isInitialized && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
            <div className="text-white text-sm">Loading heatmap...</div>
          </div>
        )}

        {/* Debug information */}
        {config.debug.enabled && statistics && (
          <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
            <div>Total: {statistics.totalDecisions}</div>
            <div>Cells: {statistics.totalCells}</div>
            <div>Intensity: {(statistics.averageIntensity * 100).toFixed(1)}%</div>
            <div>Success: {(statistics.successRate * 100).toFixed(1)}%</div>
          </div>
        )}

        {/* Selection indicator */}
        {selectedCells.length > 0 && (
          <div className="absolute bottom-2 left-2 bg-blue-600 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {selectedCells.length} cell{selectedCells.length !== 1 ? 's' : ''} selected
          </div>
        )}

        {/* Hover indicator */}
        {hoveredCell && (
          <div className="absolute bottom-2 right-2 bg-gray-700 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {hoveredCell.totalDecisions} decisions
          </div>
        )}
      </div>

      {/* Controls overlay */}
      <div className="absolute top-2 right-2 flex space-x-2">
        {/* Zoom controls */}
        {config.visualization.interaction.zoom.enabled && (
          <div className="flex flex-col space-y-1">
            <button
              onClick={() => {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect && engineRef.current) {
                  engineRef.current.handleZoom(0.1, rect.left + rect.width / 2, rect.top + rect.height / 2);
                }
              }}
              className="bg-gray-700 hover:bg-gray-600 text-white w-6 h-6 rounded text-xs"
              title="Zoom in"
            >
              +
            </button>
            <button
              onClick={() => {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect && engineRef.current) {
                  engineRef.current.handleZoom(-0.1, rect.left + rect.width / 2, rect.top + rect.height / 2);
                }
              }}
              className="bg-gray-700 hover:bg-gray-600 text-white w-6 h-6 rounded text-xs"
              title="Zoom out"
            >
              −
            </button>
            <button
              onClick={() => engineRef.current?.resetViewport()}
              className="bg-gray-700 hover:bg-gray-600 text-white w-6 h-6 rounded text-xs"
              title="Reset view"
            >
              ⟲
            </button>
          </div>
        )}

        {/* Toggle controls */}
        <div className="flex flex-col space-y-1">
          {showLegend && (
            <button
              onClick={() => setIsLegendVisible(!isLegendVisible)}
              className={`w-6 h-6 rounded text-xs ${
                isLegendVisible ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
              } text-white`}
              title="Toggle legend"
            >
              📊
            </button>
          )}
          
          {showFilter && (
            <button
              onClick={() => setIsFilterVisible(!isFilterVisible)}
              className={`w-6 h-6 rounded text-xs ${
                isFilterVisible ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
              } text-white`}
              title="Toggle filter"
            >
              🔍
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      {showLegend && isLegendVisible && legendData && (
        <div className="absolute top-2 left-2">
          <QuestDecisionHeatmapLegend
            config={config.legend}
            colorScheme={config.visualization.colorScheme}
            data={legendData}
            onSelectionChange={handleLegendSelectionChange}
            onGroupingChange={handleLegendGroupingChange}
            visible={isLegendVisible}
          />
        </div>
      )}

      {/* Filter */}
      {showFilter && isFilterVisible && (
        <div className="absolute bottom-2 left-2">
          <QuestDecisionHeatmapFilter
            config={config.filter}
            onFiltersChange={handleFilterChange}
            visible={isFilterVisible}
          />
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <QuestDecisionHeatmapTooltip
          config={config.tooltip}
          cell={tooltip.cell}
          decision={tooltip.decision}
          position={tooltip.position}
          visible={tooltip.visible}
          onClose={tooltip.hideTooltipImmediate}
        />
      )}
    </div>
  );
};

/**
 * Hook for managing heatmap state
 */
export function useQuestDecisionHeatmap(config?: Partial<QuestDecisionHeatmapConfig>) {
  const [data, setData] = useState<QuestDecisionData[]>([]);
  const [selectedCells, setSelectedCells] = useState<HeatmapCell[]>([]);
  const [selectedDecisions, setSelectedDecisions] = useState<QuestDecisionData[]>([]);
  const [filteredData, setFilteredData] = useState<QuestDecisionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async (source?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would typically load data from an API or service
      // For now, we'll simulate with empty data
      const mockData: QuestDecisionData[] = [];
      setData(mockData);
      setFilteredData(mockData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  const clearSelection = useCallback(() => {
    setSelectedCells([]);
    setSelectedDecisions([]);
  }, []);

  const exportData = useCallback(() => {
    const exportData = {
      data: filteredData,
      selectedCells,
      selectedDecisions,
      timestamp: Date.now(),
      config,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quest-decision-heatmap-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredData, selectedCells, selectedDecisions, config]);

  return {
    data,
    selectedCells,
    selectedDecisions,
    filteredData,
    isLoading,
    error,
    loadData,
    refreshData,
    clearSelection,
    exportData,
  };
}

/**
 * Simple heatmap wrapper for quick usage
 */
export interface SimpleQuestDecisionHeatmapProps {
  data: QuestDecisionData[];
  width?: number;
  height?: number;
  showControls?: boolean;
  className?: string;
}

export const SimpleQuestDecisionHeatmap: React.FC<SimpleQuestDecisionHeatmapProps> = ({
  data,
  width = 800,
  height = 600,
  showControls = true,
  className = '',
}) => {
  const config = useMemo(() => ({
    layout: { width, height },
    legend: { enabled: showControls },
    tooltip: { enabled: showControls },
    filter: { enabled: showControls },
    visualization: {
      interaction: {
        zoom: { enabled: showControls },
        pan: { enabled: showControls },
        selection: { enabled: showControls },
      },
    },
  }), [width, height, showControls]);

  return (
    <QuestDecisionHeatmap
      data={data}
      config={config}
      className={className}
      showLegend={showControls}
      showTooltip={showControls}
      showFilter={showControls}
    />
  );
};
