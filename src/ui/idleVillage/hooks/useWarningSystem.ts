/**
 * Hook for managing roster and resource warnings with minimal UI.
 * 
 * This hook provides a minimal, config-first warning system that displays
 * only essential warnings without decorative elements or redundant data.
 */

import { useMemo, useCallback } from 'react';
import type { ResidentState, VillageState } from '@/engine/game/idleVillage/TimeEngine';
import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

/**
 * Warning severity levels
 */
export type WarningSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Warning category types
 */
export type WarningCategory = 'fatigue' | 'food' | 'injury' | 'resources' | 'death';

/**
 * Individual warning data
 */
export interface Warning {
  id: string;
  category: WarningCategory;
  severity: WarningSeverity;
  message: string;
  count: number;
  affectedResidents?: string[];
  timestamp: number;
}

/**
 * Warning system state
 */
export interface WarningSystemState {
  warnings: Warning[];
  hasCriticalWarnings: boolean;
  hasHighWarnings: boolean;
  warningCount: number;
  lastUpdated: number;
}

/**
 * Parameters for the useWarningSystem hook
 */
export interface UseWarningSystemParams {
  /** Current village state */
  villageState: VillageState;
  /** Game configuration */
  config: IdleVillageConfig;
  /** Enable telemetry tracking */
  enableTelemetry?: boolean;
}

/**
 * Hook for managing roster and resource warnings
 * 
 * @param params - Hook parameters
 * @returns Warning system state and utilities
 */
