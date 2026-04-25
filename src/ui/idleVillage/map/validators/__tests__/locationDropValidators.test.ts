import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deriveLocationDropState, type LocationDropValidationParams } from '@/ui/idleVillage/map/validators/locationDropValidators';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';

describe('deriveLocationDropState', () => {
  const mockScheduler = {
    canAssignResident: vi.fn(),
  };

  const mockSlot: ActivitySlotData = {
    slotId: 'test-slot',
    label: 'Test Slot',
    iconName: 'test-icon',
    assignedWorkerId: null,
    visualVariant: 'azure',
    activity: {
      id: 'test-activity',
      label: 'Test Activity',
      statRequirement: { allOf: ['strong'] },
      durationFormula: '10',
      rewards: [],
      tags: [],
      slotTags: [],
      resolutionEngineId: 'test-engine',
    },
  };

  const mockResident: ResidentState = {
    id: 'test-resident',
    displayName: 'Test Resident',
    fatigue: 0,
    status: 'available',
    statSnapshot: { hp: 100, damage: 10, agility: 10 },
    statTags: ['strong'],
    portraitUrl: '',
    currentHp: 100,
    maxHp: 100,
    isHero: false,
    isInjured: false,
    survivalCount: 0,
    survivalScore: 0,
  };

  const baseParams: LocationDropValidationParams = {
    residentId: null,
    slotIds: ['test-slot'],
    slots: { 'test-slot': mockSlot },
    slotAssignments: {},
    residents: { 'test-resident': mockResident },
    scheduler: mockScheduler,
    maxFatigueBeforeExhausted: 90,
    isDayPhase: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns locked when not day phase', () => {
    const params: LocationDropValidationParams = {
      ...baseParams,
      isDayPhase: false,
    };

    const result = deriveLocationDropState(params);
    expect(result).toBe('locked');
  });

  it('returns idle when no resident is being dragged', () => {
    const params: LocationDropValidationParams = {
      ...baseParams,
      residentId: null,
    };

    const result = deriveLocationDropState(params);
    expect(result).toBe('idle');
  });

  it('returns invalid when no slot IDs provided', () => {
    const params: LocationDropValidationParams = {
      ...baseParams,
      residentId: 'test-resident',
      slotIds: [],
    };

    const result = deriveLocationDropState(params);
    expect(result).toBe('invalid');
  });

  it('returns valid when resident can be assigned to at least one slot', () => {
    mockScheduler.canAssignResident.mockReturnValue(true);

    const params: LocationDropValidationParams = {
      ...baseParams,
      residentId: 'test-resident',
      slotIds: ['test-slot'],
    };

    const result = deriveLocationDropState(params);
    expect(result).toBe('valid');
  });

  it('returns invalid when resident cannot be assigned to any slot', () => {
    mockScheduler.canAssignResident.mockReturnValue(false);

    const params: LocationDropValidationParams = {
      ...baseParams,
      residentId: 'test-resident',
      slotIds: ['test-slot'],
    };

    const result = deriveLocationDropState(params);
    expect(result).toBe('invalid');
  });

  it('returns invalid when resident exceeds fatigue threshold', () => {
    const exhaustedResident: ResidentState = {
      ...mockResident,
      fatigue: 95, // Above threshold
    };

    const params: LocationDropValidationParams = {
      ...baseParams,
      residentId: 'test-resident',
      slotIds: ['test-slot'],
      residents: { 'test-resident': exhaustedResident },
    };

    const result = deriveLocationDropState(params);
    expect(result).toBe('invalid');
  });

  it('returns invalid when slot has reached crew capacity', () => {
    // Pre-assign residents to reach capacity
    const params: LocationDropValidationParams = {
      ...baseParams,
      residentId: 'test-resident',
      slotIds: ['test-slot'],
      slotAssignments: {
        'test-slot': 'existing-resident', // Assuming capacity is 1
      },
    };

    const result = deriveLocationDropState(params);
    expect(result).toBe('invalid');
  });

  it('returns invalid when resident lacks required stat tags', () => {
    const weakResident: ResidentState = {
      ...mockResident,
      statTags: [], // Lacks 'strong'
    };

    const params: LocationDropValidationParams = {
      ...baseParams,
      residentId: 'test-resident',
      slotIds: ['test-slot'],
      residents: { 'test-resident': weakResident },
    };

    const result = deriveLocationDropState(params);
    expect(result).toBe('invalid');
  });

  it('handles multiple slots correctly', () => {
    const slot2: ActivitySlotData = {
      ...mockSlot,
      slotId: 'test-slot-2',
    };

    mockScheduler.canAssignResident
      .mockReturnValueOnce(false) // First slot incompatible
      .mockReturnValueOnce(true); // Second slot compatible

    const params: LocationDropValidationParams = {
      ...baseParams,
      residentId: 'test-resident',
      slotIds: ['test-slot', 'test-slot-2'],
      slots: { 'test-slot': mockSlot, 'test-slot-2': slot2 },
    };

    const result = deriveLocationDropState(params);
    expect(result).toBe('valid'); // Should return valid if any slot is compatible
  });

  it('returns invalid when all slots are incompatible', () => {
    const slot2: ActivitySlotData = {
      ...mockSlot,
      slotId: 'test-slot-2',
    };

    mockScheduler.canAssignResident.mockReturnValue(false);

    const params: LocationDropValidationParams = {
      ...baseParams,
      residentId: 'test-resident',
      slotIds: ['test-slot', 'test-slot-2'],
      slots: { 'test-slot': mockSlot, 'test-slot-2': slot2 },
    };

    const result = deriveLocationDropState(params);
    expect(result).toBe('invalid');
  });
});
