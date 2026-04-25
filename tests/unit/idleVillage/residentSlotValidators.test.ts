import { describe, it, expect, vi } from 'vitest';
import { validateResidentAssignment } from '@/ui/idleVillage/slots/residentSlotValidators';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivityDefinition, StatRequirement } from '@/balancing/config/idleVillage/types';

describe('residentSlotValidators', () => {
  const mockResident: ResidentState = {
    id: 'test-resident-1',
    displayName: 'Test Resident',
    status: 'available',
    fatigue: 10,
    currentHp: 100,
    maxHp: 100,
    isHero: false,
    isInjured: false,
    survivalCount: 0,
    survivalScore: 0,
    statTags: ['reason', 'scholar'],
  };

  const mockActivity: ActivityDefinition = {
    id: 'test-activity',
    label: 'Test Activity',
    description: 'Test activity description',
    tags: ['job', 'training'],
    slotTags: ['test_slot'],
    resolutionEngineId: 'job',
    level: 1,
    dangerRating: 1,
    durationFormula: '4',
    maxSlots: 1,
    supportsAutoRepeat: true,
    dailyFatigueCost: 10,
    statRequirement: {
      allOf: ['reason'],
      label: 'Reason Required',
    },
    costs: [],
    rewards: [],
  };

  const mockResidents: Record<string, ResidentState> = {
    [mockResident.id]: mockResident,
  };

  describe('validateResidentAssignment', () => {
    it('should validate resident with matching stat requirements', () => {
      const result = validateResidentAssignment({
        residentId: mockResident.id,
        activity: mockActivity,
        residents: mockResidents,
      });

      expect(result.success).toBe(true);
    });

    it('should reject when resident not found', () => {
      const result = validateResidentAssignment({
        residentId: 'non-existent',
        activity: mockActivity,
        residents: mockResidents,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('RESIDENT_NOT_FOUND');
      }
    });

    it('should reject when resident not available', () => {
      const unavailableResident: ResidentState = {
        ...mockResident,
        status: 'working',
      };

      const result = validateResidentAssignment({
        residentId: unavailableResident.id,
        activity: mockActivity,
        residents: { [unavailableResident.id]: unavailableResident },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('RESIDENT_UNAVAILABLE');
        expect(result.details).toBe('Resident is not available.');
      }
    });

    it('should reject when resident is too fatigued', () => {
      const fatiguedResident: ResidentState = {
        ...mockResident,
        fatigue: 90,
      };

      const result = validateResidentAssignment({
        residentId: fatiguedResident.id,
        activity: mockActivity,
        residents: { [fatiguedResident.id]: fatiguedResident },
        maxFatigueBeforeExhausted: 80,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('FATIGUE_THRESHOLD');
        expect(result.details).toBe('Fatigue 90/80');
      }
    });

    it('should reject when resident does not meet stat requirements', () => {
      const incompatibleResident: ResidentState = {
        ...mockResident,
        statTags: ['edge', 'striker'],
      };

      const result = validateResidentAssignment({
        residentId: incompatibleResident.id,
        activity: mockActivity,
        residents: { [incompatibleResident.id]: incompatibleResident },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('VALIDATION_FAILED');
        expect(result.details).toContain('Missing stat requirement');
        expect(result.validationDetails).toBeDefined();
        expect(result.validationDetails?.missingAllOf).toEqual(['reason']);
        expect(result.validationDetails?.anyOfMatched).toBe(true);
        expect(result.validationDetails?.requirementDescription).toBe('Reason Required');
      }
    });

    it('should handle complex stat requirements with allOf, anyOf, and noneOf', () => {
      const complexActivity: ActivityDefinition = {
        ...mockActivity,
        statRequirement: {
          allOf: ['reason'],
          anyOf: ['scholar', 'lantern'],
          noneOf: ['edge'],
          label: 'Complex Requirement',
        },
      };

      const compatibleResident: ResidentState = {
        ...mockResident,
        statTags: ['reason', 'scholar'],
      };

      const result = validateResidentAssignment({
        residentId: compatibleResident.id,
        activity: complexActivity,
        residents: { [compatibleResident.id]: compatibleResident },
      });

      expect(result.success).toBe(true);
    });

    it('should provide detailed failure information for complex requirements', () => {
      const complexActivity: ActivityDefinition = {
        ...mockActivity,
        statRequirement: {
          allOf: ['reason', 'discipline'],
          anyOf: ['scholar', 'lantern'],
          noneOf: ['edge'],
          label: 'Complex Requirement',
        },
      };

      const incompatibleResident: ResidentState = {
        ...mockResident,
        statTags: ['reason', 'edge'],
      };

      const result = validateResidentAssignment({
        residentId: incompatibleResident.id,
        activity: complexActivity,
        residents: { [incompatibleResident.id]: incompatibleResident },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('VALIDATION_FAILED');
        expect(result.validationDetails).toBeDefined();
        expect(result.validationDetails?.missingAllOf).toEqual(['discipline']);
        expect(result.validationDetails?.anyOfMatched).toBe(false);
        expect(result.validationDetails?.blockedBy).toEqual(['edge']);
        expect(result.validationDetails?.requirementDescription).toBe('Complex Requirement');
      }
    });

    it('should respect scheduler rejection', () => {
      const mockScheduler = {
        canAssignResident: vi.fn().mockReturnValue(false),
      };

      const result = validateResidentAssignment({
        residentId: mockResident.id,
        activity: mockActivity,
        scheduler: mockScheduler,
        residents: mockResidents,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('SCHEDULER_REJECTED');
        expect(result.details).toBe('Resident is not available or already assigned.');
      }
      expect(mockScheduler.canAssignResident).toHaveBeenCalledWith(mockResident.id, mockActivity.id);
    });

    it('should allow assignment when scheduler approves', () => {
      const mockScheduler = {
        canAssignResident: vi.fn().mockReturnValue(true),
      };

      const result = validateResidentAssignment({
        residentId: mockResident.id,
        activity: mockActivity,
        scheduler: mockScheduler,
        residents: mockResidents,
      });

      expect(result.success).toBe(true);
      expect(mockScheduler.canAssignResident).toHaveBeenCalledWith(mockResident.id, mockActivity.id);
    });

    it('should handle activities with no stat requirements', () => {
      const noRequirementActivity: ActivityDefinition = {
        ...mockActivity,
        statRequirement: undefined,
      };

      const result = validateResidentAssignment({
        residentId: mockResident.id,
        activity: noRequirementActivity,
        residents: mockResidents,
      });

      expect(result.success).toBe(true);
    });

    it('should use slotRequirement override when provided', () => {
      const slotRequirement: StatRequirement = {
        allOf: ['edge'],
        label: 'Slot Override',
      };

      const result = validateResidentAssignment({
        residentId: mockResident.id,
        activity: mockActivity,
        slotRequirement,
        residents: mockResidents,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('VALIDATION_FAILED');
        expect(result.validationDetails?.requirementDescription).toBe('Slot Override');
      }
    });
  });
});
