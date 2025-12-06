import { describe, it, expect } from 'vitest';
import { BalancerConfigStore } from '../BalancerConfigStore';
import type { BalancerConfig, StatDefinition } from '../types';
import { validateFormula } from '../FormulaEngine';
import { DEFAULT_STATS } from '../../types';

// Healthcheck suite for BalancerConfig.
// These tests are intentionally conservative: they validate structural
// integrity and obvious config mistakes without over-constraining
// specific balancing values.

describe('BalancerConfig healthcheck', () => {
  const loadConfig = (): BalancerConfig => {
    const config = BalancerConfigStore.load();
    // Basic structural sanity
    expect(config).toBeTruthy();
    expect(typeof config.version).toBe('string');
    return config;
  };

  it('has a valid active preset', () => {
    const config = loadConfig();
    expect(config.activePresetId).toBeTruthy();
    expect(config.presets[config.activePresetId]).toBeTruthy();
  });

  it('all cards reference existing stats', () => {
    const config = loadConfig();
    const statIds = new Set(Object.keys(config.stats));

    Object.values(config.cards).forEach((card) => {
      card.statIds.forEach((statId) => {
        expect(statIds.has(statId)).toBe(true);
      });
    });
  });

  it('derived stats with formulas reference only known stats and pass formula validation', () => {
    const config = loadConfig();
    const allStatIds = Object.keys(config.stats);

    const derivedWithFormula = Object.values(config.stats).filter(
      (s: StatDefinition) => s.isDerived && typeof s.formula === 'string' && s.formula.trim().length > 0,
    );

    derivedWithFormula.forEach((stat) => {
      const result = validateFormula(stat.formula as string, allStatIds);
      expect(result.valid).toBe(true);
      // Also ensure we do not reference completely unknown identifiers
      result.usedStats.forEach((id) => {
        expect(allStatIds.includes(id)).toBe(true);
      });
    });
  });

  it('stats that overlap StatBlock keys are numeric in DEFAULT_STATS', () => {
    const config = loadConfig();
    const defaultKeys = new Set(Object.keys(DEFAULT_STATS));

    Object.keys(config.stats).forEach((statId) => {
      if (defaultKeys.has(statId)) {
        const key = statId as keyof typeof DEFAULT_STATS;
        const value = DEFAULT_STATS[key];
        expect(typeof value).toBe('number');
      }
    });
  });
});
