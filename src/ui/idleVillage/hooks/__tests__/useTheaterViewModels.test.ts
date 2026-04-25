import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTheaterViewModels, type UseTheaterViewModelsParams } from '../useTheaterViewModels';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';
import type { ScheduledActivityState } from '@/ui/idleVillage/hooks/useActivityScheduler';

type GetActivityState = (slotId: string, residentId: string) => ScheduledActivityState | null;

// Mock the drag bridge
const mockDragBridge = {
  handleWorkerDrop: vi.fn(),
  canSlotAcceptDrop: vi.fn(),
  slotDropStates: {},
};

const getActivityState = vi.fn<GetActivityState>(() => null);

// Mock the activity scheduler
const mockActivityScheduler: { getActivityState: typeof getActivityState } = {
  getActivityState,
};

// Mock the resolve worker name function
const mockResolveWorkerName = vi.fn();

// Mock Math.random for deterministic results
const mockRandomFn = vi.fn(() => 0.5);

describe('useTheaterViewModels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveWorkerName.mockImplementation((residentId: string | null) => (residentId ? 'Test Resident' : null));
    mockActivityScheduler.getActivityState.mockReturnValue(null);
    mockDragBridge.canSlotAcceptDrop.mockReturnValue(true);
  });

  /**
   * Helper that returns a fully populated ActivitySlotData object for tests.
   */
  const createMockSlot = (overrides: Partial<ActivitySlotData> = {}): ActivitySlotData => ({
    slotId: 'test-slot-1',
    activity: {
      id: 'test-activity',
      label: 'Test Activity',
      durationFormula: '60',
      tags: ['job'],
      slotTags: [],
      resolutionEngineId: 'system',
      statRequirement: { allOf: ['hp200'] },
      metadata: {},
      rewards: [],
    },
    label: 'Test Slot',
    iconName: '⚒️',
    visualVariant: 'azure',
    assignedWorkerId: null,
    mapSlotLabel: 'Slot 1',
    ...overrides,
  });

  /**
   * Helper that wires the hook params with sane defaults for each test.
   */
  const createMockParams = (overrides: Partial<UseTheaterViewModelsParams> = {}): UseTheaterViewModelsParams => ({
    slots: [createMockSlot()],
    theaterPreviewIds: ['test-slot-1'],
    resolveWorkerName: mockResolveWorkerName,
    activityScheduler: mockActivityScheduler,
    secondsPerTimeUnit: 1,
    dragBridge: mockDragBridge,
    randomFn: mockRandomFn,
    ...overrides,
  });

  const createActivityState = (overrides: Partial<ScheduledActivityState> = {}): ScheduledActivityState => ({
    scheduledId: 'scheduled-1',
    activityId: 'test-activity',
    residentId: 'resident-1',
    startTime: 0,
    duration: 60,
    elapsed: 0,
    progress: 0,
    status: 'running',
    ...overrides,
  });

  describe('theaterPreviewSlots', () => {
    it('returns slots that match theaterPreviewIds', () => {
      const slot1 = createMockSlot({ slotId: 'slot-1' });
      const slot2 = createMockSlot({ slotId: 'slot-2' });
      const params = createMockParams({
        slots: [slot1, slot2],
        theaterPreviewIds: ['slot-1'],
      });

      const { result } = renderHook(() => useTheaterViewModels(params));

      expect(result.current.theaterPreviewSlots).toHaveLength(1);
      expect(result.current.theaterPreviewSlots[0].slotId).toBe('slot-1');
    });

    it('filters out slots not in theaterPreviewIds', () => {
      const slot1 = createMockSlot({ slotId: 'slot-1' });
      const slot2 = createMockSlot({ slotId: 'slot-2' });
      const params = createMockParams({
        slots: [slot1, slot2],
        theaterPreviewIds: ['slot-1', 'non-existent'],
      });

      const { result } = renderHook(() => useTheaterViewModels(params));

      expect(result.current.theaterPreviewSlots).toHaveLength(1);
      expect(result.current.theaterPreviewSlots[0].slotId).toBe('slot-1');
    });
  });

  describe('theaterPrimarySlot', () => {
    it('returns the first theater preview slot', () => {
      const slot1 = createMockSlot({ slotId: 'slot-1' });
      const slot2 = createMockSlot({ slotId: 'slot-2' });
      const params = createMockParams({
        slots: [slot1, slot2],
        theaterPreviewIds: ['slot-1', 'slot-2'],
      });

      const { result } = renderHook(() => useTheaterViewModels(params));

      expect(result.current.theaterPrimarySlot?.slotId).toBe('slot-1');
    });

    it('returns null when no theater preview slots exist', () => {
      const params = createMockParams({
        theaterPreviewIds: [],
      });

      const { result } = renderHook(() => useTheaterViewModels(params));

      expect(result.current.theaterPrimarySlot).toBeNull();
    });
  });

  describe('theaterVerbs', () => {
    it('creates verb summaries for theater preview slots', () => {
      const slot = createMockSlot({
        assignedWorkerId: 'resident-1',
        activity: {
          id: 'woodcutting',
          label: 'Woodcutting',
          durationFormula: '60',
          tags: ['job'],
          slotTags: [],
          resolutionEngineId: 'system',
          dangerRating: 2,
          metadata: {},
          rewards: [],
        },
      });
      const params = createMockParams({
        slots: [slot],
        theaterPreviewIds: ['test-slot-1'],
      });

      mockActivityScheduler.getActivityState.mockReturnValue(
        createActivityState({ progress: 0.5, elapsed: 30, duration: 60 }),
      );

      const { result } = renderHook(() => useTheaterViewModels(params));

      expect(result.current.theaterVerbs).toHaveLength(1);
      const verb = result.current.theaterVerbs[0];
      expect(verb.key).toBe('sandbox_theater_test-slot-1');
      expect(verb.label).toBe('Test Slot');
      expect(verb.progressFraction).toBe(0.5);
      expect(verb.elapsedSeconds).toBe(30);
      expect(verb.totalDurationSeconds).toBe(60);
      expect(verb.assignedCount).toBe(1);
      expect(verb.totalSlots).toBe(1);
    });

    it('calculates risk percentages from activity danger rating', () => {
      const slot = createMockSlot({
        activity: {
          id: 'dangerous-activity',
          label: 'Dangerous Activity',
          durationFormula: '60',
          tags: ['quest'],
          slotTags: [],
          resolutionEngineId: 'system',
          dangerRating: 3, // Should result in 15% injury, 7.5% death
          metadata: {},
          rewards: [],
        },
      });
      const params = createMockParams({
        slots: [slot],
        theaterPreviewIds: ['test-slot-1'],
      });

      const { result } = renderHook(() => useTheaterViewModels(params));

      const verb = result.current.theaterVerbs[0];
      expect(verb.injuryPercentage).toBe(15); // dangerRating * 5
      expect(verb.deathPercentage).toBe(7.5); // injuryPercentage / 2
      expect(verb.isQuest).toBe(true);
      expect(verb.isJob).toBe(false);
    });

    it('includes risk stripe metrics from deriveTheaterRiskStripes', () => {
      const slot = createMockSlot({
        activity: {
          id: 'risky-activity',
          label: 'Risky Activity',
          durationFormula: '60',
          tags: ['quest'],
          slotTags: [],
          resolutionEngineId: 'system',
          dangerRating: 4, // 20% injury, 10% death
          metadata: {},
          rewards: [],
        },
      });
      const params = createMockParams({
        slots: [slot],
        theaterPreviewIds: ['test-slot-1'],
      });

      const { result } = renderHook(() => useTheaterViewModels(params));

      const verb = result.current.theaterVerbs[0];
      expect(verb.riskStripeMetrics).toBeDefined();
      expect(verb.riskStripeMetrics!.injuryPercent).toBe(20);
      expect(verb.riskStripeMetrics!.deathPercent).toBe(10);
      expect(verb.riskStripeMetrics!.hasRisk).toBe(true);
    });
  });

  describe('theaterSlotCards', () => {
    it('creates activity slot card props for theater slots', () => {
      const slot = createMockSlot({
        assignedWorkerId: 'resident-1',
        visualVariant: 'azure',
      });
      const params = createMockParams({
        slots: [slot],
        theaterPreviewIds: ['test-slot-1'],
      });

      mockActivityScheduler.getActivityState.mockReturnValue(
        createActivityState({ progress: 0.75, elapsed: 45, duration: 60 }),
      );

      const { result } = renderHook(() => useTheaterViewModels(params));

      expect(result.current.theaterSlotCards).toHaveLength(1);
      const card = result.current.theaterSlotCards[0];
      expect(card.slotId).toBe('test-slot-1');
      expect(card.label).toBe('Test Slot · Slot 1'); // includes mapSlotLabel
      expect(card.assignedWorkerName).toBe('Test Resident');
      expect(card.progressFraction).toBe(0.75);
      expect(card.elapsedSeconds).toBe(45);
      expect(card.totalDuration).toBe(60);
      expect(card.visualVariant).toBe('azure');
      expect(card.canAcceptDrop).toBe(true);
    });

    it('handles slots without assigned workers', () => {
      const slot = createMockSlot({ assignedWorkerId: null });
      const params = createMockParams({
        slots: [slot],
        theaterPreviewIds: ['test-slot-1'],
      });

      const { result } = renderHook(() => useTheaterViewModels(params));

      const card = result.current.theaterSlotCards[0];
      expect(card.assignedWorkerName).toBeNull();
      expect(card.onClick).toBeUndefined();
    });
  });

  describe('theaterJobCards', () => {
    it('creates job preview cards from job-tagged activities', () => {
      const jobSlot = createMockSlot({
        slotId: 'job-slot-1',
        activity: {
          id: 'woodcutting',
          label: 'Woodcutting',
          durationFormula: '60',
          tags: ['job'],
          slotTags: [],
          resolutionEngineId: 'system',
          metadata: {},
          rewards: [],
        },
        assignedWorkerId: 'resident-1',
      });
      const params = createMockParams({
        slots: [jobSlot],
        theaterPreviewIds: ['test-slot-1'], // Different from job slot
      });

      mockActivityScheduler.getActivityState.mockReturnValue(
        createActivityState({ progress: 0.6, elapsed: 36, duration: 60 }),
      );

      const { result } = renderHook(() => useTheaterViewModels(params));

      expect(result.current.theaterJobCards).toHaveLength(1);
      const jobCard = result.current.theaterJobCards[0];
      expect(jobCard.id).toBe('job-slot-1');
      expect(jobCard.label).toBe('Woodcutting');
      expect(jobCard.progressFraction).toBe(0.6);
      expect(jobCard.elapsedSeconds).toBe(36);
      expect(jobCard.totalDurationSeconds).toBe(60);
      expect(jobCard.isPlaying).toBe(true);
    });

    it('limits job cards to 3 and shuffles them', () => {
      const jobSlots = Array.from({ length: 5 }, (_, i) =>
        createMockSlot({
          slotId: `job-slot-${i}`,
          activity: {
            id: `job-${i}`,
            label: `Job ${i}`,
            durationFormula: '60',
            tags: ['job'],
            slotTags: [],
            resolutionEngineId: 'system',
            metadata: {},
            rewards: [],
          },
        })
      );
      const params = createMockParams({
        slots: jobSlots,
        theaterPreviewIds: [],
      });

      // Mock random to return alternating values for deterministic shuffling
      let callCount = 0;
      mockRandomFn.mockImplementation(() => {
        callCount++;
        return callCount % 2 === 0 ? 0.1 : 0.9; // Alternate low/high values
      });

      const { result } = renderHook(() => useTheaterViewModels(params));

      expect(result.current.theaterJobCards).toHaveLength(3);
      // Verify it's a subset of the 5 job slots
      const jobCardIds = result.current.theaterJobCards.map(card => card.id);
      expect(jobCardIds.length).toBe(3);
      expect(jobCardIds.every(id => jobSlots.some(slot => slot.slotId === id))).toBe(true);
    });

    it('returns empty array when no job slots exist', () => {
      const questSlot = createMockSlot({
        activity: {
          id: 'quest-activity',
          label: 'Quest Activity',
          durationFormula: '60',
          tags: ['quest'],
          slotTags: [],
          resolutionEngineId: 'system',
          metadata: {},
          rewards: [],
        },
      });
      const params = createMockParams({
        slots: [questSlot],
        theaterPreviewIds: [],
      });

      const { result } = renderHook(() => useTheaterViewModels(params));

      expect(result.current.theaterJobCards).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('handles empty theaterPreviewIds', () => {
      const params = createMockParams({
        theaterPreviewIds: [],
      });

      const { result } = renderHook(() => useTheaterViewModels(params));

      expect(result.current.theaterPreviewSlots).toEqual([]);
      expect(result.current.theaterPrimarySlot).toBeNull();
      expect(result.current.theaterVerbs).toEqual([]);
      expect(result.current.theaterSlotCards).toEqual([]);
    });

    it('handles slots without activities', () => {
      const slotWithoutActivity = {
        ...createMockSlot(),
        activity: undefined,
      } as unknown as ActivitySlotData;
      const params = createMockParams({
        slots: [slotWithoutActivity],
        theaterPreviewIds: ['test-slot-1'],
      });

      const { result } = renderHook(() => useTheaterViewModels(params));

      expect(result.current.theaterVerbs).toHaveLength(1);
      // Should not crash and provide fallback values
      const verb = result.current.theaterVerbs[0];
      expect(verb.label).toBe('Test Slot');
      expect(verb.totalDurationSeconds).toBe(0); // fallback when no activity
    });

    it('handles missing activity state', () => {
      const params = createMockParams();

      mockActivityScheduler.getActivityState.mockReturnValue(null);

      const { result } = renderHook(() => useTheaterViewModels(params));

      const verb = result.current.theaterVerbs[0];
      expect(verb.progressFraction).toBe(0);
      expect(verb.elapsedSeconds).toBe(0);
    });
  });
});
