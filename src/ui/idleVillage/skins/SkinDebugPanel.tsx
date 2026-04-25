/**
 * Skin Debug Panel
 * 
 * Advanced debugging panel for skin system with detailed telemetry,
 * performance monitoring, and system diagnostics.
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useSkinSystem } from '../hooks/useSkinSystem';
import { useSkinTelemetry } from '../hooks/useSkinTelemetry';
import { getSkinReplacementAPI, SkinReplacementAPI } from './SkinReplacementAPI';

// Define types locally to avoid import issues
type MotionLevel = 'minimal' | 'reduced' | 'full';
type StyleLabPillar = 'frontier' | 'wilderness' | 'empire';
type SkinPresetId = 'minimal-frontier' | 'minimal-wilderness' | 'minimal-empire' | 'wanderlust' | 'arcane-tech' | 'gilded-observatory';

interface ComponentSkinBinding {
  componentId: string;
  name: string;
  description: string;
  version: string;
  defaultPreset: SkinPresetId;
  supportedPillars: StyleLabPillar[];
  supportedMotionLevels: MotionLevel[];
  cssClassBase: string;
  dataAttributePrefix: string;
  supportsMotionLevel: boolean;
  supportsTelemetry: boolean;
  supportsPillarSwitching: boolean;
  category: string;
  priority: number;
  tags: string[];
  skinProperties?: Record<string, unknown>;
}

interface SkinState {
  currentPreset: SkinPresetId;
  currentPillar: StyleLabPillar;
  currentMotionLevel: MotionLevel;
  isTransitioning: boolean;
  activeBindings: Record<string, ComponentSkinBinding>;
  updateCount: number;
  lastUpdated: number;
}

interface SkinPresetConfig {
  id: SkinPresetId;
  name: string;
  description: string;
  category: string;
  colors: Record<string, string>;
  animations: Record<string, any>;
  components: Record<string, any>;
}

type ValidationErrorCode = string;
import { getSkinRegistryManager } from './SkinRegistry';

// ============================================================================
// DEBUG PANEL TYPES
// ============================================================================

interface SkinDebugPanelProps {
  /**
   * Whether to show performance metrics
   * @default true
   */
  showPerformance?: boolean;
  
  /**
   * Whether to show telemetry events
   * @default true
   */
  showTelemetry?: boolean;
  
  /**
   * Whether to show validation details
   * @default true
   */
  showValidation?: boolean;
  
  /**
   * Whether to show system diagnostics
   * @default true
   */
  showDiagnostics?: boolean;
  
  /**
   * Maximum number of events to display
   * @default 50
   */
  maxEvents?: number;
  
  /**
   * Update interval for real-time data (ms)
   * @default 1000
   */
  updateInterval?: number;
  
  /**
   * Whether to enable auto-scroll for events
   * @default true
   */
  autoScroll?: boolean;
  
  /**
   * Custom className
   */
  className?: string;
}

interface DebugEvent {
  id: string;
  timestamp: number;
  type: string;
  category: string;
  severity: 'info' | 'warning' | 'error';
  data: any;
  duration?: number;
  stack?: string;
}

interface PerformanceMetrics {
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  totalRenderTime: number;
  memoryUsage?: number;
  componentCount: number;
  updateCount: number;
  transitionCount: number;
}

interface SystemDiagnostics {
  managerStatus: 'healthy' | 'warning' | 'error';
  registryStatus: 'healthy' | 'warning' | 'error';
  apiStatus: 'healthy' | 'warning' | 'error';
  totalPresets: number;
  totalComponents: number;
  totalBindings: number;
  lastError?: string;
  systemUptime: number;
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  status?: 'good' | 'warning' | 'error';
  trend?: 'up' | 'down' | 'stable';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  status = 'good',
  trend = 'stable',
}) => {
  return (
    <div className={`skin-debug-metric-card status-${status}`}>
      <div className="skin-debug-metric-title">{title}</div>
      <div className="skin-debug-metric-value">
        {value}
        {unit && <span className="skin-debug-metric-unit">{unit}</span>}
      </div>
      <div className={`skin-debug-metric-trend trend-${trend}`}>
        {trend === 'up' && '↑'}
        {trend === 'down' && '↓'}
        {trend === 'stable' && '→'}
      </div>
    </div>
  );
};

interface EventItemProps {
  event: DebugEvent;
  isSelected?: boolean;
  onSelect?: (event: DebugEvent) => void;
}

