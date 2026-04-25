/**
 * Survival Engine for Idle Village
 * 
 * Core logic for food consumption, day ticks, and game over conditions.
 * All calculations are config-driven with no hardcoded values.
 * 
 * @module SurvivalEngine
 */

import type {
  SurvivalState,
  FoodState,
  DayTickResult,
  ConsumptionRate,
  GameOverReason,
  DaysRemainingResult,
  WarningLevel,
} from '../../../balancing/config/idleVillage/types/survivalTypes';
import { getWarningLevel } from '../../../balancing/config/idleVillage/survivalConfig';
import type { WarningThresholds } from '../../../balancing/config/idleVillage/types/survivalTypes';

/**
 * Resident info for consumption calculation
 */
export interface ResidentInfo {
  residentId: string;
  isWorking: boolean;
  isInjured: boolean;
}

/**
 * Calculates food consumption for a day tick
 * 
 * @param residents - Array of resident info
 * @param consumptionRate - Consumption rate configuration
 * @returns Total food consumed
 */
export function calculateDayConsumption(
  residents: ResidentInfo[],
  consumptionRate: ConsumptionRate
): number {
  let totalConsumption = 0;
  
  for (const resident of residents) {
    let consumption = consumptionRate.basePerResidentPerDay;
    
    // Apply working multiplier
    if (resident.isWorking) {
      consumption *= consumptionRate.workingMultiplier;
    }
    
    // Apply injured multiplier
    if (resident.isInjured) {
      consumption *= consumptionRate.injuredMultiplier;
    }
    
    totalConsumption += consumption;
  }
  
  return totalConsumption;
}

/**
 * Processes a day tick and updates food state
 * 
 * @param state - Current survival state
 * @param residents - Current residents
 * @param consumptionRate - Consumption rate configuration
 * @param warningThresholds - Warning threshold configuration
 * @returns Day tick result
 */
export function processDayTick(
  state: SurvivalState,
  residents: ResidentInfo[],
  consumptionRate: ConsumptionRate,
  warningThresholds: WarningThresholds
): DayTickResult {
  // Calculate consumption
  const foodConsumed = calculateDayConsumption(residents, consumptionRate);
  
  // Update food amount
  const newFoodAmount = Math.max(0, state.food.currentFood - foodConsumed);
  
  // Determine warning level
  const warningLevel = getWarningLevel(
    newFoodAmount,
    state.food.maxFood,
    warningThresholds
  );
  
  // Check for game over
  const gameOver = newFoodAmount <= 0;
  const gameOverReason: GameOverReason | undefined = gameOver ? 'starvation' : undefined;
  
  return {
    foodConsumed,
    newFoodAmount,
    warningLevel,
    gameOver,
    gameOverReason,
  };
}

/**
 * Checks if game over conditions are met
 * 
 * @param state - Current survival state
 * @param residents - Current residents
 * @returns Game over reason if conditions met, undefined otherwise
 */
export function checkGameOverConditions(
  state: SurvivalState,
  residents: ResidentInfo[]
): GameOverReason | undefined {
  // Check starvation
  if (state.food.currentFood <= 0) {
    return 'starvation';
  }
  
  // Check total wipeout (no residents left)
  if (residents.length === 0) {
    return 'total_wipeout';
  }
  
  return undefined;
}

/**
 * Calculates days remaining until starvation
 * 
 * @param currentFood - Current food amount
 * @param residents - Current residents
 * @param consumptionRate - Consumption rate configuration
 * @returns Days remaining result
 */
export function calculateDaysRemaining(
  currentFood: number,
  residents: ResidentInfo[],
  consumptionRate: ConsumptionRate
): DaysRemainingResult {
  if (residents.length === 0) {
    return {
      daysRemaining: Infinity,
      isAccurate: false,
      warningMessage: 'No residents to consume food',
    };
  }
  
  if (currentFood <= 0) {
    return {
      daysRemaining: 0,
      isAccurate: true,
      warningMessage: 'Out of food!',
    };
  }
  
  // Calculate average daily consumption
  const dailyConsumption = calculateDayConsumption(residents, consumptionRate);
  
  if (dailyConsumption <= 0) {
    return {
      daysRemaining: Infinity,
      isAccurate: false,
      warningMessage: 'No consumption calculated',
    };
  }
  
  const daysRemaining = currentFood / dailyConsumption;
  
  return {
    daysRemaining,
    isAccurate: true,
  };
}

/**
 * Triggers game over and updates state
 * 
 * @param state - Current survival state
 * @param reason - Game over reason
 * @param finalStats - Final statistics
 * @returns Updated survival state
 */
