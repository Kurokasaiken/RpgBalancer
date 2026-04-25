/**
 * Risk profile configuration for Idle Village Phase 12.
 * Defines thresholds and color palettes for injury/death risk visualization.
 * Config-first design with JSDoc documentation.
 */

/**
 * Risk level thresholds for injury and death percentages.
 */
export interface RiskThresholds {
  /** Low risk threshold (0 to this value) */
  low: number;
  /** Medium risk threshold (low to this value) */
  medium: number;
  /** High risk threshold (medium to this value) */
  high: number;
  /** Critical risk threshold (high to 100) */
  critical: number;
}

/**
 * Color palette for risk visualization.
 * Uses CSS custom properties for theme consistency.
 */
export interface RiskColorPalette {
  /** Color for low risk (green) */
  low: string;
  /** Color for medium risk (yellow) */
  medium: string;
  /** Color for high risk (orange) */
  high: string;
  /** Color for critical risk (red) */
  critical: string;
  /** Background color for risk container */
  background: string;
  /** Border color for risk container */
  border: string;
}

/**
 * Complete risk profile configuration.
 */
export interface RiskProfile {
  /** Unique identifier for the profile */
  id: string;
  /** Display name for the profile */
  name: string;
  /** Description of when this profile is used */
  description: string;
  /** Injury risk thresholds */
  injuryThresholds: RiskThresholds;
  /** Death risk thresholds */
  deathThresholds: RiskThresholds;
  /** Color palette for visualization */
  colors: RiskColorPalette;
  /** Minimum stripe height for visibility (percentage) */
  minStripeHeight: number;
  /** Whether to animate risk changes */
  animateChanges: boolean;
  /** Additional CSS classes to apply */
  cssClasses?: string[];
}

/**
 * Default risk profile configuration.
 * Config-first with Observatory theme tokens.
 */
export const DEFAULT_RISK_PROFILES: Record<string, RiskProfile> = {
  /**
   * Standard risk profile for most quests.
   * Conservative thresholds with clear visual distinction.
   */
  standard: {
    id: 'standard',
    name: 'Standard Risk',
    description: 'Default risk profile for typical quests and activities',
    injuryThresholds: {
      low: 10,
      medium: 25,
      high: 50,
      critical: 75,
    },
    deathThresholds: {
      low: 5,
      medium: 15,
      high: 30,
      critical: 50,
    },
    colors: {
      low: 'var(--risk-low, #10b981)', // green
      medium: 'var(--risk-medium, #fbbf24)', // yellow
      high: 'var(--risk-high, #f97316)', // orange
      critical: 'var(--risk-critical, #dc2626)', // red
      background: 'var(--panel-background, rgba(0, 0, 0, 0.3))',
      border: 'var(--panel-border, rgba(255, 255, 255, 0.08))',
    },
    minStripeHeight: 3,
    animateChanges: true,
    cssClasses: ['risk-standard'],
  },

  /**
   * Low-risk profile for safe activities.
   * More lenient thresholds, mostly green/yellow.
   */
  lowRisk: {
    id: 'lowRisk',
    name: 'Low Risk Activities',
    description: 'For safe activities like gathering, crafting, or training',
    injuryThresholds: {
      low: 20,
      medium: 40,
      high: 60,
      critical: 80,
    },
    deathThresholds: {
      low: 10,
      medium: 20,
      high: 35,
      critical: 55,
    },
    colors: {
      low: 'var(--risk-low, #10b981)', // green
      medium: 'var(--risk-medium, #fbbf24)', // yellow
      high: 'var(--risk-high, #f97316)', // orange
      critical: 'var(--risk-critical, #dc2626)', // red
      background: 'var(--panel-background, rgba(0, 0, 0, 0.3))',
      border: 'var(--panel-border, rgba(255, 255, 255, 0.08))',
    },
    minStripeHeight: 3,
    animateChanges: true,
    cssClasses: ['risk-low'],
  },

  /**
   * High-risk profile for dangerous quests.
   * Stricter thresholds, more red/orange visibility.
   */
  highRisk: {
    id: 'highRisk',
    name: 'High Risk Quests',
    description: 'For dangerous quests, boss fights, or exploration',
    injuryThresholds: {
      low: 5,
      medium: 15,
      high: 35,
      critical: 60,
    },
    deathThresholds: {
      low: 2,
      medium: 8,
      high: 20,
      critical: 40,
    },
    colors: {
      low: 'var(--risk-low, #10b981)', // green
      medium: 'var(--risk-medium, #fbbf24)', // yellow
      high: 'var(--risk-high, #f97316)', // orange
      critical: 'var(--risk-critical, #dc2626)', // red
      background: 'var(--panel-background, rgba(0, 0, 0, 0.3))',
      border: 'var(--panel-border, rgba(255, 255, 255, 0.08))',
    },
    minStripeHeight: 3,
    animateChanges: true,
    cssClasses: ['risk-high'],
  },

  /**
   * Minimal profile for accessibility.
   * Reduced animations, higher contrast.
   */
  minimal: {
    id: 'minimal',
    name: 'Minimal (Accessibility)',
    description: 'Reduced motion and high contrast for accessibility',
    injuryThresholds: {
      low: 10,
      medium: 25,
      high: 50,
      critical: 75,
    },
    deathThresholds: {
      low: 5,
      medium: 15,
      high: 30,
      critical: 50,
    },
    colors: {
      low: 'var(--risk-low, #10b981)', // green
      medium: 'var(--risk-medium, #fbbf24)', // yellow
      high: 'var(--risk-high, #f97316)', // orange
      critical: 'var(--risk-critical, #dc2626)', // red
      background: 'var(--panel-background, rgba(0, 0, 0, 0.5))',
      border: 'var(--panel-border, rgba(255, 255, 255, 0.2))',
    },
    minStripeHeight: 5, // Higher minimum for visibility
    animateChanges: false, // No animations for accessibility
    cssClasses: ['risk-minimal'],
  },
};

/**
 * Default risk profile ID to use.
 */
export const DEFAULT_RISK_PROFILE_ID = 'standard';

/**
 * Gets a risk profile by ID.
 * Falls back to standard profile if not found.
 *
 * @param id - Risk profile ID
 * @returns Risk profile configuration
 */
export function getRiskProfile(id: string): RiskProfile {
  return DEFAULT_RISK_PROFILES[id] || DEFAULT_RISK_PROFILES.standard;
}

/**
 * Gets all available risk profile IDs.
 *
 * @returns Array of risk profile IDs
 */
export function getRiskProfileIds(): string[] {
  return Object.keys(DEFAULT_RISK_PROFILES);
}

/**
 * Validates a risk profile configuration.
 *
 * @param profile - Risk profile to validate
 * @returns True if valid
 */
export function validateRiskProfile(profile: RiskProfile): boolean {
  const requiredFields = ['id', 'name', 'description', 'injuryThresholds', 'deathThresholds', 'colors'];
  if (!requiredFields.every(field => field in profile)) {
    return false;
  }

  // Validate thresholds sum to 100
  const injuryTotal = Object.values(profile.injuryThresholds).reduce((sum, val) => sum + val, 0);
  const deathTotal = Object.values(profile.deathThresholds).reduce((sum, val) => sum + val, 0);

  return injuryTotal === 100 && deathTotal === 100;
}
