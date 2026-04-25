/**
 * Quest Decision Heatmap Tooltip Component - NP-022
 * 
 * Tooltip system for displaying detailed quest decision information
 * on hover. Shows decision details, impact metrics, and related data.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import {
  type QuestDecisionData,
  type HeatmapCell,
  type TooltipConfig,
  type QuestDecisionType,
  type QuestPriority,
  type QuestCategory,
  DEFAULT_QUEST_DECISION_HEATMAP_CONFIG,
  formatTimestamp,
  getPriorityWeight,
} from '../config/questDecisionHeatmapConfig';

const diagnostics = createSandboxDiagnostics('QuestDecisionHeatmapTooltip', 'tooltip');

/**
 * Tooltip position and bounds
 */
interface TooltipPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

/**
 * Tooltip content data
 */
interface TooltipContent {
  title: string;
  subtitle?: string;
  sections: TooltipSection[];
  actions?: TooltipAction[];
}

/**
 * Tooltip section
 */
interface TooltipSection {
  title: string;
  type: 'text' | 'list' | 'grid' | 'chart' | 'progress';
  content: any;
  priority?: number;
}

/**
 * Tooltip action
 */
interface TooltipAction {
  label: string;
  icon?: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

/**
 * Props for QuestDecisionHeatmapTooltip component
 */
export interface QuestDecisionHeatmapTooltipProps {
  /** Configuration for the tooltip */
  config?: Partial<TooltipConfig>;
  /** Cell data to display */
  cell?: HeatmapCell;
  /** Decision data to display */
  decision?: QuestDecisionData;
  /** Position for tooltip */
  position?: { x: number; y: number };
  /** Whether tooltip is visible */
  visible?: boolean;
  /** Callback for close action */
  onClose?: () => void;
  /** Custom CSS class names */
  className?: string;
  /** Maximum width for tooltip */
  maxWidth?: number;
  /** Whether to show custom fields */
  showCustomFields?: boolean;
}

/**
 * Individual tooltip section component
 */
interface TooltipSectionComponentProps {
  section: TooltipSection;
  maxWidth?: number;
}

const TooltipSectionComponent: React.FC<TooltipSectionComponentProps> = ({
  section,
  maxWidth,
}) => {
  const renderContent = () => {
    switch (section.type) {
      case 'text':
        return (
          <div className="text-xs text-gray-300 whitespace-pre-wrap">
            {section.content}
          </div>
        );

      case 'list':
        return (
          <ul className="text-xs text-gray-300 space-y-1">
            {Array.isArray(section.content) && section.content.map((item, index) => (
              <li key={index} className="flex items-center space-x-2">
                {item.icon && <span className="text-gray-400">{item.icon}</span>}
                <span>{item.label}</span>
                {item.value && <span className="text-gray-400 ml-auto">{item.value}</span>}
              </li>
            ))}
          </ul>
        );

      case 'grid':
        return (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Array.isArray(section.content) && section.content.map((item, index) => (
              <div key={index} className="flex flex-col">
                <span className="text-gray-400">{item.label}</span>
                <span className="text-gray-300">{item.value}</span>
              </div>
            ))}
          </div>
        );

      case 'progress':
        return (
          <div className="space-y-2">
            {Array.isArray(section.content) && section.content.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300">{item.label}</span>
                  <span className="text-gray-400">{item.value}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        );

      case 'chart':
        return (
          <div className="h-20 flex items-end space-x-1">
            {Array.isArray(section.content) && section.content.map((item, index) => (
              <div
                key={index}
                className="flex-1 bg-blue-500 rounded-t transition-all duration-300"
                style={{ height: `${item.value}%` }}
                title={`${item.label}: ${item.value}%`}
              />
            ))}
          </div>
        );

      default:
        return <div className="text-xs text-gray-400">Unknown section type</div>;
    }
  };

  return (
    <div className="space-y-2">
      {section.title && (
        <h4 className="text-xs font-semibold text-white uppercase tracking-wide">
          {section.title}
        </h4>
      )}
      <div style={{ maxWidth }}>
        {renderContent()}
      </div>
    </div>
  );
};

/**
 * Main Quest Decision Heatmap Tooltip component
 */
export const QuestDecisionHeatmapTooltip: React.FC<QuestDecisionHeatmapTooltipProps> = ({
  config: userConfig,
  cell,
  decision,
  position,
  visible = false,
  onClose,
  className = '',
  maxWidth,
  showCustomFields = true,
}) => {
  const config = useMemo(() => ({
    ...DEFAULT_QUEST_DECISION_HEATMAP_CONFIG.tooltip,
    ...userConfig,
  }), [userConfig]);

  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate tooltip content based on data
  const tooltipContent = useMemo((): TooltipContent | null => {
    if (!cell && !decision) return null;

    if (decision) {
      // Single decision tooltip
      const sections: TooltipSection[] = [];

      // Basic information
      sections.push({
        title: 'Quest Information',
        type: 'grid',
        content: [
          { label: 'Quest', value: decision.questName },
          { label: 'Type', value: decision.decisionType },
          { label: 'Priority', value: decision.priority },
          { label: 'Category', value: decision.category },
        ],
        priority: 1,
      });

      // Location information
      if (config.showCoordinates) {
        sections.push({
          title: 'Location',
          type: 'grid',
          content: [
            { label: 'X', value: decision.coordinates.x.toFixed(2) },
            { label: 'Y', value: decision.coordinates.y.toFixed(2) },
            ...(decision.coordinates.z ? [{ label: 'Z', value: decision.coordinates.z.toFixed(2) }] : []),
            ...(decision.coordinates.region ? [{ label: 'Region', value: decision.coordinates.region }] : []),
            ...(decision.coordinates.zone ? [{ label: 'Zone', value: decision.coordinates.zone }] : []),
          ],
          priority: 2,
        });
      }

      // Timestamp
      if (config.showTimestamp) {
        sections.push({
          title: 'Time',
          type: 'text',
          content: formatTimestamp(decision.timestamp),
          priority: 3,
        });
      }

      // Decision maker
      if (config.showDecisionMaker && decision.decisionMaker) {
        sections.push({
          title: 'Decision Maker',
          type: 'text',
          content: decision.decisionMaker,
          priority: 4,
        });
      }

      // Impact metrics
      if (config.showImpact && decision.impact) {
        sections.push({
          title: 'Impact',
          type: 'progress',
          content: [
            { label: 'Resources', value: Math.abs(decision.impact.resources) * 20 },
            { label: 'Reputation', value: Math.abs(decision.impact.reputation) * 20 },
            { label: 'Time', value: Math.abs(decision.impact.time) * 20 },
            { label: 'Risk', value: Math.abs(decision.impact.risk) * 20 },
          ],
          priority: 5,
        });
      }

      // Outcome
      if (config.showOutcome && decision.outcome) {
        sections.push({
          title: 'Outcome',
          type: 'text',
          content: decision.outcome.charAt(0).toUpperCase() + decision.outcome.slice(1),
          priority: 6,
        });
      }

      // Custom fields
      if (showCustomFields && decision.metadata) {
        const customItems = Object.entries(decision.metadata).map(([key, value]) => ({
          label: key.charAt(0).toUpperCase() + key.slice(1),
          value: String(value),
        }));

        if (customItems.length > 0) {
          sections.push({
            title: 'Additional Details',
            type: 'list',
            content: customItems,
            priority: 7,
          });
        }
      }

      return {
        title: decision.questName,
        subtitle: `${decision.decisionType} - ${decision.priority}`,
        sections: sections.sort((a, b) => (a.priority || 0) - (b.priority || 0)),
      };
    }

    if (cell) {
      // Cell tooltip (multiple decisions)
      const sections: TooltipSection[] = [];

      // Cell summary
      sections.push({
        title: 'Cell Summary',
        type: 'grid',
        content: [
          { label: 'Total Decisions', value: cell.totalDecisions },
          { label: 'Dominant Decision', value: cell.dominantDecision },
          { label: 'Dominant Category', value: cell.dominantCategory },
          { label: 'Average Priority', value: cell.averagePriority.toFixed(1) },
          { label: 'Success Rate', value: `${(cell.successRate * 100).toFixed(1)}%` },
          { label: 'Intensity', value: `${(cell.intensity * 100).toFixed(1)}%` },
        ],
        priority: 1,
      });

      // Decision breakdown
      const decisionCounts = cell.decisions.reduce((acc, d) => {
        acc[d.decisionType] = (acc[d.decisionType] || 0) + 1;
        return acc;
      }, {} as Record<QuestDecisionType, number>);

      const decisionBreakdown = Object.entries(decisionCounts).map(([type, count]) => ({
        label: type,
        value: (count / cell.totalDecisions) * 100,
      }));

      sections.push({
        title: 'Decision Breakdown',
        type: 'chart',
        content: decisionBreakdown,
        priority: 2,
      });

      // Recent decisions
      const recentDecisions = cell.decisions
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5)
        .map(d => ({
          label: d.questName,
          value: formatTimestamp(d.timestamp),
          icon: d.decisionType === 'accept' ? '✓' : d.decisionType === 'decline' ? '✗' : '⏸',
        }));

      if (recentDecisions.length > 0) {
        sections.push({
          title: 'Recent Decisions',
          type: 'list',
          content: recentDecisions,
          priority: 3,
        });
      }

      // Location info
      if (cell.region || cell.zone) {
        sections.push({
          title: 'Location',
          type: 'text',
          content: [cell.region, cell.zone].filter(Boolean).join(' - '),
          priority: 4,
        });
      }

      return {
        title: `${cell.totalDecisions} Quest Decisions`,
        subtitle: `Area: (${cell.x.toFixed(1)}, ${cell.y.toFixed(1)})`,
        sections: sections.sort((a, b) => (a.priority || 0) - (b.priority || 0)),
        actions: [
          {
            label: 'View Details',
            icon: '🔍',
            onClick: () => {
              // Handle view details action
              diagnostics.info('View details clicked', { cell });
            },
          },
        ],
      };
    }

    return null;
  }, [cell, decision, config, showCustomFields]);

