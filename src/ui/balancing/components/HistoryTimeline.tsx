/**
 * History Timeline Component
 * Displays undo/redo history with timestamps and diff summaries.
 * Config-first design with Gilded Observatory theme and accessibility support.
 */

import React from 'react';
import type { ConfigSnapshot } from '@/balancing/config/types';
import styles from './HistoryTimeline.module.css';

/**
 * Props for the HistoryTimeline component.
 */
export interface HistoryTimelineProps {
  /** Array of history snapshots to display */
  history: ConfigSnapshot[];
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Callback for undo action */
  onUndo: () => void;
  /** Callback for redo action */
  onRedo: () => void;
  /** Callback for clicking on a history item */
  onSelectSnapshot?: (snapshot: ConfigSnapshot, index: number) => void;
  /** Maximum number of items to display (default: 10) */
  maxItems?: number;
  /** Whether to show timestamps (default: true) */
  showTimestamps?: boolean;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Formats a timestamp for display.
 * 
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time string
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - timestamp;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * History Timeline Component
 * 
 * Displays a chronological list of configuration snapshots with:
 * - Timestamps with relative time display
 * - Diff summaries showing what changed
 * - Undo/redo controls
 * - Click-to-restore functionality
 * - Accessibility support with ARIA live regions
 * 
 * Features:
 * - Config-first design with Style Laboratory tokens
 * - Gilded Observatory retro theme
 * - Keyboard navigation support
 * - Screen reader friendly
 * - Compact display for limited space
 */
export const HistoryTimeline: React.FC<HistoryTimelineProps> = ({
  history,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSelectSnapshot,
  maxItems = 10,
  showTimestamps = true,
  testId = 'history-timeline',
}) => {
  const visibleHistory = history.slice(0, maxItems);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'z' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      if (event.shiftKey && canRedo) {
        onRedo();
      } else if (canUndo) {
        onUndo();
      }
    }
  };

  return (
    <div 
      className={styles.historyTimeline}
      data-testid={testId}
      onKeyDown={handleKeyDown}
    >
      {/* Header with controls */}
      <div className={styles.header}>
        <h3 className={styles.title}>History</h3>
        <div className={styles.controls} role="group" aria-label="Undo/Redo controls">
          <button
            className={`${styles.controlButton} ${!canUndo ? styles.disabled : ''}`}
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo last change"
            title={`Undo ${canUndo ? '' : '(not available)'}`}
          >
            ↶ Undo
          </button>
          <button
            className={`${styles.controlButton} ${!canRedo ? styles.disabled : ''}`}
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo change"
            title={`Redo ${canRedo ? '' : '(not available)'}`}
          >
            ↷ Redo
          </button>
        </div>
      </div>

      {/* History list */}
      <div className={styles.timeline} role="list" aria-label="Configuration history">
        {visibleHistory.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No history available</p>
            <p className={styles.emptyHint}>
              Make changes to see them here
            </p>
          </div>
        ) : (
          visibleHistory.map((snapshot, index) => (
            <div
              key={snapshot.timestamp}
              className={`${styles.historyItem} ${index === 0 ? styles.current : ''}`}
              role="listitem"
              onClick={() => onSelectSnapshot?.(snapshot, index)}
              aria-label={`History item: ${snapshot.description}`}
              aria-current={index === 0 ? 'true' : undefined}
            >
              <div className={styles.itemHeader}>
                {showTimestamps && (
                  <time 
                    className={styles.timestamp}
                    dateTime={new Date(snapshot.timestamp).toISOString()}
                  >
                    {formatTimestamp(snapshot.timestamp)}
                  </time>
                )}
                {index === 0 && (
                  <span className={styles.currentBadge} aria-label="Current state">
                    Current
                  </span>
                )}
              </div>
              
              <div className={styles.description}>
                {snapshot.description}
              </div>

              {/* Diff summary if available */}
              {'diffSummary' in snapshot && snapshot.diffSummary && (
                <div className={styles.diffSummary}>
                  {snapshot.diffSummary}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer with keyboard shortcuts */}
      <div className={styles.footer}>
        <div className={styles.shortcuts} aria-label="Keyboard shortcuts">
          <span className={styles.shortcut}>
            <kbd>Ctrl</kbd>+<kbd>Z</kbd> Undo
          </span>
          <span className={styles.shortcut}>
            <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd> Redo
          </span>
        </div>
        
        {history.length > maxItems && (
          <div className={styles.truncatedNotice}>
            Showing {maxItems} of {history.length} items
          </div>
        )}
      </div>

      {/* Status announcement for screen readers */}
      <div 
        className={styles.announcer} 
        aria-live="polite" 
        aria-atomic="true"
      >
        {canUndo && <span>Undo available</span>}
        {canRedo && <span>Redo available</span>}
      </div>
    </div>
  );
};

export default HistoryTimeline;
