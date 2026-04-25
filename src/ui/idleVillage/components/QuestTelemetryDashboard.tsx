/**
 * QuestTelemetryDashboard Component
 *
 * Main dashboard that integrates the heatmap, decision feed, and telemetry system
 * for comprehensive quest analytics and visualization.
 */

import React, { useState, useCallback, useMemo } from 'react';
import clsx from 'clsx';
import { QuestTelemetryHeatmap, type QuestHeatmapConfig } from './QuestTelemetryHeatmap';
import { QuestDecisionFeed, type QuestDecisionFeedConfig } from './QuestDecisionFeed';
import { useQuestTelemetry } from '@/ui/idleVillage/hooks/useQuestTelemetry';
import { useQuestTelemetrySystem } from '@/ui/idleVillage/utils/questTelemetrySystem';
import { transformToHeatmapData, analyzeDecisionPatterns, exportTelemetryData } from '@/ui/idleVillage/utils/questTelemetryTransformers';
import type { AggregatedTelemetry } from '@/ui/idleVillage/hooks/useQuestTelemetry';

/**
 * Dashboard layout options
 */
export type DashboardLayout = 'grid' | 'stacked' | 'tabs' | 'split';

/**
 * Dashboard configuration
 */
export interface QuestTelemetryDashboardConfig {
  layout: DashboardLayout;
  showHeatmap: boolean;
  showDecisionFeed: boolean;
  showAnalytics: boolean;
  enableExport: boolean;
  enableRealTime: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  maxQuests: number;
  theme: 'light' | 'dark' | 'gilded';
}

/**
 * Default dashboard configuration
 */
export const DEFAULT_DASHBOARD_CONFIG: QuestTelemetryDashboardConfig = {
  layout: 'grid',
  showHeatmap: true,
  showDecisionFeed: true,
  showAnalytics: true,
  enableExport: true,
  enableRealTime: true,
  autoRefresh: false,
  refreshInterval: 10000,
  maxQuests: 1000,
  theme: 'gilded',
};

/**
 * Dashboard component props
 */
export interface QuestTelemetryDashboardProps {
  className?: string;
  config?: Partial<QuestTelemetryDashboardConfig>;
  heatmapConfig?: Partial<QuestHeatmapConfig>;
  decisionFeedConfig?: Partial<QuestDecisionFeedConfig>;
  onConfigChange?: (config: QuestTelemetryDashboardConfig) => void;
  onExport?: (format: 'json' | 'csv' | 'markdown', data: string) => void;
  compact?: boolean;
}

/**
 * Export controls component
 */
const ExportControls: React.FC<{
  telemetry: AggregatedTelemetry;
  onExport: (format: 'json' | 'csv' | 'markdown', data: string) => void;
  compact?: boolean;
}> = ({ telemetry, onExport, compact }) => {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = useCallback(async (format: 'json' | 'csv' | 'markdown') => {
    if (isExporting) return;
    
    setIsExporting(true);
    try {
      // This would use the transformation helpers
      const data = JSON.stringify(telemetry, null, 2);
      onExport(format, data);
    } finally {
      setIsExporting(false);
    }
  }, [telemetry, onExport, isExporting]);

  return (
    <div className={clsx(
      'flex items-center gap-2',
      compact && 'text-xs'
    )}>
      <span className="text-slate-400">Export:</span>
      <button
        onClick={() => handleExport('json')}
        disabled={isExporting}
        className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        JSON
      </button>
      <button
        onClick={() => handleExport('csv')}
        disabled={isExporting}
        className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        CSV
      </button>
      <button
        onClick={() => handleExport('markdown')}
        disabled={isExporting}
        className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        MD
      </button>
    </div>
  );
};

/**
 * Layout selector component
 */
const LayoutSelector: React.FC<{
  layout: DashboardLayout;
  onLayoutChange: (layout: DashboardLayout) => void;
  compact?: boolean;
}> = ({ layout, onLayoutChange, compact }) => {
  return (
    <div className={clsx('flex items-center gap-2', compact && 'text-xs')}>
      <span className="text-slate-400">Layout:</span>
      <select
        value={layout}
        onChange={(e) => onLayoutChange(e.target.value as DashboardLayout)}
        className="text-xs bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white"
      >
        <option value="grid">Grid</option>
        <option value="stacked">Stacked</option>
        <option value="tabs">Tabs</option>
        <option value="split">Split</option>
      </select>
    </div>
  );
};

/**
 * Main QuestTelemetryDashboard component
 */