  // Calculate tooltip position
  const calculatePosition = useCallback((mouseX: number, mouseY: number): TooltipPosition => {
    if (!tooltipRef.current || !containerRef.current) {
      return {
        x: mouseX,
        y: mouseY,
        width: 200,
        height: 100,
        placement: 'auto',
      };
    }

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    const width = Math.min(maxWidth || config.maxWidth, tooltipRect.width);
    const height = tooltipRect.height;

    // Calculate available space
    const spaceTop = mouseY - containerRect.top;
    const spaceBottom = containerRect.bottom - mouseY;
    const spaceLeft = mouseX - containerRect.left;
    const spaceRight = containerRect.right - mouseX;

    // Determine best placement
    let placement: TooltipPosition['placement'] = 'auto';
    let x = mouseX;
    let y = mouseY;

    if (spaceBottom >= height + 10) {
      placement = 'bottom';
      y = mouseY + 10;
    } else if (spaceTop >= height + 10) {
      placement = 'top';
      y = mouseY - height - 10;
    } else if (spaceRight >= width + 10) {
      placement = 'right';
      x = mouseX + 10;
      y = Math.max(containerRect.top, mouseY - height / 2);
    } else if (spaceLeft >= width + 10) {
      placement = 'left';
      x = mouseX - width - 10;
      y = Math.max(containerRect.top, mouseY - height / 2);
    } else {
      // Fallback to bottom with adjustment
      placement = 'bottom';
      y = Math.min(containerRect.bottom - height - 10, mouseY + 10);
      x = Math.max(containerRect.left, Math.min(containerRect.right - width, mouseX - width / 2));
    }

    // Ensure tooltip stays within bounds
    x = Math.max(containerRect.left, Math.min(containerRect.right - width, x));
    y = Math.max(containerRect.top, Math.min(containerRect.bottom - height, y));

    return {
      x: x - containerRect.left,
      y: y - containerRect.top,
      width,
      height,
      placement,
    };
  }, [config.maxWidth, maxWidth]);

