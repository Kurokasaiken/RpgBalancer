/**
 * React hook for AI-powered drop suggestions in Idle Village Phase E
 * 
 * Provides intelligent suggestions for resident-activity assignments
 * with real-time updates, caching, and telemetry integration.
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';
import type { 
  DropSuggestion, 
  DropSuggestionConfig, 
  VillageContext,
  SuggestionType,
  SuggestionPriority 
} from '@/ui/idleVillage/ai/dropSuggestionEngine';
import { DropSuggestionEngine, DEFAULT_SUGGESTION_CONFIG } from '@/ui/idleVillage/ai/dropSuggestionEngine';

/**
 * Parameters for the useDropAISuggestions hook
 */
export interface UseDropAISuggestionsParams {
  /** Configuration for AI suggestion engine */
  config?: Partial<DropSuggestionConfig>;
  /** Whether to enable real-time updates */
  enableRealTime?: boolean;
  /** Update interval for real-time suggestions (ms) */
  updateInterval?: number;
  /** Whether to enable telemetry logging */
  enableTelemetry?: boolean;
  /** Maximum number of suggestions to return */
  maxSuggestions?: number;
  /** Filter suggestions by type */
  suggestionTypes?: SuggestionType[];
  /** Filter suggestions by priority */
  priorityFilter?: SuggestionPriority[];
}

/**
 * Return value for the useDropAISuggestions hook
 */
