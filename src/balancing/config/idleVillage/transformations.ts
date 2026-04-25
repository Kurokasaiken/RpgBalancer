/**
 * Transformation utilities from IdleVillageConfig to MinimalConfig
 * Implements config-first derivation to eliminate hardcoded minimal config values
 */

import type { IdleVillageConfig } from './types';
import type { MinimalConfig, MinimalHUDFieldConfig } from './minimalConfig';
import type { MinimalGameplayConfig } from './minimalGameplayConfig';

// Extend IdleVillageConfig to include UI properties for transformation
interface ExtendedIdleVillageConfig extends IdleVillageConfig {
  ui?: {
    hud: { fields: MinimalHUDFieldConfig[]; layout: string };
    actionPanel: { buttons: any[]; layout: string };
    tooltips: { sections: Record<string, any> };
    thresholds: { foodDangerDays: number; fatigueDangerPercent: number };
  };
}

/**
 * Transforms IdleVillageConfig to MinimalConfig by deriving values from the full config
 * Includes validation and error handling for edge cases
 */
export function transformIdleVillageToMinimalConfig(
  idleConfig: IdleVillageConfig,
  version: string = '0.1.0-minimal-derived'
): MinimalConfig {
  // Validate input config
  if (!idleConfig) {
    throw new Error('IdleVillageConfig is required for transformation');
  }

  if (!idleConfig.globalRules) {
    throw new Error('IdleVillageConfig must have globalRules for transformation');
  }

  if (!idleConfig.activities || Object.keys(idleConfig.activities).length === 0) {
    console.warn('IdleVillageConfig has no activities, using empty activities array');
  }

  // Cast to extended config to access UI properties
  const extendedConfig = idleConfig as ExtendedIdleVillageConfig;

  return {
    version,
    loop: deriveLoopConfig(),
    globalRules: deriveGlobalRules(idleConfig),
    startingResources: deriveStartingResources(idleConfig),
    activities: deriveActivities(idleConfig),
    ui: deriveUIConfig(extendedConfig),
    eventLog: deriveEventLogConfig(),
    buildings: deriveBuildings(idleConfig),
    nightThreat: deriveNightThreatConfig(),
  };
}

/**
 * Derives loop configuration (timing settings)
 * These are engine/UI timing constants, using sensible defaults
 */
function deriveLoopConfig() {
  return {
    tickIntervalMs: 1000,
    autosaveIntervalMs: 30000,
    warmupDelayMs: 1200,
    maxSpeedMultiplier: 5,
    defaultSpeedMultiplier: 1,
  };
}

/**
 * Derives global rules from IdleVillageConfig
 * Maps matching fields where possible
 */
function deriveGlobalRules(idleConfig: IdleVillageConfig) {
  const globalRules = idleConfig.globalRules;

  return {
    baseFoodPriceInGold: globalRules.baseFoodPriceInGold || 1,
    maxActiveQuests: globalRules.maxActiveQuests || 1,
    dailyFoodConsumptionPerResident: globalRules.foodConsumptionPerResidentPerDay || 2,
    fatigueDecayPerRestTick: globalRules.fatigueRecoveryPerDay || 5,
    injuryProbabilityThreshold: globalRules.baseLightInjuryChanceAtMaxFatigue || 0.05,
    dayLengthInTimeUnits: globalRules.dayLengthInTimeUnits || 60,
    dayNightCycle: globalRules.dayNightCycle ? {
      dayTimeUnits: globalRules.dayNightCycle.dayTimeUnits,
      nightTimeUnits: globalRules.dayNightCycle.nightTimeUnits,
    } : {
      dayTimeUnits: 40,
      nightTimeUnits: 20,
    },
    secondsPerTimeUnit: globalRules.secondsPerTimeUnit || 1,
    rngSeed: globalRules.defaultRandomSeed || 734_003,
  };
}

/**
 * Derives starting resources from IdleVillageConfig
 * Uses globalRules.startingResources if available, otherwise defaults
 */
function deriveStartingResources(idleConfig: IdleVillageConfig) {
  const startingResources = idleConfig.globalRules.startingResources || {};

  return {
    gold: startingResources.gold || 15,
    food: startingResources.food || 8,
    maxFood: startingResources.food ? startingResources.food * 2.5 : 25,
    residents: deriveStartingResidents(idleConfig),
  };
}

