/**
 * Assignment Timeline Component - NP-020
 * 
 * Visual timeline component for assignment undo/redo history.
 * Provides interactive timeline navigation, visual indicators,
 * and detailed change information display.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import {
  type AssignmentUndoConfig,
  type TimelineEntry,
  type AssignmentDiffSummary,
  DEFAULT_ASSIGNMENT_UNDO_CONFIG,
  formatTimestamp,
} from '../config/assignmentUndoConfig';

const diagnostics = createSandboxDiagnostics('AssignmentTimeline', 'timeline');

/**
 * Props for AssignmentTimeline component
 */
export interface AssignmentTimelineProps {
  /** Timeline entries to display */
  entries: TimelineEntry[];
  /** Current position in timeline */
  currentPosition: number;
  /** Configuration for display options */
  config?: Partial<AssignmentUndoConfig>;
  /** Callback for entry selection */
  onEntrySelect?: (entryId: string) => void;
  /** Callback for position change */
  onPositionChange?: (position: number) => void;
  /** Whether timeline is visible */
  visible?: boolean;
  /** Whether to show timestamps */
  showTimestamps?: boolean;
  /** Whether to show descriptions */
  showDescriptions?: boolean;
  /** Maximum number of entries to display */
  maxEntries?: number;
  /** Whether to enable animations */
  enableAnimations?: boolean;
  /** Custom CSS class names */
  className?: string;
}

/**
 * Individual timeline entry component
 */
interface TimelineEntryComponentProps {
  entry: TimelineEntry;
  isCurrent: boolean;
  isSelected: boolean;
  config: AssignmentUndoConfig;
  showTimestamp?: boolean;
  showDescription?: boolean;
  onSelect?: () => void;
  animationDuration?: number;
}

const TimelineEntryComponent: React.FC<TimelineEntryComponentProps> = ({
  entry,
  isCurrent,
  isSelected,
  config,
  showTimestamp = true,
  showDescription = true,
  onSelect,
  animationDuration = 300,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getEntrySize = (size: 'small' | 'medium' | 'large'): string => {
    switch (size) {
      case 'small': return 'w-3 h-3';
      case 'medium': return 'w-4 h-4';
      case 'large': return 'w-5 h-5';
      default: return 'w-4 h-4';
    }
  };

  const getEntryOpacity = (opacity: number, navigable: boolean): number => {
    if (!navigable) return 0.3;
    return isCurrent ? 1 : opacity;
  };

  return (
    <div
      className={`relative flex flex-col items-center cursor-pointer transition-all duration-300 ${
        isSelected ? 'scale-110' : ''
      }`}
      style={{
        transitionDuration: `${animationDuration}ms`,
        opacity: getEntryOpacity(entry.visual.opacity, entry.navigable),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      {/* Timeline dot */}
      <div
        className={`${getEntrySize(entry.visual.size)} rounded-full border-2 transition-all duration-300 ${
          isCurrent ? 'ring-2 ring-offset-2' : ''
        }`}
        style={{
          backgroundColor: entry.visual.color,
          borderColor: isCurrent ? config.ui.visual.colors.accent : entry.visual.color,
          ringColor: config.ui.visual.colors.accent,
          ringOffsetColor: config.ui.visual.colors.background,
        }}
      >
        {/* Icon overlay */}
        <div className="flex items-center justify-center w-full h-full text-xs">
          {entry.visual.icon}
        </div>
      </div>

      {/* Current indicator */}
      {isCurrent && (
        <div
          className="absolute -bottom-1 w-2 h-2 rounded-full"
          style={{ backgroundColor: config.ui.visual.colors.accent }}
        />
      )}

      {/* Hover tooltip */}
      {(isHovered || isSelected) && (
        <div className="absolute bottom-full mb-2 p-2 rounded shadow-lg z-10 min-w-max max-w-xs"
          style={{
            backgroundColor: config.ui.visual.colors.background,
            border: `1px solid ${config.ui.visual.colors.border}`,
            color: config.ui.visual.colors.foreground,
          }}
        >
          <div className="text-sm font-semibold mb-1">
            {entry.label}
          </div>
          
          {showTimestamp && (
            <div className="text-xs opacity-75 mb-1">
              {formatTimestamp(entry.timestamp)}
            </div>
          )}
          
          {showDescription && (
            <div className="text-xs opacity-75">
              {entry.type}
            </div>
          )}
          
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent"
              style={{ borderTopColor: config.ui.visual.colors.border }}
            />
          </div>
        </div>
      )}

      {/* Entry label */}
      {showDescription && (
        <div className="mt-2 text-xs text-center max-w-20 truncate"
          style={{ color: config.ui.visual.colors.foreground }}
        >
          {entry.label}
        </div>
      )}
    </div>
  );
};

/**
 * Timeline navigation controls
 */
interface TimelineControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClearHistory: () => void;
  config: AssignmentUndoConfig;
};

const TimelineControls: React.FC<TimelineControlsProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearHistory,
  config,
}) => {
  return (
    <div className="flex items-center space-x-2 p-2 rounded"
      style={{ backgroundColor: config.ui.visual.colors.background }}
    >
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`p-2 rounded transition-colors ${
          canUndo 
            ? 'hover:bg-gray-700 cursor-pointer' 
            : 'opacity-50 cursor-not-allowed'
        }`}
        style={{
          color: canUndo ? config.ui.visual.colors.foreground : config.ui.visual.colors.secondary,
        }}
        title="Undo (Ctrl+Z)"
      >
        <span className="text-lg">↶</span>
      </button>

      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`p-2 rounded transition-colors ${
          canRedo 
            ? 'hover:bg-gray-700 cursor-pointer' 
            : 'opacity-50 cursor-not-allowed'
        }`}
        style={{
          color: canRedo ? config.ui.visual.colors.foreground : config.ui.visual.colors.secondary,
        }}
        title="Redo (Ctrl+Y)"
      >
        <span className="text-lg">↷</span>
      </button>

      <div className="w-px h-6"
        style={{ backgroundColor: config.ui.visual.colors.border }}
      />

      <button
        onClick={onClearHistory}
        className="p-2 rounded hover:bg-gray-700 transition-colors cursor-pointer"
        style={{ color: config.ui.visual.colors.danger }}
        title="Clear History"
      >
        <span className="text-lg">🗑️</span>
      </button>
    </div>
  );
};

