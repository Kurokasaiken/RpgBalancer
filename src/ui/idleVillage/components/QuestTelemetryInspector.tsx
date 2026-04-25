/**
 * Quest Telemetry Inspector Component
 *
 * Advanced inspection tool for detailed quest telemetry analysis.
 * Provides comprehensive event viewing, filtering, and export capabilities
 * for deep quest analytics and debugging.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import clsx from 'clsx';
import { useQuestTelemetryInspector } from '@/ui/idleVillage/hooks/useQuestTelemetryInspector';
import { useIdleVillageConfigStore } from '@/balancing/config/idleVillage/IdleVillageConfigStore';
import type { QuestTelemetryEntry } from '@/ui/idleVillage/hooks/useQuestTelemetry';
import type { QuestTypeDefinition } from '@/balancing/config/idleVillage/types';
import { DEFAULT_INSPECTOR_CONFIG, type QuestTelemetryInspectorConfig } from './questTelemetryInspectorConfig';

/**
 * Filter options for telemetry events
 */
export interface TelemetryFilters {
  eventTypes: QuestTelemetryEventType[];
  questTypes: string[];
  dateRange: {
    start: number | null;
    end: number | null;
  };
  sessionId: string;
  searchQuery: string;
  minSuccessRate: number;
  maxDuration: number;
}

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  averageEventLatency: number;
  totalEventsProcessed: number;
  eventsPerSecond: number;
  memoryUsage: number;
  storageSize: number;
  lastUpdateTime: number;
}

/**
 * Quest Telemetry Inspector Component
 */
