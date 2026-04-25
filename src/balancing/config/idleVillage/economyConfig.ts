/**
 * Economy Configuration for Idle Village
 * 
 * Config-first design for Gold Mine and Market systems.
 * All values are configurable - no hardcoded magic numbers.
 * 
 * @module economyConfig
 */

import { z } from 'zod';
import type {
  GoldMineConfig,
  MarketConfig,
  BulkDiscountConfig,
  PriceListItem,
  EconomyState,
} from './types/economyTypes';

/**
 * Zod schema for Gold Mine configuration
 */
export const GoldMineConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  goldPerHourPerWorker: z.number().positive(),
  fatigueCostPerHour: z.number().nonnegative(),
  crewCapacity: z.number().int().positive(),
  statRequirements: z.object({
    allOf: z.array(z.string()).optional(),
    anyOf: z.array(z.string()).optional(),
    noneOf: z.array(z.string()).optional(),
  }).optional(),
  visual: z.object({
    icon: z.string(),
    color: z.string(),
    backgroundColor: z.string(),
  }),
});

/**
 * Zod schema for Price List Item
 */
export const PriceListItemSchema = z.object({
  itemId: z.string(),
  name: z.string(),
  basePrice: z.number().positive(),
  icon: z.string(),
  description: z.string(),
});

/**
 * Zod schema for Bulk Discount
 */
export const BulkDiscountConfigSchema = z.object({
  minQuantity: z.number().int().positive(),
  discountPercent: z.number().min(0).max(1),
});

/**
 * Zod schema for Market configuration
 */
export const MarketConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  priceList: z.array(PriceListItemSchema),
  stockLimits: z.record(z.string(), z.number().int().nonnegative()),
  bulkDiscounts: z.array(BulkDiscountConfigSchema),
  visual: z.object({
    icon: z.string(),
    color: z.string(),
    backgroundColor: z.string(),
  }),
});

/**
 * Zod schema for Economy State
 */
export const EconomyStateSchema = z.object({
  playerGold: z.number().nonnegative(),
  marketStock: z.record(z.string(), z.number().int().nonnegative()),
  transactionHistory: z.array(z.object({
    timestamp: z.number(),
    type: z.enum(['purchase', 'gold_production']),
    itemId: z.string().optional(),
    quantity: z.number(),
    goldAmount: z.number(),
    goldAfter: z.number(),
  })),
  lastUpdate: z.number(),
});

/**
 * Default Gold Mine configuration
 * Uses Gilded Observatory color palette
 */
export const DEFAULT_GOLD_MINE_CONFIG: GoldMineConfig = {
  id: 'gold-mine',
  name: 'Gold Mine',
  goldPerHourPerWorker: 10,
  fatigueCostPerHour: 15,
  crewCapacity: 3,
  statRequirements: {
    anyOf: ['strength', 'endurance'],
  },
  visual: {
    icon: '⛏️',
    color: 'rgb(201, 162, 39)', // gold-highlight from Gilded Observatory
    backgroundColor: 'rgb(15, 26, 29)', // obsidian-dark
  },
};

/**
 * Default Market configuration
 * Uses Gilded Observatory color palette
 */
export const DEFAULT_MARKET_CONFIG: MarketConfig = {
  id: 'market',
  name: 'Market',
  priceList: [
    {
      itemId: 'food',
      name: 'Food',
      basePrice: 5,
      icon: '🍖',
      description: 'Restores hunger and provides energy',
    },
    {
      itemId: 'medicine',
      name: 'Medicine',
      basePrice: 15,
      icon: '💊',
      description: 'Heals injuries and restores health',
    },
    {
      itemId: 'tool',
      name: 'Tool',
      basePrice: 25,
      icon: '🔨',
      description: 'Improves work efficiency',
    },
  ],
  stockLimits: {
    food: 100,
    medicine: 50,
    tool: 20,
  },
  bulkDiscounts: [
    {
      minQuantity: 5,
      discountPercent: 0.1, // 10% off
    },
    {
      minQuantity: 10,
      discountPercent: 0.2, // 20% off
    },
    {
      minQuantity: 20,
      discountPercent: 0.3, // 30% off
    },
  ],
  visual: {
    icon: '🏪',
    color: 'rgb(141, 179, 165)', // teal-accent from Gilded Observatory
    backgroundColor: 'rgb(15, 26, 29)', // obsidian-dark
  },
};

/**
 * Default initial economy state
 */
export const DEFAULT_ECONOMY_STATE: EconomyState = {
  playerGold: 50, // Starting gold
  marketStock: {
    food: 100,
    medicine: 50,
    tool: 20,
  },
  transactionHistory: [],
  lastUpdate: Date.now(),
};

/**
 * Economy configuration container
 */
export interface EconomyConfig {
  goldMine: GoldMineConfig;
  market: MarketConfig;
  initialState: EconomyState;
  workSessionDefaults: {
    /** Default work session duration (hours) for gold mine assignments */
    goldMineHours: number;
  };
}

/**
 * Default economy configuration
 */
export const DEFAULT_ECONOMY_CONFIG: EconomyConfig = {
  goldMine: DEFAULT_GOLD_MINE_CONFIG,
  market: DEFAULT_MARKET_CONFIG,
  initialState: DEFAULT_ECONOMY_STATE,
  workSessionDefaults: {
    goldMineHours: 1,
  },
};

/**
 * Validates economy configuration
 * 
 * @param config - Configuration to validate
 * @returns Validation result
 */
export function validateEconomyConfig(config: unknown): {
  valid: boolean;
  errors?: z.ZodError;
} {
  const schema = z.object({
    goldMine: GoldMineConfigSchema,
    market: MarketConfigSchema,
    initialState: EconomyStateSchema,
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
