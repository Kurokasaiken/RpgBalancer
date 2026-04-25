import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { useResidentSlotController, createResidentSlotTelemetryPayload } from './useResidentSlotController';

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

  it('fails assignment when no slot is provided', () => {
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
    expect(outcome.success).toBe(false);
    if (!outcome.success) {
      expect(outcome.reason).toBe('VALIDATION_FAILED');
      expect(outcome.details).toContain('Slot specifico richiesto');
    }
    expect(onAssign).not.toHaveBeenCalled();
  });

  it('assigns resident when slot id is specified', () => {
    const onAssign = vi.fn();
    const { result } = renderHook(() =>
      useResidentSlotController({
        activity: baseActivity,
        assignments: {},
        residents: residentsRecord,
        onAssign,
      }),
    );

    const slotId = result.current.slots[0].id;
    const outcome = result.current.assignResidentToSlot(resident.id, slotId);
    expect(outcome.success).toBe(true);
    if (outcome.success) {
      expect(outcome.slotId).toBe(slotId);
    }
    expect(onAssign).toHaveBeenCalledTimes(1);
    expect(onAssign).toHaveBeenCalledWith(slotId, resident.id);
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

    const slotId = result.current.slots[0].id;
    const outcome = result.current.assignResidentToSlot(resident.id, slotId);
    expect(outcome.success).toBe(false);
    if (!outcome.success) {
      expect(outcome.reason).toBe('SCHEDULER_REJECTED');
      expect(outcome.slotId).toBe(slotId);
    }
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
    expect(result.current.dropState).toBe('invalid');

    rerender({ hoveredResidentId: resident.id });
    expect(result.current.slots[0].dropState).toBe('valid');
    expect(result.current.dropState).toBe('valid');
    expect(result.current.getBloomState(result.current.slots[0].id)).toBe('valid');
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

  it('duplicates placeholders only for infinite slots', () => {
    const duplicateSpy = vi.fn();
    const { result: infiniteResult } = renderHook(() =>
      useResidentSlotController({
        activity: baseActivity,
        assignments: {},
        residents: residentsRecord,
        onDuplicatePlaceholder: duplicateSpy,
      }),
    );

    expect(infiniteResult.current.duplicatePlaceholder('any-slot')).toBe(true);
    expect(duplicateSpy).toHaveBeenCalledWith('any-slot');

    const finiteActivity: ActivityDefinition = { ...baseActivity, maxSlots: 2 };
    const { result: finiteResult } = renderHook(() =>
      useResidentSlotController({
        activity: finiteActivity,
        assignments: {},
        residents: residentsRecord,
        onDuplicatePlaceholder: duplicateSpy,
      }),
    );

    expect(finiteResult.current.duplicatePlaceholder('any-slot')).toBe(false);
  });

  it('reports slot fullness for finite activities', () => {
    const finiteActivity: ActivityDefinition = { ...baseActivity, maxSlots: 1 };
    const { result } = renderHook(() =>
      useResidentSlotController({
        activity: finiteActivity,
        assignments: { [`${finiteActivity.id}-slot-0`]: resident.id },
        residents: residentsRecord,
      }),
    );

    expect(result.current.isSlotFull()).toBe(true);
  });

  it('builds telemetry payload with helper', () => {
    const { result } = renderHook(() =>
      useResidentSlotController({
        activity: baseActivity,
        assignments: {},
        residents: residentsRecord,
      }),
    );

    const slot = result.current.slots[0];
    const payload = createResidentSlotTelemetryPayload(slot, baseActivity.id);
    expect(payload.activityId).toBe(baseActivity.id);
    expect(payload.slotId).toBe(slot.id);
    expect(payload.bloomState).toBe(slot.bloomState);
    expect(payload.tags).toContain(`activity:${baseActivity.id}`);
  });
});
