/**
 * Drop Feedback Heatmap Tests
 * 
 * Comprehensive test suite for heatmap component and hook.
 * 
 * @module tests/unit/idleVillage/DropFeedbackHeatmap.test
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useDropFeedbackHeatmap } from '../../../src/ui/idleVillage/hooks/useDropFeedbackHeatmap';
import { DropFeedbackHeatmap } from '../../../src/ui/idleVillage/analytics/DropFeedbackHeatmap';
import type { DropFeedbackTelemetryPayload } from '../../../src/ui/idleVillage/utils/dropFeedbackTelemetry';

vi.mock('../../../src/shared/persistence/PersistenceService', () => {
  return {
    saveData: vi.fn().mockResolvedValue(undefined),
    loadData: vi.fn().mockResolvedValue([]),
    clearData: vi.fn().mockResolvedValue(undefined),
  };
});

import { saveData, loadData, clearData } from '../../../src/shared/persistence/PersistenceService';

const mockedLoadData = loadData as unknown as MockedFunction<typeof loadData>;
const mockedSaveData = saveData as unknown as MockedFunction<typeof saveData>;
const mockedClearData = clearData as unknown as MockedFunction<typeof clearData>;

type HookValue = ReturnType<typeof useDropFeedbackHeatmap>;

async function waitForHookLoad(result: { current: HookValue }) {
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });
}

describe('useDropFeedbackHeatmap', () => {
  beforeEach(() => {
    mockedLoadData.mockResolvedValue([]);
    mockedSaveData.mockClear();
    mockedClearData.mockClear();
  });

  describe('Hook Initialization', () => {
    it('should initialize with empty dataset', async () => {
      const { result } = renderHook(() => useDropFeedbackHeatmap());

      await waitForHookLoad(result);
      expect(result.current.dataset.slots.size).toBe(0);
      expect(result.current.dataset.stats.totalEvents).toBe(0);
    });

    it('should load events from storage', async () => {
      const mockEvents: DropFeedbackTelemetryPayload[] = [
        {
          feedbackType: 'valid',
          activityId: 'forest-work',
          interactive: true,
          timestamp: Date.now(),
        },
        {
          feedbackType: 'invalid',
          activityId: 'forest-work',
          validationRule: 'fatigue_threshold',
          interactive: true,
          timestamp: Date.now(),
        },
      ];

      mockedLoadData.mockResolvedValueOnce(mockEvents);

      const { result } = renderHook(() => useDropFeedbackHeatmap());

      await waitForHookLoad(result);
      expect(result.current.dataset.stats.totalEvents).toBe(2);
      expect(result.current.dataset.slots.size).toBe(1);
    });
  });

  describe('Event Aggregation', () => {
    it('should aggregate events by slot', async () => {
      const { result } = renderHook(() => useDropFeedbackHeatmap());
      await waitForHookLoad(result);

      act(() => {
        result.current.addEvent({
          feedbackType: 'valid',
          activityId: 'forest-work',
          interactive: true,
          timestamp: Date.now(),
        });
        result.current.addEvent({
          feedbackType: 'invalid',
          activityId: 'forest-work',
          interactive: true,
          timestamp: Date.now(),
        });
        result.current.addEvent({
          feedbackType: 'valid',
          activityId: 'mining',
          interactive: true,
          timestamp: Date.now(),
        });
      });

      await waitFor(() => {
        expect(result.current.dataset.slots.size).toBe(2);
        expect(result.current.dataset.slots.get('forest-work')).toBeTruthy();
      });
      expect(result.current.dataset.slots.get('forest-work')?.totalCount).toBe(2);
      expect(result.current.dataset.slots.get('mining')?.totalCount).toBe(1);
    });

    it('should count feedback types correctly', async () => {
      const { result } = renderHook(() => useDropFeedbackHeatmap());
      await waitForHookLoad(result);

      act(() => {
        result.current.addEvent({
          feedbackType: 'valid',
          activityId: 'forest-work',
          interactive: true,
          timestamp: Date.now(),
        });
        result.current.addEvent({
          feedbackType: 'invalid',
          activityId: 'forest-work',
          interactive: true,
          timestamp: Date.now(),
        });
        result.current.addEvent({
          feedbackType: 'warning',
          activityId: 'forest-work',
          interactive: true,
          timestamp: Date.now(),
        });
        result.current.addEvent({
          feedbackType: 'blocked',
          activityId: 'forest-work',
          interactive: true,
          timestamp: Date.now(),
        });
      });

      await waitFor(() => {
        expect(result.current.dataset.slots.get('forest-work')).toBeTruthy();
      });
      const slotData = result.current.dataset.slots.get('forest-work');
      expect(slotData?.validCount).toBe(1);
      expect(slotData?.invalidCount).toBe(1);
      expect(slotData?.warningCount).toBe(1);
      expect(slotData?.blockedCount).toBe(1);
      expect(slotData?.totalCount).toBe(4);
    });

    it('should track top validation rule', async () => {
      const { result } = renderHook(() => useDropFeedbackHeatmap());
      await waitForHookLoad(result);

      act(() => {
        result.current.addEvent({
          feedbackType: 'invalid',
          activityId: 'forest-work',
          validationRule: 'fatigue_threshold',
          interactive: true,
          timestamp: Date.now(),
        });
        result.current.addEvent({
          feedbackType: 'invalid',
          activityId: 'forest-work',
          validationRule: 'fatigue_threshold',
          interactive: true,
          timestamp: Date.now(),
        });
        result.current.addEvent({
          feedbackType: 'invalid',
          activityId: 'forest-work',
          validationRule: 'crew_capacity',
          interactive: true,
          timestamp: Date.now(),
        });
      });

      await waitFor(() => {
        expect(result.current.dataset.slots.get('forest-work')).toBeTruthy();
      });
      const slotData = result.current.dataset.slots.get('forest-work');
      expect(slotData?.topValidationRule).toBe('fatigue_threshold');
    });
  });

  describe('Filtering', () => {
    it('should filter by feedback type', async () => {
      const mockEvents: DropFeedbackTelemetryPayload[] = [
        {
          feedbackType: 'valid',
          activityId: 'forest-work',
          interactive: true,
          timestamp: Date.now(),
        },
        {
          feedbackType: 'invalid',
          activityId: 'forest-work',
          interactive: true,
          timestamp: Date.now(),
        },
      ];

      mockedLoadData.mockResolvedValueOnce(mockEvents);

      const { result } = renderHook(() => 
        useDropFeedbackHeatmap({ feedbackTypes: ['invalid'] })
      );

      await waitForHookLoad(result);
      expect(result.current.dataset.stats.totalEvents).toBe(1);
      expect(result.current.dataset.stats.invalidEvents).toBe(1);
    });

    it('should filter by date range', async () => {
      const now = Date.now();
      const mockEvents: DropFeedbackTelemetryPayload[] = [
        {
          feedbackType: 'valid',
          activityId: 'forest-work',
          interactive: true,
          timestamp: now - 10000,
        },
        {
          feedbackType: 'invalid',
          activityId: 'forest-work',
          interactive: true,
          timestamp: now,
        },
      ];

      mockedLoadData.mockResolvedValueOnce(mockEvents);

      const { result } = renderHook(() => 
        useDropFeedbackHeatmap({ 
          dateRange: { start: now - 5000, end: now + 1000 } 
        })
      );

      await waitForHookLoad(result);
      expect(result.current.dataset.stats.totalEvents).toBe(1);
    });

    it('should filter by minimum event count', async () => {
      const { result } = renderHook(() => 
        useDropFeedbackHeatmap({ minEventCount: 2 })
      );
      await waitForHookLoad(result);

      act(() => {
        result.current.addEvent({
          feedbackType: 'valid',
          activityId: 'forest-work',
          interactive: true,
          timestamp: Date.now(),
        });
        result.current.addEvent({
          feedbackType: 'valid',
          activityId: 'forest-work',
          interactive: true,
          timestamp: Date.now(),
        });
        result.current.addEvent({
          feedbackType: 'valid',
          activityId: 'mining',
          interactive: true,
          timestamp: Date.now(),
        });
      });

      await waitFor(() => {
        expect(result.current.dataset.slots.size).toBe(1);
        expect(result.current.dataset.slots.has('forest-work')).toBe(true);
      });
      expect(result.current.dataset.slots.has('forest-work')).toBe(true);
      expect(result.current.dataset.slots.has('mining')).toBe(false);
    });
  });

  describe('Hotspots', () => {
    it('should identify top invalid hotspots', async () => {
      const { result } = renderHook(() => useDropFeedbackHeatmap());
      await waitForHookLoad(result);

      act(() => {
        // Add 5 invalid events to forest-work
        for (let i = 0; i < 5; i++) {
          result.current.addEvent({
            feedbackType: 'invalid',
            activityId: 'forest-work',
            interactive: true,
            timestamp: Date.now(),
          });
        }
        // Add 2 invalid events to mining
        for (let i = 0; i < 2; i++) {
          result.current.addEvent({
            feedbackType: 'invalid',
            activityId: 'mining',
            interactive: true,
            timestamp: Date.now(),
          });
        }
      });

      await waitFor(() => {
        expect(result.current.dataset.hotspots.length).toBe(2);
      });
      expect(result.current.dataset.hotspots[0].slotId).toBe('forest-work');
      expect(result.current.dataset.hotspots[0].invalidCount).toBe(5);
      expect(result.current.dataset.hotspots[1].slotId).toBe('mining');
    });

    it('should limit hotspots to top 10', async () => {
      const { result } = renderHook(() => useDropFeedbackHeatmap());
      await waitForHookLoad(result);

      act(() => {
        for (let i = 0; i < 15; i++) {
          result.current.addEvent({
            feedbackType: 'invalid',
            activityId: `slot-${i}`,
            interactive: true,
            timestamp: Date.now(),
          });
        }
      });

      await waitFor(() => {
        expect(result.current.dataset.hotspots.length).toBe(10);
      });
    });
  });

  describe('Export', () => {
    it('should export to JSON', async () => {
      const { result } = renderHook(() => useDropFeedbackHeatmap());
      await waitForHookLoad(result);

      act(() => {
        result.current.addEvent({
          feedbackType: 'valid',
          activityId: 'forest-work',
          interactive: true,
          timestamp: Date.now(),
        });
      });

      const json = result.current.exportJSON();
      const parsed = JSON.parse(json);

      expect(parsed.stats.totalEvents).toBe(1);
      expect(parsed.slots).toHaveLength(1);
      await waitFor(() => {
        expect(mockedSaveData).toHaveBeenCalled();
      });
    });

    it('should export to Markdown', async () => {
      const { result } = renderHook(() => useDropFeedbackHeatmap());
      await waitForHookLoad(result);

      act(() => {
        result.current.addEvent({
          feedbackType: 'invalid',
          activityId: 'forest-work',
          interactive: true,
          timestamp: Date.now(),
        });
      });

      const markdown = result.current.exportMarkdown();

      expect(markdown).toContain('# Drop Feedback Heatmap Report');
      expect(markdown).toContain('## Statistics');
      expect(markdown).toContain('## Top Invalid Hotspots');
      expect(markdown).toContain('forest-work');
      await waitFor(() => {
        expect(mockedSaveData).toHaveBeenCalled();
      });
    });
  });

  describe('Clear Events', () => {
    it('should clear all events', async () => {
      const { result } = renderHook(() => useDropFeedbackHeatmap());
      await waitForHookLoad(result);

      act(() => {
        result.current.addEvent({
          feedbackType: 'valid',
          activityId: 'forest-work',
          interactive: true,
          timestamp: Date.now(),
        });
      });

      await waitFor(() => {
        expect(result.current.dataset.stats.totalEvents).toBe(1);
      });

      act(() => {
        result.current.clearEvents();
      });

      await waitFor(() => {
        expect(result.current.dataset.stats.totalEvents).toBe(0);
      });
      expect(result.current.dataset.slots.size).toBe(0);
      expect(mockedClearData).toHaveBeenCalled();
    });
  });
});

describe('DropFeedbackHeatmap Component', () => {
  beforeEach(() => {
    mockedLoadData.mockResolvedValue([]);
  });

  it('should render empty state', async () => {
    render(<DropFeedbackHeatmap />);
    await screen.findByText(/No drop feedback events recorded yet/i);
  });

  it('should render heatmap with data', async () => {
    const mockEvents: DropFeedbackTelemetryPayload[] = [
      {
        feedbackType: 'valid',
        activityId: 'forest-work',
        interactive: true,
        timestamp: Date.now(),
      },
      {
        feedbackType: 'invalid',
        activityId: 'forest-work',
        interactive: true,
        timestamp: Date.now(),
      },
    ];

    mockedLoadData.mockResolvedValueOnce(mockEvents);

    render(<DropFeedbackHeatmap />);
    
    const summary = await screen.findByTestId('heatmap-summary');
    expect(screen.getByText(/Drop Feedback Heatmap/i)).toBeInTheDocument();
    expect(summary).toHaveTextContent('2 feedback events');
  });

  it('should handle feedback type selection', async () => {
    const mockEvents: DropFeedbackTelemetryPayload[] = [
      {
        feedbackType: 'valid',
        activityId: 'forest-work',
        interactive: true,
        timestamp: Date.now(),
      },
    ];

    mockedLoadData.mockResolvedValueOnce(mockEvents);

    render(<DropFeedbackHeatmap />);
    
    const select = await screen.findByLabelText(/Feedback Type:/i);
    fireEvent.change(select, { target: { value: 'valid' } });

    await waitFor(() => {
      expect(select).toHaveValue('valid');
    });
  });

  it('should call onViewed callback', async () => {
    const onViewed = vi.fn();
    const mockEvents: DropFeedbackTelemetryPayload[] = [
      {
        feedbackType: 'valid',
        activityId: 'forest-work',
        interactive: true,
        timestamp: Date.now(),
      },
    ];

    mockedLoadData.mockResolvedValueOnce(mockEvents);

    render(<DropFeedbackHeatmap onViewed={onViewed} />);
    
    await waitFor(() => {
      expect(onViewed).toHaveBeenCalled();
    });
  });

  it('should call onExport callback for JSON', async () => {
    const onExport = vi.fn();
    const mockEvents: DropFeedbackTelemetryPayload[] = [
      {
        feedbackType: 'valid',
        activityId: 'forest-work',
        interactive: true,
        timestamp: Date.now(),
      },
    ];

    mockedLoadData.mockResolvedValueOnce(mockEvents);

    render(<DropFeedbackHeatmap onExport={onExport} />);
    
    const exportButton = await screen.findByRole('button', { name: /Export JSON/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(onExport).toHaveBeenCalledWith('json');
    });
  });

  it('should display statistics', async () => {
    const mockEvents: DropFeedbackTelemetryPayload[] = [
      {
        feedbackType: 'valid',
        activityId: 'forest-work',
        interactive: true,
        timestamp: Date.now(),
      },
      {
        feedbackType: 'invalid',
        activityId: 'forest-work',
        interactive: true,
        timestamp: Date.now(),
      },
      {
        feedbackType: 'warning',
        activityId: 'forest-work',
        interactive: true,
        timestamp: Date.now(),
      },
    ];

    mockedLoadData.mockResolvedValueOnce(mockEvents);

    render(<DropFeedbackHeatmap />);
    
    const totalStat = await screen.findByTestId('heatmap-stat-total');
    const validStat = await screen.findByTestId('heatmap-stat-valid');
    expect(totalStat).toHaveTextContent('3');
    expect(validStat).toHaveTextContent('1');
  });

  it('should display hotspots table', async () => {
    const mockEvents: DropFeedbackTelemetryPayload[] = [
      {
        feedbackType: 'invalid',
        activityId: 'forest-work',
        interactive: true,
        timestamp: Date.now(),
      },
      {
        feedbackType: 'invalid',
        activityId: 'forest-work',
        interactive: true,
        timestamp: Date.now(),
      },
    ];

    mockedLoadData.mockResolvedValueOnce(mockEvents);

    render(<DropFeedbackHeatmap />);
    
    await screen.findByText(/Top Invalid Hotspots/i);
    expect(screen.getByText('forest-work')).toBeInTheDocument();
  });
});
