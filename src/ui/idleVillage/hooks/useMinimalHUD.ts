/**
 * Hook for managing minimal HUD display with essential real data only.
 * 
 * This hook provides a minimal, config-first HUD that displays only essential
 * information without decorative elements or redundant data.
 */

import { useMemo } from 'react';
import type { ResidentState, ScheduledActivity } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import { useResidentDropValidation } from './useResidentDropValidation';

/**
 * Essential HUD data for a resident
 */
export interface ResidentHUDData {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  fatigue: number;
  stamina: number;
  status: string;
  isInjured: boolean;
  isAvailable: boolean;
  canWork: boolean;
}

/**
 * Essential HUD data for an activity
 */
export interface ActivityHUDData {
  id: string;
  name: string;
  description: string;
  tags: string[];
  slotTags: string[];
  level: number;
  dangerRating: number;
  maxSlots: string | number;
}

/**
 * Minimal HUD state with only essential data
 */
export interface MinimalHUDState {
  residents: ResidentHUDData[];
  activities: ActivityHUDData[];
  activeSlots: number;
  totalSlots: number;
  validationResults: Record<string, any>;
}

/**
 * Parameters for the useMinimalHUD hook
 */
export interface UseMinimalHUDParams {
  /** Residents to display in HUD */
  residents: ResidentState[];
  /** Activities to display in HUD */
  activities: ScheduledActivity[];
  /** Activity definitions for context */
  activityDefinitions: Record<string, ActivityDefinition>;
  /** Current assignments by scenario */
  assignmentsByScenario: Record<string, Record<string, string | null>>;
}

/**
 * Hook for managing minimal HUD with essential real data only
 * 
 * @param params - Hook parameters
 * @returns Minimal HUD state and utilities
 */
export function useMinimalHUD(params: UseMinimalHUDParams): {
  hudState: MinimalHUDState;
  getResidentData: (residentId: string) => ResidentHUDData | null;
  getActivityData: (activityId: string) => ActivityHUDData | null;
  getValidationSummary: (residentId: string, activityId: string) => any;
} {
  const { residents, activities, activityDefinitions, assignmentsByScenario } = params;
  
  // Use existing drop validation hook for HUD selectors
  const { hudSelectors } = useResidentDropValidation();
  
  // Process residents data for HUD
  const processedResidents = useMemo(() => {
    return residents.map(hudSelectors.getResidentHUDData);
  }, [residents, hudSelectors]);
  
  // Process activities data for HUD
  const processedActivities = useMemo(() => {
    const uniqueActivityIds = [...new Set(activities.map(a => a.activityId))];
    return uniqueActivityIds
      .map(activityId => {
        const definition = activityDefinitions[activityId];
        return definition ? hudSelectors.getActivityHUDData(definition) : null;
      })
      .filter((data): data is ActivityHUDData => data !== null);
  }, [activities, activityDefinitions, hudSelectors]);
  
  // Calculate slot statistics
  const slotStats = useMemo(() => {
    const totalSlots = Object.values(assignmentsByScenario).reduce((total, assignments) => {
      return total + Object.keys(assignments).length;
    }, 0);
    
    const activeSlots = Object.values(assignmentsByScenario).reduce((total, assignments) => {
      return total + Object.values(assignments).filter(Boolean).length;
    }, 0);
    
    return { totalSlots, activeSlots };
  }, [assignmentsByScenario]);
  
  // Build minimal HUD state
  const hudState: MinimalHUDState = useMemo(() => ({
    residents: processedResidents,
    activities: processedActivities,
    activeSlots: slotStats.activeSlots,
    totalSlots: slotStats.totalSlots,
    validationResults: {},
  }), [processedResidents, processedActivities, slotStats]);
  
  // Utility functions
  const getResidentData = (residentId: string): ResidentHUDData | null => {
    return hudState.residents.find(r => r.id === residentId) || null;
  };
  
  const getActivityData = (activityId: string): ActivityHUDData | null => {
    return hudState.activities.find(a => a.id === activityId) || null;
  };
  
  const getValidationSummary = (residentId: string, activityId: string): any => {
    // This would integrate with the validation system
    // For now, return a minimal summary
    return {
      isValid: true,
      message: 'Ready for assignment',
      severity: 'success',
    };
  };
  
  return {
    hudState,
    getResidentData,
    getActivityData,
    getValidationSummary,
  };
}
