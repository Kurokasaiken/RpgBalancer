import { useMemo, useCallback, useState, useEffect } from 'react';
import type { VillageState, ResidentState as Resident, ScheduledActivity } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';

/**
 * Priority levels for maintenance recommendations.
 */
export type MaintenancePriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Types of maintenance recommendations the advisor can provide.
 */
export type MaintenanceRecommendationType =
  | 'resource_management'
  | 'activity_scheduling'
  | 'resident_health'
  | 'quest_risk'
  | 'building_upgrade'
  | 'food_supply'
  | 'gold_allocation';

/**
 * A single maintenance recommendation from the AI advisor.
 */
export interface MaintenanceRecommendation {
  /** Unique identifier for this recommendation. */
  id: string;
  /** Type of maintenance recommendation. */
  type: MaintenanceRecommendationType;
  /** Priority level of this recommendation. */
  priority: MaintenancePriority;
  /** Human-readable title for the recommendation. */
  title: string;
  /** Detailed description of the recommendation. */
  description: string;
  /** Optional action that can be taken to address this recommendation. */
  action?: {
    label: string;
    callback: () => void;
  };
  /** Optional metadata for tracking and telemetry. */
  metadata?: Record<string, unknown>;
}

/**
 * Analysis result from the maintenance advisor.
 */
export interface MaintenanceAnalysis {
  /** Current timestamp of the analysis. */
  timestamp: number;
  /** All recommendations sorted by priority. */
  recommendations: MaintenanceRecommendation[];
  /** Summary metrics from the analysis. */
  summary: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    totalCount: number;
  };
}

/**
 * Hook for AI-powered maintenance advisor in Idle Village.
 * Analyzes village state and provides recommendations for optimal management.
 */
export interface UseMaintenanceAdvisorReturn {
  /** Current analysis result. */
  analysis: MaintenanceAnalysis | null;
  /** Whether the advisor is currently analyzing. */
  isAnalyzing: boolean;
  /** Force a fresh analysis. */
  analyze: () => void;
  /** Get recommendations filtered by priority. */
  getRecommendationsByPriority: (priority: MaintenancePriority) => MaintenanceRecommendation[];
  /** Get recommendations filtered by type. */
  getRecommendationsByType: (type: MaintenanceRecommendationType) => MaintenanceRecommendation[];
}

/**
 * Props for the useMaintenanceAdvisor hook.
 */
export interface UseMaintenanceAdvisorProps {
  /** Current village state to analyze. */
  villageState: VillageState;
  /** Available residents in the village. */
  residents: Resident[];
  /** Available activity definitions. */
  activities: ActivityDefinition[];
  /** Whether to enable automatic periodic analysis. */
  enableAutoAnalysis?: boolean;
  /** Interval for auto-analysis in milliseconds. */
  autoAnalysisInterval?: number;
}

/**
 * AI-powered maintenance advisor for Idle Village.
 * Provides intelligent recommendations for resource management, scheduling, and optimization.
 */
