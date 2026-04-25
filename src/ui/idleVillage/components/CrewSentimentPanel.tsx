/**
 * Idle Village Crew Sentiment Panel Component
 * 
 * Interactive panel for displaying crew sentiment differences with sparklines,
 * badges, and integration with the Active HUD.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { 
  useCrewSentimentDiff, 
} from '../hooks/useCrewSentimentDiff';
import type { CrewSentimentPreset, SentimentDiff } from '../hooks/useCrewSentimentDiff';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';

const diagnostics = createSandboxDiagnostics('CrewSentimentPanel', 'idleVillage');

/**
 * Props for CrewSentimentPanel component
 */
interface CrewSentimentPanelProps {
  /** Initial configuration */
  initialConfig?: Partial<import('../config/crewSentimentConfig').CrewSentimentConfig>;
  /** Enable sample data for testing */
  enableSampleData?: boolean;
  /** Height of the panel */
  height?: number;
  /** Width of the panel */
  width?: number;
  /** On export callback */
  onExport?: (data: string, format: 'json' | 'csv' | 'markdown') => void;
  /** On metric click callback */
  onMetricClick?: (metric: string, diff: SentimentDiff) => void;
  /** Compact mode for minimal space usage */
  compactMode?: boolean;
}

/**
 * Sparkline component for displaying trend data
 */
interface SparklineProps {
  data: number[];
  width: number;
  height: number;
  color: string;
  positiveColor?: string;
  negativeColor?: string;
}

const Sparkline: React.FC<SparklineProps> = ({
  data,
  width,
  height,
  color,
  positiveColor,
  negativeColor,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = 2;
    const drawWidth = width - padding * 2;
    const drawHeight = height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find min and max values
    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const range = maxValue - minValue || 1;

    // Draw sparkline
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    data.forEach((value, index) => {
      const x = (index / (data.length - 1)) * drawWidth + padding;
      const y = drawHeight - ((value - minValue) / range) * drawHeight + padding;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Fill area under the line
    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (positiveColor && negativeColor) {
      gradient.addColorStop(0, negativeColor);
      gradient.addColorStop(1, positiveColor);
    } else {
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color);
    }
    
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.3;
    ctx.fill();
    ctx.globalAlpha = 1;
  }, [data, width, height, color, positiveColor, negativeColor]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="pointer-events-none"
    />
  );
};

/**
 * Badge component for displaying percentage changes
 */
interface BadgeProps {
  value: number;
  direction: 'up' | 'down' | 'neutral';
  significance: 'low' | 'medium' | 'high' | 'critical';
  compact?: boolean;
}

