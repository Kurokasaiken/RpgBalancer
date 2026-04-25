import React, { useEffect, useMemo } from 'react';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { resolveHudToken } from '@/ui/idleVillage/tokens/minimalHudTokens';
import {
  ActivityLogPanelConfig,
  MinimalActivityEntry,
  defaultActivityLogPanelConfig,
} from './activityLogPanelConfig';

/**
 * Props for the ActivityLogPanel component.
 */
export interface ActivityLogPanelProps {
  /** Array of activity entries to display. */
  entries: MinimalActivityEntry[];
  /** Whether the panel is in a loading state. */
  isLoading?: boolean;
  /** Callback when an entry is selected/clicked. */
  onSelect?: (entry: MinimalActivityEntry) => void;
  /** Custom configuration for the panel. */
  config?: Partial<ActivityLogPanelConfig>;
}

/**
 * Activity Log Panel Component
 *
 * Displays the last N activity entries from Minimal Gameplay with configurable styling,
 * accessibility features, and telemetry tracking.
 */
const ActivityLogPanel: React.FC<ActivityLogPanelProps> = ({
  entries,
  isLoading = false,
  onSelect,
  config: customConfig,
}) => {
  // Merge custom config with defaults
  const config = useMemo(
    () => ({ ...defaultActivityLogPanelConfig, ...customConfig }),
    [customConfig]
  );

  // Limit entries to maxEntries
  const displayEntries = useMemo(
    () => entries.slice(0, config.maxEntries),
    [entries, config.maxEntries]
  );

  // Telemetry: panel rendered
  useEffect(() => {
    trackTelemetryEvent('minimal_activity_log_rendered', {
      entryCount: displayEntries.length,
      maxEntries: config.maxEntries,
      isLoading,
      configVersion: '1.0',
    });
  }, [displayEntries.length, config.maxEntries, isLoading]);

  // Handle entry selection
  const handleEntryClick = (entry: MinimalActivityEntry) => {
    onSelect?.(entry);

    trackTelemetryEvent('minimal_activity_log_entry_selected', {
      entryId: entry.id,
      severity: entry.severity,
      type: entry.type,
    });
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div
      role="region"
      aria-label={config.ariaLabels.panelLabel}
      className="activity-log-panel"
      style={{
        background: resolveHudToken('gradients.primary'),
        borderRadius: '0.5rem',
        padding: resolveHudToken('spacing.md'),
        maxHeight: '400px',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: resolveHudToken('spacing.sm'),
          fontSize: resolveHudToken('typography.baseFontSize'),
          fontWeight: resolveHudToken('typography.fontWeightBold'),
          color: 'white',
        }}
      >
        {config.ariaLabels.panelLabel}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div
          role="status"
          aria-label={config.ariaLabels.loadingLabel}
          style={{
            textAlign: 'center',
            padding: resolveHudToken('spacing.lg'),
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: resolveHudToken('typography.baseFontSize'),
          }}
        >
          Loading activity...
        </div>
      )}

      {/* Activity Entries */}
      {!isLoading && displayEntries.length > 0 && (
        <div aria-live="polite" aria-atomic="false">
          {displayEntries.map((entry, index) => (
            <div
              key={entry.id}
              role="button"
              tabIndex={onSelect ? 0 : -1}
              aria-label={`${config.ariaLabels.entryLabel}: ${entry.message}`}
              onClick={() => handleEntryClick(entry)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && onSelect) {
                  e.preventDefault();
                  handleEntryClick(entry);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: resolveHudToken('spacing.sm'),
                padding: resolveHudToken('spacing.sm'),
                marginBottom: index < displayEntries.length - 1 ? resolveHudToken('spacing.xs') : 0,
                borderRadius: '0.375rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                cursor: onSelect ? 'pointer' : 'default',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (onSelect) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (onSelect) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }
              }}
            >
              {/* Severity Icon */}
              <div
                style={{
                  fontSize: '1rem',
                  lineHeight: 1,
                  marginTop: '0.125rem',
                }}
                aria-hidden="true"
              >
                {config.severityPalette[entry.severity].icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: resolveHudToken('typography.baseFontSize'),
                    color: 'white',
                    lineHeight: resolveHudToken('typography.lineHeight'),
                    marginBottom: '0.25rem',
                  }}
                >
                  {entry.message}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: resolveHudToken('spacing.sm'),
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                  }}
                >
                  {/* Timestamp */}
                  <span>{formatTimestamp(entry.timestamp)}</span>

                  {/* Severity Badge */}
                  <span
                    style={{
                      ...config.badgeTokens,
                      backgroundColor: config.severityPalette[entry.severity].backgroundColor,
                      color: config.severityPalette[entry.severity].color,
                    }}
                  >
                    {entry.severity}
                  </span>

                  {/* Type Badge */}
                  <span
                    style={{
                      ...config.badgeTokens,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.8)',
                    }}
                  >
                    {entry.type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && displayEntries.length === 0 && (
        <div
          role="status"
          aria-label={config.ariaLabels.emptyStateDescription}
          style={{
            textAlign: 'center',
            padding: resolveHudToken('spacing.xl'),
            color: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          <div
            style={{
              fontSize: '2rem',
              marginBottom: resolveHudToken('spacing.sm'),
            }}
            aria-hidden="true"
          >
            {config.emptyState.icon}
          </div>
          <div
            style={{
              fontSize: resolveHudToken('typography.baseFontSize'),
              fontWeight: resolveHudToken('typography.fontWeightBold'),
              marginBottom: resolveHudToken('spacing.xs'),
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            {config.emptyState.title}
          </div>
          <div
            style={{
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.5)',
              maxWidth: '300px',
              margin: '0 auto',
            }}
          >
            {config.emptyState.description}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogPanel;
