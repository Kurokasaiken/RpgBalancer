/**
 * Economy Engine for Idle Village
 * 
 * Core logic for gold production and market transactions.
 * All calculations are config-driven with no hardcoded values.
 * 
 * @module EconomyEngine
 */

import type {
  GoldMineConfig,
  MarketConfig,
  GoldProductionResult,
  PurchaseValidationResult,
  Transaction,
  EconomyState,
} from '../../../balancing/config/idleVillage/types/economyTypes';

/**
 * Calculates gold production from workers at the gold mine
 * 
 * @param config - Gold mine configuration
 * @param workerCount - Number of workers assigned
 * @param durationHours - Duration of work in hours
 * @returns Production result with gold amount and fatigue cost
 */
export function calculateGoldProduction(
  config: GoldMineConfig,
  workerCount: number,
  durationHours: number
): GoldProductionResult {
  // Validate inputs
  if (workerCount < 0 || workerCount > config.crewCapacity) {
    throw new Error(
      `Invalid worker count: ${workerCount}. Must be between 0 and ${config.crewCapacity}`
    );
  }

  if (durationHours < 0) {
    throw new Error(`Invalid duration: ${durationHours}. Must be non-negative`);
  }

  // Calculate gold production
  const goldPerWorker = config.goldPerHourPerWorker * durationHours;
  const totalGold = goldPerWorker * workerCount;

  // Calculate fatigue cost
  const totalFatigueCost = config.fatigueCostPerHour * durationHours * workerCount;

  return {
    totalGold,
    goldPerWorker,
    workerCount,
    durationHours,
    totalFatigueCost,
  };
}

/**
 * Applies bulk discount to base price
 * 
 * @param basePrice - Base price per item
 * @param quantity - Quantity being purchased
 * @param bulkDiscounts - Bulk discount configuration
 * @returns Final price after discount and discount percentage applied
 */
export function applyBulkDiscount(
  basePrice: number,
  quantity: number,
  bulkDiscounts: Array<{ minQuantity: number; discountPercent: number }>
): { finalPrice: number; discountApplied: number } {
  // Find the highest applicable discount
  let maxDiscount = 0;

  for (const discount of bulkDiscounts) {
    if (quantity >= discount.minQuantity && discount.discountPercent > maxDiscount) {
      maxDiscount = discount.discountPercent;
    }
  }

  const totalPrice = basePrice * quantity;
  const discountAmount = totalPrice * maxDiscount;
  const finalPrice = totalPrice - discountAmount;

  return {
    finalPrice,
    discountApplied: maxDiscount,
  };
}

/**
 * Validates a purchase transaction
 * 
 * @param config - Market configuration
 * @param itemId - Item being purchased
 * @param quantity - Quantity to purchase
 * @param playerGold - Player's current gold
 * @param currentStock - Current market stock levels
 * @returns Validation result with error message if invalid
 */
export function validatePurchase(
  config: MarketConfig,
  itemId: string,
  quantity: number,
  playerGold: number,
  currentStock: Record<string, number>
): PurchaseValidationResult {
  // Find item in price list
  const item = config.priceList.find((i) => i.itemId === itemId);
  
  if (!item) {
    return {
      valid: false,
      error: `Item '${itemId}' not found in market`,
    };
  }

  // Validate quantity
  if (quantity <= 0) {
    return {
      valid: false,
      error: 'Quantity must be positive',
    };
  }

  // Check stock availability
  const availableStock = currentStock[itemId] ?? 0;
  if (quantity > availableStock) {
    return {
      valid: false,
      error: `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`,
    };
  }

  // Calculate final price with discounts
  const { finalPrice, discountApplied } = applyBulkDiscount(
    item.basePrice,
    quantity,
    config.bulkDiscounts
  );

  // Check if player has enough gold
  if (finalPrice > playerGold) {
    return {
      valid: false,
      error: `Insufficient gold. Required: ${finalPrice}, Available: ${playerGold}`,
    };
  }

  return {
    valid: true,
    finalPrice,
    discountApplied,
    goldRemaining: playerGold - finalPrice,
  };
}

