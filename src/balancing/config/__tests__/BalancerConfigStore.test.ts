import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { BalancerConfigStore } from '../BalancerConfigStore';
import type { BalancerConfig, StatDefinition } from '../types';

/**
 * Phase 0.4 regression: ensure export/import preserves derived stats and formulas.
 */

describe('BalancerConfigStore formula round-trip', () => {
  const createMockStorage = () => {
    const store: Record<string, string> = {};
    return {
      get length() {
        return Object.keys(store).length;
      },
      key: (index: number) => Object.keys(store)[index] ?? null,
      getItem: (key: string) => (key in store ? store[key] : null),
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((key) => delete store[key]);
      }
    } satisfies Storage;
  };

  beforeEach(() => {
    vi.stubGlobal('localStorage', createMockStorage());
    BalancerConfigStore.reset();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  const addDerivedStat = (config: BalancerConfig, stat: StatDefinition): BalancerConfig => {
    const nextStats = {
      ...config.stats,
      [stat.id]: stat
    };

    const coreCard = config.cards.core;
    const nextCards = {
      ...config.cards,
      core: {
        ...coreCard,
        statIds: Array.from(new Set([...coreCard.statIds, stat.id]))
      }
    } as BalancerConfig['cards'];

    return {
      ...config,
      stats: nextStats,
      cards: nextCards
    };
  };

  it('preserves custom derived stat formulas after export/import', () => {
    const baseConfig = BalancerConfigStore.load();
    const derivedStat: StatDefinition = {
      id: 'testDerived',
      label: 'Test Derived',
      description: 'Auto-calculated for regression testing',
      type: 'number',
      min: 0,
      max: 1000,
      step: 1,
      defaultValue: 10,
      weight: 0.25,
      isCore: false,
      isDerived: true,
      formula: 'hp * damage',
      isLocked: false,
      isHidden: false
    };

    const configWithDerived = addDerivedStat(baseConfig, derivedStat);
    BalancerConfigStore.save(configWithDerived, 'added derived stat');

    const exported = BalancerConfigStore.export();
    const imported = BalancerConfigStore.import(exported);

    const roundTripStat = imported.stats[derivedStat.id];
    expect(roundTripStat).toBeDefined();
    expect(roundTripStat.isDerived).toBe(true);
    expect(roundTripStat.formula).toBe(derivedStat.formula);
  });

  it('re-hydrates missing default derived stats with formulas during import', () => {
    const exported = BalancerConfigStore.export();
    const parsed = JSON.parse(exported) as BalancerConfig;

    // Simulate an older config missing "htk" entirely
    // mergeWithDefaults should add it back with the documented formula
    delete parsed.stats.htk;

    const reserialized = JSON.stringify(parsed);
    const imported = BalancerConfigStore.import(reserialized);

    expect(imported.stats.htk).toBeDefined();
    expect(imported.stats.htk.isDerived).toBe(true);
    expect(imported.stats.htk.formula).toBe('hp / damage');
  });
});
