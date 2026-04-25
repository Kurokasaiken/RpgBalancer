/**
 * Location Tooltip Configuration - NP-109
 * 
 * Config-first design for location tooltip system showing crew info,
 * requirements, and stats for LocationCard hover interactions.
 * 
 * @since 2026-01-23
 * @author Cascade
 */

/**
 * Visual styling configuration for location tooltips
 */
export interface LocationTooltipVisualConfig {
  /** Background color for tooltip container */
  backgroundColor: string;
  /** Border color for tooltip */
  borderColor: string;
  /** Text color for primary content */
  textColor: string;
  /** Text color for secondary/muted content */
  mutedTextColor: string;
  /** Accent color for highlights and badges */
  accentColor: string;
  /** Border radius for tooltip container */
  borderRadius: string;
  /** Shadow for tooltip */
  boxShadow: string;
  /** Maximum width of tooltip */
  maxWidth: number;
  /** Padding inside tooltip */
  padding: string;
  /** Z-index for tooltip layering */
  zIndex: number;
}

/**
 * Behavior configuration for tooltip interactions
 */
export interface LocationTooltipBehaviorConfig {
  /** Delay in ms before showing tooltip on hover */
  showDelayMs: number;
  /** Delay in ms before hiding tooltip after mouse leave */
  hideDelayMs: number;
  /** Whether to show tooltip on hover (vs click only) */
  showOnHover: boolean;
  /** Whether to show tooltip on focus (keyboard navigation) */
  showOnFocus: boolean;
  /** Auto-hide duration in ms (0 = no auto-hide) */
  autoHideDurationMs: number;
  /** Offset from cursor/target in pixels */
  offsetPx: number;
  /** Preferred placement relative to target */
  preferredPlacement: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  /** Whether to follow mouse movement */
  followMouse: boolean;
  /** Whether to keep tooltip within viewport bounds */
  constrainToViewport: boolean;
}

/**
 * Content configuration for what to display in tooltip
 */
export interface LocationTooltipContentConfig {
  /** Show location title */
  showTitle: boolean;
  /** Show location description */
  showDescription: boolean;
  /** Show crew capacity information */
  showCrewCapacity: boolean;
  /** Show assigned crew members */
  showAssignedCrew: boolean;
  /** Show activity requirements (stat tags, etc) */
  showRequirements: boolean;
  /** Show activity stats (progress, ETA, etc) */
  showActivityStats: boolean;
  /** Show risk level indicators */
  showRiskLevel: boolean;
  /** Show location phase status (day/night) */
  showPhaseStatus: boolean;
  /** Maximum number of crew members to display */
  maxCrewDisplay: number;
  /** Maximum number of requirements to display */
  maxRequirementsDisplay: number;
  /** Show detailed stat breakdown */
  showDetailedStats: boolean;
}

/**
 * Section display configuration
 */
export interface LocationTooltipSectionConfig {
  /** Show crew section */
  showCrewSection: boolean;
  /** Show requirements section */
  showRequirementsSection: boolean;
  /** Show stats section */
  showStatsSection: boolean;
  /** Show status section */
  showStatusSection: boolean;
  /** Order of sections (lower numbers appear first) */
  sectionOrder: {
    crew: number;
    requirements: number;
    stats: number;
    status: number;
  };
}

/**
 * Complete location tooltip configuration
 */
export interface LocationTooltipConfig {
  visual: LocationTooltipVisualConfig;
  behavior: LocationTooltipBehaviorConfig;
  content: LocationTooltipContentConfig;
  sections: LocationTooltipSectionConfig;
}

/**
 * Default location tooltip configuration following Gilded Observatory theme
 */
export const DEFAULT_LOCATION_TOOLTIP_CONFIG: LocationTooltipConfig = {
  visual: {
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    borderColor: 'rgba(100, 116, 139, 0.6)', // slate-600/60
    textColor: 'rgb(240, 239, 228)', // ivory
    mutedTextColor: 'rgb(148, 163, 184)', // slate-400
    accentColor: 'rgb(251, 191, 36)', // amber-400
    borderRadius: '0.5rem',
    boxShadow: '0 22px 55px rgba(0, 0, 0, 0.55)',
    maxWidth: 320,
    padding: '1rem',
    zIndex: 50,
  },
  behavior: {
    showDelayMs: 500,
    hideDelayMs: 200,
    showOnHover: true,
    showOnFocus: true,
    autoHideDurationMs: 0, // No auto-hide by default
    offsetPx: 12,
    preferredPlacement: 'auto',
    followMouse: false,
    constrainToViewport: true,
  },
  content: {
    showTitle: true,
    showDescription: true,
    showCrewCapacity: true,
    showAssignedCrew: true,
    showRequirements: true,
    showActivityStats: true,
    showRiskLevel: true,
    showPhaseStatus: true,
    maxCrewDisplay: 5,
    maxRequirementsDisplay: 6,
    showDetailedStats: true,
  },
  sections: {
    showCrewSection: true,
    showRequirementsSection: true,
    showStatsSection: true,
    showStatusSection: true,
    sectionOrder: {
      crew: 1,
      requirements: 2,
      stats: 3,
      status: 4,
    },
  },
};

/**
 * Crew capacity status levels
 */
export type CrewCapacityStatus = 'empty' | 'available' | 'filling' | 'full' | 'overfull';

/**
 * Get crew capacity status based on current/max values
 */
export function getCrewCapacityStatus(current: number, max: number): CrewCapacityStatus {
  if (current === 0) return 'empty';
  if (current > max) return 'overfull';
  if (current === max) return 'full';
  if (current / max >= 0.75) return 'filling';
  return 'available';
}

/**
 * Get color for crew capacity status
 */
export function getCrewCapacityColor(status: CrewCapacityStatus): string {
  switch (status) {
    case 'empty':
      return 'rgb(148, 163, 184)'; // slate-400
    case 'available':
      return 'rgb(34, 197, 94)'; // green-500
    case 'filling':
      return 'rgb(251, 191, 36)'; // amber-400
    case 'full':
      return 'rgb(239, 68, 68)'; // red-500
    case 'overfull':
      return 'rgb(220, 38, 38)'; // red-600
    default:
      return 'rgb(148, 163, 184)'; // slate-400
  }
}

/**
 * Risk level type for activities
 */
export type ActivityRiskLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

/**
 * Get color for risk level
 */
export function getRiskLevelColor(level: ActivityRiskLevel): string {
  switch (level) {
    case 'none':
      return 'rgb(148, 163, 184)'; // slate-400
    case 'low':
      return 'rgb(34, 197, 94)'; // green-500
    case 'medium':
      return 'rgb(251, 191, 36)'; // amber-400
    case 'high':
      return 'rgb(249, 115, 22)'; // orange-500
    case 'critical':
      return 'rgb(239, 68, 68)'; // red-500
    default:
      return 'rgb(148, 163, 184)'; // slate-400
  }
}

/**
 * Get background color for risk level badge
 */
export function getRiskLevelBgColor(level: ActivityRiskLevel): string {
  switch (level) {
    case 'none':
      return 'rgba(148, 163, 184, 0.2)'; // slate-400/20
    case 'low':
      return 'rgba(34, 197, 94, 0.2)'; // green-500/20
    case 'medium':
      return 'rgba(251, 191, 36, 0.2)'; // amber-400/20
    case 'high':
      return 'rgba(249, 115, 22, 0.2)'; // orange-500/20
    case 'critical':
      return 'rgba(239, 68, 68, 0.2)'; // red-500/20
    default:
      return 'rgba(148, 163, 184, 0.2)'; // slate-400/20
  }
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

/**
 * Format percentage value
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}
