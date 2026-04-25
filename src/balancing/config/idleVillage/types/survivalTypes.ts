/**
 * Survival Types for Idle Village
 * 
 * Defines TypeScript interfaces for the survival system including:
 * - Food state and consumption
 * - Day/time configuration
 * - Game over conditions
 * - Warning thresholds
 */

/**
 * Game over reason enum
 */
export type GameOverReason = 'starvation' | 'total_wipeout' | 'manual_quit';

/**
 * Warning level enum
 */
export type WarningLevel = 'safe' | 'low' | 'critical';

/**
 * Food consumption rate configuration
 */
export interface ConsumptionRate {
  /** Base food consumed per resident per day */
  basePerResidentPerDay: number;
  /** Multiplier for working residents */
  workingMultiplier: number;
  /** Multiplier for injured residents */
  injuredMultiplier: number;
}

/**
 * Day configuration
 */
export interface DayConfig {
  /** Duration of one day in milliseconds (real-time) */
  durationMs: number;
  /** Whether time is paused */
  paused: boolean;
  /** Time speed multiplier (1x, 2x, 5x) */
  speedMultiplier: number;
}

/**
 * Warning threshold configuration
 */
export interface WarningThresholds {
  /** Food percentage for low warning (0-1) */
  lowFoodPercent: number;
  /** Food percentage for critical warning (0-1) */
  criticalFoodPercent: number;
  /** Days remaining for warning */
  daysRemainingWarning: number;
}

/**
 * Food state
 */
export interface FoodState {
  /** Current food amount */
  currentFood: number;
  /** Maximum food capacity */
  maxFood: number;
  /** Total food consumed */
  totalConsumed: number;
  /** Last consumption timestamp */
  lastConsumptionTime: number;
  /** Current warning level */
  warningLevel: WarningLevel;
}

/**
 * Game over state
 */
export interface GameOverState {
  /** Whether game is over */
  isGameOver: boolean;
  /** Reason for game over */
  reason?: GameOverReason;
  /** Timestamp of game over */
  timestamp?: number;
  /** Days survived */
  daysSurvived?: number;
  /** Final statistics */
  finalStats?: {
    totalFoodConsumed: number;
    totalGoldEarned: number;
    totalQuestsCompleted: number;
    residentsLost: number;
  };
}

/**
 * Day tick result
 */
export interface DayTickResult {
  /** Food consumed this tick */
  foodConsumed: number;
  /** New food amount */
  newFoodAmount: number;
  /** New warning level */
  warningLevel: WarningLevel;
  /** Whether game over triggered */
  gameOver: boolean;
  /** Game over reason if triggered */
  gameOverReason?: GameOverReason;
}

/**
 * Survival state persisted to storage
 */
export interface SurvivalState {
  /** Food state */
  food: FoodState;
  /** Day configuration */
  dayConfig: DayConfig;
  /** Current day number */
  currentDay: number;
  /** Game over state */
  gameOver: GameOverState;
  /** Last update timestamp */
  lastUpdate: number;
}

/**
 * Days remaining calculation result
 */
export interface DaysRemainingResult {
  /** Days remaining until starvation */
  daysRemaining: number;
  /** Whether calculation is accurate */
  isAccurate: boolean;
  /** Warning message if applicable */
  warningMessage?: string;
}
