import { describe, it, expect } from 'vitest';
import type { BalancerConfig } from '../config/types';
import type { StatEfficiency } from '../testing/RoundRobinRunner';
import {
  computeStatWeightSuggestions,
  DEFAULT_STAT_WEIGHT_ADVISOR_OPTIONS,
} from '../stats/StatWeightAdvisor';

function createTestConfig(): BalancerConfig {
  return {
    version: '1.0.0',
    stats: {
      damage: {
        id: 'damage',
        label: 'Damage',
        type: 'number',
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 10,
        weight: 5,
        isCore: true,
        isDerived: false,
      },
      armor: {
        id: 'armor',
        label: 'Armor',
        type: 'number',
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 0,
        weight: 3,
        isCore: true,
        isDerived: false,
      },
      htk: {
        id: 'htk',
        label: 'Hits to Kill',
        type: 'number',
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 0,
        weight: 0,
        isCore: true,
        isDerived: true,
        formula: 'hp / damage',
      },
    },
    cards: {},
    presets: {},
    activePresetId: 'default',
  };
}

function makeEfficiency(
  statId: string,
  efficiency: number,
  assessment: StatEfficiency['assessment'],
): StatEfficiency {
  return {
    statId,
    pointsPerStat: 25,
    efficiency,
    wins: 0,
    losses: 0,
    draws: 0,
    rank: 0,
    assessment,
  };
}

describe('StatWeightAdvisor', () => {
  it('should suggest no change for stats within the target band', () => {
    const config = createTestConfig();
    const efficiencies: StatEfficiency[] = [
      makeEfficiency('damage', 0.5, 'balanced'),
    ];

    const suggestions = computeStatWeightSuggestions(config, efficiencies);

    expect(suggestions).toHaveLength(1);
    const s = suggestions[0];
    expect(s.delta).toBeCloseTo(0, 10);
    expect(s.suggestedWeight).toBeCloseTo(config.stats.damage.weight, 10);
  });

  it('should decrease weight for overpowered stats', () => {
    const config = createTestConfig();
    const efficiencies: StatEfficiency[] = [
      makeEfficiency('damage', 0.7, 'OP'),
    ];

    const suggestions = computeStatWeightSuggestions(config, efficiencies);

    expect(suggestions).toHaveLength(1);
    const s = suggestions[0];
    expect(s.suggestedWeight).toBeLessThan(s.currentWeight);
    expect(s.delta).toBeLessThan(0);
  });

  it('should increase weight for underpowered stats', () => {
    const config = createTestConfig();
    const efficiencies: StatEfficiency[] = [
      makeEfficiency('armor', 0.3, 'underpowered'),
    ];

    const suggestions = computeStatWeightSuggestions(config, efficiencies);

    expect(suggestions).toHaveLength(1);
    const s = suggestions[0];
    expect(s.suggestedWeight).toBeGreaterThan(s.currentWeight);
    expect(s.delta).toBeGreaterThan(0);
  });

  it('should ignore derived or formula-based stats', () => {
    const config = createTestConfig();
    const efficiencies: StatEfficiency[] = [
      makeEfficiency('htk', 0.8, 'OP'),
    ];

    const suggestions = computeStatWeightSuggestions(config, efficiencies);

    expect(suggestions).toHaveLength(0);
  });

  it('should respect custom advisor options', () => {
    const config = createTestConfig();
    const efficiencies: StatEfficiency[] = [
      makeEfficiency('damage', 0.62, 'strong'),
    ];

    const options = {
      ...DEFAULT_STAT_WEIGHT_ADVISOR_OPTIONS,
      maxRelativeDelta: 0.05,
    };

    const suggestions = computeStatWeightSuggestions(config, efficiencies, options);

    expect(suggestions).toHaveLength(1);
    const s = suggestions[0];
    const relativeDelta = s.delta / s.currentWeight;
    expect(Math.abs(relativeDelta)).toBeLessThanOrEqual(options.maxRelativeDelta);
  });
});