/**
 * Derives starting residents from config or provides fallback
 * Reads from idleConfig.globalRules.startingResidents if available
 */
function deriveStartingResidents(idleConfig: IdleVillageConfig) {
  // Read from config if available, otherwise fallback to hardcoded residents
  if (idleConfig.globalRules.startingResidents && idleConfig.globalRules.startingResidents.length > 0) {
    return idleConfig.globalRules.startingResidents.map(template => ({
      id: template.id,
      name: template.name,
      stats: template.stats,
      fatigue: template.fatigue || 0,
      isInjured: template.isInjured || false,
      level: template.level || 1,
    }));
  }
  
  // Fallback to hardcoded residents for compatibility
  return [
    {
      id: 'resident-1',
      name: 'Aurora Calder',
      stats: { strength: 6, endurance: 5, agility: 4, intelligence: 3, perception: 4 },
      fatigue: 0,
      isInjured: false,
      level: 1,
    },
    {
      id: 'resident-2',
      name: 'Marcus Stone',
      stats: { strength: 7, endurance: 6, agility: 3, intelligence: 2, perception: 3 },
      fatigue: 0,
      isInjured: false,
      level: 1,
    },
    {
      id: 'resident-3',
      name: 'Luna Swift',
      stats: { strength: 4, endurance: 4, agility: 7, intelligence: 5, perception: 6 },
      fatigue: 0,
      isInjured: false,
      level: 1,
    },
    {
      id: 'resident-4',
      name: 'Thorin Ironforge',
      stats: { strength: 8, endurance: 7, agility: 2, intelligence: 3, perception: 2 },
      fatigue: 0,
      isInjured: false,
      level: 1,
    },
  ];
}

/**
 * Derives activities from IdleVillageConfig activities
 * Filters for job/quest/market activities and transforms to MinimalActivity format
 */
function deriveActivities(idleConfig: IdleVillageConfig): MinimalConfig['activities'] {
  const activities = Object.values(idleConfig.activities || {});

  return activities
    .filter(activity => {
      // Include activities that are jobs, quests, or market-related
      return activity.tags.some(tag => ['job', 'quest'].includes(tag)) ||
             activity.id.includes('market');
    })
    .map(activity => {
      try {
        return {
          id: activity.id || 'unknown-activity',
          name: activity.label || activity.id || 'Unknown Activity',
          type: deriveActivityType(activity),
          baseReward: deriveBaseReward(activity),
          cost: deriveCost(activity),
          durationTicks: deriveDurationTicks(activity),
          durationMs: deriveDurationMs(activity), // Added for vertical slice
          dangerRating: activity.dangerRating || 0, // Added for vertical slice
          statRequirements: activity.statRequirement?.allOf ? Object.fromEntries(
            activity.statRequirement.allOf.map(stat => [stat, 3]) // Default requirement level
          ) : undefined,
          fatiguePerTick: activity.dailyFatigueCost ? activity.dailyFatigueCost / 10 : 0, // Rough estimate
        };
      } catch (error) {
        console.warn(`Failed to transform activity ${activity.id}:`, error);
        // Return a minimal fallback activity
        return {
          id: activity.id || 'fallback-activity',
          name: activity.label || 'Fallback Activity',
          type: 'job' as const,
          baseReward: { gold: 0, food: 0, wood: 0, xp: 0 }, // Added wood, xp
          cost: { gold: 0, food: 0 },
          durationTicks: 1,
          durationMs: undefined,
          dangerRating: 0, // Added dangerRating
          fatiguePerTick: 0,
        };
      }
    });
}

/**
 * Derives activity type from IdleVillageConfig activity tags
 */
function deriveActivityType(activity: IdleVillageConfig['activities'][string]): 'job' | 'quest' | 'market' {
  if (activity.tags.includes('quest')) return 'quest';
  if (activity.id.includes('market')) return 'market';
  return 'job'; // Default to job
}

/**
 * Derives base reward from activity rewards
 */