export const QuestTelemetryInspector: React.FC<{
  className?: string;
  config?: Partial<QuestTelemetryInspectorConfig>;
  telemetry?: AggregatedTelemetry;
}> = ({ className, config = {}, telemetry: externalTelemetry }) => {
  const [inspectorConfig, setInspectorConfig] = useState(() => ({
    ...DEFAULT_INSPECTOR_CONFIG,
    ...config,
  }));
  
  const [filters, setFilters] = useState<TelemetryFilters>({
    eventTypes: [],
    questTypes: [],
    dateRange: { start: null, end: null },
    sessionId: '',
    searchQuery: '',
    minSuccessRate: 0,
    maxDuration: Infinity,
  });
  
  const [selectedEvent, setSelectedEvent] = useState<QuestTelemetryEvent | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  
  const _questConfig = useIdleVillageConfigStore();
  const _telemetry = externalTelemetry || internalTelemetry.telemetry;
  const { getEventHistory, getSystemMetrics, exportEventData } = useQuestTelemetrySystem();
  
  // Load performance metrics without setInterval for now
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const metrics = await getSystemMetrics();
        setPerformanceMetrics(metrics);
      } catch (error) {
        console.warn('Failed to load performance metrics:', error);
      }
    };
    
    loadMetrics();
    
    // Auto-refresh disabled for now to avoid setInterval usage
    // TODO: Implement with useSandboxClock or SchedulerService
  }, [getSystemMetrics]);
  
  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    let events = getEventHistory();
    
    // Filter by event types
    if (filters.eventTypes.length > 0) {
      events = events.filter(event => filters.eventTypes.includes(event.type));
    }
    
    // Filter by quest types
    if (filters.questTypes.length > 0) {
      events = events.filter(event => {
        const questType = (event.data as any)?.questType;
        return questType && filters.questTypes.includes(questType);
      });
    }
    
    // Filter by date range
    if (filters.dateRange.start) {
      events = events.filter(event => event.timestamp >= filters.dateRange.start!);
    }
    if (filters.dateRange.end) {
      events = events.filter(event => event.timestamp <= filters.dateRange.end!);
    }
    
    // Filter by session ID
    if (filters.sessionId) {
      events = events.filter(event => event.sessionId === filters.sessionId);
    }
    
    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      events = events.filter(event => 
        event.id.toLowerCase().includes(query) ||
        event.type.toLowerCase().includes(query) ||
        JSON.stringify(event.data).toLowerCase().includes(query)
      );
    }
    
    // Limit to max events
    return events.slice(0, inspectorConfig.maxEvents);
  }, [filters, getEventHistory, inspectorConfig.maxEvents]);
  
  // Export telemetry data
  const handleExport = useCallback(async (format: 'json' | 'csv' | 'markdown') => {
    setIsExporting(true);
    try {
      const data = await exportEventData(filteredEvents, format);
      
      // Create download
      const blob = new Blob([data], { 
        type: format === 'json' ? 'application/json' : 'text/plain' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quest-telemetry-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [filteredEvents, exportEventData]);
  
  // Clear all telemetry data
  const handleClearData = useCallback(async () => {
    if (confirm('Are you sure you want to clear all telemetry data? This cannot be undone.')) {
      try {
        internalTelemetry.clearTelemetry();
      } catch (error) {
        console.error('Failed to clear telemetry data:', error);
      }
    }
  }, [internalTelemetry]);
  
  return (
    <div className={clsx(
      'quest-telemetry-inspector',
      'bg-slate-900 border border-slate-700 rounded-lg shadow-xl',
      'p-6 space-y-6',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Quest Telemetry Inspector</h2>
          <p className="text-sm text-slate-400">
            Advanced telemetry analysis and debugging tool
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setInspectorConfig(prev => ({ 
              ...prev, 
              autoRefresh: !prev.autoRefresh 
            }))}
            className={clsx(
              'px-3 py-1 rounded text-xs font-medium transition-colors',
              inspectorConfig.autoRefresh 
                ? 'bg-green-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            )}
          >
            {inspectorConfig.autoRefresh ? 'Auto Refresh ON' : 'Auto Refresh OFF'}
          </button>
          <button
            onClick={handleClearData}
            className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors"
          >
            Clear Data
          </button>
        </div>
      </div>
      
      {/* Performance Metrics */}
      {inspectorConfig.showPerformanceMetrics && performanceMetrics && (
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Performance Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-slate-400">Events/sec</div>
              <div className="text-lg font-mono text-green-400">
                {performanceMetrics.eventsPerSecond.toFixed(1)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Avg Latency</div>
              <div className="text-lg font-mono text-blue-400">
                {performanceMetrics.averageEventLatency.toFixed(1)}ms
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Memory</div>
              <div className="text-lg font-mono text-amber-400">
                {(performanceMetrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Storage</div>
              <div className="text-lg font-mono text-purple-400">
                {(performanceMetrics.storageSize / 1024).toFixed(1)}KB
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Filters */}
      {inspectorConfig.enableAdvancedFiltering && (
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Advanced Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Event Types</label>
              <select
                multiple
                value={filters.eventTypes}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  eventTypes: Array.from(e.target.selectedOptions, option => option.value as QuestTelemetryEventType)
                }))}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200"
              >
                <option value="quest_started">Quest Started</option>
                <option value="quest_completed">Quest Completed</option>
                <option value="quest_failed">Quest Failed</option>
                <option value="branch_decision_made">Branch Decision</option>
                <option value="heroic_moment">Heroic Moment</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Search Query</label>
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                placeholder="Search events..."
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Session ID</label>
              <input
                type="text"
                value={filters.sessionId}
                onChange={(e) => setFilters(prev => ({ ...prev, sessionId: e.target.value }))}
                placeholder="Session ID..."
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Event Timeline */}
      {inspectorConfig.showEventTimeline && (
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200">Event Timeline</h3>
            <div className="text-xs text-slate-400">
              {filteredEvents.length} events
            </div>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                No events match current filters
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={clsx(
                    'p-3 rounded border cursor-pointer transition-colors',
                    selectedEvent?.id === event.id
                      ? 'bg-blue-600/20 border-blue-500'
                      : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="text-xs font-mono text-blue-400">
                        {event.type}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      {event.sessionId.slice(0, 8)}...
                    </div>
                  </div>
                  <div className="text-xs text-slate-300 mt-1 truncate">
                    {JSON.stringify(event.data).slice(0, 100)}...
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Selected Event Details */}
      {selectedEvent && (
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200">Event Details</h3>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-400">Event ID</div>
                <div className="text-xs font-mono text-slate-200">{selectedEvent.id}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Type</div>
                <div className="text-xs font-mono text-blue-400">{selectedEvent.type}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Timestamp</div>
                <div className="text-xs font-mono text-slate-200">
                  {new Date(selectedEvent.timestamp).toISOString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Session ID</div>
                <div className="text-xs font-mono text-slate-200">{selectedEvent.sessionId}</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Event Data</div>
              <pre className="bg-slate-900 rounded p-3 text-xs text-slate-300 overflow-x-auto">
                {JSON.stringify(selectedEvent.data, null, 2)}
              </pre>
            </div>
            {selectedEvent.metadata && (
              <div>
                <div className="text-xs text-slate-400 mb-1">Metadata</div>
                <pre className="bg-slate-900 rounded p-3 text-xs text-slate-300 overflow-x-auto">
                  {JSON.stringify(selectedEvent.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Export Options */}
      {inspectorConfig.enableExport && (
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Export Data</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleExport('json')}
              disabled={isExporting}
              className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isExporting ? 'Exporting...' : 'Export JSON'}
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              onClick={() => handleExport('markdown')}
              disabled={isExporting}
              className="px-3 py-1 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {isExporting ? 'Exporting...' : 'Export Markdown'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestTelemetryInspector;
