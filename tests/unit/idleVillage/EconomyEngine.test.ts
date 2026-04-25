/**
 * Unit tests for EconomyEngine
 * 
 * Tests gold production, purchase validation, and transaction processing.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateGoldProduction,
  applyBulkDiscount,
  validatePurchase,
  processPurchase,
  processGoldProduction,
  getTransactionHistory,
  getTotalGoldEarned,
  getTotalGoldSpent,
} from '../../../src/engine/game/idleVillage/EconomyEngine';
import {
  DEFAULT_GOLD_MINE_CONFIG,
  DEFAULT_MARKET_CONFIG,
  DEFAULT_ECONOMY_STATE,
} from '../../../src/balancing/config/idleVillage/economyConfig';
import type { EconomyState } from '../../../src/balancing/config/idleVillage/types/economyTypes';

describe('EconomyEngine', () => {
  describe('calculateGoldProduction', () => {
    it('should calculate gold production correctly', () => {
      const result = calculateGoldProduction(DEFAULT_GOLD_MINE_CONFIG, 2, 3);
      
      expect(result.workerCount).toBe(2);
      expect(result.durationHours).toBe(3);
      expect(result.goldPerWorker).toBe(30); // 10 gold/hour * 3 hours
      expect(result.totalGold).toBe(60); // 30 * 2 workers
      expect(result.totalFatigueCost).toBe(90); // 15 fatigue/hour * 3 hours * 2 workers
    });

    it('should handle zero workers', () => {
      const result = calculateGoldProduction(DEFAULT_GOLD_MINE_CONFIG, 0, 5);
      
      expect(result.totalGold).toBe(0);
      expect(result.totalFatigueCost).toBe(0);
    });

    it('should handle zero duration', () => {
      const result = calculateGoldProduction(DEFAULT_GOLD_MINE_CONFIG, 3, 0);
      
      expect(result.totalGold).toBe(0);
      expect(result.totalFatigueCost).toBe(0);
    });

    it('should throw error for invalid worker count', () => {
      expect(() => {
        calculateGoldProduction(DEFAULT_GOLD_MINE_CONFIG, -1, 1);
      }).toThrow('Invalid worker count');

      expect(() => {
        calculateGoldProduction(DEFAULT_GOLD_MINE_CONFIG, 10, 1);
      }).toThrow('Invalid worker count');
    });

    it('should throw error for negative duration', () => {
      expect(() => {
        calculateGoldProduction(DEFAULT_GOLD_MINE_CONFIG, 1, -1);
      }).toThrow('Invalid duration');
    });
  });

  describe('applyBulkDiscount', () => {
    const bulkDiscounts = [
      { minQuantity: 5, discountPercent: 0.1 },
      { minQuantity: 10, discountPercent: 0.2 },
      { minQuantity: 20, discountPercent: 0.3 },
    ];

    it('should apply no discount for small quantities', () => {
      const result = applyBulkDiscount(10, 3, bulkDiscounts);
      
      expect(result.finalPrice).toBe(30);
      expect(result.discountApplied).toBe(0);
    });

    it('should apply 10% discount for 5+ items', () => {
      const result = applyBulkDiscount(10, 5, bulkDiscounts);
      
      expect(result.finalPrice).toBe(45); // 50 - 10%
      expect(result.discountApplied).toBe(0.1);
    });

    it('should apply 20% discount for 10+ items', () => {
      const result = applyBulkDiscount(10, 10, bulkDiscounts);
      
      expect(result.finalPrice).toBe(80); // 100 - 20%
      expect(result.discountApplied).toBe(0.2);
    });

    it('should apply 30% discount for 20+ items', () => {
      const result = applyBulkDiscount(10, 20, bulkDiscounts);
      
      expect(result.finalPrice).toBe(140); // 200 - 30%
      expect(result.discountApplied).toBe(0.3);
    });

    it('should handle empty discount array', () => {
      const result = applyBulkDiscount(10, 5, []);
      
      expect(result.finalPrice).toBe(50);
      expect(result.discountApplied).toBe(0);
    });
  });

  describe('validatePurchase', () => {
    const mockStock = { food: 100, medicine: 50, tool: 20 };

    it('should validate successful purchase', () => {
      const result = validatePurchase(
        DEFAULT_MARKET_CONFIG,
        'food',
        5,
        100,
        mockStock
      );
      
      expect(result.valid).toBe(true);
      expect(result.finalPrice).toBeDefined();
      expect(result.goldRemaining).toBeDefined();
    });

    it('should reject purchase with insufficient gold', () => {
      const result = validatePurchase(
        DEFAULT_MARKET_CONFIG,
        'food',
        10,
        10,
        mockStock
      );
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Insufficient gold');
    });

    it('should reject purchase with insufficient stock', () => {
      const result = validatePurchase(
        DEFAULT_MARKET_CONFIG,
        'food',
        200,
        1000,
        mockStock
      );
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Insufficient stock');
    });

    it('should reject purchase of non-existent item', () => {
      const result = validatePurchase(
        DEFAULT_MARKET_CONFIG,
        'nonexistent',
        1,
        100,
        mockStock
      );
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should reject purchase with zero or negative quantity', () => {
      const result = validatePurchase(
        DEFAULT_MARKET_CONFIG,
        'food',
        0,
        100,
        mockStock
      );
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('positive');
    });

    it('should apply bulk discount in validation', () => {
      const result = validatePurchase(
        DEFAULT_MARKET_CONFIG,
        'food',
        10,
        100,
        mockStock
      );
      
      expect(result.valid).toBe(true);
      expect(result.discountApplied).toBeGreaterThan(0);
      expect(result.finalPrice).toBeLessThan(50); // Base price 5 * 10 = 50
    });
  });

  describe('processPurchase', () => {
    it('should process valid purchase', () => {
      const initialState: EconomyState = {
        ...DEFAULT_ECONOMY_STATE,
        playerGold: 100,
        marketStock: { food: 100, medicine: 50, tool: 20 },
      };

      const { state, transaction } = processPurchase(
        DEFAULT_MARKET_CONFIG,
        initialState,
        'food',
        5
      );

      expect(state.playerGold).toBeLessThan(initialState.playerGold);
      expect(state.marketStock.food).toBe(95);
      expect(transaction.type).toBe('purchase');
      expect(transaction.itemId).toBe('food');
      expect(transaction.quantity).toBe(5);
      expect(transaction.goldAmount).toBeLessThan(0);
    });

    it('should throw error for invalid purchase', () => {
      const initialState: EconomyState = {
        ...DEFAULT_ECONOMY_STATE,
        playerGold: 1,
        marketStock: { food: 100, medicine: 50, tool: 20 },
      };

      expect(() => {
        processPurchase(DEFAULT_MARKET_CONFIG, initialState, 'food', 10);
      }).toThrow();
    });

    it('should add transaction to history', () => {
      const initialState: EconomyState = {
        ...DEFAULT_ECONOMY_STATE,
        playerGold: 100,
        marketStock: { food: 100, medicine: 50, tool: 20 },
        transactionHistory: [],
      };

      const { state } = processPurchase(
        DEFAULT_MARKET_CONFIG,
        initialState,
        'food',
        5
      );

      expect(state.transactionHistory).toHaveLength(1);
      expect(state.transactionHistory[0].type).toBe('purchase');
    });
  });

  describe('processGoldProduction', () => {
    it('should process gold production', () => {
      const initialState: EconomyState = {
        ...DEFAULT_ECONOMY_STATE,
        playerGold: 50,
      };

      const { state, transaction } = processGoldProduction(
        DEFAULT_GOLD_MINE_CONFIG,
        initialState,
        2,
        3
      );

      expect(state.playerGold).toBe(110); // 50 + 60
      expect(transaction.type).toBe('gold_production');
      expect(transaction.quantity).toBe(2);
      expect(transaction.goldAmount).toBe(60);
    });

    it('should add transaction to history', () => {
      const initialState: EconomyState = {
        ...DEFAULT_ECONOMY_STATE,
        playerGold: 50,
        transactionHistory: [],
      };

      const { state } = processGoldProduction(
        DEFAULT_GOLD_MINE_CONFIG,
        initialState,
        2,
        3
      );

      expect(state.transactionHistory).toHaveLength(1);
      expect(state.transactionHistory[0].type).toBe('gold_production');
    });
  });

  describe('getTransactionHistory', () => {
    const mockState: EconomyState = {
      ...DEFAULT_ECONOMY_STATE,
      transactionHistory: [
        {
          timestamp: 1000,
          type: 'purchase',
          itemId: 'food',
          quantity: 5,
          goldAmount: -25,
          goldAfter: 75,
        },
        {
          timestamp: 2000,
          type: 'gold_production',
          quantity: 2,
          goldAmount: 60,
          goldAfter: 135,
        },
        {
          timestamp: 3000,
          type: 'purchase',
          itemId: 'medicine',
          quantity: 2,
          goldAmount: -30,
          goldAfter: 105,
        },
      ],
    };

    it('should return all transactions', () => {
      const history = getTransactionHistory(mockState);
      expect(history).toHaveLength(3);
    });

    it('should filter by type', () => {
      const purchases = getTransactionHistory(mockState, 'purchase');
      expect(purchases).toHaveLength(2);
      expect(purchases.every((t) => t.type === 'purchase')).toBe(true);

      const production = getTransactionHistory(mockState, 'gold_production');
      expect(production).toHaveLength(1);
      expect(production[0].type).toBe('gold_production');
    });

    it('should limit results', () => {
      const history = getTransactionHistory(mockState, undefined, 2);
      expect(history).toHaveLength(2);
    });

    it('should sort by timestamp descending', () => {
      const history = getTransactionHistory(mockState);
      expect(history[0].timestamp).toBe(3000);
      expect(history[1].timestamp).toBe(2000);
      expect(history[2].timestamp).toBe(1000);
    });
  });

  describe('getTotalGoldEarned', () => {
    it('should calculate total gold earned', () => {
      const mockState: EconomyState = {
        ...DEFAULT_ECONOMY_STATE,
        transactionHistory: [
          {
            timestamp: 1000,
            type: 'gold_production',
            quantity: 2,
            goldAmount: 60,
            goldAfter: 60,
          },
          {
            timestamp: 2000,
            type: 'gold_production',
            quantity: 3,
            goldAmount: 90,
            goldAfter: 150,
          },
          {
            timestamp: 3000,
            type: 'purchase',
            itemId: 'food',
            quantity: 5,
            goldAmount: -25,
            goldAfter: 125,
          },
        ],
      };

      const total = getTotalGoldEarned(mockState);
      expect(total).toBe(150);
    });
  });

  describe('getTotalGoldSpent', () => {
    it('should calculate total gold spent', () => {
      const mockState: EconomyState = {
        ...DEFAULT_ECONOMY_STATE,
        transactionHistory: [
          {
            timestamp: 1000,
            type: 'purchase',
            itemId: 'food',
            quantity: 5,
            goldAmount: -25,
            goldAfter: 75,
          },
          {
            timestamp: 2000,
            type: 'purchase',
            itemId: 'medicine',
            quantity: 2,
            goldAmount: -30,
            goldAfter: 45,
          },
          {
            timestamp: 3000,
            type: 'gold_production',
            quantity: 2,
            goldAmount: 60,
            goldAfter: 105,
          },
        ],
      };

      const total = getTotalGoldSpent(mockState);
      expect(total).toBe(55);
    });
  });
});
