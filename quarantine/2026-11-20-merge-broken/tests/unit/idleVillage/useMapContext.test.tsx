/**
 * Unit tests for useMapContext hook.
 * 
 * Tests the comprehensive Idle Village Map context functionality including:
 * - Village state management and resident seeding
 * - Resource tracking and normalization
 * - Activity scheduling and slot management
 * - Theater controller integration
 * - Drag and drop functionality
 * - Clock and time management
 * - Diagnostics logging
 * 
 * @fileoverview
 * Comprehensive test suite for the useMapContext hook covering all major
 * functionality areas including state management, scheduling, and UI interactions.
 * 
 * @author ChatGPT Codex 5.1
 * @since 2026-01-11
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock data - defined before hoisted mocks
const mockVillageState = {
  residents: {
    'resident-1': {
      id: 'resident-1',
      displayName: 'Test Resident',
      fatigue: 0.2,
      status: 'available',
      isInjured: false,
      stats: { strength: 5, agility: 3 },
    },
  },
  activities: {},
  resources: {
    gold: 100,
    food: 50,
  },
  currentTime: 3600,
};

const mockConfig = {
  version: '1.0.0',
  resources: {
    gold: { label: 'Gold', icon: '🪙', colorClass: 'text-yellow-200' },
    food: { label: 'Food', icon: '🍖', colorClass: 'text-green-200' },
  },
  activities: {
    'gathering': {
      id: 'gathering',
      name: 'Gathering',
      description: 'Gather resources',
      durationFormula: '300',
      statRequirement: { allOf: ['strength'] },
      dangerRating: 3,
      tags: ['production'],
    },
  },
  residents: {},
  globalRules: {
    maxFatigueBeforeExhausted: 80,
    dayLengthInTimeUnits: 24,
  },
};

// Mock implementations - properly hoisted
const mockVillageStateStore = vi.hoisted(() => ({
  state: mockVillageState,
  updateState: vi.fn(),
  resetState: vi.fn(),
}));

const mockVillageShellContext = vi.hoisted(() => ({
  useVillageShellContext: vi.fn(() => ({
    config: mockConfig,
    villageStateStore: mockVillageStateStore,
    shellPresetOptions: [{ id: 'punch_club_light', label: 'Punch Club' }],
    activeShellPresetId: 'punch_club_light',
    setShellPresetId: vi.fn(),
    theme: {
      activePreset: 'default',
      presets: {},
      setPreset: vi.fn(),
      randomizeTheme: vi.fn(),
      resetRandomization: vi.fn(),
      isRandomized: false,
    },
  })),
}));

const mockActivityScheduler = vi.hoisted(() => ({
  villageState: mockVillageState,
  resumeTimer: vi.fn(),
  pauseTimer: vi.fn(),
  canAssignResident: vi.fn(() => true),
  getActivityState: vi.fn(() => ({
    elapsed: 100,
    duration: 300,
    progress: 0.33,
  })),
}));

// Mock dependencies
vi.mock('@/ui/idleVillage/hooks/useVillageShellContext', mockVillageShellContext);
vi.mock('@/ui/idleVillage/hooks/useSandboxClock');
vi.mock('@/ui/idleVillage/hooks/useSandboxSlotModels');
vi.mock('@/ui/idleVillage/hooks/useSandboxDragController');
vi.mock('@/ui/idleVillage/hooks/useSandboxCore');
vi.mock('@/ui/idleVillage/hooks/useTheaterController');
vi.mock('@/ui/idleVillage/hooks/useTheaterViewModels');
vi.mock('@/ui/idleVillage/hooks/useSandboxDemoPanel');
vi.mock('@/ui/idleVillage/hooks/useSandboxResetController');
vi.mock('@/ui/idleVillage/hooks/useQuestTelemetry');
vi.mock('@/ui/idleVillage/hooks/useSandboxInteractionMode');
vi.mock('@/ui/idleVillage/hooks/useMediaQuery');
vi.mock('@/ui/idleVillage/components/DragContextStore');
vi.mock('@/engine/game/idleVillage/characterImport');
vi.mock('@/ui/idleVillage/utils/sandboxDiagnostics');
vi.mock('@/ui/idleVillage/verbSummaries');
vi.mock('@/ui/idleVillage/selectors/useHudSelectors');

// Import after mocks
import { useMapContext } from '@/ui/idleVillage/hooks/useMapContext';

describe('useMapContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useMapContext());

    expect(result.current.config).toBeDefined();
    expect(result.current.villageState).toBeDefined();
    expect(result.current.residents).toBeDefined();
    expect(result.current.resourceItems).toBeDefined();
  });

  it('should handle resident selection', () => {
    const { result } = renderHook(() => useMapContext());

    act(() => {
      result.current.handleResidentSelect('resident-1');
    });

    expect(result.current.selectedResidentId).toBe('resident-1');
  });

  it('should toggle cycle playing state', () => {
    const { result } = renderHook(() => useMapContext());

    const initialPlayingState = result.current.isCyclePlaying;

    act(() => {
      result.current.toggleCyclePlaying();
    });

    expect(result.current.isCyclePlaying).toBe(!initialPlayingState);
  });

  it('should provide resource summary data', () => {
    const { result } = renderHook(() => useMapContext());

    expect(result.current.headerResources).toEqual({
      gold: 100,
      food: 50,
      population: 1,
    });
  });

  it('should handle theater operations', () => {
    const { result } = renderHook(() => useMapContext());

    expect(result.current.isTheaterOpen).toBeDefined();
    expect(typeof result.current.handleLocationInspect).toBe('function');
    expect(typeof result.current.handleCloseTheater).toBe('function');
  });

  it('should provide drag and drop handlers', () => {
    const { result } = renderHook(() => useMapContext());

    expect(typeof result.current.handleWorkerDrop).toBe('function');
    expect(typeof result.current.handleDragOver).toBe('function');
    expect(typeof result.current.canSlotAcceptDrop).toBe('function');
  });

  it('should handle state updates', () => {
    const { result } = renderHook(() => useMapContext());

    act(() => {
      result.current.updateState((state) => ({
        ...state,
        currentTime: state.currentTime + 100,
      }), 'test update');
    });

    expect(mockVillageStateStore.updateState).toHaveBeenCalled();
  });

  it('should provide slot compatibility diagnostics', () => {
    const { result } = renderHook(() => useMapContext());

    const compatibility = result.current.getResidentCompatibility('resident-1');
    expect(compatibility).toBeDefined();
    expect(compatibility.state).toBe('valid');
  });

  it('should handle reset operations', () => {
    const { result } = renderHook(() => useMapContext());

    act(() => {
      result.current.handleResetResidents();
    });

    expect(mockVillageStateStore.resetState).toHaveBeenCalled();
  });

  it('should provide activity area handlers', () => {
    const { result } = renderHook(() => useMapContext());

    expect(result.current.activityAreaHandlers).toBeDefined();
    expect(typeof result.current.activityAreaHandlers.onWorkerDrop).toBe('function');
    expect(typeof result.current.activityAreaHandlers.onInspect).toBe('function');
  });

  it('should manage assignment feedback', () => {
    const { result } = renderHook(() => useMapContext());

    act(() => {
      result.current.setAssignmentFeedback('Test feedback');
    });

    expect(result.current.assignmentFeedback).toBe('Test feedback');
  });

  it('should provide resident slot rack data', () => {
    const { result } = renderHook(() => useMapContext());

    expect(result.current.residentSlotRackSlots).toBeDefined();
    expect(Array.isArray(result.current.residentSlotRackSlots)).toBe(true);
  });

  it('should provide resident slot rack handlers', () => {
    const { result } = renderHook(() => useMapContext());

    expect(typeof result.current.residentSlotRackHandlers.assignResidentToSlot).toBe('function');
    expect(typeof result.current.residentSlotRackHandlers.clearSlot).toBe('function');
    expect(typeof result.current.residentSlotRackHandlers.getSlotProgress).toBe('function');
  });

  it('should handle theater slot operations', () => {
    const { result } = renderHook(() => useMapContext());

    expect(typeof result.current.openTheaterForSlot).toBe('function');
    expect(result.current.theaterVerbs).toBeDefined();
    expect(result.current.theaterSlotCards).toBeDefined();
  });

  it('should provide demo panel state', () => {
    const { result } = renderHook(() => useMapContext());

    expect(result.current.demoPanelState).toBeDefined();
    expect(result.current.demoPanelHandlers).toBeDefined();
  });

  it('should handle clock operations', () => {
    const { result } = renderHook(() => useMapContext());

    expect(typeof result.current.handleResetSandboxState).toBe('function');
    expect(result.current.cycleProgressFraction).toBeDefined();
    expect(result.current.cycleElapsedSeconds).toBeDefined();
  });

  it('should provide quest telemetry', () => {
    const { result } = renderHook(() => useMapContext());

    expect(result.current.questTelemetry).toBeDefined();
    expect(result.current.questTelemetryPanelState).toBeDefined();
  });

  it('should handle interaction mode', () => {
    const { result } = renderHook(() => useMapContext());

    expect(result.current.interaction).toBeDefined();
  });

  it('should provide action detail harness', () => {
    const { result } = renderHook(() => useMapContext());

    expect(result.current.actionDetailHarnessState).toBeDefined();
    expect(typeof result.current.getActionDetailHarnessSnapshot).toBe('function');
  });

  it('should handle legacy operations gracefully', () => {
    const { result } = renderHook(() => useMapContext());

    // These should not throw errors but log warnings
    expect(() => result.current.handleQuickWorkShift()).not.toThrow();
    expect(() => result.current.handleQuickRest()).not.toThrow();
    expect(() => result.current.selectVillage()).not.toThrow();
  });
});
