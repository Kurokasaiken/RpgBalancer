/**
 * Shared localization types for the i18n layer.
 */

export type WorkerRiskLevelKey = 'low' | 'medium' | 'high' | 'critical';
export type WorkerRecommendationKey = 'lowHp' | 'highFatigue' | 'injured' | 'critical';

/**
 * Label entries exposed to the UI when rendering worker tooltips.
 */
export interface WorkerTooltipLabels {
  hp?: string;
  fatigue?: string;
  performance?: string;
  specialties?: string;
  bio?: string;
  recommendations?: string;
  risk?: string;
}

/**
 * Copy dictionary for Idle Village worker tooltips.
 */
export interface WorkerTooltipCopy {
  labels?: WorkerTooltipLabels;
  statuses?: Partial<Record<string, string>>;
  riskLevels?: Partial<Record<WorkerRiskLevelKey, string>>;
  recommendations?: Partial<Record<WorkerRecommendationKey, string>>;
  accessibility?: {
    tooltipDetails?: string;
    riskBadge?: string;
    closeTooltip?: string;
  };
  actions?: Partial<Record<'close', string>>;
  sections?: Partial<Record<'quote', string>>;
}

/**
 * Copy entry structure for interaction mode strings.
 */
export interface InteractionModeCopyEntry {
  /** Unique identifier for the copy entry */
  key: string;
  /** Primary text content */
  text: string;
  /** Detailed description for tooltips or help text */
  description: string;
  /** Fallback text if translation is missing */
  fallback: string;
  /** Locale identifier (e.g., 'it-IT', 'en-US') */
  locale: string;
  /** Category for organization (e.g., 'mode', 'action', 'help') */
  category: 'mode' | 'action' | 'help' | 'tooltip';
  /** Context where this copy is used */
  context: 'picker' | 'ftue' | 'help' | 'accessibility';
  /** Whether this copy should be translated */
  translatable: boolean;
  /** Maximum length for UI constraints */
  maxLength?: number;
  /** Accessibility attributes */
  accessibility?: {
    /** ARIA label for screen readers */
    ariaLabel?: string;
    /** ARIA description for additional context */
    ariaDescription?: string;
    /** Keyboard shortcut hint */
    keyHint?: string;
  };
}

/**
 * Interaction mode copy configuration metadata.
 */
export interface InteractionModeCopyConfig {
  defaultLocale: string;
  supportedLocales: string[];
  entries: InteractionModeCopyEntry[];
  metadata: {
    version: string;
    lastUpdated: number;
    totalEntries: number;
    translationStatus: Record<string, 'complete' | 'partial' | 'missing'>;
  };
}