export const QuestTelemetryDashboard: React.FC<QuestTelemetryDashboardProps> = ({
  className,
  config = {},
  heatmapConfig = {},
  decisionFeedConfig = {},
  onConfigChange,
  onExport,
  compact = false,
}) => {
  const { telemetry, isLoading, error, recordQuestResult, clearTelemetry } = useQuestTelemetry();
  const telemetrySystem = useQuestTelemetrySystem();
  
  const [currentConfig, setCurrentConfig] = useState<QuestTelemetryDashboardConfig>({
    ...DEFAULT_DASHBOARD_CONFIG,
    ...config,
  });

  const [activeTab, setActiveTab] = useState<'heatmap' | 'decisions' | 'analytics'>('heatmap');

  const handleConfigChange = useCallback((newConfig: QuestTelemetryDashboardConfig) => {
    setCurrentConfig(newConfig);
    onConfigChange?.(newConfig);
  }, [onConfigChange]);

  const handleExport = useCallback((format: 'json' | 'csv' | 'markdown', data: string) => {
    onExport?.(format, data);
  }, [onExport]);

  const handleLayoutChange = useCallback((layout: DashboardLayout) => {
    handleConfigChange({ ...currentConfig, layout });
  }, [currentConfig, handleConfigChange]);

  // Memoize layout rendering
  const renderLayout = useCallback(() => {
    if (!telemetry || telemetry.totalQuests === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-slate-400 text-sm">No quest data available</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded text-sm"
          >
            Refresh Data
          </button>
        </div>
      );
    }

    const heatmapComponent = currentConfig.showHeatmap && (
      <QuestTelemetryHeatmap
        telemetry={telemetry}
        config={heatmapConfig}
        compact={compact}
        showControls={true}
      />
    );

    const decisionFeedComponent = currentConfig.showDecisionFeed && (
      <QuestDecisionFeed
        telemetry={telemetry}
        config={decisionFeedConfig}
        compact={compact}
        showControls={true}
        showAnalytics={currentConfig.showAnalytics}
      />
    );

    switch (currentConfig.layout) {
      case 'grid':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {heatmapComponent}
            {decisionFeedComponent}
          </div>
        );

      case 'stacked':
        return (
          <div className="space-y-4">
            {heatmapComponent}
            {decisionFeedComponent}
          </div>
        );

      case 'tabs':
        return (
          <div>
            <div className="flex border-b border-slate-700 mb-4">
              {currentConfig.showHeatmap && (
                <button
                  onClick={() => setActiveTab('heatmap')}
                  className={clsx(
                    'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                    activeTab === 'heatmap'
                      ? 'border-amber-400 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  )}
                >
                  Heatmap
                </button>
              )}
              {currentConfig.showDecisionFeed && (
                <button
                  onClick={() => setActiveTab('decisions')}
                  className={clsx(
                    'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                    activeTab === 'decisions'
                      ? 'border-amber-400 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  )}
                >
                  Decisions
                </button>
              )}
              {currentConfig.showAnalytics && (
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={clsx(
                    'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                    activeTab === 'analytics'
                      ? 'border-amber-400 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  )}
                >
                  Analytics
                </button>
              )}
            </div>
            
            <div className="min-h-96">
              {activeTab === 'heatmap' && heatmapComponent}
              {activeTab === 'decisions' && decisionFeedComponent}
              {activeTab === 'analytics' && decisionFeedComponent}
            </div>
          </div>
        );

      case 'split':
        return (
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              {heatmapComponent}
            </div>
            <div className="flex-1 lg:max-w-md">
              {decisionFeedComponent}
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            {heatmapComponent}
            {decisionFeedComponent}
          </div>
        );
    }
  }, [telemetry, currentConfig, heatmapConfig, decisionFeedConfig, compact, activeTab]);

  if (isLoading) {
    return (
      <div className={clsx(
        'bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-lg p-8',
        className
      )}>
        <div className="text-center text-slate-400">Loading telemetry data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={clsx(
        'bg-red-900/90 backdrop-blur-sm border border-red-700/50 rounded-lg p-8',
        className
      )}>
        <div className="text-center text-red-300">Error loading telemetry: {error}</div>
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
        <h2 className="text-lg font-semibold text-slate-200 uppercase tracking-wide">
          Quest Telemetry Dashboard
        </h2>
        
        <div className="flex items-center gap-4">
          {/* Layout Selector */}
          <LayoutSelector
            layout={currentConfig.layout}
            onLayoutChange={handleLayoutChange}
            compact={compact}
          />
          
          {/* Export Controls */}
          {currentConfig.enableExport && telemetry && (
            <ExportControls
              telemetry={telemetry}
              onExport={handleExport}
              compact={compact}
            />
          )}
          
          {/* Clear Button */}
          <button
            onClick={clearTelemetry}
            className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 border border-red-500 rounded text-white"
          >
            Clear
          </button>
          
          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-slate-400">Live</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-96">
        {renderLayout()}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {telemetry?.totalQuests || 0} total quests
          </span>
          <span>
            {telemetry?.totalBranches || 0} total branches
          </span>
          <span>
            {(telemetry?.successRate || 0 * 100).toFixed(1)}% success rate
          </span>
          <span>
            Layout: {currentConfig.layout}
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuestTelemetryDashboard;