function deriveBaseReward(activity: IdleVillageConfig['activities'][string]) {
  try {
    // Look for gold, food, wood, and xp rewards
    const goldReward = activity.rewards?.find(r => r.resourceId === 'gold')?.amountFormula || '0';
    const foodReward = activity.rewards?.find(r => r.resourceId === 'food')?.amountFormula || '0';
    const woodReward = activity.rewards?.find(r => r.resourceId === 'wood')?.amountFormula || '0';
    const xpReward = activity.rewards?.find(r => r.resourceId === 'xp')?.amountFormula || '0';

    // For minimal config, we need static numbers, so evaluate simple formulas
    const gold = parseSimpleFormula(goldReward) || 0;
    const food = parseSimpleFormula(foodReward) || 0;
    const wood = parseSimpleFormula(woodReward) || 0;   // Added for vertical slice
    const xp = parseSimpleFormula(xpReward) || 0;       // Added for vertical slice

    return { gold, food, wood, xp };
  } catch (error) {
    console.warn(`Failed to derive reward for activity ${activity.id}:`, error);
    return { gold: 0, food: 0, wood: 0, xp: 0 };
  }
}

/**
 * Derives cost from activity costs
 */
function deriveCost(activity: IdleVillageConfig['activities'][string]) {
  try {
    // Look for gold and food costs
    const goldCost = activity.costs?.find(c => c.resourceId === 'gold')?.amountFormula || '0';
    const foodCost = activity.costs?.find(c => c.resourceId === 'food')?.amountFormula || '0';

    const gold = parseSimpleFormula(goldCost) || 0;
    const food = parseSimpleFormula(foodCost) || 0;

    return { gold, food };
  } catch (error) {
    console.warn(`Failed to derive cost for activity ${activity.id}:`, error);
    return { gold: 0, food: 0 };
  }
}

/**
 * Derives duration ticks from activity
 */
function deriveDurationTicks(activity: IdleVillageConfig['activities'][string]): number {
  if (activity.durationFormula) {
    return parseSimpleFormula(activity.durationFormula) || 4;
  }

  // Fallback based on activity type
  if (activity.tags.includes('quest')) return 6;
  if (activity.id.includes('market')) return 1;
  return 4; // Default for jobs
}

/**
 * Derives duration in milliseconds from activity (preserves real duration)
 */
function deriveDurationMs(activity: IdleVillageConfig['activities'][string]): number | undefined {
  if (activity.durationFormula) {
    const ms = parseSimpleFormula(activity.durationFormula);
    return ms ? ms : undefined; // Return the actual ms value if valid
  }
  return undefined; // No duration formula, let engine use ticks
}

/**
 * Parses simple formulas like "10" or "level * 5"
 * For minimal config, we need static values, so this is a basic implementation
 */
function parseSimpleFormula(formula: string): number | undefined {
  // Remove spaces and handle simple cases
  const cleanFormula = formula.replace(/\s+/g, '');

  // Try to parse as a simple number
  const numValue = parseFloat(cleanFormula);
  if (!isNaN(numValue) && isFinite(numValue)) {
    return Math.max(0, numValue);
  }

  // For complex formulas, return undefined (will use defaults)
  return undefined;
}

/**
 * Derives UI configuration
 * Uses UI config from IdleVillageConfig if available, otherwise uses defaults
 */