const Badge: React.FC<BadgeProps> = ({
  value,
  direction,
  significance,
  compact = false,
}) => {
  const getSignificanceColor = (sig: string) => {
    switch (sig) {
      case 'low': return 'bg-gray-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDirectionColor = (dir: string) => {
    switch (dir) {
      case 'up': return 'bg-green-500';
      case 'down': return 'bg-red-500';
      case 'neutral': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const color = direction === 'up' ? getDirectionColor(direction) : getSignificanceColor(significance);
  const size = compact ? 'text-xs' : 'text-sm';
  const padding = compact ? 'px-1' : 'px-2';

  return (
    <span
      className={`${color} ${size} ${padding} rounded-full text-white font-semibold inline-flex items-center justify-center`}
    >
      {direction === 'up' && '+'}
      {value.toFixed(1)}%
    </span>
  );
};

/**
 * Crew Sentiment Panel Component
 */
export const CrewSentimentPanel: React.FC<CrewSentimentPanelProps> = ({
  initialConfig,
  enableSampleData = false,
  height = 200,
  width = 400,
  onExport,
  onMetricClick,
  compactMode = false,
}) => {
  const {
    state,
    updateConfig,
    updateFilters,
    resetToDefault,
    applyPreset,
    exportData,
    refreshData,
    getAnalysisMetrics,
    toggleAutoRefresh,
  } = useCrewSentimentDiff({
    initialConfig,
    enableSampleData,
    refreshInterval: 30,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Get color for metric
   */
  const getMetricColor = useCallback((metric: string): string => {
    return state.config.palette.metrics[metric] || state.config.palette.neutral;
  }, [state.config.palette]);

  /**
   * Get significance indicator
   */
  const getSignificanceIndicator = useCallback((significance: string): string => {
    switch (significance) {
      case 'low': return '○';
      case 'medium': return '◐';
      case 'high': return '●';
      case 'critical': return '◆';
      default: return '○';
    }
  }, []);

  /**
   * Render metric card
   */
  const renderMetricCard = useCallback((
    metric: string,
    diffs: SentimentDiff[],
    latestDiff: SentimentDiff | null
  ): JSX.Element => {
    const color = getMetricColor(metric);
    const latestValue = latestDiff?.currentValue || 0;
    const latestDirection = latestDiff?.direction || 'neutral';
    const latestSignificance = latestDiff?.significance || 'low';

    return (
      <div
        key={metric}
        className={`bg-gray-800 rounded-lg p-3 border border-gray-700 cursor-pointer transition-all duration-200 hover:border-gray-600 ${
          compactMode ? 'mb-2' : 'mb-4'
        }`}
        onClick={() => {
          if (latestDiff) {
            onMetricClick?.(metric, latestDiff);
          }
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-300 capitalize">{metric}</h3>
          {latestDiff && (
            <Badge
              value={latestDiff.percentageDiff}
              direction={latestDirection}
              significance={latestSignificance}
              compact={compactMode}
            />
          )}
        </div>
        
        {state.config.display.showSparklines && diffs.length > 0 && (
          <div className="mb-2">
            <Sparkline
              data={diffs.map(d => d.currentValue)}
              width={compactMode ? 200 : 300}
              height={compactMode ? 30 : 40}
              color={color}
              positiveColor={state.config.palette.positive}
              negativeColor={state.config.palette.negative}
            />
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Latest: {(latestValue * 100).toFixed(1)}%</span>
          <span>Trend: {latestDirection}</span>
        </div>
        
        {state.config.display.showSignificanceIndicators && latestDiff && (
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Significance:</span>
            <span className={getSignificanceIndicator(latestDiff.significance)}>
              {latestDiff.significance}
            </span>
          </div>
        )}
      </div>
    );
  }, [
    getMetricColor,
    getSignificanceIndicator,
    state.config.display,
    state.config.palette,
    compactMode,
    onMetricClick,
  ]);

  /**
   * Render export controls
   */
  const renderExportControls = useCallback((): JSX.Element => {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-800 rounded">
        <button
          onClick={() => {
            const data = exportData({
              includeRawData: true,
              includeAggregated: true,
              includeDiffs: true,
              includeMetrics: true,
              format: 'json',
            });
            onExport?.(data, 'json');
          }}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Export JSON
        </button>
        <button
          onClick={() => {
            const data = exportData({
              includeRawData: false,
              includeAggregated: true,
              includeDiffs: true,
              includeMetrics: true,
              format: 'csv',
            });
            onExport?.(data, 'csv');
          }}
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          Export CSV
        </button>
        <button
          onClick={() => {
            const data = exportData({
              includeRawData: false,
              includeAggregated: true,
              includeDiffs: true,
              includeMetrics: true,
              format: 'markdown',
            });
            onExport?.(data, 'markdown');
          }}
          className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
        >
          Export MD
        </button>
      </div>
    );
  }, [exportData, onExport]);

  /**
   * Render preset controls
   */
  const renderPresetControls = useCallback((): JSX.Element => {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-800 rounded">
        <label className="text-sm text-gray-300">Preset:</label>
        <select
          onChange={(e) => {
            applyPreset(e.target.value as CrewSentimentPreset);
          }}
          className="px-2 py-1 bg-gray-700 text-gray-300 rounded border border-gray-600"
        >
          <option value="default">Default</option>
          <option value="compact">Compact</option>
          <option value="detailed">Detailed</option>
          <option value="performance">Performance</option>
          <option value="alertFocused">Alert Focused</option>
        </select>
        <button
          onClick={resetToDefault}
          className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          Reset
        </button>
      </div>
    );
  }, [applyPreset, resetToDefault]);

  /**
   * Render metrics summary
   */
  const renderMetricsSummary = useCallback((): JSX.Element => {
    const metrics = getAnalysisMetrics();
    
    return (
      <div className="p-2 bg-gray-800 rounded text-sm text-gray-300">
        <div className="grid grid-cols-2 gap-4 mb-2">
          <div>
            <div className="font-bold">Data Points</div>
            <div>{metrics.totalDataPoints.toLocaleString()}</div>
          </div>
          <div>
            <div className="font-bold">Turns</div>
            <div>{state.currentData.length}</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div>
            <div className="font-bold text-red-400">Critical</div>
            <div>{metrics.alertCounts.critical}</div>
          </div>
          <div>
            <div className="font-bold text-orange-400">High</div>
            <div>{metrics.alertCounts.high}</div>
          </div>
          <div>
            <div className="font-bold text-yellow-400">Medium</div>
            <div>{metrics.alertCounts.medium}</div>
          </div>
          <div>
            <div className="font-bold text-gray-400">Low</div>
            <div>{metrics.alertCounts.low}</div>
          </div>
        </div>
      </div>
    );
  }, [getAnalysisMetrics, state.currentData, state.config.display]);

  /**
   * Render auto-refresh toggle
   */
  const renderAutoRefreshToggle = useCallback((): JSX.Element => {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-800 rounded">
        <label className="text-sm text-gray-300">Auto-refresh:</label>
        <button
          onClick={toggleAutoRefresh}
          className={`px-3 py-1 rounded transition-colors ${
            state.autoRefreshEnabled
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-600 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {state.autoRefreshEnabled ? 'Enabled' : 'Disabled'}
        </button>
        <span className="text-xs text-gray-400">
          ({state.config.display.autoRefreshInterval}s)
        </span>
      </div>
    );
  }, [state.autoRefreshEnabled, toggleAutoRefresh, state.config.display]);

  /**
   * Handle window resize
   */
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth } = containerRef.current;
        const newWidth = Math.min(clientWidth, width);
        containerRef.current.style.width = `${newWidth}px`;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width]);

  /**
   * Handle keyboard navigation
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'r' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        refreshData();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [refreshData]);

  return (
    <div
      ref={containerRef}
      className={`bg-gray-900 rounded-lg overflow-hidden ${compactMode ? 'p-2' : 'p-4'}`}
      style={{ width: '100%', height: `${height}px` }}
    >
      {state.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
          <div className="text-gray-300">Loading...</div>
        </div>
      )}
      
      {state.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-75">
          <div className="text-red-300">Error: {state.error}</div>
        </div>
      )}
      
      <div className="space-y-4">
        {renderPresetControls()}
        {renderAutoRefreshToggle()}
        {renderExportControls()}
        {renderMetricsSummary()}
        
        <div className="space-y-2">
          {Object.entries(state.diffs).map(([metric, diffs]) => {
            const latestDiff = diffs[diffs.length - 1] || null;
            return renderMetricCard(metric, diffs, latestDiff);
          })}
        </div>
      </div>
    </div>
  );
};