/**
 * Processes a purchase transaction
 * 
 * @param config - Market configuration
 * @param state - Current economy state
 * @param itemId - Item being purchased
 * @param quantity - Quantity to purchase
 * @returns Updated economy state and transaction record
 */
export function processPurchase(
  config: MarketConfig,
  state: EconomyState,
  itemId: string,
  quantity: number
): { state: EconomyState; transaction: Transaction } {
  // Validate purchase
  const validation = validatePurchase(
    config,
    itemId,
    quantity,
    state.playerGold,
    state.marketStock
  );

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Create transaction record
  const transaction: Transaction = {
    timestamp: Date.now(),
    type: 'purchase',
    itemId,
    quantity,
    goldAmount: -(validation.finalPrice ?? 0),
    goldAfter: validation.goldRemaining ?? state.playerGold,
  };

  // Update state
  const newState: EconomyState = {
    playerGold: validation.goldRemaining ?? state.playerGold,
    marketStock: {
      ...state.marketStock,
      [itemId]: (state.marketStock[itemId] ?? 0) - quantity,
    },
    transactionHistory: [...state.transactionHistory, transaction],
    lastUpdate: Date.now(),
  };

  return { state: newState, transaction };
}

/**
 * Processes gold production from the mine
 * 
 * @param config - Gold mine configuration
 * @param state - Current economy state
 * @param workerCount - Number of workers
 * @param durationHours - Duration in hours
 * @returns Updated economy state and transaction record
 */
export function processGoldProduction(
  config: GoldMineConfig,
  state: EconomyState,
  workerCount: number,
  durationHours: number
): { state: EconomyState; transaction: Transaction } {
  // Calculate production
  const production = calculateGoldProduction(config, workerCount, durationHours);

  // Create transaction record
  const transaction: Transaction = {
    timestamp: Date.now(),
    type: 'gold_production',
    quantity: workerCount,
    goldAmount: production.totalGold,
    goldAfter: state.playerGold + production.totalGold,
  };

  // Update state
  const newState: EconomyState = {
    ...state,
    playerGold: state.playerGold + production.totalGold,
    transactionHistory: [...state.transactionHistory, transaction],
    lastUpdate: Date.now(),
  };

  return { state: newState, transaction };
}

/**
 * Gets transaction history filtered by type
 * 
 * @param state - Economy state
 * @param type - Transaction type to filter by (optional)
 * @param limit - Maximum number of transactions to return (optional)
 * @returns Filtered transaction history
 */
export function getTransactionHistory(
  state: EconomyState,
  type?: 'purchase' | 'gold_production',
  limit?: number
): Transaction[] {
  let transactions = state.transactionHistory;

  if (type) {
    transactions = transactions.filter((t) => t.type === type);
  }

  // Sort by timestamp descending (most recent first)
  transactions = [...transactions].sort((a, b) => b.timestamp - a.timestamp);

  if (limit && limit > 0) {
    transactions = transactions.slice(0, limit);
  }

  return transactions;
}

/**
 * Calculates total gold earned from production
 * 
 * @param state - Economy state
 * @returns Total gold earned from all production transactions
 */
export function getTotalGoldEarned(state: EconomyState): number {
  return state.transactionHistory
    .filter((t) => t.type === 'gold_production')
    .reduce((sum, t) => sum + t.goldAmount, 0);
}

/**
 * Calculates total gold spent on purchases
 * 
 * @param state - Economy state
 * @returns Total gold spent on all purchases
 */
export function getTotalGoldSpent(state: EconomyState): number {
  return Math.abs(
    state.transactionHistory
      .filter((t) => t.type === 'purchase')
      .reduce((sum, t) => sum + t.goldAmount, 0)
  );
}
