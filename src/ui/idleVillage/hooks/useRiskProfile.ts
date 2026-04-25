/**
 * Hook for managing risk profiles and calculating risk visualizations.
 * Config-first design with injury/death percentage calculations.
 */

import { useMemo } from 'react';
import type { RiskMetrics } from '@/ui/idleVillage/utils/riskMetrics';
import { calculateRiskStripes } from '@/ui/idleVillage/utils/riskMetrics';
import { 
  getRiskProfile, 
  getRiskProfileIds, 
  DEFAULT_RISK_PROFILE_ID,
  type RiskProfile 
} from '@/balancing/config/idleVillage/riskProfiles';

/**
 * View model for risk display components.
 */
export interface RiskProfileViewModel {
  /** Current risk profile configuration */
  profile: RiskProfile;
  /** Calculated stripe data for visualization */
  stripeData: {
    injuryHeight: number;
    deathHeight: number;
    injuryColor: string;
    deathColor: string;
    ariaLabel: string;
    warnings: string[];
  };
  /** Risk level classification */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  /** CSS classes to apply */
  cssClasses: string[];
  /** Whether risk is elevated (medium or higher) */
  isElevated: boolean;
  /** Formatted risk percentages for display */
  formattedRisk: {
    injury: string;
    death: string;
    total: string;
  };
}

/**
 * Hook for risk profile management and visualization.
 * Provides config-first risk calculations and view models.
 *
 * @param metrics - Injury and death percentages
 * @param profileId - Optional profile ID (defaults to standard)
 * @returns Risk profile view model
 */
export function useRiskProfile(
  metrics: RiskMetrics,
  profileId?: string
): RiskProfileViewModel {
  const profile = useMemo(() => {
    return getRiskProfile(profileId || DEFAULT_RISK_PROFILE_ID);
  }, [profileId]);

  const stripeData = useMemo(() => {
    return calculateRiskStripes(metrics);
  }, [metrics]);

  const riskLevel = useMemo(() => {
    const { injuryPct, deathPct } = metrics;
    const maxRisk = Math.max(injuryPct, deathPct);
    
    // Use injury thresholds for overall risk level
    const thresholds = profile.injuryThresholds;
    
    if (maxRisk >= thresholds.critical) return 'critical';
    if (maxRisk >= thresholds.high) return 'high';
    if (maxRisk >= thresholds.medium) return 'medium';
    return 'low';
  }, [metrics, profile]);

  const cssClasses = useMemo(() => {
    const baseClasses = ['risk-display', `risk-${riskLevel}`];
    return [...baseClasses, ...(profile.cssClasses || [])];
  }, [riskLevel, profile.cssClasses]);

  const isElevated = useMemo(() => {
    return riskLevel === 'high' || riskLevel === 'critical';
  }, [riskLevel]);

  const formattedRisk = useMemo(() => {
    return {
      injury: `${metrics.injuryPct}%`,
      death: `${metrics.deathPct}%`,
      total: `${metrics.injuryPct + metrics.deathPct}%`,
    };
  }, [metrics]);

  return {
    profile,
    stripeData,
    riskLevel,
    cssClasses,
    isElevated,
    formattedRisk,
  };
}

/**
 * Hook for managing multiple risk profiles.
 * Useful for configuration UI or profile selection.
 *
 * @returns Available risk profiles and utilities
 */
export function useRiskProfiles() {
  const profileIds = useMemo(() => getRiskProfileIds(), []);
  
  const getProfile = useMemo(() => (id: string) => getRiskProfile(id), []);
  
  const defaultProfile = useMemo(() => getRiskProfile(DEFAULT_RISK_PROFILE_ID), []);

  return {
    profileIds,
    getProfile,
    defaultProfile,
    defaultProfileId: DEFAULT_RISK_PROFILE_ID,
  };
}

/**
 * Hook for risk trend analysis.
 * Compares current risk with previous values to detect changes.
 *
 * @param current - Current risk metrics
 * @param previous - Previous risk metrics
 * @returns Trend analysis and change indicators
 */
export function useRiskTrend(
  current: RiskMetrics,
  previous?: RiskMetrics
) {
  const trend = useMemo(() => {
    if (!previous) return { direction: 'stable' as const, change: 0 };

    const currentTotal = current.injuryPct + current.deathPct;
    const previousTotal = previous.injuryPct + previous.deathPct;
    const change = currentTotal - previousTotal;

    let direction: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(change) < 1) {
      direction = 'stable';
    } else if (change > 0) {
      direction = 'increasing';
    } else {
      direction = 'decreasing';
    }

    return { direction, change };
  }, [current, previous]);

  const isSignificantChange = useMemo(() => {
    return Math.abs(trend.change) >= 5; // 5% threshold
  }, [trend.change]);

  return {
    ...trend,
    isSignificantChange,
  };
}
