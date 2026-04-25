/**
 * Unit tests for SurvivalEngine
 * 
 * Tests food consumption, day ticks, and game over logic.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateDayConsumption,
  processDayTick,
  checkGameOverConditions,
  calculateDaysRemaining,
  triggerGameOver,
  updateFoodState,
  addFood,
  removeFood,
  resetSurvivalState,
  setDayPaused,
  setDaySpeed,
  getWarningMessage,
  getFoodPercentage,
  type ResidentInfo,
} from '../../../src/engine/game/idleVillage/SurvivalEngine';
import {
  DEFAULT_CONSUMPTION_RATE,
  DEFAULT_SURVIVAL_STATE,
  DEFAULT_WARNING_THRESHOLDS,
} from '../../../src/balancing/config/idleVillage/survivalConfig';
import type { SurvivalState } from '../../../src/balancing/config/idleVillage/types/survivalTypes';

describe('SurvivalEngine', () => {
  const mockResidents: ResidentInfo[] = [
    { residentId: 'resident-1', isWorking: false, isInjured: false },
    { residentId: 'resident-2', isWorking: true, isInjured: false },
    { residentId: 'resident-3', isWorking: false, isInjured: true },
  ];

  describe('calculateDayConsumption', () => {
    it('should calculate base consumption correctly', () => {
      const residents: ResidentInfo[] = [
        { residentId: 'resident-1', isWorking: false, isInjured: false },
      ];

      const consumption = calculateDayConsumption(residents, DEFAULT_CONSUMPTION_RATE);
      expect(consumption).toBe(2); // Base rate
    });

    it('should apply working multiplier', () => {
      const residents: ResidentInfo[] = [
        { residentId: 'resident-1', isWorking: true, isInjured: false },
      ];

      const consumption = calculateDayConsumption(residents, DEFAULT_CONSUMPTION_RATE);
      expect(consumption).toBe(3); // 2 * 1.5
    });

    it('should apply injured multiplier', () => {
      const residents: ResidentInfo[] = [
        { residentId: 'resident-1', isWorking: false, isInjured: true },
      ];

      const consumption = calculateDayConsumption(residents, DEFAULT_CONSUMPTION_RATE);
      expect(consumption).toBe(2.4); // 2 * 1.2
    });

    it('should apply both multipliers', () => {
      const residents: ResidentInfo[] = [
        { residentId: 'resident-1', isWorking: true, isInjured: true },
      ];

      const consumption = calculateDayConsumption(residents, DEFAULT_CONSUMPTION_RATE);
      expect(consumption).toBeCloseTo(3.6, 1); // 2 * 1.5 * 1.2
    });

    it('should sum consumption for multiple residents', () => {
      const consumption = calculateDayConsumption(mockResidents, DEFAULT_CONSUMPTION_RATE);
      // resident-1: 2, resident-2: 3, resident-3: 2.4 = 7.4
      expect(consumption).toBeCloseTo(7.4, 1);
    });

    it('should return 0 for empty resident list', () => {
      const consumption = calculateDayConsumption([], DEFAULT_CONSUMPTION_RATE);
      expect(consumption).toBe(0);
    });
  });

  describe('processDayTick', () => {
    it('should process day tick correctly', () => {
      const result = processDayTick(
        DEFAULT_SURVIVAL_STATE,
        mockResidents,
        DEFAULT_CONSUMPTION_RATE,
        DEFAULT_WARNING_THRESHOLDS
      );

      expect(result.foodConsumed).toBeGreaterThan(0);
      expect(result.newFoodAmount).toBeLessThan(DEFAULT_SURVIVAL_STATE.food.currentFood);
      expect(result.warningLevel).toBeDefined();
      expect(result.gameOver).toBe(false);
    });

    it('should trigger game over when food reaches zero', () => {
      const lowFoodState: SurvivalState = {
        ...DEFAULT_SURVIVAL_STATE,
        food: {
          ...DEFAULT_SURVIVAL_STATE.food,
          currentFood: 5,
        },
      };

      const result = processDayTick(
        lowFoodState,
        mockResidents,
        DEFAULT_CONSUMPTION_RATE,
        DEFAULT_WARNING_THRESHOLDS
      );

      expect(result.newFoodAmount).toBe(0);
      expect(result.gameOver).toBe(true);
      expect(result.gameOverReason).toBe('starvation');
    });

    it('should update warning level based on food percentage', () => {
      const mediumFoodState: SurvivalState = {
        ...DEFAULT_SURVIVAL_STATE,
        food: {
          ...DEFAULT_SURVIVAL_STATE.food,
          currentFood: 80,
          maxFood: 200,
        },
      };

      const result = processDayTick(
        mediumFoodState,
        mockResidents,
        DEFAULT_CONSUMPTION_RATE,
        DEFAULT_WARNING_THRESHOLDS
      );

      expect(result.warningLevel).toBe('low'); // 80/200 = 40% < 50%
    });

    it('should not allow negative food', () => {
      const zeroFoodState: SurvivalState = {
        ...DEFAULT_SURVIVAL_STATE,
        food: {
          ...DEFAULT_SURVIVAL_STATE.food,
          currentFood: 0,
        },
      };

      const result = processDayTick(
        zeroFoodState,
        mockResidents,
        DEFAULT_CONSUMPTION_RATE,
        DEFAULT_WARNING_THRESHOLDS
      );

      expect(result.newFoodAmount).toBe(0);
    });
  });

  describe('checkGameOverConditions', () => {
    it('should detect starvation', () => {
      const starvedState: SurvivalState = {
        ...DEFAULT_SURVIVAL_STATE,
        food: {
          ...DEFAULT_SURVIVAL_STATE.food,
          currentFood: 0,
        },
      };

      const reason = checkGameOverConditions(starvedState, mockResidents);
      expect(reason).toBe('starvation');
    });

    it('should detect total wipeout', () => {
      const reason = checkGameOverConditions(DEFAULT_SURVIVAL_STATE, []);
      expect(reason).toBe('total_wipeout');
    });

    it('should return undefined when conditions not met', () => {
      const reason = checkGameOverConditions(DEFAULT_SURVIVAL_STATE, mockResidents);
      expect(reason).toBeUndefined();
    });
  });

  describe('calculateDaysRemaining', () => {
    it('should calculate days remaining correctly', () => {
      const result = calculateDaysRemaining(
        100,
        mockResidents,
        DEFAULT_CONSUMPTION_RATE
      );

      expect(result.daysRemaining).toBeGreaterThan(0);
      expect(result.isAccurate).toBe(true);
    });

    it('should return 0 when out of food', () => {
      const result = calculateDaysRemaining(
        0,
        mockResidents,
        DEFAULT_CONSUMPTION_RATE
      );

      expect(result.daysRemaining).toBe(0);
      expect(result.isAccurate).toBe(true);
      expect(result.warningMessage).toContain('Out of food');
    });

    it('should return infinity when no residents', () => {
      const result = calculateDaysRemaining(
        100,
        [],
        DEFAULT_CONSUMPTION_RATE
      );

      expect(result.daysRemaining).toBe(Infinity);
      expect(result.isAccurate).toBe(false);
    });

    it('should calculate based on consumption rate', () => {
      const residents: ResidentInfo[] = [
        { residentId: 'resident-1', isWorking: false, isInjured: false },
      ];

      const result = calculateDaysRemaining(
        20,
        residents,
        DEFAULT_CONSUMPTION_RATE
      );

      // 20 food / 2 per day = 10 days
      expect(result.daysRemaining).toBe(10);
    });
  });

  describe('triggerGameOver', () => {
    it('should trigger game over with reason', () => {
      const newState = triggerGameOver(
        DEFAULT_SURVIVAL_STATE,
        'starvation'
      );

      expect(newState.gameOver.isGameOver).toBe(true);
      expect(newState.gameOver.reason).toBe('starvation');
      expect(newState.gameOver.timestamp).toBeDefined();
      expect(newState.gameOver.daysSurvived).toBe(0);
    });

    it('should include final stats', () => {
      const finalStats = {
        totalFoodConsumed: 150,
        totalGoldEarned: 500,
        totalQuestsCompleted: 10,
        residentsLost: 2,
      };

      const newState = triggerGameOver(
        DEFAULT_SURVIVAL_STATE,
        'starvation',
        finalStats
      );

      expect(newState.gameOver.finalStats).toEqual(finalStats);
    });
  });

  describe('updateFoodState', () => {
    it('should update food state after tick', () => {
      const tickResult = {
        foodConsumed: 10,
        newFoodAmount: 90,
        warningLevel: 'safe' as const,
        gameOver: false,
      };

      const newState = updateFoodState(DEFAULT_SURVIVAL_STATE, tickResult);

      expect(newState.food.currentFood).toBe(90);
      expect(newState.food.totalConsumed).toBe(10);
      expect(newState.food.warningLevel).toBe('safe');
      expect(newState.currentDay).toBe(1);
    });

    it('should accumulate total consumed', () => {
      const stateWithConsumption: SurvivalState = {
        ...DEFAULT_SURVIVAL_STATE,
        food: {
          ...DEFAULT_SURVIVAL_STATE.food,
          totalConsumed: 50,
        },
      };

      const tickResult = {
        foodConsumed: 10,
        newFoodAmount: 90,
        warningLevel: 'safe' as const,
        gameOver: false,
      };

      const newState = updateFoodState(stateWithConsumption, tickResult);

      expect(newState.food.totalConsumed).toBe(60);
    });
  });

  describe('addFood', () => {
    it('should add food to current stock', () => {
      const newState = addFood(
        DEFAULT_SURVIVAL_STATE,
        50,
        DEFAULT_WARNING_THRESHOLDS
      );

      expect(newState.food.currentFood).toBe(150);
    });

    it('should not exceed max food', () => {
      const newState = addFood(
        DEFAULT_SURVIVAL_STATE,
        200,
        DEFAULT_WARNING_THRESHOLDS
      );

      expect(newState.food.currentFood).toBe(200); // Max is 200
    });

    it('should update warning level', () => {
      const lowFoodState: SurvivalState = {
        ...DEFAULT_SURVIVAL_STATE,
        food: {
          ...DEFAULT_SURVIVAL_STATE.food,
          currentFood: 30,
          warningLevel: 'critical',
        },
      };

      const newState = addFood(
        lowFoodState,
        100,
        DEFAULT_WARNING_THRESHOLDS
      );

      expect(newState.food.warningLevel).toBe('safe');
    });
  });

  describe('removeFood', () => {
    it('should remove food from current stock', () => {
      const newState = removeFood(
        DEFAULT_SURVIVAL_STATE,
        30,
        DEFAULT_WARNING_THRESHOLDS
      );

      expect(newState.food.currentFood).toBe(70);
    });

    it('should not go below zero', () => {
      const newState = removeFood(
        DEFAULT_SURVIVAL_STATE,
        200,
        DEFAULT_WARNING_THRESHOLDS
      );

      expect(newState.food.currentFood).toBe(0);
    });

    it('should update warning level', () => {
      const newState = removeFood(
        DEFAULT_SURVIVAL_STATE,
        60,
        DEFAULT_WARNING_THRESHOLDS
      );

      // 100 - 60 = 40, 40/200 = 20% which is exactly critical threshold
      expect(newState.food.warningLevel).toBe('critical');
    });
  });

  describe('resetSurvivalState', () => {
    it('should reset to initial state', () => {
      const modifiedState: SurvivalState = {
        ...DEFAULT_SURVIVAL_STATE,
        currentDay: 10,
        food: {
          ...DEFAULT_SURVIVAL_STATE.food,
          currentFood: 50,
        },
        gameOver: {
          isGameOver: true,
          reason: 'starvation',
        },
      };

      const newState = resetSurvivalState(DEFAULT_SURVIVAL_STATE);

      expect(newState.currentDay).toBe(0);
      expect(newState.gameOver.isGameOver).toBe(false);
    });
  });

  describe('setDayPaused', () => {
    it('should pause day timer', () => {
      const newState = setDayPaused(DEFAULT_SURVIVAL_STATE, true);
      expect(newState.dayConfig.paused).toBe(true);
    });

    it('should resume day timer', () => {
      const pausedState: SurvivalState = {
        ...DEFAULT_SURVIVAL_STATE,
        dayConfig: {
          ...DEFAULT_SURVIVAL_STATE.dayConfig,
          paused: true,
        },
      };

      const newState = setDayPaused(pausedState, false);
      expect(newState.dayConfig.paused).toBe(false);
    });
  });

  describe('setDaySpeed', () => {
    it('should set speed multiplier', () => {
      const newState = setDaySpeed(DEFAULT_SURVIVAL_STATE, 2);
      expect(newState.dayConfig.speedMultiplier).toBe(2);
    });

    it('should not allow speeds below 0.1', () => {
      const newState = setDaySpeed(DEFAULT_SURVIVAL_STATE, 0.05);
      expect(newState.dayConfig.speedMultiplier).toBe(0.1);
    });
  });

  describe('getWarningMessage', () => {
    it('should return critical message', () => {
      const message = getWarningMessage('critical', 1.5);
      expect(message).toContain('Critical');
      expect(message).toContain('1 days');
    });

    it('should return low message', () => {
      const message = getWarningMessage('low', 5.8);
      expect(message).toContain('Warning');
      expect(message).toContain('5 days');
    });

    it('should return safe message', () => {
      const message = getWarningMessage('safe', 20);
      expect(message).toContain('adequate');
      expect(message).toContain('20 days');
    });
  });

  describe('getFoodPercentage', () => {
    it('should calculate percentage correctly', () => {
      const percentage = getFoodPercentage(50, 100);
      expect(percentage).toBe(0.5);
    });

    it('should return 0 for zero food', () => {
      const percentage = getFoodPercentage(0, 100);
      expect(percentage).toBe(0);
    });

    it('should return 1 for full food', () => {
      const percentage = getFoodPercentage(100, 100);
      expect(percentage).toBe(1);
    });

    it('should clamp to 0-1 range', () => {
      const percentage = getFoodPercentage(150, 100);
      expect(percentage).toBe(1);
    });
  });
});
