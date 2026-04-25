/**
 * Asset Prefetch Planner Tests – NP-265
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AssetPrefetchPlanner, DEFAULT_CONFIG } from '../../../scripts/pwa/assetPrefetchPlanner';

describe('AssetPrefetchPlanner', () => {
  let planner: AssetPrefetchPlanner;

  beforeEach(() => {
    planner = new AssetPrefetchPlanner();
  });

  describe('Initialization', () => {
    it('should create planner with default config', () => {
      expect(planner).toBeDefined();
    });

    it('should create planner with custom config', () => {
      const customPlanner = new AssetPrefetchPlanner({
        weights: { loadCount: 0.5, loadTime: 0.3, size: 0.1, recency: 0.1 },
      });
      expect(customPlanner).toBeDefined();
    });
  });

  describe('Priority Calculation', () => {
    it('should calculate priorities for assets', () => {
      planner.loadTelemetry();
      const priorities = planner.calculatePriorities();
      
      expect(priorities.length).toBeGreaterThan(0);
      expect(priorities[0]).toHaveProperty('score');
      expect(priorities[0]).toHaveProperty('priority');
    });

    it('should assign critical priority to high-usage assets', () => {
      planner.loadTelemetry();
      const priorities = planner.calculatePriorities();
      
      const criticalAssets = priorities.filter(a => a.priority === 'critical');
      expect(criticalAssets.length).toBeGreaterThan(0);
    });

    it('should sort assets by score descending', () => {
      planner.loadTelemetry();
      const priorities = planner.calculatePriorities();
      
      for (let i = 1; i < priorities.length; i++) {
        expect(priorities[i - 1].score).toBeGreaterThanOrEqual(priorities[i].score);
      }
    });
  });

  describe('Config Generation', () => {
    it('should generate valid prefetch config', () => {
      planner.loadTelemetry();
      const config = planner.generateConfig();
      
      expect(config).toHaveProperty('version');
      expect(config).toHaveProperty('generated');
      expect(config).toHaveProperty('assets');
      expect(config.assets).toHaveProperty('critical');
      expect(config.assets).toHaveProperty('high');
      expect(config.assets).toHaveProperty('medium');
      expect(config.assets).toHaveProperty('low');
    });

    it('should include metadata in config', () => {
      planner.loadTelemetry();
      const config = planner.generateConfig();
      
      expect(config.metadata).toHaveProperty('totalAssets');
      expect(config.metadata).toHaveProperty('totalSize');
      expect(config.metadata).toHaveProperty('avgLoadTime');
      expect(config.metadata).toHaveProperty('thresholds');
    });
  });

  describe('Dashboard Generation', () => {
    it('should generate markdown dashboard', () => {
      planner.loadTelemetry();
      const priorities = planner.calculatePriorities();
      const dashboard = planner.generateDashboard(priorities);
      
      expect(dashboard).toContain('# Asset Prefetch Priority Dashboard');
      expect(dashboard).toContain('## Priority Distribution');
    });
  });
});