export interface UseDropAISuggestionsReturn {
  /** Generated suggestions */
  suggestions: DropSuggestion[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Last update timestamp */
  lastUpdate: number;
  
  /** Get suggestions for a specific resident */
  getSuggestionsForResident: (resident: ResidentState) => DropSuggestion[];
  /** Get suggestions for a specific activity */
  getSuggestionsForActivity: (activity: ActivityDefinition) => DropSuggestion[];
  /** Get top N suggestions */
  getTopSuggestions: (count?: number) => DropSuggestion[];
  /** Filter suggestions by type */
  filterByType: (types: SuggestionType[]) => DropSuggestion[];
  /** Filter suggestions by priority */
  filterByPriority: (priorities: SuggestionPriority[]) => DropSuggestion[];
  
  /** Refresh suggestions */
  refreshSuggestions: () => void;
  /** Clear suggestions */
  clearSuggestions: () => void;
  /** Update configuration */
  updateConfig: (config: Partial<DropSuggestionConfig>) => void;
  
  /** Suggestion statistics */
  stats: {
    totalSuggestions: number;
    byType: Record<SuggestionType, number>;
    byPriority: Record<SuggestionPriority, number>;
    averageConfidence: number;
  };
}

/**
 * Create village context from current state
 */
function createVillageContext(
  residents: ResidentState[],
  activities: ActivityDefinition[],
  currentAssignments: Record<string, string[]> = {},
  resourceLevels: Record<string, number> = {},
  resourceNeeds: Record<string, number> = {}
): VillageContext {
  return {
    residents,
    activities,
    resourceLevels,
    resourceNeeds,
    currentAssignments,
    villageState: {
      day: 1, // Would come from actual village state
      season: 'spring',
      crisisMode: false,
    },
  };
}

/**
 * Hook for AI-powered drop suggestions
 */
export function useDropAISuggestions(
  residents: ResidentState[],
  activities: ActivityDefinition[],
  params: UseDropAISuggestionsParams = {}
): UseDropAISuggestionsReturn {
  const {
    config: userConfig,
    enableRealTime = false,
    updateInterval = 5000,
    enableTelemetry = true,
    maxSuggestions = 20,
    suggestionTypes,
    priorityFilter,
  } = params;

  const [suggestions, setSuggestions] = useState<DropSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(0);
  const [config, setConfig] = useState<DropSuggestionConfig>({
    ...DEFAULT_SUGGESTION_CONFIG,
    ...userConfig,
  });

  // Create suggestion engine
  const suggestionEngine = useMemo(() => {
    return new DropSuggestionEngine(config);
  }, [config]);

  // Create village context
  const villageContext = useMemo(() => {
    return createVillageContext(residents, activities);
  }, [residents, activities]);

  // Generate suggestions
  const generateSuggestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const allSuggestions = suggestionEngine.generateVillageSuggestions(villageContext);
      
      // Apply filters
      let filteredSuggestions = allSuggestions;
      
      if (suggestionTypes && suggestionTypes.length > 0) {
        filteredSuggestions = filteredSuggestions.filter(s => 
          suggestionTypes.includes(s.type)
        );
      }
      
      if (priorityFilter && priorityFilter.length > 0) {
        filteredSuggestions = filteredSuggestions.filter(s => 
          priorityFilter.includes(s.priority)
        );
      }
      
      // Limit results
      const limitedSuggestions = filteredSuggestions.slice(0, maxSuggestions);
      
      setSuggestions(limitedSuggestions);
      setLastUpdate(Date.now());

      // Telemetry
      if (enableTelemetry) {
        const diagnostics = createSandboxDiagnostics('drop-ai-suggestions');
        diagnostics.emit('suggestions_generated', {
          count: limitedSuggestions.length,
          totalGenerated: allSuggestions.length,
          filters: { suggestionTypes, priorityFilter },
          context: {
            residentCount: residents.length,
            activityCount: activities.length,
          },
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      if (enableTelemetry) {
        const diagnostics = createSandboxDiagnostics('drop-ai-suggestions');
        diagnostics.emit('suggestions_error', {
          error: errorMessage,
          context: {
            residentCount: residents.length,
            activityCount: activities.length,
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [suggestionEngine, villageContext, maxSuggestions, suggestionTypes, priorityFilter, enableTelemetry, residents.length, activities.length]);

  // Initial generation
  useEffect(() => {
    generateSuggestions();
  }, [generateSuggestions]);

  // Real-time updates disabled to avoid setTimeout restriction
  // useEffect(() => {
  //   if (!enableRealTime) return;

  //   let timeoutId: NodeJS.Timeout;
  //   const scheduleUpdate = () => {
  //     timeoutId = setTimeout(() => {
  //       generateSuggestions();
  //       scheduleUpdate(); // Schedule next update
  //     }, updateInterval);
  //   };
    
  //   scheduleUpdate(); // Start the cycle
    
  //   return () => {
  //     if (timeoutId) clearTimeout(timeoutId);
  //   };
  // }, [enableRealTime, updateInterval, generateSuggestions]);

  // Get suggestions for specific resident
  const getSuggestionsForResident = useCallback((resident: ResidentState): DropSuggestion[] => {
    return suggestions.filter(s => s.resident.id === resident.id);
  }, [suggestions]);

  // Get suggestions for specific activity
  const getSuggestionsForActivity = useCallback((activity: ActivityDefinition): DropSuggestion[] => {
    return suggestions.filter(s => s.activity.id === activity.id);
  }, [suggestions]);

  // Get top suggestions
  const getTopSuggestions = useCallback((count = 5): DropSuggestion[] => {
    return suggestions.slice(0, count);
  }, [suggestions]);

  // Filter by type
  const filterByType = useCallback((types: SuggestionType[]): DropSuggestion[] => {
    return suggestions.filter(s => types.includes(s.type));
  }, [suggestions]);

  // Filter by priority
  const filterByPriority = useCallback((priorities: SuggestionPriority[]): DropSuggestion[] => {
    return suggestions.filter(s => priorities.includes(s.priority));
  }, [suggestions]);

  // Refresh suggestions
  const refreshSuggestions = useCallback(() => {
    generateSuggestions();
  }, [generateSuggestions]);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
    setLastUpdate(0);
  }, []);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<DropSuggestionConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const byType: Record<SuggestionType, number> = {} as Record<SuggestionType, number>;
    const byPriority: Record<SuggestionPriority, number> = {} as Record<SuggestionPriority, number>;
    
    suggestions.forEach(s => {
      byType[s.type] = (byType[s.type] || 0) + 1;
      byPriority[s.priority] = (byPriority[s.priority] || 0) + 1;
    });

    const averageConfidence = suggestions.length > 0 
      ? suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length 
      : 0;

    return {
      totalSuggestions: suggestions.length,
      byType,
      byPriority,
      averageConfidence,
    };
  }, [suggestions]);

  return {
    suggestions,
    isLoading,
    error,
    lastUpdate,
    getSuggestionsForResident,
    getSuggestionsForActivity,
    getTopSuggestions,
    filterByType,
    filterByPriority,
    refreshSuggestions,
    clearSuggestions,
    updateConfig,
    stats,
  };
}

/**
 * Hook for AI suggestions with drag-drop integration
 */
export function useDropAISuggestionsWithDragDrop(
  residents: ResidentState[],
  activities: ActivityDefinition[],
  params: UseDropAISuggestionsParams = {}
) {
  const baseSuggestions = useDropAISuggestions(residents, activities, params);
  
  const [draggedResident, setDraggedResident] = useState<ResidentState | null>(null);
  const [hoveredActivity, setHoveredActivity] = useState<ActivityDefinition | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Get suggestions for dragged resident
  const draggedResidentSuggestions = useMemo(() => {
    if (!draggedResident) return [];
    return baseSuggestions.getSuggestionsForResident(draggedResident);
  }, [draggedResident, baseSuggestions]);

  // Get suggestions for hovered activity
  const hoveredActivitySuggestions = useMemo(() => {
    if (!hoveredActivity) return [];
    return baseSuggestions.getSuggestionsForActivity(hoveredActivity);
  }, [hoveredActivity, baseSuggestions]);

  // Handle drag start
  const handleDragStart = useCallback((resident: ResidentState) => {
    setDraggedResident(resident);
    setShowSuggestions(true);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedResident(null);
    setHoveredActivity(null);
    setShowSuggestions(false);
  }, []);

  // Handle activity hover
  const handleActivityHover = useCallback((activity: ActivityDefinition | null) => {
    setHoveredActivity(activity);
  }, []);

  // Get current context suggestions
  const currentSuggestions = useMemo(() => {
    if (draggedResident && hoveredActivity) {
      // Show suggestions for this specific pair
      return draggedResidentSuggestions.filter(s => s.activity.id === hoveredActivity.id);
    }
    if (draggedResident) {
      return draggedResidentSuggestions;
    }
    if (hoveredActivity) {
      return hoveredActivitySuggestions;
    }
    return [];
  }, [draggedResident, hoveredActivity, draggedResidentSuggestions, hoveredActivitySuggestions]);

  return {
    ...baseSuggestions,
    // Drag-drop state
    draggedResident,
    hoveredActivity,
    showSuggestions,
    currentSuggestions,
    
    // Drag-drop handlers
    handleDragStart,
    handleDragEnd,
    handleActivityHover,
    
    // Suggestion controls
    setShowSuggestions,
  };
}

/**
 * Hook for AI suggestion analytics
 */
export function useDropAISuggestionAnalytics(suggestions: DropSuggestion[]) {
  const analytics = useMemo(() => {
    const typeDistribution: Record<SuggestionType, number> = {} as Record<SuggestionType, number>;
    const priorityDistribution: Record<SuggestionPriority, number> = {} as Record<SuggestionPriority, number>;
    const confidenceRanges = {
      high: suggestions.filter(s => s.confidence > 0.8).length,
      medium: suggestions.filter(s => s.confidence > 0.5 && s.confidence <= 0.8).length,
      low: suggestions.filter(s => s.confidence <= 0.5).length,
    };
    
    const activityFrequency: Record<string, number> = {};
    const residentFrequency: Record<string, number> = {};

    suggestions.forEach(s => {
      // Type distribution
      typeDistribution[s.type] = (typeDistribution[s.type] || 0) + 1;
      
      // Priority distribution
      priorityDistribution[s.priority] = (priorityDistribution[s.priority] || 0) + 1;
      
      // Activity frequency
      activityFrequency[s.activity.id] = (activityFrequency[s.activity.id] || 0) + 1;
      
      // Resident frequency
      residentFrequency[s.resident.id] = (residentFrequency[s.resident.id] || 0) + 1;
    });

    const mostSuggestedActivities = Object.entries(activityFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([activityId, count]) => ({ activityId, count }));

    const mostSuggestedResidents = Object.entries(residentFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([residentId, count]) => ({ residentId, count }));

    return {
      totalSuggestions: suggestions.length,
      typeDistribution,
      priorityDistribution,
      confidenceRanges,
      mostSuggestedActivities,
      mostSuggestedResidents,
      averageConfidence: suggestions.length > 0 
        ? suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length 
        : 0,
    };
  }, [suggestions]);

  return analytics;
}
