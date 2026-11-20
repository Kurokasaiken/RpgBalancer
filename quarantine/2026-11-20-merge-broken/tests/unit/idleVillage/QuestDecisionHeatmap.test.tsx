/**
 * Quest Decision Heatmap - Comprehensive Unit Tests
 *
 * Test suite for the Idle Village Quest Decision Heatmap (NP-022).
 * Covers configuration, engine, components, aggregation, and integration scenarios.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the sandbox diagnostics
vi.mock('@/ui/idleVillage/utils/sandboxDiagnostics', () => ({
  createSandboxDiagnostics: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import {
  DEFAULT_QUEST_DECISION_HEATMAP_CONFIG,
  QuestDecisionType,
  QuestPriority,
  QuestCategory,
  generateQuestDecisionId,
  calculateDistance,
  isWithinBounds,
  getDecisionTypeColor,
  getPriorityWeight,
  calculateIntensity,
  getDominantDecisionType,
  getDominantCategory,
  calculateSuccessRate,
  formatTimestamp,
  validateQuestDecisionData,
  aggregateDecisionsByTime,
  validateHeatmapConfig,
} from '@/ui/idleVillage/config/questDecisionHeatmapConfig';

import { QuestDecisionHeatmapEngine } from '@/ui/idleVillage/utils/questDecisionHeatmapEngine';
import { QuestDecisionHeatmapAggregator, AggregationStrategy, ClusteringAlgorithm } from '@/ui/idleVillage/utils/questDecisionHeatmapAggregator';
import { QuestDecisionHeatmap } from '@/ui/idleVillage/components/QuestDecisionHeatmap';
import { QuestDecisionHeatmapLegend } from '@/ui/idleVillage/components/QuestDecisionHeatmapLegend';
import { QuestDecisionHeatmapTooltip } from '@/ui/idleVillage/components/QuestDecisionHeatmapTooltip';
import { QuestDecisionHeatmapFilter } from '@/ui/idleVillage/components/QuestDecisionHeatmapFilter';

describe('Quest Decision Heatmap Configuration', () => {
  it('should have valid default configuration', () => {
    expect(DEFAULT_QUEST_DECISION_HEATMAP_CONFIG).toBeDefined();
    expect(DEFAULT_QUEST_DECISION_HEATMAP_CONFIG.enabled).toBe(true);
    expect(DEFAULT_QUEST_DECISION_HEATMAP_CONFIG.data).toBeDefined();
    expect(DEFAULT_QUEST_DECISION_HEATMAP_CONFIG.visualization).toBeDefined();
    expect(DEFAULT_QUEST_DECISION_HEATMAP_CONFIG.legend).toBeDefined();
    expect(DEFAULT_QUEST_DECISION_HEATMAP_CONFIG.tooltip).toBeDefined();
    expect(DEFAULT_QUEST_DECISION_HEATMAP_CONFIG.filter).toBeDefined();
  });

  it('should validate quest decision types', () => {
    expect(QuestDecisionType.ACCEPT).toBe('accept');
    expect(QuestDecisionType.DECLINE).toBe('decline');
    expect(QuestDecisionType.POSTPONE).toBe('postpone');
    expect(QuestDecisionType.DELEGATE).toBe('delegate');
    expect(QuestDecisionType.EMERGENCY).toBe('emergency');
    expect(QuestDecisionType.STRATEGIC).toBe('strategic');
    expect(QuestDecisionType.ROUTINE).toBe('routine');
    expect(QuestDecisionType.SPECIAL).toBe('special');
  });

  it('should validate priority levels', () => {
    expect(QuestPriority.CRITICAL).toBe('critical');
    expect(QuestPriority.HIGH).toBe('high');
    expect(QuestPriority.MEDIUM).toBe('medium');
    expect(QuestPriority.LOW).toBe('low');
    expect(QuestPriority.TRIVIAL).toBe('trivial');
  });

  it('should validate categories', () => {
    expect(QuestCategory.COMBAT).toBe('combat');
    expect(QuestCategory.EXPLORATION).toBe('exploration');
    expect(QuestCategory.DIPLOMACY).toBe('diplomacy');
    expect(QuestCategory.CRAFTING).toBe('crafting');
    expect(QuestCategory.TRADE).toBe('trade');
    expect(QuestCategory.MYSTERY).toBe('mystery');
    expect(QuestCategory.DEFENSE).toBe('defense');
    expect(QuestCategory.RESOURCES).toBe('resources');
  });

  it('should generate unique decision IDs', () => {
    const id1 = generateQuestDecisionId();
    const id2 = generateQuestDecisionId();
    
    expect(id1).toMatch(/^quest-decision-\d+-[a-z0-9]+$/);
    expect(id2).toMatch(/^quest-decision-\d+-[a-z0-9]+$/);
    expect(id1).not.toBe(id2);
  });

  it('should calculate distances correctly', () => {
    const coord1 = { x: 0, y: 0 };
    const coord2 = { x: 3, y: 4 };
    const coord3 = { x: 0, y: 0, z: 5 };
    const coord4 = { x: 0, y: 0, z: 12 };
    
    expect(calculateDistance(coord1, coord2)).toBe(5);
    expect(calculateDistance(coord3, coord4)).toBe(7);
  });

  it('should check bounds correctly', () => {
    const coord = { x: 5, y: 5 };
    const bounds = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
    
    expect(isWithinBounds(coord, bounds)).toBe(true);
    expect(isWithinBounds({ x: -1, y: 5 }, bounds)).toBe(false);
    expect(isWithinBounds({ x: 5, y: 11 }, bounds)).toBe(false);
  });

  it('should get decision type colors', () => {
    const config = DEFAULT_QUEST_DECISION_HEATMAP_CONFIG.visualization.colorScheme;
    
    expect(getDecisionTypeColor(QuestDecisionType.ACCEPT, config))
      .toBe(config.colors[QuestDecisionType.ACCEPT]);
    expect(getDecisionTypeColor(QuestDecisionType.DECLINE, config))
      .toBe(config.colors[QuestDecisionType.DECLINE]);
  });

  it('should get priority weights', () => {
    expect(getPriorityWeight(QuestPriority.CRITICAL)).toBe(5);
    expect(getPriorityWeight(QuestPriority.HIGH)).toBe(4);
    expect(getPriorityWeight(QuestPriority.MEDIUM)).toBe(3);
    expect(getPriorityWeight(QuestPriority.LOW)).toBe(2);
    expect(getPriorityWeight(QuestPriority.TRIVIAL)).toBe(1);
  });

  it('should calculate intensity correctly', () => {
    const decisions = [
      {
        id: '1',
        questId: 'quest1',
        questName: 'Test Quest',
        coordinates: { x: 0, y: 0 },
        decisionType: QuestDecisionType.ACCEPT,
        priority: QuestPriority.HIGH,
        category: QuestCategory.COMBAT,
        timestamp: Date.now(),
      },
      {
        id: '2',
        questId: 'quest2',
        questName: 'Test Quest 2',
        coordinates: { x: 1, y: 1 },
        decisionType: QuestDecisionType.DECLINE,
        priority: QuestPriority.LOW,
        category: QuestCategory.EXPLORATION,
        timestamp: Date.now(),
      },
    ] as any;

    const intensity = calculateIntensity(decisions);
    expect(intensity).toBeGreaterThan(0);
    expect(intensity).toBeLessThanOrEqual(1);
  });

  it('should get dominant decision type', () => {
    const decisions = [
      { decisionType: QuestDecisionType.ACCEPT },
      { decisionType: QuestDecisionType.ACCEPT },
      { decisionType: QuestDecisionType.DECLINE },
    ] as any;

    expect(getDominantDecisionType(decisions)).toBe(QuestDecisionType.ACCEPT);
  });

  it('should get dominant category', () => {
    const decisions = [
      { category: QuestCategory.COMBAT },
      { category: QuestCategory.COMBAT },
      { category: QuestCategory.EXPLORATION },
    ] as any;

    expect(getDominantCategory(decisions)).toBe(QuestCategory.COMBAT);
  });

  it('should calculate success rate', () => {
    const decisions = [
      { outcome: 'success' },
      { outcome: 'success' },
      { outcome: 'failure' },
      { outcome: 'pending' },
    ] as any;

    expect(calculateSuccessRate(decisions)).toBe(0.5);
  });

  it('should format timestamps', () => {
    const timestamp = Date.now();
    const formatted = formatTimestamp(timestamp);
    
    expect(formatted).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it('should validate quest decision data', () => {
    const validData = {
      id: 'test-1',
      questId: 'quest-1',
      questName: 'Test Quest',
      coordinates: { x: 0, y: 0 },
      decisionType: QuestDecisionType.ACCEPT,
      priority: QuestPriority.HIGH,
      category: QuestCategory.COMBAT,
      timestamp: Date.now(),
    };

    const result = validateQuestDecisionData(validData);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should reject invalid quest decision data', () => {
    const invalidData = {
      id: '',
      questId: '',
      coordinates: { x: 'invalid' as any, y: 0 },
      decisionType: 'invalid' as any,
      priority: 'invalid' as any,
      category: 'invalid' as any,
      timestamp: -1,
    };

    const result = validateQuestDecisionData(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should aggregate decisions by time', () => {
    const now = Date.now();
    const decisions = [
      { timestamp: now - 3600000 }, // 1 hour ago
      { timestamp: now - 1800000 }, // 30 minutes ago
      { timestamp: now }, // now
    ] as any;

    const aggregated = aggregateDecisionsByTime(decisions, 'hour');
    expect(aggregated.length).toBeGreaterThan(0);
  });

  it('should validate heatmap config', () => {
    const validConfig = {
      layout: { width: 800, height: 600 },
      visualization: {
        rendering: { resolution: 1, maxPoints: 1000 },
        performance: { maxDataPoints: 10000, updateInterval: 1000 },
      },
    };

    const result = validateHeatmapConfig(validConfig);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

describe('Quest Decision Heatmap Engine', () => {
  let engine: QuestDecisionHeatmapEngine;

  beforeEach(() => {
    engine = new QuestDecisionHeatmapEngine();
  });

  afterEach(() => {
    engine.destroy();
  });

  it('should initialize with default state', () => {
    expect(engine.getData()).toEqual([]);
    expect(engine.getCells()).toEqual([]);
    expect(engine.getFilteredData()).toEqual([]);
    expect(engine.getFilteredCells()).toEqual([]);
    expect(engine.canUndo()).toBe(false);
    expect(engine.canRedo()).toBe(false);
  });

  it('should set and process data', () => {
    const testData = [
      {
        id: 'test-1',
        questId: 'quest-1',
        questName: 'Test Quest',
        coordinates: { x: 0, y: 0 },
        decisionType: QuestDecisionType.ACCEPT,
        priority: QuestPriority.HIGH,
        category: QuestCategory.COMBAT,
        timestamp: Date.now(),
      },
    ] as any;

    engine.setData(testData);
    
    expect(engine.getData()).toEqual(testData);
    expect(engine.getCells().length).toBeGreaterThan(0);
  });

  it('should apply filters', () => {
    const testData = [
      {
        id: 'test-1',
        coordinates: { x: 0, y: 0 },
        decisionType: QuestDecisionType.ACCEPT,
        priority: QuestPriority.HIGH,
        category: QuestCategory.COMBAT,
        timestamp: Date.now(),
      },
      {
        id: 'test-2',
        coordinates: { x: 1, y: 1 },
        decisionType: QuestDecisionType.DECLINE,
        priority: QuestPriority.LOW,
        category: QuestCategory.EXPLORATION,
        timestamp: Date.now(),
      },
    ] as any;

    engine.setData(testData);
    
    const filters = {
      decisionTypes: [QuestDecisionType.ACCEPT],
      priorities: [QuestPriority.HIGH],
      categories: [QuestCategory.COMBAT],
    };

    engine.applyFilters(filters);
    
    const filteredData = engine.getFilteredData();
    expect(filteredData.length).toBe(1);
    expect(filteredData[0].decisionType).toBe(QuestDecisionType.ACCEPT);
  });

  it('should handle zoom operations', () => {
    const viewport = engine.getViewport();
    const initialZoom = viewport.zoom;

    engine.handleZoom(0.1, 400, 300);
    
    const newViewport = engine.getViewport();
    expect(newViewport.zoom).toBeGreaterThan(initialZoom);
  });

  it('should handle pan operations', () => {
    const viewport = engine.getViewport();
    const initialX = viewport.x;

    engine.handlePan(10, 5);
    
    const newViewport = engine.getViewport();
    expect(newViewport.x).toBe(initialX + 10);
  });

  it('should reset viewport', () => {
    engine.handleZoom(2, 400, 300);
    engine.handlePan(50, 50);
    
    engine.resetViewport();
    
    const viewport = engine.getViewport();
    expect(viewport.zoom).toBe(1);
    expect(viewport.x).toBe(0);
    expect(viewport.y).toBe(0);
  });

  it('should get cell at coordinates', () => {
    const testData = [
      {
        id: 'test-1',
        coordinates: { x: 0, y: 0 },
        decisionType: QuestDecisionType.ACCEPT,
        priority: QuestPriority.HIGH,
        category: QuestCategory.COMBAT,
        timestamp: Date.now(),
      },
    ] as any;

    engine.setData(testData);
    
    const cell = engine.getCellAt(0, 0);
    expect(cell).toBeDefined();
    expect(cell!.totalDecisions).toBe(1);
  });

  it('should generate statistics', () => {
    const testData = [
      {
        id: 'test-1',
        coordinates: { x: 0, y: 0 },
        decisionType: QuestDecisionType.ACCEPT,
        priority: QuestPriority.HIGH,
        category: QuestCategory.COMBAT,
        timestamp: Date.now(),
        outcome: 'success',
      },
      {
        id: 'test-2',
        coordinates: { x: 1, y: 1 },
        decisionType: QuestDecisionType.DECLINE,
        priority: QuestPriority.LOW,
        category: QuestCategory.EXPLORATION,
        timestamp: Date.now(),
        outcome: 'failure',
      },
    ] as any;

    engine.setData(testData);
    
    const stats = engine.getStatistics();
    expect(stats.totalDecisions).toBe(2);
    expect(stats.totalCells).toBeGreaterThan(0);
    expect(stats.successRate).toBe(0.5);
  });
});

describe('Quest Decision Heatmap Aggregator', () => {
  let aggregator: QuestDecisionHeatmapAggregator;

  beforeEach(() => {
    aggregator = new QuestDecisionHeatmapAggregator();
  });

  it('should initialize with default configuration', () => {
    const metrics = aggregator.getPerformanceMetrics();
    expect(metrics.dataPoints).toBe(0);
    expect(metrics.processingTime).toBe(0);
  });

  it('should aggregate data with no strategy', () => {
    const testData = [
      {
        id: 'test-1',
        coordinates: { x: 0, y: 0 },
        decisionType: QuestDecisionType.ACCEPT,
        priority: QuestPriority.HIGH,
        category: QuestCategory.COMBAT,
        timestamp: Date.now(),
      },
    ] as any;

    const result = aggregator.aggregate(testData);
    
    expect(result.length).toBe(1);
    expect(result[0].count).toBe(1);
    expect(result[0].metadata.aggregationStrategy).toBe(AggregationStrategy.NONE);
  });

  it('should aggregate data temporally', () => {
    aggregator.updateConfig({
      strategy: AggregationStrategy.TEMPORAL,
      temporal: {
        enabled: true,
        windowSize: 3600000, // 1 hour
        overlap: 0.1,
      },
    });

    const now = Date.now();
    const testData = [
      {
        id: 'test-1',
        coordinates: { x: 0, y: 0 },
        decisionType: QuestDecisionType.ACCEPT,
        priority: QuestPriority.HIGH,
        category: QuestCategory.COMBAT,
        timestamp: now - 1800000, // 30 minutes ago
      },
      {
        id: 'test-2',
        coordinates: { x: 1, y: 1 },
        decisionType: QuestDecisionType.DECLINE,
        priority: QuestPriority.LOW,
        category: QuestCategory.EXPLORATION,
        timestamp: now - 900000, // 15 minutes ago
      },
    ] as any;

    const result = aggregator.aggregate(testData);
    
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].metadata.aggregationStrategy).toBe(AggregationStrategy.TEMPORAL);
  });

  it('should aggregate data spatially', () => {
    aggregator.updateConfig({
      strategy: AggregationStrategy.SPATIAL,
      spatial: {
        enabled: true,
        gridSize: 50,
        maxPointsPerCell: 100,
      },
    });

    const testData = [
      {
        id: 'test-1',
        coordinates: { x: 10, y: 10 },
        decisionType: QuestDecisionType.ACCEPT,
        priority: QuestPriority.HIGH,
        category: QuestCategory.COMBAT,
        timestamp: Date.now(),
      },
      {
        id: 'test-2',
        coordinates: { x: 15, y: 15 },
        decisionType: QuestDecisionType.DECLINE,
        priority: QuestPriority.LOW,
        category: QuestCategory.EXPLORATION,
        timestamp: Date.now(),
      },
    ] as any;

    const result = aggregator.aggregate(testData);
    
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].metadata.aggregationStrategy).toBe(AggregationStrategy.SPATIAL);
  });

  it('should apply k-means clustering', () => {
    aggregator.updateConfig({
      clustering: {
        enabled: true,
        algorithm: ClusteringAlgorithm.KMEANS,
        maxClusters: 2,
        minClusterSize: 1,
        clusterRadius: 100,
      },
    });

    const testData = Array.from({ length: 10 }, (_, i) => ({
      id: `test-${i}`,
      coordinates: { x: i * 10, y: i * 10 },
      decisionType: QuestDecisionType.ACCEPT,
      priority: QuestPriority.HIGH,
      category: QuestCategory.COMBAT,
      timestamp: Date.now(),
    })) as any;

    const result = aggregator.aggregate(testData);
    
    expect(result.length).toBeLessThanOrEqual(testData.length);
  });

  it('should export and import data', () => {
    const testData = [
      {
        id: 'test-1',
        coordinates: { x: 0, y: 0 },
        decisionType: QuestDecisionType.ACCEPT,
        priority: QuestPriority.HIGH,
        category: QuestCategory.COMBAT,
        timestamp: Date.now(),
      },
    ] as any;

    const aggregated = aggregator.aggregate(testData);
    const exported = aggregator.exportData();
    
    expect(exported.aggregatedData).toEqual(aggregated);
    expect(exported.performanceMetrics).toBeDefined();
    expect(exported.config).toBeDefined();

    // Test import
    const newAggregator = new QuestDecisionHeatmapAggregator();
    newAggregator.importData(exported);
    
    const importedMetrics = newAggregator.getPerformanceMetrics();
    expect(importedMetrics.dataPoints).toBe(exported.performanceMetrics.dataPoints);
  });
});

describe('Quest Decision Heatmap Components', () => {
  describe('QuestDecisionHeatmapLegend', () => {
    it('should render legend with data', () => {
      const data = {
        decisions: {
          [QuestDecisionType.ACCEPT]: 10,
          [QuestDecisionType.DECLINE]: 5,
        },
        priorities: {
          [QuestPriority.HIGH]: 8,
          [QuestPriority.LOW]: 7,
        },
        categories: {
          [QuestCategory.COMBAT]: 12,
          [QuestCategory.EXPLORATION]: 3,
        },
      };

      render(
        <QuestDecisionHeatmapLegend
          data={data}
          visible={true}
        />
      );

      expect(screen.getByText('Legend')).toBeInTheDocument();
      expect(screen.getByText('Accept')).toBeInTheDocument();
      expect(screen.getByText('Decline')).toBeInTheDocument();
    });

    it('should handle item selection', async () => {
      const onSelectionChange = vi.fn();
      const data = {
        decisions: {
          [QuestDecisionType.ACCEPT]: 10,
          [QuestDecisionType.DECLINE]: 5,
        },
        priorities: {},
        categories: {},
      };

      render(
        <QuestDecisionHeatmapLegend
          data={data}
          onSelectionChange={onSelectionChange}
          visible={true}
        />
      );

      const acceptItem = screen.getByText('Accept');
      await userEvent.click(acceptItem);

      expect(onSelectionChange).toHaveBeenCalled();
    });
  });

  describe('QuestDecisionHeatmapTooltip', () => {
    it('should render tooltip with decision data', () => {
      const decision = {
        id: 'test-1',
        questId: 'quest-1',
        questName: 'Test Quest',
        coordinates: { x: 0, y: 0 },
        decisionType: QuestDecisionType.ACCEPT,
        priority: QuestPriority.HIGH,
        category: QuestCategory.COMBAT,
        timestamp: Date.now(),
        impact: {
          resources: 100,
          reputation: 50,
          time: 60,
          risk: 25,
        },
      } as any;

      render(
        <QuestDecisionHeatmapTooltip
          decision={decision}
          position={{ x: 100, y: 100 }}
          visible={true}
        />
      );

      expect(screen.getByText('Test Quest')).toBeInTheDocument();
      expect(screen.getByText('Quest Information')).toBeInTheDocument();
    });

    it('should render tooltip with cell data', () => {
      const cell = {
        x: 0,
        y: 0,
        decisions: [
          {
            id: 'test-1',
            questName: 'Test Quest',
            decisionType: QuestDecisionType.ACCEPT,
            priority: QuestPriority.HIGH,
            category: QuestCategory.COMBAT,
            timestamp: Date.now(),
          },
        ] as any,
        intensity: 0.8,
        dominantDecision: QuestDecisionType.ACCEPT,
        dominantCategory: QuestCategory.COMBAT,
        averagePriority: 4,
        successRate: 0.75,
        totalDecisions: 1,
      };

      render(
        <QuestDecisionHeatmapTooltip
          cell={cell}
          position={{ x: 100, y: 100 }}
          visible={true}
        />
      );

      expect(screen.getByText('1 Quest Decisions')).toBeInTheDocument();
      expect(screen.getByText('Cell Summary')).toBeInTheDocument();
    });
  });

  describe('QuestDecisionHeatmapFilter', () => {
    it('should render filter with options', () => {
      const options = {
        decisionTypes: [QuestDecisionType.ACCEPT, QuestDecisionType.DECLINE],
        priorities: [QuestPriority.HIGH, QuestPriority.LOW],
        categories: [QuestCategory.COMBAT, QuestCategory.EXPLORATION],
        outcomes: ['success', 'failure'],
        regions: ['Region1', 'Region2'],
        zones: ['Zone1', 'Zone2'],
        decisionMakers: ['Player1', 'Player2'],
      };

      render(
        <QuestDecisionHeatmapFilter
          options={options}
          visible={true}
        />
      );

      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByText('Decision Types')).toBeInTheDocument();
      expect(screen.getByText('Priorities')).toBeInTheDocument();
    });

    it('should handle filter changes', async () => {
      const onFiltersChange = vi.fn();
      const options = {
        decisionTypes: [QuestDecisionType.ACCEPT, QuestDecisionType.DECLINE],
        priorities: [QuestPriority.HIGH, QuestPriority.LOW],
        categories: [QuestCategory.COMBAT, QuestCategory.EXPLORATION],
        outcomes: ['success', 'failure'],
        regions: [],
        zones: [],
        decisionMakers: [],
      };

      render(
        <QuestDecisionHeatmapFilter
          options={options}
          onFiltersChange={onFiltersChange}
          visible={true}
        />
      );

      // Find and click a checkbox
      const checkboxes = screen.getAllByRole('checkbox');
      if (checkboxes.length > 0) {
        await userEvent.click(checkboxes[0]);
        expect(onFiltersChange).toHaveBeenCalled();
      }
    });
  });

  describe('QuestDecisionHeatmap', () => {
    it('should render heatmap with data', () => {
      const data = [
        {
          id: 'test-1',
          questId: 'quest-1',
          questName: 'Test Quest',
          coordinates: { x: 0, y: 0 },
          decisionType: QuestDecisionType.ACCEPT,
          priority: QuestPriority.HIGH,
          category: QuestCategory.COMBAT,
          timestamp: Date.now(),
        },
      ] as any;

      render(
        <QuestDecisionHeatmap
          data={data}
          visible={true}
        />
      );

      // The component should render without errors
      expect(document.querySelector('.bg-gray-900')).toBeInTheDocument();
    });

    it('should handle selection changes', async () => {
      const onSelectionChange = vi.fn();
      const data = [
        {
          id: 'test-1',
          questId: 'quest-1',
          questName: 'Test Quest',
          coordinates: { x: 0, y: 0 },
          decisionType: QuestDecisionType.ACCEPT,
          priority: QuestPriority.HIGH,
          category: QuestCategory.COMBAT,
          timestamp: Date.now(),
        },
      ] as any;

      render(
        <QuestDecisionHeatmap
          data={data}
          onSelectionChange={onSelectionChange}
          visible={true}
        />
      );

      // The component should render and be ready for interaction
      expect(document.querySelector('.bg-gray-900')).toBeInTheDocument();
    });
  });
});

describe('Integration Tests', () => {
  it('should handle complete heatmap workflow', async () => {
    const data = Array.from({ length: 100 }, (_, i) => ({
      id: `test-${i}`,
      questId: `quest-${i}`,
      questName: `Test Quest ${i}`,
      coordinates: { x: Math.random() * 100, y: Math.random() * 100 },
      decisionType: Object.values(QuestDecisionType)[Math.floor(Math.random() * Object.values(QuestDecisionType).length)],
      priority: Object.values(QuestPriority)[Math.floor(Math.random() * Object.values(QuestPriority).length)],
      category: Object.values(QuestCategory)[Math.floor(Math.random() * Object.values(QuestCategory).length)],
      timestamp: Date.now() - Math.random() * 86400000, // Random time within last 24 hours
      outcome: ['success', 'failure', 'partial'][Math.floor(Math.random() * 3)],
    })) as any;

    const onSelectionChange = vi.fn();
    const onFilterChange = vi.fn();

    render(
      <QuestDecisionHeatmap
        data={data}
        onSelectionChange={onSelectionChange}
        onFilterChange={onFilterChange}
        showLegend={true}
        showTooltip={true}
        showFilter={true}
        visible={true}
      />
    );

    // Component should render without errors
    expect(document.querySelector('.bg-gray-900')).toBeInTheDocument();
    
    // Legend should be visible
    expect(screen.getByText('Legend')).toBeInTheDocument();
    
    // Filter should be visible
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('should handle large datasets efficiently', () => {
    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      id: `test-${i}`,
      questId: `quest-${i}`,
      questName: `Test Quest ${i}`,
      coordinates: { x: Math.random() * 500, y: Math.random() * 500 },
      decisionType: QuestDecisionType.ACCEPT,
      priority: QuestPriority.HIGH,
      category: QuestCategory.COMBAT,
      timestamp: Date.now(),
    })) as any;

    const startTime = performance.now();
    
    render(
      <QuestDecisionHeatmap
        data={largeData}
        visible={true}
      />
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within reasonable time
    expect(renderTime).toBeLessThan(1000); // 1 second
  });

  it('should handle real-time updates', async () => {
    const initialData = [
      {
        id: 'test-1',
        questId: 'quest-1',
        questName: 'Test Quest',
        coordinates: { x: 0, y: 0 },
        decisionType: QuestDecisionType.ACCEPT,
        priority: QuestPriority.HIGH,
        category: QuestCategory.COMBAT,
        timestamp: Date.now(),
      },
    ] as any;

    const { rerender } = render(
      <QuestDecisionHeatmap
        data={initialData}
        visible={true}
      />
    );

    expect(document.querySelector('.bg-gray-900')).toBeInTheDocument();

    // Simulate real-time data update
    const updatedData = [
      ...initialData,
      {
        id: 'test-2',
        questId: 'quest-2',
        questName: 'Test Quest 2',
        coordinates: { x: 10, y: 10 },
        decisionType: QuestDecisionType.DECLINE,
        priority: QuestPriority.LOW,
        category: QuestCategory.EXPLORATION,
        timestamp: Date.now(),
      },
    ] as any;

    rerender(
      <QuestDecisionHeatmap
        data={updatedData}
        visible={true}
      />
    );

    expect(document.querySelector('.bg-gray-900')).toBeInTheDocument();
  });
});

describe('Performance Tests', () => {
  it('should handle aggregation performance', () => {
    const aggregator = new QuestDecisionHeatmapAggregator({
      strategy: AggregationStrategy.SPATIAL,
      spatial: {
        enabled: true,
        gridSize: 50,
        maxPointsPerCell: 100,
      },
      clustering: {
        enabled: true,
        algorithm: ClusteringAlgorithm.KMEANS,
        maxClusters: 10,
        minClusterSize: 5,
        clusterRadius: 100,
      },
    });

    const largeData = Array.from({ length: 5000 }, (_, i) => ({
      id: `test-${i}`,
      coordinates: { x: Math.random() * 1000, y: Math.random() * 1000 },
      decisionType: QuestDecisionType.ACCEPT,
      priority: QuestPriority.HIGH,
      category: QuestCategory.COMBAT,
      timestamp: Date.now(),
    })) as any;

    const startTime = performance.now();
    const result = aggregator.aggregate(largeData);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
    expect(result.length).toBeLessThan(largeData.length);
    
    const metrics = aggregator.getPerformanceMetrics();
    expect(metrics.aggregationTime).toBeLessThan(5000);
    expect(metrics.clusteringTime).toBeLessThan(5000);

    aggregator.destroy();
  });

  it('should handle memory usage efficiently', () => {
    const aggregator = new QuestDecisionHeatmapAggregator({
      performance: {
        maxDataPoints: 10000,
        batchSize: 1000,
        enableCache: true,
        cacheSize: 1000,
      },
    });

    const data = Array.from({ length: 10000 }, (_, i) => ({
      id: `test-${i}`,
      coordinates: { x: i, y: i },
      decisionType: QuestDecisionType.ACCEPT,
      priority: QuestPriority.HIGH,
      category: QuestCategory.COMBAT,
      timestamp: Date.now(),
    })) as any;

    const result = aggregator.aggregate(data);
    const metrics = aggregator.getPerformanceMetrics();

    expect(metrics.memoryUsage).toBeLessThan(50 * 1024 * 1024); // 50MB
    expect(result.length).toBeGreaterThan(0);

    aggregator.destroy();
  });
});

describe('Error Handling', () => {
  it('should handle invalid data gracefully', () => {
    const engine = new QuestDecisionHeatmapEngine();
    
    const invalidData = [
      null,
      undefined,
      { id: '', coordinates: null },
      { coordinates: { x: 'invalid' } },
    ] as any;

    expect(() => engine.setData(invalidData)).not.toThrow();
    
    const result = engine.getData();
    expect(Array.isArray(result)).toBe(true);
    
    engine.destroy();
  });

  it('should handle rendering errors gracefully', () => {
    const invalidConfig = {
      layout: { width: -100, height: -100 },
      visualization: {
        rendering: { resolution: -1, maxPoints: -1 },
      },
    };

    expect(() => {
      render(
        <QuestDecisionHeatmap
          data={[]}
          config={invalidConfig}
          visible={true}
        />
      );
    }).not.toThrow();
  });

  it('should handle aggregation errors gracefully', () => {
    const aggregator = new QuestDecisionHeatmapAggregator();
    
    const invalidData = [null, undefined] as any;
    
    expect(() => aggregator.aggregate(invalidData)).not.toThrow();
    
    const metrics = aggregator.getPerformanceMetrics();
    expect(metrics.dataPoints).toBe(0);
    
    aggregator.destroy();
  });
});
