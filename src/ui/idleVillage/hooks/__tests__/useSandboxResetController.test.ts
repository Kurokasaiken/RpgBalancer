import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import type { SetStateAction } from 'react';
import { useSandboxResetController } from '../useSandboxResetController';

const managedActivities: ActivityDefinition[] = [
    { id: 'quest.alpha', label: 'Quest Alpha', tags: [], slotTags: [], resolutionEngineId: 'quest' },
    { id: 'quest.beta', label: 'Quest Beta', tags: [], slotTags: [], resolutionEngineId: 'quest' },
];

const createVillageState = (overrides?: Partial<VillageState>): VillageState => ({
    currentTime: 0,
    resources: {},
    residents: {},
    activities: {},
    eventLog: [],
    questOffers: {},
    ...overrides,
});

describe('useSandboxResetController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('resets assignments, detail panels, theater, and demo panel state', async () => {
        const setSlotAssignments = vi.fn(
            (updater: SetStateAction<Record<string, string | null>>) => {
                if (typeof updater === 'function') {
                    updater({});
                }
            },
        );
        const setSelectedResidentId = vi.fn();
        const updateState = vi.fn(async () => {});
        const setAssignmentFeedback = vi.fn();
        const closeTheater = vi.fn();
        const demoPanelResetApi = { onRemoveAll: vi.fn() };
        const clockReset = vi.fn(async () => createVillageState());

        const { result } = renderHook(() =>
            useSandboxResetController({
                clockReset,
                managedActivities,
                setSlotAssignments,
                setSelectedResidentId,
                updateState,
                setAssignmentFeedback,
                closeTheater,
                demoPanelResetApi,
            }),
        );

        act(() => {
            result.current.openDetailPanel('quest.alpha');
        });
        expect(result.current.detailPanelSlotIds).toEqual(['quest.alpha']);

        await act(async () => {
            await result.current.handleResetSandboxState();
        });

        expect(clockReset).toHaveBeenCalledTimes(1);
        expect(setSlotAssignments).toHaveBeenCalledTimes(1);
        expect(setSelectedResidentId).toHaveBeenCalledWith(null);
        expect(result.current.detailPanelSlotIds).toEqual([]);
        expect(closeTheater).toHaveBeenCalled();
        expect(demoPanelResetApi.onRemoveAll).toHaveBeenCalled();
        expect(setAssignmentFeedback).toHaveBeenCalledWith(
            'Sandbox resettato: roster e attività riportati allo stato iniziale.',
        );
    });

    it('marks all residents as available and surfaces feedback when resetting residents', async () => {
        const baseState: VillageState = createVillageState({
            residents: {
                'res-1': {
                    id: 'res-1',
                    displayName: 'Hero One',
                    status: 'away',
                    fatigue: 0,
                    currentHp: 100,
                    maxHp: 100,
                    isHero: false,
                    isInjured: false,
                    survivalCount: 0,
                    survivalScore: 0,
                    portraitUrl: '',
                    statSnapshot: {},
                    statTags: [],
                },
            },
        });

        const updateState = vi.fn(async (updater: (prev: VillageState) => VillageState) => {
            updater(baseState);
        });
        const setSlotAssignments = vi.fn();
        const setSelectedResidentId = vi.fn();
        const setAssignmentFeedback = vi.fn();
        const closeTheater = vi.fn();
        const clockReset = vi.fn(async () => baseState);

        const { result } = renderHook(() =>
            useSandboxResetController({
                clockReset,
                managedActivities,
                setSlotAssignments,
                setSelectedResidentId,
                updateState,
                setAssignmentFeedback,
                closeTheater,
            }),
        );

        await act(async () => {
            await result.current.handleResetResidents();
        });

        expect(updateState).toHaveBeenCalledTimes(1);
        const updater = updateState.mock.calls[0][0];
        const updatedState = updater(baseState);
        expect(updatedState.residents['res-1']?.status).toBe('available');
        expect(setAssignmentFeedback).toHaveBeenCalledWith(
            'Tutti i residenti sono stati resettati allo stato disponibile',
        );
    });
});
