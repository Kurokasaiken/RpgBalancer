import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { useResidentSlotController } from './useResidentSlotController';

const baseActivity: ActivityDefinition = {
  id: 'job_training_basics',
  label: 'Basic Training',
  tags: ['job'],
  slotTags: [],
  resolutionEngineId: 'job',
  durationFormula: '2',
  maxSlots: 'infinite',
  statRequirement: {
    label: 'Edge Focus',
    allOf: ['edge'],
  },
};

const buildResident = (overrides: Partial<ResidentState> = {}): ResidentState => ({
  id: overrides.id ?? 'resident-1',
  status: overrides.status ?? 'available',
  fatigue: overrides.fatigue ?? 0,
  currentHp: overrides.currentHp ?? 100,
  maxHp: overrides.maxHp ?? 100,
  displayName: overrides.displayName ?? 'Hero',
  statTags: overrides.statTags ?? ['edge'],
  statSnapshot: overrides.statSnapshot,
  homeId: overrides.homeId,
  injuryRecoveryTime: overrides.injuryRecoveryTime,
  statProfileId: overrides.statProfileId,
  isHero: overrides.isHero ?? false,
  isInjured: overrides.isInjured ?? false,
  survivalCount: overrides.survivalCount ?? 0,
  survivalScore: overrides.survivalScore ?? 0,
});

describe('useResidentSlotController', () => {
  const resident = buildResident();
  const residentsRecord: Record<string, ResidentState> = { [resident.id]: resident };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('creates placeholder slots for infinite activities', () => {
    const { result } = renderHook(() =>
      useResidentSlotController({
        activity: baseActivity,
        assignments: {},
        residents: residentsRecord,
      }),
    );

    expect(result.current.slots).toHaveLength(1);
    expect(result.current.slots[0].isPlaceholder).toBe(true);
  });

  it('assigns resident automatically when no slot specified', () => {
    const onAssign = vi.fn();
    const { result } = renderHook(() =>
      useResidentSlotController({
        activity: baseActivity,
        assignments: {},
        residents: residentsRecord,
        onAssign,
      }),
    );

    const outcome = result.current.assignResidentToSlot(resident.id);
    expect(outcome.success).toBe(true);
    expect(onAssign).toHaveBeenCalledTimes(1);
    expect(onAssign).toHaveBeenCalledWith(expect.stringContaining(baseActivity.id), resident.id);
  });

  it('rejects assignment when scheduler validation fails', () => {
    const scheduler = {
      canAssignResident: () => false,
    } as const;
    const { result } = renderHook(() =>
      useResidentSlotController({
        activity: baseActivity,
        assignments: {},
        residents: residentsRecord,
        scheduler,
      }),
    );

    const outcome = result.current.assignResidentToSlot(resident.id);
    expect(outcome.success).toBe(false);
    expect(outcome.reason).toBe('VALIDATION_FAILED');
  });

  it('computes dropState based on hovered resident requirements', () => {
    const incompatibleResident = buildResident({ id: 'resident-2', statTags: ['lantern'] });
    const residents = {
      ...residentsRecord,
      [incompatibleResident.id]: incompatibleResident,
    };

    const { result, rerender } = renderHook(
      (props: { hoveredResidentId: string | null }) =>
        useResidentSlotController({
          activity: baseActivity,
          assignments: {},
          residents,
          hoveredResidentId: props.hoveredResidentId,
        }),
      {
        initialProps: { hoveredResidentId: incompatibleResident.id },
      },
    );

    expect(result.current.slots[0].dropState).toBe('invalid');

    rerender({ hoveredResidentId: resident.id });
    expect(result.current.slots[0].dropState).toBe('valid');
  });

  it('returns scheduler progress data when available', () => {
    const slotId = `${baseActivity.id}-slot-0`;
    const scheduler = {
      getActivityState: vi.fn().mockReturnValue({
        activityId: baseActivity.id,
        residentId: resident.id,
        startTime: Date.now(),
        duration: 30,
        elapsed: 15,
        progress: 0.5,
        status: 'running',
      }),
    } as const;

    const { result } = renderHook(() =>
      useResidentSlotController({
        activity: baseActivity,
        assignments: { [slotId]: resident.id },
        residents: residentsRecord,
        scheduler,
      }),
    );

    const progress = result.current.getSlotProgress(slotId);
    expect(progress).not.toBeNull();
    expect(progress?.ratio).toBeCloseTo(0.5, 5);
    expect(progress?.residentId).toBe(resident.id);
  });
});
