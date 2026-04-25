/**
 * Quest Heatmap Component
 * 
 * Configurable heatmap visualization for quest telemetry data with CSS grid layout,
 * interactive tooltips, and focus states. Follows Gilded Observatory design principles.
 * 
 * @fileoverview Quest telemetry heatmap visualization component
 * @module idleVillage/QuestHeatmap
 * @since 2026-01-12
 * @author Cascade
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import clsx from 'clsx';
import type { HeatmapCell } from '@/ui/idleVillage/utils/questTelemetryTransforms';
import type { QuestTelemetryConfig } from '@/balancing/config/idleVillage/questTelemetryConfig';
import { DEFAULT_QUEST_TELEMETRY_CONFIG } from '@/balancing/config/idleVillage/questTelemetryConfig';
import { getCellColor, formatTooltip } from '@/ui/idleVillage/utils/questTelemetryTransforms';

export interface QuestHeatmapProps {
  /** Heatmap matrix data */
  matrix: HeatmapCell[][];
  /** Quest telemetry configuration */
  config?: QuestTelemetryConfig;
  /** Additional CSS classes */
  className?: string;
  /** Enable animations */
  animated?: boolean;
  /** Show tooltips on hover */
  showTooltips?: boolean;
  /** Enable cell selection */
  selectable?: boolean;
  /** On cell click handler */
  onCellClick?: (cell: HeatmapCell) => void;
  /** On cell hover handler */
  onCellHover?: (cell: HeatmapCell | null) => void;
  /** Test mode (disables animations) */
  testMode?: boolean;
}

/**
 * Quest Heatmap Component
 * 
 * Displays quest telemetry data as an interactive heatmap with configurable
 * colors, tooltips, and selection states.
 */
