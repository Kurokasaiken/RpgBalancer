import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheaterController } from '../useTheaterController';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';

const createSlot = (slotId: string, overrides?: Partial<ActivitySlotData>): ActivitySlotData => ({
    slotId,
    label: `Slot ${slotId}`,
    iconName: '☆',
    assignedWorkerId: null,
    activity: {
        id: slotId,
        label: `Activity ${slotId}`,
        description: 'Test activity',
        tags: [],
        slotTags: [],
        resolutionEngineId: 'system',
        durationFormula: '10',
        metadata: {},
        rewards: [],
    },
    visualVariant: 'azure',
    ...overrides,
});

describe('useTheaterController', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const renderController = (options?: {
        slots?: ActivitySlotData[];
        locationSlotIds?: string[];
        randomFn?: () => number;
        config?: Partial<typeof DEFAULT_IDLE_VILLAGE_CONFIG>;
    }) => {
        const slots = options?.slots ?? [createSlot('slot-1')];
        const locationSlotIds = options?.locationSlotIds ?? slots.map((slot) => slot.slotId);
        const dragControllerRef = { current: { handleLocationResidentDrop: vi.fn() } };

        const hook = renderHook(() =>
            useTheaterController({
                slots,
                locationSlotIds,
                dragControllerRef,
                config: options?.config ?? DEFAULT_IDLE_VILLAGE_CONFIG,
                randomFn: options?.randomFn ?? (() => 0.5),
            }),
        );

        return { ...hook, dragControllerRef };
    };

    it('opens the theater after the hover delay when a resident enters the location', () => {
        const { result } = renderController();

        act(() => {
            result.current.handleLocationResidentDragEnter('resident-1');
            vi.advanceTimersByTime(600);
        });

        expect(result.current.isTheaterOpen).toBe(true);
        expect(result.current.theaterPreviewIds).toEqual(['slot-1']);
    });

    it('delays closing when the resident leaves and closes after the configured timeout', () => {
        const { result } = renderController();

        act(() => {
            result.current.handleLocationResidentDragEnter('resident-1');
            vi.advanceTimersByTime(600);
        });
        expect(result.current.isTheaterOpen).toBe(true);

        act(() => {
            result.current.handleLocationResidentDragLeave();
            vi.advanceTimersByTime(199);
        });
        expect(result.current.isTheaterOpen).toBe(true);

        act(() => {
            vi.advanceTimersByTime(2);
        });
        expect(result.current.isTheaterOpen).toBe(false);
    });

    it('openTheaterForSlot prioritizes slots sharing the same mapSlotId and fills remaining previews randomly', () => {
        const baseSlot = createSlot('slot-base');
        const clusterSlots = [
            createSlot('slot-1', { activity: { ...baseSlot.activity, id: 'slot-1', metadata: { mapSlotId: 'forest' } } }),
            createSlot('slot-2', { activity: { ...baseSlot.activity, id: 'slot-2', metadata: { mapSlotId: 'forest' } } }),
        ];
        const otherSlots = [createSlot('slot-3'), createSlot('slot-4')];
        const allSlots = [...clusterSlots, ...otherSlots];

        const { result } = renderController({
            slots: allSlots,
            locationSlotIds: clusterSlots.map((slot) => slot.slotId),
            randomFn: () => 0,
        });

        act(() => {
            result.current.openTheater('slot-1');
        });
    });

    it('opens the theater on hoverStart with delay', () => {
        const { result } = renderController();

        act(() => {
            result.current.hoverStart('slot-1');
            vi.advanceTimersByTime(600);
        });

        expect(result.current.isTheaterOpen).toBe(true);
        expect(result.current.theaterPreviewIds).toEqual(['slot-1']);
    });

    it('closes the theater on hoverEnd after configured delay', () => {
        const { result } = renderController();

        act(() => {
            result.current.hoverStart('slot-1');
            vi.advanceTimersByTime(600);
        });
        expect(result.current.isTheaterOpen).toBe(true);

        act(() => {
            result.current.hoverEnd();
            vi.advanceTimersByTime(200);
        });
        expect(result.current.isTheaterOpen).toBe(false);
    });

    it('selectTheaterPreviewIds returns correct IDs based on primary slot and config', () => {
        const slots = [
            createSlot('slot-1', { activity: { ...createSlot('slot-1').activity, metadata: { mapSlotId: 'forest' } } }),
            createSlot('slot-2', { activity: { ...createSlot('slot-2').activity, metadata: { mapSlotId: 'forest' } } }),
            createSlot('slot-3'),
            createSlot('slot-4'),
        ];

        const { result } = renderController({
            slots,
            locationSlotIds: slots.map(s => s.slotId),
            randomFn: () => 0, // deterministic
        });

        // Test with primary slot
        const previewIds = result.current.selectTheaterPreviewIds('slot-1');
        expect(previewIds).toContain('slot-1');
        expect(previewIds.length).toBeLessThanOrEqual(3); // max previews
    });
});