export function triggerGameOver(
  state: SurvivalState,
  reason: GameOverReason,
  finalStats?: {
    totalFoodConsumed: number;
    totalGoldEarned: number;
    totalQuestsCompleted: number;
    residentsLost: number;
  }
): SurvivalState {
  return {
    ...state,
    gameOver: {
      isGameOver: true,
      reason,
      timestamp: Date.now(),
      daysSurvived: state.currentDay,
      finalStats,
    },
    lastUpdate: Date.now(),
  };
}

/**
 * Updates food state after consumption
 * 
 * @param state - Current survival state
 * @param tickResult - Day tick result
 * @returns Updated survival state
 */
export function updateFoodState(
  state: SurvivalState,
  tickResult: DayTickResult
): SurvivalState {
  const newFoodState: FoodState = {
    currentFood: tickResult.newFoodAmount,
    maxFood: state.food.maxFood,
    totalConsumed: state.food.totalConsumed + tickResult.foodConsumed,
    lastConsumptionTime: Date.now(),
    warningLevel: tickResult.warningLevel,
  };
  
  return {
    ...state,
    food: newFoodState,
    currentDay: state.currentDay + 1,
    lastUpdate: Date.now(),
  };
}

/**
 * Adds food to current stock
 * 
 * @param state - Current survival state
 * @param amount - Amount of food to add
 * @param warningThresholds - Warning threshold configuration
 * @returns Updated survival state
 */
export function addFood(
  state: SurvivalState,
  amount: number,
  warningThresholds: WarningThresholds
): SurvivalState {
  const newAmount = Math.min(
    state.food.currentFood + amount,
    state.food.maxFood
  );
  
  const warningLevel = getWarningLevel(
    newAmount,
    state.food.maxFood,
    warningThresholds
  );
  
  return {
    ...state,
    food: {
      ...state.food,
      currentFood: newAmount,
      warningLevel,
    },
    lastUpdate: Date.now(),
  };
}

/**
 * Removes food from current stock
 * 
 * @param state - Current survival state
 * @param amount - Amount of food to remove
 * @param warningThresholds - Warning threshold configuration
 * @returns Updated survival state
 */
export function removeFood(
  state: SurvivalState,
  amount: number,
  warningThresholds: WarningThresholds
): SurvivalState {
  const newAmount = Math.max(0, state.food.currentFood - amount);
  
  const warningLevel = getWarningLevel(
    newAmount,
    state.food.maxFood,
    warningThresholds
  );
  
  return {
    ...state,
    food: {
      ...state.food,
      currentFood: newAmount,
      warningLevel,
    },
    lastUpdate: Date.now(),
  };
}

/**
 * Resets survival state to initial values
 * 
 * @param initialState - Initial survival state
 * @returns Reset survival state
 */
export function resetSurvivalState(initialState: SurvivalState): SurvivalState {
  return {
    ...initialState,
    currentDay: 0,
    gameOver: {
      isGameOver: false,
    },
    lastUpdate: Date.now(),
  };
}

/**
 * Pauses or resumes the day timer
 * 
 * @param state - Current survival state
 * @param paused - Whether to pause
 * @returns Updated survival state
 */
export function setDayPaused(
  state: SurvivalState,
  paused: boolean
): SurvivalState {
  return {
    ...state,
    dayConfig: {
      ...state.dayConfig,
      paused,
    },
    lastUpdate: Date.now(),
  };
}

/**
 * Sets the day speed multiplier
 * 
 * @param state - Current survival state
 * @param multiplier - Speed multiplier (1x, 2x, 5x)
 * @returns Updated survival state
 */
export function setDaySpeed(
  state: SurvivalState,
  multiplier: number
): SurvivalState {
  return {
    ...state,
    dayConfig: {
      ...state.dayConfig,
      speedMultiplier: Math.max(0.1, multiplier),
    },
    lastUpdate: Date.now(),
  };
}

/**
 * Gets warning message for current food level
 * 
 * @param warningLevel - Current warning level
 * @param daysRemaining - Days remaining until starvation
 * @returns Warning message
 */
export function getWarningMessage(
  warningLevel: WarningLevel,
  daysRemaining: number
): string {
  switch (warningLevel) {
    case 'critical':
      return `Critical! Only ${Math.floor(daysRemaining)} days of food remaining!`;
    case 'low':
      return `Warning: Food supplies running low. ${Math.floor(daysRemaining)} days remaining.`;
    case 'safe':
      return `Food supplies adequate. ${Math.floor(daysRemaining)} days remaining.`;
  }
}

/**
 * Calculates food percentage
 * 
 * @param currentFood - Current food amount
 * @param maxFood - Maximum food capacity
 * @returns Food percentage (0-1)
 */
export function getFoodPercentage(
  currentFood: number,
  maxFood: number
): number {
  return Math.max(0, Math.min(1, currentFood / maxFood));
}
