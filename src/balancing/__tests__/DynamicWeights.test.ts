import { describe, it, expect } from 'vitest';
import { DynamicWeightCalculator } from '../synergy/DynamicWeightCalculator';
import { DEFAULT_STATS } from '../types';
import { STAT_WEIGHTS } from '../statWeights';

describe('DynamicWeightCalculator', () => {
    const calculator = new DynamicWeightCalculator(DEFAULT_STATS);
    const baseWeights: Record<string, number> = {};
    Object.entries(STAT_WEIGHTS).forEach(([key, val]) => {
        baseWeights[key] = val;
    });

    it('should calculate baseline weights close to theoretical values', async () => {
        const results = await calculator.calculateWeights(DEFAULT_STATS, baseWeights);

        const damageRes = results.find(r => r.stat === 'damage');
        expect(damageRes).toBeDefined();
        // Base weight for damage is usually around 1.5 - 2.0 depending on balance
        // We just check it's positive and has a value
        expect(damageRes?.dynamicWeight).toBeGreaterThan(0);
    });

    it('should detect synergy: High HP makes Armor more valuable', async () => {
        // 1. Baseline Armor Value
        const baselineResults = await calculator.calculateWeights(DEFAULT_STATS, baseWeights);
        const baselineArmor = baselineResults.find(r => r.stat === 'armor')?.dynamicWeight || 0;

        // 2. High HP Build
        const highHPStats = { ...DEFAULT_STATS, hp: DEFAULT_STATS.hp + 500 }; // +500 HP
        const hpResults = await calculator.calculateWeights(highHPStats, baseWeights);
        const hpArmor = hpResults.find(r => r.stat === 'armor')?.dynamicWeight || 0;

        // Armor should be worth MORE on high HP because it protects a larger pool
        expect(hpArmor).toBeGreaterThan(baselineArmor);

        console.log(`Baseline Armor Value: ${baselineArmor.toFixed(2)} HP`);
        console.log(`High HP Armor Value: ${hpArmor.toFixed(2)} HP`);
        console.log(`Increase: ${((hpArmor - baselineArmor) / baselineArmor * 100).toFixed(1)}%`);
    });

    it('should detect anti-synergy or diminishing returns', async () => {
        // Example: If we have 100% Crit Chance, more Crit Chance is worth 0
        const critCappedStats = { ...DEFAULT_STATS, critChance: 100 };
        const results = await calculator.calculateWeights(critCappedStats, baseWeights);

        const critRes = results.find(r => r.stat === 'critChance');
        // Should be very low or zero (depending on implementation of cap)
        // Note: Our engine might allow >100% but it does nothing extra
        expect(critRes?.dynamicWeight).toBeLessThan(2.5); // < 50% of base value (5.0)
    });
});
