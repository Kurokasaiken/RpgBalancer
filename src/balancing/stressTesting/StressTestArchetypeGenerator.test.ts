import { describe, it, expect } from 'vitest';
import { StressTestArchetypeGenerator } from '@/balancing/stressTesting/StressTestArchetypeGenerator';
import type { BalancerConfig } from '@/balancing/config/types';

const mockConfig: BalancerConfig = {
  version: '1.0',
  stats: {
    hp: {
      id: 'hp',
      label: 'HP',
      type: 'number',
      min: 0,
      max: 1000,
      step: 1,
      defaultValue: 100,
      weight: 1,
      isCore: true,
      isDerived: false,
    },
    damage: {
      id: 'damage',
      label: 'Damage',
      type: 'number',
      min: 0,
      max: 500,
      step: 1,
      defaultValue: 50,
      weight: 2,
      isCore: true,
      isDerived: false,
    },
    defense: {
      id: 'defense',
      label: 'Defense',
      type: 'number',
      min: 0,
      max: 250,
      step: 1,
      defaultValue: 25,
      weight: 1.5,
      isCore: true,
      isDerived: false,
    },
  },
  cards: {
    core: {
      id: 'core',
      title: 'Core',
      color: '#FFD700',
      statIds: ['hp', 'damage', 'defense'],
      isCore: true,
      order: 0,
    },
  },
  presets: {},
  activePresetId: '',
};

describe('StressTestArchetypeGenerator', () => {
  it('generates correct number of archetypes', () => {
    const generator = new StressTestArchetypeGenerator(mockConfig);
    const archetypes = generator.generateAllStressTestArchetypes();

    // 1 baseline + 3 singles + 3 pairs (C(3,2)=3)
    expect(archetypes).toHaveLength(7);

    const baseline = archetypes.find(a => a.id === 'baseline');
    expect(baseline).toBeDefined();
    expect(baseline?.stats.hp).toBe(100);
    expect(baseline?.stats.damage).toBe(50);
    expect(baseline?.stats.defense).toBe(25);

    const singles = archetypes.filter(a => a.id.startsWith('single_'));
    expect(singles).toHaveLength(3);

    const pairs = archetypes.filter(a => a.id.startsWith('pair_'));
    expect(pairs).toHaveLength(3);
  });

  it('generates single stat boosts correctly', () => {
    const generator = new StressTestArchetypeGenerator(mockConfig);
    const singles = generator.generateSingleStatArchetypes();

    const hpBoost = singles.find(a => a.id === 'single_hp');
    expect(hpBoost).toBeDefined();
    expect(hpBoost?.stats.hp).toBe(100 + Math.round(1 * 25)); // weight * 25
    expect(hpBoost?.stats.damage).toBe(50);
  });

  it('generates pair stat boosts correctly', () => {
    const generator = new StressTestArchetypeGenerator(mockConfig);
    const pairs = generator.generatePairStatArchetypes();

    const hpDamagePair = pairs.find(a => a.id === 'pair_hp_damage');
    expect(hpDamagePair).toBeDefined();
    expect(hpDamagePair?.stats.hp).toBe(100 + Math.round(1 * 25));
    expect(hpDamagePair?.stats.damage).toBe(50 + Math.round(2 * 25));
    expect(hpDamagePair?.stats.defense).toBe(25);
  });

  it('produces deterministic results with LCG seeding', () => {
    const seed = 12345;
    const generator1 = new StressTestArchetypeGenerator(mockConfig, seed);
    const generator2 = new StressTestArchetypeGenerator(mockConfig, seed);

    const archetypes1 = generator1.generateAllStressTestArchetypes();
    const archetypes2 = generator2.generateAllStressTestArchetypes();

    expect(archetypes1).toHaveLength(archetypes2.length);
    archetypes1.forEach((arch, index) => {
      expect(arch.id).toBe(archetypes2[index].id);
      expect(arch.name).toBe(archetypes2[index].name);
      expect(arch.stats).toEqual(archetypes2[index].stats);
      expect(arch.seed).toBe(archetypes2[index].seed);
    });
  });

  it('handles config with no stats (edge case)', () => {
    const emptyConfig: BalancerConfig = {
      version: '1.0',
      stats: {},
      cards: {},
      presets: {},
      activePresetId: '',
    };
    const generator = new StressTestArchetypeGenerator(emptyConfig);
    const archetypes = generator.generateAllStressTestArchetypes();

    expect(archetypes).toHaveLength(1); // only baseline
    const baseline = archetypes[0];
    expect(baseline.id).toBe('baseline');
    expect(baseline.stats).toEqual({});
  });

  it('handles config with invalid weights (negative or zero)', () => {
    const invalidConfig: BalancerConfig = {
      version: '1.0',
      stats: {
        hp: { ...mockConfig.stats.hp, weight: -1 },
        damage: { ...mockConfig.stats.damage, weight: 0 },
        defense: { ...mockConfig.stats.defense, weight: 1.5 },
      },
      cards: mockConfig.cards,
      presets: {},
      activePresetId: '',
    };
    const generator = new StressTestArchetypeGenerator(invalidConfig);
    const singles = generator.generateSingleStatArchetypes();

    const hpBoost = singles.find(a => a.id === 'single_hp');
    expect(hpBoost?.stats.hp).toBe(100 + Math.round(-1 * 25)); // negative weight
    expect(hpBoost?.stats.damage).toBe(50);
    expect(hpBoost?.stats.defense).toBe(25);

    const damageBoost = singles.find(a => a.id === 'single_damage');
    expect(damageBoost?.stats.damage).toBe(50 + Math.round(0 * 25)); // zero weight
  });
});
