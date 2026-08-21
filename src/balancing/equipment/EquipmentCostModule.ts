/**
 * EquipmentCostModule - Canonical Equipment Power and Cost Calculation
 *
 * Mirrors SpellCostModule: equipment cost is the HP-equivalent budget spent
 * to gain (value - baseline) across each stat.
 */

import type { EquipmentItem } from './equipmentTypes';
import {
  getEquipmentBaseBudget,
  getEquipmentRarityConfig,
  getEquipmentStatWeight,
  getEquipmentTypeConfig,
} from './equipmentBalancingConfig';

export interface EquipmentCostBreakdown {
  power: number;
  cost: number;
  budget: number;
  balance: number;
  isBalanced: boolean;
  tier: 1 | 2 | 3 | 4 | 5;
}

export const EquipmentCostModule = {
  calculateEquipmentPower(item: EquipmentItem): number {
    const config = getEquipmentTypeConfig(item.type);
    let power = 0;

    for (const stat of config.unlockedStats) {
      const value = item.stats[stat] ?? 0;
      const baseline = config.baseline[stat] ?? 0;
      const weight = getEquipmentStatWeight(stat);
      power += (value - baseline) * weight;
    }

    return Math.round(power * 10) / 10;
  },

  calculateEquipmentCost(item: EquipmentItem): number {
    const config = getEquipmentTypeConfig(item.type);
    let cost = 0;

    for (const stat of config.unlockedStats) {
      const value = item.stats[stat] ?? 0;
      const baseline = config.baseline[stat] ?? 0;
      const weight = getEquipmentStatWeight(stat);
      cost += (value - baseline) * weight;
    }

    // Rounded down to 1 decimal; negative stats give negative cost (refund).
    return Math.round(cost * 10) / 10;
  },

  getRecommendedBudget(item: EquipmentItem): number {
    const base = getEquipmentBaseBudget();
    const rarity = getEquipmentRarityConfig(item.rarity);
    return base + rarity.extraPoints;
  },

  isBalanced(item: EquipmentItem, tolerance = 0.01): boolean {
    const cost = this.calculateEquipmentCost(item);
    const budget = this.getRecommendedBudget(item);
    return cost <= budget + tolerance;
  },

  calculateTier(cost: number): 1 | 2 | 3 | 4 | 5 {
    if (cost <= 10) return 1;
    if (cost <= 30) return 2;
    if (cost <= 60) return 3;
    if (cost <= 100) return 4;
    return 5;
  },

  getCompleteCost(item: EquipmentItem): EquipmentCostBreakdown {
    const power = this.calculateEquipmentPower(item);
    const cost = this.calculateEquipmentCost(item);
    const budget = this.getRecommendedBudget(item);
    const balance = Math.round((cost - budget) * 10) / 10;

    return {
      power,
      cost,
      budget,
      balance,
      isBalanced: this.isBalanced(item),
      tier: this.calculateTier(cost),
    };
  },
};