function deriveUIConfig(idleConfig: ExtendedIdleVillageConfig) {
  // Use UI config from IdleVillageConfig if available, otherwise use defaults
  const uiConfig = idleConfig.ui || {
    hud: { fields: [], layout: 'horizontal' },
    actionPanel: { buttons: [], layout: 'horizontal' },
    tooltips: { sections: {} },
    thresholds: { foodDangerDays: 2, fatigueDangerPercent: 75 },
  };

  return {
    hudFields: [
      { id: 'day' as const, label: 'Day', format: 'day-label' as const, supportsWarningBadge: false },
      { id: 'gold' as const, label: 'Gold', format: 'integer' as const, supportsWarningBadge: false },
      { id: 'food' as const, label: 'Food', format: 'fraction' as const, supportsWarningBadge: true },
      { id: 'fatigue' as const, label: 'Fatigue', format: 'percentage' as const, supportsWarningBadge: true },
    ],
    tokens: {
      accentHex: '#c9a227',
      heroBackground: 'linear-gradient(135deg, rgba(14,22,30,0.92), rgba(7,11,17,0.8))',
      cardRadiusPx: 24,
      dangerHex: '#ef4444',
    },
    warningThresholds: {
      fatigueDangerPercent: uiConfig.thresholds.fatigueDangerPercent,
      foodDangerDays: uiConfig.thresholds.foodDangerDays,
      injuryBadgeCopy: 'Ferito',
    },
    thresholds: {
      fatigueDangerPercent: uiConfig.thresholds.fatigueDangerPercent,
      foodDangerDays: uiConfig.thresholds.foodDangerDays,
      injuryBadgeCopy: 'Ferito',
    },
    actionPanel: {
      buyFood: {
        label: 'Buy Food',
        tooltip: 'Buy food for the village',
        iconToken: '🍞',
        defaultQuantity: 1,
      },
      startQuestDemo: {
        label: 'Start Quest',
        tooltip: 'Start a demo quest',
        iconToken: '⚔️',
      },
      upgradeBuilding: {
        label: 'Upgrade',
        tooltip: 'Upgrade building',
        iconToken: '🔨',
        targetBuildingId: 'village_market',
      },
    },
    tooltips: {
      policy: {
        showDelayMs: 200,
        hideDelayMs: 200,
        showOnHover: true,
        showOnFocus: true,
        autoHideDurationMs: 2000,
        disableHoverableContent: false,
        skipDelayDuration: false,
      },
      hudResources: {
        entries: {
          gold: 'Gold used for wages and upgrades',
          food: 'Daily food consumption for residents',
          day: 'Current day in the village',
          fatigue: 'Average resident fatigue level',
        },
        iconToken: '💰',
      },
      workerTraits: {
        entries: {
          endurance: 'Physical stamina and durability',
          agility: 'Speed and coordination',
          intelligence: 'Problem solving and learning',
          perception: 'Awareness and observation',
        },
        iconToken: '👤',
      },
      slotStatus: {
        entries: {
          available: 'Ready for work assignment',
          occupied: 'Currently working on activity',
          blocked: 'Unavailable due to conditions',
        },
        iconToken: '📍',
      },
    },
    warningCopy: {
      fatigueHigh: 'Fatica critica sui residenti',
      fatigueRecovered: 'Fatica sotto controllo',
      foodLow: 'Scorte di cibo critiche',
      foodRecovered: 'Scorte di cibo stabili',
    },
    warningTokens: {
      injuryBadgeCopy: 'Ferito',
      foodHex: '#ef4444',
      safeHex: '#10b981',
      textHex: '#f3f4f6',
      fatigueHex: '#f59e0b',
    },
    errorMessages: {
      insufficientGold: 'Insufficient gold',
      residentBusy: 'Resident busy',
      questLocked: 'Quest locked',
      upgradeLocked: 'Upgrade locked',
    },
    logDisplayLimit: 100,
    logPanel: {
      maxEntries: 10,
      severityPalette: {
        info: { backgroundColor: 'rgb(59, 130, 246)', color: 'rgb(255, 255, 255)', icon: 'ℹ️' },
        success: { backgroundColor: 'rgb(34, 197, 94)', color: 'rgb(255, 255, 255)', icon: '✅' },
        warning: { backgroundColor: 'rgb(251, 191, 36)', color: 'rgb(0, 0, 0)', icon: '⚠️' },
        error: { backgroundColor: 'rgb(239, 68, 68)', color: 'rgb(255, 255, 255)', icon: '❌' },
      },
      emptyState: {
        title: 'No Events',
        description: 'No events yet',
        icon: '📋',
      },
      ariaLabels: {
        panelLabel: 'Event log',
        entryLabel: 'Event entry',
        emptyStateDescription: 'No events yet',
        loadingLabel: 'Loading...',
      },
    },
    statusTokens: {
      entries: {
        endurance: 'Endurance',
        agility: 'Agility',
        intelligence: 'Intelligence',
        perception: 'Perception',
      },
      injured: 'Injured',
      exhausted: 'Exhausted',
    },
    dropFeedbackTokens: {
      entries: {
        active: 'Active',
        blocked: 'Blocked',
        warning: 'Warning',
        valid_drop: 'Valid',
        invalid_drop: 'Invalid',
      },
    },
    tooltipTokens: {
      entries: {
        description: 'Description',
        iconToken: 'Icon',
        defaultQuantity: 'Quantity',
      },
    },
    statusPanel: {
      entries: {
        entryLabel: 'Entry',
        emptyStateDescription: 'No entries',
        loadingLabel: 'Loading...',
      },
    },
    tooltipConfig: {
      hideDelayMs: 200,
      showOnHover: true,
      showOnFocus: true,
      autoHideDurationMs: 2000,
      disableHoverableContent: false,
      skipDelayDuration: 500,
    },
    modalConfig: {
      closeOnEscape: true,
      closeOnBackdropClick: true,
    },
    gameOver: {
      reasons: {
        food_depleted: {
          title: 'Game Over',
          description: 'Your village has fallen due to food depletion.',
          restartButton: 'Start New Game',
        },
        all_injured: {
          title: 'Game Over',
          description: 'All residents are injured and cannot work.',
          restartButton: 'Start New Game',
        },
        manual_reset: {
          title: 'Game Over',
          description: 'The village has been reset.',
          restartButton: 'Start New Game',
        },
      },
      statsLayout: {
        daysSurvived: { label: 'Days Survived', format: 'integer' as const },
        goldEarned: { label: 'Gold Earned', format: 'integer' as const },
        questsCompleted: { label: 'Quests Completed', format: 'integer' as const },
        residentsLost: { label: 'Residents Lost', format: 'integer' as const },
      },
      modalTitle: 'Game Over',
      closeOnEscape: true,
      closeOnBackdropClick: true,
    },
  };
}

