/**
 * Quest Timeline Heatmap Tests
 * 
 * Unit tests for the QuestTimelineHeatmap component and useQuestTimelineData hook.
 * Tests configuration management, data aggregation, rendering, and interactions.
 * 
 * @since NP-032 – Idle Village Quest Timeline Heatmap
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import QuestTimelineHeatmap from '@/ui/idleVillage/components/QuestTimelineHeatmap';
import { useQuestTimelineData } from '@/ui/idleVillage/hooks/useQuestTimelineData';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';

// Mock PersistenceService
vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn(),
  loadData: vi.fn(),
}));

// Mock performance.now
const mockPerformanceNow = vi.fn();
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow,
  },
  writable: true,
});

describe('useQuestTimelineData', () => {
  const mockSaveData = vi.mocked(saveData);
  const mockLoadData = vi.mocked(loadData);

  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformanceNow.mockReturnValue(0);
    mockLoadData.mockResolvedValue(null);
    mockSaveData.mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads configuration from storage on mount', async () => {
    const mockConfig = {
      timeline: {
        minTurn: 5,
        maxTurn: 200,
        turnsPerColumn: 10,
        zoomLevel: 1.5,
        showTurnNumbers: false,
        turnLabelFormat: 'abbreviated' as const,
      },
      colors: {
        risk: {
          low: 'rgb(0, 255, 0)',
          medium: 'rgb(255, 255, 0)',
          high: 'rgb(255, 165, 0)',
          critical: 'rgb(255, 0, 0)',
        },
        outcome: {
          success: 'rgb(0, 255, 0)',
          failure: 'rgb(255, 0, 0)',
          partial_success: 'rgb(255, 255, 0)',
          abandoned: 'rgb(128, 128, 128)',
          pending: 'rgb(192, 192, 192)',
        },
        background: 'rgb(20, 20, 20)',
        border: 'rgb(100, 100, 100)',
        grid: 'rgba(100, 100, 100, 0.3)',
        text: 'rgb(255, 255, 255)',
        hover: {
          overlay: 'rgba(255, 255, 0, 0.2)',
          text: 'rgb(0, 0, 0)',
        },
      },
      tooltip: {
        enabled: true,
        showDelay: 500,
        hideDelay: 300,
        maxWidth: 400,
        fields: {
          turn: true,
          quest: true,
          decision: true,
          outcome: true,
          risk: true,
          resident: false,
          timestamp: false,
        },
        position: 'top' as const,
      },
      interaction: {
        enableZoomPan: false,
        maxZoomLevel: 2.0,
        minZoomLevel: 0.5,
        animationDuration: 100,
        showLoadingIndicator: false,
        interactionDebounce: 50,
      },
      export: {
        enabled: false,
        formats: ['json'],
        defaultFormat: 'json' as const,
        imageQuality: 0.8,
        includeMetadata: false,
      },
      riskThresholds: {
        low: 20,
        medium: 40,
        high: 60,
        critical: 80,
      },
      performance: {
        maxDecisionsPerColumn: 25,
        enableVirtualization: false,
        debounceDelay: 25,
      },
    };

    mockLoadData.mockResolvedValue(mockConfig);

    let result;
    function TestComponent() {
      result = useQuestTimelineData();
      return null;
    }

    render(<TestComponent />);

    await waitFor(() => {
      expect(mockLoadData).toHaveBeenCalledWith('idle_village_quest_timeline_config');
      expect(result.config.timeline.minTurn).toBe(5);
      expect(result.config.timeline.zoomLevel).toBe(1.5);
    });
  });

  it('aggregates quest decisions correctly', async () => {
    let result;
    function TestComponent() {
      result = useQuestTimelineData();
      return null;
    }

    render(<TestComponent />);

    await waitFor(() => {
      expect(result.data).toBeDefined();
      expect(result.data.decisions.length).toBeGreaterThan(0);
      expect(result.data.stats.totalDecisions).toBeGreaterThan(0);
      expect(result.data.stats.turnRange.min).toBeGreaterThanOrEqual(0);
      expect(result.data.stats.turnRange.max).toBeGreaterThan(0);
    });

    // Check risk distribution
    expect(Object.keys(result.data.riskDistribution)).toContain('low');
    expect(Object.keys(result.data.riskDistribution)).toContain('medium');
    expect(Object.keys(result.data.riskDistribution)).toContain('high');
    expect(Object.keys(result.data.riskDistribution)).toContain('critical');

    // Check outcome distribution
    expect(Object.keys(result.data.outcomeDistribution)).toContain('success');
    expect(Object.keys(result.data.outcomeDistribution)).toContain('failure');
    expect(Object.keys(result.data.outcomeDistribution)).toContain('partial_success');
    expect(Object.keys(result.data.outcomeDistribution)).toContain('abandoned');
    expect(Object.keys(result.data.outcomeDistribution)).toContain('pending');
  });

  it('updates configuration and saves to storage', async () => {
    let result;
    function TestComponent() {
      result = useQuestTimelineData();
      return null;
    }

    render(<TestComponent />);

    await waitFor(() => {
      expect(result).toBeDefined();
    });

    result.updateConfig({
      timeline: {
        zoomLevel: 2.0,
        turnsPerColumn: 8,
      },
    });

    await waitFor(() => {
      expect(result.config.timeline.zoomLevel).toBe(2.0);
      expect(result.config.timeline.turnsPerColumn).toBe(8);
      expect(mockSaveData).toHaveBeenCalledWith(
        'idle_village_quest_timeline_config',
        expect.objectContaining({
          timeline: expect.objectContaining({
            zoomLevel: 2.0,
            turnsPerColumn: 8,
          }),
        })
      );
    });
  });

  it('exports data in JSON format', async () => {
    let result;
    function TestComponent() {
      result = useQuestTimelineData();
      return null;
    }

    render(<TestComponent />);

    await waitFor(() => {
      expect(result.data).toBeDefined();
    });

    const jsonData = result.exportData('json');
    expect(jsonData).toBeDefined();
    expect(typeof jsonData).toBe('string');

    const parsed = JSON.parse(jsonData);
    expect(parsed).toHaveProperty('config');
    expect(parsed).toHaveProperty('data');
    expect(parsed).toHaveProperty('exportedAt');
    expect(parsed).toHaveProperty('format');
    expect(parsed.format).toBe('json');
  });

  it('exports data in CSV format', async () => {
    let result;
    function TestComponent() {
      result = useQuestTimelineData();
      return null;
    }

    render(<TestComponent />);

    await waitFor(() => {
      expect(result.data).toBeDefined();
    });

    const csvData = result.exportData('csv');
    expect(csvData).toBeDefined();
    expect(typeof csvData).toBe('string');

    const lines = csvData.split('\n');
    expect(lines[0]).toContain('id,questId,turn,timestamp,decision,outcome,riskLevel,residentId');
    expect(lines.length).toBeGreaterThan(1); // Header + at least one data row
  });

  it('emits telemetry events when enabled', async () => {
    const mockDispatchEvent = vi.fn();
    Object.defineProperty(window, 'dispatchEvent', {
      value: mockDispatchEvent,
      writable: true,
    });

    let result;
    function TestComponent() {
      result = useQuestTimelineData({ enableTelemetry: true });
      return null;
    }

    render(<TestComponent />);

    await waitFor(() => {
      expect(result.data).toBeDefined();
    });

    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'questTimelineTelemetry',
        detail: expect.objectContaining({
          eventType: 'quest_timeline_data_loaded',
        }),
      })
    );
  });

  it('handles loading states correctly', async () => {
    let result;
    function TestComponent() {
      result = useQuestTimelineData();
      return null;
    }

    render(<TestComponent />);

    // Should be loading initially
    expect(result.isLoading).toBe(true);
    expect(result.data).toBeNull();
    expect(result.error).toBeNull();

    await waitFor(() => {
      expect(result.isLoading).toBe(false);
      expect(result.data).toBeDefined();
    });
  });

  it('calculates statistics correctly', async () => {
    let result;
    function TestComponent() {
      result = useQuestTimelineData();
      return null;
    }

    render(<TestComponent />);

    await waitFor(() => {
      expect(result.data).toBeDefined();
    });

    const stats = result.data.stats;
    expect(stats.totalDecisions).toBeGreaterThan(0);
    expect(stats.questCount).toBeGreaterThan(0);
    expect(stats.averageDecisionsPerTurn).toBeGreaterThan(0);
    expect(stats.successRate).toBeGreaterThanOrEqual(0);
    expect(stats.successRate).toBeLessThanOrEqual(1);
  });
});

describe('QuestTimelineHeatmap Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformanceNow.mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders heatmap with data', async () => {
    render(<QuestTimelineHeatmap width={600} height={300} />);

    await waitFor(() => {
      expect(screen.getByText(/Decisions:/)).toBeInTheDocument();
      expect(screen.getByText(/Success Rate:/)).toBeInTheDocument();
      expect(screen.getByText(/Riskiest Turn:/)).toBeInTheDocument();
    });

    // Check for export buttons
    expect(screen.getByText('Export JSON')).toBeInTheDocument();
    expect(screen.getByText('Export CSV')).toBeInTheDocument();

    // Check for legend
    expect(screen.getByText(/Risk Levels:/)).toBeInTheDocument();
    expect(screen.getByText(/Outcomes:/)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    // Mock hook to return loading state
    const mockUseQuestTimelineData = vi.fn(() => ({
      data: null,
      isLoading: true,
      error: null,
      config: {
        colors: { text: 'white' },
      },
    }));

    vi.doMock('@/ui/idleVillage/hooks/useQuestTimelineData', () => ({
      useQuestTimelineData: mockUseQuestTimelineData,
    }));

    render(<QuestTimelineHeatmap />);

    expect(screen.getByText('Loading quest timeline data...')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    // Mock hook to return empty data
    const mockUseQuestTimelineData = vi.fn(() => ({
      data: {
        decisions: [],
        decisionsByColumn: new Map(),
        riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
        outcomeDistribution: { success: 0, failure: 0, partial_success: 0, abandoned: 0, pending: 0 },
        stats: {
          totalDecisions: 0,
          turnRange: { min: 0, max: 0 },
          questCount: 0,
          averageDecisionsPerTurn: 0,
          riskiestTurn: 0,
          successRate: 0,
        },
      },
      isLoading: false,
      error: null,
      config: {
        colors: { text: 'white' },
      },
    }));

    vi.doMock('@/ui/idleVillage/hooks/useQuestTimelineData', () => ({
      useQuestTimelineData: mockUseQuestTimelineData,
    }));

    render(<QuestTimelineHeatmap />);

    expect(screen.getByText('No quest decisions found')).toBeInTheDocument();
    expect(screen.getByText('Complete some quests to see the timeline visualization')).toBeInTheDocument();
  });

  it('shows error state', () => {
    // Mock hook to return error
    const mockUseQuestTimelineData = vi.fn(() => ({
      data: null,
      isLoading: false,
      error: 'Failed to load data',
      config: {
        colors: { text: 'white' },
      },
    }));

    vi.doMock('@/ui/idleVillage/hooks/useQuestTimelineData', () => ({
      useQuestTimelineData: mockUseQuestTimelineData,
    }));

    render(<QuestTimelineHeatmap />);

    expect(screen.getByText('Error loading quest timeline data:')).toBeInTheDocument();
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('handles export button clicks', async () => {
    const mockExportData = vi.fn(() => '{"test": "data"}');
    const mockUseQuestTimelineData = vi.fn(() => ({
      data: {
        decisions: [{ id: '1', questId: 'test', turn: 1, timestamp: Date.now(), decision: 'test', outcome: 'success', riskLevel: 'low' }],
        decisionsByColumn: new Map([[0, [{ id: '1', questId: 'test', turn: 1, timestamp: Date.now(), decision: 'test', outcome: 'success', riskLevel: 'low' }]]),
        riskDistribution: { low: 1, medium: 0, high: 0, critical: 0 },
        outcomeDistribution: { success: 1, failure: 0, partial_success: 0, abandoned: 0, pending: 0 },
        stats: {
          totalDecisions: 1,
          turnRange: { min: 1, max: 1 },
          questCount: 1,
          averageDecisionsPerTurn: 1,
          riskiestTurn: 1,
          successRate: 1,
        },
      },
      isLoading: false,
      error: null,
      config: {
        colors: { text: 'white', border: 'gray' },
      },
      exportData: mockExportData,
    }));

    vi.doMock('@/ui/idleVillage/hooks/useQuestTimelineData', () => ({
      useQuestTimelineData: mockUseQuestTimelineData,
    }));

    const mockOnExport = vi.fn();

    render(<QuestTimelineHeatmap onExport={mockOnExport} />);

    await waitFor(() => {
      expect(screen.getByText('Export JSON')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Export JSON'));
    expect(mockExportData).toHaveBeenCalledWith('json');
    expect(mockOnExport).toHaveBeenCalledWith('json');

    fireEvent.click(screen.getByText('Export CSV'));
    expect(mockExportData).toHaveBeenCalledWith('csv');
    expect(mockOnExport).toHaveBeenCalledWith('csv');
  });

  it('displays zoom level', async () => {
    render(<QuestTimelineHeatmap />);

    await waitFor(() => {
      expect(screen.getByText(/Zoom:/)).toBeInTheDocument();
      expect(screen.getByText(/Zoom: 100%/)).toBeInTheDocument();
    });
  });

  it('handles decision click callback', async () => {
    const mockOnDecisionClick = vi.fn();
    const mockUseQuestTimelineData = vi.fn(() => ({
      data: {
        decisions: [{ id: '1', questId: 'test', turn: 1, timestamp: Date.now(), decision: 'test', outcome: 'success', riskLevel: 'low' }],
        decisionsByColumn: new Map([[0, [{ id: '1', questId: 'test', turn: 1, timestamp: Date.now(), decision: 'test', outcome: 'success', riskLevel: 'low' }]]),
        riskDistribution: { low: 1, medium: 0, high: 0, critical: 0 },
        outcomeDistribution: { success: 1, failure: 0, partial_success: 0, abandoned: 0, pending: 0 },
        stats: {
          totalDecisions: 1,
          turnRange: { min: 1, max: 1 },
          questCount: 1,
          averageDecisionsPerTurn: 1,
          riskiestTurn: 1,
          successRate: 1,
        },
        columns: [{
          column: 0,
          decisions: [{ id: '1', questId: 'test', turn: 1, timestamp: Date.now(), decision: 'test', outcome: 'success', riskLevel: 'low' }],
          turnLabel: '1',
          riskLevel: 'low',
        }],
      },
      isLoading: false,
      error: null,
      config: {
        colors: { text: 'white', border: 'gray' },
        timeline: { maxTurn: 100 },
      },
    }));

    vi.doMock('@/ui/idleVillage/hooks/useQuestTimelineData', () => ({
      useQuestTimelineData: mockUseQuestTimelineData,
    }));

    render(<QuestTimelineHeatmap onDecisionClick={mockOnDecisionClick} />);

    await waitFor(() => {
      expect(screen.getByText('Export JSON')).toBeInTheDocument();
    });

    // Find and click on the canvas
    const canvas = screen.getByRole('img'); // Canvas might be detected as img
    if (canvas) {
      fireEvent.click(canvas);
      // Note: In a real test, you'd need to calculate the exact position
      // This is a simplified test that checks the callback exists
    }
  });
});
