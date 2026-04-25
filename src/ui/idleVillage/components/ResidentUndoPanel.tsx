/**
 * Resident Undo Panel Component - NP-020
 * 
 * React component for displaying undo/redo timeline with visual diff summary.
 * Provides timeline visualization, action details, and quick controls.
 * Follows Gilded Observatory theme with compact, analytics-focused design.
 * 
 * @since 2026-01-19
 * @author Cascade
 */

import React, { useCallback, useMemo } from 'react';
import type { UndoAction, UndoStackState } from '../hooks/useResidentUndo';
import type {
  ResidentUndoConfig,
  UndoBadgeType,
} from '../config/residentUndoConfig';
import {
  UNDO_BADGE_TYPES,
  formatShortcut,
} from '../config/residentUndoConfig';

/**
 * Component props
 */
export interface ResidentUndoPanelProps {
  /** Current undo stack state */
  stackState: UndoStackState;
  /** Current configuration */
  config: ResidentUndoConfig;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** On undo callback */
  onUndo: () => void;
  /** On redo callback */
  onRedo: () => void;
  /** On clear history callback */
  onClearHistory: () => void;
  /** On close panel callback */
  onClose: () => void;
  /** On export history callback */
  onExport: () => void;
  /** On import history callback */
  onImport: (data: string) => boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Action badge component
 */
function ActionBadge({ 
  type, 
  config 
}: { 
  type: UndoBadgeType; 
  config: ResidentUndoConfig;
}) {
  const badgeConfig = config.badges.colors[type];
  const icon = config.badges.icons[type];
  
  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: badgeConfig,
        color: type === UNDO_BADGE_TYPES.WARNING ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)',
        fontSize: `${config.badges.size * 0.75}px`,
        borderRadius: `${config.badges.borderRadius}px`,
      }}
    >
      {config.badges.showIcons && icon && (
        <span className="text-xs">{icon}</span>
      )}
      <span className="uppercase tracking-wide">{type}</span>
    </div>
  );
}

/**
 * Timeline item component
 */
function TimelineItem({ 
  action, 
  config, 
  onSelect 
}: { 
  action: UndoAction; 
  config: ResidentUndoConfig;
  onSelect: (action: UndoAction) => void;
}) {
  const time = new Date(action.timestamp).toLocaleTimeString();
  const isSelected = false; // Could be managed by parent state
  
  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:border-opacity-80 ${
        isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 bg-gray-800'
      }`}
      onClick={() => onSelect(action)}
      style={{
        height: `${config.timeline.itemHeight}px`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ActionBadge type={action.badgeType} config={config} />
          <span className="text-sm font-medium text-white truncate">
            {action.description}
          </span>
        </div>
        {config.timeline.showTimestamps && (
          <span className="text-xs text-gray-400">
            {time}
          </span>
        )}
      </div>
      
      <div className="text-xs text-gray-300 space-y-1">
        <div>Resident: {action.residentId}</div>
        {action.activityId && (
          <div>Activity: {action.activityId}</div>
        )}
        <div className="flex items-center gap-2">
          <span>Success: {action.success ? '✓' : '✗'}</span>
          {action.hasWarnings && (
            <span className="text-yellow-400">⚠ Warnings</span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Keyboard shortcuts help component
 */
function KeyboardShortcuts({ config }: { config: ResidentUndoConfig }) {
  if (!config.shortcuts.showHints) {
    return null;
  }

  const shortcuts = [
    { key: 'ctrl+z', label: 'Undo' },
    { key: 'ctrl+y', label: 'Redo' },
    { key: 'ctrl+shift+z', label: 'Batch Undo' },
    { key: 'ctrl+shift+delete', label: 'Clear History' },
    { key: 'ctrl+shift+u', label: 'Toggle Panel' },
  ];

  return (
    <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
      <h4 className="text-sm font-semibold text-white mb-2">Keyboard Shortcuts</h4>
      <div className="grid grid-cols-1 gap-2">
        {shortcuts.map(({ key, label }) => (
          <div key={key} className="flex justify-between items-center">
            <span className="text-xs text-gray-300">{label}</span>
            <kbd className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded">
              {formatShortcut(key)}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Main Resident Undo Panel component
 */
export function ResidentUndoPanel({
  stackState,
  config,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearHistory,
  onClose,
  onExport,
  onImport,
  className = '',
}: ResidentUndoPanelProps) {
  // Combine undo and redo stacks for timeline display
  const timelineActions = useMemo(() => {
    const allActions = [
      ...stackState.undoStack.map(action => ({ ...action, isUndo: true })),
      ...stackState.redoStack.slice().reverse().map(action => ({ ...action, isUndo: false })),
    ];
    
    return allActions.slice(-config.timeline.maxItems);
  }, [stackState.undoStack, stackState.redoStack, config.timeline.maxItems]);

  // Handle action selection
  const handleActionSelect = useCallback((action: UndoAction) => {
    // Could implement action details view or diff visualization
    console.log('Selected action:', action);
  }, []);

  // Handle file import
  const handleFileImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          onImport(content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [onImport]);

  // Panel style
  const panelStyle = useMemo(() => ({
    width: `${config.panel.panelWidth}px`,
    height: `${config.panel.panelHeight}px`,
  }), [config.panel.panelWidth, config.panel.panelHeight]);

  return (
    <div
      className={`bg-gray-900 border border-gray-700 rounded-lg shadow-2xl ${className}`}
      style={panelStyle}
      data-testid="resident-undo-panel"
    >
      {/* Header */}
      {config.panel.showHeader && (
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Undo History</h2>
              <p className="text-sm text-gray-400">
                {stackState.currentSize} actions in history
              </p>
            </div>
            {config.panel.showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 rounded hover:bg-gray-800 transition-colors"
                title="Close panel"
              >
                <span className="text-gray-400">✕</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex gap-2 mb-4">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              canUndo 
                ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
            title={formatShortcut('ctrl+z')}
          >
            Undo
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              canRedo 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
            title={formatShortcut('ctrl+y')}
          >
            Redo
          </button>
          <button
            onClick={onClearHistory}
            disabled={stackState.currentSize === 0}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              stackState.currentSize > 0
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
            title={formatShortcut('ctrl+shift+delete')}
          >
            Clear
          </button>
        </div>

        {/* Import/Export controls */}
        <div className="flex gap-2">
          <button
            onClick={onExport}
            className="px-3 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          >
            Export
          </button>
          <button
            onClick={handleFileImport}
            className="px-3 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          >
            Import
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts config={config} />

      {/* Timeline */}
      <div className="p-4 overflow-y-auto" style={{ maxHeight: '400px' }}>
        <h3 className="text-sm font-semibold text-white mb-3">Timeline</h3>
        
        {timelineActions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">📝</div>
            <p className="text-sm">No actions in history</p>
            <p className="text-xs mt-1">Actions will appear here as you make changes</p>
          </div>
        ) : (
          <div className="space-y-2">
            {timelineActions.map((action) => (
              <TimelineItem
                key={action.id}
                action={action}
                config={config}
                onSelect={handleActionSelect}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {config.panel.showFooter && (
        <div className="p-4 border-t border-gray-700">
          <div className="flex justify-between items-center text-xs text-gray-400">
            <div>
              <span>Undo: {stackState.undoStack.length}</span>
              <span className="mx-2">|</span>
              <span>Redo: {stackState.redoStack.length}</span>
            </div>
            <div>
              <span>Max: {config.timeline.maxItems}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResidentUndoPanel;
