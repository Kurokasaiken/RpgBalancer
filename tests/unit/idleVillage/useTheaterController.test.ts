import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheaterController } from '@/ui/idleVillage/hooks/useTheaterController';
import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';

// Mock diagnostics
vi.mock('@/ui/idleVillage/utils/sandboxDiagnostics', () => ({
  createSandboxDiagnostics: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

// Mock timers
vi.useFakeTimers();

describe('useTheaterController', () => {
  const mockConfig: IdleVillageConfig = {
    version: '1.0.0',
    globalRules: {
      dayLengthInTimeUnits: 24,
      maxFatigueBeforeExhausted: 100,
    },
    resources: {
      gold: { label: 'Gold', icon: '💰', colorClass: 'text-yellow-200' },
      food: { label: 'Food', icon: '🍖', colorClass: 'text-green-200' },
    },
    activities: {},
    ui: {
      theater: {
        hoverOpenMs: 500,
        hoverCloseMs: 300,
        maxPreviewCount: 3,
        slotPriorities: {
          quest: 0,
          job: 1,
          danger: 2,
          system: 3,
        },
        excludedSlots: ['day-night-cycle'],
      },
    },
  };

  const mockSlots: ActivitySlotData[] = [
    {
      slotId: 'quest-slot',
      label: 'Quest',
      activity: {
        id: 'quest-activity',
        name: 'Quest Activity',
        tags: ['quest'],
        durationFormula: '60',
        statRequirement: { strength: 10 },
        metadata: { mapSlotId: 'quest-location' },
      },
      iconName: '⚔️',
      mapSlotLabel: 'Quest Location',
      assignedWorkerId: null,
    },
    {
      slotId: 'job-slot',
      label: 'Job',
      activity: {
        id: 'job-activity',
        name: 'Job Activity',
        tags: ['job'],
        durationFormula: '30',
        statRequirement: { agility: 5 },
        metadata: { mapSlotId: 'job-location' },
      },
      iconName: '🔨',
      mapSlotLabel: 'Job Location',
      assignedWorkerId: null,
    },
    {
      slotId: 'day-night-cycle',
      label: 'Day/Night',
      activity: {
        id: 'cycle-activity',
        name: 'Cycle Activity',
        tags: ['system'],
        durationFormula: '1440',
        statRequirement: {},
      },
      iconName: '🌅',
      assignedWorkerId: null,
    },
  ];

  const mockRandomFn = vi.fn(() => 0.5);

  beforeEach(() => {
    vi.clearAllMocks();
    mockRandomFn.mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  const createHook = (config = mockConfig, slots = mockSlots) => {
    return renderHook(() =>
      useTheaterController({
        slots,
        locationSlotIds: ['quest-slot', 'job-slot'],
        dragControllerRef: { current: null },
        config,
        randomFn: mockRandomFn,
      }),
    );
  };

  describe('initial state', () => {
    it('should initialize with closed theater', () => {
      const { result } = createHook();

      expect(result.current.isTheaterOpen).toBe(false);
      expect(result.current.theaterSlotId).toBe(null);
      expect(result.current.theaterPreviewIds).toEqual([]);
      expect(result.current.theaterCloseTimeout).toBe(null);
    });

    it('should provide all required handlers', () => {
      const { result } = createHook();

      expect(typeof result.current.openTheater).toBe('function');
      expect(typeof result.current.closeTheater).toBe('function');
      expect(typeof result.current.hoverStart).toBe('function');
      expect(typeof result.current.hoverEnd).toBe('function');
      expect(typeof result.current.handleLocationInspect).toBe('function');
      expect(typeof result.current.selectTheaterPreviewIds).toBe('function');
    });
  });

  describe('selectTheaterPreviewIds', () => {
    it('should select preview slots based on priority', () => {
      const { result } = createHook();

      const previewIds = result.current.selectTheaterPreviewIds('quest-slot');

      expect(previewIds).toContain('quest-slot');
      expect(previewIds.length).toBeLessThanOrEqual(3);
      expect(previewIds).not.toContain('day-night-cycle');
    });

    it('should return empty array for no playable slots', () => {
      const configWithAllExcluded = {
        ...mockConfig,
        ui: {
          theater: {
            excludedSlots: ['quest-slot', 'job-slot', 'day-night-cycle'],
          },
        },
      };

      const { result } = createHook(configWithAllExcluded);

      const previewIds = result.current.selectTheaterPreviewIds();

      expect(previewIds).toEqual([]);
    });

    it('should prioritize preferred slot when provided', () => {
      const { result } = createHook();

      const previewIds = result.current.selectTheaterPreviewIds('job-slot');

      expect(previewIds[0]).toBe('job-slot');
    });
  });

  describe('hover-open scenario', () => {
    it('should open theater after hover delay', () => {
      const { result } = createHook();

      act(() => {
        result.current.hoverStart('quest-slot');
      });

      expect(result.current.isTheaterOpen).toBe(false);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.isTheaterOpen).toBe(true);
      expect(result.current.theaterSlotId).toBe('quest-slot');
      expect(result.current.theaterPreviewIds).toContain('quest-slot');
    });

    it('should cancel hover open if hover ends before delay', () => {
      const { result } = createHook();

      act(() => {
        result.current.hoverStart('quest-slot');
      });

      act(() => {
        result.current.hoverEnd();
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.isTheaterOpen).toBe(false);
    });

    it('should not open if already open', () => {
      const { result } = createHook();

      act(() => {
        result.current.openTheater('quest-slot');
      });

      expect(result.current.isTheaterOpen).toBe(true);

      act(() => {
        result.current.hoverStart('job-slot');
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.theaterSlotId).toBe('quest-slot');
    });
  });

  describe('delayed close scenario', () => {
    it('should close theater after hover delay ends', () => {
      const { result } = createHook();

      act(() => {
        result.current.openTheater('quest-slot');
      });

      expect(result.current.isTheaterOpen).toBe(true);

      act(() => {
        result.current.hoverEnd();
      });

      expect(result.current.isTheaterOpen).toBe(true);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.isTheaterOpen).toBe(false);
      expect(result.current.theaterSlotId).toBe(null);
    });

    it('should cancel close if hover starts again', () => {
      const { result } = createHook();

      act(() => {
        result.current.openTheater('quest-slot');
      });

      act(() => {
        result.current.hoverEnd();
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.isTheaterOpen).toBe(true);

      act(() => {
        result.current.hoverStart('job-slot');
      });

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current.isTheaterOpen).toBe(true);
    });

    it('should clear timeout on manual close', () => {
      const { result } = createHook();

      act(() => {
        result.current.openTheater('quest-slot');
      });

      act(() => {
        result.current.hoverEnd();
      });

      expect(result.current.theaterCloseTimeout).not.toBe(null);

      act(() => {
        result.current.closeTheater();
      });

      expect(result.current.isTheaterOpen).toBe(false);
      expect(result.current.theaterCloseTimeout).toBe(null);
    });
  });

  describe('drag interactions', () => {
    it('should handle resident drag enter', () => {
      const { result } = createHook();

      act(() => {
        result.current.handleLocationResidentDragEnter('resident-1', 'quest-slot');
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.isTheaterOpen).toBe(true);
      expect(result.current.theaterPreviewIds).toContain('quest-slot');
    });

    it('should handle resident drag leave', () => {
      const { result } = createHook();

      act(() => {
        result.current.handleLocationResidentDragEnter('resident-1', 'quest-slot');
      });

      act(() => {
        result.current.handleLocationResidentDragLeave('quest-slot');
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.isTheaterOpen).toBe(false);
    });

    it('should handle resident drop', () => {
      const mockDropHandler = vi.fn();
      const dragControllerRef = {
        current: {
          handleLocationResidentDrop: mockDropHandler,
        },
      };

      const { result } = renderHook(() =>
        useTheaterController({
          slots: mockSlots,
          locationSlotIds: ['quest-slot'],
          dragControllerRef,
          config: mockConfig,
          randomFn: mockRandomFn,
        }),
      );

      act(() => {
        result.current.openTheater('quest-slot');
      });

      act(() => {
        result.current.handleLocationResidentDrop('resident-1');
      });

      expect(mockDropHandler).toHaveBeenCalledWith('resident-1');
      expect(result.current.isTheaterOpen).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should clear timers on unmount', () => {
      const { result, unmount } = createHook();

      act(() => {
        result.current.hoverStart('quest-slot');
        result.current.hoverEnd();
      });

      expect(result.current.theaterCloseTimeout).not.toBe(null);

      unmount();

      // Verify timers are cleared (no way to directly check, but this should not throw)
      vi.advanceTimersByTime(1000);
    });
  });

  describe('config-driven behavior', () => {
    it('should use custom timings from config', () => {
      const customConfig = {
        ...mockConfig,
        ui: {
          theater: {
            hoverOpenMs: 1000,
            hoverCloseMs: 500,
            maxPreviewCount: 2,
          },
        },
      };

      const { result } = createHook(customConfig);

      act(() => {
        result.current.hoverStart('quest-slot');
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.isTheaterOpen).toBe(false);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.isTheaterOpen).toBe(true);
    });

    it('should respect max preview count', () => {
      const customConfig = {
        ...mockConfig,
        ui: {
          theater: {
            maxPreviewCount: 1,
          },
        },
      };

      const { result } = createHook(customConfig);

      const previewIds = result.current.selectTheaterPreviewIds();

      expect(previewIds.length).toBeLessThanOrEqual(1);
    });
  });
});