const EventItem: React.FC<EventItemProps> = ({
  event,
  isSelected,
  onSelect,
}) => {
  const handleClick = useCallback(() => {
    onSelect?.(event);
  }, [event, onSelect]);

  return (
    <div
      className={`skin-debug-event-item severity-${event.severity} ${
        isSelected ? 'selected' : ''
      }`}
      onClick={handleClick}
    >
      <div className="skin-debug-event-header">
        <div className="skin-debug-event-type">{event.type}</div>
        <div className="skin-debug-event-time">
          {new Date(event.timestamp).toLocaleTimeString()}
        </div>
        <div className={`skin-debug-event-severity ${event.severity}`}>
          {event.severity}
        </div>
      </div>
      <div className="skin-debug-event-category">{event.category}</div>
      {event.duration && (
        <div className="skin-debug-event-duration">
          {event.duration.toFixed(2)}ms
        </div>
      )}
      {event.data && (
        <div className="skin-debug-event-data">
          <pre>{JSON.stringify(event.data, null, 2)}</pre>
        </div>
      )}
      {event.stack && (
        <details className="skin-debug-event-stack">
          <summary>Stack Trace</summary>
          <pre>{event.stack}</pre>
        </details>
      )}
    </div>
  );
};

// ============================================================================
// MAIN DEBUG PANEL COMPONENT
// ============================================================================