/**
 * Derives event log configuration
 * Uses default event templates from DEFAULT_MINIMAL_CONFIG
 */
function deriveEventLogConfig() {
  return {
    templates: {
      activity_scheduled: {
        severity: 'info' as const,
        message: '{residentName} scheduled {activityName}',
      },
      activity_started: {
        severity: 'info' as const,
        message: '{residentName} started {activityName}',
      },
      activity_completed: {
        severity: 'success' as const,
        message: '{residentName} completed {activityName} (+{rewardGold} gold, +{rewardFood} food)',
      },
      activity_cancelled: {
        severity: 'warning' as const,
        message: '{activityName} cancelled for {residentName}',
      },
      activity_failed: {
        severity: 'error' as const,
        message: '{activityName} failed ({reason})',
      },
      fatigue_decay: {
        severity: 'info' as const,
        message: 'Fatigue recovered: -{fatigueDelta}',
      },
      fatigue_warning: {
        severity: 'warning' as const,
        message: 'High fatigue detected for {residentName} ({fatigue}%)',
      },
      night_threat_warning: {
        severity: 'warning' as const,
        message: 'La minaccia notturna arriverà in {daysRemaining} giorni',
      },
      night_threat_resolved: {
        severity: 'success' as const,
        message: 'La minaccia notturna è stata contenuta ({eventLabel})',
      },
      night_threat_attack: {
        severity: 'error' as const,
        message: '{eventLabel} ha colpito il villaggio ({effectDescription})',
      },
    },
  };
}

/**
 * Derives buildings from activities that are jobs
 * Creates minimal building definitions for job activities
 */
function deriveBuildings(idleConfig: IdleVillageConfig) {
  const jobActivities = Object.values(idleConfig.activities).filter(activity =>
    activity.tags.includes('job')
  );

  return jobActivities.map(activity => ({
    id: `building_${activity.id}`,
    label: activity.label,
    description: activity.description || `Building for ${activity.label}`,
    icon: activity.metadata?.icon as string || '🏚️',
    activityId: activity.id,
    baseSlots: 1,
    upgrades: [], // Could be derived from building definitions in idleConfig
  }));
}

/**
 * Derives night threat configuration
 * Uses default night threat from DEFAULT_MINIMAL_CONFIG
 */
