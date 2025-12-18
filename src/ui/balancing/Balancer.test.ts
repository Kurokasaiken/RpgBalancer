/**
 * Balancer New - Import/Export Tests
 * 
 * Tests for the BalancerNew component's import/export functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BalancerConfigStore } from '../../balancing/config/BalancerConfigStore';
import type { BalancerConfig } from '../../balancing/config/types';

describe('Balancer New - Import/Export', () => {
  beforeEach(() => {
    localStorage.clear();
    BalancerConfigStore.reset();
  });

  it('should export config as valid JSON', () => {
    const exported = BalancerConfigStore.export();
    
    expect(exported).toBeDefined();
    expect(typeof exported).toBe('string');
    
    // Should be valid JSON
    const parsed = JSON.parse(exported);
    expect(parsed).toBeDefined();
  });

  it('should export all core stats', () => {
    const exported = BalancerConfigStore.export();
    const parsed = JSON.parse(exported) as BalancerConfig;
    
    expect(parsed.stats.hp).toBeDefined();
    expect(parsed.stats.damage).toBeDefined();
    expect(parsed.stats.htk).toBeDefined();
  });

  it('should preserve formulas in export', () => {
    const exported = BalancerConfigStore.export();
    const parsed = JSON.parse(exported) as BalancerConfig;
    
    const htkStat = parsed.stats.htk;
    expect(htkStat.isDerived).toBe(true);
    expect(htkStat.formula).toBe('hp / damage');
  });

  it('should preserve all cards in export', () => {
    const exported = BalancerConfigStore.export();
    const parsed = JSON.parse(exported) as BalancerConfig;
    
    expect(parsed.cards.core).toBeDefined();
    expect(parsed.cards.txcHarmony).toBeDefined();
    expect(parsed.cards.criticalEquilibrium).toBeDefined();
    expect(parsed.cards.mitigationPen).toBeDefined();
    expect(parsed.cards.sustain).toBeDefined();
    expect(parsed.cards.combatMetrics).toBeDefined();
  });

  it('should import valid JSON config', () => {
    const exported = BalancerConfigStore.export();
    const imported = BalancerConfigStore.import(exported);
    
    expect(imported).toBeDefined();
    expect(imported.stats.hp).toBeDefined();
    expect(imported.stats.damage).toBeDefined();
  });

  it('should preserve formulas after import', () => {
    const exported = BalancerConfigStore.export();
    const imported = BalancerConfigStore.import(exported);
    
    const htkStat = imported.stats.htk;
    expect(htkStat.isDerived).toBe(true);
    expect(htkStat.formula).toBe('hp / damage');
  });

  it('should round-trip export/import correctly', () => {
    const original = BalancerConfigStore.load();
    const exported = BalancerConfigStore.export();
    const imported = BalancerConfigStore.import(exported);
    
    // Compare key properties
    expect(Object.keys(imported.stats).sort()).toEqual(Object.keys(original.stats).sort());
    expect(Object.keys(imported.cards).sort()).toEqual(Object.keys(original.cards).sort());
    
    // Check formula preservation
    expect(imported.stats.htk.formula).toBe(original.stats.htk.formula);
    expect(imported.stats.htk.isDerived).toBe(original.stats.htk.isDerived);
  });

  it('should handle invalid JSON import gracefully', () => {
    const invalidJson = '{ invalid json }';
    
    expect(() => {
      BalancerConfigStore.import(invalidJson);
    }).toThrow();
  });

  it('should preserve stat properties after import', () => {
    const exported = BalancerConfigStore.export();
    const imported = BalancerConfigStore.import(exported);
    
    const hpStat = imported.stats.hp;
    expect(hpStat.label).toBe('Hit Points');
    expect(hpStat.min).toBe(10);
    expect(hpStat.max).toBe(2000);
    expect(hpStat.defaultValue).toBe(150);
    expect(hpStat.isCore).toBe(true);
  });

  it('should preserve card properties after import', () => {
    const exported = BalancerConfigStore.export();
    const imported = BalancerConfigStore.import(exported);
    
    const coreCard = imported.cards.core;
    expect(coreCard.title).toBe('Core Profile');
    expect(coreCard.isCore).toBe(true);
    expect(coreCard.statIds).toContain('hp');
    expect(coreCard.statIds).toContain('damage');
    expect(coreCard.statIds).toContain('htk');
  });

  it('should preserve preset data after import', () => {
    const exported = BalancerConfigStore.export();
    const imported = BalancerConfigStore.import(exported);
    
    expect(imported.presets.standard).toBeDefined();
    expect(imported.presets.standard.name).toBe('Standard');
    expect(imported.presets.standard.weights.hp).toBe(1.0);
    expect(imported.presets.standard.weights.damage).toBe(5.0);
  });

  it('should maintain config integrity after multiple export/import cycles', () => {
    let config = BalancerConfigStore.load();
    
    for (let i = 0; i < 3; i++) {
      const exported = BalancerConfigStore.export();
      config = BalancerConfigStore.import(exported);
    }
    
    // After 3 cycles, formulas should still be intact
    expect(config.stats.htk.isDerived).toBe(true);
    expect(config.stats.htk.formula).toBe('hp / damage');
  });

  it('should export with proper formatting', () => {
    const exported = BalancerConfigStore.export();
    
    // Should be pretty-printed (with indentation)
    expect(exported).toContain('\n');
    expect(exported).toContain('  ');
  });

  it('should handle empty/null values in import', () => {
    const config = BalancerConfigStore.load();
    const exported = JSON.stringify(config, null, 2);
    
    // Should not throw
    expect(() => {
      BalancerConfigStore.import(exported);
    }).not.toThrow();
  });
});