export const QuestHeatmap: React.FC<QuestHeatmapProps> = ({
  matrix,
  config = DEFAULT_QUEST_TELEMETRY_CONFIG,
  className,
  animated = true,
  showTooltips = true,
  selectable = false,
  onCellClick,
  onCellHover,
  testMode = false,
}) => {
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Animation configuration
  const animationConfig = testMode ? { ...config.heatmap.animation, enabled: false } : config.heatmap.animation;

  // Handle cell click
  const handleCellClick = useCallback((cell: HeatmapCell) => {
    if (!selectable || !cell.populated) return;
    
    setSelectedCell(cell);
    onCellClick?.(cell);
  }, [selectable, onCellClick]);

  // Handle cell hover
  const handleCellHover = useCallback((cell: HeatmapCell | null, event?: React.MouseEvent) => {
    setHoveredCell(cell);
    onCellHover?.(cell);

    if (showTooltips && cell && event && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    }
  }, [showTooltips, onCellHover]);

  // Generate CSS for animations
  const animationStyles = useMemo(() => {
    if (!animationConfig.enabled) return {};

    return {
      '--heatmap-animation-duration': `${animationConfig.duration}ms`,
      '--heatmap-animation-easing': animationConfig.easing,
      '--heatmap-stagger-delay': `${animationConfig.staggerDelay}ms`,
    } as React.CSSProperties;
  }, [animationConfig]);

  // Cell CSS classes
  const getCellClasses = useCallback((cell: HeatmapCell) => {
    return clsx(
      'heatmap-cell',
      'relative',
      'border',
      'rounded',
      'transition-all',
      'duration-200',
      'cursor-pointer',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      {
        // Populated state
        'opacity-100': cell.populated,
        'opacity-30': !cell.populated,
        
        // Selection state
        'ring-2': selectedCell?.row === cell.row && selectedCell?.column === cell.column,
        'ring-offset-2': selectedCell?.row === cell.row && selectedCell?.column === cell.column,
        
        // Hover state
        'scale-105': hoveredCell?.row === cell.row && hoveredCell?.column === cell.column,
        'z-10': hoveredCell?.row === cell.row && hoveredCell?.column === cell.column,
        
        // Animation
        'animate-fade-in': animationConfig.enabled && cell.populated,
      }
    );
  }, [selectedCell, hoveredCell, animationConfig.enabled]);

  // Cell inline styles
  const getCellStyles = useCallback((cell: HeatmapCell) => {
    const baseStyles: React.CSSProperties = {
      width: `${config.heatmap.grid.cellSize}px`,
      height: `${config.heatmap.grid.cellSize}px`,
      backgroundColor: cell.backgroundColor,
      borderColor: cell.borderColor,
      borderRadius: `${config.heatmap.grid.borderRadius}px`,
    };

    // Add animation delay for staggered effect
    if (animationConfig.enabled && cell.populated) {
      const delay = (cell.row * config.heatmap.grid.columns + cell.column) * animationConfig.staggerDelay;
      baseStyles.animationDelay = `${delay}ms`;
    }

    // Override colors for selected/hovered states
    if (selectedCell?.row === cell.row && selectedCell?.column === cell.column) {
      baseStyles.backgroundColor = config.heatmap.colors.selectedBackground;
      baseStyles.borderColor = config.heatmap.colors.focusBorder;
    } else if (hoveredCell?.row === cell.row && hoveredCell?.column === cell.column) {
      baseStyles.backgroundColor = config.heatmap.colors.hoverBackground;
    }

    return baseStyles;
  }, [config, selectedCell, hoveredCell, animationConfig]);

  // Tooltip visibility
  const showTooltip = showTooltips && hoveredCell && hoveredCell.populated;

  return (
    <div className={clsx('quest-heatmap', 'relative', className)}>
      {/* Heatmap Grid */}
      <div
        ref={containerRef}
        className="heatmap-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${config.heatmap.grid.columns}, ${config.heatmap.grid.cellSize}px)`,
          gridTemplateRows: `repeat(${config.heatmap.grid.rows}, ${config.heatmap.grid.cellSize}px)`,
          gap: `${config.heatmap.grid.gap}px`,
          ...animationStyles,
        }}
        role="grid"
        aria-label="Quest telemetry heatmap"
      >
        {matrix.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={getCellClasses(cell)}
              style={getCellStyles(cell)}
              role="gridcell"
              aria-label={cell.populated ? `Quest risk: ${cell.value.toFixed(1)}%` : 'No data'}
              aria-selected={selectedCell?.row === rowIndex && selectedCell?.column === colIndex}
              tabIndex={cell.populated ? 0 : -1}
              onClick={() => handleCellClick(cell)}
              onMouseEnter={(e) => handleCellHover(cell, e)}
              onMouseLeave={() => handleCellHover(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCellClick(cell);
                }
              }}
            />
          ))
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="heatmap-tooltip"
          style={{
            position: 'absolute',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -100%)',
            marginTop: '-8px',
            backgroundColor: config.heatmap.tooltip.backgroundColor,
            color: config.heatmap.tooltip.textColor,
            border: `1px solid ${config.heatmap.tooltip.borderColor}`,
            borderRadius: `${config.heatmap.tooltip.borderRadius}px`,
            padding: `${config.heatmap.tooltip.padding}px`,
            fontSize: config.heatmap.tooltip.fontSize,
            whiteSpace: 'pre-line',
            pointerEvents: 'none',
            zIndex: 50,
            maxWidth: '200px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          {formatTooltip(hoveredCell, config)}
        </div>
      )}

      {/* Legend */}
      <div className="heatmap-legend mt-4 flex flex-wrap gap-2">
        {config.riskBuckets.map((bucket) => (
          <div
            key={bucket.id}
            className="legend-item flex items-center gap-2"
          >
            <div
              className="legend-color w-4 h-4 rounded border"
              style={{
                backgroundColor: bucket.backgroundColor,
                borderColor: bucket.borderColor,
              }}
            />
            <span className="legend-label text-xs text-slate-300">
              {bucket.label}
            </span>
          </div>
        ))}
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in var(--heatmap-animation-duration) var(--heatmap-animation-easing);
          animation-delay: var(--heatmap-stagger-delay);
          animation-fill-mode: both;
        }

        .heatmap-cell {
          transition: all 200ms ease-in-out;
        }

        .heatmap-cell:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .heatmap-cell:focus {
          outline: none;
          box-shadow: 0 0 0 2px var(--focus-color);
        }
      `}</style>
    </div>
  );
};

export default QuestHeatmap;
