import { describe, it, expect } from 'vitest';
import { evaluateStatRequirement, getResidentStatTags } from '@/engine/game/idleVillage/statMatching';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { StatRequirement } from '@/balancing/config/idleVillage/types';

describe('statMatching', () => {
  describe('getResidentStatTags', () => {
    it('should return explicit statTags when available', () => {
      const resident: ResidentState = {
        id: 'test-1',
        displayName: 'Test Resident',
        status: 'available',
        fatigue: 0,
        currentHp: 100,
        maxHp: 100,
        isHero: false,
        isInjured: false,
        survivalCount: 0,
        survivalScore: 0,
        statTags: ['reason', 'scholar'],
      };

      const tags = getResidentStatTags(resident);
      expect(tags).toEqual(['reason', 'scholar']);
    });

    it('should fallback to statSnapshot when statTags not available', () => {
      const resident: ResidentState = {
        id: 'test-2',
        displayName: 'Test Resident',
        status: 'available',
        fatigue: 0,
        currentHp: 100,
        maxHp: 100,
        isHero: false,
        isInjured: false,
        survivalCount: 0,
        survivalScore: 0,
        statSnapshot: {
          hp: 100,
          reason: 50,
          discipline: 30,
        },
      };

      const tags = getResidentStatTags(resident);
      expect(tags).toEqual(['reason', 'discipline']);
    });

    it('should filter out zero or non-finite values from statSnapshot', () => {
      const resident: ResidentState = {
        id: 'test-3',
        displayName: 'Test Resident',
        status: 'available',
        fatigue: 0,
        currentHp: 100,
        maxHp: 100,
        isHero: false,
        isInjured: false,
        survivalCount: 0,
        survivalScore: 0,
        statSnapshot: {
          hp: 100,
          reason: 0,
          discipline: Infinity,
          edge: NaN,
          guard: -5,
        },
      };

      const tags = getResidentStatTags(resident);
      expect(tags).toEqual([]); // All values filtered out: hp excluded, others zero/invalid
    });

    it('should return empty array when no tags available', () => {
      const resident: ResidentState = {
        id: 'test-4',
        displayName: 'Test Resident',
        status: 'available',
        fatigue: 0,
        currentHp: 100,
        maxHp: 100,
        isHero: false,
        isInjured: false,
        survivalCount: 0,
        survivalScore: 0,
      };

      const tags = getResidentStatTags(resident);
      expect(tags).toEqual([]);
    });
  });

  describe('evaluateStatRequirement', () => {
    const residentWithTags: ResidentState = {
      id: 'test-resident',
      displayName: 'Test Resident',
      status: 'available',
      fatigue: 0,
      currentHp: 100,
      maxHp: 100,
      isHero: false,
      isInjured: false,
      survivalCount: 0,
      survivalScore: 0,
      statTags: ['reason', 'scholar', 'lantern'],
    };

    it('should match when no requirement specified', () => {
      const result = evaluateStatRequirement(residentWithTags, undefined);
      expect(result).toEqual({
        matches: true,
        missingAllOf: [],
        anyOfMatched: true,
        blockedBy: [],
      });
    });

    it('should match allOf requirements correctly', () => {
      const requirement: StatRequirement = {
        allOf: ['reason', 'scholar'],
      };

      const result = evaluateStatRequirement(residentWithTags, requirement);
      expect(result).toEqual({
        matches: true,
        missingAllOf: [],
        anyOfMatched: true,
        blockedBy: [],
      });
    });

    it('should fail when missing allOf requirements', () => {
      const requirement: StatRequirement = {
        allOf: ['reason', 'discipline'],
      };

      const result = evaluateStatRequirement(residentWithTags, requirement);
      expect(result).toEqual({
        matches: false,
        missingAllOf: ['discipline'],
        anyOfMatched: true,
        blockedBy: [],
      });
    });

    it('should match anyOf requirements correctly', () => {
      const requirement: StatRequirement = {
        anyOf: ['reason', 'discipline'],
      };

      const result = evaluateStatRequirement(residentWithTags, requirement);
      expect(result).toEqual({
        matches: true,
        missingAllOf: [],
        anyOfMatched: true,
        blockedBy: [],
      });
    });

    it('should fail when no anyOf requirements match', () => {
      const requirement: StatRequirement = {
        anyOf: ['discipline', 'edge'],
      };

      const result = evaluateStatRequirement(residentWithTags, requirement);
      expect(result).toEqual({
        matches: false,
        missingAllOf: [],
        anyOfMatched: false,
        blockedBy: [],
      });
    });

    it('should respect noneOf restrictions', () => {
      const requirement: StatRequirement = {
        noneOf: ['edge', 'punch_gym'],
      };

      const result = evaluateStatRequirement(residentWithTags, requirement);
      expect(result).toEqual({
        matches: true,
        missingAllOf: [],
        anyOfMatched: true,
        blockedBy: [],
      });
    });

    it('should fail when resident has noneOf tags', () => {
      const residentWithBlockedTags: ResidentState = {
        ...residentWithTags,
        statTags: ['reason', 'edge'],
      };

      const requirement: StatRequirement = {
        noneOf: ['edge', 'punch_gym'],
      };

      const result = evaluateStatRequirement(residentWithBlockedTags, requirement);
      expect(result).toEqual({
        matches: false,
        missingAllOf: [],
        anyOfMatched: true,
        blockedBy: ['edge'],
      });
    });

    it('should handle complex requirements with allOf, anyOf, and noneOf', () => {
      const requirement: StatRequirement = {
        allOf: ['reason'],
        anyOf: ['scholar', 'lantern'],
        noneOf: ['edge'],
      };

      const result = evaluateStatRequirement(residentWithTags, requirement);
      expect(result).toEqual({
        matches: true,
        missingAllOf: [],
        anyOfMatched: true,
        blockedBy: [],
      });
    });

    it('should fail complex requirements when any condition is not met', () => {
      const requirement: StatRequirement = {
        allOf: ['reason', 'discipline'],
        anyOf: ['scholar', 'lantern'],
        noneOf: ['lantern'],
      };

      const result = evaluateStatRequirement(residentWithTags, requirement);
      expect(result).toEqual({
        matches: false,
        missingAllOf: ['discipline'],
        anyOfMatched: true,
        blockedBy: ['lantern'],
      });
    });

    it('should handle empty arrays in requirements', () => {
      const requirement: StatRequirement = {
        allOf: [],
        anyOf: [],
        noneOf: [],
      };

      const result = evaluateStatRequirement(residentWithTags, requirement);
      expect(result).toEqual({
        matches: true,
        missingAllOf: [],
        anyOfMatched: true,
        blockedBy: [],
      });
    });

    it('should handle resident with no tags and complex requirements', () => {
      const residentWithoutTags: ResidentState = {
        id: 'test-empty',
        displayName: 'Empty Resident',
        status: 'available',
        fatigue: 0,
        currentHp: 100,
        maxHp: 100,
        isHero: false,
        isInjured: false,
        survivalCount: 0,
        survivalScore: 0,
      };

      const requirement: StatRequirement = {
        allOf: ['reason'],
        anyOf: ['scholar'],
        noneOf: ['edge'],
      };

      const result = evaluateStatRequirement(residentWithoutTags, requirement);
      expect(result).toEqual({
        matches: false,
        missingAllOf: ['reason'],
        anyOfMatched: false,
        blockedBy: [],
      });
    });
  });
});
