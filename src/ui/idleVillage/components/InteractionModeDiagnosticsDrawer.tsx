/**
 * Interaction Mode Diagnostics Drawer
 * 
 * Drawer component for displaying interaction mode diagnostics,
 * KPI metrics, timeline charts, and export functionality.
 * 
 * @since NP-063 – Idle Village Interaction Mode Diagnostics
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { saveData } from '@/shared/persistence/PersistenceService';
import type {
  InteractionMode,
  InteractionSource,
  InteractionModeKPI,
  InteractionModeEvent,
  InteractionModeConfig,
} from '@/ui/idleVillage/config/interactionModeConfig';
import {
  DEFAULT_INTERACTION_MODE_CONFIG,
  filterInteractionEvents,
  exportEventsToJSON,
  exportEventsToCSV,
  exportEventsToMarkdown,
} from '@/ui/idleVillage/config/interactionModeConfig';
import {
  getInteractionModeAnalytics,
  exportInteractionModeAnalytics,
  getCurrentKPI,
  getSessionSummary,
  getExportHistory,
} from '@/analytics/idleVillageInteractionMode';

/**
 * Drawer props
 */
export interface InteractionModeDiagnosticsDrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Callback when drawer closes */
  onClose: () => void;
  /** Custom configuration */
  config?: Partial<InteractionModeConfig>;
  /** Current interaction mode */
  currentMode?: InteractionMode;
}

/**
 * Timeline chart component
 */