export const SkinDebugPanel: React.FC<SkinDebugPanelProps> = ({
  showPerformance = true,
  showTelemetry = true,
  showValidation = true,
  showDiagnostics = true,
  maxEvents = 50,
  updateInterval = 1000,
  autoScroll = true,
  className,
}) => {
  // State management
  const [events, setEvents] = useState<DebugEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<DebugEvent | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState({
    type: '',
    category: '',
    severity: 'all' as 'all' | 'info' | 'warning' | 'error',
  });
  
  // Refs
  const eventsEndRef = useRef<HTMLDivElement>(null);
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(performance.now());
  
  // Hooks
  const {
    state,
    validateState,
    getAllPresets,
    hasComponent,
  } = useSkinSystem();
  
  const telemetry = useSkinTelemetry({
    trackPerformance: true,
    componentType: 'debug-panel',
  });
  
  // Get system instances
  const replacementAPI = getSkinReplacementAPI();
  const registry = getSkinRegistryManager();
  
  // Performance metrics
  const performanceMetrics = useMemo((): PerformanceMetrics => {
    renderCountRef.current += 1;
    const currentTime = performance.now();
    const renderTime = currentTime - lastRenderTimeRef.current;
    lastRenderTimeRef.current = currentTime;
    
    return {
      renderCount: renderCountRef.current,
      averageRenderTime: renderTime,
      lastRenderTime: renderTime,
      totalRenderTime: renderTime * renderCountRef.current,
      memoryUsage: (performance as any).memory?.usedJSHeapSize,
      componentCount: Object.keys(state.activeBindings).length,
      updateCount: state.updateCount,
      transitionCount: state.isTransitioning ? 1 : 0,
    };
  }, [state]);
  
  // System diagnostics
  const systemDiagnostics = useMemo((): SystemDiagnostics => {
    const validation = validateState();
    const presets = getAllPresets();
    
    return {
      managerStatus: validation.isValid ? 'healthy' : 'warning',
      registryStatus: 'healthy', // Would check registry health
      apiStatus: 'healthy', // Would check API health
      totalPresets: presets.length,
      totalComponents: Object.keys(state.activeBindings).length,
      totalBindings: Object.keys(state.activeBindings).length,
      lastError: validation.errors[0]?.message,
      systemUptime: Date.now() - (window.performance?.timeOrigin || 0),
    };
  }, [state, validateState, getAllPresets]);
  
  // Event handling
  const addEvent = useCallback((event: Omit<DebugEvent, 'id'>) => {
    const newEvent: DebugEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    
    setEvents(prev => {
      const updated = [newEvent, ...prev];
      return updated.slice(0, maxEvents);
    });
  }, [maxEvents]);
  
  // Track performance events
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      addEvent({
        timestamp: Date.now(),
        type: 'performance_tick',
        category: 'performance',
        severity: 'info',
        data: {
          renderCount: performanceMetrics.renderCount,
          renderTime: performanceMetrics.lastRenderTime,
          memoryUsage: performanceMetrics.memoryUsage,
        },
        duration: performanceMetrics.lastRenderTime,
      });
    }, updateInterval);
    
    return () => clearInterval(interval);
  }, [isPaused, updateInterval, performanceMetrics, addEvent]);
  
  // Track state changes
  useEffect(() => {
    addEvent({
      timestamp: Date.now(),
      type: 'state_changed',
      category: 'system',
      severity: 'info',
      data: {
        presetId: state.currentPreset,
        pillar: state.currentPillar,
        motionLevel: state.currentMotionLevel,
        updateCount: state.updateCount,
        isTransitioning: state.isTransitioning,
      },
    });
  }, [state.currentPreset, state.currentPillar, state.currentMotionLevel, state.isTransitioning, addEvent]);
  
  // Track validation results
  useEffect(() => {
    const validation = validateState();
    
    addEvent({
      timestamp: Date.now(),
      type: 'validation_check',
      category: 'validation',
      severity: validation.isValid ? 'info' : 'warning',
      data: {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
      },
    });
  }, [state.updateCount, validateState, addEvent]);
  
  // Auto-scroll events
  useEffect(() => {
    if (autoScroll && eventsEndRef.current) {
      eventsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, autoScroll]);
  
  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (filter.type && !event.type.toLowerCase().includes(filter.type.toLowerCase())) {
        return false;
      }
      if (filter.category && !event.category.toLowerCase().includes(filter.category.toLowerCase())) {
        return false;
      }
      if (filter.severity !== 'all' && event.severity !== filter.severity) {
        return false;
      }
      return true;
    });
  }, [events, filter]);
  
  // Event statistics
  const eventStats = useMemo(() => {
    const stats = {
      total: events.length,
      info: 0,
      warning: 0,
      error: 0,
      categories: new Map<string, number>(),
      types: new Map<string, number>(),
    };
    
    events.forEach(event => {
      stats[event.severity]++;
      stats.categories.set(event.category, (stats.categories.get(event.category) || 0) + 1);
      stats.types.set(event.type, (stats.types.get(event.type) || 0) + 1);
    });
    
    return stats;
  }, [events]);
  
  // Export functions
  const exportEvents = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      events: filteredEvents,
      performanceMetrics,
      systemDiagnostics,
      eventStats,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skin-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredEvents, performanceMetrics, systemDiagnostics, eventStats]);
  
  const clearEvents = useCallback(() => {
    setEvents([]);
    setSelectedEvent(null);
  }, []);
  
  return (
    <div className={`skin-debug-panel ${className || ''}`}>
      {/* Header */}
      <div className="skin-debug-header">
        <h3>Skin Debug Panel</h3>
        <div className="skin-debug-controls">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`skin-debug-btn ${isPaused ? 'paused' : ''}`}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button onClick={clearEvents} className="skin-debug-btn">
            Clear
          </button>
          <button onClick={exportEvents} className="skin-debug-btn">
            Export
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="skin-debug-tabs">
        {showPerformance && (
          <button className="skin-debug-tab active">Performance</button>
        )}
        {showTelemetry && (
          <button className="skin-debug-tab">Telemetry</button>
        )}
        {showValidation && (
          <button className="skin-debug-tab">Validation</button>
        )}
        {showDiagnostics && (
          <button className="skin-debug-tab">Diagnostics</button>
        )}
      </div>

      {/* Performance Section */}
      {showPerformance && (
        <div className="skin-debug-section">
          <h4>Performance Metrics</h4>
          <div className="skin-debug-metrics">
            <MetricCard
              title="Render Count"
              value={performanceMetrics.renderCount}
              status="good"
            />
            <MetricCard
              title="Render Time"
              value={performanceMetrics.lastRenderTime.toFixed(2)}
              unit="ms"
              status={performanceMetrics.lastRenderTime > 16 ? 'warning' : 'good'}
              trend={performanceMetrics.lastRenderTime > 20 ? 'up' : 'stable'}
            />
            <MetricCard
              title="Components"
              value={performanceMetrics.componentCount}
              status="good"
            />
            <MetricCard
              title="Updates"
              value={performanceMetrics.updateCount}
              status="good"
            />
            {performanceMetrics.memoryUsage && (
              <MetricCard
                title="Memory"
                value={(performanceMetrics.memoryUsage / 1024 / 1024).toFixed(1)}
                unit="MB"
                status={performanceMetrics.memoryUsage > 50 * 1024 * 1024 ? 'warning' : 'good'}
              />
            )}
          </div>
        </div>
      )}

      {/* Telemetry Section */}
      {showTelemetry && (
        <div className="skin-debug-section">
          <h4>Telemetry Events</h4>
          
          {/* Event Filters */}
          <div className="skin-debug-filters">
            <input
              type="text"
              placeholder="Filter by type..."
              value={filter.type}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
              className="skin-debug-filter"
            />
            <input
              type="text"
              placeholder="Filter by category..."
              value={filter.category}
              onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
              className="skin-debug-filter"
            />
            <select
              value={filter.severity}
              onChange={(e) => setFilter(prev => ({ ...prev, severity: e.target.value as any }))}
              className="skin-debug-filter"
            >
              <option value="all">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>

          {/* Event Statistics */}
          <div className="skin-debug-event-stats">
            <div className="skin-debug-stat-item">
              <span className="skin-debug-stat-label">Total:</span>
              <span className="skin-debug-stat-value">{eventStats.total}</span>
            </div>
            <div className="skin-debug-stat-item">
              <span className="skin-debug-stat-label">Info:</span>
              <span className="skin-debug-stat-value severity-info">{eventStats.info}</span>
            </div>
            <div className="skin-debug-stat-item">
              <span className="skin-debug-stat-label">Warnings:</span>
              <span className="skin-debug-stat-value severity-warning">{eventStats.warning}</span>
            </div>
            <div className="skin-debug-stat-item">
              <span className="skin-debug-stat-label">Errors:</span>
              <span className="skin-debug-stat-value severity-error">{eventStats.error}</span>
            </div>
          </div>

          {/* Events List */}
          <div className="skin-debug-events">
            {filteredEvents.length === 0 ? (
              <div className="skin-debug-empty">No events to display</div>
            ) : (
              <>
                {filteredEvents.map((event) => (
                  <EventItem
                    key={event.id}
                    event={event}
                    isSelected={selectedEvent?.id === event.id}
                    onSelect={setSelectedEvent}
                  />
                ))}
                <div ref={eventsEndRef} />
              </>
            )}
          </div>
        </div>
      )}

      {/* Validation Section */}
      {showValidation && (
        <div className="skin-debug-section">
          <h4>Validation Status</h4>
          <div className="skin-debug-validation">
            <div className={`skin-debug-validation-status ${
              systemDiagnostics.managerStatus
            }`}>
              <h5>Manager Status</h5>
              <div className="skin-debug-status-details">
                <div>Status: {systemDiagnostics.managerStatus}</div>
                <div>Presets: {systemDiagnostics.totalPresets}</div>
                <div>Components: {systemDiagnostics.totalComponents}</div>
                <div>Bindings: {systemDiagnostics.totalBindings}</div>
                {systemDiagnostics.lastError && (
                  <div className="skin-debug-error">
                    Last Error: {systemDiagnostics.lastError}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diagnostics Section */}
      {showDiagnostics && (
        <div className="skin-debug-section">
          <h4>System Diagnostics</h4>
          <div className="skin-debug-diagnostics">
            <div className="skin-debug-diagnostic-item">
              <h5>System Uptime</h5>
              <div>{Math.floor(systemDiagnostics.systemUptime / 1000)}s</div>
            </div>
            <div className="skin-debug-diagnostic-item">
              <h5>Current State</h5>
              <div>
                <div>Preset: {state.currentPreset}</div>
                <div>Pillar: {state.currentPillar}</div>
                <div>Motion: {state.currentMotionLevel}</div>
                <div>Transitioning: {state.isTransitioning ? 'Yes' : 'No'}</div>
              </div>
            </div>
            <div className="skin-debug-diagnostic-item">
              <h5>Component Status</h5>
              <div>
                {Object.entries(state.activeBindings).map(([id, binding]) => (
                  <div key={id} className="skin-debug-component-status">
                    <span className={hasComponent(id) ? 'registered' : 'unregistered'}>
                      {id}
                    </span>
                    <span>{binding.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Event Details */}
      {selectedEvent && (
        <div className="skin-debug-section">
          <h4>Event Details</h4>
          <div className="skin-debug-event-details">
            <div className="skin-debug-detail-row">
              <span className="skin-debug-detail-label">Type:</span>
              <span>{selectedEvent.type}</span>
            </div>
            <div className="skin-debug-detail-row">
              <span className="skin-debug-detail-label">Category:</span>
              <span>{selectedEvent.category}</span>
            </div>
            <div className="skin-debug-detail-row">
              <span className="skin-debug-detail-label">Severity:</span>
              <span className={`severity-${selectedEvent.severity}`}>
                {selectedEvent.severity}
              </span>
            </div>
            <div className="skin-debug-detail-row">
              <span className="skin-debug-detail-label">Timestamp:</span>
              <span>{new Date(selectedEvent.timestamp).toLocaleString()}</span>
            </div>
            {selectedEvent.duration && (
              <div className="skin-debug-detail-row">
                <span className="skin-debug-detail-label">Duration:</span>
                <span>{selectedEvent.duration.toFixed(2)}ms</span>
              </div>
            )}
            <div className="skin-debug-detail-row">
              <span className="skin-debug-detail-label">Data:</span>
              <pre className="skin-debug-event-data">
                {JSON.stringify(selectedEvent.data, null, 2)}
              </pre>
            </div>
            {selectedEvent.stack && (
              <div className="skin-debug-detail-row">
                <span className="skin-debug-detail-label">Stack:</span>
                <pre className="skin-debug-event-stack">
                  {selectedEvent.stack}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkinDebugPanel;
