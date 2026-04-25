import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSandboxDemoPanel } from '../useSandboxDemoPanel';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

const persistenceMocks = vi.hoisted(() => ({
  loadData: vi.fn(),
  saveData: vi.fn(),
}));

vi.mock('@/shared/persistence/PersistenceService', () => persistenceMocks);

describe('useSandboxDemoPanel', () => {
  const defaultPersistedState = {
    requirement: 'none' as const,
    slots: [
      { id: 'demo-slot-1', label: 'Slot 1', assignedResidentId: null, isPlusButton: false },
      { id: 'demo-plus-button', label: '+', assignedResidentId: null, isPlusButton: true },
    ],
    nextSlotIndex: 2,
  };

  const createResident = (overrides: Partial<ResidentState> = {}): ResidentState => ({
    id: 'resident-1',
    displayName: 'Test Resident',
    status: 'available',
    fatigue: 0,
    statProfileId: 'demo-profile',
    statTags: ['hp'],
    currentHp: 250,
    maxHp: 250,
    isHero: false,
    isInjured: false,
    survivalCount: 0,
    survivalScore: 0,
    ...overrides,
  });

  const mockResidents: Record<string, ResidentState> = {
    'resident-1': createResident({ id: 'resident-1', displayName: 'Resident 1' }),
    'resident-2': createResident({ id: 'resident-2', displayName: 'Resident 2', currentHp: 300, maxHp: 300 }),
  };

  const mockUpdateVillageState = vi.fn((updater) => {
    const mockState = { residents: { ...mockResidents } };
    const newState = updater(mockState);
    Object.assign(mockState, newState);
    return mockState;
  });

  const mockSetAssignmentFeedback = vi.fn();
  const mockSubscribeClock = vi.fn();
  const mockUnsubscribeClock = vi.fn();

  const renderHookWithMocks = () => {
    return renderHook(() =>
      useSandboxDemoPanel({
        residentsById: mockResidents,
        updateVillageState: mockUpdateVillageState,
        setAssignmentFeedback: mockSetAssignmentFeedback,
        subscribeClock: mockSubscribeClock,
        unsubscribeClock: mockUnsubscribeClock,
      })
    );
  };

  const flushAsyncEffects = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    persistenceMocks.loadData.mockResolvedValue(structuredClone(defaultPersistedState));
    persistenceMocks.saveData.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default state', () => {
    const { result } = renderHookWithMocks();

    expect(result.current.demoPanelState.requirement).toBe('none');
    expect(result.current.demoPanelState.slotViewModels).toHaveLength(2);
    expect(result.current.demoPanelState.slotViewModels[0].label).toBe('Slot 1');
    expect(result.current.demoPanelState.slotViewModels[1].isPlusButton).toBe(true);
    expect(result.current.demoIsRunning).toBe(false);
  });

  it('should add a new slot when dropping on plus button', () => {
    const { result } = renderHookWithMocks();

    act(() => {
      result.current.demoPanelHandlers.onSlotDrop('demo-plus-button', 'resident-1');
    });

    expect(result.current.demoPanelState.slotViewModels).toHaveLength(3);
    expect(result.current.demoPanelState.slotViewModels[1].label).toBe('Slot 2');
    expect(result.current.demoPanelState.slotViewModels[1].assignedResidentId).toBe('resident-1');
    expect(result.current.demoPanelState.slotViewModels[2].isPlusButton).toBe(true);
  });

  it('should update resident status when assigned to a slot', () => {
    const { result } = renderHookWithMocks();

    act(() => {
      result.current.demoPanelHandlers.onSlotDrop('demo-slot-1', 'resident-1');
    });

    expect(mockUpdateVillageState).toHaveBeenCalledWith(expect.any(Function), 'Update resident status to away for demo');
    
    const updateCall = mockUpdateVillageState.mock.calls[0][0];
    const updatedState = updateCall({ residents: { ...mockResidents } });
    expect(updatedState.residents['resident-1'].status).toBe('away');
  });

  it('should clear a slot and reset resident status', () => {
    const { result } = renderHookWithMocks();

    // First assign a resident
    act(() => {
      result.current.demoPanelHandlers.onSlotDrop('demo-slot-1', 'resident-1');
    });

    // Then clear the slot
    act(() => {
      result.current.demoPanelHandlers.onSlotClear('demo-slot-1');
    });

    expect(mockUpdateVillageState).toHaveBeenCalledWith(expect.any(Function), 'Reset resident status to available from demo');
    
    const updateCall = mockUpdateVillageState.mock.calls[1][0];
    const updatedState = updateCall({ residents: { ...mockResidents } });
    expect(updatedState.residents['resident-1'].status).toBe('available');
  });

  it('should start and complete the demo timer', () => {
    const { result } = renderHookWithMocks();

    // Assign a resident to start the demo
    act(() => {
      result.current.demoPanelHandlers.onSlotDrop('demo-slot-1', 'resident-1');
    });

    act(() => {
      result.current.demoPanelHandlers.onStart();
    });

    expect(result.current.demoIsRunning).toBe(true);
    expect(result.current.demoPanelState.elapsedSeconds).toBe(0);

    const handler = mockSubscribeClock.mock.calls[0][1];

    // Fast-forward timer
    act(() => {
      handler(1);
    });

    expect(result.current.demoPanelState.elapsedSeconds).toBe(1);

    // Fast-forward to complete the demo
    act(() => {
      handler(59);
    });

    // Should have called removeAll and reset
    expect(mockUpdateVillageState).toHaveBeenCalledWith(expect.any(Function), 'Reset demo resident status to available');
    expect(result.current.demoIsRunning).toBe(false);
    expect(result.current.demoPanelState.elapsedSeconds).toBe(0);
  });

  it('should remove all assignments and reset state', () => {
    const { result } = renderHookWithMocks();

    // Assign some residents
    act(() => {
      result.current.demoPanelHandlers.onSlotDrop('demo-slot-1', 'resident-1');
      result.current.demoPanelHandlers.onSlotDrop('demo-plus-button', 'resident-2');
    });

    // Verify initial state
    expect(result.current.demoPanelState.slotViewModels).toHaveLength(3);
    expect(result.current.demoPanelState.assignedResidentIds).toHaveLength(2);

    // Remove all
    act(() => {
      result.current.demoPanelHandlers.onRemoveAll();
    });

    // Verify reset
    expect(result.current.demoPanelState.slotViewModels).toHaveLength(2);
    expect(result.current.demoPanelState.assignedResidentIds).toHaveLength(0);
    expect(mockUpdateVillageState).toHaveBeenCalledWith(expect.any(Function), 'Reset demo resident status to available');
  });

  it('should update requirement filter', () => {
    const { result } = renderHookWithMocks();

    expect(result.current.demoPanelState.requirement).toBe('none');
    expect(result.current.demoPanelState.requirementLabel).toBe('Nessun Requisito');

    act(() => {
      result.current.demoPanelHandlers.setRequirement('hp200');
    });

    expect(result.current.demoPanelState.requirement).toBe('hp200');
    expect(result.current.demoPanelState.requirementLabel).toBe('HP ≥ 200');
    expect(result.current.demoPanelState.requirementDescription).toContain('richiedono residenti con almeno 200 HP');
  });

  it('hydrates persisted requirement and assignments from PersistenceService', async () => {
    persistenceMocks.loadData.mockResolvedValueOnce({
      requirement: 'hp200',
      slots: [
        { id: 'demo-slot-1', label: 'Slot 1', assignedResidentId: 'resident-2', isPlusButton: false },
        { id: 'demo-slot-2', label: 'Slot 2', assignedResidentId: null, isPlusButton: false },
        { id: 'demo-plus-button', label: '+', assignedResidentId: null, isPlusButton: true },
      ],
      nextSlotIndex: 3,
    });

    const { result } = renderHookWithMocks();

    await flushAsyncEffects();

    expect(result.current.demoPanelState.requirement).toBe('hp200');
    expect(result.current.demoPanelState.slotViewModels[0].assignedResidentId).toBe('resident-2');
    expect(result.current.demoPanelState.slotViewModels).toHaveLength(3);
  });

  it('persists slot assignments after hydration', async () => {
    const { result } = renderHookWithMocks();

    await flushAsyncEffects();
    persistenceMocks.saveData.mockClear();

    act(() => {
      result.current.demoPanelHandlers.onSlotDrop('demo-slot-1', 'resident-1');
    });

    await flushAsyncEffects();
    expect(persistenceMocks.saveData).toHaveBeenCalledTimes(1);

    const [storageKey, payload] = persistenceMocks.saveData.mock.calls.at(-1) ?? [];
    expect(storageKey).toBe('idle_village_demo_panel_state');
    expect(payload).toEqual(
      expect.objectContaining({
        slots: expect.arrayContaining([
          expect.objectContaining({ id: 'demo-slot-1', assignedResidentId: 'resident-1', isPlusButton: false }),
          expect.objectContaining({ id: 'demo-plus-button', isPlusButton: true }),
        ]),
      }),
    );
  });

  it('persists reset payload when handleDemoRemoveAll is invoked', async () => {
    const { result } = renderHookWithMocks();

    await flushAsyncEffects();

    act(() => {
      result.current.demoPanelHandlers.onSlotDrop('demo-slot-1', 'resident-1');
    });

    await flushAsyncEffects();
    persistenceMocks.saveData.mockClear();

    act(() => {
      result.current.demoPanelHandlers.onRemoveAll();
    });

    await flushAsyncEffects();
    expect(persistenceMocks.saveData).toHaveBeenCalledTimes(1);

    const [, payload] = persistenceMocks.saveData.mock.calls[0];
    expect(payload).toEqual(
      expect.objectContaining({
        slots: [
          expect.objectContaining({ id: 'demo-slot-1', assignedResidentId: null, isPlusButton: false }),
          expect.objectContaining({ id: 'demo-plus-button', assignedResidentId: null, isPlusButton: true }),
        ],
        nextSlotIndex: 2,
        requirement: 'none',
      }),
    );
  });
});
