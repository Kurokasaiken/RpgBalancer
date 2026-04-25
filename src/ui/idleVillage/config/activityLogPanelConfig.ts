/**
 * Minimal Activity Log Panel Configuration
 *
 * Config-first schema for Minimal Gameplay Activity Log Panel styling and behavior.
 */

import { z } from 'zod';

/**
 * Activity entry severity levels.
 */
export const ActivitySeveritySchema = z.enum(['info', 'warning', 'error', 'success']);
export type ActivitySeverity = z.infer<typeof ActivitySeveritySchema>;

/**
 * Minimal Activity Entry interface.
 */
export const MinimalActivityEntrySchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  severity: z.enum(['info', 'success', 'warning', 'error']),
  message: z.string(),
  residentId: z.string().optional(),
  activityId: z.string().optional(),
});

export type MinimalActivityEntry = z.infer<typeof MinimalActivityEntrySchema>;

/**
 * Badge token configuration for activity entries.
 */
const BadgeTokensSchema = z.object({
  /** Border radius for badges. */
  borderRadius: z.string(),
  /** Padding inside badges. */
  padding: z.string(),
  /** Font size for badge text. */
  fontSize: z.string(),
  /** Font weight for badge text. */
  fontWeight: z.number(),
});

/**
 * Severity palette for different activity types.
 */
const SeverityPaletteSchema = z.object({
  info: z.object({
    backgroundColor: z.string(),
    color: z.string(),
    icon: z.string(),
  }),
  warning: z.object({
    backgroundColor: z.string(),
    color: z.string(),
    icon: z.string(),
  }),
  error: z.object({
    backgroundColor: z.string(),
    color: z.string(),
    icon: z.string(),
  }),
  success: z.object({
    backgroundColor: z.string(),
    color: z.string(),
    icon: z.string(),
  }),
});

/**
 * ARIA labels for accessibility.
 */
const AriaLabelsSchema = z.object({
  /** Label for the activity log panel. */
  panelLabel: z.string(),
  /** Label for individual activity entries. */
  entryLabel: z.string(),
  /** Description for empty state. */
  emptyStateDescription: z.string(),
  /** Label for loading state. */
  loadingLabel: z.string(),
});

/**
 * Empty state configuration.
 */
const EmptyStateSchema = z.object({
  /** Main heading for empty state. */
  title: z.string(),
  /** Descriptive text for empty state. */
  description: z.string(),
  /** Icon or emoji for empty state. */
  icon: z.string(),
});

/**
 * Complete Activity Log Panel configuration schema.
 */
export const ActivityLogPanelConfigSchema = z.object({
  /** Maximum number of entries to display. */
  maxEntries: z.number().min(1).max(50),
  /** Badge styling tokens. */
  badgeTokens: BadgeTokensSchema,
  /** Color and icon palette for different severities. */
  severityPalette: SeverityPaletteSchema,
  /** Accessibility labels. */
  ariaLabels: AriaLabelsSchema,
  /** Empty state content. */
  emptyState: EmptyStateSchema,
});

/**
 * Type definition for Activity Log Panel config.
 */
export type ActivityLogPanelConfig = z.infer<typeof ActivityLogPanelConfigSchema>;

/**
 * Default Activity Log Panel configuration.
 */
export const defaultActivityLogPanelConfig: ActivityLogPanelConfig = {
  maxEntries: 12,
  badgeTokens: {
    borderRadius: '0.375rem',
    padding: '0.125rem 0.5rem',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  severityPalette: {
    info: {
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      color: '#3b82f6',
      icon: 'ℹ️',
    },
    warning: {
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      color: '#f59e0b',
      icon: '⚠️',
    },
    error: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      color: '#ef4444',
      icon: '❌',
    },
    success: {
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      color: '#22c55e',
      icon: '✅',
    },
  },
  ariaLabels: {
    panelLabel: 'Activity Log',
    entryLabel: 'Activity entry',
    emptyStateDescription: 'No recent activity to display',
    loadingLabel: 'Loading activity entries',
  },
  emptyState: {
    title: 'No Recent Activity',
    description: 'Activity entries will appear here as events occur in the game.',
    icon: '📝',
  },
};