export function useMaintenanceAdvisor({
  villageState,
  residents,
  activities,
  enableAutoAnalysis = true,
  autoAnalysisInterval = 30000, // 30 seconds
}: UseMaintenanceAdvisorProps): UseMaintenanceAdvisorReturn {
  const { config } = useIdleVillageConfig();
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(Date.now());

  // Update timestamp periodically
  useEffect(() => {
    if (!enableAutoAnalysis) return;

    const interval = setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, autoAnalysisInterval);

    return () => clearInterval(interval);
  }, [enableAutoAnalysis, autoAnalysisInterval]);

  // Generate maintenance recommendations based on village state analysis
  const generateRecommendations = useCallback((): MaintenanceRecommendation[] => {
    const recommendations: MaintenanceRecommendation[] = [];

    if (!config?.globalRules) return recommendations;

    // 1. Resource Management Analysis
    analyzeResourceManagement(recommendations, villageState, config);

    // 2. Resident Health Analysis
    analyzeResidentHealth(recommendations, residents, villageState, config);

    // 3. Activity Scheduling Analysis
    analyzeActivityScheduling(recommendations, villageState, residents, activities, config);

    // 4. Food Supply Analysis
    analyzeFoodSupply(recommendations, villageState, residents, config);

    // 5. Quest Risk Analysis
    analyzeQuestRisk(recommendations, villageState, residents, activities, config);

    // 6. Building Upgrade Analysis
    analyzeBuildingUpgrades(recommendations, villageState, config);

    // 7. Gold Allocation Analysis
    analyzeGoldAllocation(recommendations, villageState, config);

    return recommendations;
  }, [villageState, residents, activities, config]);

  // Perform comprehensive analysis
  const analysis = useMemo((): MaintenanceAnalysis | null => {
    if (!villageState || !residents || !activities || !config) {
      return null;
    }

    const recommendations = generateRecommendations();
    const summary = {
      criticalCount: recommendations.filter(r => r.priority === 'critical').length,
      highCount: recommendations.filter(r => r.priority === 'high').length,
      mediumCount: recommendations.filter(r => r.priority === 'medium').length,
      lowCount: recommendations.filter(r => r.priority === 'low').length,
      totalCount: recommendations.length,
    };

    return {
      timestamp: currentTimestamp,
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
      summary,
    };
  }, [villageState, residents, activities, config, generateRecommendations, currentTimestamp]);

  const getRecommendationsByPriority = useCallback(
    (priority: MaintenancePriority): MaintenanceRecommendation[] => {
      return analysis?.recommendations.filter(r => r.priority === priority) ?? [];
    },
    [analysis]
  );

  const getRecommendationsByType = useCallback(
    (type: MaintenanceRecommendationType): MaintenanceRecommendation[] => {
      return analysis?.recommendations.filter(r => r.type === type) ?? [];
    },
    [analysis]
  );

  const analyze = useCallback(() => {
    // Force re-analysis by triggering the useMemo dependency
    // In a real implementation, this might trigger async analysis
    console.log('Maintenance Advisor: Performing fresh analysis');
  }, []);

  return {
    analysis,
    isAnalyzing: false, // Could be true during async analysis
    analyze,
    getRecommendationsByPriority,
    getRecommendationsByType,
  };
}

// Analysis helper functions

function analyzeResourceManagement(
  recommendations: MaintenanceRecommendation[],
  villageState: VillageState,
  config: { globalRules: { foodWarningThreshold?: number; goldWarningThreshold?: number } }
): void {
  const foodThreshold = config.globalRules.foodWarningThreshold ?? 50;
  const goldThreshold = config.globalRules.goldWarningThreshold ?? 100;

  if (villageState.resources.food < foodThreshold) {
    recommendations.push({
      id: 'food-critical',
      type: 'resource_management',
      priority: 'critical',
      title: 'Critical Food Shortage',
      description: `Food reserves are critically low (${villageState.resources.food}). Residents may starve soon. Prioritize food production or purchase food immediately.`,
      metadata: { currentFood: villageState.resources.food, threshold: foodThreshold },
    });
  } else if (villageState.resources.food < foodThreshold * 1.5) {
    recommendations.push({
      id: 'food-low',
      type: 'resource_management',
      priority: 'high',
      title: 'Low Food Reserves',
      description: `Food reserves are running low (${villageState.resources.food}). Consider increasing food production or allocating more workers to farming.`,
      metadata: { currentFood: villageState.resources.food, threshold: foodThreshold },
    });
  }

  if (villageState.resources.gold < goldThreshold) {
    recommendations.push({
      id: 'gold-low',
      type: 'resource_management',
      priority: 'medium',
      title: 'Low Gold Reserves',
      description: `Gold reserves are below recommended levels (${villageState.resources.gold}). Focus on income-generating activities or consider selling excess resources.`,
      metadata: { currentGold: villageState.resources.gold, threshold: goldThreshold },
    });
  }
}

