/**
 * Quest Decision Heatmap Legend Component - NP-022
 * 
 * Interactive legend component for quest decision heatmap visualization.
 * Provides filtering, grouping, and interactive controls for different
 * decision types, priorities, and categories.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import {
  type QuestDecisionHeatmapConfig,
  type LegendConfig,
  type ColorScheme,
  QuestDecisionType,
  QuestPriority,
  QuestCategory,
  DEFAULT_QUEST_DECISION_HEATMAP_CONFIG,
  getDecisionTypeColor,
  getPriorityWeight,
} from '../config/questDecisionHeatmapConfig';

const diagnostics = createSandboxDiagnostics('QuestDecisionHeatmapLegend', 'legend');

/**
 * Legend item data
 */
interface LegendItem {
  id: string;
  label: string;
  color: string;
  value: number;
  count: number;
  percentage: number;
  type: 'decision' | 'priority' | 'category' | 'outcome';
  enabled: boolean;
}

/**
 * Props for QuestDecisionHeatmapLegend component
 */
export interface QuestDecisionHeatmapLegendProps {
  /** Configuration for the legend */
  config?: Partial<LegendConfig>;
  /** Color scheme to use */
  colorScheme?: ColorScheme;
  /** Data for legend items */
  data?: {
    decisions: Record<QuestDecisionType, number>;
    priorities: Record<QuestPriority, number>;
    categories: Record<QuestCategory, number>;
    outcomes?: Record<string, number>;
  };
  /** Callback for item selection changes */
  onSelectionChange?: (selectedItems: string[]) => void;
  /** Callback for grouping changes */
  onGroupingChange?: (grouping: LegendConfig['grouping']) => void;
  /** Custom CSS class names */
  className?: string;
  /** Whether legend is visible */
  visible?: boolean;
}

/**
 * Individual legend item component
 */
interface LegendItemComponentProps {
  item: LegendItem;
  showLabel?: boolean;
  showValue?: boolean;
  interactive?: boolean;
  onToggle?: (id: string) => void;
  size?: 'small' | 'medium' | 'large';
}

