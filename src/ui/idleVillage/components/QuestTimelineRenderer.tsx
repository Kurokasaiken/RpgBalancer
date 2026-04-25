/**
 * NP-030 – Idle Village Quest Timeline Renderer
 * 
 * Gantt-like timeline visualization component with zoom/pan,
 * risk overlay, and export capabilities for quest events.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Download, 
  Settings, 
  Filter,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Maximize2,
  Grid3x3,
  Layers,
  Eye,
  EyeOff
} from 'lucide-react';

import { useQuestTimeline } from '../hooks/useQuestTimeline';
import type { 
  QuestTimelineEvent, 
  TimelineViewConfig, 
  TimelineInteraction,
  RiskOverlayConfig 
} from '../types/questTimeline';

interface QuestTimelineRendererProps {
  timeline?: any; // QuestTimeline - using any to avoid import issues
  config?: Partial<TimelineViewConfig>;
  riskConfig?: Partial<RiskOverlayConfig>;
  className?: string;
  height?: number;
  showControls?: boolean;
  showLegend?: boolean;
  enableRiskOverlay?: boolean;
  enableVirtualization?: boolean;
  onEventClick?: (event: QuestTimelineEvent) => void;
  onEventHover?: (event: QuestTimelineEvent | null) => void;
  onTimeRangeSelect?: (start: number, end: number) => void;
}

export function QuestTimelineRenderer({
  timeline,
  config: initialConfig = {},
  riskConfig: initialRiskConfig = {},
  className = '',
  height = 600,
  showControls = true,
  showLegend = true,
  enableRiskOverlay = true,
  enableVirtualization = true,
  onEventClick,
  onEventHover,
  onTimeRangeSelect,
}: QuestTimelineRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredEvent, setHoveredEvent] = useState<QuestTimelineEvent | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showRiskOverlay, setShowRiskOverlay] = useState(enableRiskOverlay);
  const [showDependencies, setShowDependencies] = useState(true);

  const {
    timeline: timelineData,
    config,
    riskConfig,
    selection,
    validationErrors,
    isLoading,
    error,
    filteredEvents,
    renderContext,
    riskOverlayData,
    performanceMetrics,
    canvasRef: hookCanvasRef,
    containerRef: hookContainerRef,
    updateTimeline,
    updateConfig,
    updateRiskConfig,
    zoom,
    zoomIn,
    zoomOut,
    zoomToFit,
    pan,
    setTimeRange,
    moveTimeRange,
    handleInteraction,
    clearSelection,
    selectEvents,
    selectTimeRange,
    exportTimeline,
    getEventColor,
    getEventDuration,
    getEventRisk,
    isEventInRange,
  } = useQuestTimeline({
    initialTimeline: timeline,
    initialConfig,
    enableRiskOverlay,
    enableVirtualization,
  });

  // Sync refs
  useEffect(() => {
    if (containerRef.current && hookContainerRef.current !== containerRef.current) {
      hookContainerRef.current = containerRef.current;
    }
    if (canvasRef.current && hookCanvasRef.current !== canvasRef.current) {
      hookCanvasRef.current = canvasRef.current;
    }
  }, [containerRef, canvasRef, hookContainerRef, hookCanvasRef]);

  // Canvas rendering
  const renderTimeline = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !renderContext) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { canvas: canvasInfo, time, viewport, groups } = renderContext;

    // Clear canvas
    ctx.clearRect(0, 0, canvasInfo.width, canvasInfo.height);

    // Set canvas size
    canvas.width = canvasInfo.width;
    canvas.height = canvasInfo.height;

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasInfo.width, canvasInfo.height);

    // Draw grid
    if (showGrid) {
      drawGrid(ctx, canvasInfo, time);
    }

    // Draw risk overlay
    if (showRiskOverlay && riskOverlayData) {
      drawRiskOverlay(ctx, canvasInfo, time, riskOverlayData, riskConfig);
    }

    // Draw groups and events
    groups.forEach(group => {
      drawGroup(ctx, canvasInfo, group, time, config, getEventColor);
    });

    // Draw selection
    if (selection.timeRange.start > 0 || selection.timeRange.end > 0) {
      drawTimeSelection(ctx, canvasInfo, time, selection.timeRange);
    }

    // Draw dependencies
    if (showDependencies) {
      drawDependencies(ctx, canvasInfo, time, viewport.visibleEvents, config);
    }

    // Draw annotations
    config.annotations.forEach(annotation => {
      drawAnnotation(ctx, canvasInfo, time, annotation);
    });

  }, [renderContext, showGrid, showRiskOverlay, riskOverlayData, riskConfig, config, selection, showDependencies, getEventColor]);

  // Grid drawing
  const drawGrid = (ctx: CanvasRenderingContext2D, canvasInfo: any, time: any) => {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Vertical lines (time)
    const hourMs = 60 * 60 * 1000;
    const dayMs = 24 * hourMs;
    const startOfDay = Math.floor(time.start / dayMs) * dayMs;
    
    for (let timestamp = startOfDay; timestamp <= time.end; timestamp += dayMs) {
      const x = (timestamp - time.start) * canvasInfo.scale + canvasInfo.offset.x;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasInfo.height);
      ctx.stroke();
    }

    // Horizontal lines (groups)
    const groupHeight = 60;
    for (let i = 0; i <= canvasInfo.height / groupHeight; i++) {
      const y = i * groupHeight;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasInfo.width, y);
      ctx.stroke();
    }
  };

  // Risk overlay drawing
  const drawRiskOverlay = (ctx: CanvasRenderingContext2D, canvasInfo: any, time: any, riskData: any, riskConfig: RiskOverlayConfig) => {
    if (!riskConfig.enabled) return;

    riskData.forEach(({ time, risk }: { time: number; risk: number }) => {
      const x = (time - time.start) * canvasInfo.scale + canvasInfo.offset.x;
      const width = riskConfig.aggregation.window * canvasInfo.scale;
      
      let color = riskConfig.colors.none;
      if (risk >= riskConfig.thresholds.critical) color = riskConfig.colors.critical;
      else if (risk >= riskConfig.thresholds.high) color = riskConfig.colors.high;
      else if (risk >= riskConfig.thresholds.medium) color = riskConfig.colors.medium;
      else if (risk >= riskConfig.thresholds.low) color = riskConfig.colors.low;

      ctx.fillStyle = color;
      ctx.globalAlpha = riskConfig.opacity;
      ctx.fillRect(x, 0, width, canvasInfo.height);
      ctx.globalAlpha = 1;
    });
  };

  // Group drawing
  const drawGroup = (ctx: CanvasRenderingContext2D, canvasInfo: any, group: any, time: any, config: TimelineViewConfig, getEventColor: (event: QuestTimelineEvent) => string) => {
    // Draw group background
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, group.y, canvasInfo.width, group.height);

    // Draw group label
    ctx.fillStyle = '#374151';
    ctx.font = '12px sans-serif';
    ctx.fillText(group.name, 10, group.y + 20);

    // Draw events in group
    group.events.forEach(event => {
      drawEvent(ctx, canvasInfo, event, time, config, getEventColor);
    });
  };

  // Event drawing
  const drawEvent = (ctx: CanvasRenderingContext2D, canvasInfo: any, event: QuestTimelineEvent, time: any, config: TimelineViewConfig, getEventColor: (event: QuestTimelineEvent) => string) => {
    const x = (event.timestamp - time.start) * canvasInfo.scale + canvasInfo.offset.x;
    const width = getEventDuration(event) * canvasInfo.scale;
    const y = 30; // Offset within group
    const height = 30;

    // Event rectangle
    ctx.fillStyle = getEventColor(event);
    ctx.fillRect(x, y, width, height);

    // Progress bar
    if (config.display.showProgress && event.progress.percentage > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(x, y + height - 4, width * (event.progress.percentage / 100), 4);
    }

    // Event text
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px sans-serif';
    const text = event.title;
    const textWidth = ctx.measureText(text).width;
    if (textWidth < width - 10) {
      ctx.fillText(text, x + 5, y + 20);
    }

    // Selection highlight
    if (selection.events.some(e => e.id === event.id)) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
    }

    // Hover highlight
    if (hoveredEvent?.id === event.id) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
    }
  };

  // Time selection drawing
  const drawTimeSelection = (ctx: CanvasRenderingContext2D, canvasInfo: any, time: any, timeRange: { start: number; end: number }) => {
    const x = (timeRange.start - time.start) * canvasInfo.scale + canvasInfo.offset.x;
    const width = (timeRange.end - timeRange.start) * canvasInfo.scale;
    
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.fillRect(x, 0, width, canvasInfo.height);
    
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x, 0, width, canvasInfo.height);
    ctx.setLineDash([]);
  };

  // Dependencies drawing
  const drawDependencies = (ctx: CanvasRenderingContext2D, canvasInfo: any, time: any, events: QuestTimelineEvent[], config: TimelineViewConfig) => {
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    
    events.forEach(event => {
      event.metadata.dependencies.forEach(depId => {
        const depEvent = events.find(e => e.id === depId);
        if (depEvent) {
          const x1 = (depEvent.timestamp + getEventDuration(depEvent) - time.start) * canvasInfo.scale + canvasInfo.offset.x;
          const x2 = (event.timestamp - time.start) * canvasInfo.scale + canvasInfo.offset.x;
          
          ctx.beginPath();
          ctx.moveTo(x1, 45);
          ctx.lineTo(x2, 45);
          ctx.stroke();
          
          // Arrow
          ctx.beginPath();
          ctx.moveTo(x2, 45);
          ctx.lineTo(x2 - 5, 42);
          ctx.lineTo(x2 - 5, 48);
          ctx.closePath();
          ctx.fill();
        }
      });
    });
  };

  // Annotation drawing
  const drawAnnotation = (ctx: CanvasRenderingContext2D, canvasInfo: any, time: any, annotation: any) => {
    const x = (annotation.timestamp - time.start) * canvasInfo.scale + canvasInfo.offset.x;
    
    ctx.fillStyle = annotation.color;
    ctx.beginPath();
    ctx.moveTo(x, 10);
    ctx.lineTo(x - 5, 0);
    ctx.lineTo(x + 5, 0);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#374151';
    ctx.font = '10px sans-serif';
    ctx.fillText(annotation.title, x + 10, 8);
  };

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current || !renderContext) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    } else {
      // Check for event click
      const clickedEvent = findEventAtPosition(x, y, renderContext);
      if (clickedEvent) {
        const interaction: TimelineInteraction = {
          type: 'click',
          target: 'event',
          position: { x, y },
          event: clickedEvent,
          modifiers: {
            ctrl: e.ctrlKey,
            shift: e.shiftKey,
            alt: e.altKey,
          },
        };
        
        handleInteraction(interaction);
        onEventClick?.(clickedEvent);
      }
    }
  }, [renderContext, handleInteraction, onEventClick]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current || !renderContext) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isPanning) {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      pan(deltaX, deltaY);
      setPanStart({ x: e.clientX, y: e.clientY });
    } else {
      // Check for hover
      const hoveredEvent = findEventAtPosition(x, y, renderContext);
      setHoveredEvent(hoveredEvent);
      onEventHover?.(hoveredEvent);
    }
  }, [isPanning, panStart, renderContext, pan, onEventHover]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    zoom(config.zoom.level * delta);
  }, [config.zoom.level, zoom]);

  // Find event at position
  const findEventAtPosition = (x: number, y: number, renderContext: any): QuestTimelineEvent | null => {
    const { canvas: canvasInfo, time, viewport, groups } = renderContext;
    
    for (const group of groups) {
      if (y >= group.y && y <= group.y + group.height) {
        for (const event of group.events) {
          const eventX = (event.timestamp - time.start) * canvasInfo.scale + canvasInfo.offset.x;
          const eventWidth = getEventDuration(event) * canvasInfo.scale;
          const eventY = group.y + 30;
          const eventHeight = 30;
          
          if (x >= eventX && x <= eventX + eventWidth && y >= eventY && y <= eventY + eventHeight) {
            return event;
          }
        }
      }
    }
    
    return null;
  };

  // Export handlers
  const handleExport = (format: 'json' | 'csv' | 'png' | 'svg') => {
    const data = exportTimeline(format);
    if (data) {
      if (format === 'json' || format === 'csv') {
        const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `timeline.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // For PNG/SVG, would need canvas implementation
        console.warn('PNG/SVG export not implemented yet');
      }
    }
  };

  // Render timeline
  useEffect(() => {
    renderTimeline();
  }, [renderTimeline]);

  // Performance monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Timeline Performance:', performanceMetrics);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [performanceMetrics]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading timeline...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center text-red-600">
            <AlertTriangle className="w-8 h-8 mx-auto mb-4" />
            <p>Error loading timeline: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Quest Timeline</CardTitle>
          <div className="flex items-center gap-2">
            {validationErrors.length > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {validationErrors.length} Errors
              </Badge>
            )}
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {filteredEvents.length} Events
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {performanceMetrics.fps.toFixed(1)} FPS
            </Badge>
          </div>
        </div>
        
        {/* Controls */}
        {showControls && (
          <div className="flex items-center gap-2 mt-4">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={zoomOut}
                className="p-1"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium px-2">
                {(config.zoom.level * 100).toFixed(0)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={zoomIn}
                className="p-1"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={zoomToFit}
                className="p-1"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            <div className="flex items-center gap-1">
              <Button
                variant={showGrid ? "default" : "outline"}
                size="sm"
                onClick={() => setShowGrid(!showGrid)}
                className="p-1"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={showRiskOverlay ? "default" : "outline"}
                size="sm"
                onClick={() => setShowRiskOverlay(!showRiskOverlay)}
                className="p-1"
              >
                <AlertTriangle className="w-4 h-4" />
              </Button>
              <Button
                variant={showDependencies ? "default" : "outline"}
                size="sm"
                onClick={() => setShowDependencies(!showDependencies)}
                className="p-1"
              >
                <Layers className="w-4 h-4" />
              </Button>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('json')}
                className="p-1"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                className="p-1"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div 
          ref={containerRef}
          className="relative border rounded"
          style={{ height: `${height}px` }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          />
          
          {/* Tooltip */}
          {hoveredEvent && (
            <div 
              className="absolute bg-black text-white p-2 rounded shadow-lg text-sm pointer-events-none z-10"
              style={{
                left: `${(hoveredEvent.timestamp - renderContext.time.start) * renderContext.canvas.scale + renderContext.canvas.offset.x}px`,
                top: '60px',
              }}
            >
              <div className="font-semibold">{hoveredEvent.title}</div>
              <div className="text-xs opacity-80">{hoveredEvent.type}</div>
              <div className="text-xs opacity-80">Risk: {hoveredEvent.risk.level}</div>
              <div className="text-xs opacity-80">Status: {hoveredEvent.metadata.status}</div>
            </div>
          )}
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>Quest Start</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Failed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span>Injury</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-900 rounded"></div>
                <span>Death</span>
              </div>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-4">
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <h4 className="font-semibold text-red-800 mb-2">Validation Errors:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.slice(0, 5).map((error, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <XCircle className="w-3 h-3" />
                    {error.message}
                  </li>
                ))}
                {validationErrors.length > 5 && (
                  <li className="text-red-600">
                    ... and {validationErrors.length - 5} more
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
