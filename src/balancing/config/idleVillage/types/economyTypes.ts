/**
 * Economy Types for Idle Village
 * 
 * Defines TypeScript interfaces for the economy system including:
 * - Gold Mine configuration and production
 * - Market configuration and pricing
 * - Transaction handling
 * - Resource management
 */

/**
 * Configuration for Gold Mine activity
 */
export interface GoldMineConfig {
  /** Unique identifier for the gold mine */
  id: string;
  /** Display name */
  name: string;
  /** Gold produced per hour per worker */
  goldPerHourPerWorker: number;
  /** Fatigue cost per hour of work */
  fatigueCostPerHour: number;
  /** Maximum number of workers that can be assigned */
  crewCapacity: number;
  /** Minimum stat requirements for workers */
  statRequirements?: {
    allOf?: string[];
    anyOf?: string[];
    noneOf?: string[];
  };
  /** Visual configuration */
  visual: {
    icon: string;
    color: string;
    backgroundColor: string;
  };
}

/**
 * Configuration for Market activity
 */
export interface MarketConfig {
  /** Unique identifier for the market */
  id: string;
  /** Display name */
  name: string;
  /** Available items for purchase */
  priceList: PriceListItem[];
  /** Stock limits per item */
  stockLimits: Record<string, number>;
  /** Bulk discount configuration */
  bulkDiscounts: BulkDiscountConfig[];
  /** Visual configuration */
  visual: {
    icon: string;
    color: string;
    backgroundColor: string;
  };
}

/**
 * Item available for purchase in the market
 */
export interface PriceListItem {
  /** Item identifier (e.g., 'food', 'medicine') */
  itemId: string;
  /** Display name */
  name: string;
  /** Base price in gold */
  basePrice: number;
  /** Item icon */
  icon: string;
  /** Description */
  description: string;
}

/**
 * Bulk discount configuration
 */
export interface BulkDiscountConfig {
  /** Minimum quantity to trigger discount */
  minQuantity: number;
  /** Discount percentage (0-1) */
  discountPercent: number;
}

/**
 * Transaction record
 */
export interface Transaction {
  /** Transaction timestamp */
  timestamp: number;
  /** Transaction type */
  type: 'purchase' | 'gold_production';
  /** Item ID (for purchases) */
  itemId?: string;
  /** Quantity */
  quantity: number;
  /** Gold amount (negative for purchases, positive for production) */
  goldAmount: number;
  /** Player gold after transaction */
  goldAfter: number;
}

/**
 * Gold production calculation result
 */
export interface GoldProductionResult {
  /** Total gold produced */
  totalGold: number;
  /** Gold per worker */
  goldPerWorker: number;
  /** Number of workers */
  workerCount: number;
  /** Duration in hours */
  durationHours: number;
  /** Total fatigue cost */
  totalFatigueCost: number;
}

/**
 * Purchase validation result
 */
export interface PurchaseValidationResult {
  /** Whether purchase is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Final price after discounts */
  finalPrice?: number;
  /** Discount applied */
  discountApplied?: number;
  /** Gold remaining after purchase */
  goldRemaining?: number;
}

/**
 * Economy state persisted to storage
 */
export interface EconomyState {
  /** Player's current gold */
  playerGold: number;
  /** Current market stock levels */
  marketStock: Record<string, number>;
  /** Transaction history */
  transactionHistory: Transaction[];
  /** Last update timestamp */
  lastUpdate: number;
}
