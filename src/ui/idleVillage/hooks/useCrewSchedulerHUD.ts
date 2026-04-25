/**
 * Crew Scheduler HUD Hook - NP-017
 * 
 * State management hook for the crew scheduler HUD.
 * Integrates with existing crew scheduler, manages crew cards,
 * handles quick controls, and provides telemetry integration.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import {
  type CrewSchedulerHUDConfig,
  type CrewCardConfig,
  CrewStatusLevel,
  CrewQuickControlType,
  CrewCardDisplayMode,
  DEFAULT_CREW_SCHEDULER_HUD_CONFIG,
  createCrewCardConfig,
  filterCrewCards,
  sortCrewCards,
} from '../config/crewSchedulerHUDConfig';
import { useCrewTelemetry } from '../utils/crewSchedulerTelemetry';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';

const diagnostics = createSandboxDiagnostics('CrewSchedulerHUD', 'hook');

/**
 * Hook configuration options
 */
export interface UseCrewSchedulerHUDOptions {
  /** Custom HUD configuration */
  config?: Partial<CrewSchedulerHUDConfig>;
  /** User permissions */
  userPermissions: string[];
  /** Current village state */
  villageState: {
    residents: Record<string, ResidentState>;
    activities: Record<string, ActivityDefinition>;
    currentTime: number;
  };
  /** Available activities for assignment */
  availableActivities?: Array<{
    id: string;
    name: string;
    requiresSpecialization?: string[];
  }>;
  /** External event handlers */
  onCrewAssignment?: (crewId: string, activityId: string) => void;
  onCrewRest?: (crewId: string, duration: number) => void;
  onCrewRecall?: (crewId: string) => void;
  onCrewSpecialize?: (crewId: string, specializations: string[]) => void;
}

/**
 * Hook return value
 */
export interface UseCrewSchedulerHUDReturn {
  /** Crew cards for display */
  crewCards: CrewCardConfig[];
  /** HUD configuration */
  config: CrewSchedulerHUDConfig;
  /** HUD visibility state */
  visible: boolean;
  /** HUD minimized state */
  minimized: boolean;
  /** Current display mode */
  displayMode: CrewCardDisplayMode;
  /** Current filters */
  filters: CrewSchedulerHUDConfig['filters'];
  /** Current sort field */
  sortField: string;
  /** Current sort direction */
  sortDirection: 'asc' | 'desc';
  /** Telemetry hook return */
  telemetry: ReturnType<typeof useCrewTelemetry>;
  /** Event handlers */
  toggleVisibility: () => void;
  toggleMinimize: () => void;
  setDisplayMode: (mode: CrewCardDisplayMode) => void;
  setFilters: (filters: CrewSchedulerHUDConfig['filters']) => void;
  setSortField: (field: string) => void;
  setSortDirection: (direction: 'asc' | 'desc') => void;
  handleQuickControl: (controlType: CrewQuickControlType, crewId: string, payload: Record<string, unknown>) => void;
  handleCardClick: (crewId: string) => void;
  /** Computed values */
  filteredCrewCards: CrewCardConfig[];
  crewStats: {
    total: number;
    available: number;
    busy: number;
    fatigued: number;
    offline: number;
    specializing: number;
  };
}

/**
 * Main crew scheduler HUD hook
 */