function TimelineChart({ events, maxPoints }: { events: InteractionModeEvent[]; maxPoints: number }) {
  const chartData = useMemo(() => {
    const now = Date.now();
    const windowSize = 3600000; // 1 hour window
    const cutoffTime = now - windowSize;
    
    const filteredEvents = events
      .filter(event => event.timestamp > cutoffTime)
      .slice(-maxPoints)
      .map(event => ({
        timestamp: event.timestamp,
        mode: event.mode,
        type: event.type,
      }));

    // Group events by minute
    const grouped = filteredEvents.reduce((acc, event) => {
      const minute = Math.floor(event.timestamp / 60000) * 60000;
      if (!acc[minute]) {
        acc[minute] = { desktop: 0, mobile: 0 };
      }
      acc[minute][event.mode]++;
      return acc;
    }, {} as Record<number, { desktop: number; mobile: number }>);

    return Object.entries(grouped)
      .map(([timestamp, counts]) => ({
        timestamp: parseInt(timestamp),
        desktop: counts.desktop,
        mobile: counts.mobile,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [events, maxPoints]);

  const maxValue = Math.max(...chartData.map(d => Math.max(d.desktop, d.mobile)), 1);

  return (
    <div className="h-32 bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700">Timeline (Last Hour)</h4>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Desktop</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Mobile</span>
          </div>
        </div>
      </div>
      
      <div className="relative h-20 flex items-end justify-between">
        {chartData.map((point, index) => (
          <div
            key={index}
            className="flex-1 flex flex-col items-center justify-end"
            style={{ height: '100%' }}
          >
            <div className="w-full flex flex-col gap-1">
              <div
                className="bg-blue-500 rounded-t"
                style={{
                  height: `${(point.desktop / maxValue) * 100}%`,
                  minHeight: '2px',
                }}
              />
              <div
                className="bg-green-500 rounded-b"
                style={{
                  height: `${(point.mobile / maxValue) * 100}%`,
                  minHeight: '2px',
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>{new Date(chartData[0]?.timestamp || Date.now()).toLocaleTimeString()}</span>
        <span>{new Date(chartData[chartData.length - 1]?.timestamp || Date.now()).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}

/**
 * KPI metrics component
 */
function KPIMetrics({ kpi }: { kpi: InteractionModeKPI }) {
  const metrics = [
    {
      label: 'Switch Rate',
      value: `${kpi.switchRate.toFixed(2)}/min`,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      label: 'Desktop Taps',
      value: kpi.tapCount.desktop.toString(),
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'Mobile Taps',
      value: kpi.tapCount.mobile.toString(),
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      label: 'Desktop Errors',
      value: kpi.errorCount.desktop.toString(),
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
    {
      label: 'Mobile Errors',
      value: kpi.errorCount.mobile.toString(),
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
    {
      label: 'Satisfaction',
      value: `${kpi.satisfactionScore.toFixed(1)}/5`,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {metrics.map((metric, index) => (
        <div key={index} className={`${metric.bg} rounded-lg p-3`}>
          <div className="text-xs text-gray-600 mb-1">{metric.label}</div>
          <div className={`text-lg font-semibold ${metric.color}`}>
            {metric.value}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Export controls component
 */
function ExportControls({
  onExport,
  isExporting,
}: {
  onExport: (format: 'json' | 'csv' | 'markdown') => void;
  isExporting: boolean;
}) {
  return (
    <div className="border rounded-lg p-4">
      <h4 className="font-medium mb-3">Export Data</h4>
      <div className="flex gap-2">
        <button
          onClick={() => onExport('json')}
          disabled={isExporting}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? 'Exporting...' : 'Export JSON'}
        </button>
        <button
          onClick={() => onExport('csv')}
          disabled={isExporting}
          className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </button>
        <button
          onClick={() => onExport('markdown')}
          disabled={isExporting}
          className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? 'Exporting...' : 'Export Markdown'}
        </button>
      </div>
    </div>
  );
}

/**
 * Filter controls component
 */
function FilterControls({
  filters,
  onFiltersChange,
  config,
}: {
  filters: {
    dateRange?: number;
    modes?: InteractionMode[];
    sources?: InteractionSource[];
    eventTypes?: InteractionModeEvent['type'][];
  };
  onFiltersChange: (filters: any) => void;
  config: InteractionModeConfig;
}) {
  return (
    <div className="border rounded-lg p-4">
      <h4 className="font-medium mb-3">Filters</h4>
      
      <div className="space-y-4">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <select
            value={filters.dateRange || ''}
            onChange={(e) => onFiltersChange({ dateRange: e.target.value ? parseInt(e.target.value) : undefined })}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Time</option>
            {config.filters.dateRanges.map(range => (
              <option key={range.id} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        {/* Modes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Interaction Modes</label>
          <div className="space-y-2">
            {config.filters.modes.map(mode => (
              <label key={mode} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.modes?.includes(mode) || false}
                  onChange={(e) => {
                    const currentModes = filters.modes || [];
                    const newModes = e.target.checked
                      ? [...currentModes, mode]
                      : currentModes.filter(m => m !== mode);
                    onFiltersChange({ modes: newModes });
                  }}
                  className="mr-2"
                />
                <span className="capitalize">{mode}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Event Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Types</label>
          <div className="space-y-2">
            {config.filters.eventTypes.map(eventType => (
              <label key={eventType} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.eventTypes?.includes(eventType) || false}
                  onChange={(e) => {
                    const currentTypes = filters.eventTypes || [];
                    const newTypes = e.target.checked
                      ? [...currentTypes, eventType]
                      : currentTypes.filter(t => t !== eventType);
                    onFiltersChange({ eventTypes: newTypes });
                  }}
                  className="mr-2"
                />
                <span className="capitalize">{eventType.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Interaction Mode Diagnostics Drawer component
 */
export function InteractionModeDiagnosticsDrawer({
  isOpen,
  onClose,
  config,
  currentMode = 'desktop',
}: InteractionModeDiagnosticsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'events' | 'export'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: undefined,
    modes: [] as InteractionMode[],
    sources: [] as InteractionSource[],
    eventTypes: [] as InteractionModeEvent['type'][],
  });

  const analyticsConfig = { ...DEFAULT_INTERACTION_MODE_CONFIG, ...config };
  const analytics = getInteractionModeAnalytics(analyticsConfig);

  // Load data when drawer opens
  useEffect(() => {
    if (isOpen) {
      loadDiagnosticsData();
    }
  }, [isOpen]);

  const loadDiagnosticsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Update analytics to ensure latest data
      await analytics.updateAnalytics();
    } catch (err) {
      console.error('Failed to load diagnostics data:', err);
      setError('Failed to load diagnostics data');
    } finally {
      setIsLoading(false);
    }
  }, [analytics]);

  const handleExport = useCallback(async (format: 'json' | 'csv' | 'markdown') => {
    try {
      setIsExporting(true);
      
      const exportData = await analytics.exportEvents(format, filters);
      
      // Create download
      const blob = new Blob([exportData], { 
        type: format === 'json' ? 'application/json' : 'text/plain' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interaction-mode-diagnostics-${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      
      // Save to test-results directory
      const filename = `test-results/interaction-mode-diagnostics-${Date.now()}.${format}`;
      await saveData(filename, exportData);
      
      console.log(`Export saved to: ${filename}`);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [analytics, filters]);

  const filteredEvents = useMemo(() => {
    // This would be populated from the analytics data
    return [];
  }, []);

  const currentKPI = useMemo(() => {
    // This would be populated from the analytics data
    return {
      switchRate: 0,
      tapCount: { desktop: 0, mobile: 0 },
      errorCount: { desktop: 0, mobile: 0 },
      averageSessionDuration: { desktop: 0, mobile: 0 },
      modePreference: { desktop: 50, mobile: 50 },
      satisfactionScore: 4.0,
      taskCompletionRate: { desktop: 0.85, mobile: 0.78 },
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Interaction Mode Diagnostics</h2>
            <p className="text-sm text-gray-600">
              Current Mode: <span className="font-medium capitalize">{currentMode}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close diagnostics"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'timeline'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'events'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'export'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Export
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading diagnostics...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-red-500">Error: {error}</div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <KPIMetrics kpi={currentKPI} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">Session Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Session ID:</span>
                          <span className="font-mono text-xs">session_123456</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration:</span>
                          <span>5m 23s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Mode Switches:</span>
                          <span>3</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Errors:</span>
                          <span className="text-red-600">2</span>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">Mode Preference</h4>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Desktop</span>
                            <span className="font-medium">{currentKPI.modePreference.desktop.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${currentKPI.modePreference.desktop}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Mobile</span>
                            <span className="font-medium">{currentKPI.modePreference.mobile.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${currentKPI.modePreference.mobile}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="space-y-6">
                  <TimelineChart events={filteredEvents} maxPoints={analyticsConfig.ui.maxTimelinePoints} />
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Timeline Settings</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Update Interval:</span>
                        <span>{analyticsConfig.ui.updateIntervalMs / 1000}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Points:</span>
                        <span>{analyticsConfig.ui.maxTimelinePoints}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Real-time Updates:</span>
                        <span>{analyticsConfig.ui.enableRealTimeUpdates ? 'Enabled' : 'Disabled'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'events' && (
                <div className="space-y-6">
                  <FilterControls
                    filters={filters}
                    onFiltersChange={setFilters}
                    config={analyticsConfig}
                  />
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Recent Events</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {filteredEvents.slice(-20).map((event, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              event.mode === 'desktop' ? 'bg-blue-500' : 'bg-green-500'
                            }`} />
                            <div>
                              <div className="text-sm font-medium capitalize">{event.type}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(event.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">{event.source || 'N/A'}</div>
                            {event.data.error && (
                              <div className="text-xs text-red-600">{event.data.error}</div>
                            )}
                          </div>
                        </div>
                      ))}
                      {filteredEvents.length === 0 && (
                        <div className="text-center text-gray-500 py-4">
                          No events found with current filters
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'export' && (
                <div className="space-y-6">
                  <ExportControls onExport={handleExport} isExporting={isExporting} />
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Export Settings</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Records:</span>
                        <span>{analyticsConfig.export.maxRecordsPerExport}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Include Sensitive Data:</span>
                        <span>{analyticsConfig.export.includeSensitiveData ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Export Formats:</span>
                        <span>{analyticsConfig.export.formats.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Export History</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {/* Export history would be populated here */}
                      <div className="text-center text-gray-500 py-4">
                        No exports yet
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => loadDiagnosticsData()}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Refresh
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InteractionModeDiagnosticsDrawer;
