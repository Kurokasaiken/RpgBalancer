import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSandboxDragController } from '../useSandboxDragController';
import type { VillageState, ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';
import type { UseActivitySchedulerReturn } from '../useActivityScheduler';

const mockUpdateState = vi.fn();
const mockSetSlotAssignments = vi.fn();
const mockSetAssignmentFeedback = vi.fn();
const mockSetIsCyclePlaying = vi.fn();

const createActivitySchedulerStub = (overrides?: Partial<UseActivitySchedulerReturn>): UseActivitySchedulerReturn => {
    const villageState = createVillageStateMock();
    const defaultScheduler: UseActivitySchedulerReturn = {
        villageState,
        scheduledActivities: new Map(),
        globalTime: 0,
        isRunning: false,
        startActivity: vi.fn<(activityId: string, residentId: string, duration?: number) => boolean>(() => true),
        cancelActivity: vi.fn(),
        getActivityState: vi.fn(),
        canAssignResident: vi.fn<(residentId: string, slotId: string) => boolean>(() => false),
        pauseTimer: vi.fn(),
        resumeTimer: vi.fn(),
        resetScheduler: vi.fn(),
        advanceTimeUnitsDebug: vi.fn(),
        advanceTimeSeconds: vi.fn(),
        updateVillageState: vi.fn(),
        getSchedulerTelemetry: vi.fn(() => ({ events: [] })),
        getAssignmentDiagnostics: vi.fn(() => null),
        drainTelemetryEvents: vi.fn(() => []),
    };
    return { ...defaultScheduler, ...overrides };
};

const createVillageStateMock = (overrides?: Partial<VillageState>): VillageState => ({
    currentTime: 0,
    resources: {},
    residents: {},
    activities: {},
    eventLog: [],
    questOffers: {},
    ...overrides,
});

const createResidentState = (overrides?: Partial<ResidentState>): ResidentState =>
    ({
        id: 'resident1',
        name: 'Resident 1',
        displayName: 'Arturo',
        status: 'available',
        fatigue: 0,
        currentHp: 100,
        maxHp: 100,
        isHero: false,
        portraitUrl: '',
        isInjured: false,
        survivalCount: 0,
        survivalScore: 0,
        ...overrides,
    }) as ResidentState;

const createMockActivity = (id: string): ActivityDefinition => ({
    id,
    label: `Activity ${id}`,
    description: 'Test activity',
    tags: [],
    slotTags: [],
    resolutionEngineId: 'system',
    durationFormula: '10',
    metadata: {},
    rewards: [],
});

describe('useSandboxDragController', () => {
    const dragContext: { activeId: string | null; setActiveId: (id: string | null) => void } = {
        activeId: null,
        setActiveId: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        dragContext.activeId = null;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    const renderDragController = (overrides?: {
        villageState?: VillageState;
        activities?: ActivityDefinition[];
        slotAssignments?: Record<string, string | null>;
        draggingResidentId?: string | null;
        locationSlotIds?: string[];
        activityScheduler?: UseActivitySchedulerReturn;
    }) => {
        const villageState = overrides?.villageState ?? createVillageStateMock();
        const activities = overrides?.activities ?? [createMockActivity('activity1')];
        const slotAssignments =
            overrides?.slotAssignments ??
            activities.reduce<Record<string, string | null>>((acc, activity) => {
                acc[activity.id] = null;
                return acc;
            }, {});
        const activityScheduler = overrides?.activityScheduler ?? createActivitySchedulerStub();
        const slots: ActivitySlotData[] = [
            {
                slotId: 'day-night-cycle',
                label: 'Day/Night',
                iconName: '⏱️',
                assignedWorkerId: null,
                activity: createMockActivity('day-night-cycle'),
                visualVariant: 'azure',
            },
            ...activities.map<ActivitySlotData>((activity) => ({
                slotId: activity.id,
                label: activity.label ?? activity.id,
                iconName: '☆',
                assignedWorkerId: slotAssignments[activity.id] ?? null,
                activity,
                visualVariant: 'ember',
            })),
        ];
        const locationSlotIds = overrides?.locationSlotIds ?? activities.map((activity) => activity.id);

        if (overrides?.draggingResidentId) {
            dragContext.activeId = overrides.draggingResidentId;
        }

        return renderHook(() =>
            useSandboxDragController({
                villageState,
                activityScheduler,
                secondsPerTimeUnit: 1,
                slots,
                slotAssignments,
                setSlotAssignments: mockSetSlotAssignments,
                setAssignmentFeedback: mockSetAssignmentFeedback,
                setIsCyclePlaying: mockSetIsCyclePlaying,
                updateState: mockUpdateState,
                dragContext,
                locationSlotIds,
                isDayPhase: true,
            })
        );
    };

    it('returns slotDropStates as valid/invalid based on activityScheduler.canAssignResident', () => {
        const activityScheduler = createActivitySchedulerStub({
            canAssignResident: vi.fn((residentId: string, slotId: string) => {
                return residentId === 'resident1' && slotId === 'activity1';
            }),
        });

        const { result } = renderDragController({
            activities: [createMockActivity('activity1')],
            slotAssignments: { activity1: null },
            draggingResidentId: 'resident1',
            activityScheduler,
            villageState: createVillageStateMock({
                residents: {
                    resident1: createResidentState({
                        id: 'resident1',
                        status: 'available',
                        fatigue: 0,
                        currentHp: 100,
                        maxHp: 100,
                    }),
                },
            }),
        });

        expect(result.current.slotDropStates['activity1']).toBe('valid');
    });

    it('updates slotAssignments and resident status on handleWorkerDrop', () => {
        const activityScheduler = createActivitySchedulerStub({
            canAssignResident: vi.fn(() => true),
            startActivity: vi.fn(() => true),
        });
        const villageState = createVillageStateMock({
            residents: {
                resident1: {
                    id: 'resident1',
                    name: 'Resident 1',
                    status: 'available' as const,
                    fatigue: 0,
                    currentHp: 100,
                    maxHp: 100,
                    isHero: false,
                    portraitUrl: '',
                    isInjured: false,
                    survivalCount: 0,
                    survivalScore: 0,
                } as ResidentState,
            },
        });

        const { result } = renderDragController({
            villageState,
            activities: [createMockActivity('activity1')],
            slotAssignments: { activity1: null },
            activityScheduler,
        });

        act(() => {
            result.current.handleWorkerDrop('activity1', 'resident1');
        });

        expect(mockSetSlotAssignments).toHaveBeenCalledWith({ activity1: 'resident1' });
        expect(mockUpdateState).toHaveBeenCalledWith(
            expect.any(Function),
            'Assigned resident to slot, status set to away'
        );
    });

    it('sets locationDropState to valid when at least one slot accepts the resident', () => {
        const activityScheduler = createActivitySchedulerStub({
            canAssignResident: vi.fn((residentId: string, slotId: string) => {
                return residentId === 'resident1' && slotId === 'activity1';
            }),
        });

        const { result } = renderDragController({
            activities: [createMockActivity('activity1'), createMockActivity('activity2')],
            slotAssignments: { activity1: null, activity2: null },
            draggingResidentId: 'resident1',
            activityScheduler,
            villageState: createVillageStateMock({
                residents: {
                    resident1: createResidentState({
                        id: 'resident1',
                        status: 'available',
                        fatigue: 0,
                        currentHp: 100,
                        maxHp: 100,
                    }),
                },
            }),
        });

        expect(result.current.locationDropState).toBe('valid');
    });

    it('replays the last assignment feedback when requested', () => {
        const resident = createResidentState();
        const villageState = createVillageStateMock({
            residents: { [resident.id]: resident },
        });
        const slotAssignments = { activity1: resident.id };
        const activityScheduler = createActivitySchedulerStub({
            startActivity: vi.fn(() => true),
        });

        const { result } = renderDragController({
            villageState,
            activities: [createMockActivity('activity1')],
            slotAssignments,
            activityScheduler,
        });

        act(() => {
            result.current.startSlotActivity('activity1');
        });

        const expectedMessage = 'Arturo assegnato a Activity activity1.';
        expect(mockSetAssignmentFeedback).toHaveBeenLastCalledWith(expectedMessage, 'startSlotActivity:success');
        mockSetAssignmentFeedback.mockClear();

        act(() => {
            result.current.replayLastAssignmentFeedback();
        });

        expect(mockSetAssignmentFeedback).toHaveBeenCalledWith(expectedMessage, 'replayAssignmentFeedback');
    });

    it('prioritizes pending feedback when starting an activity', () => {
        const resident = createResidentState({ displayName: 'Bruno' });
        const villageState = createVillageStateMock({
            residents: { [resident.id]: resident },
        });
        const activityScheduler = createActivitySchedulerStub({
            startActivity: vi.fn(() => true),
        });

        const { result } = renderDragController({
            villageState,
            activities: [createMockActivity('activity1')],
            slotAssignments: { activity1: null },
            activityScheduler,
        });

        act(() => {
            result.current.startSlotActivity('activity1', resident.id, { pendingFeedback: 'Custom feedback' });
        });

        expect(mockSetAssignmentFeedback).toHaveBeenLastCalledWith('Custom feedback', 'startSlotActivity:success');
    });

    describe('handleLocationResidentDrop - Fixed Behavior', () => {
        it('should NOT assign when dropped on empty area (no target slot)', () => {
            const resident = createResidentState();
            const villageState = createVillageStateMock({
                residents: { [resident.id]: resident },
            });
            const activityScheduler = createActivitySchedulerStub({
                canAssignResident: vi.fn(() => true),
            });

            const { result } = renderDragController({
                villageState,
                activities: [createMockActivity('activity1')],
                slotAssignments: { activity1: null },
                locationSlotIds: ['activity1'],
                activityScheduler,
            });

            act(() => {
                result.current.handleLocationResidentDrop(resident.id); // No target slot provided
            });

            // Should NOT assign to any slot
            expect(mockSetSlotAssignments).not.toHaveBeenCalled();
            expect(mockUpdateState).not.toHaveBeenCalled();
            
            // Should show feedback message
            expect(mockSetAssignmentFeedback).toHaveBeenCalledWith(
                'Trascina il residente su uno slot specifico per assegnarlo.',
                'handleLocationResidentDrop:noTargetSlot'
            );
        });

        it('should assign when dropped on specific valid slot', () => {
            const resident = createResidentState();
            const villageState = createVillageStateMock({
                residents: { [resident.id]: resident },
            });
            const activityScheduler = createActivitySchedulerStub({
                canAssignResident: vi.fn(() => true),
            });

            const { result } = renderDragController({
                villageState,
                activities: [createMockActivity('activity1')],
                slotAssignments: { activity1: null },
                locationSlotIds: ['activity1'],
                activityScheduler,
            });

            act(() => {
                result.current.handleLocationResidentDrop(resident.id, 'activity1'); // Specific target slot
            });

            // Should assign to the specific slot
            expect(mockSetSlotAssignments).toHaveBeenCalledWith({ activity1: 'resident1' });
            expect(mockUpdateState).toHaveBeenCalledWith(
                expect.any(Function),
                'Assigned resident to slot, status set to away'
            );
        });

        it('should NOT assign when target slot is not in current location', () => {
            const resident = createResidentState();
            const villageState = createVillageStateMock({
                residents: { [resident.id]: resident },
            });
            const activityScheduler = createActivitySchedulerStub({
                canAssignResident: vi.fn(() => true),
            });

            const { result } = renderDragController({
                villageState,
                activities: [createMockActivity('activity1')],
                slotAssignments: { activity1: null },
                locationSlotIds: ['activity1'], // Only activity1 is in current location
                activityScheduler,
            });

            act(() => {
                result.current.handleLocationResidentDrop(resident.id, 'activity2'); // Different slot
            });

            // Should NOT assign
            expect(mockSetSlotAssignments).not.toHaveBeenCalled();
            expect(mockUpdateState).not.toHaveBeenCalled();
            
            // Should show error feedback
            expect(mockSetAssignmentFeedback).toHaveBeenCalledWith(
                'Slot non valido in questa posizione.',
                'handleLocationResidentDrop:invalidTarget'
            );
        });

        it('should NOT assign when target slot fails validation', () => {
            const resident = createResidentState({ currentHp: 50 }); // Low HP
            const villageState = createVillageStateMock({
                residents: { [resident.id]: resident },
            });
            const activityScheduler = createActivitySchedulerStub({
                canAssignResident: vi.fn(() => false), // Validation fails
            });

            const { result } = renderDragController({
                villageState,
                activities: [createMockActivity('activity1')],
                slotAssignments: { activity1: null },
                locationSlotIds: ['activity1'],
                activityScheduler,
            });

            act(() => {
                result.current.handleLocationResidentDrop(resident.id, 'activity1');
            });

            // Should NOT assign
            expect(mockSetSlotAssignments).not.toHaveBeenCalled();
            expect(mockUpdateState).not.toHaveBeenCalled();
            
            // Should show validation error feedback
            expect(mockSetAssignmentFeedback).toHaveBeenCalledWith(
                expect.stringContaining('not available or already assigned'),
                'handleLocationResidentDrop:validationFailed'
            );
        });

        it('should NOT auto-assign when dropped on empty area (no target slot)', () => {
            const resident = createResidentState();
            const villageState = createVillageStateMock({
                residents: { [resident.id]: resident },
            });
            const activityScheduler = createActivitySchedulerStub({
                canAssignResident: vi.fn(() => true), // Would pass validation
            });

            const { result } = renderDragController({
                villageState,
                activities: [createMockActivity('activity1')],
                slotAssignments: { activity1: null }, // Empty slot available
                locationSlotIds: ['activity1'],
                activityScheduler,
            });

            act(() => {
                // Drop without target slot (empty area)
                result.current.handleLocationResidentDrop(resident.id, undefined);
            });

            // Should NOT assign even though slot is available
            expect(mockSetSlotAssignments).not.toHaveBeenCalled();
            expect(mockUpdateState).not.toHaveBeenCalled();
            
            // Should show feedback message about specific slot requirement
            expect(mockSetAssignmentFeedback).toHaveBeenCalledWith(
                'Trascina il residente su uno slot specifico per assegnarlo.',
                'handleLocationResidentDrop:noTargetSlot'
            );
        });

        it('should NOT auto-assign when dropped on empty area with null target', () => {
            const resident = createResidentState();
            const villageState = createVillageStateMock({
                residents: { [resident.id]: resident },
            });
            const activityScheduler = createActivitySchedulerStub({
                canAssignResident: vi.fn(() => true), // Would pass validation
            });

            const { result } = renderDragController({
                villageState,
                activities: [createMockActivity('activity1')],
                slotAssignments: { activity1: null }, // Empty slot available
                locationSlotIds: ['activity1'],
                activityScheduler,
            });

            act(() => {
                // Drop with null target slot (empty area)
                result.current.handleLocationResidentDrop(resident.id, null);
            });

            // Should NOT assign even though slot is available
            expect(mockSetSlotAssignments).not.toHaveBeenCalled();
            expect(mockUpdateState).not.toHaveBeenCalled();
            
            // Should show feedback message about specific slot requirement
            expect(mockSetAssignmentFeedback).toHaveBeenCalledWith(
                'Trascina il residente su uno slot specifico per assegnarlo.',
                'handleLocationResidentDrop:noTargetSlot'
            );
        });

        it('should preserve click behavior through handleResidentSelect', () => {
            // This test ensures that direct click assignment still works
            // The click behavior should be handled by handleResidentSelect, not handleLocationResidentDrop
            const resident = createResidentState();
            const villageState = createVillageStateMock({
                residents: { [resident.id]: resident },
            });
            const activityScheduler = createActivitySchedulerStub({
                canAssignResident: vi.fn(() => true),
            });

            const { result } = renderDragController({
                villageState,
                activities: [createMockActivity('activity1')],
                slotAssignments: { activity1: null },
                locationSlotIds: ['activity1'],
                activityScheduler,
            });

            // Simulate direct click assignment (should use handleWorkerDrop directly)
            act(() => {
                result.current.handleWorkerDrop('activity1', resident.id);
            });

            // Should assign normally
            expect(mockSetSlotAssignments).toHaveBeenCalledWith({ activity1: 'resident1' });
            expect(mockUpdateState).toHaveBeenCalledWith(
                expect.any(Function),
                'Assigned resident to slot, status set to away'
            );
        });
    });
});