export function useWarningSystem(params: UseWarningSystemParams): {
  warningState: WarningSystemState;
  getWarningsByCategory: (category: WarningCategory) => Warning[];
  getWarningsBySeverity: (severity: WarningSeverity) => Warning[];
  clearWarnings: () => void;
  refreshWarnings: () => void;
} {
  const { villageState, config, enableTelemetry = true } = params;
  const thresholds = config.globalRules.warningThresholds;

  // Calculate fatigue warnings
  const calculateFatigueWarnings = useCallback((): Warning[] => {
    const warnings: Warning[] = [];
    const residents = Object.values(villageState.residents);
    
    // Count residents by fatigue level
    const yellowFatigue = residents.filter(r => r.fatigue >= thresholds.fatigue.yellowThreshold && r.fatigue < thresholds.fatigue.redThreshold);
    const redFatigue = residents.filter(r => r.fatigue >= thresholds.fatigue.redThreshold && r.fatigue < thresholds.fatigue.criticalThreshold);
    const criticalFatigue = residents.filter(r => r.fatigue >= thresholds.fatigue.criticalThreshold);
    
    if (criticalFatigue.length > 0) {
      warnings.push({
        id: 'fatigue-critical',
        category: 'fatigue',
        severity: 'critical',
        message: `${criticalFatigue.length} resident${criticalFatigue.length > 1 ? 's' : ''} critically exhausted`,
        count: criticalFatigue.length,
        affectedResidents: criticalFatigue.map(r => r.id),
        timestamp: Date.now(),
      });
    }
    
    if (redFatigue.length > 0) {
      warnings.push({
        id: 'fatigue-high',
        category: 'fatigue',
        severity: 'high',
        message: `${redFatigue.length} resident${redFatigue.length > 1 ? 's' : ''} severely exhausted`,
        count: redFatigue.length,
        affectedResidents: redFatigue.map(r => r.id),
        timestamp: Date.now(),
      });
    }
    
    if (yellowFatigue.length > 0) {
      warnings.push({
        id: 'fatigue-medium',
        category: 'fatigue',
        severity: 'medium',
        message: `${yellowFatigue.length} resident${yellowFatigue.length > 1 ? 's' : ''} getting tired`,
        count: yellowFatigue.length,
        affectedResidents: yellowFatigue.map(r => r.id),
        timestamp: Date.now(),
      });
    }
    
    return warnings;
  }, [villageState.residents, thresholds.fatigue]);

  // Calculate food warnings
  const calculateFoodWarnings = useCallback((): Warning[] => {
    const warnings: Warning[] = [];
    const food = villageState.resources.food || 0;
    
    if (food <= thresholds.food.starvingThreshold) {
      warnings.push({
        id: 'food-starving',
        category: 'food',
        severity: 'critical',
        message: 'Village is starving!',
        count: 1,
        timestamp: Date.now(),
      });
    } else if (food <= thresholds.food.criticalThreshold) {
      warnings.push({
        id: 'food-critical',
        category: 'food',
        severity: 'high',
        message: 'Food critically low',
        count: 1,
        timestamp: Date.now(),
      });
    } else if (food <= thresholds.food.lowThreshold) {
      warnings.push({
        id: 'food-low',
        category: 'food',
        severity: 'medium',
        message: 'Food running low',
        count: 1,
        timestamp: Date.now(),
      });
    }
    
    return warnings;
  }, [villageState.resources, thresholds.food]);

  // Calculate injury warnings
  const calculateInjuryWarnings = useCallback((): Warning[] => {
    const warnings: Warning[] = [];
    const residents = Object.values(villageState.residents);
    
    // Count injuries by severity
    const lightInjuries = residents.filter(r => r.isInjured && !r.status?.includes('moderate') && !r.status?.includes('severe'));
    const moderateInjuries = residents.filter(r => r.status?.includes('moderate'));
    const severeInjuries = residents.filter(r => r.status?.includes('severe'));
    
    if (severeInjuries.length > 0) {
      warnings.push({
        id: 'injury-severe',
        category: 'injury',
        severity: 'critical',
        message: `${severeInjuries.length} severe injur${severeInjuries.length > 1 ? 'ies' : 'y'}`,
        count: severeInjuries.length,
        affectedResidents: severeInjuries.map(r => r.id),
        timestamp: Date.now(),
      });
    }
    
    if (moderateInjuries.length > 0) {
      warnings.push({
        id: 'injury-moderate',
        category: 'injury',
        severity: 'high',
        message: `${moderateInjuries.length} moderate injur${moderateInjuries.length > 1 ? 'ies' : 'y'}`,
        count: moderateInjuries.length,
        affectedResidents: moderateInjuries.map(r => r.id),
        timestamp: Date.now(),
      });
    }
    
    if (lightInjuries.length > 0) {
      warnings.push({
        id: 'injury-light',
        category: 'injury',
        severity: 'medium',
        message: `${lightInjuries.length} minor injur${lightInjuries.length > 1 ? 'ies' : 'y'}`,
        count: lightInjuries.length,
        affectedResidents: lightInjuries.map(r => r.id),
        timestamp: Date.now(),
      });
    }
    
    return warnings;
  }, [villageState.residents]);

  // Calculate resource warnings
  const calculateResourceWarnings = useCallback((): Warning[] => {
    const warnings: Warning[] = [];
    const gold = villageState.resources.gold || 0;
    const materials = villageState.resources.materials || 0;
    
    if (gold <= thresholds.resources.goldCriticalThreshold) {
      warnings.push({
        id: 'gold-critical',
        category: 'resources',
        severity: 'high',
        message: 'Gold critically low',
        count: 1,
        timestamp: Date.now(),
      });
    } else if (gold <= thresholds.resources.goldLowThreshold) {
      warnings.push({
        id: 'gold-low',
        category: 'resources',
        severity: 'medium',
        message: 'Gold running low',
        count: 1,
        timestamp: Date.now(),
      });
    }
    
    if (materials <= thresholds.resources.materialsLowThreshold) {
      warnings.push({
        id: 'materials-low',
        category: 'resources',
        severity: 'medium',
        message: 'Materials running low',
        count: 1,
        timestamp: Date.now(),
      });
    }
    
    return warnings;
  }, [villageState.resources, thresholds.resources]);

  // Calculate all warnings
  const warningState = useMemo((): WarningSystemState => {
    const allWarnings = [
      ...calculateFatigueWarnings(),
      ...calculateFoodWarnings(),
      ...calculateInjuryWarnings(),
      ...calculateResourceWarnings(),
    ];
    
    // Sort by severity (critical first) then timestamp
    const sortedWarnings = allWarnings.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      return severityDiff !== 0 ? severityDiff : b.timestamp - a.timestamp;
    });
    
    const hasCriticalWarnings = sortedWarnings.some(w => w.severity === 'critical');
    const hasHighWarnings = sortedWarnings.some(w => w.severity === 'high');
    
    return {
      warnings: sortedWarnings,
      hasCriticalWarnings,
      hasHighWarnings,
      warningCount: sortedWarnings.length,
      lastUpdated: Date.now(),
    };
  }, [calculateFatigueWarnings, calculateFoodWarnings, calculateInjuryWarnings, calculateResourceWarnings]);

  // Utility functions
  const getWarningsByCategory = useCallback((category: WarningCategory): Warning[] => {
    return warningState.warnings.filter(w => w.category === category);
  }, [warningState.warnings]);

  const getWarningsBySeverity = useCallback((severity: WarningSeverity): Warning[] => {
    return warningState.warnings.filter(w => w.severity === severity);
  }, [warningState.warnings]);

  const clearWarnings = useCallback(() => {
    if (enableTelemetry) {
      trackTelemetryEvent('warnings_cleared', {
        context: 'warning_system',
        warningCount: warningState.warningCount,
        timestamp: Date.now(),
      });
    }
    // In a real implementation, this would clear the warning state
    // For now, we just track the telemetry event
  }, [warningState.warningCount, enableTelemetry]);

  const refreshWarnings = useCallback(() => {
    if (enableTelemetry) {
      trackTelemetryEvent('warnings_refreshed', {
        context: 'warning_system',
        warningCount: warningState.warningCount,
        hasCriticalWarnings: warningState.hasCriticalWarnings,
        timestamp: Date.now(),
      });
    }
    // This would trigger a recalculation of warnings
    // The useMemo dependencies handle this automatically
  }, [warningState.warningCount, warningState.hasCriticalWarnings, enableTelemetry]);

  return {
    warningState,
    getWarningsByCategory,
    getWarningsBySeverity,
    clearWarnings,
    refreshWarnings,
  };
}