function analyzeResidentHealth(
  recommendations: MaintenanceRecommendation[],
  _residents: Resident[],
  villageState: VillageState,
  _config: any
): void {
  const injuredResidents = Object.values(villageState.residents).filter(r => r.status === 'injured');
  const exhaustedResidents = Object.values(villageState.residents).filter(r => r.status === 'exhausted');
  const deadResidents = Object.values(villageState.residents).filter(r => r.status === 'dead');

  if (deadResidents.length > 0) {
    recommendations.push({
      id: 'deaths-reported',
      type: 'resident_health',
      priority: 'critical',
      title: 'Resident Deaths Reported',
      description: `${deadResidents.length} resident(s) have died. Consider safer activities or invest in protective equipment.`,
      metadata: { deadCount: deadResidents.length, deadResidents: deadResidents.map(r => r.displayName) },
    });
  }

  if (injuredResidents.length > 2) {
    recommendations.push({
      id: 'multiple-injuries',
      type: 'resident_health',
      priority: 'high',
      title: 'Multiple Injuries',
      description: `${injuredResidents.length} residents are injured. Review quest assignments and consider medical facilities.`,
      metadata: { injuredCount: injuredResidents.length },
    });
  }

  if (exhaustedResidents.length > Object.keys(villageState.residents).length * 0.5) {
    recommendations.push({
      id: 'mass-exhaustion',
      type: 'resident_health',
      priority: 'medium',
      title: 'Mass Resident Exhaustion',
      description: `Over 50% of residents are exhausted. Consider rest periods or fatigue management improvements.`,
      metadata: { exhaustedCount: exhaustedResidents.length, totalResidents: Object.keys(villageState.residents).length },
    });
  }
}

function analyzeActivityScheduling(
  recommendations: MaintenanceRecommendation[],
  villageState: VillageState,
  _residents: Resident[],
  _activities: ActivityDefinition[],
  config: any
): void {
  const availableResidents = Object.values(villageState.residents).filter(r => r.status === 'available');
  const activeActivities = Object.keys(villageState.activities).length;

  if (availableResidents.length > 0 && activeActivities === 0) {
    recommendations.push({
      id: 'idle-resources',
      type: 'activity_scheduling',
      priority: 'medium',
      title: 'Idle Workforce Available',
      description: `${availableResidents.length} residents are available but no activities are scheduled. Consider assigning them to productive tasks.`,
      metadata: { availableCount: availableResidents.length },
    });
  }

  // Check for over-scheduling
  const maxConcurrentActivities = config.globalRules.maxConcurrentActivities ?? 5;
  if (activeActivities > maxConcurrentActivities) {
    recommendations.push({
      id: 'over-scheduled',
      type: 'activity_scheduling',
      priority: 'low',
      title: 'Activities Over-Scheduled',
      description: `${activeActivities} activities are running concurrently. Consider staggering activities for better resource management.`,
      metadata: { activeCount: activeActivities, maxAllowed: maxConcurrentActivities },
    });
  }
}

function analyzeFoodSupply(
  recommendations: MaintenanceRecommendation[],
  villageState: VillageState,
  residents: Resident[],
  config: any
): void {
  const foodConsumptionPerDay = config.globalRules.foodConsumptionPerResidentPerDay ?? 2;
  const estimatedDailyConsumption = residents.length * foodConsumptionPerDay;
  const daysOfFoodLeft = Math.floor(villageState.resources.food / estimatedDailyConsumption);

  if (daysOfFoodLeft < 1) {
    recommendations.push({
      id: 'food-exhaustion-imminent',
      type: 'food_supply',
      priority: 'critical',
      title: 'Food Exhaustion Imminent',
      description: `Food supplies will be exhausted within 24 hours. Immediate food production or acquisition required.`,
      metadata: { daysLeft: daysOfFoodLeft, dailyConsumption: estimatedDailyConsumption },
    });
  } else if (daysOfFoodLeft < 3) {
    recommendations.push({
      id: 'food-shortage-warning',
      type: 'food_supply',
      priority: 'high',
      title: 'Food Shortage Warning',
      description: `Only ${daysOfFoodLeft} days of food remaining. Increase food production or rationing measures.`,
      metadata: { daysLeft: daysOfFoodLeft, dailyConsumption: estimatedDailyConsumption },
    });
  }
}

