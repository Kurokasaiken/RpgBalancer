import { describe, it, expect, vi } from 'vitest';
import type { ActivityDefinition, StatRequirement } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { computeDropStateForResident, validateResidentAssignment } from './residentSlotValidators';

const buildActivity = (overrides: Partial<ActivityDefinition> = {}): ActivityDefinition => ({
  id: 'activity_job',
  label: 'City Patrol',
  description: 'Keep the streets safe.',
  tags: ['job'],
  slotTags: ['city_job'],
  resolutionEngineId: 'job_engine',
  statRequirement: undefined,
  ...overrides,
});

const buildResident = (overrides: Partial<ResidentState> = {}): ResidentState => ({
  id: 'resident_a',
  displayName: 'Sofia',
  status: 'available',
  fatigue: 0,
  currentHp: 100,
  maxHp: 100,
  statTags: ['discipline', 'lantern'],
  isHero: false,
  isInjured: false,
  survivalCount: 0,
  survivalScore: 0,
  ...overrides,
});

const buildRequirement = (overrides: Partial<StatRequirement> = {}): StatRequirement => ({
  allOf: ['discipline'],
  ...overrides,
});

describe('validateResidentAssignment', () => {
  it('returns success when scheduler allows and requirements are met', () => {
    const activity = buildActivity({ statRequirement: buildRequirement() });
    const residents = { resident_a: buildResident() };
    const scheduler = { canAssignResident: vi.fn().mockReturnValue(true) };

    const result = validateResidentAssignment({
      residentId: 'resident_a',
      activity,
      scheduler,
      slotRequirement: undefined,
      residents,
    });

    expect(result).toEqual({ success: true });
    expect(scheduler.canAssignResident).toHaveBeenCalledWith('resident_a', activity.id);
  });

  it('fails when resident is missing', () => {
    const result = validateResidentAssignment({
      residentId: 'ghost',
      activity: buildActivity(),
      scheduler: undefined,
      slotRequirement: undefined,
      residents: {},
    });

    expect(result).toEqual({ success: false, reason: 'RESIDENT_NOT_FOUND' });
  });

  it('fails when scheduler rejects assignment', () => {
    const residents = { resident_a: buildResident() };
    const scheduler = { canAssignResident: vi.fn().mockReturnValue(false) };

    const result = validateResidentAssignment({
      residentId: 'resident_a',
      activity: buildActivity(),
      scheduler,
      slotRequirement: undefined,
      residents,
    });

    expect(result).toMatchObject({ success: false, reason: 'SCHEDULER_REJECTED' });
  });

  it('fails when stat requirements are not satisfied', () => {
    const residents = {
      resident_a: buildResident({ statTags: ['forge'] }),
    };

    const result = validateResidentAssignment({
      residentId: 'resident_a',
      activity: buildActivity(),
      scheduler: undefined,
      slotRequirement: buildRequirement(),
      residents,
    });

    expect(result).toMatchObject({ success: false, reason: 'VALIDATION_FAILED' });
  });
});

describe('computeDropStateForResident', () => {
  it('returns idle when no resident is being dragged', () => {
    const state = computeDropStateForResident(
      null,
      buildActivity(),
      undefined,
      undefined,
      { resident_a: buildResident() },
    );
    expect(state).toBe('idle');
  });

  it('returns valid for residents satisfying requirements', () => {
    const dropState = computeDropStateForResident(
      'resident_a',
      buildActivity({ statRequirement: buildRequirement() }),
      undefined,
      undefined,
      { resident_a: buildResident() },
    );
    expect(dropState).toBe('valid');
  });

  it('returns invalid when requirement validation fails', () => {
    const dropState = computeDropStateForResident(
      'resident_a',
      buildActivity(),
      undefined,
      buildRequirement(),
      { resident_a: buildResident({ statTags: ['moon'] }) },
    );

    expect(dropState).toBe('invalid');
  });
});