export function useCrewSchedulerHUD({
  config: customConfig,
  userPermissions,
  villageState,
  availableActivities = [],
  onCrewAssignment,
  onCrewRest,
  onCrewRecall,
  onCrewSpecialize,
}: UseCrewSchedulerHUDOptions): UseCrewSchedulerHUDReturn {
  const config = useMemo(() => ({
    ...DEFAULT_CREW_SCHEDULER_HUD_CONFIG,
    ...customConfig,
  }), [customConfig]);

  const telemetry = useCrewTelemetry(config.telemetry);

  // HUD state
  const [visible, setVisible] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [displayMode, setDisplayMode] = useState<CrewCardDisplayMode>(config.cardDisplay.defaultMode);

  // Filter and sort state
  const [filters, setFilters] = useState(config.filters);
  const [sortField, setSortField] = useState(config.sorting.defaultField);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(config.sorting.defaultDirection);

  // Crew cards state
  const [crewCards, setCrewCards] = useState<CrewCardConfig[]>([]);

  // Update interval reference
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Convert resident state to crew cards
  const convertResidentsToCrewCards = useCallback((
    residents: Record<string, ResidentState>
  ): CrewCardConfig[] => {
    return Object.entries(residents).map(([residentId, resident]) => {
      const status = determineCrewStatus(resident);
      const fatigueLevel = resident.fatigue || 0;
      
      return createCrewCardConfig(residentId, resident, {
        status,
        fatigueLevel,
        currentActivity: resident.currentActivity,
        specializations: resident.specializations || [],
        priorityScore: calculatePriorityScore(resident, status, fatigueLevel),
        timeUntilAvailable: resident.currentActivity ? 
          estimateTimeUntilAvailable(resident) : undefined,
        performance: calculatePerformanceMetrics(resident),
        display: {
          color: getCrewColor(resident, status),
          icon: getCrewIcon(resident, status),
          badges: getCrewBadges(resident),
        },
      });
    });
  }, []);

  // Determine crew status from resident state
  const determineCrewStatus = (resident: ResidentState): CrewStatusLevel => {
    if (!resident.available) return CrewStatusLevel.OFFLINE;
    if (resident.fatigue && resident.fatigue > 0.8) return CrewStatusLevel.FATIGUED;
    if (resident.currentActivity) return CrewStatusLevel.BUSY;
    if (resident.specializing) return CrewStatusLevel.SPECIALIZING;
    return CrewStatusLevel.AVAILABLE;
  };

  // Calculate priority score
  const calculatePriorityScore = (
    resident: ResidentState,
    status: CrewStatusLevel,
    fatigueLevel: number
  ): number => {
    let score = 50; // Base score

    // Status adjustments
    switch (status) {
      case CrewStatusLevel.AVAILABLE:
        score += 30;
        break;
      case CrewStatusLevel.BUSY:
        score += 10;
        break;
      case CrewStatusLevel.FATIGUED:
        score -= 20;
        break;
      case CrewStatusLevel.OFFLINE:
        score -= 50;
        break;
      case CrewStatusLevel.SPECIALIZING:
        score += 5;
        break;
    }

    // Fatigue penalty
    score -= fatigueLevel * 20;

    // Specialization bonus
    if (resident.specializations && resident.specializations.length > 0) {
      score += resident.specializations.length * 5;
    }

    return Math.max(0, Math.min(100, score));
  };

  // Estimate time until available
  const estimateTimeUntilAvailable = (resident: ResidentState): number => {
    if (!resident.currentActivity) return 0;
    
    // This would be calculated based on activity duration and progress
    // For now, return a placeholder value
    return 5 * 60 * 1000; // 5 minutes in milliseconds
  };

  // Calculate performance metrics
  const calculatePerformanceMetrics = (resident: ResidentState) => {
    // These would be calculated from actual performance data
    return {
      assignmentsCompleted: resident.assignmentsCompleted || 0,
      averageCompletionTime: resident.averageCompletionTime || 300000, // 5 minutes
      successRate: resident.successRate || 0.95,
    };
  };

  // Get crew color based on status and attributes
  const getCrewColor = (resident: ResidentState, status: CrewStatusLevel): string => {
    switch (status) {
      case CrewStatusLevel.AVAILABLE:
        return 'rgb(34, 197, 94)'; // green-500
      case CrewStatusLevel.BUSY:
        return 'rgb(59, 130, 246)'; // blue-500
      case CrewStatusLevel.FATIGUED:
        return 'rgb(251, 191, 36)'; // amber-400
      case CrewStatusLevel.OFFLINE:
        return 'rgb(107, 114, 128)'; // gray-500
      case CrewStatusLevel.SPECIALIZING:
        return 'rgb(168, 85, 247)'; // purple-500
      default:
        return 'rgb(59, 130, 246)'; // blue-500
    }
  };

  // Get crew icon based on status
  const getCrewIcon = (resident: ResidentState, status: CrewStatusLevel): string => {
    switch (status) {
      case CrewStatusLevel.AVAILABLE:
        return '✓';
      case CrewStatusLevel.BUSY:
        return '⚡';
      case CrewStatusLevel.FATIGUED:
        return '😴';
      case CrewStatusLevel.OFFLINE:
        return '⊘';
      case CrewStatusLevel.SPECIALIZING:
        return '🎯';
      default:
        return '👤';
    }
  };

  // Get crew badges
  const getCrewBadges = (resident: ResidentState): string[] => {
    const badges: string[] = [];
    
    if (resident.specializations && resident.specializations.length > 0) {
      badges.push(`${resident.specializations.length} specs`);
    }
    
    if (resident.fatigue && resident.fatigue > 0.7) {
      badges.push('tired');
    }
    
    if (resident.assignmentsCompleted && resident.assignmentsCompleted > 10) {
      badges.push('veteran');
    }
    
    return badges;
  };

  // Update crew cards from village state
  const updateCrewCards = useCallback(() => {
    const newCrewCards = convertResidentsToCrewCards(villageState.residents);
    setCrewCards(newCrewCards);
    
    diagnostics.log('Crew cards updated', { 
      total: newCrewCards.length,
      available: newCrewCards.filter(c => c.status === CrewStatusLevel.AVAILABLE).length,
    });
  }, [villageState.residents, convertResidentsToCrewCards]);

  // Filtered and sorted crew cards
  const filteredCrewCards = useMemo(() => {
    const filtered = filterCrewCards(crewCards, filters);
    const sorted = sortCrewCards(filtered, sortField, sortDirection);
    return sorted.slice(0, config.performance.maxCrewCards);
  }, [crewCards, filters, sortField, sortDirection, config.performance.maxCrewCards]);

  // Crew statistics
  const crewStats = useMemo(() => {
    const stats = {
      total: crewCards.length,
      available: 0,
      busy: 0,
      fatigued: 0,
      offline: 0,
      specializing: 0,
    };

    crewCards.forEach(card => {
      switch (card.status) {
        case CrewStatusLevel.AVAILABLE:
          stats.available++;
          break;
        case CrewStatusLevel.BUSY:
          stats.busy++;
          break;
        case CrewStatusLevel.FATIGUED:
          stats.fatigued++;
          break;
        case CrewStatusLevel.OFFLINE:
          stats.offline++;
          break;
        case CrewStatusLevel.SPECIALIZING:
          stats.specializing++;
          break;
      }
    });

    return stats;
  }, [crewCards]);

  // Event handlers
  const toggleVisibility = useCallback(() => {
    const newVisible = !visible;
    setVisible(newVisible);
    
    telemetry.trackHUDInteraction('toggle_visibility', undefined, undefined, undefined);
    diagnostics.log('HUD visibility toggled', { visible: newVisible });
  }, [visible, telemetry]);

  const toggleMinimize = useCallback(() => {
    const newMinimized = !minimized;
    setMinimized(newMinimized);
    
    telemetry.trackHUDInteraction('toggle_minimize', undefined, undefined, undefined);
    diagnostics.log('HUD minimize toggled', { minimized: newMinimized });
  }, [minimized, telemetry]);

  const handleQuickControl = useCallback((
    controlType: CrewQuickControlType,
    crewId: string,
    payload: Record<string, unknown>
  ) => {
    const startTime = Date.now();

    switch (controlType) {
      case CrewQuickControlType.ASSIGN_ACTIVITY:
        const activityId = payload.activityId as string;
        onCrewAssignment?.(crewId, activityId);
        telemetry.trackAssignmentRequest(crewId, activityId, 50);
        break;

      case CrewQuickControlType.REST_RESIDENT:
        const duration = payload.duration as number;
        onCrewRest?.(crewId, duration);
        telemetry.trackHUDInteraction('rest_crew', crewId, controlType, Date.now() - startTime);
        break;

      case CrewQuickControlType.EMERGENCY_RECALL:
        onCrewRecall?.(crewId);
        telemetry.trackEmergencyRecall(crewId, 'manual_recall', []);
        break;

      case CrewQuickControlType.SPECIALIZE:
        const specializations = payload.specializations as string[];
        onCrewSpecialize?.(crewId, specializations);
        telemetry.trackSpecializationChange(crewId, [], specializations);
        break;

      case CrewQuickControlType.PRIORITY_BOOST:
        // Handle priority boost
        telemetry.trackPriorityAdjustment(crewId, 50, 75, 'manual_boost');
        break;

      case CrewQuickControlType.FATIGUE_MANAGE:
        // Handle fatigue management
        telemetry.trackFatigueWarning(crewId, 0.8, 0.7);
        break;

      default:
        diagnostics.warn('Unknown quick control type', { controlType, crewId, payload });
    }

    telemetry.trackHUDInteraction('quick_control', crewId, controlType, Date.now() - startTime);
  }, [onCrewAssignment, onCrewRest, onCrewRecall, onCrewSpecialize, telemetry]);

  const handleCardClick = useCallback((crewId: string) => {
    telemetry.trackHUDInteraction('card_click', crewId, undefined, undefined);
    diagnostics.log('Crew card clicked', { crewId });
  }, [telemetry]);

  // Update crew cards periodically
  useEffect(() => {
    updateCrewCards();

    if (config.performance.statusUpdateInterval > 0) {
      updateIntervalRef.current = setInterval(() => {
        updateCrewCards();
      }, config.performance.statusUpdateInterval);
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [updateCrewCards, config.performance.statusUpdateInterval]);

  // Track crew status changes
  useEffect(() => {
    const previousCards = crewCards;
    const currentCards = convertResidentsToCrewCards(villageState.residents);

    // Detect status changes
    currentCards.forEach(currentCard => {
      const previousCard = previousCards.find(card => card.id === currentCard.id);
      if (previousCard && previousCard.status !== currentCard.status) {
        telemetry.trackCrewStatusChange(
          currentCard.id,
          previousCard.status,
          currentCard.status,
          'automatic_update'
        );
      }
    });
  }, [villageState.residents, crewCards, convertResidentsToCrewCards, telemetry]);

  return {
    crewCards,
    config,
    visible,
    minimized,
    displayMode,
    filters,
    sortField,
    sortDirection,
    telemetry,
    toggleVisibility,
    toggleMinimize,
    setDisplayMode,
    setFilters,
    setSortField,
    setSortDirection,
    handleQuickControl,
    handleCardClick,
    filteredCrewCards,
    crewStats,
  };
}

export default useCrewSchedulerHUD;