function analyzeQuestRisk(
  recommendations: MaintenanceRecommendation[],
  villageState: VillageState,
  _residents: Resident[],
  activities: ActivityDefinition[],
  config: any
): void {
  const questActivities = activities.filter(a => a.tags?.includes('quest'));
  const highRiskActivities = questActivities.filter(a =>
    (a.riskProfile?.injuryChance ?? 0) > 0.3 || (a.riskProfile?.deathChance ?? 0) > 0.1
  );

  if (highRiskActivities.length > 0) {
    recommendations.push({
      id: 'high-risk-quests',
      type: 'quest_risk',
      priority: 'medium',
      title: 'High-Risk Quests Available',
      description: `${highRiskActivities.length} high-risk quest(s) are available. Consider equipment upgrades or safer alternatives for valuable residents.`,
      metadata: { highRiskCount: highRiskActivities.length, questNames: highRiskActivities.map(a => a.label) },
    });
  }

  // Check if valuable residents are assigned to risky activities
  const valuableResidents = Object.values(villageState.residents).filter(r => (r.statSnapshot?.combat ?? 0) > 50);
  const riskyAssignments = Object.values(villageState.activities).filter(activity => {
    const activityDef = activities.find(a => a.id === activity.activityId);
    return valuableResidents.some(r => activity.characterIds?.includes(r.id)) &&
           activityDef && (activityDef.riskProfile?.deathChance ?? 0) > 0.05;
  });

  if (riskyAssignments.length > 0) {
    recommendations.push({
      id: 'valuable-resident-risk',
      type: 'quest_risk',
      priority: 'high',
      title: 'Valuable Residents at Risk',
      description: `High-value residents are assigned to dangerous quests. Consider reassigning them to safer activities.`,
      metadata: { riskyAssignmentCount: riskyAssignments.length },
    });
  }
}

function analyzeBuildingUpgrades(
  recommendations: MaintenanceRecommendation[],
  _villageState: VillageState,
  _config: any
): void {
  // This would analyze building levels vs village needs
  // For now, placeholder for future implementation
  // Since VillageState doesn't have buildings property yet, this is a no-op
  // const buildingsNeedingUpgrade = villageState.buildings?.filter(b =>
  //   (b.level ?? 1) < (config.buildings?.[b.id]?.maxLevel ?? 5)
  // );

  // if (buildingsNeedingUpgrade && buildingsNeedingUpgrade.length > 0) {
  //   recommendations.push({
  //     id: 'building-upgrades-available',
  //     type: 'building_upgrade',
  //     priority: 'low',
  //     title: 'Building Upgrades Available',
  //     description: `${buildingsNeedingUpgrade.length} building(s) can be upgraded. Consider investing in infrastructure improvements.`,
  //     metadata: { upgradableCount: buildingsNeedingUpgrade.length },
  //   });
  // }
}

function analyzeGoldAllocation(
  recommendations: MaintenanceRecommendation[],
  villageState: VillageState,
  config: any
): void {
  const goldReserves = villageState.resources.gold;
  const recommendedReserve = config.globalRules.recommendedGoldReserve ?? 500;

  if (goldReserves > recommendedReserve * 2) {
    recommendations.push({
      id: 'excess-gold',
      type: 'gold_allocation',
      priority: 'low',
      title: 'Excess Gold Reserves',
      description: `Gold reserves (${goldReserves}) exceed recommended levels. Consider investing in upgrades or expansions.`,
      metadata: { currentGold: goldReserves, recommended: recommendedReserve },
    });
  }
}
