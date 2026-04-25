// src/engine/game/idleVillage/MarketEngine.ts
// Simple, config-first market helper for Idle Village.
// Pure domain functions only: no UI, no side effects.

import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import type { VillageResources } from './TimeEngine';

export interface MarketPurchaseInput {
  /** Requested number of food units to buy */
  units: number;
}

export interface MarketPurchaseResult {
  resources: VillageResources;
  boughtUnits: number;
  spentGold: number;
}

/**
 * Buy food using gold at the base price defined in IdleVillageConfig.globalRules.
 *
 * This function is deliberately minimal for the vertical slice:
 * - Currency is assumed to be the `gold` resource.
 * - The purchased good is assumed to be the `food` resource.
 * - Price per unit is read from `globalRules.baseFoodPriceInGold`.
 */
export function buyFoodWithGold(
  config: IdleVillageConfig,
  resources: VillageResources,
  input: MarketPurchaseInput,
): MarketPurchaseResult {
  const pricePerUnit = config.globalRules.baseFoodPriceInGold;
  const requested = Math.floor(input.units);

  if (!Number.isFinite(requested) || requested <= 0 || pricePerUnit <= 0) {
    return { resources: { ...resources }, boughtUnits: 0, spentGold: 0 };
  }

  const currentGold = resources.gold ?? 0;
  if (currentGold <= 0) {
    return { resources: { ...resources }, boughtUnits: 0, spentGold: 0 };
  }

  const maxAffordable = Math.floor(currentGold / pricePerUnit);
  const units = Math.max(0, Math.min(maxAffordable, requested));

  if (units === 0) {
    return { resources: { ...resources }, boughtUnits: 0, spentGold: 0 };
  }

  const spentGold = units * pricePerUnit;

  const next: VillageResources = { ...resources };
  next.gold = currentGold - spentGold;
  next.food = (next.food ?? 0) + units;

  return {
    resources: next,
    boughtUnits: units,
    spentGold,
  };
}
