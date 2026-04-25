/**
 * Quest Timeline Heatmap Component
 * 
 * Visualizes quest decisions over time as a heatmap with risk indicators
 * and outcome markers. Follows Gilded Observatory theme and config-first design.
 * 
 * @since NP-032 – Idle Village Quest Timeline Heatmap
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useQuestTimelineData } from '@/ui/idleVillage/hooks/useQuestTimelineData';
import { getRiskColor, getOutcomeColor, QuestRiskLevel, QuestOutcome } from '@/ui/idleVillage/config/questTimelineConfig';

/**
 * Tooltip component for quest decisions
 */
interface TooltipProps {
  decision: any;
  position: { x: number; y: number };
  visible: boolean;
  config: any;
}

const Tooltip: React.FC<TooltipProps> = ({ decision, position, visible, config }) => {
  if (!visible || !decision) return null;

  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    left: position.x,
    top: position.y,
    backgroundColor: config.colors.hover.overlay,
    color: config.colors.hover.text,
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    maxWidth: `${config.tooltip.maxWidth}px`,
    zIndex: 1000,
    pointerEvents: 'none',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${config.colors.border}`,
  };

  return (
    <div style={tooltipStyle}>
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        {decision.questId}
      </div>
      
      {config.tooltip.fields.turn && (
        <div>Turn: {decision.turn}</div>
      )}
      
      {config.tooltip.fields.decision && (
        <div>Decision: {decision.decision}</div>
      )}
      
      {config.tooltip.fields.outcome && (
        <div style={{ color: getOutcomeColor(decision.outcome, config) }}>
          Outcome: {decision.outcome}
        </div>
      )}
      
      {config.tooltip.fields.risk && (
        <div style={{ color: getRiskColor(decision.riskLevel, config) }}>
          Risk: {decision.riskLevel}
        </div>
      )}
      
      {config.tooltip.fields.resident && decision.residentId && (
        <div>Resident: {decision.residentId}</div>
      )}
    </div>
  );
};

/**
 * Quest Timeline Heatmap Component Props
 */
export interface QuestTimelineHeatmapProps {
  /** Whether to show loading indicator */
  showLoading?: boolean;
  /** Whether to enable zoom/pan interactions */
  enableInteractions?: boolean;
  /** Height of the heatmap in pixels */
  height?: number;
  /** Width of the heatmap in pixels */
  width?: number;
  /** Custom CSS class */
  className?: string;
  /** Callback for decision click */
  onDecisionClick?: (decision: any) => void;
  /** Callback for export */
  onExport?: (format: 'json' | 'csv') => void;
}

/**
 * Quest Timeline Heatmap Component
 * 
 * Displays quest decisions as a color-coded heatmap showing risk levels
 * and outcomes over time with interactive tooltips and export functionality.
 */
export const QuestTimelineHeatmap: React.FC<QuestTimelineHeatmapProps> = ({
  showLoading = true,
  enableInteractions = true,
  height = 400,
  width = 800,
  className = '',
  onDecisionClick,
  onExport,
}) => {
  const {
    data,
    isLoading,
    error,
    config,
    updateConfig,
    exportData,
    emitTelemetry,
  } = useQuestTimelineData({
    enableAutoRefresh: false,
    enableTelemetry: true,
  });

  const [tooltip, setTooltip] = useState<{
    decision: any;
    position: { x: number; y: number };
    visible: boolean;
  }>({
    decision: null,
    position: { x: 0, y: 0 },
    visible: false,
  });

  const [zoomLevel, setZoomLevel] = useState(config.timeline.zoomLevel);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Handle mouse move for tooltips
   */
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !data) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find decision at mouse position
    const columnWidth = (width * zoomLevel) / data.columns.length;
    const columnIndex = Math.floor(x / columnWidth);
    
    if (columnIndex >= 0 && columnIndex < data.columns.length) {
      const column = data.columns[columnIndex];
      const decisionHeight = height / config.timeline.maxTurn;
      const decisionIndex = Math.floor(y / decisionHeight);
      
      if (decisionIndex >= 0 && decisionIndex < column.decisions.length) {
        const decision = column.decisions[decisionIndex];
        
        setTooltip({
          decision,
          position: { x: event.clientX, y: event.clientY - 40 },
          visible: true,
        });
      } else {
        setTooltip(prev => ({ ...prev, visible: false }));
      }
    } else {
      setTooltip(prev => ({ ...prev, visible: false }));
    }
  }, [data, width, height, zoomLevel, config.timeline.maxTurn]);

  /**
   * Handle mouse leave
   */
  const handleMouseLeave = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  /**
   * Handle canvas click
   */
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !data || !onDecisionClick) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const columnWidth = (width * zoomLevel) / data.columns.length;
    const columnIndex = Math.floor(x / columnWidth);
    
    if (columnIndex >= 0 && columnIndex < data.columns.length) {
      const column = data.columns[columnIndex];
      const decisionHeight = height / config.timeline.maxTurn;
      const decisionIndex = Math.floor(y / decisionHeight);
      
      if (decisionIndex >= 0 && decisionIndex < column.decisions.length) {
        const decision = column.decisions[decisionIndex];
        onDecisionClick(decision);
      }
    }
  }, [data, width, height, zoomLevel, config.timeline.maxTurn, onDecisionClick]);

  /**
   * Draw heatmap on canvas
   */
  const drawHeatmap = useCallback(() => {
    if (!canvasRef.current || !data) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = config.colors.background;
    ctx.fillRect(0, 0, width, height);

    const columnWidth = (width * zoomLevel) / data.columns.length;
    const decisionHeight = height / config.timeline.maxTurn;

    // Draw grid
    ctx.strokeStyle = config.colors.grid;
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let i = 0; i <= data.columns.length; i++) {
      ctx.beginPath();
      ctx.moveTo(i * columnWidth + panOffset.x, 0);
      ctx.lineTo(i * columnWidth + panOffset.x, height);
      ctx.stroke();
    }
    
    // Horizontal lines (every 5 turns)
    for (let turn = 0; turn <= config.timeline.maxTurn; turn += 5) {
      const y = (turn / config.timeline.maxTurn) * height;
      ctx.beginPath();
      ctx.moveTo(0 + panOffset.x, y);
      ctx.lineTo(width * zoomLevel + panOffset.x, y);
      ctx.stroke();
    }

    // Draw decisions
    data.columns.forEach((column, columnIndex) => {
      const x = columnIndex * columnWidth + panOffset.x;
      
      column.decisions.forEach((decision, decisionIndex) => {
        const y = (decision.turn / config.timeline.maxTurn) * height;
        const decisionWidth = columnWidth * 0.8;
        const decisionHeightPx = decisionHeight * 0.8;

        // Draw decision cell
        ctx.fillStyle = getRiskColor(decision.riskLevel, config);
        ctx.fillRect(
          x + (columnWidth - decisionWidth) / 2,
          y + (decisionHeight - decisionHeightPx) / 2,
          decisionWidth,
          decisionHeightPx
        );

        // Draw outcome indicator
        ctx.fillStyle = getOutcomeColor(decision.outcome, config);
        ctx.beginPath();
        ctx.arc(
          x + columnWidth / 2,
          y + decisionHeight / 2,
          3,
          0,
          2 * Math.PI
        );
        ctx.fill();
      });

      // Draw turn label
      if (config.timeline.showTurnNumbers) {
        ctx.fillStyle = config.colors.text;
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          column.turnLabel,
          x + columnWidth / 2,
          height - 5
        );
      }
    });

    // Draw statistics
    ctx.fillStyle = config.colors.text;
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Decisions: ${data.stats.totalDecisions}`, 10, 20);
    ctx.fillText(`Success Rate: ${(data.stats.successRate * 100).toFixed(1)}%`, 10, 35);
    ctx.fillText(`Riskiest Turn: ${data.stats.riskiestTurn}`, 10, 50);
  }, [data, width, height, zoomLevel, panOffset, config]);

  // Redraw when data or config changes
  useEffect(() => {
    drawHeatmap();
  }, [drawHeatmap]);

  /**
   * Handle zoom
   */
  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (!enableInteractions) return;

    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(
      config.interaction.minZoomLevel,
      Math.min(config.interaction.maxZoomLevel, zoomLevel + delta)
    );
    setZoomLevel(newZoom);
    updateConfig({ timeline: { ...config.timeline, zoomLevel: newZoom } });
  }, [zoomLevel, enableInteractions, config, updateConfig]);

  /**
   * Handle pan start
   */
  const handlePanStart = useCallback((event: React.MouseEvent) => {
    if (!enableInteractions) return;
    
    setIsDragging(true);
    setDragStart({ x: event.clientX - panOffset.x, y: event.clientY - panOffset.y });
  }, [enableInteractions, panOffset]);

  /**
   * Handle pan move
   */
  const handlePanMove = useCallback((event: React.MouseEvent) => {
    if (!isDragging || !enableInteractions) return;
    
    const newOffset = {
      x: event.clientX - dragStart.x,
      y: event.clientY - dragStart.y,
    };
    setPanOffset(newOffset);
  }, [isDragging, enableInteractions, dragStart]);

  /**
   * Handle pan end
   */
  const handlePanEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Export data
   */
  const handleExport = useCallback((format: 'json' | 'csv') => {
    const exportedData = exportData(format);
    if (exportedData && onExport) {
      onExport(format);
    }
  }, [exportData, onExport]);

  // Emit telemetry when component mounts
  useEffect(() => {
    if (data) {
      emitTelemetry('quest_timeline_heatmap_viewed');
    }
  }, [data, emitTelemetry]);

  if (error) {
    return (
      <div className={`quest-timeline-heatmap-error ${className}`} style={{ color: config.colors.text }}>
        <div>Error loading quest timeline data:</div>
        <div>{error}</div>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (isLoading && showLoading) {
    return (
      <div className={`quest-timeline-heatmap-loading ${className}`} style={{ color: config.colors.text }}>
        <div>Loading quest timeline data...</div>
      </div>
    );
  }

  if (!data || data.decisions.length === 0) {
    return (
      <div className={`quest-timeline-heatmap-empty ${className}`} style={{ color: config.colors.text }}>
        <div>No quest decisions found</div>
        <div>Complete some quests to see the timeline visualization</div>
      </div>
    );
  }

  return (
    <div className={`quest-timeline-heatmap ${className}`} style={{ position: 'relative' }}>
      {/* Controls */}
      <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          onClick={() => handleExport('json')}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            backgroundColor: config.colors.border,
            color: config.colors.text,
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Export JSON
        </button>
        
        <button
          onClick={() => handleExport('csv')}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            backgroundColor: config.colors.border,
            color: config.colors.text,
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Export CSV
        </button>
        
        <div style={{ fontSize: '12px', color: config.colors.text }}>
          Zoom: {(zoomLevel * 100).toFixed(0)}%
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: `${width}px`,
          height: `${height}px`,
          overflow: 'hidden',
          border: `1px solid ${config.colors.border}`,
          borderRadius: '4px',
          cursor: enableInteractions ? (isDragging ? 'grabbing' : 'grab') : 'default',
        }}
        onWheel={handleWheel}
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
      >
        <canvas
          ref={canvasRef}
          width={width * zoomLevel}
          height={height}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleCanvasClick}
          style={{
            position: 'absolute',
            left: `${panOffset.x}px`,
            top: `${panOffset.y}px`,
          }}
        />
      </div>

      {/* Tooltip */}
      <Tooltip
        decision={tooltip.decision}
        position={tooltip.position}
        visible={tooltip.visible}
        config={config}
      />

      {/* Legend */}
      <div style={{ marginTop: '10px', display: 'flex', gap: '20px', fontSize: '12px' }}>
        <div>
          <strong>Risk Levels:</strong>
          {Object.entries(config.colors.risk).map(([level, color]) => (
            <span key={level} style={{ marginLeft: '10px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  backgroundColor: color,
                  marginRight: '4px',
                  border: '1px solid #333',
                }}
              />
              {level}
            </span>
          ))}
        </div>
        
        <div>
          <strong>Outcomes:</strong>
          {Object.entries(config.colors.outcome).map(([outcome, color]) => (
            <span key={outcome} style={{ marginLeft: '10px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  marginRight: '4px',
                }}
              />
              {outcome}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestTimelineHeatmap;