function deriveNightThreatConfig() {
  return {
    countdownLabel: 'Night Threat',
    initialCountdownDays: 3,
    spySlotId: 'night_spy_slot',
    spyTooltip: 'Assegna una spia per mitigare l\'evento notturno.',
    events: [
      {
        id: 'wolf_pack',
        label: 'Branco di Lupi',
        description: 'Consumano il doppio del cibo e possono ferire un residente.',
        countdownDays: 3,
        effect: {
          foodMultiplier: 2,
          additionalFoodLoss: 2,
          fatigueSpike: 5,
        },
        spyMitigation: {
          successRate: 0.65,
          mitigationDescription: 'La spia disperde il branco e recupera 10 gold in pelli.',
        },
      },
    ],
    logDisplayLimit: 5,
    logPanel: {
      maxEntries: 10,
      severityPalette: {
        info: { backgroundColor: 'rgb(59, 130, 246)', color: 'rgb(255, 255, 255)', icon: 'ℹ️' },
        success: { backgroundColor: 'rgb(34, 197, 94)', color: 'rgb(255, 255, 255)', icon: '✅' },
        warning: { backgroundColor: 'rgb(251, 191, 36)', color: 'rgb(0, 0, 0)', icon: '⚠️' },
        error: { backgroundColor: 'rgb(239, 68, 68)', color: 'rgb(255, 255, 255)', icon: '❌' },
      },
      emptyState: {
        title: 'Nessun evento',
        description: 'Nessuna attività registrata finora',
        icon: '📋',
      },
      ariaLabels: {
        panelLabel: 'Pannello eventi di gioco',
        entryLabel: 'Evento di gioco',
        emptyStateDescription: 'Nessun evento di gioco registrato',
        loadingLabel: 'Caricamento eventi...',
      },
    },
    tooltips: {
      policy: {
        showDelayMs: 500,
        hideDelayMs: 200,
        showOnHover: true,
        showOnFocus: true,
        autoHideDurationMs: 0,
        disableHoverableContent: false,
        skipDelayDuration: false,
      },
      hudResources: {
        iconToken: '💰',
        entries: {
          gold: 'Current gold reserves. Earned from mining and other activities.',
          food: 'Food supplies remaining. Consumed daily by residents.',
          day: 'Current day in the village cycle. Advances with time.',
          fatigue: 'Average resident fatigue level. High fatigue reduces efficiency.',
        },
      },
      workerTraits: {
        iconToken: '👥',
        entries: {
          strength: 'Physical power for mining and combat activities.',
          endurance: 'Stamina for long-duration activities and fatigue resistance.',
          agility: 'Speed and reflexes for hunting and scouting tasks.',
          intelligence: 'Problem-solving ability for complex quests and crafting.',
          perception: 'Awareness and detection skills for exploration.',
          injured: 'This resident is injured and cannot work until recovered.',
          exhausted: 'This resident is too exhausted to work effectively.',
        },
      },
      slotStatus: {
        iconToken: '📍',
        entries: {
          idle: 'Activity slot is available for assignment.',
          active: 'Activity is currently in progress.',
          blocked: 'This slot is locked or unavailable.',
          warning: 'Assignment may have risks or requirements.',
          valid_drop: 'This resident can be assigned here.',
          invalid_drop: 'This resident cannot be assigned here.',
        },
      },
    },
    gameOver: {
      reasons: {
        food_depleted: {
          title: 'Scorte Esaurite',
          description: 'Le scorte di cibo sono terminate. Tutti i residenti hanno lasciato il villaggio.',
          restartButton: 'Ricomincia',
        },
        all_injured: {
          title: 'Tutti Feriti',
          description: 'Tutti i residenti sono feriti e non possono più lavorare. Il villaggio non può continuare.',
          restartButton: 'Ricomincia',
        },
        manual_reset: {
          title: 'Riavvio Manuale',
          description: 'Hai scelto di ricominciare il gioco.',
          restartButton: 'Ricomincia',
        },
      },
      statsLayout: {
        daysSurvived: {
          label: 'Giorni sopravvissuti',
          format: 'integer' as const,
        },
        goldEarned: {
          label: 'Oro guadagnato',
          format: 'integer' as const,
        },
        questsCompleted: {
          label: 'Quest completate',
          format: 'integer' as const,
        },
        residentsLost: {
          label: 'Residenti persi',
          format: 'integer' as const,
        },
      },
      modalTitle: 'Game Over',
      closeOnEscape: true,
      closeOnBackdropClick: false,
    },
  };
}