/**
 * Main AssignmentTimeline component
 */
export const AssignmentTimeline: React.FC<AssignmentTimelineProps> = ({
  entries,
  currentPosition,
  config: userConfig,
  onEntrySelect,
  onPositionChange,
  visible = true,
  showTimestamps = true,
  showDescriptions = true,
  maxEntries = 50,
  enableAnimations = true,
  className = '',
}) => {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  const config = useMemo(() => ({
    ...DEFAULT_ASSIGNMENT_UNDO_CONFIG,
    ...userConfig,
  }), [userConfig]);

  const limitedEntries = useMemo(() => {
    return entries.slice(0, maxEntries);
  }, [entries, maxEntries]);

  const currentEntryIndex = useMemo(() => {
    return Math.max(0, Math.min(currentPosition, limitedEntries.length - 1));
  }, [currentPosition, limitedEntries.length]);

  const canUndo = useMemo(() => {
    return currentPosition > 0;
  }, [currentPosition]);

  const canRedo = useMemo(() => {
    return currentPosition < limitedEntries.length - 1;
  }, [currentPosition, limitedEntries.length]);

  const handleEntrySelect = useCallback((entryId: string, index: number) => {
    setSelectedEntryId(entryId);
    onEntrySelect?.(entryId);
    onPositionChange?.(index);
  }, [onEntrySelect, onPositionChange]);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      const newPosition = currentEntryIndex - 1;
      onPositionChange?.(newPosition);
    }
  }, [canUndo, currentEntryIndex, onPositionChange]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      const newPosition = currentEntryIndex + 1;
      onPositionChange?.(newPosition);
    }
  }, [canRedo, currentEntryIndex, onPositionChange]);

  const handleClearHistory = useCallback(() => {
    // This would typically trigger a confirmation dialog
    if (window.confirm('Are you sure you want to clear all assignment history?')) {
      onPositionChange?.(-1);
      setSelectedEntryId(null);
    }
  }, [onPositionChange]);

  const handleTimelineClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !onPositionChange) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    if (config.ui.timeline.orientation === 'horizontal') {
      const position = clickX / rect.width;
      const targetIndex = Math.round(position * (limitedEntries.length - 1));
      onPositionChange(targetIndex);
    } else {
      const position = clickY / rect.height;
      const targetIndex = Math.round(position * (limitedEntries.length - 1));
      onPositionChange(targetIndex);
    }
  }, [config.ui.timeline.orientation, limitedEntries.length, onPositionChange]);

  const renderHorizontalTimeline = () => {
    return (
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2"
          style={{ backgroundColor: config.ui.visual.colors.border }}
        />
        
        {/* Progress indicator */}
        <div 
          className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 transition-all duration-300"
          style={{
            backgroundColor: config.ui.visual.colors.primary,
            width: `${(currentEntryIndex / (limitedEntries.length - 1 || 1)) * 100}%`,
            transitionDuration: enableAnimations ? '300ms' : '0ms',
          }}
        />

        {/* Timeline entries */}
        <div className="relative flex justify-between items-center px-4 py-8">
          {limitedEntries.map((entry, index) => (
            <TimelineEntryComponent
              key={entry.id}
              entry={entry}
              isCurrent={index === currentEntryIndex}
              isSelected={selectedEntryId === entry.id}
              config={config}
              showTimestamp={showTimestamps}
              showDescription={showDescriptions}
              onSelect={() => handleEntrySelect(entry.id, index)}
              animationDuration={enableAnimations ? config.ui.timeline.animations.duration : 0}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderVerticalTimeline = () => {
    return (
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2"
          style={{ backgroundColor: config.ui.visual.colors.border }}
        />
        
        {/* Progress indicator */}
        <div 
          className="absolute left-1/2 top-0 w-0.5 -translate-x-1/2 transition-all duration-300"
          style={{
            backgroundColor: config.ui.visual.colors.primary,
            height: `${(currentEntryIndex / (limitedEntries.length - 1 || 1)) * 100}%`,
            transitionDuration: enableAnimations ? '300ms' : '0ms',
          }}
        />

        {/* Timeline entries */}
        <div className="relative flex flex-col justify-between items-center py-4 px-8">
          {limitedEntries.map((entry, index) => (
            <TimelineEntryComponent
              key={entry.id}
              entry={entry}
              isCurrent={index === currentEntryIndex}
              isSelected={selectedEntryId === entry.id}
              config={config}
              showTimestamp={showTimestamps}
              showDescription={showDescriptions}
              onSelect={() => handleEntrySelect(entry.id, index)}
              animationDuration={enableAnimations ? config.ui.timeline.animations.duration : 0}
            />
          ))}
        </div>
      </div>
    );
  };

  if (!visible || limitedEntries.length === 0) {
    return null;
  }

  return (
    <div 
      className={`bg-gray-800 border border-gray-600 rounded-lg overflow-hidden ${className}`}
      style={{
        fontFamily: config.ui.visual.typography.fontFamily,
        fontSize: config.ui.visual.typography.fontSize.medium,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-600">
        <h3 className="text-lg font-semibold text-white">
          Assignment Timeline
        </h3>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400">
            {currentEntryIndex + 1} / {limitedEntries.length}
          </div>
          
          <TimelineControls
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClearHistory={handleClearHistory}
            config={config}
          />
        </div>
      </div>

      {/* Timeline */}
      <div 
        ref={timelineRef}
        className="relative p-4 cursor-pointer"
        onClick={handleTimelineClick}
        style={{
          minHeight: config.ui.timeline.orientation === 'horizontal' ? '120px' : '300px',
        }}
      >
        {config.ui.timeline.orientation === 'horizontal' 
          ? renderHorizontalTimeline() 
          : renderVerticalTimeline()
        }
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-600">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div>
            {limitedEntries.length} changes
          </div>
          
          {selectedEntryId && (
            <div>
              Selected: {limitedEntries.find(e => e.id === selectedEntryId)?.label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Compact timeline component for inline display
 */
export interface CompactTimelineProps {
  entries: TimelineEntry[];
  currentPosition: number;
  config?: Partial<AssignmentUndoConfig>;
  onPositionChange?: (position: number) => void;
  className?: string;
}

export const CompactTimeline: React.FC<CompactTimelineProps> = ({
  entries,
  currentPosition,
  config: userConfig,
  onPositionChange,
  className = '',
}) => {
  const config = useMemo(() => ({
    ...DEFAULT_ASSIGNMENT_UNDO_CONFIG,
    ...userConfig,
  }), [userConfig]);

  const limitedEntries = useMemo(() => {
    return entries.slice(0, 10); // Show max 10 entries in compact mode
  }, [entries]);

  const currentEntryIndex = useMemo(() => {
    return Math.max(0, Math.min(currentPosition, limitedEntries.length - 1));
  }, [currentPosition, limitedEntries.length]);

  const handleEntryClick = useCallback((index: number) => {
    onPositionChange?.(index);
  }, [onPositionChange]);

  if (limitedEntries.length === 0) {
    return null;
  }

  return (
    <div 
      className={`flex items-center space-x-2 p-2 rounded ${className}`}
      style={{
        backgroundColor: config.ui.visual.colors.background,
        border: `1px solid ${config.ui.visual.colors.border}`,
      }}
    >
      <div className="flex items-center space-x-1">
        {limitedEntries.map((entry, index) => (
          <button
            key={entry.id}
            onClick={() => handleEntryClick(index)}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index === currentEntryIndex ? 'ring-1 ring-offset-1' : ''
            }`}
            style={{
              backgroundColor: entry.visual.color,
              opacity: index <= currentEntryIndex ? 1 : 0.3,
              ringColor: config.ui.visual.colors.accent,
              ringOffsetColor: config.ui.visual.colors.background,
            }}
            title={entry.label}
          />
        ))}
      </div>
      
      <div className="text-xs text-gray-400">
        {currentEntryIndex + 1} / {limitedEntries.length}
      </div>
    </div>
  );
};
