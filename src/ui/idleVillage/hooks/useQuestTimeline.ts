/**
 * NP-030 – Idle Village Quest Timeline Renderer
 * 
 * Hook for managing quest timeline state, zoom/pan functionality,
 * risk overlay calculations, and timeline operations.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  QuestTimeline, 
  QuestTimelineEvent, 
  TimelineViewConfig, 
  TimelineRenderContext,
  TimelineInteraction,
  TimelineSelection,
  TimelineValidationError,
  RiskOverlayConfig,
  DEFAULT_TIMELINE_VIEW_CONFIG,
  DEFAULT_RISK_OVERLAY_CONFIG,
  getEventColor,
  getEventDuration,
  getEventRisk,
  isEventInRange,
  sortEvents,
  groupEvents,
  validateTimeline
} from '../types/questTimeline';

export interface UseQuestTimelineOptions {
  initialTimeline?: QuestTimeline;
  initialConfig?: Partial<TimelineViewConfig>;
  enableRiskOverlay?: boolean;
  enableValidation?: boolean;
  enableVirtualization?: boolean;
  maxEvents?: number;
}

export function useQuestTimeline(options: UseQuestTimelineOptions = {}) {
  const {
    initialTimeline,
    initialConfig = {},
    enableRiskOverlay = true,
    enableValidation = true,
    enableVirtualization = true,
    maxEvents = 10000,
  } = options;

  // State management
  const [timeline, setTimeline] = useState<QuestTimeline | null>(initialTimeline || null);
  const [config, setConfig] = useState<TimelineViewConfig>({
    ...DEFAULT_TIMELINE_VIEW_CONFIG,
    ...initialConfig,
  });
  const [riskConfig, setRiskConfig] = useState<RiskOverlayConfig>(DEFAULT_RISK_OVERLAY_CONFIG);
  const [selection, setSelection] = useState<TimelineSelection>({
    events: [],
    annotations: [],
    timeRange: { start: 0, end: 0 },
    groups: [],
  });
  const [validationErrors, setValidationErrors] = useState<TimelineValidationError[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for performance
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastRenderTime = useRef<number>(0);

  // Validate timeline when it changes
  useEffect(() => {
    if (timeline && enableValidation) {
      const errors = validateTimeline(timeline);
      setValidationErrors(errors);
    }
  }, [timeline, enableValidation]);

  /**
   * Update timeline data
   */
  const updateTimeline = useCallback((newTimeline: QuestTimeline) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate event count
      if (newTimeline.events.length > maxEvents) {
        console.warn(`Timeline has ${newTimeline.events.length} events, exceeding max of ${maxEvents}`);
      }
      
      setTimeline(newTimeline);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [maxEvents]);

  /**
   * Update view configuration
   */
  const updateConfig = useCallback((updates: Partial<TimelineViewConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Update risk overlay configuration
   */
  const updateRiskConfig = useCallback((updates: Partial<RiskOverlayConfig>) => {
    setRiskConfig(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Zoom functionality
   */
  const zoom = useCallback((level: number, center?: number) => {
    updateConfig({
      zoom: {
        level: Math.max(0.1, Math.min(10, level)),
        center: center || config.zoom.center,
      },
    });
  }, [config.zoom.center, updateConfig]);

  const zoomIn = useCallback(() => {
    zoom(config.zoom.level * 1.2);
  }, [config.zoom.level, zoom]);

  const zoomOut = useCallback(() => {
    zoom(config.zoom.level / 1.2);
  }, [config.zoom.level, zoom]);

  const zoomToFit = useCallback(() => {
    if (!timeline) return;
    
    const eventTimes = timeline.events.map(e => e.timestamp);
    const minTime = Math.min(...eventTimes);
    const maxTime = Math.max(...eventTimes);
    const duration = maxTime - minTime;
    
    if (duration > 0) {
      const center = minTime + duration / 2;
      const level = (config.timeRange.end - config.timeRange.start) / duration;
      zoom(level, center);
    }
  }, [timeline, config.timeRange, zoom]);

  /**
   * Pan functionality
   */
  const pan = useCallback((deltaX: number, deltaY: number) => {
    updateConfig({
      pan: {
        x: config.pan.x + deltaX,
        y: config.pan.y + deltaY,
      },
    });
  }, [config.pan.x, config.pan.y, updateConfig]);

  /**
   * Time range management
   */
  const setTimeRange = useCallback((start: number, end: number) => {
    updateConfig({
      timeRange: { start, end },
    });
  }, [updateConfig]);

  const moveTimeRange = useCallback((delta: number) => {
    const { start, end } = config.timeRange;
    const duration = end - start;
    setTimeRange(start + delta, end + delta);
  }, [config.timeRange, setTimeRange]);

  /**
   * Event filtering
   */
  const getFilteredEvents = useCallback((): QuestTimelineEvent[] => {
    if (!timeline) return [];

    let events = [...timeline.events];

    // Apply filters
    const { filters } = config;
    
    if (filters.eventTypes.length > 0) {
      events = events.filter(e => filters.eventTypes.includes(e.type));
    }
    
    if (filters.residents.length > 0) {
      events = events.filter(e => filters.residents.includes(e.residentId));
    }
    
    if (filters.locations.length > 0) {
      events = events.filter(e => e.location && filters.locations.includes(e.location));
    }
    
    if (filters.riskLevels.length > 0) {
      events = events.filter(e => filters.riskLevels.includes(e.risk.level));
    }
    
    if (filters.statuses.length > 0) {
      events = events.filter(e => filters.statuses.includes(e.metadata.status));
    }
    
    if (filters.priorities.length > 0) {
      events = events.filter(e => filters.priorities.includes(e.metadata.priority));
    }
    
    if (filters.dateRange) {
      events = events.filter(e => isEventInRange(e, filters.dateRange!.start, filters.dateRange!.end));
    }
    
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      events = events.filter(e => 
        e.title.toLowerCase().includes(searchLower) ||
        (e.description && e.description.toLowerCase().includes(searchLower))
      );
    }

    // Sort events
    events = sortEvents(events, config.layout.sortBy, config.layout.sortOrder);

    return events;
  }, [timeline, config]);

  /**
   * Calculate render context
   */
  const getRenderContext = useCallback((): TimelineRenderContext => {
    if (!timeline || !containerRef.current) {
      return {
        canvas: { width: 0, height: 0, scale: 1, offset: { x: 0, y: 0 } },
        time: { start: 0, end: 0, duration: 0 },
        viewport: { start: 0, end: 0, visibleEvents: [] },
        groups: [],
      };
    }

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    // Calculate time scale
    const { timeRange, zoom, pan } = config;
    const scale = (containerWidth / (timeRange.end - timeRange.start)) * zoom.level;
    
    // Calculate viewport
    const viewportStart = timeRange.start - (pan.x / scale);
    const viewportEnd = timeRange.end - (pan.x / scale);
    
    // Get visible events
    const filteredEvents = getFilteredEvents();
    const visibleEvents = filteredEvents.filter(e => 
      isEventInRange(e, viewportStart, viewportEnd)
    );

    // Group events
    const groupedEvents = groupEvents(visibleEvents, config.layout.groupBy);
    const groups = Object.entries(groupedEvents).map(([key, events], index) => ({
      id: key,
      name: key,
      type: config.layout.groupBy,
      events,
      y: index * 60, // 60px per group
      height: 60,
    }));

    return {
      canvas: {
        width: containerWidth,
        height: containerHeight,
        scale,
        offset: pan,
      },
      time: timeRange,
      viewport: {
        start: viewportStart,
        end: viewportEnd,
        visibleEvents,
      },
      groups,
    };
  }, [timeline, config, getFilteredEvents]);

  /**
   * Risk overlay calculations
   */
  const getRiskOverlayData = useCallback(() => {
    if (!timeline || !enableRiskOverlay) return null;

    const { timeRange } = config;
    const { aggregation } = riskConfig;
    const windowSize = aggregation.window;
    
    // Calculate risk over time windows
    const riskData: Array<{ time: number; risk: number; events: QuestTimelineEvent[] }> = [];
    
    for (let time = timeRange.start; time < timeRange.end; time += windowSize) {
      const windowEnd = time + windowSize;
      const windowEvents = timeline.events.filter(e => 
        isEventInRange(e, time, windowEnd)
      );
      
      let risk = 0;
      switch (aggregation.method) {
        case 'max':
          risk = Math.max(...windowEvents.map(getEventRisk), 0);
          break;
        case 'average':
          risk = windowEvents.reduce((sum, e) => sum + getEventRisk(e), 0) / windowEvents.length;
          break;
        case 'weighted':
          risk = windowEvents.reduce((sum, e) => sum + getEventRisk(e) * getEventDuration(e), 0) /
                windowEvents.reduce((sum, e) => sum + getEventDuration(e), 0);
          break;
        case 'cumulative':
          risk = windowEvents.reduce((sum, e) => sum + getEventRisk(e), 0);
          break;
      }
      
      riskData.push({ time, risk, events: windowEvents });
    }
    
    return riskData;
  }, [timeline, config.timeRange, riskConfig, enableRiskOverlay]);

  /**
   * Interaction handling
   */
  const handleInteraction = useCallback((interaction: TimelineInteraction) => {
    const { type, target, position, timestamp, event } = interaction;
    
    switch (type) {
      case 'click':
        if (target === 'event' && event) {
          setSelection(prev => ({
            ...prev,
            events: prev.events.some(e => e.id === event.id) 
              ? prev.events.filter(e => e.id !== event.id)
              : [...prev.events, event],
          }));
        }
        break;
        
      case 'hover':
        // Handle hover effects (could be used for tooltips)
        break;
        
      case 'select':
        if (target === 'event' && event) {
          setSelection({
            events: [event],
            annotations: [],
            timeRange: { 
              start: event.timestamp, 
              end: event.timestamp + getEventDuration(event) 
            },
            groups: [],
          });
        }
        break;
        
      case 'drag':
        if (target === 'timeline' && timestamp) {
          // Handle time range selection
          setSelection(prev => ({
            ...prev,
            timeRange: {
              start: Math.min(prev.timeRange.start, timestamp),
              end: Math.max(prev.timeRange.end, timestamp),
            },
          }));
        }
        break;
        
      case 'context-menu':
        // Handle context menu
        break;
    }
  }, []);

  /**
   * Selection management
   */
  const clearSelection = useCallback(() => {
    setSelection({
      events: [],
      annotations: [],
      timeRange: { start: 0, end: 0 },
      groups: [],
    });
  }, []);

  const selectEvents = useCallback((events: QuestTimelineEvent[]) => {
    setSelection(prev => ({
      ...prev,
      events,
    }));
  }, []);

  const selectTimeRange = useCallback((start: number, end: number) => {
    setSelection(prev => ({
      ...prev,
      timeRange: { start, end },
    }));
  }, []);

  /**
   * Export functionality
   */
  const exportTimeline = useCallback((format: 'json' | 'csv' | 'png' | 'svg') => {
    if (!timeline) return null;

    switch (format) {
      case 'json':
        return JSON.stringify({
          timeline,
          config,
          selection,
          validationErrors,
        }, null, 2);
        
      case 'csv':
        const headers = ['ID', 'Title', 'Type', 'Start Time', 'Duration', 'Resident', 'Location', 'Risk Level', 'Status'];
        const rows = timeline.events.map(e => [
          e.id,
          e.title,
          e.type,
          new Date(e.timestamp).toISOString(),
          getEventDuration(e),
          e.residentId,
          e.location || '',
          e.risk.level,
          e.metadata.status,
        ]);
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        
      case 'png':
      case 'svg':
        // Would need canvas implementation
        console.warn('PNG/SVG export not implemented yet');
        return null;
        
      default:
        return null;
    }
  }, [timeline, config, selection, validationErrors]);

  /**
   * Performance metrics
   */
  const getPerformanceMetrics = useCallback(() => {
    const renderContext = getRenderContext();
    const now = performance.now();
    const renderTime = now - lastRenderTime.current;
    lastRenderTime.current = now;

    return {
      renderTime,
      eventCount: timeline?.events.length || 0,
      fps: 1000 / renderTime,
      memoryUsage: performance.memory?.usedJSHeapSize || 0,
      zoomLevel: config.zoom.level,
      viewportSize: {
        width: renderContext.canvas.width,
        height: renderContext.canvas.height,
      },
      lastUpdate: now,
    };
  }, [timeline, config.zoom.level, getRenderContext]);

  // Memoized values
  const filteredEvents = useMemo(() => getFilteredEvents(), [getFilteredEvents]);
  const renderContext = useMemo(() => getRenderContext(), [getRenderContext]);
  const riskOverlayData = useMemo(() => getRiskOverlayData(), [getRiskOverlayData]);
  const performanceMetrics = useMemo(() => getPerformanceMetrics(), [getPerformanceMetrics]);

  return {
    // State
    timeline,
    config,
    riskConfig,
    selection,
    validationErrors,
    isLoading,
    error,
    
    // Data
    filteredEvents,
    renderContext,
    riskOverlayData,
    performanceMetrics,
    
    // Refs
    canvasRef,
    containerRef,
    
    // Timeline operations
    updateTimeline,
    updateConfig,
    updateRiskConfig,
    
    // Navigation
    zoom,
    zoomIn,
    zoomOut,
    zoomToFit,
    pan,
    setTimeRange,
    moveTimeRange,
    
    // Interaction
    handleInteraction,
    
    // Selection
    clearSelection,
    selectEvents,
    selectTimeRange,
    
    // Export
    exportTimeline,
    
    // Utilities
    getEventColor: (event: QuestTimelineEvent) => getEventColor(event, config.display.colorScheme),
    getEventDuration,
    getEventRisk,
    isEventInRange: (event: QuestTimelineEvent, start: number, end: number) => 
      isEventInRange(event, start, end),
    
    // Options
    options,
  };
}