const LegendItemComponent: React.FC<LegendItemComponentProps> = ({
  item,
  showLabel = true,
  showValue = true,
  interactive = true,
  onToggle,
  size = 'medium',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getSizeClasses = (size: string): string => {
    switch (size) {
      case 'small': return 'w-3 h-3 text-xs';
      case 'large': return 'w-5 h-5 text-sm';
      default: return 'w-4 h-4 text-xs';
    }
  };

  const handleClick = useCallback(() => {
    if (interactive && onToggle) {
      onToggle(item.id);
    }
  }, [interactive, onToggle, item.id]);

  return (
    <div
      className={`flex items-center space-x-2 p-1 rounded transition-all duration-200 ${
        interactive ? 'cursor-pointer hover:bg-gray-700' : ''
      } ${!item.enabled ? 'opacity-50' : ''}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Color indicator */}
      <div
        className={`${getSizeClasses(size)} rounded border-2 ${
          isHovered && interactive ? 'border-white' : 'border-gray-600'
        }`}
        style={{
          backgroundColor: item.color,
          opacity: item.enabled ? 1 : 0.3,
        }}
      />
      
      {/* Label */}
      {showLabel && (
        <span className={`text-gray-300 ${
          size === 'small' ? 'text-xs' : size === 'large' ? 'text-sm' : 'text-xs'
        }`}>
          {item.label}
        </span>
      )}
      
      {/* Value/Count */}
      {showValue && (
        <span className={`text-gray-400 ${
          size === 'small' ? 'text-xs' : size === 'large' ? 'text-sm' : 'text-xs'
        }`}>
          {item.count} ({item.percentage.toFixed(1)}%)
        </span>
      )}
    </div>
  );
};

/**
 * Main Quest Decision Heatmap Legend component
 */
export const QuestDecisionHeatmapLegend: React.FC<QuestDecisionHeatmapLegendProps> = ({
  config: userConfig,
  colorScheme,
  data,
  onSelectionChange,
  onGroupingChange,
  className = '',
  visible = true,
}) => {
  const config = useMemo(() => ({
    ...DEFAULT_QUEST_DECISION_HEATMAP_CONFIG.legend,
    ...userConfig,
  }), [userConfig]);

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentGrouping, setCurrentGrouping] = useState<LegendConfig['grouping']>(config.grouping);

  // Generate legend items based on data and grouping
  const legendItems = useMemo((): LegendItem[] => {
    if (!data) return [];

    const items: LegendItem[] = [];
    const total = Object.values(data.decisions).reduce((sum, count) => sum + count, 0);

    switch (currentGrouping) {
      case 'decision':
        Object.entries(data.decisions).forEach(([decisionType, count]) => {
          if (count > 0) {
            items.push({
              id: `decision-${decisionType}`,
              label: decisionType.charAt(0).toUpperCase() + decisionType.slice(1),
              color: colorScheme ? getDecisionTypeColor(decisionType as QuestDecisionType, colorScheme) : '#666',
              value: count,
              count,
              percentage: total > 0 ? (count / total) * 100 : 0,
              type: 'decision',
              enabled: selectedItems.has(`decision-${decisionType}`) || selectedItems.size === 0,
            });
          }
        });
        break;

      case 'priority':
        Object.entries(data.priorities).forEach(([priority, count]) => {
          if (count > 0) {
            const weight = getPriorityWeight(priority as QuestPriority);
            const intensity = weight / 5; // Normalize to 0-1
            
            items.push({
              id: `priority-${priority}`,
              label: priority.charAt(0).toUpperCase() + priority.slice(1),
              color: `hsl(${(1 - intensity) * 240}, 70%, 50%)`, // Blue to red gradient
              value: weight,
              count,
              percentage: total > 0 ? (count / total) * 100 : 0,
              type: 'priority',
              enabled: selectedItems.has(`priority-${priority}`) || selectedItems.size === 0,
            });
          }
        });
        break;

      case 'category':
        Object.entries(data.categories).forEach(([category, count]) => {
          if (count > 0) {
            // Generate colors based on category
            const categoryColors: Record<string, string> = {
              [QuestCategory.COMBAT]: '#ef4444',
              [QuestCategory.EXPLORATION]: '#10b981',
              [QuestCategory.DIPLOMACY]: '#3b82f6',
              [QuestCategory.CRAFTING]: '#f59e0b',
              [QuestCategory.TRADE]: '#8b5cf6',
              [QuestCategory.MYSTERY]: '#ec4899',
              [QuestCategory.DEFENSE]: '#6b7280',
              [QuestCategory.RESOURCES]: '#14b8a6',
            };
            
            items.push({
              id: `category-${category}`,
              label: category.charAt(0).toUpperCase() + category.slice(1),
              color: categoryColors[category] || '#666',
              value: count,
              count,
              percentage: total > 0 ? (count / total) * 100 : 0,
              type: 'category',
              enabled: selectedItems.has(`category-${category}`) || selectedItems.size === 0,
            });
          }
        });
        break;

      case 'outcome':
        if (data.outcomes) {
          Object.entries(data.outcomes).forEach(([outcome, count]) => {
            if (count > 0) {
              const outcomeColors: Record<string, string> = {
                success: '#10b981',
                failure: '#ef4444',
                partial: '#f59e0b',
                pending: '#6b7280',
              };
              
              items.push({
                id: `outcome-${outcome}`,
                label: outcome.charAt(0).toUpperCase() + outcome.slice(1),
                color: outcomeColors[outcome] || '#666',
                value: count,
                count,
                percentage: total > 0 ? (count / total) * 100 : 0,
                type: 'outcome',
                enabled: selectedItems.has(`outcome-${outcome}`) || selectedItems.size === 0,
              });
            }
          });
        }
        break;
    }

    // Sort by count (descending) and limit to maxItems
    return items
      .sort((a, b) => b.count - a.count)
      .slice(0, config.maxItems);
  }, [data, currentGrouping, colorScheme, selectedItems, config.maxItems]);

  // Handle item toggle
  const handleItemToggle = useCallback((itemId: string) => {
    const newSelected = new Set(selectedItems);
    
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    
    // If all items are selected, clear selection (show all)
    if (newSelected.size === legendItems.length) {
      newSelected.clear();
    }
    
    setSelectedItems(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  }, [selectedItems, legendItems.length, onSelectionChange]);

  // Handle grouping change
  const handleGroupingChange = useCallback((newGrouping: LegendConfig['grouping']) => {
    setCurrentGrouping(newGrouping);
    setSelectedItems(new Set()); // Clear selection when grouping changes
    onGroupingChange?.(newGrouping);
  }, [onGroupingChange]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    const allIds = legendItems.map(item => item.id);
    setSelectedItems(new Set(allIds));
    onSelectionChange?.(allIds);
  }, [legendItems, onSelectionChange]);

  // Handle clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedItems(new Set());
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  // Get position classes
  const getPositionClasses = (): string => {
    switch (config.position) {
      case 'top': return 'top-0 left-0 right-0';
      case 'right': return 'top-0 right-0 bottom-0';
      case 'bottom': return 'bottom-0 left-0 right-0';
      case 'left': return 'top-0 left-0 bottom-0';
      case 'floating': return 'top-4 right-4';
      default: return 'top-0 right-0 bottom-0';
    }
  };

  // Get orientation classes
  const getOrientationClasses = (): string => {
    switch (config.orientation) {
      case 'horizontal': return 'flex-row';
      case 'vertical': return 'flex-col';
      default: return 'flex-col';
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`bg-gray-800 border border-gray-600 rounded-lg p-4 ${getPositionClasses()} ${
        config.position === 'floating' ? 'absolute z-10 shadow-lg' : 'relative'
      } ${className}`}
      style={{
        minWidth: config.position === 'floating' ? '200px' : 'auto',
        maxWidth: config.position === 'floating' ? '300px' : 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Legend</h3>
        
        {config.collapsible && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-400 hover:text-white transition-colors p-1"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <span className={`transform transition-transform ${isCollapsed ? 'rotate-90' : ''}`}>
              ▶
            </span>
          </button>
        )}
      </div>

      {!isCollapsed && (
        <>
          {/* Grouping selector */}
          {config.interactive && (
            <div className="mb-3">
              <label className="text-xs text-gray-400 block mb-1">Group by:</label>
              <select
                value={currentGrouping}
                onChange={(e) => handleGroupingChange(e.target.value as LegendConfig['grouping'])}
                className="bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-blue-500"
              >
                <option value="decision">Decision Type</option>
                <option value="priority">Priority</option>
                <option value="category">Category</option>
                {data?.outcomes && <option value="outcome">Outcome</option>}
              </select>
            </div>
          )}

          {/* Selection controls */}
          {config.interactive && (
            <div className="flex items-center space-x-2 mb-3">
              <button
                onClick={handleSelectAll}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
              >
                Select All
              </button>
              <button
                onClick={handleClearSelection}
                className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded transition-colors"
              >
                Clear
              </button>
            </div>
          )}

          {/* Legend items */}
          <div className={`flex ${getOrientationClasses()} space-y-2 ${
            config.orientation === 'horizontal' ? 'space-x-4 overflow-x-auto' : ''
          }`}>
            {legendItems.map(item => (
              <LegendItemComponent
                key={item.id}
                item={item}
                showLabel={config.showLabels}
                showValue={config.showValues}
                interactive={config.interactive}
                onToggle={config.interactive ? handleItemToggle : undefined}
                size="small"
              />
            ))}
          </div>

          {/* Statistics */}
          {config.showValues && data && (
            <div className="mt-3 pt-3 border-t border-gray-600">
              <div className="text-xs text-gray-400">
                Total: {Object.values(data.decisions).reduce((sum, count) => sum + count, 0)} decisions
              </div>
              {selectedItems.size > 0 && (
                <div className="text-xs text-gray-400">
                  Selected: {selectedItems.size} items
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

/**
 * Compact legend component for inline display
 */
export interface CompactLegendProps {
  items: LegendItem[];
  orientation?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  maxItems?: number;
  className?: string;
}

export const CompactLegend: React.FC<CompactLegendProps> = ({
  items,
  orientation = 'horizontal',
  showLabels = true,
  maxItems = 5,
  className = '',
}) => {
  const limitedItems = items.slice(0, maxItems);

  return (
    <div className={`flex ${orientation === 'horizontal' ? 'flex-row space-x-3' : 'flex-col space-y-1'} ${className}`}>
      {limitedItems.map(item => (
        <div key={item.id} className="flex items-center space-x-1">
          <div
            className="w-3 h-3 rounded border border-gray-600"
            style={{ backgroundColor: item.color }}
          />
          {showLabels && (
            <span className="text-xs text-gray-300">{item.label}</span>
          )}
        </div>
      ))}
      {items.length > maxItems && (
        <span className="text-xs text-gray-500">+{items.length - maxItems} more</span>
      )}
    </div>
  );
};

/**
 * Floating legend tooltip component
 */
export interface FloatingLegendProps {
  items: LegendItem[];
  position: { x: number; y: number };
  visible: boolean;
  onClose?: () => void;
}

export const FloatingLegend: React.FC<FloatingLegendProps> = ({
  items,
  position,
  visible,
  onClose,
}) => {
  if (!visible) return null;

  return (
    <div
      className="absolute bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-white">Legend</h4>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xs"
          >
            ×
          </button>
        )}
      </div>
      
      <div className="flex flex-col space-y-1">
        {items.map(item => (
          <div key={item.id} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-300">{item.label}</span>
            <span className="text-xs text-gray-500">({item.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Legend statistics component
 */
export interface LegendStatsProps {
  data: {
    decisions: Record<QuestDecisionType, number>;
    priorities: Record<QuestPriority, number>;
    categories: Record<QuestCategory, number>;
    outcomes?: Record<string, number>;
  };
  className?: string;
}

export const LegendStats: React.FC<LegendStatsProps> = ({ data, className = '' }) => {
  const totalDecisions = Object.values(data.decisions).reduce((sum, count) => sum + count, 0);
  const totalCategories = Object.keys(data.categories).length;
  const avgDecisionsPerCategory = totalCategories > 0 ? totalDecisions / totalCategories : 0;

  const dominantDecision = Object.entries(data.decisions).reduce((a, b) => 
    data.decisions[a[0] as QuestDecisionType] > data.decisions[b[0] as QuestDecisionType] ? a : b
  )[0];

  const dominantCategory = Object.entries(data.categories).reduce((a, b) => 
    data.categories[a[0] as QuestCategory] > data.categories[b[0] as QuestCategory] ? a : b
  )[0];

  return (
    <div className={`bg-gray-800 border border-gray-600 rounded p-3 ${className}`}>
      <h4 className="text-sm font-semibold text-white mb-2">Statistics</h4>
      
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Total Decisions:</span>
          <span className="text-gray-300">{totalDecisions}</span>
        </div>
        
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Categories:</span>
          <span className="text-gray-300">{totalCategories}</span>
        </div>
        
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Avg per Category:</span>
          <span className="text-gray-300">{avgDecisionsPerCategory.toFixed(1)}</span>
        </div>
        
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Dominant Decision:</span>
          <span className="text-gray-300 capitalize">{dominantDecision}</span>
        </div>
        
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Dominant Category:</span>
          <span className="text-gray-300 capitalize">{dominantCategory}</span>
        </div>
      </div>
    </div>
  );
};