  // Update position when position prop changes
  useEffect(() => {
    if (position && visible) {
      const pos = calculatePosition(position.x, position.y);
      setTooltipPosition(pos);
    }
  }, [position, visible, calculatePosition]);

  // Handle mouse move to update position
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (visible && position) {
      const pos = calculatePosition(event.clientX, event.clientY);
      setTooltipPosition(pos);
    }
  }, [visible, position, calculatePosition]);

  if (!visible || !tooltipContent || !tooltipPosition) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-50"
      onMouseMove={handleMouseMove}
    >
      <div
        ref={tooltipRef}
        className={`absolute bg-gray-900 border border-gray-600 rounded-lg shadow-xl pointer-events-auto ${className}`}
        style={{
          left: `${tooltipPosition.x}px`,
          top: `${tooltipPosition.y}px`,
          width: `${tooltipPosition.width}px`,
          maxWidth: `${maxWidth || config.maxWidth}px`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <div>
            <h3 className="text-sm font-semibold text-white truncate">
              {tooltipContent.title}
            </h3>
            {tooltipContent.subtitle && (
              <p className="text-xs text-gray-400 truncate">
                {tooltipContent.subtitle}
              </p>
            )}
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
              title="Close"
            >
              <span className="text-lg">×</span>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-3 max-h-64 overflow-y-auto">
          {tooltipContent.sections.map((section, index) => (
            <TooltipSectionComponent
              key={index}
              section={section}
              maxWidth={maxWidth || config.maxWidth}
            />
          ))}
        </div>

        {/* Actions */}
        {tooltipContent.actions && tooltipContent.actions.length > 0 && (
          <div className="flex items-center justify-end p-3 border-t border-gray-700 space-x-2">
            {tooltipContent.actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  action.variant === 'primary'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : action.variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                {action.icon && <span className="mr-1">{action.icon}</span>}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Hook for managing tooltip state
 */
export function useQuestDecisionTooltip(config?: Partial<TooltipConfig>) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [cell, setCell] = useState<HeatmapCell | undefined>();
  const [decision, setDecision] = useState<QuestDecisionData | undefined>();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = useCallback((
    data: { cell?: HeatmapCell; decision?: QuestDecisionData },
    mousePosition: { x: number; y: number }
  ) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set data immediately for hover show
    if (config?.showOnHover) {
      setCell(data.cell);
      setDecision(data.decision);
      setPosition(mousePosition);
      setVisible(true);
    } else {
      // Delay for click show
      timeoutRef.current = setTimeout(() => {
        setCell(data.cell);
        setDecision(data.decision);
        setPosition(mousePosition);
        setVisible(true);
      }, config?.delay || 200);
    }
  }, [config]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setVisible(false);
      setPosition(null);
      setCell(undefined);
      setDecision(undefined);
    }, 100); // Small delay to prevent flickering
  }, []);

  const hideTooltipImmediate = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVisible(false);
    setPosition(null);
    setCell(undefined);
    setDecision(undefined);
  }, []);

  // Auto-hide after duration
  useEffect(() => {
    if (visible && config?.duration) {
      timeoutRef.current = setTimeout(() => {
        hideTooltip();
      }, config.duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, config?.duration, hideTooltip]);

  return {
    visible,
    position,
    cell,
    decision,
    showTooltip,
    hideTooltip,
    hideTooltipImmediate,
  };
}

/**
 * Simple tooltip component for quick display
 */
export interface SimpleTooltipProps {
  content: string;
  position: { x: number; y: number };
  visible?: boolean;
  className?: string;
}

export const SimpleTooltip: React.FC<SimpleTooltipProps> = ({
  content,
  position,
  visible = false,
  className = '',
}) => {
  if (!visible) return null;

  return (
    <div
      className={`absolute bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg z-50 pointer-events-none ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y - 30}px`, // Position above cursor
        transform: 'translateX(-50%)',
      }}
    >
      {content}
    </div>
  );
}
