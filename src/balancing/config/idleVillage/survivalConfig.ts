/**
 * Survival Configuration for Idle Village
 * 
 * Config-first design for food system, day/time mechanics, and game over conditions.
 * All values are configurable - no hardcoded magic numbers.
 * 
 * @module survivalConfig
 */

import { z } from 'zod';
import type {
  ConsumptionRate,
  DayConfig,
  WarningThresholds,
  FoodState,
  SurvivalState,
  GameOverState,
} from './types/survivalTypes';

/**
 * Zod schema for Consumption Rate
 */
export const ConsumptionRateSchema = z.object({
  basePerResidentPerDay: z.number().positive(),
  workingMultiplier: z.number().min(1),
  injuredMultiplier: z.number().min(1),
});

/**
 * Zod schema for Day Config
 */
export const DayConfigSchema = z.object({
  durationMs: z.number().positive(),
  paused: z.boolean(),
  speedMultiplier: z.number().positive(),
});

/**
 * Zod schema for Warning Thresholds
 */
export const WarningThresholdsSchema = z.object({
  lowFoodPercent: z.number().min(0).max(1),
  criticalFoodPercent: z.number().min(0).max(1),
  daysRemainingWarning: z.number().int().positive(),
});

/**
 * Zod schema for Food State
 */
export const FoodStateSchema = z.object({
  currentFood: z.number().nonnegative(),
  maxFood: z.number().positive(),
  totalConsumed: z.number().nonnegative(),
  lastConsumptionTime: z.number(),
  warningLevel: z.enum(['safe', 'low', 'critical']),
});

/**
 * Zod schema for Game Over State
 */
export const GameOverStateSchema = z.object({
  isGameOver: z.boolean(),
  reason: z.enum(['starvation', 'total_wipeout', 'manual_quit']).optional(),
  timestamp: z.number().optional(),
  daysSurvived: z.number().int().nonnegative().optional(),
  finalStats: z.object({
    totalFoodConsumed: z.number().nonnegative(),
    totalGoldEarned: z.number().nonnegative(),
    totalQuestsCompleted: z.number().int().nonnegative(),
    residentsLost: z.number().int().nonnegative(),
  }).optional(),
});

/**
 * Zod schema for Survival State
 */
export const SurvivalStateSchema = z.object({
  food: FoodStateSchema,
  dayConfig: DayConfigSchema,
  currentDay: z.number().int().nonnegative(),
  gameOver: GameOverStateSchema,
  lastUpdate: z.number(),
});

/**
 * Default consumption rate configuration
 */
export const DEFAULT_CONSUMPTION_RATE: ConsumptionRate = {
  basePerResidentPerDay: 2, // 2 food per resident per day
  workingMultiplier: 1.5, // 50% more when working
  injuredMultiplier: 1.2, // 20% more when injured
};

/**
 * Default day configuration
 * Default: 1 day = 5 minutes real-time (300000ms)
 */
export const DEFAULT_DAY_CONFIG: DayConfig = {
  durationMs: 300000, // 5 minutes
  paused: false,
  speedMultiplier: 1,
};

/**
 * Default warning thresholds
 */
export const DEFAULT_WARNING_THRESHOLDS: WarningThresholds = {
  lowFoodPercent: 0.5, // Warning at 50% food
  criticalFoodPercent: 0.2, // Critical at 20% food
  daysRemainingWarning: 3, // Warn when < 3 days remaining
};

/**
 * Default food state
 */
export const DEFAULT_FOOD_STATE: FoodState = {
  currentFood: 100,
  maxFood: 200,
  totalConsumed: 0,
  lastConsumptionTime: Date.now(),
  warningLevel: 'safe',
};

/**
 * Default game over state
 */
export const DEFAULT_GAME_OVER_STATE: GameOverState = {
  isGameOver: false,
};

/**
 * Default survival state
 */
export const DEFAULT_SURVIVAL_STATE: SurvivalState = {
  food: DEFAULT_FOOD_STATE,
  dayConfig: DEFAULT_DAY_CONFIG,
  currentDay: 0,
  gameOver: DEFAULT_GAME_OVER_STATE,
  lastUpdate: Date.now(),
};

/**
 * Survival system configuration container
 */
export interface SurvivalConfig {
  consumptionRate: ConsumptionRate;
  dayConfig: DayConfig;
  warningThresholds: WarningThresholds;
  initialState: SurvivalState;
  gameOverSettings: {
    /** Whether to auto-save before game over */
    autoSaveBeforeGameOver: boolean;
    /** Whether to show statistics on game over */
    showStatistics: boolean;
    /** Whether to allow restart */
    allowRestart: boolean;
  };
}

/**
 * Default survival configuration
 */
export const DEFAULT_SURVIVAL_CONFIG: SurvivalConfig = {
  consumptionRate: DEFAULT_CONSUMPTION_RATE,
  dayConfig: DEFAULT_DAY_CONFIG,
  warningThresholds: DEFAULT_WARNING_THRESHOLDS,
  initialState: DEFAULT_SURVIVAL_STATE,
  gameOverSettings: {
    autoSaveBeforeGameOver: true,
    showStatistics: true,
    allowRestart: true,
  },
};

/**
 * Validates survival configuration
 * 
 * @param config - Configuration to validate
 * @returns Validation result
 */
export function validateSurvivalConfig(config: unknown): {
  valid: boolean;
  errors?: z.ZodError;
} {
  const schema = z.object({
    consumptionRate: ConsumptionRateSchema,
    dayConfig: DayConfigSchema,
    warningThresholds: WarningThresholdsSchema,
    initialState: SurvivalStateSchema,
    gameOverSettings: z.object({
      autoSaveBeforeGameOver: z.boolean(),
      showStatistics: z.boolean(),
      allowRestart: z.boolean(),
    }),
  });

  const result = schema.safeParse(config);
  
  if (result.success) {
    return { valid: true };
  }
  
  return {
    valid: false,
    errors: result.error,
  };
}

/**
 * Gets warning level based on food percentage
 * 
 * @param currentFood - Current food amount
 * @param maxFood - Maximum food capacity
 * @param thresholds - Warning thresholds
 * @returns Warning level
 */
export function getWarningLevel(
  currentFood: number,
  maxFood: number,
  thresholds: WarningThresholds
): 'safe' | 'low' | 'critical' {
  const percentage = currentFood / maxFood;
  
  if (percentage <= thresholds.criticalFoodPercent) {
    return 'critical';
  }
  
  if (percentage <= thresholds.lowFoodPercent) {
    return 'low';
  }
  
  return 'safe';
}

/**
 * Gets warning color for UI
 * 
 * @param level - Warning level
 * @returns RGB color string
 */
export function getWarningColor(level: 'safe' | 'low' | 'critical'): string {
  switch (level) {
    case 'safe':
      return 'rgb(34, 197, 94)'; // green-500
    case 'low':
      return 'rgb(251, 191, 36)'; // amber-400
    case 'critical':
      return 'rgb(239, 68, 68)'; // red-500
  }
}

/**
 * Gets effective day duration based on speed multiplier
 * 
 * @param config - Day configuration
 * @returns Effective duration in milliseconds
 */
export function getEffectiveDayDuration(config: DayConfig): number {
  return config.durationMs / config.speedMultiplier;
}
